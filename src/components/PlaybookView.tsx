"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { writeClipboard } from "./clipboard";
import "./PlaybookView.css";

export type PlaybookStep = {
  name: string;
  question?: string;
  points: string[];
  done: string;
  trap?: string;
};

export type Playbook = {
  title: string;
  summary: string;
  category: string;
  hook?: string;
  source?: string;
  lastVerified?: string;
  intro?: string[];
  steps: PlaybookStep[];
  answers?: string[];
  next?: { text: string; link?: { href: string; label: string } }[];
  prompt?: string;
  stepsLabel?: string;
};

type Mark = "pass" | "gap";
type Marks = Record<string, Mark>;

const UI = {
  doneLabel: "完成标志",
  trapLabel: "常见答错",
  pass: "过关",
  gap: "没答上来",
  ringHint: "点任意一段跳到那一问",
  checked: "已核对",
  answers: "我把这几问答了一遍",
  next: "答完之后，今晚能动的一步",
  copyTitle: "可复制的自查清单",
  copyHint: "复制后发给你的 Agent，让它陪你逐问走一遍。",
  copy: "复制全文",
  copied: "已复制",
  copyFail: "复制失败",
  verified: "最后核对",
  back: "返回手册",
  result: "你的自查结果",
  resultEmpty: "还没开始核对。逐问往下看，每问右上角标一下过没过。",
  resultPartial: (n: number) => `还有 ${n} 问没核对。`,
  resultGaps: (names: string) => `最答不上来的：${names}`,
  resultAll: "六问全部过关——那就别再答题了，去把第一单做出来。",
  copyDiag: "复制我的诊断",
  diagCopied: "已复制，去发给 Agent",
} as const;

// 环形六段：每段 60°，段间留 3° 缝隙
const R_OUT = 118;
const R_IN = 76;
const GAP = 3;

function segmentPath(i: number, total: number) {
  const span = 360 / total;
  const a0 = ((i * span + GAP / 2) - 90) * (Math.PI / 180);
  const a1 = (((i + 1) * span - GAP / 2) - 90) * (Math.PI / 180);
  const p = (r: number, a: number) => `${(r * Math.cos(a)).toFixed(2)} ${(r * Math.sin(a)).toFixed(2)}`;
  return `M ${p(R_OUT, a0)} A ${R_OUT} ${R_OUT} 0 0 1 ${p(R_OUT, a1)} L ${p(R_IN, a1)} A ${R_IN} ${R_IN} 0 0 0 ${p(R_IN, a0)} Z`;
}

function midAngle(i: number, total: number, r: number) {
  const a = (((i + 0.5) * (360 / total)) - 90) * (Math.PI / 180);
  return { x: r * Math.cos(a), y: r * Math.sin(a) };
}

