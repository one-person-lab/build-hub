import { resetCopies } from "@/lib/copies";
import { getDb } from "@/lib/db";
import { adminFail, adminOk, requireAdminToken } from "@/lib/admin-auth";

type Ctx = { params: Promise<{ id: string }> };

function parseUserId(raw: string): number | null {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}

/** POST /api/admin/users/:id/copies/reset —— 清空复制记账，重置免费额度 */
export async function POST(req: Request, ctx: Ctx) {
  const denied = requireAdminToken(req);
  if (denied) return denied;

  const id = parseUserId((await ctx.params).id);
  if (!id) return adminFail(400, "invalid_user_id");

  const exists = getDb().prepare(`select id from users where id = ?`).get(id);
  if (!exists) return adminFail(404, "user_not_found");

  return adminOk({ copies: resetCopies(id) });
}
