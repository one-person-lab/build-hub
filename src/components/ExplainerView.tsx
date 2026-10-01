"use client";

import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { writeClipboard } from "./clipboard";
import "./ExplainerView.css";

export type Followup = { q: string; a: string };
export type Node = {
  id: string;
  label: string;
  sublabel: string;
  kind: string;
  oneLine: string;
  thirtySec: string;
  deep: string;
  impl?: string;
  followups?: Followup[];
};
export type Related = { id: string; label: string; note?: string };
export type Pitfall = { title: string; text: string; fix: string };
export type StackItem = { k: string; v: string; link?: string };
export type Explainer = {
  title: string;
  oneLiner: string;
  forWhom: string;
  memory: { line: string; note?: string };
  diagram: string;
  panorama?: { src: string; title?: string; note?: string };
  overviewHint?: string;
  walkthroughLabel?: string;
  stackHint?: string;
  related?: Related[];
  background?: { intro: string; chain: { step: string; text: string }[] };
  problem?: { intro: string; items: { area: string; issue: string }[] };
  goal?: { intro: string; items: { area: string; issue: string }[] };
  impact?: {
    intro: string;
    metrics: { k: string; v: string }[];
    gates?: { k: string; v: string }[];
    gatesHint?: string;
    note?: string;
  };
  learning?: {
    intro: string;
    items: { title: string; text: string }[];
  };
  review?: { intro: string; items: { area: string; issue: string }[] };
  pitfalls?: Pitfall[];
  pitfallsIntro?: string;
  nodes: Node[];
  techStack?: {
    intro: string;
    note?: string;
    groups: { title: string; items: StackItem[] }[];
  };
  walkthrough: { title: string; intro: string; steps: { node: string; text: string }[] };
  boundaries: { title: string; text: string }[];
  questions: Followup[];
};

const KIND_COLOR: Record<string, string> = {
  interaction: "#0ea5e9",
  decision: "#7c3aed",
  state: "#db2777",
  capability: "#16a34a",
  safety: "#dc2626",
  business: "#ea580c",
  observability: "#0891b2",
  ingest: "#14b8a6",
  index: "#ca8a04",
  retrieval: "#2563eb",
  generation: "#9333ea",
  eval: "#e0407f",
  entry: "#0284c7",
  platform: "#b45309",
  shared: "#64748b",
};
const KIND_LABEL: Record<string, string> = {
  interaction: "交互",
  decision: "决策",
  state: "状态",
  capability: "能力",
  safety: "护栏",
  business: "业务",
  observability: "观测",
  ingest: "构建",
  index: "存储",
  retrieval: "检索",
  generation: "生成",
  eval: "评测",
  entry: "接入",
  platform: "平台",
  shared: "公共",
};

/** 三章九节的标题与说明。页面与「复制为 Markdown」共用这一份，避免两处各写一遍。 */
type Chapter = "why" | "build" | "outcome";
const CHAPTERS: Record<Chapter, { n: string; zh: string }> = {
  why: { n: "01", zh: "为什么做" },
  build: { n: "02", zh: "怎么做" },
  outcome: { n: "03", zh: "做成什么" },
};
const SEC = {
  bg: { ch: "why", title: "背景", hint: "一开始什么样，怎么就非做不可" },
  prob: { ch: "why", title: "问题", hint: "难在哪一步，那一步会出什么事" },
  goal: { ch: "why", title: "目标", hint: "动手前先立靶子：做到哪几条才算数" },
  solution: { ch: "build", title: "方案", hint: "一张图看它怎么解决，再跟着走一遍" },
  arch: { ch: "build", title: "架构", hint: "由哪几块组成，每块管什么、管到哪" },
  eng: { ch: "build", title: "实现", hint: "用什么做的：模型、状态、动作、护栏、怎么调试" },
  impact: { ch: "outcome", title: "结果", hint: "怎么算做成了：拿哪些数字说话" },
  learn: { ch: "outcome", title: "沉淀", hint: "换一个项目还用得上的判断" },
  review: { ch: "outcome", title: "反思", hint: "重来一遍，会先问哪三件事" },
} as const;

/* ── 思维导图：根 → 三章 → 九节 → 每节的短标签 ──────────────────
   整棵树从专题自己的字段里长出来（链的三步、问题的三块、架构层、选型分组、
   结果三个数、沉淀三条），不额外写一份话术，所以每篇专题自动都有。 */
type MindNode = {
  label: string;
  num?: string;
  href?: string;
  kind: "root" | "chapter" | "section" | "leaf";
  children?: MindNode[];
};

