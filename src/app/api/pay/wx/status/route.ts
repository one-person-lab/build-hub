import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { currentUser } from "@/lib/session";
import { settleOrder } from "@/lib/settle";
import { queryOrder, wxConfigured } from "@/lib/wxpay";

/** 前端轮询：回调可能比人慢，所以顺手主动查一次单并结算 */
export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const outTradeNo = new URL(req.url).searchParams.get("out_trade_no") ?? "";
  const order = getDb()
    .prepare(`select status from orders where out_trade_no = ? and user_id = ?`)
    .get(outTradeNo, user.id) as { status: string } | undefined;
  if (!order) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (order.status === "paid") return NextResponse.json({ paid: true });

  if (wxConfigured()) {
    try {
      const tx = await queryOrder(outTradeNo);
      if (tx.trade_state === "SUCCESS" && tx.amount) {
        const r = settleOrder({
          outTradeNo,
          tradeNo: tx.transaction_id ?? "",
          paidFen: tx.amount.total,
        });
        if (r.ok) return NextResponse.json({ paid: true });
      }
    } catch (err) {
      console.error("wx query failed:", err);
    }
  }
  return NextResponse.json({ paid: false });
}
