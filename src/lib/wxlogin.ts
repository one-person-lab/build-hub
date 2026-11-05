import crypto from "node:crypto";
import { getDb } from "./db";

const OPEN_HOST = "https://open.weixin.qq.com";
const API_HOST = "https://api.weixin.qq.com";

/** 一次性 state，兼当登录后跳回路径的载体；callback 用完即删 */
export const WX_STATE_COOKIE = "bh_wx_state";

/** 网站应用扫码登录要用开放平台的 AppID/AppSecret，和微信支付那套凭据不通用 */
export function wxLoginConfigured(): boolean {
  return !!(process.env.WX_APPID && process.env.WX_SECRET);
}

export function newWxState(): string {
  return crypto.randomBytes(16).toString("hex");
}

/** 线上以 APP_URL 为准，本地回落到请求自身，redirect_uri 必须落在开放平台填的授权回调域内 */
export function siteOrigin(req: Request): string {
  const env = process.env.APP_URL;
  if (env) return env.replace(/\/+$/, "");
  return new URL(req.url).origin;
}

/** 只认站内路径：//host、\/host 这类写法会被 WHATWG URL 解析成外站，用 origin 比对一次就挡住 */
export function safeNext(path: string | null, origin: string): string {
  if (!path) return "/";
  try {
    const u = new URL(path, origin);
    if (u.origin !== origin) return "/";
    return `${u.pathname}${u.search}${u.hash}`;
  } catch {
    return "/";
  }
}

export function wxAuthorizeUrl(redirectUri: string, state: string): string {
  const q = new URLSearchParams({
    appid: process.env.WX_APPID!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "snsapi_login",
    state,
  });
  return `${OPEN_HOST}/connect/qrconnect?${q.toString()}#wechat_redirect`;
}

export type WxProfile = {
  openid: string;
  unionid: string | null;
  nickname: string | null;
};

type WxError = { errcode?: number; errmsg?: string };

async function wxGet<T extends object>(url: string): Promise<T> {
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  const data = (await res.json()) as T & WxError;
  /* 微信把错误也放在 200 的 body 里，只看 status 会把失败当成功 */
  if (data.errcode) throw new Error(`wechat_oauth_${data.errcode}`);
  return data;
}

export async function wxProfileByCode(code: string): Promise<WxProfile> {
  const token = await wxGet<{ access_token: string; openid: string; unionid?: string }>(
    `${API_HOST}/sns/oauth2/access_token?` +
      new URLSearchParams({
        appid: process.env.WX_APPID!,
        secret: process.env.WX_SECRET!,
        code,
        grant_type: "authorization_code",
      })
  );
  const info = await wxGet<{ nickname?: string; unionid?: string }>(
    `${API_HOST}/sns/userinfo?` +
      new URLSearchParams({
        access_token: token.access_token,
        openid: token.openid,
        lang: "zh_CN",
      })
  );
  return {
    openid: token.openid,
    unionid: info.unionid ?? token.unionid ?? null,
    nickname: info.nickname ?? null,
  };
}

/** 同一个人在同一开放平台账号下的各应用只留一个账号 */
export function upsertWxUser(p: WxProfile): number {
  const db = getDb();
  const byOpenid = db
    .prepare(`select id from users where wx_openid = ?`)
    .get(p.openid) as { id: number } | undefined;
  if (byOpenid) {
    db.prepare(
      `update users
       set wx_nickname = coalesce(?, wx_nickname),
           wx_unionid = coalesce(?, wx_unionid)
       where id = ?`
    ).run(p.nickname, p.unionid, byOpenid.id);
    return byOpenid.id;
  }
  if (p.unionid) {
    const byUnionid = db
      .prepare(`select id from users where wx_unionid = ? and wx_openid is null`)
      .get(p.unionid) as { id: number } | undefined;
    if (byUnionid) {
      db.prepare(`update users set wx_openid = ?, wx_nickname = coalesce(?, wx_nickname) where id = ?`).run(
        p.openid,
        p.nickname,
        byUnionid.id
      );
      return byUnionid.id;
    }
  }
  const row = db
    .prepare(
      `insert into users (email, wx_openid, wx_unionid, wx_nickname)
       values (null, ?, ?, ?) returning id`
    )
    .get(p.openid, p.unionid, p.nickname) as { id: number };
  return row.id;
}
