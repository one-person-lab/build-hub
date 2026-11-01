import { getDb, nowIso, userIsPro } from "./db";

/** 免费账号累计能复制几条提示词；PRO 不限 */
export const FREE_COPY_LIMIT = 10;

export type CopyQuota = { ok: boolean; used: number; limit: number | null };

export function countCopies(userId: number): number {
  return (
    (getDb()
      .prepare(`select count(*) as n from prompt_copies where user_id = ?`)
      .get(userId) as { n: number }).n
  );
}

/** 未达 PRO 时的额度闸门：PRO 直接放行，免费账号按累计次数卡 */
export function copyQuota(userId: number): CopyQuota {
  if (userIsPro(userId)) return { ok: true, used: countCopies(userId), limit: null };
  const used = countCopies(userId);
  return { ok: used < FREE_COPY_LIMIT, used, limit: FREE_COPY_LIMIT };
}

/** 记一笔复制并回额度；已超线的不再记账 */
export function recordCopy(userId: number, source: string): CopyQuota {
  const quota = copyQuota(userId);
  if (!quota.ok) return quota;
  getDb()
    .prepare(`insert into prompt_copies (user_id, source, created_at) values (?, ?, ?)`)
    .run(userId, source.slice(0, 80), nowIso());
  return { ...quota, used: quota.used + 1 };
}
