/**
 * GitHub 仓库地址解析与星数格式化。
 * 纯函数、无副作用，服务端与浏览器共用，保证两端拿到同一个仓库 key。
 */

/** https://github.com/owner/repo(/tree/main/...)? → owner/repo；非 GitHub 一律返回 null */
export function parseGitHubRepo(url?: string | null): string | null {
  if (!url) return null;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.hostname.toLowerCase().replace(/^www\./, "") !== "github.com") return null;
  const [owner, rawRepo] = parsed.pathname.split("/").filter(Boolean);
  if (!owner || !rawRepo) return null;
  const repo = rawRepo.replace(/\.git$/i, "");
  if (!/^[A-Za-z0-9_.-]+$/.test(owner) || !/^[A-Za-z0-9_.-]+$/.test(repo)) return null;
  // GitHub 的 owner/repo 大小写不敏感：统一小写，避免同一仓库被当成两个 key 重复请求
  return `${owner.toLowerCase()}/${repo.toLowerCase()}`;
}

/** 与站内 installs 的 3.5M / 98.5K 写法保持一致 */
export function formatStars(count: number): string {
  if (count >= 1_000_000) return `${trim(count / 1_000_000)}M`;
  if (count >= 1_000) return `${trim(count / 1_000)}K`;
  return String(count);
}

function trim(n: number): string {
  return n.toFixed(1).replace(/\.0$/, "");
}

export type StarSnapshot = {
  /** key 为 owner/repo（小写），值为 GitHub stargazers_count */
  stars: Record<string, number>;
  /** 最近一次成功从 GitHub 取回数据的时间（ISO），全空时为 null */
  updatedAt: string | null;
  /** 有仓库刷新失败、正在展示旧值时为 true */
  stale: boolean;
};
