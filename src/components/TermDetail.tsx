"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import TermBody, { type Term } from "./TermBody";
import { useFlatTerms } from "./CommandPalette";

function buildMarkdown(t: Term, locale: "zh" | "en" = "zh"): string {
  const lines: string[] = [];
  lines.push(`# ${t.name}${t.en ? `（${t.en}）` : ""}`);
  if (t.quote)
    lines.push(
      `> ${t.quoteLabel || (locale === "en" ? "You might say" : "你可能会说")}：${t.quote}`
    );
  if (t.summaryLead) {
    lines.push("", t.summaryLead);
    if (t.summaryRest) lines.push("", t.summaryRest);
  }
  for (const s of t.sections) {
    if (s.title) lines.push("", `## ${s.title}`);
    if (s.cards)
      for (const c of s.cards)
        lines.push(`- ${c.headText.replace(/\s+/g, " ")}`, `  ${c.bodyText ?? ""}`);
    if (s.parts)
      for (const p of s.parts)
        lines.push(`${p.idx}. **${p.name}${p.en ? ` ${p.en}` : ""}** — ${p.desc}`);
    if (s.variants)
      for (const v of s.variants)
        lines.push(`- **${v.name}${v.en ? ` ${v.en}` : ""}**：${v.when}`);
    if (s.scenes)
      for (const sc of s.scenes) lines.push(`- ${sc.cap}`);
    if (s.references)
      for (const r of s.references) lines.push(`- [${r.title}](${r.href}) ${r.source}`);
  }
  return lines.join("\n");
}

function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("vh-favorites") || "[]");
      if (Array.isArray(saved)) setFavorites(new Set(saved.filter((s) => typeof s === "string")));
    } catch {
      setFavorites(new Set());
    }
  }, []);
  const toggle = (slug: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      localStorage.setItem("vh-favorites", JSON.stringify(Array.from(next)));
      return next;
    });
  };
  return { favorites, toggle };
}

export default function TermDetail({
  term,
  locale = "zh",
}: {
  term: Term;
  locale?: "zh" | "en";
}) {
  const router = useRouter();
  const { favorites, toggle } = useFavorites();
  const isFav = useMemo(() => favorites.has(term.slug), [favorites, term.slug]);
  const flatTerms = useFlatTerms(locale);
  const zone = useMemo(
    () => flatTerms.find((t) => t.slug === term.slug)?.zone,
    [flatTerms, term.slug]
  );

  const T =
    locale === "en"
      ? {
          allEntries: "All entries",
          backAll: "Back to all entries",
          fav: "Add to favorites",
          copyMd: "Copy as Markdown",
          copied: "Copied",
          prev: "Previous entry",
          next: "Next entry",
        }
      : {
          allEntries: "概念图鉴",
          backAll: "返回概念图鉴",
          fav: "收藏术语",
          copyMd: "复制为 Markdown",
          copied: "已复制",
          prev: "上一个条目",
          next: "下一个条目",
        };
  const homeHref = locale === "en" ? "/en" : "/";
  const detailBase = locale === "en" ? "/en/" : "/";
  const breadcrumbLabel = locale === "en" ? "Breadcrumb" : "面包屑";

  function copyMarkdown() {
    navigator.clipboard.writeText(buildMarkdown(term, locale)).catch(() => {});
  }

  return (
    <main>
      <div className="detail">
        <div className="detail-topbar">
          <nav className="detail-breadcrumb" aria-label={breadcrumbLabel}>
            <button
              type="button"
              className="detail-back-button"
              aria-label={T.backAll}
              title={T.backAll}
              onClick={() => router.push(homeHref)}
            >
              <svg className="ui-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M19 12H5m6-6-6 6 6 6" />
              </svg>
            </button>
            <button type="button" className="breadcrumb-link" onClick={() => router.push(homeHref)}>
              {T.allEntries}
            </button>
            <span className="breadcrumb-separator" aria-hidden="true">
              ›
            </span>
            <span className="breadcrumb-current" aria-current="page">
              {term.name}
            </span>
          </nav>
          <div className="detail-topbar-actions">
            <button
              type="button"
              className="favorite-button"
              aria-label={T.fav}
              aria-pressed={isFav}
              title={T.fav}
              onClick={() => toggle(term.slug)}
            >
              <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
                <path d="M23.9986 5L17.8856 17.4776L4 19.4911L14.0589 29.3251L11.6544 43L23.9986 36.4192L36.3454 43L33.9586 29.3251L44 19.4911L30.1913 17.4776L23.9986 5Z" />
              </svg>
            </button>
            <button
              type="button"
              className="detail-copy-markdown"
              aria-label={T.copyMd}
              onClick={copyMarkdown}
            >
              <span className="detail-copy-icon" aria-hidden="true">
                <svg className="ui-icon copy-icon-default" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="8" y="8" width="11" height="11" rx="2" />
                  <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
                </svg>
                <svg className="ui-icon copy-icon-success" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="m5 12.5 4.2 4.2L19 7" />
                </svg>
              </span>
              <span className="detail-copy-label" aria-hidden="true">
                <span className="copy-label-default">{T.copyMd}</span>
                <span className="copy-label-success">{T.copied}</span>
              </span>
            </button>
          </div>
        </div>

        {(term.prev || term.next) && (
          <div className="detail-entry-navigation">
            {term.prev && (
              <button
                className="float-nav left"
                onClick={() => router.push(detailBase + term.prev)}
                aria-label={T.prev}
              >
                <span className="fn-arrow">←</span>
                <span className="fn-text">{term.prev}</span>
              </button>
            )}
            {term.next && (
              <button
                className="float-nav right"
                onClick={() => router.push(detailBase + term.next)}
                aria-label={T.next}
              >
                <span className="fn-text">{term.next}</span>
                <span className="fn-arrow">→</span>
              </button>
            )}
          </div>
        )}

        <TermBody term={term} locale={locale} kicker={zone} />
      </div>
    </main>
  );
}
