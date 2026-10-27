import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { currentUser } from "@/lib/session";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const rows = getDb()
    .prepare(
      `select plan, name, money, status, paid_at from orders
       where user_id = ? and status in ('paid', 'revoked')
       order by coalesce(paid_at, created_at) desc
       limit 30`
    )
    .all(user.id) as { plan: string; name: string; money: string; status: string; paid_at: string | null }[];
  return NextResponse.json({
    orders: rows.map((r) => ({ ...r, date: (r.paid_at ?? "").slice(0, 10) })),
  });
}
