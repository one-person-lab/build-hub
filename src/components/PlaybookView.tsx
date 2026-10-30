"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { writeClipboard } from "./clipboard";
import ProModal from "./ProModal";
import { useMe } from "@/lib/favorites";
import { track } from "@/lib/track";
import type { Playbook } from "@/lib/playbook-types";
import "./PlaybookView.css";

export type { Playbook };

type Mark = "pass" | "gap";
type Marks = Record<string, Mark>;

type ForkStatus = "todo" | "doing" | "done";
type ExecStep = { index: number; status: ForkStatus; result: string; blocker: string };
type Fork = { id: string; total: number; done: number; steps: ExecStep[] };

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
  // 复刻层
  fork: "复刻这套",
  forkQuota: "免费能复刻 1 份，PRO 不限。",
  forkDone: (d: number, t: number) => `走完 ${d}/${t} 步`,
  forkMine: "我的复刻 →",
  forkContinue: "接着走",
  forkLoginHint: "复刻要存到你账号上，先填个邮箱。",
  forkErr: "没存上，再试一次",
  execStatus: ["没做", "在做", "做完"],
  execResult: "这一步做出来的东西",
  execBlocker: "卡在哪",
  execHint: "都可以不填。写了卡点，下次回来才知道自己停在哪。",
  deliverable: "复刻完你手上会有",
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
  const me = useMe();

  const [fork, setFork] = useState<Fork | null>(null);
  const [forkBusy, setForkBusy] = useState(false);
  const [forkErr, setForkErr] = useState("");
  const [limitHit, setLimitHit] = useState(false);
  const [signIn, setSignIn] = useState(false);

  const storageKey = `vh-playbook-${slug}`;

  // 勾选状态只存在于浏览器本地：服务端渲染时读不到，必须在挂载后补一次
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setMarks(JSON.parse(raw) as Marks);
    } catch {
      // 存坏了就当没存过
    }
    setReady(true);
    track("playbook_view", { playbook: slug });
  }, [storageKey, slug]);

  const total = data.steps.length;

  // 登录后把这份档案的复刻捞回来；没登录就只显示「一键复刻」
  useEffect(() => {
    if (!me?.user) {
      setFork(null);
      return;
    }
    fetch(`/api/forks?playbook=${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { fork?: Fork | null } | null) => setFork(d?.fork ?? null))
      .catch(() => {});
  }, [me?.user, slug]);

  async function doFork() {
    setForkErr("");
    track("fork_click", { playbook: slug });
    if (!me?.user) {
      setSignIn(true);
      track("login_started", { playbook: slug });
      return;
    }
    setForkBusy(true);
    try {
      const r = await fetch("/api/forks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ playbookId: slug }),
      });
      const d = await r.json().catch(() => ({}));
      if (r.status === 403) {
        setLimitHit(true);
        track("pro_wall_view", { reason: "fork_limit", playbook: slug });
        return;
      }
      if (!r.ok) {
        setForkErr(UI.forkErr);
        return;
      }
      const full = await fetch(`/api/forks/${d.fork.id}`).then((x) => x.json());
      setFork(full.fork as Fork);
      track("fork_success", { playbook: slug });
    } catch {
      setForkErr(UI.forkErr);
    } finally {
      setForkBusy(false);
    }
  }

  async function patchStep(index: number, patch: Partial<ExecStep>) {
    if (!fork) return;
    setFork((prev) =>
      prev
        ? {
            ...prev,
            steps: prev.steps.map((s) => (s.index === index ? { ...s, ...patch } : s)),
          }
        : prev
    );
    try {
      const r = await fetch(`/api/forks/${fork.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ stepIndex: index, ...patch }),
      });
      if (!r.ok) return;
      const d = await r.json();
      setFork((prev) => (prev ? { ...prev, done: d.done ?? prev.done } : prev));
      if (patch.status === "done") track("step_completed", { playbook: slug, step: index });
      if (patch.blocker?.trim()) track("blocker_saved", { playbook: slug, step: index });
    } catch {
      setForkErr(UI.forkErr);
    }
  }

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
    `我刚做完「${data.title}」${stepsLabel}自查（${data.steps.map((s, i) => `${i + 1} ${s.name}${marks[String(i + 1)] === "pass" ? "：过关" : marks[String(i + 1)] === "gap" ? "：没答上来" : "：未核对"}`).join("；")}）。`,
    gaps.length > 0
      ? `重点陪我攻「${gaps.join("、")}」这几问：一次只问一问，我给的答案如果空泛就追一次，按完成标志判断过不过关。`
      : `每一问我都自认过关了：请挑出我答案里最站不住的一问，逼我说清楚。`,
    `最后把答案汇总成一页，指出我最弱的那一问，给我一个今晚就能做的动作。`,
  ].join("\n");

  return (
    <main>
      <div className="catalog-page">
        <div className="pb-wrap">
          <header className="pb-head">
            <h1>{data.title}</h1>
            <p className="pb-summary">{data.summary}</p>
            {data.deliverable ? (
              <p className="pb-deliverable">
                <b>{UI.deliverable}</b>
                {data.deliverable}
              </p>
            ) : null}
            {data.lastVerified ? (
              <p className="pb-verified">
                {UI.verified} {data.lastVerified}
              </p>
            ) : null}
          </header>

          <section className="pb-fork" aria-label={UI.forkMine}>
            {fork ? (
              <>
                <div className="pb-fork-top">
                  <b>{UI.forkDone(fork.done, total)}</b>
                  <Link className="pb-fork-mine" href="/forks">
                    {UI.forkContinue} →
                  </Link>
                </div>
                <div
                  className="pb-fork-bar"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={total}
                  aria-valuenow={fork.done}
                >
                  <i style={{ width: `${total ? Math.round((fork.done / total) * 100) : 0}%` }} />
                </div>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="pb-fork-cta"
                  disabled={forkBusy}
                  onClick={doFork}
                >
                  {forkBusy ? "…" : UI.fork}
                </button>
                <p className="pb-fork-quota">
                  {me?.user ? UI.forkQuota : UI.forkLoginHint}
                </p>
              </>
            )}
            {forkErr && <p className="pb-fork-err">{forkErr}</p>}
            {signIn && !me?.user && (
              <SignInPanel
                onDone={() => {
                  setSignIn(false);
                  doFork();
                }}
                onCancel={() => setSignIn(false)}
              />
            )}
          </section>

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
            {data.steps.map((s, i) => (
              <StepCard
                key={s.name}
                index={i}
                step={s}
                mark={marks[String(i + 1)]}
                onMark={toggle}
                exec={fork?.steps.find((x) => x.index === i + 1) ?? null}
                onExec={patchStep}
              />
            ))}
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
      {limitHit && <ProModal locale="zh" onClose={() => setLimitHit(false)} />}
    </main>
  );
}

