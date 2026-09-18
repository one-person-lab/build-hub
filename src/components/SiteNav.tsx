"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import termsData from "@/data/terms.json";
import enTermsData from "@/data/en-terms.json";

type TermLite = { slug: string; name: string; en: string; summaryLead: string };

const toLite = (data: unknown) =>
  (data as TermLite[]).map((t) => ({
    slug: t.slug,
    name: t.name,
    en: t.en,
    summaryLead: t.summaryLead,
  }));

const TERMS_ZH = toLite(termsData);
const TERMS_EN = toLite(enTermsData);

type Locale = "zh" | "en";

// 英文站没有课程（原站 /en/courses 会 307 回 /courses）
const NAV_ITEMS: Record<Locale, { href: string; label: string }[]> = {
  zh: [
    { href: "/", label: "术语" },
    { href: "/practice", label: "练习" },
    { href: "/courses", label: "课程" },
    { href: "/products", label: "产品图鉴" },
    { href: "/skills", label: "技能库" },
    { href: "/prompts", label: "提示词" },
  ],
  en: [
    { href: "/en", label: "Terms" },
    { href: "/en/practice", label: "Practice" },
    { href: "/en/products", label: "Showcase" },
    { href: "/en/skills", label: "Skill Library" },
    { href: "/en/prompts", label: "Prompts" },
  ],
};

const NAV_UI: Record<
  Locale,
  {
    tagline: string;
    searchPlaceholder: string;
    searchLabel: string;
    chooseLanguage: string;
    themeColor: string;
    toDark: string;
    toLight: string;
    community: string;
  }
> = {
  zh: {
    tagline: "BuildHub · Vibe Coding 术语图鉴",
    searchPlaceholder: "搜索术语：试试「按钮」「登录弹窗」「返回顶部」…",
    searchLabel: "搜索组件、技术栈和 AI 术语",
    chooseLanguage: "选择语言",
    themeColor: "主题色",
    toDark: "切换到黑夜模式",
    toLight: "切换到白昼模式",
    community: "交流群",
  },
  en: {
    tagline: "BuildHub · Your Vibe Coding Guide",
    searchPlaceholder: "Search terms: try button, hover, dark mode…",
    searchLabel: "Search terms and components",
    chooseLanguage: "Choose language",
    themeColor: "Theme color",
    toDark: "Switch to dark mode",
    toLight: "Switch to light mode",
    community: "Community",
  },
};

const THEME_COLORS = [
  { name: "靛蓝", value: "#3559d8", hover: "#2a46b4", dark: "#7b93ea" },
  { name: "紫罗兰", value: "#7c3aed", hover: "#6d28d9", dark: "#a78bfa" },
  { name: "黛绿", value: "#0f766e", hover: "#115e59", dark: "#2dd4bf" },
  { name: "蜜橙", value: "#c2410c", hover: "#9a3412", dark: "#fb923c" },
  { name: "玫红", value: "#e11d48", hover: "#be123c", dark: "#fb7185" },
  { name: "樱粉", value: "#db2777", hover: "#be185d", dark: "#f472b6" },
  { name: "赤金", value: "#b45309", hover: "#92400e", dark: "#fbbf24" },
  { name: "石墨", value: "#525963", hover: "#414751", dark: "#b7bec9" },
];

function applyThemeColor(value: string, hover: string, dark: string) {
  const root = document.documentElement;
  root.style.setProperty("--theme-brand", value);
  root.style.setProperty("--theme-brand-hover", hover);
  root.style.setProperty("--theme-dark-brand", dark);
  localStorage.setItem("vh-theme-color", value);
}

