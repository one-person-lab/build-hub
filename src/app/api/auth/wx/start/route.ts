import { NextRequest, NextResponse } from "next/server";
import {
  WX_STATE_COOKIE,
  newWxState,
  safeNext,
  siteOrigin,
  wxAuthorizeUrl,
  wxLoginConfigured,
} from "@/lib/wxlogin";

export const dynamic = "force-dynamic";

/** 浏览器跳到微信的官方扫码页；state 和登录后要回的路径一起放进一次性 cookie */
export async function GET(req: NextRequest) {
  if (!wxLoginConfigured()) {
    return NextResponse.json({ error: "wx_login_not_configured" }, { status: 503 });
  }
  const origin = siteOrigin(req);
  const state = newWxState();
  const next = safeNext(req.nextUrl.searchParams.get("next"), origin);
  const res = NextResponse.redirect(
    wxAuthorizeUrl(`${origin}/api/auth/wx/callback`, state)
  );
  res.cookies.set(WX_STATE_COOKIE, `${state}|${encodeURIComponent(next)}`, {
    httpOnly: true,
    // 微信回跳是跨站顶层 GET，SameSite=strict 会让 cookie 不带过去，state 校验必挂
    sameSite: "lax",
    secure: origin.startsWith("https://"),
    path: "/api/auth/wx",
    maxAge: 600,
  });
  return res;
}
