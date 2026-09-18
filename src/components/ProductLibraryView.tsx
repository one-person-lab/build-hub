"use client";

import { useEffect, useMemo, useState } from "react";
import productsData from "@/data/products.json";
import enProductsData from "@/data/en-products.json";
import SkillAvatar from "./SkillAvatar";
import "./ProductLibraryView.css";

export type ProductType = "web" | "app" | "both";

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

const UI_TEXT = {
  zh: {
    all: "全部",
    count: "个",
    detail: "查看详情",
    empty: "这个分类还在收集中，敬请期待。",
    web: "网站",
    app: "App",
    both: "网站 + App",
  },
  en: {
    all: "All",
    count: "",
    detail: "View details",
    empty: "Still collecting for this category — stay tuned.",
    web: "Website",
    app: "App",
    both: "Web + App",
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
  };

  const visible =
    active === "all"
      ? lib.categories
      : lib.categories.filter((c) => c.key === active);

  const detailBase = locale === "en" ? "/en/products/" : "/products/";

  return (
    <main>
      <div className="catalog-page">
        <div className="grid-wrap">
          <header className="product-lib-head">
            <h1>{lib.title}</h1>
            <p>{lib.subtitle}</p>
          </header>

          <section className="product-lib-finder" aria-label={locale === "en" ? "Filter categories" : "筛选分类"}>
            <div className="catalog-filter-list">
              <button
                type="button"
                className="catalog-filter-chip product-lib-chip"
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
                  className="catalog-filter-chip product-lib-chip"
                  aria-pressed={active === c.key}
                  onClick={() => selectCat(c.key)}
                >
                  {c.label}
                  <span>{c.products.length}</span>
                </button>
              ))}
            </div>
          </section>

          {visible.map((c) => (
            <section className="product-lib-cat" key={c.key}>
              <div className="cat-title">
                {c.label}
                <span>
                  {c.products.length} {T.count}
                </span>
              </div>
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
                            official={p.url}
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
                        <span className="product-card-more">
                          {T.detail} →
                        </span>
                      </a>
                    </article>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
