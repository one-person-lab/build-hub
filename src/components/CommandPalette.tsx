"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import zhCatalogs from "@/data/catalogs.json";
import enCatalogs from "@/data/en-catalogs.json";
import { QUICK_LINKS } from "@/lib/palette-links";

export type FlatTerm = {
  slug: string;
  name: string;
  en: string;
  tagline: string;
  zone: string;
  catalogKey: string;
};

// 这些分区有独立顶级菜单，词条面包屑要跳回自己那页而不是概念列表
const STANDALONE_PATHS: Record<string, string> = {
  design: "/design",
  motion: "/distill",
  stack: "/stack",
};

export function standaloneCrumb(catalogKey: string | undefined, locale: "zh" | "en") {
  const path = catalogKey ? STANDALONE_PATHS[catalogKey] : undefined;
  if (!path) return null;
  return `${locale === "en" ? "/en" : ""}${path}`;
}

const ZONES: Record<"zh" | "en", Record<string, string>> = {
  zh: {
    frontend: "前端",
    backend: "后端",
    product: "产品",
    testing: "测试",
    technology: "技术栈",
    ai: "AI",
    git: "Git",
    design: "设计",
    motion: "动效",
    stack: "选型",
  },
  en: {
    frontend: "Frontend",
    backend: "Backend",
    product: "Product",
    testing: "Testing",
    technology: "Stack",
    ai: "AI",
    git: "Git",
    design: "Design",
    motion: "Motion",
    stack: "Stack",
  },
};

export function useFlatTerms(locale: "zh" | "en"): FlatTerm[] {
  return useMemo(() => {
    const data = (locale === "en" ? enCatalogs : zhCatalogs) as any[];
    const zones = ZONES[locale];
    const seen = new Set<string>();
    const out: FlatTerm[] = [];
    for (const cat of data) {
      const zone = zones[cat.key] ?? cat.key;
      for (const g of cat.groups)
        for (const t of g.terms) {
          if (seen.has(t.slug)) continue;
          seen.add(t.slug);
          out.push({
            slug: t.slug,
            name: t.name,
            en: t.en ?? "",
            tagline: t.tagline ?? "",
            zone,
            catalogKey: cat.key,
          });
        }
    }
    return out;
  }, [locale]);
}

const UI = {
  zh: {
    placeholder: "搜索概念、技能、提示词、专题…",
    aria: "搜索全站",
    empty: "没有匹配的条目",
    starts: "从这里开始",
    results: "搜索结果",
    move: "移动",
    open: "打开",
    note: "所有内容免费，无需登录",
  },
  en: {
    placeholder: "Search concepts, skills, prompts, stories…",
    aria: "Search everything",
    empty: "No matching entries",
    starts: "Where people start",
    results: "Results",
    move: "to move",
    open: "to open",
    note: "Everything is free, no account needed",
  },
};

const SUGGESTIONS: Record<"zh" | "en", string[]> = {
  zh: ["官网", "定价", "AI", "工作流", "设计风格", "提示词"],
  en: ["landing", "pricing", "AI", "workflow", "design", "prompt"],
};

type SearchResult = {
  title: string;
  subtitle: string;
  type: string;
  href: string;
  snippet?: string;
  kind?: string;
  logo?: string;
};

const searchCache = new Map<string, SearchResult[]>();

function KindIcon({ kind }: { kind: string }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (kind) {
    case "term":
      return (
        <svg {...common}>
          <path d="M12 3 3 7.5l9 4.5 9-4.5L12 3Z" />
          <path d="m3 12 9 4.5 9-4.5" />
        </svg>
      );
    case "skill":
      return (
        <svg {...common}>
          <path d="M12 3.5 13.8 9l5.7 1.8-5.7 1.8L12 18l-1.8-5.4L4.5 10.8 10.2 9 12 3.5Z" />
        </svg>
      );
    case "prompt":
      return (
        <svg {...common}>
          <rect x="3.5" y="5" width="17" height="14" rx="3" />
          <path d="m7.5 10 2.2 2.2-2.2 2.2M12.5 14.5h4" />
        </svg>
      );
    case "product":
      return (
        <svg {...common}>
          <path d="M4.5 7.5 12 3.5l7.5 4v9L12 20.5l-7.5-4v-9Z" />
          <path d="m4.5 7.5 7.5 4 7.5-4M12 11.5v9" />
        </svg>
      );
    case "playbook":
    case "book":
    case "explainer":
      return (
        <svg {...common}>
          <path d="M12 6.6C10.3 4.9 7.6 4.2 4.5 4.6v13.8c3.1-.4 5.8.3 7.5 2 1.7-1.7 4.4-2.4 7.5-2V4.6c-3.1-.4-5.8.3-7.5 2Z" />
          <path d="M12 6.6v13.8" />
        </svg>
      );
    case "path":
      return (
        <svg {...common}>
          <circle cx="6" cy="5.8" r="2.1" />
          <circle cx="18" cy="18.2" r="2.1" />
          <path d="M8.1 5.8h4.9a3 3 0 0 1 3 3v1.4a3 3 0 0 1-3 3H9a3 3 0 0 0-3 3v.9" />
        </svg>
      );
    case "course":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="m10 8.8 5 3.2-5 3.2V8.8Z" />
        </svg>
      );
    case "design":
      return (
        <svg {...common}>
          <path d="M4 20.5c3-.4 5.2-1.8 7.2-3.8l8.3-8.3-3.9-3.9-8.3 8.3C5.3 14.8 4.4 17 4 20.5Z" />
          <path d="m13.6 6.5 3.9 3.9" />
        </svg>
      );
    case "motion":
      return (
        <svg {...common}>
          <path d="M8 5.5v13l10-6.5-10-6.5Z" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <path d="M4 12h15M13.5 6 19.5 12l-6 6" />
        </svg>
      );
  }
}