const MM_FS = { root: 13, chapter: 11, section: 13, leaf: 12 };
const MM_SLOT = { leaf: 26, section: 30 };
const MM_COL_GAP = [54, 26, 42, 44];
const MM_KID_GAP = [24, 12, 4];

function mmWidth(text: string, size: number) {
  let w = 0;
  for (const ch of text) w += ch.codePointAt(0)! > 0x2e7f ? size : size * 0.56;
  return w;
}
function mmWrap(text: string, size: number, maxW: number, maxLines = 3) {
  const lines: string[] = [];
  let line = "";
  let w = 0;
  for (const ch of text) {
    const cw = ch.codePointAt(0)! > 0x2e7f ? size : size * 0.56;
    if (w + cw > maxW && line) {
      lines.push(line);
      line = ch;
      w = cw;
    } else {
      line += ch;
      w += cw;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, maxLines);
}
function mmNodeWidth(n: MindNode) {
  if (n.kind === "root") return 176;
  if (n.kind === "chapter") return mmWidth(n.label, MM_FS.chapter);
  if (n.kind === "section")
    return mmWidth(n.num ? `${n.num} ${n.label}` : n.label, MM_FS.section) + 24;
  return mmWidth(n.label, MM_FS.leaf);
}

function layoutMind(root: MindNode) {
  const items: { n: MindNode; x: number; y: number; w: number; parent: number }[] = [];
  const maxW = [0, 0, 0, 0];
  (function measure(n: MindNode, d: number) {
    maxW[d] = Math.max(maxW[d], mmNodeWidth(n));
    n.children?.forEach((c) => measure(c, d + 1));
  })(root, 0);
  const colX = [0, 0, 0, 0];
  for (let d = 1; d < 4; d++) colX[d] = colX[d - 1] + maxW[d - 1] + MM_COL_GAP[d - 1];

  function place(n: MindNode, d: number, top: number): { i: number; h: number; cy: number } {
    const kids = n.children ?? [];
    let h: number;
    let cy: number;
    const sub: { i: number; h: number; cy: number }[] = [];
    if (kids.length === 0) {
      h = n.kind === "leaf" ? MM_SLOT.leaf : MM_SLOT.section;
      cy = top + h / 2;
    } else {
      let y = top;
      kids.forEach((k) => {
        const r = place(k, d + 1, y);
        sub.push(r);
        y += r.h + MM_KID_GAP[d];
      });
      h = y - top - MM_KID_GAP[d];
      cy = (sub[0].cy + sub[sub.length - 1].cy) / 2;
    }
    const i = items.length;
    items.push({ n, x: colX[d], y: cy, w: mmNodeWidth(n), parent: -1 });
    sub.forEach((r) => (items[r.i].parent = i));
    return { i, h, cy };
  }

  const { h } = place(root, 0, 8);
  return { items, width: colX[3] + maxW[3], height: h + 16 };
}

function MindMap({ root }: { root: MindNode }) {
  const { items, width, height } = useMemo(() => layoutMind(root), [root]);
  return (
    <div className="exp-mind">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ minWidth: width, maxWidth: Math.round(width * 1.3) }}
        role="img"
        aria-label="专题思维导图"
      >
        {items.map((it, i) => {
          if (it.parent < 0) return null;
          const p = items[it.parent];
          const x1 = p.x + p.w;
          const x2 = it.x - (it.n.kind === "leaf" ? 10 : 0);
          const mx = x1 + (x2 - x1) * 0.5;
          return (
            <path
              key={"e" + i}
              className={it.n.kind === "leaf" ? "mm-edge mm-leaf-edge" : "mm-edge"}
              d={`M${x1},${p.y} C${mx},${p.y} ${mx},${it.y} ${x2},${it.y}`}
            />
          );
        })}
        {items.map((it, i) => {
          const n = it.n;
          if (n.kind === "leaf")
            return (
              <text key={i} className="mm-leaf" x={it.x} y={it.y} fontSize={MM_FS.leaf} dominantBaseline="central">
                {n.label}
              </text>
            );
          if (n.kind === "chapter")
            return (
              <text key={i} className="mm-chapter" x={it.x} y={it.y} fontSize={MM_FS.chapter} dominantBaseline="central">
                {n.label}
              </text>
            );
          if (n.kind === "root") {
            const lines = mmWrap(n.label, MM_FS.root, it.w - 26);
            const bh = lines.length * 19 + 18;
            return (
              <g key={i}>
                <rect className="mm-root-box" x={it.x} y={it.y - bh / 2} width={it.w} height={bh} rx={12} />
                {lines.map((t, j) => (
                  <text
                    key={j}
                    className="mm-root-text"
                    x={it.x + 13}
                    y={it.y - ((lines.length - 1) * 19) / 2 + j * 19}
                    fontSize={MM_FS.root}
                    dominantBaseline="central"
                  >
                    {t}
                  </text>
                ))}
              </g>
            );
          }
          const box = (
            <g>
              <rect className="mm-sec-box" x={it.x} y={it.y - 14} width={it.w} height={28} rx={9} />
              {n.num ? (
                <text className="mm-sec-num" x={it.x + 11} y={it.y} fontSize={MM_FS.section} dominantBaseline="central">
                  {n.num}
                </text>
              ) : null}
              <text
                className="mm-sec-text"
                x={it.x + 11 + (n.num ? mmWidth(n.num, MM_FS.section) + 6 : 0)}
                y={it.y}
                fontSize={MM_FS.section}
                dominantBaseline="central"
              >
                {n.label}
              </text>
            </g>
          );
          return n.href ? (
            <a key={i} className="mm-link" href={n.href}>
              {box}
            </a>
          ) : (
            <g key={i}>{box}</g>
          );
        })}
      </svg>
    </div>
  );
}

