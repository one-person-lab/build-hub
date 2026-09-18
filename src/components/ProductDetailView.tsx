import SkillAvatar from "./SkillAvatar";
import type { ProductType } from "./ProductLibraryView";
import "./ProductDetailView.css";

export type ProductDetail = {
  id: string;
  name: string;
  category: string;
  type: ProductType;
  tagline: string;
  overview: string;
  highlights: string[];
  bestFor: string;
  pricing: string;
  platform: string;
  url?: string;
  logo?: string;
  tags?: string[];
};

export type ProductDetailLocale = "zh" | "en";

const UI_TEXT = {
  zh: {
    back: "返回产品图鉴",
    type: "类型",
    platform: "平台",
    pricing: "收费",
    category: "分类",
    overview: "详细介绍",
    highlights: "值得关注的地方",
    bestFor: "适合谁",
    visit: "访问官网",
    categories: "相关分类",
    web: "网站",
    app: "App",
    both: "网站 + App",
  },
  en: {
    back: "Back to Showcase",
    type: "Type",
    platform: "Platform",
    pricing: "Pricing",
    category: "Category",
    overview: "Overview",
    highlights: "Why it stands out",
    bestFor: "Best for",
    visit: "Visit website",
    categories: "Browse categories",
    web: "Website",
    app: "App",
    both: "Web + App",
  },
} as const;

export default function ProductDetailView({
  product,
  locale = "zh",
  categoryLabel,
  backHref,
  categories,
  currentCategory,
}: {
  product: ProductDetail;
  locale?: ProductDetailLocale;
  categoryLabel: string;
  backHref: string;
  categories: { key: string; label: string }[];
  currentCategory: string;
}) {
  const T = UI_TEXT[locale];

  return (
    <main>
      <div className="catalog-page">
        <div className="grid-wrap product-detail">
          <div className="product-detail-cover" aria-hidden="true">
            <span className="product-detail-cover-cat">{categoryLabel}</span>
            <span className="product-detail-cover-type">{T[product.type]}</span>
          </div>
          <a className="product-detail-back" href={backHref}>
            ← {T.back}
          </a>

          <header className="product-detail-hero">
            <SkillAvatar
              name={product.name}
              logo={product.logo}
              official={product.url}
              className="product-detail-avatar"
            />
            <div className="product-detail-hero-main">
              <span className="product-detail-cat">{categoryLabel}</span>
              <h1 className="product-detail-name">{product.name}</h1>
              <p className="product-detail-tagline">{product.tagline}</p>
              {product.tags && product.tags.length > 0 ? (
                <ul className="product-detail-tags">
                  {product.tags.map((tg) => (
                    <li key={tg}>{tg}</li>
                  ))}
                </ul>
              ) : null}
            </div>
            <div className="product-detail-cta">
              {product.url ? (
                <a
                  className="product-cta product-cta-primary"
                  href={product.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {T.visit} ↗
                </a>
              ) : null}
            </div>
          </header>

          <dl className="product-detail-meta">
            <div>
              <dt>{T.type}</dt>
              <dd>{T[product.type]}</dd>
            </div>
            <div>
              <dt>{T.platform}</dt>
              <dd>{product.platform}</dd>
            </div>
            <div>
              <dt>{T.pricing}</dt>
              <dd>{product.pricing}</dd>
            </div>
          </dl>

          <section className="product-detail-section">
            <h2>{T.overview}</h2>
            <p className="product-detail-overview">{product.overview}</p>
          </section>

          <section className="product-detail-section">
            <h2>{T.highlights}</h2>
            <ul className="product-detail-highlights">
              {product.highlights.map((f, i) => (
                <li key={i}>
                  <span className="product-detail-check" aria-hidden="true">
                    ✓
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </section>

          <section className="product-detail-best">
            <span className="product-detail-best-label">{T.bestFor}</span>
            <p>{product.bestFor}</p>
          </section>

          {categories.length > 0 ? (
            <section className="product-detail-section">
              <h2>{T.categories}</h2>
              <div className="product-detail-related">
                {categories.map((c) => (
                  <a
                    key={c.key}
                    className={
                      "product-detail-related-item" +
                      (c.key === currentCategory ? " is-current" : "")
                    }
                    href={`${backHref}?cat=${c.key}`}
                    aria-current={c.key === currentCategory ? "true" : undefined}
                  >
                    {c.label}
                  </a>
                ))}
              </div>
            </section>
          ) : null}

          {product.url ? (
            <section className="product-detail-links">
              <a
                className="product-cta product-cta-primary"
                href={product.url}
                target="_blank"
                rel="noreferrer"
              >
                {T.visit} ↗
              </a>
            </section>
          ) : null}
        </div>
      </div>
    </main>
  );
}
