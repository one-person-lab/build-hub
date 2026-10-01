import { Fragment } from "react";
import legalZh from "@/data/legal.json";
import legalEn from "@/data/en-legal.json";
import { SUPPORT_EMAIL } from "@/lib/site";

type LegalDoc = {
  title: string;
  updated: string;
  intro: string;
  sections: { h: string; p: string[] }[];
};

export const LEGAL_KEYS = ["terms", "privacy", "refunds"] as const;
export type LegalKey = (typeof LEGAL_KEYS)[number];

const DOCS = legalZh as unknown as Record<LegalKey, LegalDoc>;
const EN_DOCS = legalEn as unknown as Record<LegalKey, LegalDoc>;

export function getLegalTitle(key: LegalKey, locale: "zh" | "en" = "zh"): string {
  const doc = (locale === "en" ? EN_DOCS : DOCS)[key];
  return `${doc.title} · BuildHub`;
}

export default function LegalDocView({
  docKey,
  locale = "zh",
}: {
  docKey: LegalKey;
  locale?: "zh" | "en";
}) {
  const doc = (locale === "en" ? EN_DOCS : DOCS)[docKey];
  const base = locale === "en" ? "/en" : "";

  function Para({ text }: { text: string }) {
    const parts = text.split("{email}");
    return (
      <p>
        {parts.map((t, i) => (
          <Fragment key={i}>
            {t}
            {i < parts.length - 1 && (
              <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
            )}
          </Fragment>
        ))}
      </p>
    );
  }

  return (
    <main>
      <article className="legal-page">
        <header className="legal-head">
          <h1>{doc.title}</h1>
          <p className="legal-updated">
            {locale === "en" ? "Last updated " : "最近更新："}
            {doc.updated}
          </p>
        </header>
        <p className="legal-intro">{doc.intro}</p>
        {doc.sections.map((s, si) => (
          <section key={si}>
            <h2>{s.h}</h2>
            {s.p.map((text, i) => (
              <Para key={i} text={text} />
            ))}
          </section>
        ))}
        <nav className="legal-links" aria-label={locale === "en" ? "Related" : "相关页面"}>
          {LEGAL_KEYS.filter((k) => k !== docKey).map((k) => (
            <a key={k} href={`${base}/${k}`}>
              {(locale === "en" ? EN_DOCS : DOCS)[k].title}
            </a>
          ))}
        </nav>
      </article>
    </main>
  );
}
