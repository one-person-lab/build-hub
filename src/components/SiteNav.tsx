"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import CommandPalette from "@/components/CommandPalette";
import ProModal from "@/components/ProModal";

type Locale = "zh" | "en";

const THEME_COLORS = [
  { name: "图鉴金", value: "#8a6a1f", hover: "#6f5518", dark: "#e8c767" },
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

const SECTIONS: Record<Locale, { href: string; label: string }[]> = {
  zh: [
    { href: "/", label: "术语" },
    { href: "/skills", label: "技能" },
    { href: "/products", label: "产品" },
    { href: "/prompts", label: "提示词" },
  ],
  en: [
    { href: "/en", label: "Terms" },
    { href: "/en/skills", label: "Skills" },
    { href: "/en/products", label: "Showcase" },
    { href: "/en/prompts", label: "Prompts" },
  ],
};

const UI = {
  zh: {
    searchLabel: "搜索图鉴…",
    goPro: "Go Pro",
    toDark: "切换到黑夜模式",
    toLight: "切换到白昼模式",
    themeColor: "主题色",
    assets: "素材库",
    community: "交流群",
    changelog: "更新日志",
    practice: "练习",
    courses: "课程",
    skill: "BuildHub Skill",
    oil: "Oil 的个人网站",
    language: "语言",
    favorites: "收藏",
  },
  en: {
    searchLabel: "Search the index…",
    goPro: "Go Pro",
    toDark: "Switch to dark mode",
    toLight: "Switch to light mode",
    themeColor: "Theme color",
    assets: "Assets",
    community: "Community",
    changelog: "Changelog",
    practice: "Practice",
    courses: "Courses",
    skill: "BuildHub Skill",
    oil: "Oil's website",
    language: "Language",
    favorites: "Favorites",
  },
};

export default function SiteNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [dark, setDark] = useState(false);
  const [palette, setPalette] = useState(false);
  const [pro, setPro] = useState(false);
  const [menu, setMenu] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [themeColor, setThemeColor] = useState<string | null>(null);
  const [communityOpen, setCommunityOpen] = useState(false);
  const [favCount, setFavCount] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);

  const locale: Locale =
    pathname === "/en" || pathname.startsWith("/en/") ? "en" : "zh";
  const U = UI[locale];
  const base = locale === "en" ? "/en" : "";

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
    const initial = matched ?? THEME_COLORS[0]; // 图鉴金
    setThemeColor(initial.value);
    applyThemeColor(initial.value, initial.hover, initial.dark);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale === "en" ? "en-US" : "zh-CN";
  }, [locale]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const inField =
        e.target instanceof HTMLElement &&
        (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA");
      if (
        (e.key === "/" && !inField && !palette) ||
        ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")
      ) {
        e.preventDefault();
        setPalette(true);
      }
    }
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false);
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) setThemeOpen(false);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [palette]);

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

  function toggleMode() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.colorMode = next ? "dark" : "light";
    localStorage.setItem("vh-color-mode", next ? "dark" : "light");
  }

  function openMenu() {
    try {
      setFavCount(JSON.parse(localStorage.getItem("vh-favorites") || "[]").length);
    } catch {
      setFavCount(0);
    }
    setMenu((v) => !v);
  }

  // 语言：URL 前缀 /en 决定当前语言，cookie 仅作记录
  function switchLang(next: Locale) {
    document.cookie = `vibehub-locale=${next}; path=/; max-age=31536000`;
    setMenu(false);
    if (next === "en") {
      router.push(pathname === "/" ? "/en" : `/en${pathname}`);
    } else {
      const stripped = pathname.replace(/^\/en(?=\/|$)/, "") || "/";
      router.push(stripped);
    }
  }

  const isCurrent = (href: string) =>
    href === "/" || href === "/en"
      ? pathname === href
      : pathname === href || pathname.startsWith(href + "/");

  const skillHref = locale === "en" ? "/en/vibehub-skill" : "/vibehub-skill";

  return (
    <>
      <nav className="nav rd-nav">
        <a href={base || "/"} className="rd-brand" aria-label="BuildHub">
          <span className="rd-logo" aria-hidden>
            ✦
          </span>
          BuildHub
        </a>
        <div className="rd-sections" aria-label="内容分区">
          {SECTIONS[locale].map((s) => (
            <a
              key={s.href}
              href={s.href}
              className={isCurrent(s.href) ? "is-active" : ""}
              aria-current={isCurrent(s.href) ? "page" : undefined}
            >
              {s.label}
            </a>
          ))}
        </div>
        <a href={`${base}/topics/assets`} className="rd-pill">
          {U.assets}
        </a>
        <div className="rd-nav-right">
          <button className="rd-searchbtn" onClick={() => setPalette(true)}>
            <span aria-hidden>⌕</span>
            <span className="rd-searchlabel">{U.searchLabel}</span>
            <kbd>/</kbd>
          </button>
          <button className="rd-gopro" onClick={() => setPro(true)}>
            {U.goPro}
          </button>
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
          <div ref={menuRef} className="rd-avatar-wrap">
            <button className="rd-avatar" onClick={openMenu} aria-label="账号与更多" aria-haspopup="menu" aria-expanded={menu}>
              ✦
            </button>
            {menu ? (
              <div className="rd-menu" role="menu">
                {SECTIONS[locale].map((s) => (
                  <button key={s.href} className="nv-mob-only" onClick={() => (window.location.href = s.href)}>
                    {s.label}
                  </button>
                ))}
                <button className="nv-mob-only" onClick={() => (window.location.href = `${base}/topics/assets`)}>
                  {U.assets}
                </button>
                <span className="rd-menu-sep" aria-hidden />
                <button
                  onClick={() => {
                    setMenu(false);
                    setCommunityOpen(true);
                  }}
                >
                  {U.community}
                </button>
                <button onClick={() => (window.location.href = `${base}/changelog`)}>{U.changelog}</button>
                <button onClick={() => (window.location.href = `${base}/practice`)}>{U.practice}</button>
                {locale === "zh" && (
                  <button onClick={() => (window.location.href = "/courses")}>{U.courses}</button>
                )}
                <button onClick={() => (window.location.href = skillHref)}>{U.skill}</button>
                <a href="https://oiloil.org/" target="_blank" rel="noreferrer">
                  {U.oil}
                </a>
                <span className="rd-menu-sep" aria-hidden />
                <div className="rd-menu-fav">
                  <span>★ {U.favorites}</span>
                  <b>{favCount}</b>
                </div>
                <div className="rd-menu-lang">
                  <button
                    className={locale === "zh" ? "is-selected" : ""}
                    role="menuitemradio"
                    aria-checked={locale === "zh"}
                    onClick={() => switchLang("zh")}
                  >
                    中文
                  </button>
                  <button
                    className={locale === "en" ? "is-selected" : ""}
                    role="menuitemradio"
                    aria-checked={locale === "en"}
                    onClick={() => switchLang("en")}
                  >
                    English
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
        {palette ? <CommandPalette locale={locale} onClose={() => setPalette(false)} /> : null}
        {pro ? <ProModal locale={locale} onClose={() => setPro(false)} /> : null}
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
