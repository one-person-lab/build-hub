import crypto from "node:crypto";

export const ZPAY_GATEWAY = process.env.ZPAY_GATEWAY || "https://zpayz.cn/";
export const ZPAY_PID = process.env.ZPAY_PID || "";

const KEY = () => process.env.ZPAY_KEY || "";

export type EpayParams = Record<string, string>;

/** 易支付 MD5 签名：按参数名 ASCII 升序拼接 k=v&...，再拼 KEY 取 md5 小写；sign/sign_type/空值不参与 */
export function epaySign(params: EpayParams, key = KEY()): string {
  const str = Object.keys(params)
    .filter((k) => k !== "sign" && k !== "sign_type" && params[k] !== "")
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return crypto.createHash("md5").update(str + key, "utf8").digest("hex");
}

export function epayVerify(params: EpayParams, key = KEY()): boolean {
  const sign = params.sign ?? "";
  if (!sign) return false;
  return epaySign(params, key) === sign;
}

export function buildSubmitParams(
  order: { name: string; money: string; out_trade_no: string },
  baseUrl: string,
  type: "alipay" | "wxpay"
): EpayParams {
  const params: EpayParams = {
    pid: ZPAY_PID,
    type,
    name: order.name,
    money: order.money,
    notify_url: `${baseUrl}/api/pay/notify`,
    return_url: `${baseUrl}/api/pay/return`,
    out_trade_no: order.out_trade_no,
    param: order.out_trade_no,
    sign_type: "MD5",
  };
  params.sign = epaySign(params);
  return params;
}
