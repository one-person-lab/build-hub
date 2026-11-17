import { NextRequest, NextResponse } from "next/server";
import {
  WX_STATE_COOKIE,
  newWxState,
  safeNext,
  siteOrigin,
  wxAuthorizeUrl,
  wxEmbedUrl,
  wxLoginConfigured,
} from "@/lib/wxlogin";

export const dynamic = "force-dynamic";

function wxLang(req: NextRequest): "cn" | "en" {
  return req.nextUrl.searchParams.get("lang") === "en" ? "en" : "cn";
}

/** embed=1：把官方登录框的地址交回弹窗内嵌。否则整页跳去微信。state 都放进一次性 cookie */
export async function GET(req: NextRequest) {
  if (!wxLoginConfigured()) {
    return NextResponse.json({ error: "wx_login_not_configured" }, { status: 503 });
  }
  const origin = siteOrigin(req);
  const state = newWxState();
  const next = safeNext(req.nextUrl.searchParams.get("next"), origin);
  const lang = wxLang(req);
  const redirectUri = `${origin}/api/auth/wx/callback`;
  const embed = req.nextUrl.searchParams.get("embed") === "1";
  const res = embed
    ? NextResponse.json({ url: wxEmbedUrl(redirectUri, state, lang) })
    : NextResponse.redirect(wxAuthorizeUrl(redirectUri, state, lang));
  res.cookies.set(WX_STATE_COOKIE, `${state}|${encodeURIComponent(next)}`, {
    httpOnly: true,
    // 微信回跳是跨站顶层 GET，SameSite=strict 会让 cookie 不带过去，state 校验必挂
    sameSite: "lax",
    secure: origin.startsWith("https://"),
    path: "/api/auth/wx",
    maxAge: 600,
  });
  res.headers.set("Cache-Control", "no-store");
  return res;
}
