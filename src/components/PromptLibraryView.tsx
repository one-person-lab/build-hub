"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import promptsData from "@/data/prompts.json";
import enPromptsData from "@/data/en-prompts.json";
import { writeClipboard } from "./clipboard";
import "./AssetLibraryView.css";
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

const sectionId = (key: string) => `cat-${key}`;

const UI_TEXT = {
  zh: {
    all: "全部",
    count: "条",
    copy: "复制",
    copied: "已复制",
    copyFail: "复制失败",
    empty: "这个分类还在收集中，敬请期待。",
    liveToc: "实时目录",
    filterCatalog: "筛选分类",
  },
  en: {
    all: "All",
    count: "",
    copy: "Copy",
    copied: "Copied",
    copyFail: "Failed",
    empty: "Still collecting for this category — stay tuned.",
    liveToc: "On this page",
    filterCatalog: "Filter categories",
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
  const [activeSection, setActiveSection] = useState<string | null>(null);
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
    window.scrollTo({ top: 0 });
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

  // Scroll spy：根据当前进入视口的分类 section 高亮左侧实时目录
  useEffect(() => {
    const sections = visible
      .map((c) => document.getElementById(sectionId(c.key)))
      .filter((el): el is HTMLElement => Boolean(el));
    if (sections.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const shown = entries
          .filter((e) => e.isIntersecting)
          .map((e) => e.target as HTMLElement);
        if (shown.length === 0) return;
        const topmost = shown.reduce((a, b) =>
          a.getBoundingClientRect().top < b.getBoundingClientRect().top ? a : b
        );
        setActiveSection(topmost.id);
      },
      { rootMargin: "-150px 0px -55% 0px", threshold: 0 }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [visible]);

  // 顶部筛选栏粘住时切到带背景的状态（与概念页同一套 .catalog-finder.is-stuck）
  useEffect(() => {
    const finder = document.querySelector<HTMLElement>(".catalog-finder");
    if (!finder) return;
    const navHeight = () => {
      const v = parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue("--site-nav-height")
      );
      return Number.isFinite(v) && v > 0 ? v : 56;
    };
    let raf = 0;
    const update = () => {
      raf = 0;
      finder.classList.toggle("is-stuck", finder.getBoundingClientRect().top <= navHeight() + 1);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      finder.classList.remove("is-stuck");
    };
  }, [active]);

  return (
    <main>
      <div className="catalog-page catalog-directory-page">
        <div className="catalog-layout catalog-directory-layout">
          <span className="catalog-finder-sentinel" aria-hidden="true" />
          <section className="catalog-finder" aria-label={T.filterCatalog}>
            <div className="catalog-finder-row">
              <div className="catalog-filter-list">
                <button
                  type="button"
                  className="catalog-filter-chip"
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
                    className="catalog-filter-chip"
                    aria-pressed={active === c.key}
                    onClick={() => selectCat(c.key)}
                  >
                    {c.label}
                    <span>{c.prompts.length}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>
          <aside className="cat-live-toc" aria-label={T.liveToc}>
            <nav className="cat-live-toc-nav">
              {visible.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  className={
                    "cat-live-toc-item" +
                    (activeSection === sectionId(c.key) ? " is-active" : "")
                  }
                  onClick={() =>
                    document
                      .getElementById(sectionId(c.key))
                      ?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }
                >
                  <span>{c.label}</span>
                  <em>{c.prompts.length}</em>
                </button>
              ))}
            </nav>
          </aside>
          <div className="grid-wrap">
            <header className="catalog-heading">
              <h1>{lib.title}</h1>
              <p className="cat-page-intro">{lib.subtitle}</p>
            </header>

            {visible.map((c) => (
              <section className="cat-section" id={sectionId(c.key)} key={c.key}>
                <h2 className="cat-title">
                  {c.label}
                  <span>
                    {c.prompts.length} {T.count}
                  </span>
                </h2>
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
                            <div className="card-tagline card-quote">{p.tagline}</div>
                            {p.tags && p.tags.length > 0 ? (
                              <ul className="prompt-card-tags">
                                {p.tags.map((tg) => (
                                  <li key={tg}>{tg}</li>
                                ))}
                              </ul>
                            ) : null}
                          </a>
                          <button
                            type="button"
                            className={
                              "prompt-copy-btn" +
                              (isCopied ? " is-copied" : "") +
                              (isFailed ? " is-failed" : "")
                            }
                            aria-label={(isCopied ? T.copied : T.copy) + "：" + p.name}
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
      </div>
    </main>
  );
}
