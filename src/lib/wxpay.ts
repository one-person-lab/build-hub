import crypto from "node:crypto";
import fs from "node:fs";

const HOST = "https://api.mch.weixin.qq.com";
/** 微信要求请求时间戳与服务器时间偏差在 5 分钟内 */
const SKEW_MS = 5 * 60 * 1000;

export function wxConfigured(): boolean {
  const { WXPAY_MCHID, WXPAY_APIV3_KEY, WXPAY_SERIAL_NO, WXPAY_KEY_PATH } = process.env;
  return !!(
    WXPAY_MCHID &&
    WXPAY_APIV3_KEY &&
    WXPAY_SERIAL_NO &&
    WXPAY_KEY_PATH &&
    fs.existsSync(WXPAY_KEY_PATH)
  );
}

function privateKey(): string {
  return fs.readFileSync(process.env.WXPAY_KEY_PATH!, "utf8");
}

export function authorization(method: string, path: string, body: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const nonceStr = crypto.randomBytes(16).toString("hex").toUpperCase();
  const message = `${method}\n${path}\n${timestamp}\n${nonceStr}\n${body}\n`;
  const signature = crypto
    .sign("sha256", Buffer.from(message, "utf8"), privateKey())
    .toString("base64");
  return (
    `WECHATPAY2-SHA256-RSA2048 mchid="${process.env.WXPAY_MCHID}",` +
    `nonce_str="${nonceStr}",signature="${signature}",` +
    `timestamp="${timestamp}",serial_no="${process.env.WXPAY_SERIAL_NO}"`
  );
}

async function call<T = Record<string, unknown>>(
  method: "GET" | "POST",
  path: string,
  payload?: unknown
): Promise<T> {
  const body = method === "GET" ? "" : JSON.stringify(payload ?? {});
  const res = await fetch(HOST + path, {
    method,
    body: body || undefined,
    headers: {
      Authorization: authorization(method, path, body),
      Accept: "application/json",
      "Accept-Language": "zh-CN",
      "Content-Type": "application/json",
      "User-Agent": "buildhub-pro",
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`wxpay ${res.status} ${text.slice(0, 300)}`);
  return text ? (JSON.parse(text) as T) : ({} as T);
}

/** APIv3 回调解密：密文末尾 16 字节是 GCM authTag */
export function decryptResource(res: {
  ciphertext: string;
  nonce: string;
  associated_data?: string;
}): string {
  const key = Buffer.from(process.env.WXPAY_APIV3_KEY!, "utf8");
  const raw = Buffer.from(res.ciphertext, "base64");
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(res.nonce, "utf8")
  );
  decipher.setAuthTag(raw.subarray(raw.length - 16));
  decipher.setAAD(Buffer.from(res.associated_data ?? "", "utf8"));
  return Buffer.concat([decipher.update(raw.subarray(0, raw.length - 16)), decipher.final()]).toString(
    "utf8"
  );
}

let certCache: { map: Map<string, string>; until: number } | null = null;

async function platformCerts(): Promise<Map<string, string>> {
  if (certCache && Date.now() < certCache.until) return certCache.map;
  const r = await call<{ data: { serial_no: string; encrypt_certificate: { ciphertext: string; nonce: string; associated_data?: string } }[] }>(
    "GET",
    "/v3/certificates"
  );
  const map = new Map<string, string>();
  for (const c of r.data ?? []) {
    map.set(
      c.serial_no,
      decryptResource({
        ciphertext: c.encrypt_certificate.ciphertext,
        nonce: c.encrypt_certificate.nonce,
        associated_data: c.encrypt_certificate.associated_data,
      })
    );
  }
  certCache = { map, until: Date.now() + 12 * 3600 * 1000 };
  return map;
}

/** 验微信支付身份：序列号形如 PUB_KEY_ID_* 用商户自传的微信支付公钥，否则用平台证书 */
export async function verifyNotify(headers: Headers, rawBody: string): Promise<boolean> {
  const serial = headers.get("wechatpay-serial") ?? "";
  const signature = headers.get("wechatpay-signature") ?? "";
  const timestamp = headers.get("wechatpay-timestamp") ?? "";
  const nonce = headers.get("wechatpay-nonce") ?? "";
  if (!serial || !signature || !timestamp || !nonce) return false;
  if (Math.abs(Date.now() - Number(timestamp) * 1000) > SKEW_MS) return false;

  let publicKey: string | undefined;
  if (serial.startsWith("PUB_KEY_ID_")) {
    const p = process.env.WXPAY_PUBLIC_KEY_PATH;
    if (!p || !fs.existsSync(p)) return false;
    publicKey = fs.readFileSync(p, "utf8");
  } else {
    try {
      publicKey = (await platformCerts()).get(serial);
    } catch (err) {
      // 下载平台证书失败时按验签失败处理，让微信按重试策略重推
      console.error("platform cert fetch failed:", err);
      return false;
    }
  }
  if (!publicKey) return false;

  return crypto
    .createVerify("RSA-SHA256")
    .update(`${timestamp}\n${nonce}\n${rawBody}\n`, "utf8")
    .verify(publicKey, Buffer.from(signature, "base64"));
}

export async function nativeOrder(o: {
  outTradeNo: string;
  description: string;
  totalFen: number;
}): Promise<string> {
  const appid = process.env.WXPAY_APPID;
  const r = await call<{ code_url: string }>("POST", "/v3/pay/transactions/native", {
    ...(appid ? { appid } : {}),
    mchid: process.env.WXPAY_MCHID,
    description: o.description.slice(0, 127),
    out_trade_no: o.outTradeNo,
    notify_url: `${process.env.APP_URL}/api/pay/wx/notify`,
    amount: { total: o.totalFen, currency: "CNY" },
  });
  return r.code_url;
}

export type WxTransaction = {
  trade_state: "SUCCESS" | "REFUND" | "NOTPAY" | "CLOSED" | "REVOKED" | "USERPAYING" | "PAYERROR";
  transaction_id?: string;
  amount?: { total: number };
};

export function queryOrder(outTradeNo: string): Promise<WxTransaction> {
  const path = `/v3/pay/transactions/out-trade-no/${encodeURIComponent(outTradeNo)}?mchid=${process.env.WXPAY_MCHID}`;
  return call<WxTransaction>("GET", path);
}

export function yuanToFen(money: string): number {
  return Math.round(Number(money) * 100);
}
