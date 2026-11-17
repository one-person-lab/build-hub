"use client";

import { formatStars, parseGitHubRepo } from "@/lib/github-repo";
import { useGitHubStars } from "@/lib/github-stars-client";
import "./RepoStars.css";

/**
 * GitHub 星数徽章。只认 GitHub 仓库地址，非 GitHub 项目直接不渲染。
 * 数字来自 /api/github-stars（服务端实时同步），不落在静态 JSON 里。
 */
export default function RepoStars({
  repo,
  locale = "zh",
  variant = "badge",
}: {
  repo?: string;
  locale?: "zh" | "en";
  variant?: "badge" | "inline";
}) {
  const key = parseGitHubRepo(repo);
  const { stars, updatedAt, stale, loading } = useGitHubStars();
  if (!key) return null;

  const count = stars[key];
  const hasCount = typeof count === "number";
  const label = hasCount ? formatStars(count) : loading ? "" : "—";
  const when = updatedAt
    ? new Date(updatedAt).toLocaleString(locale === "zh" ? "zh-CN" : "en-US", {
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  let title: string;
  if (hasCount) {
    const base = `${count.toLocaleString("en-US")} GitHub stars`;
    title = stale
      ? base + (locale === "zh" ? "（刷新失败，展示缓存值）" : " (cached)")
      : when
        ? base + (locale === "zh" ? ` · 更新于 ${when}` : ` · updated ${when}`)
        : base;
  } else {
    title = locale === "zh" ? "正在同步 GitHub 星数" : "Syncing GitHub stars";
  }

  return (
    <span
      className={
        "repo-stars" +
        (variant === "inline" ? " is-inline" : "") +
        (!hasCount && loading ? " is-loading" : "")
      }
      title={title}
      aria-label={hasCount ? `GitHub ${count} stars` : undefined}
    >
      <span className="repo-stars-icon" aria-hidden="true">
        ★
      </span>
      {label ? <span className="repo-stars-value">{label}</span> : null}
    </span>
  );
}
