"use client";

import type { TermSection } from "@/lib/types";

export type Term = {
  slug: string;
  name: string;
  en: string;
  quoteLabel: string;
  quote: string;
  summaryLead: string;
  summaryRest: string;
  aliases: string[];
  demoHtml: string;
  sections: TermSection[];
  prev: string | null;
  next: string | null;
};

/** 术语正文：详情页与练习页解锁面板共用同一套 DOM 结构 */
export default function TermBody({
  term,
  withDemo = true,
  locale = "zh",
  kicker,
}: {
  term: Term;
  withDemo?: boolean;
  locale?: "zh" | "en";
  kicker?: string;
}) {
  const alsoCalled = locale === "en" ? "Also called" : "也常被叫作";
  const listenLabel =
    locale === "en"
      ? `Hear the pronunciation of ${term.en}`
      : `听 ${term.en} 的英文发音`;
  return (
    <div className={"detail-body detail-entry-" + term.slug}>
      <section className="detail-hero" id="detail-hero">
        {kicker ? (
          <span className="detail-kicker rd-kicker">{kicker}</span>
        ) : null}
        <div className="dh-head">
          <h1>
            {term.name}
            {term.en ? <span>{term.en}</span> : null}
          </h1>
          {term.en ? (
            <button
              type="button"
              className="pronunciation-button"
              aria-label={listenLabel}
              title={listenLabel}
              onClick={() => {
                if (typeof speechSynthesis !== "undefined") {
                  const u = new SpeechSynthesisUtterance(term.en);
                  u.lang = "en-US";
                  speechSynthesis.speak(u);
                }
              }}
            >
              <i className="ti ti-volume" aria-hidden="true" />
            </button>
          ) : null}
        </div>
        {term.quote ? (
          <div className="dh-quote">
            <span className="dh-quote-label">{term.quoteLabel || (locale === "en" ? "You might say" : "你可能会说")}</span>
            <p className="dh-quote-text">{term.quote}</p>
          </div>
        ) : null}
        {term.summaryLead ? (
          <div className="dh-tagline">
            <strong className="dh-summary-lead">{term.summaryLead}</strong>
            {term.summaryRest ? (
              <>
                <span className="dh-summary-separator" aria-hidden="true">
                  ·
                </span>
                <span>{term.summaryRest}</span>
              </>
            ) : null}
          </div>
        ) : null}
        {term.aliases.length > 0 ? (
          <div className="alias-row" aria-label={alsoCalled}>
            <span>{alsoCalled}</span>
            {term.aliases.map((a) => (
              <em key={a}>{a}</em>
            ))}
          </div>
        ) : null}
        {withDemo && term.demoHtml ? (
          <div className="dh-demo">
            <div className="dh-demo-viewport">
              <div
                className="dh-demo-inner"
                dangerouslySetInnerHTML={{ __html: term.demoHtml }}
              />
            </div>
          </div>
        ) : null}
      </section>

      {term.sections.map((s, i) => (
        <RawSection key={i} idx={i} html={s.html} />
      ))}
    </div>
  );
}

function RawSection({ idx, html }: { idx: number; html: string }) {
  return (
    <section
      className={"vh-raw-section" + (idx === 0 ? " vh-raw-first" : "")}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
