import { getDb } from "@/lib/db";
import { adminOk, requireAdminToken } from "@/lib/admin-auth";

export type AdminOrderRow = {
  out_trade_no: string;
  user_id: number;
  account: string | null;
  plan: string;
  name: string;
  money: string;
  status: string;
  channel: string;
  trade_no: string | null;
  paid_at: string | null;
  created_at: string;
};

const ACCOUNT_EXPR = `coalesce(
  u.email,
  nullif(u.wx_nickname, ''),
  nullif(u.gh_login, ''),
  case when u.wx_openid is not null then '微信 ' || substr(u.wx_openid, 1, 8) end,
  case when u.gh_id is not null then 'GitHub ' || u.gh_id end
)`;

/** GET /api/admin/orders?q=&status=&channel=&plan=&page=&pageSize= */
export async function GET(req: Request) {
  const denied = requireAdminToken(req);
  if (denied) return denied;

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();
  const status = (url.searchParams.get("status") || "").trim();
  const channel = (url.searchParams.get("channel") || "").trim();
  const plan = (url.searchParams.get("plan") || "").trim();
  const page = Math.max(1, Number(url.searchParams.get("page") || 1) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, Number(url.searchParams.get("pageSize") || 20) || 20),
  );
  const offset = (page - 1) * pageSize;

  const where: string[] = [];
  const params: Array<string | number> = [];

  if (status) {
    where.push(`o.status = ?`);
    params.push(status);
  }
  if (channel) {
    where.push(`o.channel = ?`);
    params.push(channel);
  }
  if (plan) {
    where.push(`o.plan = ?`);
    params.push(plan);
  }
  if (q) {
    const like = `%${q.replace(/[%_]/g, "")}%`;
    where.push(
      `(o.out_trade_no like ? or coalesce(o.trade_no, '') like ? or coalesce(u.email, '') like ? or coalesce(u.wx_nickname, '') like ? or coalesce(u.gh_login, '') like ?)`,
    );
    params.push(like, like, like, like, like);
  }

  const whereSql = where.length ? `where ${where.join(" and ")}` : "";
  const db = getDb();

  const totalRow = db
    .prepare(
      `select count(*) as n from orders o join users u on u.id = o.user_id ${whereSql}`,
    )
    .get(...params) as { n: number };

  const items = db
    .prepare(
      `select o.out_trade_no, o.user_id, ${ACCOUNT_EXPR} as account,
              o.plan, o.name, o.money, o.status, o.channel, o.trade_no,
              o.paid_at, o.created_at
       from orders o join users u on u.id = o.user_id
       ${whereSql}
       order by coalesce(o.paid_at, o.created_at) desc
       limit ? offset ?`,
    )
    .all(...params, pageSize, offset) as AdminOrderRow[];

  return adminOk({
    items,
    total: totalRow.n,
    page,
    pageSize,
  });
}
