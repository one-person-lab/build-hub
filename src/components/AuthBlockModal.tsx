"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import AuthBlockThumb from "./AuthBlockThumb";
import { copyPromptWithGate } from "@/lib/copy-gate";
import "./AuthBlockModal.css";

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export type AuthTerm = {
  slug: string;
  name: string;
  en?: string;
  tagline?: string;
  /** /public 下的独立 block 页路径 */
  src: string;
  /** React Bits Pro 文档页 */
  source?: string;
};

const UI_TEXT = {
  zh: {
    prev: "上一个",
    next: "下一个",
    close: "关闭",
    source: "打开独立页面",
    copyPrompt: "复制提示词",
    copied: "已复制",
  },
  en: {
    prev: "Previous",
    next: "Next",
    close: "Close",
    source: "Open standalone page",
    copyPrompt: "Copy prompt",
    copied: "Copied",
  },
};

/** block 编号（footer-1 / auth-3）：文档页链接优先，退回本地预览页路径 */
function blockId(term: AuthTerm): string {
  const m = /\/blocks\/([a-z]+)\/([a-z0-9-]+)/.exec(term.source || "") ||
    /\/([a-z0-9-]+)\.html$/.exec(term.src);
  return m ? m[2] || m[1] : "";
}

function buildPrompt(term: AuthTerm, locale: "zh" | "en"): string {
  const id = blockId(term);
  const isFooter = id.startsWith("footer");
  const title = locale === "en" ? term.en || term.name : term.name;
  const desc = term.tagline || "";
  const install = `npx shadcn@latest add @reactbits-pro/${id}`;
  if (locale === "en") {
    return [
      `Add the "${title}" ${isFooter ? "footer" : "auth"} block from React Bits Pro to my project.`,
      "",
      desc,
      "",
      "Steps:",
      "1. Make sure my components.json has the @reactbits-pro registries configured (see https://pro.reactbits.dev/docs/installation), including the Authorization header with my REACTBITS_LICENSE_KEY environment variable.",
      "2. Install the block with:",
      `   ${install}`,
      "3. Import it where needed and swap in my own copy, colors and design tokens, keeping this layout.",
      "",
      term.source ? `Docs page for reference: ${term.source}` : "",
      "",
    ].join("\n");
  }
  return [
    `给我的项目加一个「${title}」${isFooter ? "页脚" : "登录注册页"}，用 React Bits Pro 的 ${id} 区块。`,
    "",
    `布局要点：${desc}`,
    "",
    "步骤：",
    "1. 先在 components.json 里配好 @reactbits-pro registry（见 https://pro.reactbits.dev/docs/installation），请求头带上我的 REACTBITS_LICENSE_KEY 环境变量。",
    "2. 安装这个区块：",
    `   ${install}`,
    "3. 引入后换成我项目自己的文案、配色和设计令牌，保持上面的布局结构。",
    "",
    term.source ? `参考文档：${term.source}` : "",
    "",
  ].join("\n");
}

export default function AuthBlockModal({
  terms,
  slug,
  onSlugChange,
  onClose,
  locale = "zh",
  w,
  h,
}: {
  terms: AuthTerm[];
  slug: string;
  onSlugChange: (slug: string) => void;
  onClose: () => void;
  locale?: "zh" | "en";
  /** 预览页画布尺寸：面板宽度按它排，让 iframe 恰好 1:1 */
  w: number;
  h: number;
}) {
  const T = UI_TEXT[locale];
  const idx = useMemo(() => terms.findIndex((t) => t.slug === slug), [terms, slug]);
  const term = idx >= 0 ? terms[idx] : undefined;
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && terms.length > 1) {
        onSlugChange(terms[(idx - 1 + terms.length) % terms.length].slug);
      }
      if (e.key === "ArrowRight" && terms.length > 1) {
        onSlugChange(terms[(idx + 1) % terms.length].slug);
      }
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [idx, onClose, onSlugChange, terms]);

  if (!term) return null;
  const step = (d: number) => onSlugChange(terms[(idx + d + terms.length) % terms.length].slug);

  return createPortal(
    <div
      className="abm-backdrop"
      onPointerDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="abm-panel"
        /* 面板宽度由画布尺寸倒推：既要 1:1 放下 block，也不能高过视口逼人滚动 */
        style={{
          width: `min(${w + 40}px, 94vw, max(640px, calc((100vh - 220px) * ${(w / h).toFixed(3)})))`,
        }}
        role="dialog"
        aria-modal="true"
        aria-label={term.name}
      >
        <div className="abm-head">
          <div className="abm-heading">
            <div className="abm-title">
              <b>{term.name}</b>
              {term.en ? <span>{term.en}</span> : null}
            </div>
          </div>
          <div className="abm-actions">
            {terms.length > 1 && (
              <button type="button" onClick={() => step(-1)} aria-label={T.prev} title={T.prev}>
                <Icon>
                  <path d="M15 6l-6 6 6 6" />
                </Icon>
              </button>
            )}
            {terms.length > 1 && (
              <button type="button" onClick={() => step(1)} aria-label={T.next} title={T.next}>
                <Icon>
                  <path d="M9 6l6 6-6 6" />
                </Icon>
              </button>
            )}
            <button type="button" onClick={onClose} aria-label={T.close} title={T.close} autoFocus>
              <Icon>
                <path d="M6 6l12 12M18 6L6 18" />
              </Icon>
            </button>
          </div>
        </div>
        <div className="abm-body">
          <div className="abm-stage">
            <AuthBlockThumb key={term.slug} src={term.src} title={term.name} w={w} h={h} interactive />
          </div>
          <div className="abm-meta">
            <p>{term.tagline}</p>
            <div className="abm-meta-actions">
              <button
                type="button"
                className={`abm-copy${copied ? " is-copied" : ""}`}
                onClick={() =>
                  void copyPromptWithGate(
                    buildPrompt(term, locale),
                    `design:${term.slug}`,
                    () => {
                      setCopied(true);
                      window.setTimeout(() => setCopied(false), 1600);
                    }
                  )
                }
              >
                <Icon>
                  <rect x="9" y="9" width="11" height="11" rx="2.5" />
                  <path d="M5 15V5.5A1.5 1.5 0 0 1 6.5 4H15" />
                </Icon>
                {copied ? T.copied : T.copyPrompt}
              </button>
              <a href={term.src} target="_blank" rel="noopener noreferrer">
                {T.source}
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M7 17 17 7M9 7h8v8" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
