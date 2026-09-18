"use client";

import Link from "next/link";
import CardDemoThumb from "./CardDemoThumb";
import zhCatalogsData from "@/data/catalogs.json";
import enCatalogsData from "@/data/en-catalogs.json";
import zhProductsData from "@/data/products.json";
import enProductsData from "@/data/en-products.json";

const FEATURED = [
  "icon-library",
  "style-dark-catalog",
  "style-directory-nav",
  "style-paywall",
  "component",
  "state",
  "hook",
  "api",
];

const STYLE_PICKS = [
  "style-dark-catalog",
  "style-directory-nav",
  "style-journal-cards",
  "style-paywall",
];

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

type Term = {
  slug: string;
  name: string;
  en: string;
  tagline: string;
  zone: string;
  demoHtml?: string;
  demoClass?: string;
};
type Catalog = { key: string; groups: { terms: Omit<Term, "zone">[] }[] };
type AnyProduct = {
  id: string;
  name: string;
  tagline: string;
  type: "web" | "app" | "both";
  logo?: string;
};

const COPY = {
  zh: {
    kicker: "设计风格 · DARK LIBRARY",
    h1a: "一个人的产品图鉴，",
    h1b: "逛起来。",
    lead: "BuildHub 用大白话解释 Vibe Coding 高频术语，每个词条配可视化示例。深底、一点金、卡片排得密——把内容站做出「有货的库」的质感。",
    ctaBrowse: "开始逛图鉴",
    ctaStyle: "这套风格从哪来",
    statTerms: "概念词条",
    statStyles: "设计风格",
    statProducts: "精选产品",
    statFree: "浏览收费",
    sec1: "热门概念",
    sec1sub: "今天大家都在查",
    sec1all: "全部概念 →",
    sec2: "产品图鉴",
    sec2sub: "真实 logo · 真实评测",
    sec2all: "全部产品 →",
    sec3: "本站正在试穿的风格",
    sec3sub: "候选词条即样张，欢迎围观对比",
    sec3all: "更多风格 →",
    candidate: "候选",
    web: "网站",
    app: "App",
    both: "网站 + App",
  },
  en: {
    kicker: "DESIGN · DARK LIBRARY",
    h1a: "One person’s product index,",
    h1b: "made for strolling.",
    lead: "BuildHub explains the Vibe Coding terms you keep running into in plain words, each with a visual example — plus curated skills, products and prompts. Dark ground, a touch of gold: a content site that feels stocked.",
    ctaBrowse: "Start browsing",
    ctaStyle: "Where this style comes from",
    statTerms: "concepts",
    statStyles: "design styles",
    statProducts: "products",
    statFree: "paywalled",
    sec1: "Popular concepts",
    sec1sub: "What everyone’s looking up",
    sec1all: "All concepts →",
    sec2: "Showcase",
    sec2sub: "Real logos · real picks",
    sec2all: "All products →",
    sec3: "Styles on trial",
    sec3sub: "Candidate styles, shown as live samples",
    sec3all: "More styles →",
    candidate: "Candidate",
    web: "Website",
    app: "App",
    both: "Web + App",
  },
};

