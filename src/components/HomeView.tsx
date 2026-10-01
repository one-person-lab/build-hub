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
    design: "设计",
    principles: "原理",
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
    principles: "Principles",
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
type Catalog = {
  key: string;
  groups: { id: string; category?: string; terms: Omit<Term, "zone">[] }[];
};
type AnyProduct = {
  id: string;
  name: string;
  tagline: string;
  type: "web" | "app" | "both";
  logo?: string;
};

const COPY = {
  zh: {
    kicker: "技能资产库",
    h1a: "把会的东西，",
    h1b: "变成可用的资产。",
    lead:
      "会讲清一件事、会跑通一套流程、会做一份模板——把这些收进来，变成随时能再用的资产。不懂前端后端、看不懂 AI 的黑话？BuildHub 用大白话把前端、后端、AI、Git 这些 Vibe Coding 高频概念讲清楚，每个词条配可视化示例；技能、产品、提示词、动效、手册都替你筛过。",
    ctaBrowse: "从第一个概念开始",
    ctaStyle: "系统学一遍",
    statTerms: "概念词条",
    statStyles: "设计风格",
    statProducts: "精选产品",
    statFree: "元看完全站",
    sec1: "先看懂 AI 编程的黑话",
    sec1sub: "每个概念都用大白话 + 可视化示例",
    sec1all: "全部概念 →",
    sec2: "工具别乱选，这里都用过",
    sec2sub: "真实 logo · 真实评测",
    sec2all: "全部产品 →",
    sec3: "界面长什么样，这里有参考",
    sec3sub: "候选词条即样张，欢迎围观对比",
    sec3all: "更多风格 →",
    candidate: "候选",
    web: "网站",
    app: "App",
    both: "网站 + App",
  },
  en: {
    kicker: "FOR NON-ENGINEERS",
    h1a: "Ship a product with AI —",
    h1b: "no code required.",
    lead: "BuildHub explains the Vibe Coding concepts you keep running into in plain words, each with a visual example — plus curated skills, hands-on product reviews, ready-to-use prompts and playbooks. From your first concept to a live product.",
    ctaBrowse: "Start with the concepts",
    ctaStyle: "Where this style comes from",
    statTerms: "concepts",
    statStyles: "design styles",
    statProducts: "products",
    statFree: "paywalls",
    sec1: "Decode the AI jargon",
    sec1sub: "Plain words, with a live example each",
    sec1all: "All concepts →",
    sec2: "Tools we’ve actually used",
    sec2sub: "Real logos · real reviews",
    sec2all: "All products →",
    sec3: "Reference for how it should look",
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

  const styleTerms =
    catalogs
      .find((c) => c.key === "design")
      ?.groups.filter((g) => g.category === "app-style" || g.category === "web-style")
      .flatMap((g) => g.terms) ?? [];
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
            {!en && (
              <Link href="/courses" className="rd-btn-ghost">
                {C.ctaStyle}
              </Link>
            )}
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
            <Link href={`${base}/design`}>{C.sec3all}</Link>
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
