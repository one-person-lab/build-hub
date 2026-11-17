import { NextResponse } from "next/server";
import { getStarSnapshot } from "@/lib/github-stars";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/github-stars —— 服务端代拉 GitHub 星数；?refresh=1 可跳过缓存强制刷新 */
export async function GET(request: Request) {
  const force = new URL(request.url).searchParams.get("refresh") === "1";
  const snapshot = await getStarSnapshot(force);
  return NextResponse.json(snapshot, {
    headers: {
      "Cache-Control": force
        ? "no-store"
        : "public, max-age=60, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
