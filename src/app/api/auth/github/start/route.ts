import { NextRequest, NextResponse } from "next/server";
import {
  GH_STATE_COOKIE,
  ghAuthorizeUrl,
  ghLoginConfigured,
  newGhState,
  safeNext,
  siteOrigin,
} from "@/lib/ghlogin";

export const dynamic = "force-dynamic";

/** 整页跳去 GitHub 授权；state 放一次性 cookie，callback 校验后清掉 */
export async function GET(req: NextRequest) {
  if (!ghLoginConfigured()) {
    return NextResponse.json({ error: "github_login_not_configured" }, { status: 503 });
  }
  const origin = siteOrigin(req);
  const state = newGhState();
  const next = safeNext(req.nextUrl.searchParams.get("next"), origin);
  const redirectUri = `${origin}/api/auth/github/callback`;
  const res = NextResponse.redirect(ghAuthorizeUrl(redirectUri, state));
  res.cookies.set(GH_STATE_COOKIE, `${state}|${encodeURIComponent(next)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: origin.startsWith("https://"),
    path: "/api/auth/github",
    maxAge: 600,
  });
  res.headers.set("Cache-Control", "no-store");
  return res;
}
