import CopyButton from "./CopyButton";
import type { Locale } from "./CatalogView";
import "./AssetDetailView.css";

export type AssetCase = {
  brand: string;
  note: string;
  image: string;
  source: string;
  sourceLabel: string;
  bg?: string;
};

export type AssetStyle = {
  id: string;
  name: string;
  en: string;
  tagline: string;
  intro: string;
  why: string[];
  fits: string[];
  cases: AssetCase[];
  prompt: string;
  promptHint: string;
};

const UI_TEXT = {
  zh: {
    back: "返回素材库",
    cases: "市场验证案例",
    casesHint: "以下品牌 logo 仅作风格参考，版权归各品牌所有，来源见各图链接。",
    casesHintIcon: "以下图标均为 App Store 在架应用官方图标，仅作风格参考，版权归各应用所有，来源见各图链接。",
    why: "为什么它商业化有效",
    fits: "适合什么样的品牌",
    fitsIcon: "适合什么样的 App",
    prompt: "可直接使用的提示词",
    copy: "复制提示词",
    copied: "已复制",
    copyFail: "复制失败",
    related: "其他风格",
    source: "来源",
  },
  en: {
    back: "Back to Assets",
    cases: "Proven in the market",
    casesHint:
      "Brand logos shown for style reference only; copyright belongs to each brand. Sources linked per image.",
    casesHintIcon:
      "All icons are live App Store icons shown for style reference only; copyright belongs to each app. Sources linked per image.",
    why: "Why it works commercially",
    fits: "Best suited for",
    fitsIcon: "Best suited for",
    prompt: "Ready-to-use prompt",
    copy: "Copy prompt",
    copied: "Copied",
    copyFail: "Copy failed",
    related: "Other styles",
    source: "Source",
  },
} as const;

export default function AssetDetailView({
  style,
  locale = "zh",
  backHref,
  related,
  kind = "logo",
}: {
  style: AssetStyle;
  locale?: Locale;
  backHref: string;
  related: { id: string; name: string }[];
  kind?: "logo" | "app-icon";
}) {
  const T = UI_TEXT[locale];
  const detailBase = locale === "en" ? "/en/assets/" : "/assets/";
  const isIcon = kind === "app-icon";

  return (
    <main>
      <div className="catalog-page">
        <div className="grid-wrap asset-detail">
          <a className="asset-detail-back" href={backHref}>
            ← {T.back}
          </a>

          <header className="asset-detail-hero">
            <h1 className="asset-detail-name">
              {style.name}
              <span>{style.en}</span>
            </h1>
            <p className="asset-detail-tagline">{style.tagline}</p>
            <p className="asset-detail-intro">{style.intro}</p>
          </header>

          <section className="asset-detail-section">
            <h2>{T.cases}</h2>
            <div className="asset-cases">
              {style.cases.map((cs) => (
                <figure className="asset-case" key={cs.brand}>
                  <span
                    className={isIcon ? "asset-case-tile asset-case-tile-lg asset-case-icon-lg" : "asset-case-tile asset-case-tile-lg"}
                    style={!isIcon && cs.bg ? { background: cs.bg } : undefined}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={cs.image} alt={cs.brand} loading="lazy" />
                  </span>
                  <figcaption>
                    <strong>{cs.brand}</strong>
                    <p>{cs.note}</p>
                    <a href={cs.source} target="_blank" rel="noreferrer">
                      {T.source}: {cs.sourceLabel} ↗
                    </a>
                  </figcaption>
                </figure>
              ))}
            </div>
            <p className="asset-cases-hint">{isIcon ? T.casesHintIcon : T.casesHint}</p>
          </section>

          <section className="asset-detail-section">
            <h2>{T.why}</h2>
            <ul className="asset-detail-highlights">
              {style.why.map((w, i) => (
                <li key={i}>
                  <span className="asset-detail-check" aria-hidden="true">
                    ✓
                  </span>
                  {w}
                </li>
              ))}
            </ul>
          </section>

          <section className="asset-detail-section">
            <h2>{isIcon ? T.fitsIcon : T.fits}</h2>
            <ul className="asset-fits">
              {style.fits.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </section>

          <section className="asset-detail-section asset-prompt-section">
            <h2>{T.prompt}</h2>
            <p className="asset-prompt-hint">{style.promptHint}</p>
            <pre className="asset-prompt" dir="auto">
              {style.prompt}
            </pre>
            <CopyButton
              text={style.prompt}
              label={T.copy}
              copiedLabel={T.copied}
              failLabel={T.copyFail}
            />
          </section>

          {related.length > 0 ? (
            <section className="asset-detail-section">
              <h2>{T.related}</h2>
              <div className="asset-detail-related">
                {related.map((r) => (
                  <a key={r.id} className="asset-detail-related-item" href={`${detailBase}${r.id}`}>
                    {r.name}
                  </a>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </main>
  );
}
