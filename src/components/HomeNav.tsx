"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BrandMark from "./BrandMark";
import CommandPalette from "./CommandPalette";
import LanguageToggle from "./LanguageToggle";
import { requireLogin, signOut } from "@/lib/auth-modal";
import { useMe } from "@/lib/favorites";

type Locale = "zh" | "en";

type Counts = {
  concepts: number;
  styles: number;
  stack: number;
  prompts: number;
  skills: number;
  products: number;
  playbooks: number;
};

type NavItem = {
  label: string;
  href?: string;
  items?: { label: string; href: string; note?: string }[];
};

function getNav(locale: Locale, counts?: Counts): NavItem[] {
  const zh = locale === "zh";
  const c = counts;
  return zh
    ? [
        {
          label: "知识库",
          items: [
            { label: "概念", href: "/topics/frontend", note: c ? `${c.concepts} 个词条` : undefined },
            { label: "技术选型", href: "/stack", note: c ? `${c.stack} 个选型` : undefined },
            { label: "技能", href: "/skills", note: c ? `${c.skills} 个` : undefined },
            { label: "架构", href: "/architecture" },
            { label: "工程实践", href: "/engineering" },
          ],
        },
        {
          label: "资源",
          items: [
            { label: "产品", href: "/products", note: c ? `${c.products} 个` : undefined },
            { label: "提示词", href: "/prompts", note: c ? `${c.prompts} 条` : undefined },
            { label: "设计", href: "/design", note: c ? `${c.styles} 个界面参考` : undefined },
            { label: "动效", href: "/distill", note: "能玩的交互" },
            { label: "专题", href: "/explains", note: "深度长文" },
            { label: "手册", href: "/playbooks", note: c ? `${c.playbooks} 本` : undefined },
            { label: "路径", href: "/paths" },
          ],
        },
        {
          label: "AI 工具",
          items: [
            { label: "BuildHub Skill", href: "/buildhub-skill", note: "装进 AI 工具" },
            { label: "练习", href: "/practice", note: "动手做" },
            { label: "AI Slop", href: "/anti-ai-flavor", note: "识别与修改" },
          ],
        },
      ]
    : [
        {
          label: "Library",
          items: [
            { label: "Concepts", href: "/en/topics/frontend", note: c ? `${c.concepts} terms` : undefined },
            { label: "Skills", href: "/en/skills", note: c ? `${c.skills} skills` : undefined },
          ],
        },
        {
          label: "Resources",
          items: [
            { label: "Showcase", href: "/en/products", note: c ? `${c.products} picks` : undefined },
            { label: "Prompts", href: "/en/prompts", note: c ? `${c.prompts} prompts` : undefined },
            { label: "Design", href: "/en/design", note: c ? `${c.styles} references` : undefined },
            { label: "Motion", href: "/en/distill", note: "Playable" },
          ],
        },
        {
          label: "Agent",
          items: [
            { label: "BuildHub Skill", href: "/en/buildhub-skill", note: "For your agent" },
            { label: "Practice", href: "/en/practice", note: "Hands-on" },
          ],
        },
        { label: "Changelog", href: "/en/changelog" },
      ];
}

const UI = {
  zh: {
    signIn: "登录",
    account: "账号",
    logout: "退出登录",
    cta: "逛概念",
    search: "搜索全站",
    menu: "菜单",
    close: "关闭",
    themeDark: "切换到浅色",
    themeLight: "切换到深色",
    language: "English",
    links: "导航",
  },
  en: {
    signIn: "Sign in",
    account: "Account",
    logout: "Sign out",
    cta: "Browse concepts",
    search: "Search",
    menu: "Menu",
    close: "Close",
    themeDark: "Switch to light",
    themeLight: "Switch to dark",
    language: "中文",
    links: "Navigation",
  },
};

