import { getDb } from "./db";
import { newWxState, safeNext, siteOrigin } from "./wxlogin";

export { safeNext, siteOrigin };
export const GH_STATE_COOKIE = "bh_gh_state";
export const newGhState = newWxState;

/** GitHub OAuth App 的 Client ID / Secret；不配时登录弹窗不显示 GitHub 按钮 */
export function ghLoginConfigured(): boolean {
  return !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
}

export function ghAuthorizeUrl(redirectUri: string, state: string): string {
  const q = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID!,
    redirect_uri: redirectUri,
    scope: "read:user user:email",
    state,
    allow_signup: "true",
  });
  return `https://github.com/login/oauth/authorize?${q.toString()}`;
}

export type GhProfile = {
  id: string;
  login: string;
  name: string | null;
  email: string | null;
  avatar: string | null;
};

type TokenBody = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

async function ghJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`github_http_${res.status}`);
  return (await res.json()) as T;
}

export async function ghProfileByCode(code: string): Promise<GhProfile> {
  const token = await ghJson<TokenBody>("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });
  if (!token.access_token) {
    throw new Error(`github_token_${token.error ?? "missing"}`);
  }

  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token.access_token}`,
    "User-Agent": "buildhub-auth",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  const user = await ghJson<{
    id: number;
    login: string;
    name: string | null;
    email: string | null;
    avatar_url?: string | null;
  }>("https://api.github.com/user", { headers });

  let email = user.email?.trim().toLowerCase() || null;
  if (!email) {
    const emails = await ghJson<
      { email: string; primary: boolean; verified: boolean }[]
    >("https://api.github.com/user/emails", { headers }).catch(() => []);
    const primary =
      emails.find((e) => e.primary && e.verified) ??
      emails.find((e) => e.verified) ??
      emails[0];
    email = primary?.email?.trim().toLowerCase() || null;
  }

  return {
    id: String(user.id),
    login: user.login,
    name: user.name?.trim() || null,
    email,
    avatar: user.avatar_url?.trim() || null,
  };
}

/**
 * 同一个人只留一个账号：先按 gh_id；再按邮箱挂到已有邮箱账号上；
 * 都没有就新建。邮箱冲突（已被别的 GitHub 号占用）时只绑身份、不改邮箱。
 */
export function upsertGhUser(p: GhProfile): number {
  const db = getDb();
  const byGh = db
    .prepare(`select id from users where gh_id = ?`)
    .get(p.id) as { id: number } | undefined;
  if (byGh) {
    db.prepare(
      `update users
       set gh_login = ?,
           gh_name = coalesce(?, gh_name),
           email = coalesce(email, ?),
           avatar_url = coalesce(?, avatar_url)
       where id = ?`
    ).run(p.login, p.name, p.email, p.avatar, byGh.id);
    return byGh.id;
  }

  let email = p.email;
  if (email) {
    const byEmail = db
      .prepare(`select id, gh_id from users where email = ?`)
      .get(email) as { id: number; gh_id: string | null } | undefined;
    if (byEmail && !byEmail.gh_id) {
      db.prepare(
        `update users
         set gh_id = ?,
             gh_login = ?,
             gh_name = coalesce(?, gh_name),
             avatar_url = coalesce(?, avatar_url)
         where id = ?`
      ).run(p.id, p.login, p.name, p.avatar, byEmail.id);
      return byEmail.id;
    }
    // 邮箱已被别的 GitHub 号占用：新号照建，但不抢邮箱
    if (byEmail) email = null;
  }

  const row = db
    .prepare(
      `insert into users (email, gh_id, gh_login, gh_name, avatar_url)
       values (?, ?, ?, ?, ?) returning id`
    )
    .get(email, p.id, p.login, p.name, p.avatar) as { id: number };
  return row.id;
}
