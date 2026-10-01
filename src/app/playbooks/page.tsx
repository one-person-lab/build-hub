import type { Metadata } from "next";
import "@/components/PlaybookView.css";
import type { Playbook } from "@/components/PlaybookView";
import playbooksData from "@/data/playbooks.json";

const LIB = playbooksData as unknown as Record<string, Playbook>;

// 只收录已有条目的分类，空分类不上页签
const CATEGORY_LABELS: { key: string; label: string; desc: string }[] = [
  { key: "framework", label: "方法框架", desc: "一套问完就能看清全局的自查框架。" },
  { key: "pipeline", label: "操作流水线", desc: "重复第二遍就该照着跑的标准流程。" },
];

export const metadata: Metadata = {
  title: "操作手册｜BuildHub · 拿走就能照着跑的 SOP",
  description:
    "把评论区里「我也想做点自己的东西」要的资料整理成可照着跑的手册：每步带完成标志、写清常见答错，附一份能直接发给 Agent 的自查清单。",
  openGraph: {
    title: "操作手册｜BuildHub",
    description: "拿走就能照着跑的 SOP：每步带完成标志，附可复制的 Agent 清单。",
  },
};

export default function PlaybooksIndexPage() {
  const entries = Object.entries(LIB);

  return (
    <main className="pbx-main">
      <div className="pbx-wrap">
        <header className="pbx-hero">
          <h1>操作手册</h1>
          <p>
            那些在评论区说「我发你」的东西，都在这里。每篇只讲一件事：什么时候用、照着怎么走完、每一步做到什么程度算过——不用私信等回复。
          </p>
        </header>

        {CATEGORY_LABELS.map((cat) => {
          const items = entries.filter(([, p]) => p.category === cat.key);
          if (items.length === 0) return null;
          return (
            <section className="pbx-sec" key={cat.key}>
              <h2>{cat.label}</h2>
              <p className="pbx-sec-desc">{cat.desc}</p>
              <div className="pbx-grid">
                {items.map(([id, p]) => (
                  <a className="pbx-card" key={id} href={`/playbooks/${id}`}>
                    <h3>{p.title}</h3>
                    <p>{p.summary}</p>
                    <div className="pbx-meta">
                      <span>{p.steps.length} 步</span>
                      {p.lastVerified ? <span>最后核对 {p.lastVerified}</span> : null}
                    </div>
                    <span className="pbx-cta">打开手册 →</span>
                  </a>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
