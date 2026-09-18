"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import practiceData from "@/data/practice-questions.json";
import termsData from "@/data/terms.json";
import enTermsData from "@/data/en-terms.json";
import TermBody, { type Term } from "./TermBody";

type PracticeOption = {
  id: string;
  label: string;
  feedback: string;
  correct: boolean;
};
type PracticeLocalized = {
  title: string;
  options: PracticeOption[];
  termName: string;
  termSecondaryName: string;
  tagline: string;
  visualHtml: string;
};
type PracticeQuestion = {
  id: string;
  termId: string;
  category: string;
  scope: string;
  zh: PracticeLocalized;
  en: PracticeLocalized;
};

const QUESTIONS = practiceData as unknown as PracticeQuestion[];
const ZH_TERMS = termsData as unknown as Term[];
const EN_TERMS = enTermsData as unknown as Term[];

const LETTERS = ["A", "B", "C", "D"];

type Locale = "zh" | "en";

const SCOPE_KEYS = [
  "all",
  "frontend",
  "backend",
  "product",
  "testing",
  "technology",
  "ai",
  "git",
  "design",
];

const SCOPE_LABELS: Record<Locale, Record<string, string>> = {
  zh: {
    all: "全部方向",
    frontend: "前端",
    backend: "后端",
    product: "产品",
    testing: "测试",
    technology: "技术栈",
    ai: "AI",
    git: "Git",
    design: "设计风格",
  },
  en: {
    all: "All directions",
    frontend: "Frontend",
    backend: "Backend",
    product: "Product",
    testing: "Testing",
    technology: "Tech Stack",
    ai: "AI",
    git: "Git",
    design: "Design Styles",
  },
};

const UI_TEXT: Record<Locale, Record<string, string>> = {
  zh: {
    legend: "你会怎么处理？",
    step: "第 {n} 题",
    scopeLabel: "练习方向",
    correct: "答对了",
    wrong: "还不对",
    next: "继续下一题",
    locked: "答对后查看完整概念详情",
    openTerm: "在新标签页打开 {name}",
    allDirections: "全部方向",
  },
  en: {
    legend: "What would you do?",
    step: "Question {n}",
    scopeLabel: "Practice track",
    correct: "Correct",
    wrong: "Not quite",
    next: "Next question",
    locked: "Answer correctly to reveal the full concept",
    openTerm: "Open {name} in a new tab",
    allDirections: "All directions",
  },
};

const SCOPE_COUNTS: Record<string, number> = QUESTIONS.reduce(
  (acc, q) => {
    acc.all = (acc.all ?? 0) + 1;
    acc[q.scope] = (acc[q.scope] ?? 0) + 1;
    return acc;
  },
  {} as Record<string, number>
);

function scopeLabel(key: string, locale: Locale): string {
  const label = SCOPE_LABELS[locale][key] ?? key;
  const n = SCOPE_COUNTS[key] ?? 0;
  return locale === "en" ? `${label} (${n})` : `${label}（${n}）`;
}

function pickRandom(list: PracticeQuestion[], excludeId?: string): PracticeQuestion {
  const pool =
    excludeId && list.length > 1 ? list.filter((q) => q.id !== excludeId) : list;
  return pool[Math.floor(Math.random() * pool.length)];
}

