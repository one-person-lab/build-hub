import { NextResponse } from "next/server";
import { currentUser } from "@/lib/session";
import { isOwner } from "@/lib/plans";
import { revokeTestOrder } from "@/lib/settle";

/** 白名单专用：撤销验证单给的那几天 PRO，好让同一条支付链路反复验 */
export async function POST() {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!isOwner(user.email)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const r = revokeTestOrder(user.id);
  if (!r.ok) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, days: r.days });
}
