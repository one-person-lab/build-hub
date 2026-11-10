"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import catalogsData from "@/data/catalogs.json";
import enCatalogsData from "@/data/en-catalogs.json";
import assetsData from "@/data/assets.json";
import enAssetsData from "@/data/en-assets.json";
import AuthBlockModal from "@/components/AuthBlockModal";
import AuthBlockThumb, {
  AUTH_BLOCK_H,
  AUTH_BLOCK_W,
  FOOTER_BLOCK_H,
  FOOTER_BLOCK_W,
} from "@/components/AuthBlockThumb";
import CardDemoThumb from "@/components/CardDemoThumb";
import NavDemoThumb from "@/components/NavDemoThumb";
import MotionDetailModal from "@/components/MotionDetailModal";
import NavStyleModal from "@/components/NavStyleModal";
import ProModal from "@/components/ProModal";
import { useFavorites } from "@/lib/favorites";
import type { Platform } from "@/lib/types";
import "./AssetLibraryView.css";

type Term = {
  slug: string;
  name: string;
  en: string;
  tagline: string;
  platform?: Platform;
  tags?: string[];
  demoHtml?: string;
  demoClass?: string;
  /** 认证页 block：指向 /public 下的独立预览页 */
  src?: string;
  /** 缩略图居中放大倍数（内容只占画布一小块的窄卡片用） */
  zoom?: number;
  source?: string;
  /** 收录条目的卡面预览图（本地镜像） */
  img?: string;
  /** 收录条目的演示视频（本地镜像，卡片进视口自动播） */
  video?: string;
};
type Group = {
  id: string;
  title: string;
  count: number;
  category?: string;
  subgroup?: string;
  /** 分组决策路径：只在选型分区使用 */
  intro?: string;
  terms: Term[];
};
type Catalog = {
  key: string;
  href: string;
  title: string;
  /** 页首方法说明：只在选型分区使用 */
  intro?: string;
  tabs?: { label: string; count: number; active: boolean }[];
  /** 独立分区的页内分类 chips；缺省时沿用概念分区的页签 */
  categories?: { key: string; label: string }[];
  sidebar: string[];
  groups: Group[];
};

const ZH_CATALOGS = catalogsData as unknown as Catalog[];
const EN_CATALOGS = enCatalogsData as unknown as Catalog[];

type AssetStyle = {
  id: string;
  name: string;
  en: string;
  tagline: string;
  subgroup?: string;
  cases: { brand: string; image: string; bg?: string }[];
};
type AssetLibrary = {
  categories: { key: string; label: string; styles: AssetStyle[] }[];
};
const ZH_ASSETS = assetsData as unknown as AssetLibrary;
const EN_ASSETS = enAssetsData as unknown as AssetLibrary;

// tab 标签与概念 catalog key 顺序一一对应
const TAB_LABELS: Record<string, Record<string, string>> = {
  zh: {
    frontend: "前端",
    backend: "后端",
    product: "产品",
    testing: "测试",
    technology: "技术栈",
    ai: "AI",
    git: "Git",
  },
  en: {
    frontend: "Frontend",
    backend: "Backend",
    product: "Product",
    testing: "Testing",
    technology: "Tech Stack",
    ai: "AI",
    git: "Git",
  },
};
const TAB_ORDER = Object.keys(TAB_LABELS.zh);

export type Locale = "zh" | "en";

type PlatformFilter = "all" | "web" | "ios";
const PLATFORM_ORDER: PlatformFilter[] = ["all", "web", "ios"];
const PLATFORM_LABELS: Record<Locale, Record<PlatformFilter, string>> = {
  zh: { all: "全部", web: "Web", ios: "iOS" },
  en: { all: "All", web: "Web", ios: "iOS" },
};
// 词条未标注 platform 时按「web」处理，cross 两边都算
const platformOf = (t: Term): Platform => t.platform ?? "web";
const matchesPlatform = (t: Term, f: PlatformFilter) =>
  f === "all" || platformOf(t) === "cross" || platformOf(t) === f;

