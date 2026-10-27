"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ProModal from "@/components/ProModal";
import { useMe } from "@/lib/favorites";
import zhCatalogs from "@/data/catalogs.json";
import enCatalogs from "@/data/en-catalogs.json";

export type FlatTerm = {
  slug: string;
  name: string;
  en: string;
  tagline: string;
  zone: string;
  catalogKey: string;
};

// 这两个分区有独立顶级菜单，词条面包屑要跳回自己那页而不是概念列表
const STANDALONE_KEYS = ["design", "principles"];

export function standaloneCrumb(catalogKey: string | undefined, locale: "zh" | "en") {
  if (!catalogKey || !STANDALONE_KEYS.includes(catalogKey)) return null;
  return `${locale === "en" ? "/en" : ""}/${catalogKey}`;
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
    principles: "原理",
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
    principles: "Principles",
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
    placeholder: "搜索全站：概念、技能、提示词…",
    aria: "搜索全站",
    empty: "没有匹配的条目",
    hint: ["↑↓ 选择", "↵ 打开"],
    titleMode: "标题",
    fullMode: "全文",
  },
  en: {
    placeholder: "Search everything: concepts, skills, prompts…",
    aria: "Search everything",
    empty: "No matching entries",
    hint: ["↑↓ select", "↵ open"],
    titleMode: "Titles",
    fullMode: "Full text",
  },
};

type SearchResult = {
  title: string;
  subtitle: string;
  type: string;
  href: string;
  snippet?: string;
};

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
  const [results, setResults] = useState<SearchResult[]>([]);
  const [full, setFull] = useState(false);
  const [showPro, setShowPro] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const me = useMe();
  const pro = !!me?.pro;
  const U = UI[locale];

  useEffect(() => {
    const ctrl = new AbortController();
    const timer = setTimeout(
      () => {
        fetch(
          `/api/search?locale=${locale}&full=${full ? 1 : 0}&q=${encodeURIComponent(q.trim())}`,
          { signal: ctrl.signal }
        )
          .then((r) => r.json())
          .then((d) => {
            setResults(Array.isArray(d?.items) ? d.items : []);
            setActive(0);
          })
          .catch(() => {});
      },
      q.trim() ? 120 : 0
    );
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [q, locale, full]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") setActive((i) => Math.min(i + 1, results.length - 1));
      if (e.key === "ArrowUp") setActive((i) => Math.max(i - 1, 0));
      if (e.key === "Enter" && results[active]) {
        router.push(results[active].href);
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [results, active, router, onClose]);

  return (
    <>
      <div className="rd-overlay" onClick={onClose}>
        <div className="rd-palette" onClick={(e) => e.stopPropagation()}>
          <div className="rd-palette-input">
            <span aria-hidden>⌕</span>
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setActive(0);
              }}
              placeholder={U.placeholder}
              aria-label={U.aria}
            />
            <kbd>esc</kbd>
          </div>
          <div className="rd-modes">
            <button
              type="button"
              className={!full ? "is-active" : ""}
              onClick={() => setFull(false)}
            >
              {U.titleMode}
            </button>
            <button
              type="button"
              className={full ? "is-active" : ""}
              onClick={() => {
                if (!pro) {
                  setShowPro(true);
                  return;
                }
                setFull((v) => !v);
              }}
            >
              {U.fullMode}
              <i>PRO</i>
            </button>
          </div>
          <div className="rd-results">
            {results.map((t, i) => (
              <div
                key={t.href}
                className={`rd-result${i === active ? " is-active" : ""}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => {
                  router.push(t.href);
                  onClose();
                }}
              >
                <b>{t.title}</b>
                <small className={t.snippet ? "rd-snippet" : undefined}>
                  {t.snippet || t.subtitle}
                </small>
                <span className="zone">{t.type}</span>
              </div>
            ))}
            {results.length === 0 ? <div className="rd-palette-foot">{U.empty}</div> : null}
          </div>
          <div className="rd-palette-foot">
            <span>{U.hint[0]}</span>
            <span>{U.hint[1]}</span>
            <span style={{ marginLeft: "auto" }}>BuildHub</span>
          </div>
        </div>
      </div>
      {showPro && <ProModal locale={locale} onClose={() => setShowPro(false)} />}
    </>
  );
}
