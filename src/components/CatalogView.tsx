"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import catalogsData from "@/data/catalogs.json";
import enCatalogsData from "@/data/en-catalogs.json";

type Term = {
  slug: string;
  name: string;
  en: string;
  tagline: string;
  demoHtml: string;
  demoClass: string;
};
type Group = { id: string; title: string; count: number; terms: Term[] };
type Catalog = {
  key: string;
  href: string;
  title: string;
  tabs: { label: string; count: number; active: boolean }[];
  sidebar: string[];
  groups: Group[];
};

const ZH_CATALOGS = catalogsData as unknown as Catalog[];
const EN_CATALOGS = enCatalogsData as unknown as Catalog[];

// tab 标签与 catalog key 顺序一一对应
const TAB_LABELS: Record<string, Record<string, string>> = {
  zh: {
    frontend: "前端",
    backend: "后端",
    product: "产品",
    testing: "测试",
    technology: "技术栈",
    ai: "AI",
    git: "Git",
    design: "设计风格",
  },
  en: {
    frontend: "Frontend",
    backend: "Backend",
    product: "Product",
    testing: "Testing",
    technology: "Tech Stack",
    ai: "AI",
    git: "Git",
    design: "Design Styles",
  },
};
const TAB_ORDER = Object.keys(TAB_LABELS.zh);

export type Locale = "zh" | "en";

const UI_TEXT = {
  zh: { favorites: "收藏", termCount: "个条目", favoriteTerm: "收藏术语" },
  en: { favorites: "Favorites", termCount: "entries", favoriteTerm: "Add to favorites" },
};

const STAR_PATH =
  "M23.9986 5L17.8856 17.4776L4 19.4911L14.0589 29.3251L11.6544 43L23.9986 36.4192L36.3454 43L33.9586 29.3251L44 19.4911L30.1913 17.4776L23.9986 5Z";

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
  const T = UI_TEXT[locale];
  const detailBase = locale === "en" ? "/en/" : "/";
  const catalog = useMemo(
    () => CATALOGS.find((c) => c.key === catalogKey) ?? CATALOGS[0],
    [CATALOGS, catalogKey]
  );
  const [activeSidebar, setActiveSidebar] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // 收藏持久化
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("vh-favorites") || "[]");
      if (Array.isArray(saved)) setFavorites(new Set(saved.filter((s) => typeof s === "string")));
    } catch {
      setFavorites(new Set());
    }
  }, []);

  const toggleFavorite = (slug: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      localStorage.setItem("vh-favorites", JSON.stringify(Array.from(next)));
      return next;
    });
  };

  // Scroll spy：根据当前进入视口的分类标题高亮左侧导航
  useEffect(() => {
    if (catalog.sidebar.length === 0) return;
    const titles = catalog.groups
      .map((g) => document.getElementById(g.id)?.querySelector<HTMLElement>(".cat-title"))
      .filter(Boolean) as HTMLElement[];
    if (titles.length === 0) return;

    const labelByEl = new Map<HTMLElement, string>();
    titles.forEach((el, i) => labelByEl.set(el, catalog.groups[i].id.replace("cat-", "")));

    const pickTopmost = (entries: IntersectionObserverEntry[]) => {
      const visible = entries.filter((e) => e.isIntersecting).map((e) => e.target as HTMLElement);
      if (visible.length === 0) return;
      const topmost = visible.reduce((a, b) =>
        a.getBoundingClientRect().top < b.getBoundingClientRect().top ? a : b
      );
      setActiveSidebar(labelByEl.get(topmost) ?? null);
    };

    const observer = new IntersectionObserver(pickTopmost, {
      rootMargin: "-132px 0px -55% 0px",
      threshold: 0,
    });
    titles.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [catalog.key, catalog.groups, catalog.sidebar.length]);

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
      return Number.isFinite(v) && v > 0 ? v : 60;
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

  // 原站通过 JS 按容器实际宽度动态计算 --preview-scale（fit-to-width），
  // 这里用 ResizeObserver 复刻同样的行为
  useEffect(() => {
    const fit = (el: HTMLElement) => {
      const canvas = el.querySelector<HTMLElement>(".scaled-preview-canvas");
      if (!canvas) return;
      const w = parseFloat(getComputedStyle(canvas).width) || 640;
      if (el.clientWidth > 0 && w > 0) {
        el.style.setProperty("--preview-scale", String(el.clientWidth / w));
      }
    };
    const els = Array.from(
      document.querySelectorAll<HTMLElement>(".scaled-preview")
    );
    els.forEach(fit);
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) fit(e.target as HTMLElement);
    });
    els.forEach((el) => ro.observe(el));
    return () => ro.disconnect();
  }, [catalog.key]);

  return (
    <main>
    <div className="catalog-page catalog-directory-page">
      <div
        className={
          "catalog-layout catalog-directory-layout" +
          (catalog.sidebar.length > 0 ? "" : " catalog-layout-full")
        }
      >
        <span className="catalog-finder-sentinel" aria-hidden="true" />
        <section className="catalog-finder" aria-label="筛选术语">
          <div className="catalog-finder-row">
            <div className="catalog-filter-list">
              {TAB_ORDER.map((key) => {
                const c = CATALOGS.find((x) => x.key === key);
                const total =
                  c?.tabs.find((t) => L[key] === t.label)?.count ??
                  c?.tabs[0]?.count ??
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
              <button type="button" className="catalog-filter-chip" aria-pressed={false}>
                {T.favorites}
                <span>{favorites.size}</span>
              </button>
            </div>
          </div>
        </section>
        {catalog.sidebar.length > 0 && (
          <aside className="catalog-sidebar">
            <nav className="cat-chips" aria-label="术语目录">
              {catalog.sidebar.map((label) => {
                const gid = "cat-" + label;
                return (
                  <button
                    key={label}
                    type="button"
                    className="catalog-filter-chip"
                    aria-pressed={activeSidebar === label}
                    onClick={() => {
                      setActiveSidebar(label);
                      document
                        .getElementById(gid)
                        ?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </nav>
          </aside>
        )}
        <div className="grid-wrap">
          <header className="catalog-heading">
            <h1>{catalog.title}</h1>
          </header>
          {catalog.groups.map((g) => (
            <section className="cat-section" id={g.id} key={g.id}>
              <div className="cat-title">
                {g.title}
                <span>
                  {g.count} {T.termCount}
                </span>
              </div>
              <div className="grid">
                {g.terms.map((t) => (
                  <article
                    className="card"
                    data-id={t.slug}
                    key={t.slug}
                    style={{ cursor: "pointer" }}
                    onClick={() => router.push(detailBase + t.slug)}
                  >
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
                        className="favorite-button"
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
                    {t.demoHtml ? (
                      <div
                        className={t.demoClass || "card-demo"}
                        aria-hidden="true"
                        dangerouslySetInnerHTML={{ __html: t.demoHtml }}
                      />
                    ) : (
                      <div className="card-demo" aria-hidden="true" />
                    )}
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
    </main>
  );
}