export default function HomeView({ locale = "zh" }: { locale?: "zh" | "en" }) {
  const en = locale === "en";
  const C = COPY[locale];
  const base = en ? "/en" : "";
  const catalogs = (en ? enCatalogsData : zhCatalogsData) as unknown as Catalog[];
  const productCats = (en ? enProductsData : zhProductsData) as unknown as {
    categories: { key: string; label: string; products: AnyProduct[] }[];
  };

  const zones = ZONES[locale];
  const allTerms: Term[] = catalogs.flatMap((c) =>
    c.groups.flatMap((g) => g.terms.map((t) => ({ ...t, zone: zones[c.key] ?? c.key })))
  );
  const seen = new Set<string>();
  const uniqueTerms = allTerms.filter((t) => !seen.has(t.slug) && !!seen.add(t.slug));
  const termBySlug = new Map(uniqueTerms.map((t) => [t.slug, t]));
  const featured = FEATURED.map((s) => termBySlug.get(s)).filter(
    (t): t is Term => Boolean(t)
  );

  const styleTerms = catalogs.find((c) => c.key === "design")?.groups.flatMap((g) => g.terms) ?? [];
  const stylePicks = STYLE_PICKS.map((s) =>
    styleTerms.find((t) => t.slug === s)
  ).filter(Boolean) as typeof styleTerms;

  const products = productCats.categories.flatMap((c) =>
    c.products.slice(0, 2).map((p) => ({ ...p, catLabel: c.label }))
  );
  const productTotal = productCats.categories.reduce((n, c) => n + c.products.length, 0);

  return (
    <div className="rd rd-home">
      <main className="rd-home-main">
        <section>
          <div className="rd-kicker">{C.kicker}</div>
          <h1 className="rd-h1">
            {C.h1a}
            <br />
            {C.h1b}
          </h1>
          <p className="rd-lead">{C.lead}</p>
          <div className="rd-ctas">
            <Link href={`${base}/topics/frontend`} className="rd-btn">
              {C.ctaBrowse}
            </Link>
            <Link href={`${base}/style-dark-catalog`} className="rd-btn-ghost">
              {C.ctaStyle}
            </Link>
          </div>
          <div className="rd-stats">
            <span>
              <b>{uniqueTerms.length}</b>
              {C.statTerms}
            </span>
            <span>
              <b>{styleTerms.length}</b>
              {C.statStyles}
            </span>
            <span>
              <b>{productTotal}</b>
              {C.statProducts}
            </span>
            <span>
              <b>0</b>
              {C.statFree}
            </span>
          </div>
        </section>

        <section className="rd-section">
          <div className="rd-section-head">
            <h2>{C.sec1}</h2>
            <span>{C.sec1sub}</span>
            <Link href={`${base}/topics/frontend`}>{C.sec1all}</Link>
          </div>
          <div className="rd-grid">
            {featured.map((t) => (
              <Link key={t.slug} href={`${base}/${t.slug}`} className="rd-card">
                <CardDemoThumb demoHtml={t.demoHtml ?? ""} demoClass={t.demoClass ?? ""} />
                <div className="rd-card-top">
                  <div>
                    <b>{t.name}</b>
                    <span className="en">{t.en}</span>
                  </div>
                </div>
                <p>{t.tagline}</p>
                <span className="rd-tag">{t.zone}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="rd-section">
          <div className="rd-section-head">
            <h2>{C.sec2}</h2>
            <span>{C.sec2sub}</span>
            <Link href={`${base}/products`}>{C.sec2all}</Link>
          </div>
          <div className="rd-grid">
            {products.map((p) => (
              <Link key={p.id} href={`${base}/products/${p.id}`} className="rd-card">
                <div className="rd-card-top">
                  {p.logo ? (
                    <span className="rd-tile">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.logo} alt="" width={17} height={17} />
                    </span>
                  ) : null}
                  <div>
                    <b>{p.name}</b>
                    <span className="en">
                      {p.type === "app" ? C.app : p.type === "both" ? C.both : C.web}
                    </span>
                  </div>
                </div>
                <p>{p.tagline}</p>
                <span className="rd-tag">{p.catLabel}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="rd-section">
          <div className="rd-section-head">
            <h2>{C.sec3}</h2>
            <span>{C.sec3sub}</span>
            <Link href={`${base}/topics/design`}>{C.sec3all}</Link>
          </div>
          <div className="rd-grid">
            {stylePicks.map((t) => (
              <Link key={t.slug} href={`${base}/${t.slug}`} className="rd-card">
                <CardDemoThumb demoHtml={t.demoHtml ?? ""} demoClass={t.demoClass ?? ""} />
                <div className="rd-card-top">
                  <div>
                    <b>{t.name}</b>
                    <span className="en">{t.en}</span>
                  </div>
                </div>
                <p>{t.tagline}</p>
                <span className="rd-tag">{C.candidate}</span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