function buildExplainerMarkdown(d: Explainer): string {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const link = (href: string) => `${origin}${href}`;
  const L: string[] = [];
  let curCh: Chapter | null = null;
  const head = (s: { ch: Chapter; title: string; hint: string }) => {
    if (s.ch !== curCh) {
      curCh = s.ch;
      L.push("", `## ${CHAPTERS[s.ch].n} ${CHAPTERS[s.ch].zh}`, "");
    }
    L.push("", `### ${s.title}｜${s.hint}`, "");
  };

  L.push(`# ${d.title}`, "", `> ${d.oneLiner}`, "", `> ${d.forWhom}`);

  L.push(
    "",
    "**先记住这三样**",
    "",
    `- 一句话：${d.memory.line}`,
    `- 一条链：${(d.background?.chain ?? []).map((c) => c.step).join(" → ")}`,
    `- 一张图：${link(d.diagram)}`
  );

  if (d.background) {
    head(SEC.bg);
    L.push(d.background.intro, "");
    d.background.chain.forEach((c, i) => L.push(`${i + 1}. **${c.step}** ${c.text}`));
  }

  if (d.problem) {
    head(SEC.prob);
    L.push(d.problem.intro, "");
    d.problem.items.forEach((p) => L.push(`- **${p.area}** ${p.issue}`));
  }

  if (d.goal) {
    head(SEC.goal);
    L.push(d.goal.intro, "");
    d.goal.items.forEach((p) => L.push(`- **${p.area}** ${p.issue}`));
  }

  head(SEC.solution);
  L.push(`![架构图](${link(d.diagram)})`, "");
  L.push(`**${d.walkthroughLabel ?? "一条链"}：${d.walkthrough.title}**`, "", d.walkthrough.intro, "");
  d.walkthrough.steps.forEach((s, i) => {
    const node = d.nodes.find((x) => x.id === s.node);
    L.push(`${i + 1}. **${node?.label ?? s.node}** ${s.text}`);
  });

  head(SEC.arch);
  if (d.panorama) {
    L.push(`#### ${d.panorama.title ?? "系统全景"}`, "", `![系统全景](${link(d.panorama.src)})`, "");
  }
  d.nodes.forEach((node) => {
    L.push(`#### ${node.label}（${node.sublabel} · ${KIND_LABEL[node.kind] ?? node.kind}）`);
    L.push(`- 一句话：${node.oneLine}`);
    L.push(`- 30 秒：${node.thirtySec}`);
    L.push(`- 深讲：${node.deep}`);
    if (node.impl) L.push(`- 怎么实现：${node.impl}`);
    node.followups?.forEach((f) => L.push(`  - 追问：${f.q} ${f.a}`));
    L.push("");
  });
  if (d.boundaries.length > 0) {
    L.push("#### 它拒绝什么、什么时候会出错", "");
    d.boundaries.forEach((b) => L.push(`- **${b.title}** ${b.text}`));
    L.push("");
  }

  if (d.techStack || (d.pitfalls && d.pitfalls.length > 0)) {
    head(d.stackHint ? { ...SEC.eng, hint: d.stackHint } : SEC.eng);
    if (d.techStack) {
      L.push("#### 技术选型", "", d.techStack.intro, "");
      d.techStack.groups.forEach((g) => {
        L.push(`**${g.title}**`);
        g.items.forEach((it) => L.push(`- ${it.k}：${it.v}`));
        L.push("");
      });
    }
    if (d.pitfalls && d.pitfalls.length > 0) {
      L.push(
        "#### 会踩的坑",
        "",
        d.pitfallsIntro ?? "这些坑跟业务无关，换任何一套同类系统都会原样遇到。",
        ""
      );
      d.pitfalls.forEach((p, i) => {
        L.push(`${i + 1}. **${p.title}** ${p.text}`);
        L.push(`   怎么改的：${p.fix}`);
      });
      L.push("");
    }
  }

  if (d.impact) {
    head(SEC.impact);
    L.push(d.impact.intro, "");
    d.impact.metrics.forEach((m) => L.push(`- ${m.k}：${m.v}`));
    if (d.impact.note) L.push("", d.impact.note);
    if (d.impact.gates && d.impact.gates.length > 0) {
      L.push("", "#### 及格线", "");
      d.impact.gates.forEach((g) => L.push(`- ${g.k}：${g.v}`));
    }
    L.push("");
  }

  if (d.learning) {
    head(SEC.learn);
    L.push(d.learning.intro, "");
    d.learning.items.forEach((l, i) => L.push(`${i + 1}. **${l.title}** ${l.text}`));
    L.push("");
  }

  if (d.review) {
    head(SEC.review);
    L.push(d.review.intro, "");
    d.review.items.forEach((p) => L.push(`- **${p.area}** ${p.issue}`));
    L.push("");
  }

  if (d.questions.length > 0) {
    L.push("## 你大概率会问", "");
    d.questions.forEach((q) => L.push(`#### ${q.q}`, "", q.a, ""));
  }

  L.push("---", "", `来源：${link(typeof window === "undefined" ? "" : window.location.pathname)}`);
  return L.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

export default function ExplainerView({ data }: { data: Explainer }) {
  const [selectedId, setSelectedId] = useState(data.nodes[0]?.id ?? "");
  const [step, setStep] = useState(0);
  const [depth, setDepth] = useState(2);
  const [copyState, setCopyState] = useState<"idle" | "ok" | "fail">("idle");
  const stepsRef = useRef<HTMLDivElement>(null);

  async function copyMarkdown() {
    const ok = await writeClipboard(buildExplainerMarkdown(data));
    setCopyState(ok ? "ok" : "fail");
    window.setTimeout(() => setCopyState("idle"), 1600);
  }

  const nodeById = useMemo(
    () => new Map(data.nodes.map((n) => [n.id, n])),
    [data.nodes]
  );
  const node = nodeById.get(selectedId) ?? data.nodes[0];
  const steps = data.walkthrough.steps;
  const currentStep = steps[step];

  function goStep(i: number) {
    const clamped = Math.min(steps.length - 1, Math.max(0, i));
    setStep(clamped);
    if (steps[clamped]) setSelectedId(steps[clamped].node);
    const el = stepsRef.current?.children[clamped] as HTMLElement | undefined;
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }

  // 三章九节：01 为什么做（背景→问题→目标）02 怎么做（方案→架构→实现）03 做成什么（结果→沉淀→反思）。
  // 小节全靠数据字段驱动，缺字段就不出现；章带只在有内容时出现。
  const sections: {
    title: string;
    hint: string;
    chapter: Chapter;
    body: ReactNode;
    leaves?: string[];
  }[] = [];

  if (data.background) {
    sections.push({
      title: SEC.bg.title,
      hint: SEC.bg.hint,
      chapter: SEC.bg.ch,
      leaves: data.background.chain.map((c) => c.step),
      body: (
        <>
          <p className="exp-sec-intro">{data.background.intro}</p>
          <ol className="exp-items">
            {data.background.chain.map((c, i) => (
              <li className="exp-item" key={i}>
                <span className="exp-item-n">{i + 1}</span>
                <div className="exp-item-body">
                  <h4>{c.step}</h4>
                  <p>{c.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </>
      ),
    });
  }

  const threeList = (intro: string, items: { area: string; issue: string }[]) => (
    <>
      <p className="exp-sec-intro">{intro}</p>
      <ol className="exp-items">
        {items.map((p, i) => (
          <li className="exp-item" key={i}>
            <span className="exp-item-n">{i + 1}</span>
            <div className="exp-item-body">
              <h4>{p.area}</h4>
              <p>{p.issue}</p>
            </div>
          </li>
        ))}
      </ol>
    </>
  );

  if (data.problem) {
    sections.push({
      title: SEC.prob.title,
      hint: SEC.prob.hint,
      chapter: SEC.prob.ch,
      leaves: data.problem.items.map((x) => x.area),
      body: threeList(data.problem.intro, data.problem.items),
    });
  }

  if (data.goal) {
    sections.push({
      title: SEC.goal.title,
      hint: SEC.goal.hint,
      chapter: SEC.goal.ch,
      leaves: data.goal.items.map((x) => x.area),
      body: threeList(data.goal.intro, data.goal.items),
    });
  }

  sections.push({
    title: SEC.solution.title,
    hint: data.overviewHint ?? SEC.solution.hint,
    chapter: SEC.solution.ch,
    body: (
      <>
        <p className="exp-sec-intro">
          整个讲解放在这张图上：下面每一节，你都能在图里指出它站在哪一格。
        </p>
        <div className="exp-map-frame">
          <iframe src={data.diagram} title={`${data.title} 架构图`} loading="lazy" />
          <p className="exp-map-open">
            图太小或被限制？
            <a href={data.diagram} target="_blank" rel="noreferrer">
              在新窗口打开完整交互图 ↗
            </a>
          </p>
        </div>
        <h3 className="exp-sub-h">
          {data.walkthroughLabel ?? "一条链：一句话怎么变成一次飞行"}
          <span className="exp-sub-note">{data.walkthrough.title}</span>
        </h3>
        <p className="exp-sec-intro">{data.walkthrough.intro}</p>
        <div className="exp-walk-bar">
          <button
            className="exp-walk-nav"
            onClick={() => goStep(step - 1)}
            disabled={step === 0}
            aria-label="上一步"
          >
            ‹
          </button>
          <button
            className="exp-walk-nav"
            onClick={() => goStep(step + 1)}
            disabled={step === steps.length - 1}
            aria-label="下一步"
          >
            ›
          </button>
          <span className="exp-walk-count">
            第 {step + 1} / {steps.length} 步
          </span>
        </div>
        <div className="exp-steps" ref={stepsRef}>
          {steps.map((s, i) => (
            <button
              key={i}
              className={"exp-step" + (i === step ? " is-active" : "")}
              onClick={() => goStep(i)}
            >
              <span className="exp-step-n">{i + 1}</span>
              <span className="exp-step-node">{nodeById.get(s.node)?.label ?? s.node}</span>
            </button>
          ))}
        </div>
        {currentStep && (
          <div className="exp-walk-detail">
            <span className="exp-walk-node">{nodeById.get(currentStep.node)?.label}</span>
            {currentStep.text}
          </div>
        )}
      </>
    ),
  });

  sections.push({
    title: SEC.arch.title,
    hint: SEC.arch.hint,
    chapter: SEC.arch.ch,
    leaves: data.nodes.map((x) => x.label),
    body: (
      <>
        {data.panorama && (
          <>
            <h3 className="exp-sub-h">
              {data.panorama.title ?? "系统全景"}
              <span className="exp-sub-note">
                {data.panorama.note ?? "先看整张图，再逐层往下看"}
              </span>
            </h3>
            <div className="exp-map-frame exp-map-panorama">
              <iframe src={data.panorama.src} title={`${data.title} 系统全景图`} loading="lazy" />
              <p className="exp-map-open">
                图太小或被限制？
                <a href={data.panorama.src} target="_blank" rel="noreferrer">
                  在新窗口打开完整交互图 ↗
                </a>
              </p>
            </div>
            <h3 className="exp-sub-h">
              逐层拆解
              <span className="exp-sub-note">每一层管什么、管到哪为止</span>
            </h3>
          </>
        )}
        <p className="exp-sec-intro">
          左边点任意一层，右边分四档：一句话、30 秒、深讲、怎么实现。前三档够你把它讲明白，最后一档连用什么做都写清楚，照着能做。
        </p>
        <div className="exp-nodes-grid">
          <nav className="exp-rail" aria-label="架构层">
            {data.nodes.map((n) => (
              <button
                key={n.id}
                className={n.id === selectedId ? "is-active" : ""}
                onClick={() => setSelectedId(n.id)}
              >
                {n.label}
              </button>
            ))}
          </nav>

          {node && (
            <article className="exp-node-card">
              <div className="exp-node-head">
                <h3>{node.label}</h3>
                <span className="exp-sub">{node.sublabel}</span>
                <span className="exp-kind" style={{ background: KIND_COLOR[node.kind] ?? "#888" }}>
                  {KIND_LABEL[node.kind] ?? node.kind}
                </span>
              </div>

              <div className="exp-depth" role="tablist" aria-label="讲解深度">
                {[
                  { d: 1, t: "一句话" },
                  { d: 2, t: "30 秒" },
                  { d: 3, t: "深讲" },
                  { d: 4, t: "怎么实现" },
                ].map((o) => (
                  <button
                    key={o.d}
                    role="tab"
                    aria-selected={depth >= o.d}
                    className={depth === o.d ? "is-active" : ""}
                    onClick={() => setDepth(o.d)}
                  >
                    {o.t}
                  </button>
                ))}
              </div>

              <div className="exp-tier">
                <span className="exp-tier-label">一句话</span>
                <p>{node.oneLine}</p>
              </div>
              {depth >= 2 && (
                <div className="exp-tier">
                  <span className="exp-tier-label">30 秒 · 为什么这么设计</span>
                  <p>{node.thirtySec}</p>
                </div>
              )}
              {depth >= 3 && (
                <div className="exp-tier deep">
                  <span className="exp-tier-label">深讲 · 为什么不用另一种做法</span>
                  <p>{node.deep}</p>
                </div>
              )}
              {depth >= 4 && node.impl && (
                <div className="exp-tier impl">
                  <span className="exp-tier-label">怎么实现 · 用什么做</span>
                  <p>{node.impl}</p>
                </div>
              )}

              {node.followups && node.followups.length > 0 && (
                <div className="exp-followups">
                  <p className="exp-fu-title">这一层大概率被追问</p>
                  {node.followups.map((f, i) => (
                    <details key={i}>
                      <summary>{f.q}</summary>
                      <p>{f.a}</p>
                    </details>
                  ))}
                </div>
              )}
            </article>
          )}
        </div>

        {data.boundaries.length > 0 && (
          <>
            <h3 className="exp-sub-h">
              它拒绝什么、什么时候会出错
              <span className="exp-sub-note">有些事是故意不让它做的</span>
            </h3>
            <div className="exp-kv">
              {data.boundaries.map((b, i) => (
                <div className="exp-kv-row" key={i}>
                  <span className="exp-kv-k">{b.title}</span>
                  <span className="exp-kv-v">{b.text}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </>
    ),
  });

  {
    const eng: ReactNode[] = [];
    if (data.techStack) {
      eng.push(
        <div key="eng-stack">
          <h3 className="exp-sub-h">
            技术选型
            <span className="exp-sub-note">
              {data.techStack.note ?? "每一格都写具体用了什么，不写「用了个数据库」这种大类"}
            </span>
          </h3>
          <p className="exp-sec-intro">{data.techStack.intro}</p>
          {data.techStack.groups.map((g, i) => (
            <div className="exp-kv-group" key={i}>
              <h3>{g.title}</h3>
              <div className="exp-kv">
                {g.items.map((it, j) => (
                  <div className="exp-kv-row" key={j}>
                    {it.link ? (
                      <a className="exp-kv-k is-link" href={it.link}>
                        {it.k}
                      </a>
                    ) : (
                      <span className="exp-kv-k">{it.k}</span>
                    )}
                    <span className="exp-kv-v">{it.v}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }
    if (data.pitfalls && data.pitfalls.length > 0) {
      eng.push(
        <div key="eng-pit">
          <h3 className="exp-sub-h">
            会踩的坑
            <span className="exp-sub-note">每一坑写清：什么现象、为什么、怎么绕</span>
          </h3>
          <p className="exp-sec-intro">
            {data.pitfallsIntro ??
              "这些坑跟业务无关，换任何一套同类系统都会原样遇到。"}
          </p>
          <ol className="exp-items">
            {data.pitfalls.map((p, i) => (
              <li className="exp-item" key={i}>
                <span className="exp-item-n">{i + 1}</span>
                <div className="exp-item-body">
                  <h4>{p.title}</h4>
                  <p>{p.text}</p>
                  <p className="exp-item-fix">
                    <span className="exp-item-fix-label">怎么改的</span>
                    {p.fix}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      );
    }
    if (eng.length > 0) {
      sections.push({
        title: SEC.eng.title,
        hint: data.stackHint ?? SEC.eng.hint,
        chapter: SEC.eng.ch,
        leaves: data.techStack?.groups.map((g) => g.title),
        body: <>{eng}</>,
      });
    }
  }

  if (data.impact) {
    sections.push({
      title: SEC.impact.title,
      hint: SEC.impact.hint,
      chapter: SEC.impact.ch,
      leaves: data.impact.metrics.map((x) => x.k),
      body: (
        <>
          <p className="exp-sec-intro">{data.impact.intro}</p>
          {data.impact.note && <p className="exp-note">{data.impact.note}</p>}
          <div className="exp-kv">
            {data.impact.metrics.map((m, i) => (
              <div className="exp-kv-row" key={i}>
                <span className="exp-kv-k">{m.k}</span>
                <span className="exp-kv-v">{m.v}</span>
              </div>
            ))}
          </div>
          {data.impact.gates && data.impact.gates.length > 0 && (
            <>
              <h3 className="exp-sub-h">
                及格线
                <span className="exp-sub-note">
                  {data.impact.gatesHint ?? "哪条不达标，先去看管它的那一层"}
                </span>
              </h3>
              <div className="exp-kv">
                {data.impact.gates.map((g, i) => (
                  <div className="exp-kv-row" key={i}>
                    <span className="exp-kv-k">{g.k}</span>
                    <span className="exp-kv-v">{g.v}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      ),
    });
  }

  if (data.learning) {
    sections.push({
      title: SEC.learn.title,
      hint: SEC.learn.hint,
      chapter: SEC.learn.ch,
      leaves: data.learning.items.map((x) => x.title),
      body: (
        <>
          <p className="exp-sec-intro">{data.learning.intro}</p>
          <ol className="exp-items">
            {data.learning.items.map((l, i) => (
              <li className="exp-item" key={i}>
                <span className="exp-item-n">{i + 1}</span>
                <div className="exp-item-body">
                  <h4>{l.title}</h4>
                  <p>{l.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </>
      ),
    });
  }

  if (data.review) {
    sections.push({
      title: SEC.review.title,
      hint: SEC.review.hint,
      chapter: SEC.review.ch,
      leaves: data.review.items.map((x) => x.area),
      body: threeList(data.review.intro, data.review.items),
    });
  }

  // 左目录与导图共用这份分组：编号只给章（01/02/03），小节用名字，跟正文一致。
  const tocIds = [...sections.map((_, i) => `sec-${i + 1}`), "sec-ask"];
  const tocGroups: { chapter: Chapter; items: { id: string; title: string }[] }[] = [];
  sections.forEach((s, i) => {
    const g = tocGroups[tocGroups.length - 1];
    const item = { id: `sec-${i + 1}`, title: s.title };
    if (g && g.chapter === s.chapter) g.items.push(item);
    else tocGroups.push({ chapter: s.chapter, items: [item] });
  });

  // 思维导图：和目录同一份数据，只多挂一层短标签（三个以内的才挂，深的留给正文）。
  const mindRoot: MindNode = {
    label: data.title,
    kind: "root",
    children: tocGroups.map((g) => ({
      label: `${CHAPTERS[g.chapter].n} ${CHAPTERS[g.chapter].zh}`,
      kind: "chapter" as const,
      children: g.items.map((it) => {
        const s = sections[Number(it.id.replace("sec-", "")) - 1];
        const leaves = s.leaves && s.leaves.length <= 3 ? s.leaves : undefined;
        return {
          label: s.title,
          href: "#" + it.id,
          kind: "section" as const,
          children: leaves?.map((l) => ({ label: l, kind: "leaf" as const })),
        };
      }),
    })),
  };

  const [active, setActive] = useState("");
  useEffect(() => {
    function onScroll() {
      let cur = tocIds[0] ?? "";
      for (const id of tocIds) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 160) cur = id;
      }
      setActive(cur);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tocIds.join(",")]);

  return (
    <main className="exp-main">
      <div className="exp-shell">
        <nav className="exp-toc" aria-label="目录">
          <p className="exp-toc-h">目录</p>
          {tocGroups.map((g) => (
            <Fragment key={g.chapter}>
              <p className="exp-toc-chapter">
                <span className="exp-toc-chapter-n">{CHAPTERS[g.chapter].n}</span>
                {CHAPTERS[g.chapter].zh}
              </p>
              <ol>
                {g.items.map((it) => (
                  <li key={it.id}>
                    <a
                      href={"#" + it.id}
                      className={active === it.id ? "is-active" : ""}
                    >
                      {it.title}
                    </a>
                  </li>
                ))}
              </ol>
            </Fragment>
          ))}
          {data.questions.length > 0 && (
            <>
              <p className="exp-toc-chapter">追问</p>
              <ol>
                <li>
                  <a href="#sec-ask" className={active === "sec-ask" ? "is-active" : ""}>
                    你大概率会问
                  </a>
                </li>
              </ol>
            </>
          )}
        </nav>

        <div className="exp-col">
          <header className="exp-hero">
            <div className="exp-hero-top">
              <p className="exp-eyebrow">专题 · Deep Dive</p>
              <div className="exp-corner">
                <Link className="exp-chip exp-back" href="/explains" title="返回专题列表">
                  <svg className="ui-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M19 12H5m6-6-6 6 6 6" />
                  </svg>
                  全部专题
                </Link>
                <button
                  type="button"
                  className={"detail-copy-markdown" + (copyState === "ok" ? " is-copied" : "")}
                  aria-label={copyState === "fail" ? "复制失败" : "复制全篇 Markdown"}
                  title={copyState === "fail" ? "复制失败" : "复制全篇 Markdown"}
                  onClick={copyMarkdown}
                >
                  <span className="detail-copy-icon" aria-hidden="true">
                    <svg
                      className="ui-icon copy-icon-default"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <rect x="8" y="8" width="11" height="11" rx="2" />
                      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
                    </svg>
                    <svg
                      className="ui-icon copy-icon-success"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path d="m5 12.5 4.2 4.2L19 7" />
                    </svg>
                  </span>
                  <span className="detail-copy-label" aria-hidden="true">
                    <span className="copy-label-default">
                      {copyState === "fail" ? "复制失败" : "复制全篇 Markdown"}
                    </span>
                    <span className="copy-label-success">已复制</span>
                  </span>
                </button>
              </div>
            </div>

            <h1>{data.title}</h1>
            <p className="exp-oneLiner">{data.oneLiner}</p>
            <p className="exp-forWhom">{data.forWhom}</p>
          </header>

          <section className="exp-memory" aria-label="先记住这三样">
            <h2 className="exp-memory-h">
              先记住这三样
              <span className="exp-sub-note">
                {data.memory.note ??
                  "脱稿就照这三样讲：先用一句话给定位，再用一条链说清为什么非做不可，最后指着图讲怎么做。"}
              </span>
            </h2>
            <div className="exp-memory-left">
              <span className="exp-memory-k">一句话</span>
              <p className="exp-memory-line">{data.memory.line}</p>
              {data.background && (
                <>
                  <span className="exp-memory-k">一条链</span>
                  <ol className="exp-memory-chain">
                    {data.background.chain.map((c, i) => (
                      <li key={i}>
                        <span className="exp-memory-n">{i + 1}</span>
                        {c.step}
                      </li>
                    ))}
                  </ol>
                </>
              )}
            </div>
            <div className="exp-memory-map">
              <span className="exp-memory-k">一张图</span>
              <div className="exp-memory-frame">
                <iframe
                  src={data.diagram}
                  title={`${data.title} 架构图`}
                  loading="lazy"
                  tabIndex={-1}
                />
              </div>
              <p className="exp-memory-cap">
                就是下面「{SEC.solution.title}」那节里的图，这里先放个影子。
                <a href={data.diagram} target="_blank" rel="noreferrer">
                  在新窗口打开完整交互图 ↗
                </a>
              </p>
            </div>
          </section>

          <section className="exp-mind-block" aria-label="思维导图">
            <h2 className="exp-mind-h">
              一张导图<span className="exp-sub-note">三章九节，点任意一节直接跳过去。</span>
            </h2>
            <MindMap root={mindRoot} />
          </section>

          {data.related && data.related.length > 0 && (
            <nav className="exp-related" aria-label="相关专题">
              {data.related.map((r) => (
                <a className="exp-related-card" key={r.id} href={`/explains/${r.id}`}>
                  <span className="exp-related-label">{r.label}</span>
                  {r.note && <span className="exp-related-note">{r.note}</span>}
                  <span className="exp-related-cta">进入 →</span>
                </a>
              ))}
            </nav>
          )}

          {sections.map((s, i) => (
            <Fragment key={s.title}>
              {i === 0 || sections[i - 1].chapter !== s.chapter ? (
                <div className={"exp-chapter exp-chapter-" + s.chapter}>
                  <span className="exp-chapter-n">{CHAPTERS[s.chapter].n}</span>
                  <span className="exp-chapter-zh">{CHAPTERS[s.chapter].zh}</span>
                </div>
              ) : null}
              <section id={`sec-${i + 1}`} className="exp-sec">
                <h2>
                  {s.title} <span className="exp-hint">{s.hint}</span>
                </h2>
                {s.body}
              </section>
            </Fragment>
          ))}

          {data.questions.length > 0 && (
            <section id="sec-ask" className="exp-sec exp-qa">
              <h2>
                你大概率会问 <span className="exp-hint">想到这层的人都会问这几个</span>
              </h2>
              {data.questions.map((q, i) => (
                <details key={i}>
                  <summary>{q.q}</summary>
                  <p>{q.a}</p>
                </details>
              ))}
            </section>
          )}

          <footer className="exp-foot">
            这三章是固定的读法，换任何项目都这么读：「为什么做」说清一开始什么样、卡在哪几步、
            动手前立的是哪几条靶子；「怎么做」给一张图带着走一遍，再逐层看每块管什么、故意不让它做什么，
            最后落到用什么做、会踩什么坑；「做成什么」说清拿哪些数字算数，以及这次留下的判断和下次会先问的问题。
            想自己动手，从「实现」那节开始。
          </footer>
        </div>
      </div>
    </main>
  );
}
