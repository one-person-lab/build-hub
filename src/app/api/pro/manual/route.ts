import { NextResponse } from "next/server";
import { currentUser } from "@/lib/session";
import { isOwner } from "@/lib/plans";
import { listOpenManualOrders, settleManualOrder } from "@/lib/settle";

/** 白名单专用：手机上人工转微信的单，在这里逐笔核销 */
export async function GET() {
  const user = await currentUser();
  if (!user || !isOwner(user.email))
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ orders: listOpenManualOrders() });
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user || !isOwner(user.email))
    return NextResponse.json({ error: "not_found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const outTradeNo = String(body?.out_trade_no || "");
  if (!/^\d{6,}$/.test(outTradeNo))
    return NextResponse.json({ error: "invalid_order" }, { status: 400 });

  const r = settleManualOrder(outTradeNo);
  if (!r.ok)
    return NextResponse.json({ error: r.reason }, { status: r.reason === "order_not_found" ? 404 : 400 });
  return NextResponse.json({ ok: true });
}
