import { getDb } from "@/lib/db";
import { adminFail, adminOk, requireAdminToken } from "@/lib/admin-auth";

type Ctx = { params: Promise<{ id: string }> };

function parseUserId(raw: string): number | null {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}

/** POST /api/admin/users/:id/pro  body: { days: number } —— 延长 PRO */
export async function POST(req: Request, ctx: Ctx) {
  const denied = requireAdminToken(req);
  if (denied) return denied;

  const id = parseUserId((await ctx.params).id);
  if (!id) return adminFail(400, "invalid_user_id");

  const body = await req.json().catch(() => null);
  const days = Number(body?.days);
  if (!Number.isInteger(days) || days <= 0 || days > 40 * 365) {
    return adminFail(400, "invalid_days", "days must be a positive integer");
  }

  const db = getDb();
  const exists = db.prepare(`select id from users where id = ?`).get(id) as
    | { id: number }
    | undefined;
  if (!exists) return adminFail(404, "user_not_found");

  db.prepare(
    `update users set pro_until = datetime(
       max(
         coalesce(pro_until, datetime('now')),
         datetime('now')
       ),
       '+' || ? || ' days'
     ) where id = ?`,
  ).run(days, id);

  const row = db
    .prepare(
      `select id, email, wx_nickname, gh_login, gh_name, avatar_url, pro_until, created_at
       from users where id = ?`,
    )
    .get(id);

  return adminOk({ user: row });
}

/** DELETE /api/admin/users/:id/pro —— 撤销 PRO */
export async function DELETE(req: Request, ctx: Ctx) {
  const denied = requireAdminToken(req);
  if (denied) return denied;

  const id = parseUserId((await ctx.params).id);
  if (!id) return adminFail(400, "invalid_user_id");

  const db = getDb();
  const upd = db
    .prepare(`update users set pro_until = null where id = ?`)
    .run(id);
  if (upd.changes === 0) return adminFail(404, "user_not_found");

  const row = db
    .prepare(
      `select id, email, wx_nickname, gh_login, gh_name, avatar_url, pro_until, created_at
       from users where id = ?`,
    )
    .get(id);

  return adminOk({ user: row });
}
