import { getDb } from "@/lib/db";
import { adminOk, requireAdminToken } from "@/lib/admin-auth";

/** GET /api/admin/stats/overview —— 经营概览 KPI */
export async function GET(req: Request) {
  const denied = requireAdminToken(req);
  if (denied) return denied;

  const db = getDb();

  const usersTotal = (
    db.prepare(`select count(*) as n from users`).get() as { n: number }
  ).n;

  const proActive = (
    db
      .prepare(
        `select count(*) as n from users
         where pro_until is not null and datetime(pro_until) > datetime('now')`,
      )
      .get() as { n: number }
  ).n;

  const newUsersToday = (
    db
      .prepare(
        `select count(*) as n from users
         where date(created_at) = date('now')`,
      )
      .get() as { n: number }
  ).n;

  const newUsers7d = (
    db
      .prepare(
        `select count(*) as n from users
         where datetime(created_at) >= datetime('now', '-7 days')`,
      )
      .get() as { n: number }
  ).n;

  const paidToday = db
    .prepare(
      `select count(*) as n, coalesce(sum(cast(money as real)), 0) as amount
       from orders
       where status = 'paid' and date(paid_at) = date('now')`,
    )
    .get() as { n: number; amount: number };

  const paid7d = db
    .prepare(
      `select count(*) as n, coalesce(sum(cast(money as real)), 0) as amount
       from orders
       where status = 'paid' and datetime(paid_at) >= datetime('now', '-7 days')`,
    )
    .get() as { n: number; amount: number };

  const paidMtd = db
    .prepare(
      `select count(*) as n, coalesce(sum(cast(money as real)), 0) as amount
       from orders
       where status = 'paid' and date(paid_at) >= date('now', 'start of month')`,
    )
    .get() as { n: number; amount: number };

  const manualPending = (
    db
      .prepare(
        `select count(*) as n from orders
         where channel = 'manual' and status = 'pending'`,
      )
      .get() as { n: number }
  ).n;

  const copyTop7d = db
    .prepare(
      `select u.id as user_id,
              coalesce(
                u.email,
                nullif(u.wx_nickname, ''),
                nullif(u.gh_login, ''),
                '#' || u.id
              ) as account,
              count(*) as copies
       from prompt_copies c
       join users u on u.id = c.user_id
       where datetime(c.created_at) >= datetime('now', '-7 days')
       group by c.user_id
       order by copies desc
       limit 10`,
    )
    .all() as Array<{ user_id: number; account: string; copies: number }>;

  return adminOk({
    usersTotal,
    proActive,
    newUsersToday,
    newUsers7d,
    paidOrdersToday: paidToday.n,
    paidAmountToday: Number(paidToday.amount.toFixed(2)),
    paidOrders7d: paid7d.n,
    paidAmount7d: Number(paid7d.amount.toFixed(2)),
    paidOrdersMtd: paidMtd.n,
    paidAmountMtd: Number(paidMtd.amount.toFixed(2)),
    manualPending,
    copyTop7d,
  });
}
