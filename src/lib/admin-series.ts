/**
 * 时间序列分桶：给 ops 公司经营看板画趋势用。
 *
 * 契约对齐 earth-online-server/src/admin.js 的 statsSeries 与醒醒的 GetOpsSeries，
 * 三个平台形状必须一致——公司层按 bucket 字符串把几条线合并，形状不同就得写适配。
 *
 * 口径要点：
 * - 桶键按东八区；订单的 paid_at / created_at 是 SQLite datetime('now')，存的是 UTC；
 *   unixepoch() 得到真实 UTC 毫秒，再用 bucketKey 内部 +8 小时得到东八区墙钟桶键。
 * - 0.01 元验证单（plan=test / money<=0.01 / verify- 前缀）不进营收，单列 test*，
 *   剔除不等于隐瞒。
 * - 空桶补齐，否则没有数据的月份会让前端折线断开。
 */

const BEIJING_MS = 8 * 3600 * 1000;
const DAY_MS = 86400000;

export type SeriesGranularity = 'day' | 'month' | 'week';

export type SeriesBucket = {
  bucket: string;
  newUsers: number;
  orders: number;
  revenue: number;
  testOrders: number;
  testRevenue: number;
};

/** 只需要 prepare().all()，便于测试里传内存库，也不绑死 better-sqlite3 的具体类型 */
type SqlDb = {
  prepare(sql: string): { all(...params: unknown[]): unknown[] };
};

const round2 = (n: number) => Math.round(n * 100) / 100;

/** YYYY-MM-DD（东八区）→ 该日零点对应的真实 UTC 毫秒 */
function parseBeijingDay(value: unknown, fallback: number): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value ?? '').trim());
  if (!m) return fallback;
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) - BEIJING_MS;
}

/** 真实 UTC 毫秒 → 东八区墙钟 ISO 串（仍以 Z 结尾，仅用于取日期字段） */
function isoOfBeijing(ms: number): string {
  return new Date(ms + BEIJING_MS).toISOString();
}

function bucketKey(ms: number, gran: SeriesGranularity): string {
  const iso = isoOfBeijing(ms);
  if (gran === 'month') return iso.slice(0, 7);
  if (gran === 'day') return iso.slice(0, 10);
  // week：对齐 SQLite strftime('%Y-W%W')——周一为一周起点，元旦前的日子算第 0 周
  const d = new Date(iso);
  const year = d.getUTCFullYear();
  const jan1 = Date.UTC(year, 0, 1);
  const dayOfYear = Math.floor((d.getTime() - jan1) / DAY_MS);
  const jan1Dow = new Date(jan1).getUTCDay();
  const firstMonday = (8 - jan1Dow) % 7;
  const week =
    dayOfYear < firstMonday ? 0 : Math.floor((dayOfYear - firstMonday) / 7) + 1;
  return `${year}-W${String(week).padStart(2, '0')}`;
}

function emptyBuckets(
  fromMs: number,
  toMs: number,
  gran: SeriesGranularity,
): string[] {
  const out: string[] = [];
  if (gran === 'month') {
    const start = isoOfBeijing(fromMs);
    let year = Number(start.slice(0, 4));
    let month = Number(start.slice(5, 7));
    while (Date.UTC(year, month - 1, 1) - BEIJING_MS < toMs) {
      out.push(`${year}-${String(month).padStart(2, '0')}`);
      month += 1;
      if (month > 12) {
        month = 1;
        year += 1;
      }
    }
  } else {
    const step = gran === 'week' ? 7 * DAY_MS : DAY_MS;
    for (let t = fromMs; t < toMs; t += step) out.push(bucketKey(t, gran));
  }
  return out;
}

type PaidRow = {
  ms: number | null;
  money: number | null;
  plan: string | null;
  outTradeNo: string | null;
};

type TimeRow = { ms: number | null };

/**
 * 计算时间序列。返回 null 表示时间范围不合法（to 必须晚于 from），调用方转 400。
 */
export function buildSeries(
  db: SqlDb,
  query: {
    from?: unknown;
    granularity?: unknown;
    to?: unknown;
  },
  now = Date.now(),
) {
  const gran: SeriesGranularity =
    query.granularity === 'day' ||
    query.granularity === 'week' ||
    query.granularity === 'month'
      ? query.granularity
      : 'month';

  const todayIso = isoOfBeijing(now);
  const defaultFrom =
    Date.UTC(Number(todayIso.slice(0, 4)), Number(todayIso.slice(5, 7)) - 12, 1) -
    BEIJING_MS;
  const fromMs = parseBeijingDay(query.from, defaultFrom);
  const toMs = parseBeijingDay(query.to, now) + DAY_MS;
  if (toMs <= fromMs) return null;

  const keys = emptyBuckets(fromMs, toMs, gran);
  const byKey = new Map<string, SeriesBucket>();
  for (const key of keys) {
    byKey.set(key, {
      bucket: key,
      newUsers: 0,
      orders: 0,
      revenue: 0,
      testOrders: 0,
      testRevenue: 0,
    });
  }

  const bucketOf = (ms: number) =>
    ms >= fromMs && ms < toMs ? byKey.get(bucketKey(ms, gran)) : undefined;

  // 已支付订单：money 是元。验证单剔除到 test*，不计营收。
  const paidRows = db
    .prepare(
      `SELECT unixepoch(paid_at) * 1000 AS ms, cast(money AS real) AS money,
              plan, out_trade_no AS outTradeNo
         FROM orders WHERE status = 'paid' AND paid_at IS NOT NULL`,
    )
    .all() as PaidRow[];
  for (const row of paidRows) {
    if (row.ms == null) continue;
    const bucket = bucketOf(row.ms);
    if (!bucket) continue;
    const amount = Number(row.money) || 0;
    const isTest =
      amount <= 0.01 ||
      row.plan === 'test' ||
      /^verify-/i.test(row.outTradeNo ?? '');
    if (isTest) {
      bucket.testOrders += 1;
      bucket.testRevenue = round2(bucket.testRevenue + amount);
    } else {
      bucket.orders += 1;
      bucket.revenue = round2(bucket.revenue + amount);
    }
  }

  // 新增用户：users.created_at 是 UTC 的 datetime 文本
  const userRows = db
    .prepare('SELECT unixepoch(created_at) * 1000 AS ms FROM users')
    .all() as TimeRow[];
  for (const row of userRows) {
    if (row.ms == null) continue;
    const bucket = bucketOf(row.ms);
    if (bucket) bucket.newUsers += 1;
  }

  return {
    buckets: keys.map((key) => byKey.get(key)!),
    currency: 'CNY',
    from: isoOfBeijing(fromMs).slice(0, 10),
    granularity: gran,
    to: isoOfBeijing(toMs - DAY_MS).slice(0, 10),
  };
}
