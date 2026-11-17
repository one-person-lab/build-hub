import skillsData from "@/data/skills.json";
import enSkillsData from "@/data/en-skills.json";
import { getDb } from "@/lib/db";
import { parseGitHubRepo, type StarSnapshot } from "@/lib/github-repo";

/**
 * 服务端 GitHub 星数同步：默认每天刷一次。
 *
 * 星数不写回静态 JSON。服务端把结果与「上次同步时间」持久化在 SQLite，
 * 距上次同步满 24 小时才向 GitHub REST 拉一轮（当前 20 个仓库 = 20 次请求/天，
 * 远低于匿名 60 次/小时）；拉失败保留旧值并标记 stale，页面不空白。
 * 缓存落库还有个好处：dev 热更新 / 进程重启不会重复消耗当天配额。
 * 需要临时手动同步：GET /api/github-stars?refresh=1
 */

type Library = {
  categories: { skills: { repo?: string; official?: string }[] }[];
};

const LIBRARIES = [skillsData, enSkillsData] as unknown as Library[];

const TTL_MS = (Number(process.env.GITHUB_STARS_TTL_MINUTES) || 1440) * 60_000;
const RETRY_MS = 6 * 60 * 60 * 1000; // 失败后 6 小时再试，避免 GitHub 故障时反复打满配额
const TIMEOUT_MS = 6_000;

// starsAt 是真正拿到数字的时间，checkedAt 是上次尝试时间（失败也要推进，
// 否则限流时每个访客都会把已经超时的仓库再打一遍）
type Entry = {
  stars: number;
  etag: string | null;
  starsAt: number;
  checkedAt: number;
};

type Row = {
  repo: string;
  stars: number;
  etag: string | null;
  stars_at: number;
  checked_at: number;
};

const cache = new Map<string, Entry>();
const failures = new Map<string, number>();
let inFlight: Promise<void> | null = null;
let lastRefreshFailed = false;
let loaded = false;

/** SQLite 不可用时静默退化为纯内存缓存，不影响页面 */
function ensureLoaded(): void {
  if (loaded) return;
  loaded = true;
  try {
    const rows = getDb()
      .prepare(`select repo, stars, etag, stars_at, checked_at from github_stars`)
      .all() as Row[];
    for (const r of rows) {
      cache.set(r.repo, {
        stars: r.stars,
        etag: r.etag,
        starsAt: r.stars_at,
        checkedAt: r.checked_at,
      });
    }
  } catch {
    // 数据库不可用就按冷启动处理
  }
}

function persist(repo: string, entry: Entry): void {
  try {
    getDb()
      .prepare(
        `insert into github_stars (repo, stars, etag, stars_at, checked_at)
         values (?, ?, ?, ?, ?)
         on conflict(repo) do update set
           stars = excluded.stars,
           etag = excluded.etag,
           stars_at = excluded.stars_at,
           checked_at = excluded.checked_at`
      )
      .run(repo, entry.stars, entry.etag, entry.starsAt, entry.checkedAt);
  } catch {
    // 落库失败不影响本次内存里的结果
  }
}

function allRepos(): string[] {
  const repos = new Set<string>();
  for (const lib of LIBRARIES) {
    for (const cat of lib.categories) {
      for (const skill of cat.skills) {
        const hit = [skill.repo, skill.official]
          .map((url) => parseGitHubRepo(url))
          .find((repo): repo is string => repo !== null);
        if (hit) repos.add(hit);
      }
    }
  }
  return [...repos];
}

async function fetchRepo(repo: string): Promise<void> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "buildhub-star-sync",
  };
  const token = process.env.GITHUB_TOKEN?.trim();
  if (token) headers.Authorization = `Bearer ${token}`;

  const prev = cache.get(repo);
  if (prev?.etag) headers["If-None-Match"] = prev.etag;

  try {
    const res = await fetch(`https://api.github.com/repos/${repo}`, {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    // 304 只省流量不省配额；星数没变，把检查时间往前推即可
    if (res.status === 304 && prev) {
      const next = { ...prev, checkedAt: Date.now() };
      cache.set(repo, next);
      persist(repo, next);
      failures.delete(repo);
      return;
    }
    if (!res.ok) throw new Error(`GitHub ${res.status}`);
    const data = (await res.json()) as { stargazers_count?: unknown };
    if (
      typeof data.stargazers_count !== "number" ||
      !Number.isFinite(data.stargazers_count)
    ) {
      throw new Error("missing stargazers_count");
    }
    const now = Date.now();
    const next: Entry = {
      stars: data.stargazers_count,
      etag: res.headers.get("etag"),
      starsAt: now,
      checkedAt: now,
    };
    cache.set(repo, next);
    persist(repo, next);
    failures.delete(repo);
  } catch {
    // 静默降级：旧值继续展示，6 小时后再试（而不是等满一整天）
    const now = Date.now();
    const prev = cache.get(repo);
    if (prev) {
      const next = { ...prev, checkedAt: now - TTL_MS + RETRY_MS };
      cache.set(repo, next);
      persist(repo, next);
    }
    failures.set(repo, now + RETRY_MS);
    lastRefreshFailed = true;
  }
}

async function refresh(force: boolean): Promise<void> {
  const now = Date.now();
  const due = allRepos().filter((repo) => {
    if (force) return true;
    if ((failures.get(repo) ?? 0) > now) return false;
    const entry = cache.get(repo);
    return !entry || now - entry.checkedAt >= TTL_MS;
  });
  if (due.length === 0) return;
  lastRefreshFailed = false;
  // 当前只有 20 个仓库；错开几十毫秒一起发出，单请求自带超时，最坏只等一个超时周期
  await Promise.all(
    due.map(async (repo, i) => {
      if (i) await new Promise((resolve) => setTimeout(resolve, i * 25));
      await fetchRepo(repo);
    })
  );
}

/** 返回当前快照；并发调用共享同一轮刷新 */
export async function getStarSnapshot(force = false): Promise<StarSnapshot> {
  ensureLoaded();
  if (!inFlight) {
    inFlight = refresh(force).finally(() => {
      inFlight = null;
    });
  }
  await inFlight;

  const stars: Record<string, number> = {};
  const now = Date.now();
  let latest = 0;
  let stale = lastRefreshFailed;
  for (const [repo, entry] of cache) {
    stars[repo] = entry.stars;
    latest = Math.max(latest, entry.starsAt);
    if (now - entry.starsAt > TTL_MS * 2) stale = true;
  }
  return {
    stars,
    updatedAt: latest ? new Date(latest).toISOString() : null,
    stale,
  };
}
