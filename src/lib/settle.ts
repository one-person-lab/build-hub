import { getDb } from "./db";
import { getPlan, planDays } from "./plans";
import { yuanToFen } from "./wxpay";

export function newOutTradeNo(): string {
  return (
    String(Date.now()) + String(Math.floor(Math.random() * 1e6)).padStart(6, "0")
  );
}

export function createOrder(input: {
  outTradeNo: string;
  userId: number;
  plan: string;
  name: string;
  money: string;
}): void {
  getDb()
    .prepare(
      `insert into orders (out_trade_no, user_id, plan, name, money) values (?, ?, ?, ?, ?)`
    )
    .run(input.outTradeNo, input.userId, input.plan, input.name, input.money);
}

export type SettleResult =
  | { ok: true }
  | { ok: false; reason: "order_not_found" | "amount_mismatch" | "unknown_plan" };

/** 两个支付渠道共用的到账写入：金额校验 + pending→paid 单次翻转，重复通知不会重复续期 */
export function settleOrder(input: {
  outTradeNo: string;
  tradeNo: string;
  paidFen: number;
}): SettleResult {
  const db = getDb();
  const order = db
    .prepare(`select out_trade_no, user_id, plan, money from orders where out_trade_no = ?`)
    .get(input.outTradeNo) as
    | { out_trade_no: string; user_id: number; plan: string; money: string }
    | undefined;
  if (!order) return { ok: false, reason: "order_not_found" };
  if (yuanToFen(order.money) !== input.paidFen) return { ok: false, reason: "amount_mismatch" };
  const plan = getPlan(order.plan);
  if (!plan) return { ok: false, reason: "unknown_plan" };

  db.transaction(() => {
    const upd = db
      .prepare(
        `update orders set status = 'paid', trade_no = ?, paid_at = datetime('now')
         where out_trade_no = ? and status = 'pending'`
      )
      .run(input.tradeNo, order.out_trade_no);
    if (upd.changes === 0) return;
    db.prepare(
      `update users set pro_until = datetime(
         max(
           coalesce(pro_until, datetime('now')),
           datetime('now')
         ),
         '+' || ? || ' days'
       ) where id = ?`
    ).run(planDays(plan), order.user_id);
  }).immediate();

  return { ok: true };
}

export function isPaid(outTradeNo: string): boolean {
  const row = getDb()
    .prepare(`select 1 from orders where out_trade_no = ? and status = 'paid'`)
    .get(outTradeNo);
  return !!row;
}