export default function PracticeView({ locale = "zh" }: { locale?: Locale }) {
  const [scope, setScope] = useState("all");
  const [scopeOpen, setScopeOpen] = useState(false);
  const [question, setQuestion] = useState<PracticeQuestion>(QUESTIONS[0]);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);
  const [step, setStep] = useState(1);
  const scopeRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(false);

  const T = UI_TEXT[locale];
  const termMap = useMemo(
    () => new Map((locale === "en" ? EN_TERMS : ZH_TERMS).map((t) => [t.slug, t])),
    [locale]
  );

  const deck = useMemo(
    () => (scope === "all" ? QUESTIONS : QUESTIONS.filter((q) => q.scope === scope)),
    [scope]
  );

  const localized = locale === "en" ? question.en : question.zh;
  const pickedOption = pickedId
    ? localized.options.find((o) => o.id === pickedId) ?? null
    : null;
  const term = useMemo(
    () => termMap.get(question.termId) ?? null,
    [termMap, question.termId]
  );

  // 挂载后再随机，保证首屏 SSR 与服务端一致
  useEffect(() => {
    mountedRef.current = true;
    setQuestion(pickRandom(deck));
    setStep(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 切换方向：重新抽题并重置进度
  useEffect(() => {
    if (!mountedRef.current) return;
    setQuestion(pickRandom(deck));
    setPickedId(null);
    setSolved(false);
    setStep(1);
  }, [deck]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (scopeRef.current && !scopeRef.current.contains(e.target as Node)) {
        setScopeOpen(false);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const pick = useCallback(
    (opt: PracticeOption) => {
      if (solved) return;
      setPickedId(opt.id);
      setSolved(opt.correct);
    },
    [solved]
  );

  const nextQuestion = useCallback(() => {
    setQuestion((prev) => pickRandom(deck, prev.id));
    setPickedId(null);
    setSolved(false);
    setStep((s) => s + 1);
  }, [deck]);

  return (
    <main>
      <div className={"practice-page practice-question practice-term-" + question.termId + " is-ready"}>
        <div className="practice-question-layout">
          <section className="practice-answer-panel" aria-labelledby="practice-question-title">
            <h1 id="practice-question-title">{localized.title}</h1>
            <fieldset className="practice-options">
              <legend className="sr-only">{T.legend}</legend>
              {localized.options.map((o, i) => {
                const isPicked = pickedId === o.id;
                const cls =
                  "practice-option" +
                  (isPicked ? (o.correct ? " is-correct" : " is-incorrect") : "");
                return (
                  <button
                    key={o.id}
                    className={cls}
                    type="button"
                    aria-pressed={isPicked}
                    disabled={solved}
                    onClick={() => pick(o)}
                  >
                    <span>{LETTERS[i]}</span>
                    <b>{o.label}</b>
                    {isPicked ? (
                      <i className={"ti " + (o.correct ? "ti-check" : "ti-x")} aria-hidden="true" />
                    ) : null}
                  </button>
                );
              })}
            </fieldset>
            {pickedOption ? (
              <div
                className={"practice-feedback " + (solved ? "is-correct" : "is-incorrect")}
                role="status"
                aria-live="polite"
              >
                <strong>{solved ? T.correct : T.wrong}</strong>
                <p>{pickedOption.feedback}</p>
              </div>
            ) : null}
            {solved ? (
              <button className="practice-primary-action" type="button" onClick={nextQuestion}>
                {T.next}
                <i className="ti ti-arrow-right" aria-hidden="true" />
              </button>
            ) : null}
          </section>

          <section className="practice-detail-column" aria-label={T.locked}>
            <header className="practice-run-head">
              <div className="practice-loop-copy">
                <span>{T.step.replace("{n}", String(step))}</span>
              </div>
              <div className="practice-scope-picker" ref={scopeRef}>
                <span id="practice-scope-label">{T.scopeLabel}</span>
                <div className={"practice-scope-select" + (scopeOpen ? " is-open" : "")}>
                  <button
                    className="practice-scope-trigger"
                    type="button"
                    aria-expanded={scopeOpen}
                    aria-haspopup="listbox"
                    aria-controls="practice-scope-menu"
                    aria-labelledby="practice-scope-label practice-scope-value"
                    onClick={() => setScopeOpen((v) => !v)}
                  >
                    <span className="practice-scope-value" id="practice-scope-value">
                      {scopeLabel(scope, locale)}
                    </span>
                    <i className="practice-scope-chevron" aria-hidden="true" />
                  </button>
                  {scopeOpen ? (
                    <div className="practice-scope-menu" id="practice-scope-menu" role="listbox">
                      {SCOPE_KEYS.map((s) => (
                        <button
                          key={s}
                          className={
                            "practice-scope-option" + (scope === s ? " is-selected" : "")
                          }
                          type="button"
                          role="option"
                          aria-selected={scope === s}
                          tabIndex={scope === s ? 0 : -1}
                          onClick={() => {
                            setScope(s);
                            setScopeOpen(false);
                          }}
                        >
                          <span>{scopeLabel(s, locale)}</span>
                          <i className="ti ti-check" aria-hidden="true" />
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </header>
            <div className={"practice-term-panel " + (solved ? "is-revealed" : "is-locked")}>
              {solved && term ? (
                <>
                  <a
                    className="practice-term-open"
                    href={(locale === "en" ? "/en/" : "/") + term.slug}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={T.openTerm.replace("{name}", term.name)}
                  >
                    <span>{term.name}</span>
                    <i className="ti ti-arrow-up-right" aria-hidden="true" />
                  </a>
                  <div className="practice-term-content">
                    <div className="detail is-embedded">
                      <TermBody term={term} withDemo={false} locale={locale} />
                    </div>
                  </div>
                </>
              ) : (
                <div className="practice-detail-lock">
                  <i className="ti ti-eye-off" aria-hidden="true" />
                  <span>{T.locked}</span>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
