import type { Metadata } from "next";
import "@/components/ExplainerView.css";
import explainersData from "@/data/explainers.json";

type Explainer = {
  title: string;
  category: "project" | "tech";
  oneLiner: string;
  memory?: { line?: string };
  nodes: unknown[];
  walkthrough: { steps: unknown[] };
  boundaries: unknown[];
  questions: unknown[];
};

const LIB = explainersData as unknown as Record<string, Explainer>;

const CATEGORY_LABEL: Record<Explainer["category"], string> = {
  project: "项目实战",
  tech: "技术解读",
};

/** 系列有先后：问答助手在前，Copilot 在后；独立项目排最后。 */
const ORDER = ["drone-qa-assistant", "drone-copilot", "qiankun-data-platform"];

const KICKER: Record<string, string> = {
  "drone-qa-assistant": "无人机系列 · 上篇",
  "drone-copilot": "无人机系列 · 下篇",
  "qiankun-data-platform": "独立项目",
};

/** 中文标题在窄屏断行时，别把「无人机」「智能助手」拆开。 */
const KEEP_TOGETHER = ["无人机", "智能问答助手", "智能助手"];

function renderTitle(title: string) {
  return title.split(new RegExp(`(${KEEP_TOGETHER.join("|")})`, "g")).map((part, i) =>
    KEEP_TOGETHER.includes(part) ? (
      <span className="exp-index-nw" key={i}>{part}</span>
    ) : (
      part
    ),
  );
}

export const metadata: Metadata = {
  title: "专题｜BuildHub · 把系统从架构讲到实现",
  description:
    "每个专题回答同一串问题：系统里有什么、一条真实请求怎么走完、每层用什么做的、技术选型、边界与常见追问。含项目实战与技术解读两类。",
  openGraph: {
    title: "专题｜BuildHub",
    description: "从全景到实现，把一个系统讲到人能看懂、能照着做。",
  },
};

export default function ExplainsIndexPage() {
  const entries = Object.entries(LIB).sort(([a], [b]) => {
    const ia = ORDER.indexOf(a);
    const ib = ORDER.indexOf(b);
    return (ia === -1 ? ORDER.length : ia) - (ib === -1 ? ORDER.length : ib);
  });

  const totals = entries.reduce(
    (n, [, e]) => ({
      layers: n.layers + e.nodes.length,
      steps: n.steps + e.walkthrough.steps.length,
      boundaries: n.boundaries + e.boundaries.length,
    }),
    { layers: 0, steps: 0, boundaries: 0 },
  );

  const wideId = entries.length % 2 === 1 ? entries[entries.length - 1][0] : null;
  const hasTech = entries.some(([, e]) => e.category === "tech");

  return (
    <main className="exp-main exp-index">
      <header className="exp-hero">
        <p className="exp-eyebrow">专题 · DEEP DIVE</p>
        <h1>把做过的系统，从架构讲到实现</h1>
        <p className="exp-oneLiner">
          每篇专题都对应一个真做过的系统：系统里有什么、一条真实请求怎么走完、每层用什么做的、边界在哪。
        </p>
        <div className="exp-index-facts">
          <span><b>{entries.length}</b> 篇专题</span>
          <span><b>{totals.layers}</b> 层架构</span>
          <span><b>{totals.steps}</b> 步链路</span>
          <span><b>{totals.boundaries}</b> 条边界</span>
        </div>
      </header>

      <section className="exp-index-wall" aria-label="专题列表">
        {entries.map(([id, e], index) => (
          <a
            key={id}
            className={`exp-index-card${id === wideId ? " is-wide" : ""}`}
            href={`/explains/${id}`}
          >
            <div className="exp-index-cover">
              <div className="exp-index-cover-top">
                <span className="exp-index-num">{String(index + 1).padStart(2, "0")}</span>
                <span className="exp-index-layers">{e.nodes.length} 层</span>
              </div>
              <p className="exp-index-quote">{e.memory?.line ?? e.oneLiner}</p>
            </div>
            <div className="exp-index-body">
              <p className="exp-index-kicker">{KICKER[id] ?? CATEGORY_LABEL[e.category]}</p>
              <h2>{renderTitle(e.title)}</h2>
              <p className="exp-index-oneline">{e.oneLiner}</p>
              <p className="exp-index-meta">
                {e.nodes.length} 层架构 · {e.walkthrough.steps.length} 步真实链路 ·{" "}
                {e.questions.length} 个常见追问
              </p>
              <span className="exp-index-go">进入专题</span>
            </div>
          </a>
        ))}
      </section>

      <section className="exp-index-note">
        <h2>每篇都按同一套框架写</h2>
        <p>不是各写各的。每篇都是同一串问题、同一个顺序，所以能横向比，也能拆开照着做。</p>
        <div className="exp-index-framework">
          <div className="exp-index-fw">
            <span className="exp-index-fw-n">01</span>
            <div><b>为什么做</b><p>背景 → 问题 → 目标。先看清原来卡在哪，再动手。</p></div>
          </div>
          <div className="exp-index-fw">
            <span className="exp-index-fw-n">02</span>
            <div><b>怎么做</b><p>方案 → 架构 → 实现。一张图、一条链、每层用什么。</p></div>
          </div>
          <div className="exp-index-fw">
            <span className="exp-index-fw-n">03</span>
            <div><b>做成什么</b><p>结果 → 沉淀 → 反思。哪些数字是真的，哪些坑下回还会踩。</p></div>
          </div>
        </div>
        {!hasTech && (
          <p className="exp-index-coming"><b>技术解读</b> 这一类还在陆续补充中。</p>
        )}
      </section>
    </main>
  );
}
