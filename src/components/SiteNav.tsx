"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import CommandPalette from "@/components/CommandPalette";
import ProModal from "@/components/ProModal";
import FavoritesSync from "@/components/FavoritesSync";
import {
  COLOR_MODE_KEY,
  THEME_COLORS,
  THEME_COLOR_KEY,
  applyThemeColor,
} from "@/lib/theme";

type Locale = "zh" | "en";

const SECTIONS: Record<Locale, { href: string; label: string }[]> = {
  zh: [
    { href: "/topics/frontend", label: "概念" },
    { href: "/principles", label: "原理" },
    { href: "/skills", label: "技能" },
    { href: "/products", label: "产品" },
    { href: "/prompts", label: "提示词" },
    { href: "/design", label: "设计" },
    { href: "/distill", label: "动效" },
    { href: "/explains", label: "专题" },
    { href: "/playbooks", label: "手册" },
  ],
  en: [
    { href: "/en/topics/frontend", label: "Concepts" },
    { href: "/en/skills", label: "Skills" },
    { href: "/en/products", label: "Showcase" },
    { href: "/en/prompts", label: "Prompts" },
    { href: "/en/design", label: "Design" },
    { href: "/en/distill", label: "Motion" },
  ],
};

const UI = {
  zh: {
    searchLabel: "搜索概念…",
    goPro: "Go Pro",
    toDark: "切换到黑夜模式",
    toLight: "切换到白昼模式",
    themeColor: "主题色",
    community: "交流群",
    changelog: "更新日志",
    practice: "练习",
    courses: "课程",
    skill: "BuildHub Skill",
    personalSite: "个人网站",
    language: "语言",
    favorites: "收藏",
    account: "账号",
    menu: "菜单",
    closeMenu: "关闭菜单",
    groupSections: "内容分区",
    groupMore: "更多",
    groupAccount: "账号与语言",
  },
  en: {
    searchLabel: "Search the index…",
    goPro: "Go Pro",
    toDark: "Switch to dark mode",
    toLight: "Switch to light mode",
    themeColor: "Theme color",
    community: "Community",
    changelog: "Changelog",
    practice: "Practice",
    courses: "Courses",
    skill: "BuildHub Skill",
    personalSite: "Website",
    language: "Language",
    favorites: "Favorites",
    account: "Account",
    menu: "Menu",
    closeMenu: "Close menu",
    groupSections: "Sections",
    groupMore: "More",
    groupAccount: "Account & language",
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
  const [me, setMe] = useState<{ user: { email: string } | null; pro: boolean } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);

  const locale: Locale =
    pathname === "/en" || pathname.startsWith("/en/") ? "en" : "zh";
  const U = UI[locale];
  const base = locale === "en" ? "/en" : "";

  useEffect(() => {
    const load = () =>
      fetch("/api/me")
        .then((r) => r.json())
        .then((d) => setMe(d))
        .catch(() => {});
    load();
    window.addEventListener("vh-me-changed", load);
    return () => window.removeEventListener("vh-me-changed", load);
  }, []);

  useEffect(() => {
    // data-color-mode 与主题色已由 <head> 内的初始化脚本在首屏前写好，这里只同步按钮状态
    setDark(document.documentElement.dataset.colorMode === "dark");

    const savedColor = localStorage.getItem(THEME_COLOR_KEY);
    const matched = THEME_COLORS.find((c) => c.value === savedColor);
    setThemeColor((matched ?? THEME_COLORS[0]).value);
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

  // 抽屉只在手机上以底部弹层出现，此时锁定背景滚动
  useEffect(() => {
    if (!menu) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenu(false);
    }
    const isSheet = window.matchMedia("(max-width: 900px)").matches;
    const prevOverflow = document.body.style.overflow;
    if (isSheet) document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [menu]);

  function toggleMode() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.colorMode = next ? "dark" : "light";
    localStorage.setItem(COLOR_MODE_KEY, next ? "dark" : "light");
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
        <div className="rd-nav-right">
          <button className="rd-searchbtn" onClick={() => setPalette(true)}>
            <span aria-hidden>⌕</span>
            <span className="rd-searchlabel">{U.searchLabel}</span>
            <kbd>/</kbd>
          </button>
          {me?.user ? (
            <a
              className={`rd-gopro${me.pro ? " is-pro" : ""}`}
              href={`${base}/account`}
            >
              {me.pro ? "✦ PRO" : U.account}
            </a>
          ) : (
            <button className="rd-gopro" onClick={() => setPro(true)}>
              {U.goPro}
            </button>
          )}
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
            <button className="rd-avatar" onClick={openMenu} aria-label={U.menu} aria-haspopup="menu" aria-expanded={menu}>
              ✦<span className="rd-avatar-mob">{U.menu}</span>
            </button>
            {menu ? <div className="rd-menu-scrim" aria-hidden onClick={() => setMenu(false)} /> : null}
            {menu ? (
              <div className="rd-menu" role="menu" aria-label={U.menu}>
                <header className="rd-menu-head">
                  <span>{U.menu}</span>
                  <button
                    type="button"
                    className="rd-menu-close"
                    aria-label={U.closeMenu}
                    onClick={() => setMenu(false)}
                  >
                    ×
                  </button>
                </header>
                <div className="rd-menu-group rd-menu-sections">
                  <p className="rd-menu-label">{U.groupSections}</p>
                  <div className="rd-menu-grid">
                    {SECTIONS[locale].map((s) => (
                      <a
                        key={s.href}
                        href={s.href}
                        className={isCurrent(s.href) ? "is-active" : ""}
                        role="menuitem"
                      >
                        {s.label}
                      </a>
                    ))}
                  </div>
                </div>
                <span className="rd-menu-sep" aria-hidden />
                <div className="rd-menu-group rd-menu-group-more">
                  <p className="rd-menu-label">{U.groupMore}</p>
                  <a href={`${base}/practice`} role="menuitem">{U.practice}</a>
                  {locale === "zh" && (
                    <a href="/courses" role="menuitem">{U.courses}</a>
                  )}
                  <a href={skillHref} role="menuitem">{U.skill}</a>
                  <a href="https://lab.smzsapp.com/" target="_blank" rel="noreferrer" className="rd-menu-site">
                    <span className="rd-menu-site-mark" aria-hidden>✦</span>
                    {U.personalSite}
                  </a>
                </div>
                <span className="rd-menu-sep" aria-hidden />
                <div className="rd-menu-group">
                  <p className="rd-menu-label">{U.groupAccount}</p>
                  <button
                    onClick={() => {
                      setMenu(false);
                      setCommunityOpen(true);
                    }}
                  >
                    {U.community}
                  </button>
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
              </div>
            ) : null}
          </div>
        </div>
        {palette ? <CommandPalette locale={locale} onClose={() => setPalette(false)} /> : null}
        {pro ? <ProModal locale={locale} onClose={() => setPro(false)} /> : null}
        <FavoritesSync />
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
            aria-label={locale === "en" ? "Add me on WeChat" : "加我微信"}
          >
            <header className="community-dialog-header">
              <span>{locale === "en" ? "WECHAT" : "加我微信 / WECHAT"}</span>
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
                    <h2>{locale === "en" ? "Add me on WeChat" : "加我微信"}</h2>
                    <p>
                      {locale === "en"
                        ? "Ask about AI tools, your projects, and GPT or Codex subscriptions."
                        : "聊 AI 工具、项目实践，或者问 GPT、Codex 订阅，都可以直接找我。"}
                    </p>
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt={
                      locale === "en"
                        ? "Scan to add me on WeChat"
                        : "扫描二维码，添加我为朋友"
                    }
                    src="/assets/wechat-qr.png"
                  />
                  <a
                    className="community-dialog-save"
                    href="/assets/wechat-qr.png"
                    download="wechat-qr.png"
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
