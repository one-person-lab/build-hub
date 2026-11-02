"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import NavDemoThumb from "./NavDemoThumb";
import ProModal from "./ProModal";
import { writeClipboard } from "./clipboard";
import { copyPromptWithGate } from "@/lib/copy-gate";
import { useMe } from "@/lib/favorites";
import { requireLogin } from "@/lib/auth-modal";
import { PLANS } from "@/lib/plans";
import { NAV_CODE } from "@/data/navCode";
import "./NavStyleModal.css";

function Icon({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export type NavTerm = {
  slug: string;
  name: string;
  en?: string;
  tagline?: string;
  source?: string;
};

const UI_TEXT = {
  zh: {
    prev: "上一个导航",
    next: "下一个导航",
    close: "关闭",
    source: "在 ReactBits Pro 查看",
    preview: "预览",
    code: "代码",
    copyInstall: "复制安装命令",
    copyMarkdown: "复制为 Markdown",
    copyPrompt: "复制提示词",
    forAI: "复制提示词",
    copied: "已复制",
    codeTitle: "组件源码",
    copyCode: "复制代码",
    unlock: "解锁导航",
    unlockSub: (n: string) => `选择一个方案来获取 Navigation ${n} 的源代码，并在您的项目中使用它。`,
    cta: "开通 BuildHub PRO 查看源码",
    memberHint: "已是 PRO 会员？登录后即可复制源码。",
    login: "登录",
    planUnit: { monthly: "每月", yearly: "每年", lifetime: "一次性" } as Record<string, string>,
  },
  en: {
    prev: "Previous navigation",
    next: "Next navigation",
    close: "Close",
    source: "View on ReactBits Pro",
    preview: "Preview",
    code: "Code",
    copyInstall: "Copy install command",
    copyMarkdown: "Copy as markdown",
    copyPrompt: "Copy prompt",
    forAI: "Copy for AI",
    copied: "Copied",
    codeTitle: "Component source",
    copyCode: "Copy code",
    unlock: "Unlock Navigation",
    unlockSub: (n: string) => `Choose a plan to get Navigation ${n}'s source code and use it in your project.`,
    cta: "Get BuildHub PRO to view the source",
    memberHint: "Already a PRO member? Sign in to copy the source.",
    login: "Sign in",
    planUnit: { monthly: "per month", yearly: "per year", lifetime: "lifetime" } as Record<string, string>,
  },
};

function blockNumber(source?: string): string {
  const m = /navigation-(\d+)/.exec(source || "");
  return m ? m[1] : "";
}

function buildCopy(term: NavTerm, locale: "zh" | "en") {
  const n = blockNumber(term.source);
  const registry = `@reactbits-pro/navigation-${n}`;
  const docsUrl = (term.source || "").replace(/\?.*$/, "");
  const title = locale === "en" ? term.en || term.name : term.name;
  const desc = term.tagline || "";
  const install = `npx shadcn@latest add ${registry}`;
  const markdown = [
    `# ${title}`,
    "",
    desc,
    "",
    "- Type: React Bits Pro block",
    "- Category: Navigation",
    `- Docs: ${docsUrl}`,
    `- Registry item: ${registry}`,
    "",
    "## Installation",
    "",
    "```bash",
    install,
    "```",
    "",
    "Requires a React Bits Pro license key and the @reactbits-pro registry configured in components.json. Setup guide: https://pro.reactbits.dev/docs/installation",
    "",
  ].join("\n");
  const prompt = [
    `Add the "${title}" block from React Bits Pro to my project.`,
    "",
    desc,
    "",
    "Steps:",
    "1. Ensure my components.json has the React Bits Pro registries configured (see https://pro.reactbits.dev/docs/installation), including the Authorization header with my REACTBITS_LICENSE_KEY environment variable.",
    "2. Install the block with:",
    `   ${install}`,
    "3. Import it where needed and adapt it to my project's content and design tokens.",
    "",
    `Docs page for reference: ${docsUrl}`,
    "",
  ].join("\n");
  return { n, install, markdown, prompt };
}

export default function NavStyleModal({
  terms,
  slug,
  onSlugChange,
  onClose,
  locale = "zh",
}: {
  terms: NavTerm[];
  slug: string;
  onSlugChange: (slug: string) => void;
  onClose: () => void;
  locale?: "zh" | "en";
}) {
  const T = UI_TEXT[locale];
  const me = useMe();
  const pro = !!me?.pro;
  const idx = useMemo(() => terms.findIndex((t) => t.slug === slug), [terms, slug]);
  const term = idx >= 0 ? terms[idx] : undefined;

  const [tab, setTab] = useState<"preview" | "code">("preview");
  const [aiOpen, setAiOpen] = useState(false);
  const [flash, setFlash] = useState("");
  const [showPro, setShowPro] = useState(false);
  const aiRef = useRef<HTMLDivElement>(null);

  // Reset the view when navigating to a different block (adjust during render).
  const [prevSlug, setPrevSlug] = useState(slug);
  if (prevSlug !== slug) {
    setPrevSlug(slug);
    setTab("preview");
    setAiOpen(false);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (aiOpen) setAiOpen(false);
        else if (showPro) setShowPro(false);
        else onClose();
        return;
      }
      if (aiOpen || showPro) return;
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
  }, [aiOpen, showPro, idx, onClose, onSlugChange, terms]);

  useEffect(() => {
    if (!aiOpen) return;
    const onDown = (e: MouseEvent) => {
      if (aiRef.current && !aiRef.current.contains(e.target as Node)) setAiOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [aiOpen]);

  if (!term) return null;
  const step = (d: number) => onSlugChange(terms[(idx + d + terms.length) % terms.length].slug);
  const { n, install, markdown, prompt } = buildCopy(term, locale);

  function showToast(label: string) {
    setFlash(label);
    window.setTimeout(() => setFlash(""), 1600);
  }

  async function copy(text: string, label: string) {
    showToast((await writeClipboard(text)) ? label : "—");
  }

  function pickMenuItem(text: string, label: string, source?: string) {
    setAiOpen(false);
    if (source) void copyPromptWithGate(text, source, () => showToast(label));
    else void copy(text, label);
  }

  function openPro() {
    requireLogin({ reason: "pro", onDone: () => setShowPro(true) });
  }

  const code = NAV_CODE[slug] || "";

  return createPortal(
    <div
      className="nsm-backdrop"
      onPointerDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="nsm-panel" role="dialog" aria-modal="true" aria-label={term.name}>
        <div className="nsm-head">
          <div className="nsm-heading">
            <div className="nsm-title">
              <b>{term.name}</b>
              {term.en ? <span>{term.en}</span> : null}
            </div>
          </div>
          <div className="nsm-actions">
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

        <div className="nsm-toolbar">
          <div className="nsm-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "preview"}
              data-state={tab === "preview" ? "active" : "inactive"}
              className="nsm-tab"
              onClick={() => setTab("preview")}
            >
              <Icon>
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </Icon>
              {T.preview}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "code"}
              data-state={tab === "code" ? "active" : "inactive"}
              className="nsm-tab"
              onClick={() => setTab("code")}
            >
              <Icon>
                <path d="m16 18 6-6-6-6M8 6l-6 6 6 6" />
              </Icon>
              {T.code}
            </button>
          </div>

          <div className="nsm-toolbar-right">
            {n ? <span className="nsm-slug">navigation-{n}</span> : null}
            <button
              type="button"
              className="nsm-icon-btn"
              title={T.copyInstall}
              aria-label={T.copyInstall}
              onClick={() => void copy(install, T.copyInstall)}
            >
              <Icon>
                <rect x="9" y="9" width="12" height="12" rx="2" />
                <path d="M5 15V5a2 2 0 0 1 2-2h10" />
              </Icon>
            </button>
            <div className="nsm-ai" ref={aiRef}>
              <button
                type="button"
                className="nsm-ai-btn"
                aria-haspopup="menu"
                aria-expanded={aiOpen}
                onClick={() => setAiOpen((v) => !v)}
              >
                <Icon>
                  <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2 2M16 16l2 2M18 6l-2 2M8 16l-2 2" />
                </Icon>
                {T.forAI}
                <Icon className="nsm-ai-chev">
                  <path d="m6 9 6 6 6-6" />
                </Icon>
              </button>
              {aiOpen && (
                <div className="nsm-ai-menu" role="menu">
                  <button type="button" role="menuitem" onClick={() => pickMenuItem(install, T.copyInstall)}>
                    <Icon>
                      <path d="m4 17 6-6-6-6M12 19h8" />
                    </Icon>
                    {T.copyInstall}
                  </button>
                  <button type="button" role="menuitem" onClick={() => pickMenuItem(markdown, T.copyMarkdown)}>
                    <Icon>
                      <path d="M4 4h16v16H4z" />
                      <path d="M8 16v-5l2 2 2-2v5M16 11v5M14 14h4" />
                    </Icon>
                    {T.copyMarkdown}
                  </button>
                  <button type="button" role="menuitem" onClick={() => pickMenuItem(prompt, T.copyPrompt, `design:${slug}`)}>
                    <Icon>
                      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2 2M16 16l2 2M18 6l-2 2M8 16l-2 2" />
                    </Icon>
                    {T.copyPrompt}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="nsm-body">
          {tab === "preview" ? (
            <>
              <div className="nsm-stage">
                <NavDemoThumb slug={term.slug} interactive />
              </div>
              <div className="nsm-meta">
                <p>{term.tagline}</p>
                {term.source ? (
                  <a href={term.source} target="_blank" rel="noopener noreferrer">
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
                ) : null}
              </div>
            </>
          ) : pro ? (
            <div className="nsm-code">
              <div className="nsm-code-bar">
                <span className="nsm-code-title">{T.codeTitle}</span>
                <button type="button" className="nsm-code-copy" onClick={() => void copy(code, T.copyCode)}>
                  <Icon>
                    <rect x="9" y="9" width="12" height="12" rx="2" />
                    <path d="M5 15V5a2 2 0 0 1 2-2h10" />
                  </Icon>
                  {T.copyCode}
                </button>
              </div>
              <pre className="nsm-code-pre">
                <code>{code}</code>
              </pre>
            </div>
          ) : (
            <div className="nsm-paywall">
              <div className="nsm-pay-lock">
                <Icon>
                  <rect x="4" y="10" width="16" height="11" rx="2" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                </Icon>
              </div>
              <h3 className="nsm-pay-title">
                {T.unlock} {n}
              </h3>
              <p className="nsm-pay-sub">{T.unlockSub(n)}</p>
              <div className="nsm-plans">
                {PLANS.map((p) => (
                  <div key={p.key} className={`nsm-plan${p.key === "lifetime" ? " is-hot" : ""}`}>
                    <span className="nsm-plan-name">{p.name.replace(/^BuildHub PRO\s*/, "")}</span>
                    <b>¥{p.money}</b>
                    <span className="nsm-plan-unit">{T.planUnit[p.key]}</span>
                  </div>
                ))}
              </div>
              <button type="button" className="nsm-pay-cta" onClick={openPro}>
                {T.cta}
              </button>
              <p className="nsm-pay-fine">
                {T.memberHint}{" "}
                <a href={`${locale === "en" ? "/en" : ""}/pro`}>{T.login}</a>
              </p>
            </div>
          )}
        </div>
      </div>

      {flash ? <div className="nsm-toast">{flash}</div> : null}

      {showPro &&
        createPortal(<ProModal locale={locale} onClose={() => setShowPro(false)} />, document.body)}
    </div>,
    document.body
  );
}
