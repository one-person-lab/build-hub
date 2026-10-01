import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { createSession } from "@/lib/session";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_ATTEMPTS = 5;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = String(body?.email || "")
    .trim()
    .toLowerCase();
  const code = String(body?.code || "").trim();
  if (!EMAIL_RE.test(email) || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const db = getDb();
  const row = db
    .prepare(
      `select code_hash, expires_at, attempts from verify_codes where email = ?`
    )
    .get(email) as
    | { code_hash: string; expires_at: string; attempts: number }
    | undefined;
  if (!row) {
    return NextResponse.json({ error: "code_not_found" }, { status: 400 });
  }
  const valid =
    new Date(row.expires_at.replace(" ", "T") + "Z").getTime() > Date.now();
  const hash = crypto.createHash("sha256").update(code).digest("hex");
  if (!valid || hash !== row.code_hash) {
    if (valid) {
      db.prepare(
        `update verify_codes set attempts = attempts + 1 where email = ?`
      ).run(email);
      if (row.attempts + 1 >= MAX_ATTEMPTS) {
        db.prepare(`delete from verify_codes where email = ?`).run(email);
      }
    }
    return NextResponse.json({ error: "code_invalid" }, { status: 400 });
  }

  db.prepare(`delete from verify_codes where email = ?`).run(email);
  let user = db
    .prepare(`select id from users where email = ?`)
    .get(email) as { id: number } | undefined;
  if (!user) {
    user = db
      .prepare(`insert into users (email) values (?) returning id as id`)
      .get(email) as { id: number };
  }
  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