function Thumb({ item }: { item: SearchResult }) {
  if (item.logo) {
    return (
      <span className="rd-thumb is-logo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.logo}
          alt=""
          loading="lazy"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      </span>
    );
  }
  return (
    <span className="rd-thumb">
      <KindIcon kind={item.kind ?? "go"} />
    </span>
  );
}

function OpenIcon() {
  return (
    <svg
      className="rd-item-go"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M5 12h13M12.5 6l6 6-6 6" />
    </svg>
  );
}

export default function CommandPalette({
  locale,
  onClose,
}: {
  locale: "zh" | "en";
  onClose: () => void;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const [results, setResults] = useState<SearchResult[]>(() => QUICK_LINKS[locale]);
  const [pending, setPending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const U = UI[locale];
  const searching = q.trim().length > 0;

  useEffect(() => {
    const term = q.trim();
    if (!term) {
      setResults(QUICK_LINKS[locale]);
      setPending(false);
      setActive(0);
      return;
    }
    const key = `${locale}|${term}`;
    const cached = searchCache.get(key);
    if (cached) {
      setResults(cached);
      setPending(false);
      setActive(0);
      return;
    }
    let alive = true;
    setPending(true);
    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/search?locale=${locale}&full=1&q=${encodeURIComponent(term)}`, {
        signal: ctrl.signal,
      })
        .then((r) => r.json())
        .then((d) => {
          if (!alive) return;
          const items = Array.isArray(d?.items) ? d.items : [];
          searchCache.set(key, items);
          setResults(items);
          setPending(false);
          setActive(0);
        })
        .catch(() => {});
    }, 90);
    return () => {
      alive = false;
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [q, locale]);

  useEffect(() => {
    inputRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  useEffect(() => {
    listRef.current
      ?.querySelector(".rd-item.is-active")
      ?.scrollIntoView({ block: "nearest" });
  }, [active, results]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((i) => (results.length ? Math.min(i + 1, results.length - 1) : 0));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((i) => Math.max(i - 1, 0));
      }
      if (e.key === "Enter" && results[active]) {
        router.push(results[active].href);
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [results, active, router, onClose]);

  function open(href: string) {
    router.push(href);
    onClose();
  }

  return (
    <div className="rd-overlay" onClick={onClose}>
      <div
        className="rd-palette"
        role="dialog"
        aria-modal="true"
        aria-label={U.aria}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rd-search">
          <svg
            className="rd-search-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            aria-hidden
          >
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 4.5 4.5" />
          </svg>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
            }}
            placeholder={U.placeholder}
            aria-label={U.aria}
            autoComplete="off"
            spellCheck={false}
          />
          <kbd>Esc</kbd>
        </div>

        <div className="rd-chips">
          {SUGGESTIONS[locale].map((s) => (
            <button
              key={s}
              type="button"
              className="rd-chip"
              onClick={() => {
                setQ(s);
                inputRef.current?.focus();
              }}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="rd-body">
          <div className="rd-panel">
            <p className="rd-panel-label">{searching ? U.results : U.starts}</p>
            <div className="rd-list" ref={listRef} role="listbox" aria-label={U.aria}>
              {results.map((t, i) => (
                <div
                  key={`${t.href}-${i}`}
                  className={`rd-item${i === active ? " is-active" : ""}`}
                  role="option"
                  aria-selected={i === active}
                  tabIndex={-1}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => open(t.href)}
                >
                  <Thumb item={t} />
                  <span className="rd-item-text">
                    <b>{t.title}</b>
                    <small>{t.snippet || t.subtitle}</small>
                  </span>
                  {searching && t.type ? <span className="rd-item-tag">{t.type}</span> : null}
                  <OpenIcon />
                </div>
              ))}
              {results.length === 0 && pending
                ? [0, 1, 2, 3].map((i) => (
                    <div key={`sk-${i}`} className="rd-item rd-skeleton" aria-hidden>
                      <span className="rd-thumb" />
                      <span className="rd-item-text">
                        <i />
                        <i />
                      </span>
                    </div>
                  ))
                : null}
              {results.length === 0 && !pending ? (
                <div className="rd-empty">{U.empty}</div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="rd-foot">
          <span className="rd-hint">
            <kbd>↑</kbd>
            <kbd>↓</kbd>
            {U.move}
          </span>
          <span className="rd-hint">
            <kbd>↵</kbd>
            {U.open}
          </span>
          <span className="rd-foot-note">{U.note}</span>
        </div>
      </div>
    </div>
  );
}
