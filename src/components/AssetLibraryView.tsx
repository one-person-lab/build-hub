"use client";

import assetsData from "@/data/assets.json";
import enAssetsData from "@/data/en-assets.json";
import type { AssetStyle } from "./AssetDetailView";
import "./AssetLibraryView.css";

type Category = { key: string; label: string; styles: AssetStyle[] };
type AssetLibrary = { title: string; subtitle: string; categories: Category[] };

const ZH = assetsData as unknown as AssetLibrary;
const EN = enAssetsData as unknown as AssetLibrary;

const UI_TEXT = {
  zh: {
    count: "个风格",
    detail: "看拆解和提示词",
  },
  en: {
    count: "styles",
    detail: "Breakdown + prompt",
  },
} as const;

export default function AssetLibraryView({ locale = "zh" }: { locale?: "zh" | "en" }) {
  const lib = locale === "en" ? EN : ZH;
  const T = UI_TEXT[locale];
  const detailBase = locale === "en" ? "/en/assets/" : "/assets/";

  return (
    <main>
      <div className="catalog-page">
        <div className="grid-wrap">
          <header className="asset-lib-head">
            <h1>{lib.title}</h1>
            <p>{lib.subtitle}</p>
          </header>

          {lib.categories.map((c) => (
            <section className="asset-lib-cat" key={c.key}>
              <div className="cat-title">
                {c.label}
                <span>
                  {c.styles.length} {T.count}
                </span>
              </div>
              {c.key === "app-icon-style" ? (
                c.styles.map((s) => (
                  <div className="asset-icon-style" key={s.id}>
                    <div className="asset-icon-style-head">
                      <a className="asset-icon-style-name" href={`${detailBase}${s.id}`}>
                        {s.name}
                        <span>{s.en}</span>
                      </a>
                      <span className="asset-icon-style-tagline">{s.tagline}</span>
                      <a className="asset-icon-style-more" href={`${detailBase}${s.id}`}>
                        {T.detail} →
                      </a>
                    </div>
                    <div className="asset-icon-grid">
                      {s.cases.map((cs) => (
                        <a className="asset-icon-cell" href={`${detailBase}${s.id}`} key={cs.brand}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={cs.image} alt={cs.brand} loading="lazy" />
                          <span>{cs.brand}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="grid">
                  {c.styles.map((s) => (
                    <article className="card asset-card-wrap" key={s.id}>
                      <a className="card asset-card" href={`${detailBase}${s.id}`}>
                        <div className="asset-card-cases">
                          {s.cases.map((cs) => (
                            <span className="asset-case-tile" key={cs.brand} style={cs.bg ? { background: cs.bg } : undefined}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={cs.image} alt={cs.brand} loading="lazy" />
                            </span>
                          ))}
                        </div>
                        <div className="card-head">
                          <h3 className="asset-card-title">
                            {s.name}
                            <span>{s.en}</span>
                          </h3>
                          <span className="asset-card-arrow" aria-hidden="true">
                            →
                          </span>
                        </div>
                        <div className="card-tagline card-quote">{s.tagline}</div>
                        <span className="asset-card-more">{T.detail} →</span>
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
