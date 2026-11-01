"use client";

import { useEffect, useMemo, useState } from "react";
import productsData from "@/data/products.json";
import enProductsData from "@/data/en-products.json";
import SkillAvatar from "./SkillAvatar";
import "./AssetLibraryView.css";
import "./ProductLibraryView.css";

export type ProductType = "web" | "app" | "both" | "lib";

type Product = {
  id: string;
  name: string;
  tagline: string;
  type: ProductType;
  url?: string;
  logo?: string;
  tags?: string[];
};

type Category = { key: string; label: string; products: Product[] };

type ProductLibrary = { title: string; subtitle: string; categories: Category[] };

const ZH = productsData as unknown as ProductLibrary;
const EN = enProductsData as unknown as ProductLibrary;

const sectionId = (key: string) => `cat-${key}`;

const UI_TEXT = {
  zh: {
    all: "全部",
    count: "个",
    empty: "这个分类还在收集中，敬请期待。",
    web: "网站",
    app: "App",
    both: "网站 + App",
    lib: "代码库",
    liveToc: "实时目录",
    filterCatalog: "筛选分类",
  },
  en: {
    all: "All",
    count: "",
    empty: "Still collecting for this category — stay tuned.",
    web: "Website",
    app: "App",
    both: "Web + App",
    lib: "Library",
    liveToc: "On this page",
    filterCatalog: "Filter categories",
  },
} as const;

export default function ProductLibraryView({ locale = "zh" }: { locale?: "zh" | "en" }) {
  const lib = locale === "en" ? EN : ZH;
  const T = UI_TEXT[locale];
  const total = useMemo(
    () => lib.categories.reduce((n, c) => n + c.products.length, 0),
    [lib]
  );
  const [active, setActive] = useState<string>("all");
  const [activeSection, setActiveSection] = useState<string | null>(null);

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

  const visible =
    active === "all"
      ? lib.categories
      : lib.categories.filter((c) => c.key === active);

  const detailBase = locale === "en" ? "/en/products/" : "/products/";

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
                    <span>{c.products.length}</span>
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
                  <em>{c.products.length}</em>
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
                    {c.products.length} {T.count}
                  </span>
                </h2>
                {c.products.length === 0 ? (
                  <p className="product-lib-empty">{T.empty}</p>
                ) : (
                  <div className="grid">
                    {c.products.map((p) => (
                      <article className="product-card-wrap" key={p.id}>
                        <a
                          className="card product-card"
                          href={`${detailBase}${p.id}`}
                          aria-label={p.name}
                        >
                          <div className="card-head">
                            <SkillAvatar
                              name={p.name}
                              logo={p.logo}
                              className="product-card-avatar"
                            />
                            <h3 className="product-card-title">{p.name}</h3>
                            <span className="product-card-arrow" aria-hidden="true">
                              →
                            </span>
                          </div>
                          <div className="card-tagline card-quote">{p.tagline}</div>
                          <ul className="product-card-tags">
                            <li className="product-card-type">{T[p.type]}</li>
                            {p.tags?.map((tg) => (
                              <li key={tg}>{tg}</li>
                            ))}
                          </ul>
                        </a>
                      </article>
                    ))}
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