export default function SiteNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [dark, setDark] = useState(false);
  const [q, setQ] = useState("");
  const [focused, setFocused] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [themeColor, setThemeColor] = useState<string | null>(null);
  const [communityOpen, setCommunityOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  // 当前语言直接由 URL 前缀决定，切换语言即切换路由
  const locale: Locale =
    pathname === "/en" || pathname.startsWith("/en/") ? "en" : "zh";
  const NAV = NAV_ITEMS[locale];
  const U = NAV_UI[locale];

  useEffect(() => {
    const saved = localStorage.getItem("vh-color-mode");
    const isDark =
      saved === "dark" ||
      (saved === null &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDark(isDark);
    document.documentElement.dataset.colorMode = isDark ? "dark" : "light";

    const savedColor = localStorage.getItem("vh-theme-color");
    const matched = THEME_COLORS.find((c) => c.value === savedColor);
    const initial = matched ?? THEME_COLORS[2]; // 黛绿
    setThemeColor(initial.value);
    applyThemeColor(initial.value, initial.hover, initial.dark);
  }, []);

  function toggleMode() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.colorMode = next ? "dark" : "light";
    localStorage.setItem("vh-color-mode", next ? "dark" : "light");
  }

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) {
        setThemeOpen(false);
      }
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // 交流群弹窗：ESC 关闭 + 锁定页面滚动
  useEffect(() => {
    if (!communityOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setCommunityOpen(false);
    }
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [communityOpen]);

  // 语言：URL 前缀 /en 决定当前语言，cookie 仅作记录
  function switchLang(next: Locale) {
    document.cookie = `vibehub-locale=${next}; path=/; max-age=31536000`;
    setLangOpen(false);
    if (next === "en") {
      router.push(pathname === "/" ? "/en" : `/en${pathname}`);
    } else {
      const stripped = pathname.replace(/^\/en(?=\/|$)/, "") || "/";
      router.push(stripped);
    }
  }

  // <html lang> 跟随语言
  useEffect(() => {
    document.documentElement.lang = locale === "en" ? "en-US" : "zh-CN";
  }, [locale]);

  const ql = q.trim().toLowerCase();
  const searchPool = locale === "en" ? TERMS_EN : TERMS_ZH;
  const results =
    ql.length > 0
      ? searchPool
          .filter(
            (t) =>
              t.name.toLowerCase().includes(ql) ||
              t.en.toLowerCase().includes(ql) ||
              t.slug.includes(ql)
          )
          .slice(0, 10)
      : [];
  const detailBase = locale === "en" ? "/en/" : "/";

  const isCurrent = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const skillHref = locale === "en" ? "/en/vibehub-skill" : "/vibehub-skill";
  const skillCurrent = pathname === skillHref;

  return (
    <>
      <nav className="nav">
      <div className="nav-left">
        <a className="vh-logo" href="/" aria-label="BuildHub" data-locale={locale}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="vh-logo-mark"
            src="/assets/buildhub-logo.png"
            alt=""
            width={20}
            height={20}
          />
          <span className="vh-logo-stage" aria-hidden="true">
            <span className="vh-word vh-word-brand">
              Build<b>Hub</b>
            </span>
            <span className="vh-word vh-word-tagline">{U.tagline}</span>
          </span>
        </a>
        <div className="nav-primary">
          {NAV.map((it) => (
            <a
              key={it.href}
              className={
                "nav-primary-item" + (isCurrent(it.href) ? " is-current" : "")
              }
              href={it.href}
              aria-current={isCurrent(it.href) ? "page" : undefined}
            >
              {it.label}
            </a>
          ))}
          <a
            className={
              "nav-skill-link" + (skillCurrent ? " is-current" : "")
            }
            href={skillHref}
            aria-label="BuildHub Skill"
            aria-current={skillCurrent ? "page" : undefined}
          >
            <i className="ti ti-ai-agent" aria-hidden="true" />
            <span>BuildHub Skill</span>
          </a>
          <button
            className="nav-primary-item nav-community-entry"
            type="button"
            aria-label={U.community}
            aria-haspopup="dialog"
            aria-expanded={communityOpen}
            aria-controls="community-dialog"
            onClick={() => setCommunityOpen(true)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8.5 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm7.2-1.2a2.8 2.8 0 1 0 0-5.6 2.8 2.8 0 0 0 0 5.6ZM2.8 19c.4-3.4 2.3-5.2 5.7-5.2s5.3 1.8 5.7 5.2H2.8Zm11.2-5.6c3.9-.5 6.2 1.4 6.6 4.6h-4.8" />
            </svg>
            <span className="nav-community-label">{U.community}</span>
          </button>
        </div>
      </div>
      <div className="nav-right">
        <div className="nav-search">
          <div className="search-box" ref={boxRef} style={{ position: "relative" }}>
            <span className="search-icon">⌕</span>
            <input
              placeholder={U.searchPlaceholder}
              aria-label={U.searchLabel}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onFocus={() => setFocused(true)}
            />
            {focused && results.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  left: 0,
                  right: 0,
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  boxShadow: "var(--shadow-card)",
                  overflow: "hidden",
                  zIndex: 100,
                }}
              >
                {results.map((r) => (
                  <a
                    key={r.slug}
                    href={detailBase + r.slug}
                    onClick={() => {
                      setFocused(false);
                      setQ("");
                    }}
                    style={{
                      display: "block",
                      padding: "10px 14px",
                      borderBottom: "1px solid var(--border-light)",
                      textDecoration: "none",
                      color: "var(--text)",
                      fontSize: 14,
                    }}
                  >
                    <strong>
                      {r.name} <span style={{ color: "var(--text-soft, #888)" }}>{r.en}</span>
                    </strong>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--text-soft, #888)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {r.summaryLead}
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="nav-language" ref={langRef}>
          <button
            className="nav-lang"
            type="button"
            aria-label={U.chooseLanguage}
            aria-haspopup="menu"
            aria-expanded={langOpen}
            onClick={() => setLangOpen((v) => !v)}
          >
            <span>{locale === "en" ? "English" : "中文"}</span>
            <i aria-hidden="true" />
          </button>
          {langOpen && (
            <div
              className="nav-popover nav-language-popover right"
              role="menu"
              aria-label={U.chooseLanguage}
            >
              <button
                className={
                  "nav-language-option" + (locale === "zh" ? " is-selected" : "")
                }
                type="button"
                role="menuitemradio"
                aria-checked={locale === "zh"}
                onClick={() => switchLang("zh")}
              >
                <span>中文</span>
                <i aria-hidden="true">{locale === "zh" ? "✓" : ""}</i>
              </button>
              <button
                className={
                  "nav-language-option" + (locale === "en" ? " is-selected" : "")
                }
                type="button"
                role="menuitemradio"
                aria-checked={locale === "en"}
                onClick={() => switchLang("en")}
              >
                <span>English</span>
                <i aria-hidden="true">{locale === "en" ? "✓" : ""}</i>
              </button>
            </div>
          )}
        </div>
        <div className="nav-theme" ref={themeRef}>
          <button
            className="nav-circle"
            type="button"
            title={U.themeColor}
            aria-label={U.themeColor}
            aria-haspopup="menu"
            aria-expanded={themeOpen}
            onClick={() => setThemeOpen((v) => !v)}
          />
          {themeOpen && (
            <div className="nav-popover right" role="menu" aria-label={U.themeColor}>
              {THEME_COLORS.map((c) => (
                <button
                  key={c.value}
                  className={"ts-dot" + (themeColor === c.value ? " on" : "")}
                  type="button"
                  title={c.name}
                  aria-label={c.name}
                  role="menuitemradio"
                  aria-checked={themeColor === c.value}
                  style={{ ["--c" as unknown as string]: c.value }}
                  onClick={() => {
                    setThemeColor(c.value);
                    applyThemeColor(c.value, c.hover, c.dark);
                    setThemeOpen(false);
                  }}
                />
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          className="nav-color-mode"
          aria-label={dark ? U.toLight : U.toDark}
          title={dark ? U.toLight : U.toDark}
          onClick={toggleMode}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <g className="color-mode-sun" strokeLinecap="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </g>
            <path
              className="color-mode-moon"
              strokeLinejoin="round"
              d="M20.5 14.1A8.7 8.7 0 0 1 9.9 3.5a8.8 8.8 0 1 0 10.6 10.6Z"
            />
          </svg>
        </button>
        <a
          className="nav-oil-link"
          href="https://oiloil.org/"
          target="_blank"
          rel="noreferrer"
          title="Oil 的个人网站"
          aria-label="访问 Oil 的个人网站"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/oil-favicon.png" alt="" width={20} height={20} />
          <span>Oil</span>
        </a>
      </div>
      </nav>
      {communityOpen && (
        <div
          className="community-dialog-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCommunityOpen(false);
          }}
        >
          <section
            className="community-dialog"
            id="community-dialog"
            role="dialog"
            aria-modal="true"
            aria-label={locale === "en" ? "Join the community" : "加入交流群"}
          >
            <header className="community-dialog-header">
              <span>{locale === "en" ? "COMMUNITY / WECHAT" : "交流群 / COMMUNITY"}</span>
              <button
                type="button"
                aria-label={locale === "en" ? "Close community dialog" : "关闭交流群弹窗"}
                onClick={() => setCommunityOpen(false)}
              >
                ×
              </button>
            </header>
            <div className="community-dialog-body">
              <div className="community-dialog-qr-grid">
                <div className="community-dialog-qr-item">
                  <div className="community-dialog-qr-caption">
                    <h2>{locale === "en" ? "BuildHub community · Group 6" : "BuildHub 交流 6 群"}</h2>
                    <p>
                      {locale === "en"
                        ? "Share AI tool tips and discuss your projects."
                        : "交流 AI 工具使用经验与项目实践。"}
                    </p>
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt={
                      locale === "en"
                        ? "WeChat QR code for BuildHub community group 6"
                        : "BuildHub 交流 6 群微信二维码"
                    }
                    src="/assets/vibehub-group-qr-6-20260913.jpg"
                  />
                  <a
                    className="community-dialog-save"
                    href="/assets/vibehub-group-qr-6-20260913.jpg"
                    download="vibehub-community-group-6.jpg"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 3v11m0 0 4-4m-4 4-4-4M5 17v2h14v-2" />
                    </svg>
                    <span>{locale === "en" ? "Save" : "保存"}</span>
                  </a>
                </div>
                <div className="community-dialog-qr-item">
                  <div className="community-dialog-qr-caption">
                    <h2>
                      {locale === "en" ? "GPT subscription services" : "GPT 订阅服务群"}
                    </h2>
                    <p>
                      {locale === "en"
                        ? "Ask about GPT and Codex subscriptions and payments."
                        : "咨询 GPT、Codex 订阅与充值服务。"}
                    </p>
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt={
                      locale === "en"
                        ? "WeChat QR code for GPT support group 1"
                        : "BuildHub GPT 补给站 1 群微信二维码"
                    }
                    src="/assets/vibehub-gpt-support-qr-1-20260913.jpg"
                  />
                  <a
                    className="community-dialog-save"
                    href="/assets/vibehub-gpt-support-qr-1-20260913.jpg"
                    download="vibehub-gpt-support-group-1.jpg"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 3v11m0 0 4-4m-4 4-4-4M5 17v2h14v-2" />
                    </svg>
                    <span>{locale === "en" ? "Save" : "保存"}</span>
                  </a>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
