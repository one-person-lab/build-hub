import { NextResponse } from "next/server";
import { getDb, nowIso } from "@/lib/db";
import { currentUser, isPro } from "@/lib/session";

const MAX_BODY = 2000;

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isPro(user)) return NextResponse.json({ error: "pro_required" }, { status: 403 });
  const rows = getDb()
    .prepare(`select slug, body from notes where user_id = ?`)
    .all(user.id) as { slug: string; body: string }[];
  return NextResponse.json({ notes: Object.fromEntries(rows.map((r) => [r.slug, r.body])) });
}

export async function PUT(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isPro(user)) return NextResponse.json({ error: "pro_required" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const slug = typeof body?.slug === "string" ? body.slug : "";
  const text = typeof body?.body === "string" ? body.body.trim() : null;
  if (!slug || slug.length > 120) return NextResponse.json({ error: "invalid_slug" }, { status: 400 });
  if (text === null || text.length > MAX_BODY)
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const db = getDb();
  if (!text) {
    db.prepare(`delete from notes where user_id = ? and slug = ?`).run(user.id, slug);
    return NextResponse.json({ slug, body: "" });
  }
  db.prepare(
    `insert into notes (user_id, slug, body, updated_at) values (?, ?, ?, ?)
     on conflict(user_id, slug) do update set body = excluded.body, updated_at = excluded.updated_at`
  ).run(user.id, slug, text, nowIso());
  return NextResponse.json({ slug, body: text });
}
