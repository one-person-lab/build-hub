import { copyQuota } from "@/lib/copies";
import { getDb } from "@/lib/db";
import { adminFail, adminOk, requireAdminToken } from "@/lib/admin-auth";

type Ctx = { params: Promise<{ id: string }> };

function parseUserId(raw: string): number | null {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}

/** GET /api/admin/users/:id/copies */
export async function GET(req: Request, ctx: Ctx) {
  const denied = requireAdminToken(req);
  if (denied) return denied;

  const id = parseUserId((await ctx.params).id);
  if (!id) return adminFail(400, "invalid_user_id");

  const exists = getDb().prepare(`select id from users where id = ?`).get(id);
  if (!exists) return adminFail(404, "user_not_found");

  return adminOk({ copies: copyQuota(id) });
}
