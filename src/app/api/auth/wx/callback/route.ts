import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, issueSession, sessionCookieOptions } from "@/lib/session";
import {
  WX_STATE_COOKIE,
  safeNext,
  siteOrigin,
  upsertWxUser,
  wxLoginConfigured,
  wxProfileByCode,
} from "@/lib/wxlogin";

export const dynamic = "force-dynamic";

function readCookie(raw: string | undefined) {
  const sep = (raw ?? "").indexOf("|");
  if (sep <= 0) return null;
  let next = "/";
  try {
    next = decodeURIComponent(raw!.slice(sep + 1));
  } catch {
    /* 路径被改坏就回首页，不影响 state 校验 */
  }
  return { state: raw!.slice(0, sep), next };
}

/** 成功回到原来那一页；没成则落到 /signin-failed，让页面把下一步摆出来 */
function landed(origin: string, next: string, failed: boolean) {
  const url = failed
    ? new URL("/signin-failed", origin)
    : new URL(next, origin);
  if (failed) url.searchParams.set("next", next);
  const res = NextResponse.redirect(url);
  res.cookies.set(WX_STATE_COOKIE, "", { path: "/api/auth/wx", maxAge: 0 });
  return res;
}

export async function GET(req: NextRequest) {
  if (!wxLoginConfigured()) {
    return NextResponse.json({ error: "wx_login_not_configured" }, { status: 503 });
  }
  const origin = siteOrigin(req);
  const held = readCookie(req.cookies.get(WX_STATE_COOKIE)?.value);
  const next = safeNext(held?.next ?? null, origin);
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");

  if (!held || !code || !state || state !== held.state) {
    return landed(origin, next, true);
  }

  try {
    const userId = upsertWxUser(await wxProfileByCode(code));
    const res = landed(origin, next, false);
    res.cookies.set(SESSION_COOKIE, issueSession(userId), sessionCookieOptions());
    return res;
  } catch (err) {
    // 微信侧只回 errcode，凭据一个字都不进日志
    console.error("wechat login failed:", err instanceof Error ? err.message : err);
    return landed(origin, next, true);
  }
}
