import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { currentUser, isPro } from "@/lib/session";

const MAX_FAVORITES = 2000;

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isPro(user)) return NextResponse.json({ error: "pro_required" }, { status: 403 });
  const rows = getDb()
    .prepare(`select slug from favorites where user_id = ?`)
    .all(user.id) as { slug: string }[];
  return NextResponse.json({ favorites: rows.map((r) => r.slug) });
}

export async function PUT(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isPro(user)) return NextResponse.json({ error: "pro_required" }, { status: 403 });
  const body = await req.json().catch(() => null);
  const list = body?.favorites;
  if (!Array.isArray(list) || list.some((s) => typeof s !== "string" || s.length > 120)) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const slugs = Array.from(new Set(list as string[])).slice(0, MAX_FAVORITES);
  const db = getDb();
  db.transaction(() => {
    db.prepare(`delete from favorites where user_id = ?`).run(user.id);
    const ins = db.prepare(
      `insert or ignore into favorites (user_id, slug) values (?, ?)`
    );
    for (const s of slugs) ins.run(user.id, s);
  })();
  return NextResponse.json({ ok: true, favorites: slugs });
}