function StepCard({
  index,
  step,
  mark,
  onMark,
  exec,
  onExec,
}: {
  index: number;
  step: Playbook["steps"][number];
  mark?: Mark;
  onMark: (i: number, m: Mark) => void;
  exec: ExecStep | null;
  onExec: (index: number, patch: Partial<ExecStep>) => void;
}) {
  return (
    <section className={"pb-step" + (mark ? ` is-${mark}` : "") + (exec?.status === "done" ? " is-executed" : "")} id={`step-${index + 1}`}>
      <div className="pb-step-top">
        <h2>
          <span className="pb-step-n">{index + 1}</span>
          {step.name}
          {step.question ? <em>{step.question}</em> : null}
        </h2>
        <div className="pb-marks" aria-label="标记这一问">
          <button
            type="button"
            className="pb-mark pb-mark-pass"
            aria-pressed={mark === "pass"}
            onClick={() => onMark(index, "pass")}
          >
            {UI.pass}
          </button>
          <button
            type="button"
            className="pb-mark pb-mark-gap"
            aria-pressed={mark === "gap"}
            onClick={() => onMark(index, "gap")}
          >
            {UI.gap}
          </button>
        </div>
      </div>
      <ul className="pb-points">
        {step.points.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
      <p className="pb-done">
        <b>{UI.doneLabel}</b>
        {step.done}
      </p>
      {step.trap ? (
        <p className="pb-trap">
          <b>{UI.trapLabel}</b>
          {step.trap}
        </p>
      ) : null}
      {exec ? <ExecPanel index={index + 1} exec={exec} onExec={onExec} /> : null}
    </section>
  );
}

function ExecPanel({
  index,
  exec,
  onExec,
}: {
  index: number;
  exec: ExecStep;
  onExec: (index: number, patch: Partial<ExecStep>) => void;
}) {
  const [result, setResult] = useState(exec.result);
  const [blocker, setBlocker] = useState(exec.blocker);
  const sent = useRef({ result: exec.result, blocker: exec.blocker });

  const flush = useCallback(() => {
    const patch: Partial<ExecStep> = {};
    if (result !== sent.current.result) {
      sent.current.result = result;
      patch.result = result;
    }
    if (blocker !== sent.current.blocker) {
      sent.current.blocker = blocker;
      patch.blocker = blocker;
    }
    if (Object.keys(patch).length) onExec(index, patch);
  }, [blocker, index, onExec, result]);

  return (
    <div className="pb-exec">
      <div className="pb-exec-status" role="group" aria-label="这一步做到哪了">
        {UI.execStatus.map((label, s) => (
          <button
            key={label}
            type="button"
            className={"pb-exec-btn is-" + (["todo", "doing", "done"] as ForkStatus[])[s]}
            aria-pressed={exec.status === (["todo", "doing", "done"] as ForkStatus[])[s]}
            onClick={() => onExec(index, { status: (["todo", "doing", "done"] as ForkStatus[])[s] })}
          >
            {label}
          </button>
        ))}
      </div>
      <label className="pb-exec-field">
        <span>{UI.execResult}</span>
        <textarea
          rows={2}
          value={result}
          placeholder="一行就够：一个链接、一句话、一个文件"
          onChange={(e) => setResult(e.target.value)}
          onBlur={flush}
        />
      </label>
      <label className="pb-exec-field is-blocker">
        <span>{UI.execBlocker}</span>
        <textarea
          rows={2}
          value={blocker}
          placeholder="卡在哪一步、缺什么"
          onChange={(e) => setBlocker(e.target.value)}
          onBlur={flush}
        />
      </label>
      <p className="pb-exec-hint">{UI.execHint}</p>
    </div>
  );
}

function SignInPanel({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (countdown <= 0) return;
    timer.current = window.setInterval(() => setCountdown((s) => s - 1), 1000);
    return () => window.clearInterval(timer.current);
  }, [countdown]);

  async function send() {
    setErr("");
    setBusy(true);
    try {
      const r = await fetch("/api/auth/code", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (r.status === 429) setErr("发送太快，稍后再试");
      else if (!r.ok) setErr("邮件发送失败，请稍后重试");
      else setCountdown(60);
    } catch {
      setErr("出错了，请重试");
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    setErr("");
    setBusy(true);
    try {
      const r = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      if (!r.ok) {
        setErr(r.status === 400 ? "验证码错误或已过期" : "出错了，请重试");
        return;
      }
      window.dispatchEvent(new Event("vh-me-changed"));
      onDone();
    } catch {
      setErr("出错了，请重试");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="pb-signin">
      <p className="pb-signin-title">{UI.forkLoginHint}</p>
      <input
        className="pb-signin-field"
        type="email"
        placeholder="邮箱地址"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <div className="pb-signin-row">
        <input
          className="pb-signin-field"
          inputMode="numeric"
          maxLength={6}
          placeholder="6 位验证码"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
        />
        <button className="pb-signin-code" disabled={busy || countdown > 0 || !email} onClick={send}>
          {countdown > 0 ? `${countdown}s 后重发` : code ? "重新获取" : "获取验证码"}
        </button>
      </div>
      {err && <p className="pb-fork-err">{err}</p>}
      <button className="pb-fork-cta" disabled={busy || code.length !== 6} onClick={verify}>
        登录并复刻
      </button>
      <button className="pb-signin-cancel" onClick={onCancel}>
        先不登录
      </button>
    </div>
  );
}