const UI_TEXT = {
  zh: { favorites: "收藏", termCount: "个条目", favoriteTerm: "收藏概念", platform: "平台", liveToc: "实时目录", filterConcepts: "筛选概念", filterCatalog: "筛选分类" },
  en: { favorites: "Favorites", termCount: "entries", favoriteTerm: "Add to favorites", platform: "Platform", liveToc: "On this page", filterConcepts: "Filter concepts", filterCatalog: "Filter categories" },
};

// Share 链接的 ?c= 参数 → 交互动画词条 slug
const MOTION_SLUG_BY_C: Record<string, string> = {
  carousel: "motion-card-carousel",
  dot: "motion-dot-intro",
  onboarding: "motion-dark-onboarding",
  bounce: "motion-bounce-cards",
};

const STAR_PATH =
  "M23.9986 5L17.8856 17.4776L4 19.4911L14.0589 29.3251L11.6544 43L23.9986 36.4192L36.3454 43L33.9586 29.3251L44 19.4911L30.1913 17.4776L23.9986 5Z";

/**
 * 「独立预览页 + 等比缩略 + 大图弹层」的分类：认证页与页脚走同一套渲染，
 * 只差各自的画布尺寸和深链参数。
 */
const BLOCK_CATS: Record<string, { param: string; w: number; h: number }> = {
  auth: {
    param: "auth",
    w: AUTH_BLOCK_W,
    h: AUTH_BLOCK_H,
  },
  footer: {
    param: "footer",
    w: FOOTER_BLOCK_W,
    h: FOOTER_BLOCK_H,
  },
};

