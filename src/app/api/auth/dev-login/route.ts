import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ownerEmail } from "@/lib/plans";
import { createSession } from "@/lib/session";

export const dynamic = "force-dynamic";

/** 仅开发环境：跳过邮件 / OAuth，直接以白名单邮箱建会话，方便本地测支付 */
export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const email = ownerEmail();
  const db = getDb();
  let user = db
    .prepare(`select id from users where email = ?`)
    .get(email) as { id: number } | undefined;
  if (!user) {
    user = db
      .prepare(`insert into users (email) values (?) returning id as id`)
      .get(email) as { id: number };
  }
  await createSession(user.id);
  return NextResponse.json({ ok: true, email });
}
