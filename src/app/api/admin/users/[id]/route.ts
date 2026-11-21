import { copyQuota } from "@/lib/copies";
import { getDb } from "@/lib/db";
import { adminFail, adminOk, requireAdminToken } from "@/lib/admin-auth";

type Ctx = { params: Promise<{ id: string }> };

function parseUserId(raw: string): number | null {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}

/** GET /api/admin/users/:id —— 用户详情：资料 + 近单 + 额度 + forks */
export async function GET(req: Request, ctx: Ctx) {
  const denied = requireAdminToken(req);
  if (denied) return denied;

  const id = parseUserId((await ctx.params).id);
  if (!id) return adminFail(400, "invalid_user_id");

  const db = getDb();
  const user = db
    .prepare(
      `select id, email, wx_nickname, gh_login, gh_name, avatar_url, pro_until, created_at
       from users where id = ?`,
    )
    .get(id) as
    | {
        id: number;
        email: string | null;
        wx_nickname: string | null;
        gh_login: string | null;
        gh_name: string | null;
        avatar_url: string | null;
        pro_until: string | null;
        created_at: string;
      }
    | undefined;
  if (!user) return adminFail(404, "user_not_found");

  const orders = db
    .prepare(
      `select out_trade_no, plan, name, money, status, channel, trade_no, paid_at, created_at
       from orders where user_id = ?
       order by coalesce(paid_at, created_at) desc
       limit 30`,
    )
    .all(id);

  const forks = db
    .prepare(
      `select id, playbook_id, created_at, updated_at
       from forks where user_id = ?
       order by updated_at desc
       limit 20`,
    )
    .all(id);

  const quota = copyQuota(id);

  return adminOk({
    user,
    orders,
    forks,
    copies: quota,
  });
}
