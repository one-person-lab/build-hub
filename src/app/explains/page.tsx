import type { Metadata } from "next";
import "@/components/ExplainerView.css";
import explainersData from "@/data/explainers.json";

type Explainer = {
  title: string;
  category: "project" | "tech";
  oneLiner: string;
  forWhom: string;
  nodes: unknown[];
  walkthrough: { steps: unknown[] };
  boundaries: unknown[];
  questions: unknown[];
};

const LIB = explainersData as unknown as Record<string, Explainer>;

const CATEGORIES: { key: Explainer["category"]; label: string; desc: string }[] = [
  { key: "project", label: "项目实战", desc: "真实从 0 到 1 做过的项目：架构、实现与取舍。" },
  { key: "tech", label: "技术解读", desc: "想搞懂的知识点：框架怎么用透、怎么讲清。" },
];

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
  const entries = Object.entries(LIB);
  return (
    <main className="exp-main exp-index">
      <header className="exp-hero">
        <p className="exp-eyebrow">专题 · Deep Dive</p>
        <h1>把做过的系统，从架构讲到实现</h1>
        <p className="exp-oneLiner">
          每个专题回答同一串问题：系统里有什么 → 一条真实请求怎么走完 → 每层用什么做的 → 技术选型 → 边界与常见追问。
        </p>
        <p className="exp-forWhom">
          给想搞懂一个系统怎么运转、或者想照着做一个的人。
        </p>
      </header>

      {CATEGORIES.map((cat) => {
        const items = entries.filter(([, e]) => e.category === cat.key);
        return (
          <section className="exp-sec" key={cat.key}>
            <h2>
              {cat.label} <span className="exp-hint">{cat.desc}</span>
            </h2>
            {items.length > 0 ? (
              <div className="exp-index-grid">
                {items.map(([id, e]) => (
                  <a key={id} className="exp-index-card" href={`/explains/${id}`}>
                    <h2>{e.title}</h2>
                    <p className="exp-index-oneline">{e.oneLiner}</p>
                    <p className="exp-index-forwhom">{e.forWhom}</p>
                    <div className="exp-index-meta">
                      <span>{e.nodes.length} 个架构层</span>
                      <span>{e.walkthrough.steps.length} 步真实链路</span>
                      <span>{e.boundaries.length} 条边界</span>
                      <span>{e.questions.length} 个常见追问</span>
                    </div>
                    <span className="exp-index-cta">进入专题 →</span>
                  </a>
                ))}
              </div>
            ) : (
              <p className="exp-index-empty">这一类还在陆续补充中。</p>
            )}
          </section>
        );
      })}
    </main>
  );
}
