"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import zhCatalogs from "@/data/catalogs.json";
import enCatalogs from "@/data/en-catalogs.json";

export type FlatTerm = {
  slug: string;
  name: string;
  en: string;
  tagline: string;
  zone: string;
};

const ZONES: Record<"zh" | "en", Record<string, string>> = {
  zh: {
    frontend: "前端",
    backend: "后端",
    product: "产品",
    testing: "测试",
    technology: "技术栈",
    ai: "AI",
    git: "Git",
    design: "设计风格",
    assets: "素材库",
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
    assets: "Assets",
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
          });
        }
    }
    return out;
  }, [locale]);
}

const UI = {
  zh: {
    placeholder: "搜索图鉴：试试「图标」「付费墙」…",
    aria: "搜索术语",
    empty: "没有匹配的条目",
    hint: ["↑↓ 选择", "↵ 打开"],
  },
  en: {
    placeholder: "Search the index: try “icon”, “paywall”…",
    aria: "Search terms",
    empty: "No matching entries",
    hint: ["↑↓ select", "↵ open"],
  },
};

export default function CommandPalette({
  locale,
  onClose,
}: {
  locale: "zh" | "en";
  onClose: () => void;
}) {
  const router = useRouter();
  const terms = useFlatTerms(locale);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const U = UI[locale];

  const results = useMemo(() => {
    const kw = q.trim().toLowerCase();
    const pool = kw
      ? terms.filter(
          (t) =>
            t.name.toLowerCase().includes(kw) ||
            t.en.toLowerCase().includes(kw) ||
            t.tagline.toLowerCase().includes(kw)
        )
      : terms;
    return pool.slice(0, kw ? 10 : 8);
  }, [q, terms]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") setActive((i) => Math.min(i + 1, results.length - 1));
      if (e.key === "ArrowUp") setActive((i) => Math.max(i - 1, 0));
      if (e.key === "Enter" && results[active]) {
        router.push(locale === "en" ? `/en/${results[active].slug}` : `/${results[active].slug}`);
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [results, active, router, onClose, locale]);

  return (
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
        <div className="rd-results">
          {results.map((t, i) => (
            <div
              key={t.slug}
              className={`rd-result${i === active ? " is-active" : ""}`}
              onMouseEnter={() => setActive(i)}
              onClick={() => {
                router.push(locale === "en" ? `/en/${t.slug}` : `/${t.slug}`);
                onClose();
              }}
            >
              <b>{t.name}</b>
              <small>{t.en}</small>
              <span className="zone">{t.zone}</span>
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
  );
}
