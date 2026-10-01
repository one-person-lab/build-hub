import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { mailConfigured, sendVerifyCodeMail } from "@/lib/mail";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_SECONDS = 60;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = String(body?.email || "")
    .trim()
    .toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }
  if (!mailConfigured()) {
    return NextResponse.json({ error: "mail_not_configured" }, { status: 503 });
  }

  const db = getDb();
  const row = db
    .prepare(
      `select last_sent_at from verify_codes where email = ?`
    )
    .get(email) as { last_sent_at: string } | undefined;
  if (
    row &&
    Date.now() -
      new Date(row.last_sent_at.replace(" ", "T") + "Z").getTime() <
      RESEND_SECONDS * 1000
  ) {
    return NextResponse.json({ error: "too_fast" }, { status: 429 });
  }

  const code = String(crypto.randomInt(100000, 1000000));
  const codeHash = crypto.createHash("sha256").update(code).digest("hex");
  db.prepare(
    `insert into verify_codes (email, code_hash, expires_at, attempts, last_sent_at)
     values (?, ?, datetime('now', '+10 minutes'), 0, datetime('now'))
     on conflict(email) do update set
       code_hash = excluded.code_hash,
       expires_at = excluded.expires_at,
       attempts = 0,
       last_sent_at = excluded.last_sent_at`
  ).run(email, codeHash);

  try {
    await sendVerifyCodeMail(email, code);
  } catch (err) {
    console.error("verify code mail failed:", err);
    return NextResponse.json({ error: "mail_send_failed" }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
