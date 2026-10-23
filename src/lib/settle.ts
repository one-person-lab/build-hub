import { getDb } from "./db";
import { TEST_PLAN, getPlan, planDays } from "./plans";
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

/**
 * 撤销最近一笔已支付的验证单：订单转 revoked，并把它给的天数从 pro_until 上原样扣回。
 * 只碰 test 单，真钱买的套餐不动；扣完已过期就置 NULL，账号回到免费用户。
 */
export function revokeTestOrder(userId: number): { ok: boolean; days: number } {
  const db = getDb();
  const order = db
    .prepare(
      `select out_trade_no from orders
       where user_id = ? and plan = ? and status = 'paid'
       order by paid_at desc limit 1`
    )
    .get(userId, TEST_PLAN.key) as { out_trade_no: string } | undefined;
  if (!order) return { ok: false, days: 0 };

  const back = `-${planDays(TEST_PLAN)} days`;
  db.transaction(() => {
    db.prepare(
      `update orders set status = 'revoked' where out_trade_no = ? and status = 'paid'`
    ).run(order.out_trade_no);
    db.prepare(
      `update users set pro_until = case
         when datetime(pro_until, ?) <= datetime('now') then null
         else datetime(pro_until, ?)
       end where id = ?`
    ).run(back, back, userId);
  }).immediate();

  return { ok: true, days: planDays(TEST_PLAN) };
}
