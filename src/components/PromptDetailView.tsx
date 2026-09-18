import CopyButton from "./CopyButton";
import "./PromptDetailView.css";

export type PromptDetail = {
  id: string;
  name: string;
  category: string;
  tagline: string;
  prompt: string;
  why: string[];
  example: string;
  pitfalls: string[];
  bestFor: string;
  models: string;
  tags?: string[];
};

export type PromptDetailLocale = "zh" | "en";

const UI_TEXT = {
  zh: {
    back: "返回提示词库",
    copy: "复制提示词",
    copied: "已复制",
    copyFail: "复制失败",
    promptTitle: "提示词全文",
    whyTitle: "为什么这么写",
    exampleTitle: "用起来的样子",
    pitfallTitle: "常见坑",
    bestFor: "什么时候用",
    models: "适用模型",
    categories: "相关分类",
    varHint: "把 {{}} 里的部分换成你自己的内容",
  },
  en: {
    back: "Back to library",
    copy: "Copy prompt",
    copied: "Copied",
    copyFail: "Failed",
    promptTitle: "The prompt",
    whyTitle: "Why it works",
    exampleTitle: "What it looks like",
    pitfallTitle: "Where it bites",
    bestFor: "When to use it",
    models: "Models",
    categories: "Browse categories",
    varHint: "Replace the {{}} parts with your own content",
  },
} as const;

// 把 {{变量}} 高亮出来，方便一眼看出哪里要改
function renderPrompt(text: string) {
  return text.split(/({{[^}]*}})/g).map((part, i) =>
    part.startsWith("{{") && part.endsWith("}}") ? (
      <span className="prompt-var" key={i}>
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export default function PromptDetailView({
  prompt,
  locale = "zh",
  categoryLabel,
  backHref,
  categories,
  currentCategory,
}: {
  prompt: PromptDetail;
  locale?: PromptDetailLocale;
  categoryLabel: string;
  backHref: string;
  categories: { key: string; label: string }[];
  currentCategory: string;
}) {
  const T = UI_TEXT[locale];

  return (
    <main>
      <div className="catalog-page">
        <div className="grid-wrap prompt-detail">
          <a className="prompt-detail-back" href={backHref}>
            ← {T.back}
          </a>

          <header className="prompt-detail-hero">
            <span className="prompt-detail-cat">{categoryLabel}</span>
            <h1 className="prompt-detail-name">{prompt.name}</h1>
            <p className="prompt-detail-tagline">{prompt.tagline}</p>
            {prompt.tags && prompt.tags.length > 0 ? (
              <ul className="prompt-detail-tags">
                {prompt.tags.map((tg) => (
                  <li key={tg}>{tg}</li>
                ))}
              </ul>
            ) : null}
            <div className="prompt-detail-cta">
              <CopyButton
                text={prompt.prompt}
                label={T.copy}
                copiedLabel={T.copied}
                failLabel={T.copyFail}
                className="copy-btn-primary"
              />
            </div>
          </header>

          <section className="prompt-detail-section">
            <div className="prompt-detail-section-head">
              <h2>{T.promptTitle}</h2>
              <CopyButton
                text={prompt.prompt}
                label={T.copy}
                copiedLabel={T.copied}
                failLabel={T.copyFail}
              />
            </div>
            <pre className="prompt-code">{renderPrompt(prompt.prompt)}</pre>
            <p className="prompt-var-hint">{T.varHint}</p>
          </section>

          <section className="prompt-detail-section">
            <h2>{T.whyTitle}</h2>
            <ol className="prompt-why">
              {prompt.why.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ol>
          </section>

          <section className="prompt-detail-section">
            <h2>{T.exampleTitle}</h2>
            <p className="prompt-example">{prompt.example}</p>
          </section>

          <section className="prompt-detail-section">
            <h2>{T.pitfallTitle}</h2>
            <ul className="prompt-pitfalls">
              {prompt.pitfalls.map((p, i) => (
                <li key={i}>
                  <span className="prompt-pitfall-mark" aria-hidden="true">
                    !
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </section>

          <dl className="prompt-detail-meta">
            <div>
              <dt>{T.bestFor}</dt>
              <dd>{prompt.bestFor}</dd>
            </div>
            <div>
              <dt>{T.models}</dt>
              <dd>{prompt.models}</dd>
            </div>
          </dl>

          {categories.length > 0 ? (
            <section className="prompt-detail-section">
              <h2>{T.categories}</h2>
              <div className="prompt-detail-related">
                {categories.map((c) => (
                  <a
                    key={c.key}
                    className={
                      "prompt-detail-related-item" +
                      (c.key === currentCategory ? " is-current" : "")
                    }
                    href={`${backHref}?cat=${c.key}`}
                    aria-current={
                      c.key === currentCategory ? "true" : undefined
                    }
                  >
                    {c.label}
                  </a>
                ))}
              </div>
            </section>
          ) : null}

          <section className="prompt-detail-links">
            <CopyButton
              text={prompt.prompt}
              label={T.copy}
              copiedLabel={T.copied}
              failLabel={T.copyFail}
              className="copy-btn-primary"
            />
          </section>
        </div>
      </div>
    </main>
  );
}
