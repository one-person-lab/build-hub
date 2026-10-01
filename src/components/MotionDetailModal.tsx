"use client";

import { useEffect, useMemo } from "react";
import MotionCarouselDemo from "./MotionCarouselDemo";
import DotIntroDemo from "./DotIntroDemo";
import MotionDarkOnboardingDemo from "./MotionDarkOnboardingDemo";
import "./MotionDetailModal.css";

export type MotionTerm = {
  slug: string;
  name: string;
  en?: string;
  tagline?: string;
  tags?: string[];
};

const UI_TEXT = {
  zh: { prev: "上一个动效", next: "下一个动效", close: "关闭" },
  en: { prev: "Previous", next: "Next", close: "Close" },
};

// slug → demo 组件；新增动效条目时在这里登记
function renderDemo(term: MotionTerm, locale: "zh" | "en") {
  const common = { locale, name: term.name, en: term.en, tagline: term.tagline };
  switch (term.slug) {
    case "motion-card-carousel":
      return <MotionCarouselDemo {...common} />;
    case "motion-dot-intro":
      return <DotIntroDemo {...common} />;
    case "motion-dark-onboarding":
      return <MotionDarkOnboardingDemo {...common} />;
    default:
      return null;
  }
}

export default function MotionDetailModal({
  terms,
  slug,
  onSlugChange,
  onClose,
  locale = "zh",
}: {
  terms: MotionTerm[];
  slug: string;
  onSlugChange: (slug: string) => void;
  onClose: () => void;
  locale?: "zh" | "en";
}) {
  const T = UI_TEXT[locale];
  const idx = useMemo(() => terms.findIndex((t) => t.slug === slug), [terms, slug]);
  const term = idx >= 0 ? terms[idx] : undefined;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  if (!term) return null;
  const step = (d: number) => onSlugChange(terms[(idx + d + terms.length) % terms.length].slug);

  return (
    <div className="mdm-backdrop" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="mdm-panel" role="dialog" aria-modal="true" aria-label={term.name}>
        <div className="mdm-head">
          <div className="mdm-tags">
            {(term.tags ?? []).map((tag) => (
              <span className="mdm-tag" key={tag}>
                {tag}
              </span>
            ))}
          </div>
          <div className="mdm-nav">
            {terms.length > 1 && (
              <button type="button" onClick={() => step(-1)} aria-label={T.prev} title={T.prev}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M15 6l-6 6 6 6" />
                </svg>
              </button>
            )}
            {terms.length > 1 && (
              <button type="button" onClick={() => step(1)} aria-label={T.next} title={T.next}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </button>
            )}
            <button type="button" onClick={onClose} aria-label={T.close} title={T.close}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        </div>
        <div className="mdm-body">{renderDemo(term, locale)}</div>
      </div>
    </div>
  );
}
