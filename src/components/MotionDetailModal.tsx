"use client";

import { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import MotionCarouselDemo from "./MotionCarouselDemo";
import BounceCardsDemo from "./BounceCardsDemo";
import DotIntroDemo from "./DotIntroDemo";
import MotionDarkOnboardingDemo from "./MotionDarkOnboardingDemo";
import MotionPromptButton from "./MotionPromptButton";
import "./MotionDetailModal.css";

export type MotionTerm = {
  slug: string;
  name: string;
  en?: string;
  tagline?: string;
  tags?: string[];
  /** 收录条目：本地镜像演示视频/预览图 + 21st.dev 原链 */
  img?: string;
  video?: string;
  /** 弹层用高清版，卡片继续用轻量版 */
  videoHd?: string;
  source?: string;
};

const UI_TEXT = {
  zh: { prev: "上一个动效", next: "下一个动效", close: "关闭", source: "查看原版", copy: "复制提示词", copied: "已复制" },
  en: { prev: "Previous", next: "Next", close: "Close", source: "View original", copy: "Copy prompt", copied: "Copied" },
};

function catalogPrompt(term: MotionTerm, locale: "zh" | "en") {
  const u = term.source ?? "";
  if (locale === "en")
    return `Recreate this carousel interaction for me. Open the original first and watch it: ${u}\nEffect: ${term.tagline || term.name}\nImplement the same interaction form 1:1 in React + CSS. Use your own images and copy — do not embed the original site's assets.`;
  return `请帮我复刻这个轮播交互动效。先打开原版看真实效果：${u}\n效果：${term.tagline || term.name}\n用 React + CSS 把交互形式 1:1 实现，图片与文案自备，不要直接使用原站素材。`;
}

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
    case "motion-bounce-cards":
      return <BounceCardsDemo {...common} />;
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

  return createPortal(
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
        <div className="mdm-body">
          {(() => {
            const demo = renderDemo(term, locale);
            if (demo) return demo;
            return (
              <div className="mdm-entry">
                {term.video || term.videoHd ? (
                  <video
                    key={term.slug}
                    className="mdm-preview"
                    src={term.videoHd ?? term.video}
                    poster={term.img}
                    autoPlay
                    muted
                    loop
                    playsInline
                  />
                ) : term.img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="mdm-preview" src={term.img} alt={term.name} />
                ) : null}
                <div className="mdm-entry-info">
                  <h2 className="mdm-entry-name">
                    {term.name}
                    {term.en ? <span>{term.en}</span> : null}
                  </h2>
                  {term.tagline ? <p className="mdm-tagline">{term.tagline}</p> : null}
                  <div className="mdm-actions">
                    {term.source ? (
                      <a
                        className="mdm-src"
                        href={term.source}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {T.source} ↗
                      </a>
                    ) : null}
                    <MotionPromptButton
                      label={T.copy}
                      copiedLabel={T.copied}
                      source={term.slug}
                      buildPrompt={() => catalogPrompt(term, locale)}
                      className="is-outline"
                      gate={false}
                    />
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>,
    document.body
  );
}