export default function PlaybookView({ data, slug }: { data: Playbook; slug: string }) {
  const [marks, setMarks] = useState<Marks>({});
  const [copied, setCopied] = useState<"idle" | "ok" | "fail">("idle");
  const [diag, setDiag] = useState<"idle" | "ok" | "fail">("idle");
  const [ready, setReady] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const storageKey = `vh-playbook-${slug}`;

  // 勾选状态只存在于浏览器本地：服务端渲染时读不到，必须在挂载后补一次
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setMarks(JSON.parse(raw) as Marks);
    } catch {
      // 存坏了就当没存过
    }
    setReady(true);
  }, [storageKey]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const toggle = useCallback(
    (i: number, next: Mark) => {
      setMarks((prev) => {
        const key = String(i + 1);
        const value = prev[key] === next ? undefined : next;
        const out = { ...prev };
        if (value) out[key] = value;
        else delete out[key];
        try {
          localStorage.setItem(storageKey, JSON.stringify(out));
        } catch {
          // 隐私模式下写不进去，标记只在本次有效
        }
        return out;
      });
    },
    [storageKey]
  );

  const jump = useCallback(
    (i: number) => {
      const el = document.getElementById(`step-${i + 1}`);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      el.classList.remove("is-target");
      void el.offsetWidth;
      el.classList.add("is-target");
      window.setTimeout(() => el.classList.remove("is-target"), 1200);
    },
    []
  );

  async function onCopy(text: string, set: (v: "idle" | "ok" | "fail") => void) {
    const ok = await writeClipboard(text);
    set(ok ? "ok" : "fail");
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => set("idle"), 1800);
  }

  const total = data.steps.length;
  const stepsLabel = data.stepsLabel ?? "步骤";
  const entries = data.steps.map((_, i) => marks[String(i + 1)]);
  const checkedCount = entries.filter(Boolean).length;
  const gaps = data.steps
    .map((s, i) => (marks[String(i + 1)] === "gap" ? s.name : null))
    .filter((x): x is string => x !== null);
  const passes = data.steps
    .map((s, i) => (marks[String(i + 1)] === "pass" ? s.name : null))
    .filter((x): x is string => x !== null);

  const diagnosis = [
    `我刚做完「${data.title}」六问自查（${data.steps.map((s, i) => `${i + 1} ${s.name}${marks[String(i + 1)] === "pass" ? "：过关" : marks[String(i + 1)] === "gap" ? "：没答上来" : "：未核对"}`).join("；")}）。`,
    gaps.length > 0
      ? `重点陪我攻「${gaps.join("、")}」这几问：一次只问一问，我给的答案如果空泛就追一次，按完成标志判断过不过关。`
      : `六问我都自认过关了：请挑出我答案里最站不住的一问，逼我说清楚。`,
    `最后把六条答案汇总成一页，指出我最弱的那一问，给我一个今晚就能做的动作。`,
  ].join("\n");

  return (
    <main>
      <div className="catalog-page">
        <div className="pb-wrap">
          <header className="pb-head">
            <h1>{data.title}</h1>
            <p className="pb-summary">{data.summary}</p>
            {data.lastVerified ? (
              <p className="pb-verified">
                {UI.verified} {data.lastVerified}
              </p>
            ) : null}
          </header>

          {data.intro?.length ? (
            <div className="pb-intro">
              {data.intro.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          ) : null}

          <section className="pb-flywheel" aria-label={`${stepsLabel}飞轮`}>
            <svg className="pb-ring" viewBox="-150 -150 300 300" aria-hidden="true">
              {data.steps.map((s, i) => {
                const m = marks[String(i + 1)];
                return (
                  <path
                    key={s.name}
                    className={"pb-seg" + (m ? ` is-${m}` : "")}
                    d={segmentPath(i, total)}
                    onClick={() => jump(i)}
                  />
                );
              })}
              {data.steps.map((s, i) => {
                const p = midAngle(i, total, (R_OUT + R_IN) / 2);
                return (
                  <text className="pb-seg-n" key={s.name} x={p.x} y={p.y} dy="0.35em">
                    {i + 1}
                  </text>
                );
              })}
              <text className="pb-ring-count" x="0" y="-6" dy="0.35em">
                {checkedCount}/{total}
              </text>
              <text className="pb-ring-label" x="0" y="18">
                {UI.checked}
              </text>
            </svg>
            <div className="pb-chips" role="list">
              {data.steps.map((s, i) => {
                const m = marks[String(i + 1)];
                return (
                  <button
                    type="button"
                    role="listitem"
                    key={s.name}
                    className={"pb-chip" + (m ? ` is-${m}` : "")}
                    onClick={() => jump(i)}
                  >
                    <span className="pb-chip-n">{i + 1}</span>
                    {s.name}
                  </button>
                );
              })}
            </div>
            <p className="pb-ring-hint">{UI.ringHint}</p>
          </section>

          <section className="pb-steps" aria-label={stepsLabel}>
            {data.steps.map((s, i) => {
              const m = marks[String(i + 1)];
              return (
                <section className={"pb-step" + (m ? ` is-${m}` : "")} id={`step-${i + 1}`} key={s.name}>
                  <div className="pb-step-top">
                    <h2>
                      <span className="pb-step-n">{i + 1}</span>
                      {s.name}
                      {s.question ? <em>{s.question}</em> : null}
                    </h2>
                    <div className="pb-marks" aria-label="标记这一问">
                      <button
                        type="button"
                        className="pb-mark pb-mark-pass"
                        aria-pressed={m === "pass"}
                        onClick={() => toggle(i, "pass")}
                      >
                        {UI.pass}
                      </button>
                      <button
                        type="button"
                        className="pb-mark pb-mark-gap"
                        aria-pressed={m === "gap"}
                        onClick={() => toggle(i, "gap")}
                      >
                        {UI.gap}
                      </button>
                    </div>
                  </div>
                  <ul className="pb-points">
                    {s.points.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                  <p className="pb-done">
                    <b>{UI.doneLabel}</b>
                    {s.done}
                  </p>
                  {s.trap ? (
                    <p className="pb-trap">
                      <b>{UI.trapLabel}</b>
                      {s.trap}
                    </p>
                  ) : null}
                </section>
              );
            })}
          </section>

          <section className="pb-result" aria-label={UI.result}>
            <h2>{UI.result}</h2>
            <p className="pb-result-text">
              {!ready || checkedCount === 0
                ? UI.resultEmpty
                : gaps.length > 0
                  ? `${UI.resultPartial(total - checkedCount)}${UI.resultGaps(gaps.join("、"))}`
                  : checkedCount < total
                    ? UI.resultPartial(total - checkedCount)
                    : UI.resultAll}
            </p>
            {passes.length > 0 || gaps.length > 0 ? (
              <button
                type="button"
                className={"pb-copy" + (diag === "ok" ? " is-copied" : "")}
                onClick={() => onCopy(diagnosis, setDiag)}
              >
                {diag === "ok" ? UI.diagCopied : UI.copyDiag}
              </button>
            ) : null}
          </section>

          {data.answers?.length ? (
            <section className="pb-block" aria-label={UI.answers}>
              <h2>{UI.answers}</h2>
              <ul className="pb-answers">
                {data.answers.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {data.next?.length ? (
            <section className="pb-block" aria-label={UI.next}>
              <h2>{UI.next}</h2>
              <ul className="pb-next">
                {data.next.map((n) => (
                  <li key={n.text}>
                    {n.text}
                    {n.link ? (
                      <a className="pb-link" href={n.link.href}>
                        {n.link.label} →
                      </a>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {data.prompt ? (
            <section className="pb-block" id="pb-checklist" aria-label={UI.copyTitle}>
              <h2>{UI.copyTitle}</h2>
              <p className="pb-copy-hint">{UI.copyHint}</p>
              <pre className="pb-prompt">{data.prompt}</pre>
              <button
                type="button"
                className={"pb-copy" + (copied === "ok" ? " is-copied" : "") + (copied === "fail" ? " is-failed" : "")}
                onClick={() => onCopy(data.prompt!, setCopied)}
              >
                {copied === "fail" ? UI.copyFail : copied === "ok" ? UI.copied : UI.copy}
              </button>
            </section>
          ) : null}

          <p className="pb-back">
            <Link href="/playbooks">← {UI.back}</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
