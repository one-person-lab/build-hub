import crypto from "node:crypto";
import { cookies } from "next/headers";
import { getDb, proActive } from "./db";

const COOKIE = "bh_session";
const SESSION_DAYS = 30;

export type AuthUser = {
  id: number;
  email: string | null;
  nickname: string | null;
  proUntil: string | null;
};

/** 微信回跳要在 redirect 响应上直接写 cookie，属性从这里取，别两处各写一份 */
export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 86400,
  };
}

export const SESSION_COOKIE = COOKIE;

export function issueSession(userId: number): string {
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_DAYS * 864e5)
    .toISOString()
    .replace("T", " ")
    .slice(0, 19);
  getDb()
    .prepare(
      "insert into sessions (token, user_id, expires_at) values (?, ?, ?)"
    )
    .run(token, userId, expires);
  return token;
}

export async function createSession(userId: number): Promise<string> {
  const token = issueSession(userId);
  (await cookies()).set(COOKIE, token, sessionCookieOptions());
  return token;
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) getDb().prepare("delete from sessions where token = ?").run(token);
  store.delete(COOKIE);
}

export async function currentUser(): Promise<AuthUser | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const db = getDb();
  const row = db
    .prepare(
      `select s.token, u.id, u.email, u.wx_nickname, u.pro_until,
              (s.expires_at > datetime('now')) as session_valid
       from sessions s join users u on u.id = s.user_id
       where s.token = ?`
    )
    .get(token) as
    | {
        token: string;
        id: number;
        email: string | null;
        wx_nickname: string | null;
        pro_until: string | null;
        session_valid: number;
      }
    | undefined;
  if (!row || !row.session_valid) return null;
  return { id: row.id, email: row.email, nickname: row.wx_nickname, proUntil: row.pro_until };
}

export function isPro(user: AuthUser | null): boolean {
  return !!user && proActive(user.proUntil);
}