export default function CatalogView({
  catalogKey,
  locale = "zh",
}: {
  catalogKey: string;
  locale?: Locale;
}) {
  const router = useRouter();
  const CATALOGS = locale === "en" ? EN_CATALOGS : ZH_CATALOGS;
  const L = TAB_LABELS[locale];
  const PL = PLATFORM_LABELS[locale];
  const T = UI_TEXT[locale];
  const detailBase = locale === "en" ? "/en/" : "/";
  const catalog = useMemo(
    () => CATALOGS.find((c) => c.key === catalogKey) ?? CATALOGS[0],
    [CATALOGS, catalogKey]
  );
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("all");

  // 平台筛选：概念目录里确实存在非 Web 词条时才出现；设计页用 APP/网页分类替代
  const platformEnabled =
    catalog.key !== "design" &&
    catalog.groups.some((g) => g.terms.some((t) => platformOf(t) !== "web"));
  const activePlatform = platformEnabled ? platformFilter : "all";
  const platformCounts = useMemo(() => {
    const terms = catalog.groups.flatMap((g) => g.terms);
    return {
      all: terms.length,
      web: terms.filter((t) => matchesPlatform(t, "web")).length,
      ios: terms.filter((t) => matchesPlatform(t, "ios")).length,
    } as Record<PlatformFilter, number>;
  }, [catalog]);
  const groups = useMemo(
    () =>
      catalog.groups
        .map((g) => {
          if (g.subgroup) return g; // 图标风格虚拟分组：卡片来自 assets.json
          const terms = g.terms.filter((t) => matchesPlatform(t, activePlatform));
          return { ...g, terms, count: terms.length };
        })
        .filter((g) => g.count > 0),
    [catalog, activePlatform]
  );

  const [activeCat, setActiveCat] = useState<string>(catalog.categories?.[0]?.key ?? "");
  const [motionSlug, setMotionSlug] = useState<string | null>(null);
  const [navSlug, setNavSlug] = useState<string | null>(null);
  // 导航样式没有独立详情页：卡片点开大图预览，?nav=slug 可直接深链到某一条
  const navTerms = useMemo(
    () =>
      catalog.groups
        .filter((g) => g.category === "navigation")
        .flatMap((g) => g.terms),
    [catalog]
  );
  useEffect(() => {
    if (catalog.key !== "design") return;
    const slug = new URLSearchParams(window.location.search).get("nav");
    if (slug && navTerms.some((t) => t.slug === slug)) {
      setNavSlug(slug);
      setActiveCat("navigation");
    }
  }, [catalog.key, navTerms]);
  const openNav = (slug: string) => {
    setNavSlug(slug);
    const url = new URL(window.location.href);
    url.searchParams.set("nav", slug);
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
  };
  const closeNav = () => {
    setNavSlug(null);
    const url = new URL(window.location.href);
    if (!url.searchParams.has("nav")) return;
    url.searchParams.delete("nav");
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
  };
  // block 分类（认证页 / 页脚）：卡片点开大图弹层，?<param>=slug 可深链到某一条
  const blockTerms = useMemo(() => {
    const m: Record<string, (Term & { src: string })[]> = {};
    for (const g of catalog.groups) {
      if (!g.category || !BLOCK_CATS[g.category]) continue;
      (m[g.category] ??= []).push(
        ...g.terms.filter((t): t is Term & { src: string } => Boolean(t.src))
      );
    }
    return m;
  }, [catalog]);
  const [block, setBlock] = useState<{ cat: string; slug: string } | null>(null);
  useEffect(() => {
    if (catalog.key !== "design") return;
    const query = new URLSearchParams(window.location.search);
    for (const [cat, cfg] of Object.entries(BLOCK_CATS)) {
      const slug = query.get(cfg.param);
      if (slug && blockTerms[cat]?.some((t) => t.slug === slug)) {
        setBlock({ cat, slug });
        setActiveCat(cat);
        return;
      }
    }
  }, [catalog.key, blockTerms]);
  const openBlock = (cat: string, slug: string) => {
    setBlock({ cat, slug });
    const url = new URL(window.location.href);
    url.searchParams.set(BLOCK_CATS[cat].param, slug);
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
  };
  const closeBlock = () => {
    if (!block) return;
    const param = BLOCK_CATS[block.cat].param;
    setBlock(null);
    const url = new URL(window.location.href);
    if (!url.searchParams.has(param)) return;
    url.searchParams.delete(param);
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
  };
  // demo 的 Share 链接带 ?c=carousel / ?c=dot：打开动效页时直接点开对应弹层
  useEffect(() => {
    if (catalog.key !== "motion") return;
    const slug = MOTION_SLUG_BY_C[new URLSearchParams(window.location.search).get("c") ?? ""];
    if (slug) setMotionSlug(slug);
  }, [catalog.key]);
  // 独立分区（设计、选型）按页内分类 chips 过滤，概念分区一次铺开所有分组
  const visibleGroups = useMemo(
    () =>
      catalog.categories
        ? groups.filter((g) => g.category === activeCat)
        : groups,
    [catalog, groups, activeCat]
  );
  const catCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const g of groups) m[g.category ?? ""] = (m[g.category ?? ""] ?? 0) + g.count;
    return m;
  }, [groups]);

  // 设计分区页：App 图标风格分组的卡片数据来自 assets.json
  const iconStyleCat =
    catalog.key === "design"
      ? (locale === "en" ? EN_ASSETS : ZH_ASSETS).categories.find(
          (c) => c.key === "app-icon-style"
        )
      : undefined;

  // 收藏：非 PRO 到 20 条时不写本地，直接弹开通卡
  const { favorites, toggle: toggleFavorite, limitHit, dismissLimit } = useFavorites();

  // Scroll spy：根据当前进入视口的分组 section 高亮左侧实时目录
  useEffect(() => {
    const sections = visibleGroups
      .map((g) => document.getElementById(g.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (sections.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .map((e) => e.target as HTMLElement);
        if (visible.length === 0) return;
        const topmost = visible.reduce((a, b) =>
          a.getBoundingClientRect().top < b.getBoundingClientRect().top ? a : b
        );
        setActiveGroup(topmost.id);
      },
      { rootMargin: "-150px 0px -55% 0px", threshold: 0 }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [catalog.key, visibleGroups]);

  // 顶部筛选栏粘住时切到带背景的状态（原站 .catalog-finder.is-stuck：
  // ::before 淡入毛玻璃底 + 底边线 + 阴影，避免正文从栏下穿过）。
  // 原站实测有约 80px 的滞后（贴上去了但还没加背景），这里提前到「刚贴上导航栏」，
  // 否则刚滚动的一段里卡片文字会被切掉一半。
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
      const stuck = finder.getBoundingClientRect().top <= navHeight() + 1;
      finder.classList.toggle("is-stuck", stuck);
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
  }, [catalog.key]);

  return (
    <main>
    <div className="catalog-page catalog-directory-page">
      <div className="catalog-layout catalog-directory-layout">
        <span className="catalog-finder-sentinel" aria-hidden="true" />
        <section className="catalog-finder" aria-label={catalog.categories ? T.filterCatalog : T.filterConcepts}>
          <div className="catalog-finder-row">
            <div className="catalog-filter-list">
              {catalog.categories
                ? catalog.categories.map((cat) => {
                    const active = activeCat === cat.key;
                    return (
                      <button
                        key={cat.key}
                        type="button"
                        className="catalog-filter-chip"
                        aria-pressed={active}
                        onClick={() => {
                          setActiveCat(cat.key);
                          window.scrollTo({ top: 0 });
                        }}
                      >
                        {cat.label}
                        <span>{catCounts[cat.key] ?? 0}</span>
                      </button>
                    );
                  })
                : TAB_ORDER.map((key) => {
                    const c = CATALOGS.find((x) => x.key === key);
                    const total =
                      c?.tabs?.find((t) => L[key] === t.label)?.count ??
                      c?.tabs?.[0]?.count ??
                      0;
                    const active = key === catalog.key;
                    return (
                      <button
                        key={key}
                        type="button"
                        className="catalog-filter-chip"
                        aria-pressed={active}
                        onClick={() =>
                          router.push(c?.href ?? (locale === "en" ? "/en" : "/"))
                        }
                      >
                        {L[key]}
                        <span>{total}</span>
                      </button>
                    );
                  })}
            </div>
          </div>
          {platformEnabled && (
            <div className="catalog-finder-row catalog-platform-row">
              <span className="catalog-platform-label">{T.platform}</span>
              <div className="catalog-filter-list">
                {PLATFORM_ORDER.map((k) => (
                  <button
                    key={k}
                    type="button"
                    className="catalog-filter-chip"
                    aria-pressed={activePlatform === k}
                    onClick={() => setPlatformFilter(k)}
                  >
                    {PL[k]}
                    <span>{platformCounts[k]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
        <aside className="cat-live-toc" aria-label={T.liveToc}>
          <nav className="cat-live-toc-nav">
            {visibleGroups.map((g) => (
              <button
                key={g.id}
                type="button"
                className={
                  "cat-live-toc-item" + (activeGroup === g.id ? " is-active" : "")
                }
                onClick={() =>
                  document
                    .getElementById(g.id)
                    ?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
              >
                <span>{g.title}</span>
                <em>{g.count}</em>
              </button>
            ))}
          </nav>
        </aside>
        <div className="grid-wrap">
          {catalog.key === "motion" ? null : (
            <header className="catalog-heading">
              <h1>{catalog.title}</h1>
              {catalog.intro ? <p className="cat-page-intro">{catalog.intro}</p> : null}
            </header>
          )}
          {visibleGroups.map((g) => {
            // 认证页 / 页脚分组：卡片是真实 block 的等比缩略（iframe），点开进入大图弹层
            const blockCat = g.category && BLOCK_CATS[g.category] ? g.category : undefined;
            if (blockCat) {
              const cfg = BLOCK_CATS[blockCat];
              return (
                <section className="cat-section" id={g.id} key={g.id}>
                  <h2 className="cat-title">
                    {g.title}
                    <span>
                      {g.count} {T.termCount}
                    </span>
                  </h2>
                  <div className="grid">
                    {g.terms.map((t) => (
                      <article
                        className="card"
                        data-id={t.slug}
                        key={t.slug}
                        style={{ cursor: "pointer" }}
                        onClick={() => openBlock(blockCat, t.slug)}
                      >
                        <div className="card-thumb">
                          <AuthBlockThumb
                            src={t.src ?? ""}
                            title={t.name}
                            w={cfg.w}
                            h={cfg.h}
                            zoom={t.zoom ?? 1}
                          />
                        </div>
                        <div className="card-head">
                          <a
                            className="card-title-group card-title-link"
                            href={`${detailBase}design?${cfg.param}=${t.slug}`}
                            aria-label={t.name}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              openBlock(blockCat, t.slug);
                            }}
                          >
                            <h3>
                              {t.name}
                              {t.en ? <span>{t.en}</span> : null}
                            </h3>
                          </a>
                          <button
                            type="button"
                            className={`favorite-button${favorites.has(t.slug) ? " is-saved" : ""}`}
                            aria-label={T.favoriteTerm}
                            aria-pressed={favorites.has(t.slug)}
                            title={T.favoriteTerm}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(t.slug);
                            }}
                          >
                            <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
                              <path d={STAR_PATH} />
                            </svg>
                          </button>
                        </div>
                        <div className="card-tagline card-quote">{t.tagline}</div>
                      </article>
                    ))}
                  </div>
                </section>
              );
            }
            // 导航样式分组：卡片点开预览弹层，可左右切换全部导航条目
            if (g.category === "navigation") {
              return (
                <section className="cat-section" id={g.id} key={g.id}>
                  <h2 className="cat-title">
                    {g.title}
                    <span>
                      {g.count} {T.termCount}
                    </span>
                  </h2>
                  <div className="grid">
                    {g.terms.map((t) => (
                      <article
                        className="card"
                        data-id={t.slug}
                        key={t.slug}
                        style={{ cursor: "pointer" }}
                        onClick={() => openNav(t.slug)}
                      >
                        <NavDemoThumb slug={t.slug} className="card-thumb" />
                        <div className="card-head">
                          <a
                            className="card-title-group card-title-link"
                            href={`${detailBase}design?nav=${t.slug}`}
                            aria-label={t.name}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              openNav(t.slug);
                            }}
                          >
                            <h3>
                              {t.name}
                              {t.en ? <span>{t.en}</span> : null}
                            </h3>
                          </a>
                          <button
                            type="button"
                            className={`favorite-button${favorites.has(t.slug) ? " is-saved" : ""}`}
                            aria-label={T.favoriteTerm}
                            aria-pressed={favorites.has(t.slug)}
                            title={T.favoriteTerm}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(t.slug);
                            }}
                          >
                            <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
                              <path d={STAR_PATH} />
                            </svg>
                          </button>
                        </div>
                        <div className="card-tagline card-quote">{t.tagline}</div>
                      </article>
                    ))}
                  </div>
                </section>
              );
            }
            // 动效分区：普通卡片网格，点开卡片进入详情弹层（站内 demo 直接跑，收录的播原版视频 + 原链 + 提示词）
            if (catalog.key === "motion") {
              return (
                <section className="cat-section" id={g.id} key={g.id}>
                  <h2 className="cat-title">
                    {g.title}
                    <span>
                      {g.count} {T.termCount}
                    </span>
                  </h2>
                  <div className="grid">
                    {g.terms.map((t) => (
                      <article
                        className="card"
                        data-id={t.slug}
                        key={t.slug}
                        style={{ cursor: "pointer" }}
                        onClick={() => setMotionSlug(t.slug)}
                      >
                        <CardDemoThumb
                          demoHtml={t.demoHtml}
                          demoClass={t.demoClass}
                          img={t.img}
                          video={t.video}
                        />
                        <div className="card-head">
                          <a
                            className="card-title-group card-title-link"
                            href={detailBase + t.slug}
                            aria-label={t.name}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setMotionSlug(t.slug);
                            }}
                          >
                            <h3>
                              {t.name}
                              {t.en ? <span>{t.en}</span> : null}
                            </h3>
                          </a>
                          <button
                            type="button"
                            className={`favorite-button${favorites.has(t.slug) ? " is-saved" : ""}`}
                            aria-label={T.favoriteTerm}
                            aria-pressed={favorites.has(t.slug)}
                            title={T.favoriteTerm}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(t.slug);
                            }}
                          >
                            <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
                              <path d={STAR_PATH} />
                            </svg>
                          </button>
                        </div>
                        <div className="card-tagline card-quote">{t.tagline}</div>
                      </article>
                    ))}
                  </div>
                  {motionSlug && g.terms.some((t) => t.slug === motionSlug) && (
                    <MotionDetailModal
                      terms={g.terms}
                      slug={motionSlug}
                      onSlugChange={setMotionSlug}
                      onClose={() => setMotionSlug(null)}
                      locale={locale}
                    />
                  )}
                </section>
              );
            }
            const iconStyles =
              g.subgroup && iconStyleCat
                ? iconStyleCat.styles.filter((s) => s.subgroup === g.subgroup)
                : null;
            if (g.subgroup && !iconStyles) return null;
            return (
              <section className="cat-section" id={g.id} key={g.id}>
                <h2 className="cat-title">
                  {g.title}
                  <span>
                    {(iconStyles ? iconStyles.length : g.count)} {T.termCount}
                  </span>
                </h2>
                {g.intro ? <p className="cat-intro">{g.intro}</p> : null}
                {iconStyles ? (
                  <div className="grid">
                    {iconStyles.map((s) => (
                      <article
                        className="card"
                        data-id={s.id}
                        key={s.id}
                        style={{ cursor: "pointer" }}
                        onClick={() => router.push(`${detailBase}assets/${s.id}`)}
                      >
                        <div className="card-thumb">
                          <div className="asset-case-strip" aria-hidden="true">
                            {s.cases.slice(0, 3).map((cs) => (
                              <img src={cs.image} alt="" loading="lazy" key={cs.brand} />
                            ))}
                          </div>
                        </div>
                        <div className="card-head">
                          <a
                            className="card-title-group card-title-link"
                            href={`${detailBase}assets/${s.id}`}
                            aria-label={s.name}
                          >
                            <h3>
                              {s.name}
                              {s.en ? <span>{s.en}</span> : null}
                            </h3>
                          </a>
                          <button
                            type="button"
                            className={`favorite-button${favorites.has(s.id) ? " is-saved" : ""}`}
                            aria-label={T.favoriteTerm}
                            aria-pressed={favorites.has(s.id)}
                            title={T.favoriteTerm}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(s.id);
                            }}
                          >
                            <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
                              <path d={STAR_PATH} />
                            </svg>
                          </button>
                        </div>
                        <div className="card-tagline card-quote">{s.tagline}</div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="grid">
                    {g.terms.map((t) => (
                      <article
                        className="card"
                        data-id={t.slug}
                        key={t.slug}
                        style={{ cursor: "pointer" }}
                        onClick={() => router.push(detailBase + t.slug)}
                      >
                        <CardDemoThumb demoHtml={t.demoHtml} demoClass={t.demoClass} />
                        <div className="card-head">
                          <a
                            className="card-title-group card-title-link"
                            href={detailBase + t.slug}
                            aria-label={t.name}
                          >
                            <h3>
                              {t.name}
                              {t.en ? <span>{t.en}</span> : null}
                            </h3>
                          </a>
                          <button
                            type="button"
                            className={`favorite-button${favorites.has(t.slug) ? " is-saved" : ""}`}
                            aria-label={T.favoriteTerm}
                            aria-pressed={favorites.has(t.slug)}
                            title={T.favoriteTerm}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(t.slug);
                            }}
                          >
                            <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
                              <path d={STAR_PATH} />
                            </svg>
                          </button>
                        </div>
                        <div className="card-tagline card-quote">{t.tagline}</div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
          {navSlug && navTerms.some((t) => t.slug === navSlug) && (
            <NavStyleModal
              terms={navTerms}
              slug={navSlug}
              onSlugChange={openNav}
              onClose={closeNav}
              locale={locale}
            />
          )}
          {block && (
            <AuthBlockModal
              terms={blockTerms[block.cat]}
              slug={block.slug}
              onSlugChange={(slug) => openBlock(block.cat, slug)}
              onClose={closeBlock}
              locale={locale}
              w={BLOCK_CATS[block.cat].w}
              h={BLOCK_CATS[block.cat].h}
            />
          )}
        </div>
      </div>
    </div>
    {limitHit && <ProModal locale={locale} onClose={dismissLimit} />}
    </main>
  );
}
