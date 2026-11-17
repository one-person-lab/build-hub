import { getDb } from "@/lib/db";
import { adminOk, requireAdminToken } from "@/lib/admin-auth";

export type AdminUserRow = {
  id: number;
  email: string | null;
  wx_nickname: string | null;
  gh_login: string | null;
  gh_name: string | null;
  avatar_url: string | null;
  pro_until: string | null;
  created_at: string;
};

/** GET /api/admin/users?q=&page=&pageSize= —— Ops Console 用户列表 */
export async function GET(req: Request) {
  const denied = requireAdminToken(req);
  if (denied) return denied;

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();
  const page = Math.max(1, Number(url.searchParams.get("page") || 1) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, Number(url.searchParams.get("pageSize") || 20) || 20),
  );
  const offset = (page - 1) * pageSize;

  const db = getDb();
  const like = q ? `%${q.replace(/[%_]/g, "")}%` : null;

  const where = like
    ? `where coalesce(email, '') like ?
        or coalesce(wx_nickname, '') like ?
        or coalesce(gh_login, '') like ?
        or coalesce(gh_name, '') like ?`
    : "";
  const params = like ? [like, like, like, like] : [];

  const totalRow = db
    .prepare(`select count(*) as n from users ${where}`)
    .get(...params) as { n: number };
  const items = db
    .prepare(
      `select id, email, wx_nickname, gh_login, gh_name, avatar_url, pro_until, created_at
       from users ${where}
       order by id desc
       limit ? offset ?`,
    )
    .all(...params, pageSize, offset) as AdminUserRow[];

  return adminOk({
    items,
    total: totalRow.n,
    page,
    pageSize,
  });
}
