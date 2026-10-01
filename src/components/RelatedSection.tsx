import SkillAvatar from "./SkillAvatar";
import type { RelatedItem } from "@/lib/related";
import "./RelatedSection.css";

const UI_TEXT = {
  zh: { title: "相似推荐", skill: "技能", product: "产品" },
  en: {
    title: "Related picks",
    skill: "Skill",
    product: "Product",
  },
} as const;

export default function RelatedSection({
  items,
  locale = "zh",
}: {
  items: RelatedItem[];
  locale?: "zh" | "en";
}) {
  if (items.length === 0) return null;
  const T = UI_TEXT[locale];

  return (
    <section className="related-section">
      <h2>{T.title}</h2>
      <div className="related-grid">
        {items.map((r) => (
          <a className="related-card" href={r.href} key={`${r.kind}-${r.id}`}>
            <SkillAvatar name={r.name} logo={r.logo} className="related-avatar" />
            <div className="related-card-main">
              <h3 className="related-card-name">{r.name}</h3>
              <p className="related-card-tagline">{r.tagline}</p>
              <span className="related-card-meta">
                {T[r.kind]} · {r.categoryLabel}
              </span>
            </div>
            <span className="related-card-arrow" aria-hidden="true">
              →
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