export default function HomeNav({
  locale,
  isLight,
  onToggleMode,
  counts,
}: {
  locale: Locale;
  isLight: boolean;
  onToggleMode: () => void;
  counts?: Counts;
}) {
  const U = UI[locale];
  const nav = getNav(locale, counts);
  const base = locale === "en" ? "/en" : "";
  const me = useMe();
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [palette, setPalette] = useState(false);
  const [hl, setHl] = useState({ x: 0, w: 0, h: 0, on: false });
  const navRef = useRef<HTMLElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  function signIn() {
    requireLogin({ onDone: () => router.push(`${base}/account`) });
  }

  function focusHl(el: HTMLElement | null) {
    const center = centerRef.current;
    if (!el || !center) return;
    const c = center.getBoundingClientRect();
    const e = el.getBoundingClientRect();
    setHl({ x: e.left - c.left, w: e.width, h: e.height, on: true });
  }

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenItem(null);
        setMenuOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      const inField =
        e.target instanceof HTMLElement &&
        (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA");
      if ((e.key === "Escape" && (openItem || menuOpen)) || (e.key === "Escape" && palette)) {
        setOpenItem(null);
        setMenuOpen(false);
      }
      if (!inField && ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")) {
        e.preventDefault();
        setPalette(true);
      }
    }
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [openItem, menuOpen, palette]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    const current = navRef.current;
    if (!current) return;
    const nav = current;
    let scrolled = false;
    function onScroll() {
      const next = window.scrollY > 24;
      if (next === scrolled) return;
      scrolled = next;
      nav.classList.toggle("is-scrolled", next);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <nav className="rb-nav" ref={navRef} aria-label={U.links}>
        <div className="rb-nav-inner">
          <div className="rb-nav-left">
            <Link href={base || "/"} className="rb-brand" aria-label="BuildHub">
              <span className="rb-brand-mark"><BrandMark /></span>
              <span className="rb-brand-word">BuildHub</span>
            </Link>
          </div>

          <div
            className="rb-nav-center"
            ref={centerRef}
            onMouseLeave={() => setHl((cur) => ({ ...cur, on: false }))}
          >
            <span
              className="rb-nav-highlight"
              aria-hidden
              style={{
                width: hl.w,
                height: hl.h,
                opacity: hl.on ? 1 : 0,
                transform: `translate(${hl.x}px, -50%)`,
              }}
            />
            {nav.map((item) =>
              item.items ? (
                <div
                  key={item.label}
                  className={`rb-nav-drop${openItem === item.label ? " is-open" : ""}`}
                  onMouseEnter={() => setOpenItem(item.label)}
                  onMouseLeave={() => setOpenItem(null)}
                >
                  <button
                    type="button"
                    className="rb-nav-link rb-nav-trigger"
                    aria-expanded={openItem === item.label}
                    onMouseEnter={(e) => focusHl(e.currentTarget)}
                    onClick={() =>
                      setOpenItem((cur) => (cur === item.label ? null : item.label))
                    }
                  >
                    {item.label}
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                  <div className="rb-nav-pop" role="menu">
                    {item.items.map((sub) => (
                      <Link key={sub.href} href={sub.href} role="menuitem" onClick={() => setOpenItem(null)}>
                        <span>{sub.label}</span>
                        {sub.note ? <small>{sub.note}</small> : null}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <Link
                  key={item.label}
                  href={item.href ?? "#"}
                  className="rb-nav-link"
                  onMouseEnter={(e) => focusHl(e.currentTarget)}
                >
                  {item.label}
                </Link>
              )
            )}
          </div>

          <div className="rb-nav-right">
            <button
              type="button"
              className="rb-icon-btn rb-search-btn"
              aria-label={U.search}
              title={U.search}
              onClick={() => setPalette(true)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
            </button>
            <button
              type="button"
              className="rb-icon-btn rb-mode-btn"
              aria-label={isLight ? U.themeLight : U.themeDark}
              title={isLight ? U.themeLight : U.themeDark}
              onClick={onToggleMode}
            >
              {isLight ? (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20.5 14.1A8.7 8.7 0 0 1 9.9 3.5a8.8 8.8 0 1 0 10.6 10.6Z" />
                </svg>
              )}
            </button>
            <LanguageToggle locale={locale} className="rb-icon-btn rb-lang" />
            <span className="rb-nav-sep" aria-hidden />
            {me?.user ? (
              <>
                <button
                  type="button"
                  className="rb-nav-signin"
                  onClick={() => router.push(`${base}/account`)}
                >
                  {U.account}
                </button>
                <button type="button" className="rb-nav-signin" onClick={() => signOut()}>
                  {U.logout}
                </button>
              </>
            ) : (
              <button type="button" className="rb-nav-signin" onClick={signIn}>
                {U.signIn}
              </button>
            )}
            <Link href={`${base}/topics/frontend`} className="rb-cta rb-cta-nav">
              {U.cta}
            </Link>
            <button
              type="button"
              className="rb-burger"
              aria-label={U.menu}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span />
              <span />
            </button>
          </div>
        </div>
      </nav>

      {menuOpen ? (
        <div className="rb-mobile-menu" role="dialog" aria-modal="true" aria-label={U.menu}>
          <div className="rb-mobile-menu-head">
            <Link href={base || "/"} className="rb-brand" onClick={() => setMenuOpen(false)}>
              <span className="rb-brand-mark"><BrandMark /></span>
              <span className="rb-brand-word">BuildHub</span>
            </Link>
            <button type="button" className="rb-mobile-close" aria-label={U.close} onClick={() => setMenuOpen(false)}>
              ×
            </button>
          </div>
          <div className="rb-mobile-links">
            {nav.map((item) => (
              <div key={item.label} className="rb-mobile-group">
                {item.href ? (
                  <Link href={item.href} onClick={() => setMenuOpen(false)}>{item.label}</Link>
                ) : (
                  <>
                    <p>{item.label}</p>
                    {item.items?.map((sub) => (
                      <Link key={sub.href} href={sub.href} onClick={() => setMenuOpen(false)}>
                        {sub.label}
                        {sub.note ? <small>{sub.note}</small> : null}
                      </Link>
                    ))}
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="rb-mobile-actions">
            {me?.user ? (
              <>
                <Link
                  href={`${base}/account`}
                  className="rb-cta rb-cta-ghost"
                  onClick={() => setMenuOpen(false)}
                >
                  {U.account}
                </Link>
                <button
                  type="button"
                  className="rb-cta rb-cta-ghost"
                  onClick={() => {
                    setMenuOpen(false);
                    signOut();
                  }}
                >
                  {U.logout}
                </button>
              </>
            ) : (
              <button type="button" className="rb-cta rb-cta-ghost" onClick={signIn}>
                {U.signIn}
              </button>
            )}
            <Link
              href={`${base}/topics/frontend`}
              className="rb-cta rb-cta-solid"
              onClick={() => setMenuOpen(false)}
            >
              {U.cta}
            </Link>
            <Link href={base ? "/" : "/en"} className="rb-mobile-lang" onClick={() => setMenuOpen(false)}>
              {U.language}
            </Link>
          </div>
        </div>
      ) : null}

      {palette ? <CommandPalette locale={locale} onClose={() => setPalette(false)} /> : null}
    </>
  );
}
