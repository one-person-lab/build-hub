import { NextResponse } from "next/server";
import { copyQuota, recordCopy } from "@/lib/copies";
import { currentUser } from "@/lib/session";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json({ quota: copyQuota(user.id) });
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const source = typeof body?.source === "string" ? body.source : "";

  const quota = recordCopy(user.id, source);
  if (!quota.ok)
    return NextResponse.json({ error: "quota", quota }, { status: 403 });

  return NextResponse.json({ ok: true, quota });
}
