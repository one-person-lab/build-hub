import { getDb } from "@/lib/db";
import { adminFail, adminOk, requireAdminToken } from "@/lib/admin-auth";

type Ctx = { params: Promise<{ outTradeNo: string }> };

const ACCOUNT_EXPR = `coalesce(
  u.email,
  nullif(u.wx_nickname, ''),
  nullif(u.gh_login, ''),
  case when u.wx_openid is not null then '微信 ' || substr(u.wx_openid, 1, 8) end,
  case when u.gh_id is not null then 'GitHub ' || u.gh_id end
)`;

/** GET /api/admin/orders/:outTradeNo */
export async function GET(req: Request, ctx: Ctx) {
  const denied = requireAdminToken(req);
  if (denied) return denied;

  const outTradeNo = (await ctx.params).outTradeNo?.trim();
  if (!outTradeNo) return adminFail(400, "invalid_order");

  const row = getDb()
    .prepare(
      `select o.out_trade_no, o.user_id, ${ACCOUNT_EXPR} as account,
              o.plan, o.name, o.money, o.status, o.channel, o.trade_no,
              o.paid_at, o.created_at
       from orders o join users u on u.id = o.user_id
       where o.out_trade_no = ?`,
    )
    .get(outTradeNo);

  if (!row) return adminFail(404, "order_not_found");
  return adminOk({ order: row });
}
