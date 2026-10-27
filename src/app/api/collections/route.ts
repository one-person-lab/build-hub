import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getDb, nowIso } from "@/lib/db";
import { currentUser, isPro } from "@/lib/session";

const MAX_COLLECTIONS = 20;
const MAX_ITEMS = 2000;

type Row = { id: string; name: string; slugs: string; created_at: string; updated_at: string };

function parseSlugs(raw: string): string[] {
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list.filter((s) => typeof s === "string") : [];
  } catch {
    return [];
  }
}

function cleanSlugs(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const list = value.filter(
    (s): s is string => typeof s === "string" && s.length > 0 && s.length <= 120
  );
  if (list.length !== value.length) return null;
  return Array.from(new Set(list)).slice(0, MAX_ITEMS);
}

function cleanName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const name = value.trim();
  if (!name || name.length > 40) return null;
  return name;
}

function brief(rows: Row[]) {
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    slugs: parseSlugs(r.slugs),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isPro(user)) return NextResponse.json({ error: "pro_required" }, { status: 403 });
  const rows = getDb()
    .prepare(`select id, name, slugs, created_at, updated_at from collections where user_id = ? order by created_at`)
    .all(user.id) as Row[];
  return NextResponse.json({ collections: brief(rows) });
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isPro(user)) return NextResponse.json({ error: "pro_required" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const name = cleanName(body?.name);
  if (!name) return NextResponse.json({ error: "invalid_name" }, { status: 400 });

  const db = getDb();
  const count = (
    db.prepare(`select count(*) as n from collections where user_id = ?`).get(user.id) as {
      n: number;
    }
  ).n;
  if (count >= MAX_COLLECTIONS)
    return NextResponse.json({ error: "too_many" }, { status: 400 });

  const id = crypto.randomUUID();
  db.prepare(
    `insert into collections (id, user_id, name, slugs, created_at, updated_at) values (?, ?, ?, '[]', ?, ?)`
  ).run(id, user.id, name, nowIso(), nowIso());
  return NextResponse.json({ id, name, slugs: [] });
}

export async function PUT(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isPro(user)) return NextResponse.json({ error: "pro_required" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : "";
  if (!id) return NextResponse.json({ error: "invalid_id" }, { status: 400 });

  const db = getDb();
  const row = db
    .prepare(`select id, name, slugs from collections where id = ? and user_id = ?`)
    .get(id, user.id) as Row | undefined;
  if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const name = body?.name === undefined ? row.name : cleanName(body.name);
  if (!name) return NextResponse.json({ error: "invalid_name" }, { status: 400 });

  const slugs =
    body?.slugs === undefined ? parseSlugs(row.slugs) : cleanSlugs(body.slugs);
  if (!slugs) return NextResponse.json({ error: "invalid_slugs" }, { status: 400 });

  db.prepare(`update collections set name = ?, slugs = ?, updated_at = ? where id = ?`)
    .run(name, JSON.stringify(slugs), nowIso(), id);
  return NextResponse.json({ id, name, slugs });
}

export async function DELETE(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isPro(user)) return NextResponse.json({ error: "pro_required" }, { status: 403 });

  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (!id) return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  const info = getDb()
    .prepare(`delete from collections where id = ? and user_id = ?`)
    .run(id, user.id);
  if (!info.changes) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
