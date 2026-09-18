import SkillAvatar from "./SkillAvatar";
import SkillCover from "./SkillCover";
import "./SkillDetailView.css";

export type SkillDetail = {
  id: string;
  name: string;
  category: string;
  tagline: string;
  overview: string;
  features: string[];
  useCases: string[];
  bestFor: string;
  pricing: string;
  platform: string;
  author?: string;
  official?: string;
  repo?: string;
  cover?: string;
  tags?: string[];
};

export type SkillDetailLocale = "zh" | "en";

const UI_TEXT = {
  zh: {
    back: "返回技能库",
    platform: "平台",
    pricing: "收费",
    category: "分类",
    overview: "详细介绍",
    features: "核心特性",
    useCases: "适用场景",
    bestFor: "适合谁",
    official: "访问官网",
    repo: "GitHub 仓库",
    categories: "相关分类",
  },
  en: {
    back: "Back to library",
    platform: "Platform",
    pricing: "Pricing",
    category: "Category",
    overview: "Overview",
    features: "Key features",
    useCases: "Use cases",
    bestFor: "Best for",
    official: "Visit website",
    repo: "GitHub repo",
    categories: "Browse categories",
  },
} as const;

export default function SkillDetailView({
  skill,
  locale = "zh",
  categoryLabel,
  backHref,
  categories,
  currentCategory,
}: {
  skill: SkillDetail;
  locale?: SkillDetailLocale;
  categoryLabel: string;
  backHref: string;
  categories: { key: string; label: string }[];
  currentCategory: string;
}) {
  const T = UI_TEXT[locale];
  const primary = skill.official || skill.repo;
  const secondary = skill.repo && skill.repo !== primary ? skill.repo : null;

  return (
    <main>
      <div className="catalog-page">
        <div className="grid-wrap skill-detail">
          <SkillCover
            name={skill.name}
            categoryLabel={categoryLabel}
            cover={skill.cover}
          />
          <a className="skill-detail-back" href={backHref}>
            ← {T.back}
          </a>

          <header className="skill-detail-hero">
            <SkillAvatar
              name={skill.name}
              official={skill.official}
              repo={skill.repo}
              className="skill-detail-avatar"
            />
            <div className="skill-detail-hero-main">
              <span className="skill-detail-cat">{categoryLabel}</span>
              <h1 className="skill-detail-name">{skill.name}</h1>
              <p className="skill-detail-tagline">{skill.tagline}</p>
              {skill.tags && skill.tags.length > 0 ? (
                <ul className="skill-detail-tags">
                  {skill.tags.map((tg) => (
                    <li key={tg}>{tg}</li>
                  ))}
                </ul>
              ) : null}
            </div>
            <div className="skill-detail-cta">
              {primary ? (
                <a
                  className="skill-cta skill-cta-primary"
                  href={primary}
                  target="_blank"
                  rel="noreferrer"
                >
                  {skill.official ? T.official : T.repo} ↗
                </a>
              ) : null}
              {secondary ? (
                <a
                  className="skill-cta skill-cta-secondary"
                  href={secondary}
                  target="_blank"
                  rel="noreferrer"
                >
                  {T.repo} ↗
                </a>
              ) : null}
            </div>
          </header>

          <dl className="skill-detail-meta">
            <div>
              <dt>{T.platform}</dt>
              <dd>{skill.platform}</dd>
            </div>
            <div>
              <dt>{T.pricing}</dt>
              <dd>{skill.pricing}</dd>
            </div>
            <div>
              <dt>{T.category}</dt>
              <dd>{categoryLabel}</dd>
            </div>
          </dl>

          <section className="skill-detail-section">
            <h2>{T.overview}</h2>
            <p className="skill-detail-overview">{skill.overview}</p>
          </section>

          <section className="skill-detail-section">
            <h2>{T.features}</h2>
            <ul className="skill-detail-features">
              {skill.features.map((f, i) => (
                <li key={i}>
                  <span className="skill-detail-check" aria-hidden="true">
                    ✓
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </section>

          <section className="skill-detail-section">
            <h2>{T.useCases}</h2>
            <ul className="skill-detail-usecases">
              {skill.useCases.map((u, i) => (
                <li key={i}>{u}</li>
              ))}
            </ul>
          </section>

          <section className="skill-detail-best">
            <span className="skill-detail-best-label">{T.bestFor}</span>
            <p>{skill.bestFor}</p>
          </section>

          {categories.length > 0 ? (
            <section className="skill-detail-section">
              <h2>{T.categories}</h2>
              <div className="skill-detail-related">
                {categories.map((c) => (
                  <a
                    key={c.key}
                    className={
                      "skill-detail-related-item" +
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

          <section className="skill-detail-links">
            {primary ? (
              <a
                className="skill-cta skill-cta-primary"
                href={primary}
                target="_blank"
                rel="noreferrer"
              >
                {skill.official ? T.official : T.repo} ↗
              </a>
            ) : null}
            {secondary ? (
              <a
                className="skill-cta skill-cta-secondary"
                href={secondary}
                target="_blank"
                rel="noreferrer"
              >
                {T.repo} ↗
              </a>
            ) : null}
          </section>
        </div>
      </div>
    </main>
  );
}
