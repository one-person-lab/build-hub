import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, issueSession, sessionCookieOptions } from "@/lib/session";
import {
  GH_STATE_COOKIE,
  ghLoginConfigured,
  ghProfileByCode,
  safeNext,
  siteOrigin,
  upsertGhUser,
} from "@/lib/ghlogin";

export const dynamic = "force-dynamic";

function readCookie(raw: string | undefined) {
  const sep = (raw ?? "").indexOf("|");
  if (sep <= 0) return null;
  let next = "/";
  try {
    next = decodeURIComponent(raw!.slice(sep + 1));
  } catch {
    /* 路径被改坏就回首页 */
  }
  return { state: raw!.slice(0, sep), next };
}

function landed(origin: string, next: string, failed: boolean) {
  const url = failed
    ? new URL("/signin-failed", origin)
    : new URL(next, origin);
  if (failed) {
    url.searchParams.set("next", next);
    url.searchParams.set("via", "github");
  }
  const res = NextResponse.redirect(url);
  res.cookies.set(GH_STATE_COOKIE, "", { path: "/api/auth/github", maxAge: 0 });
  return res;
}

export async function GET(req: NextRequest) {
  if (!ghLoginConfigured()) {
    return NextResponse.json({ error: "github_login_not_configured" }, { status: 503 });
  }
  const origin = siteOrigin(req);
  const held = readCookie(req.cookies.get(GH_STATE_COOKIE)?.value);
  const next = safeNext(held?.next ?? null, origin);
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");

  if (!held || !code || !state || state !== held.state) {
    return landed(origin, next, true);
  }

  try {
    const userId = upsertGhUser(await ghProfileByCode(code));
    const res = landed(origin, next, false);
    res.cookies.set(SESSION_COOKIE, issueSession(userId), sessionCookieOptions());
    return res;
  } catch (err) {
    console.error("github login failed:", err instanceof Error ? err.message : err);
    return landed(origin, next, true);
  }
}
