"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import promptsData from "@/data/prompts.json";
import enPromptsData from "@/data/en-prompts.json";
import { writeClipboard } from "./clipboard";
import "./PromptLibraryView.css";

type Prompt = {
  id: string;
  name: string;
  category: string;
  tagline: string;
  prompt: string;
  why: string[];
  example: string;
  pitfalls: string[];
  bestFor: string;
  models: string;
  tags?: string[];
};

type Category = { key: string; label: string; prompts: Prompt[] };

type PromptLibrary = {
  title: string;
  subtitle: string;
  categories: Category[];
};

const ZH = promptsData as unknown as PromptLibrary;
const EN = enPromptsData as unknown as PromptLibrary;

const UI_TEXT = {
  zh: {
    all: "全部",
    count: "条",
    detail: "查看详情",
    copy: "复制",
    copied: "已复制",
    copyFail: "复制失败",
    empty: "这个分类还在收集中，敬请期待。",
  },
  en: {
    all: "All",
    count: "",
    detail: "View details",
    copy: "Copy",
    copied: "Copied",
    copyFail: "Failed",
    empty: "Still collecting for this category — stay tuned.",
  },
} as const;

export default function PromptLibraryView({
  locale = "zh",
}: {
  locale?: "zh" | "en";
}) {
  const lib = locale === "en" ? EN : ZH;
  const T = UI_TEXT[locale];
  const total = useMemo(
    () => lib.categories.reduce((n, c) => n + c.prompts.length, 0),
    [lib]
  );
  const [active, setActive] = useState<string>("all");
  const [copied, setCopied] = useState<string | null>(null);

  // 支持从详情页「相关分类」带 ?cat=KEY 进来时，自动选中对应分类
  useEffect(() => {
    const cat = new URLSearchParams(window.location.search).get("cat");
    if (cat && (cat === "all" || lib.categories.some((c) => c.key === cat))) {
      setActive(cat);
    }
  }, [lib]);

  const selectCat = (key: string) => {
    setActive(key);
    const url = new URL(window.location.href);
    if (key === "all") url.searchParams.delete("cat");
    else url.searchParams.set("cat", key);
    window.history.replaceState(null, "", url.pathname + url.search);
  };

  const onCopy = useCallback(
    async (p: Prompt) => {
      const ok = await writeClipboard(p.prompt);
      setCopied(ok ? p.id : `__fail_${p.id}`);
      window.setTimeout(() => setCopied(null), 1600);
    },
    []
  );

  const visible =
    active === "all"
      ? lib.categories
      : lib.categories.filter((c) => c.key === active);

  const detailBase = locale === "en" ? "/en/prompts/" : "/prompts/";

  return (
    <main>
      <div className="catalog-page">
        <div className="grid-wrap">
          <header className="prompt-lib-head">
            <h1>{lib.title}</h1>
            <p>{lib.subtitle}</p>
          </header>

          <section className="prompt-lib-finder" aria-label="筛选分类">
            <div className="catalog-filter-list">
              <button
                type="button"
                className="catalog-filter-chip prompt-lib-chip"
                aria-pressed={active === "all"}
                onClick={() => selectCat("all")}
              >
                {T.all}
                <span>{total}</span>
              </button>
              {lib.categories.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  className="catalog-filter-chip prompt-lib-chip"
                  aria-pressed={active === c.key}
                  onClick={() => selectCat(c.key)}
                >
                  {c.label}
                  <span>{c.prompts.length}</span>
                </button>
              ))}
            </div>
          </section>

          {visible.map((c) => (
            <section className="prompt-lib-cat" key={c.key}>
              <div className="cat-title">
                {c.label}
                <span>
                  {c.prompts.length} {T.count}
                </span>
              </div>
              {c.prompts.length === 0 ? (
                <p className="prompt-lib-empty">{T.empty}</p>
              ) : (
                <div className="grid">
                  {c.prompts.map((p) => {
                    const isCopied = copied === p.id;
                    const isFailed = copied === `__fail_${p.id}`;
                    return (
                      <article className="prompt-card-wrap" key={p.id}>
                        <a
                          className="card prompt-card"
                          href={`${detailBase}${p.id}`}
                          aria-label={p.name}
                        >
                          <div className="card-head">
                            <h3 className="prompt-card-title">{p.name}</h3>
                          </div>
                          <div className="card-tagline card-quote">
                            {p.tagline}
                          </div>
                          {p.tags && p.tags.length > 0 ? (
                            <ul className="prompt-card-tags">
                              {p.tags.map((tg) => (
                                <li key={tg}>{tg}</li>
                              ))}
                            </ul>
                          ) : null}
                          <span className="prompt-card-more">
                            {T.detail} →
                          </span>
                        </a>
                        <button
                          type="button"
                          className={
                            "prompt-copy-btn" +
                            (isCopied ? " is-copied" : "") +
                            (isFailed ? " is-failed" : "")
                          }
                          aria-label={
                            (isCopied ? T.copied : T.copy) + "：" + p.name
                          }
                          onClick={() => onCopy(p)}
                        >
                          {isFailed ? T.copyFail : isCopied ? T.copied : T.copy}
                        </button>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
