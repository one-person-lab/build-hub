import type { Metadata } from "next";
import "@/components/PlaybookView.css";
import type { Playbook } from "@/components/PlaybookView";
import { isGuide, type Guide } from "@/lib/playbook-types";
import playbooksData from "@/data/playbooks.json";

const LIB = playbooksData as unknown as Record<string, Playbook | Guide>;

// 只收录已有条目的分类，空分类不上页签
const CATEGORY_LABELS: { key: string; label: string; desc: string }[] = [
  { key: "framework", label: "方法框架", desc: "一套问完就能看清全局的自查框架。" },
  { key: "pipeline", label: "操作流水线", desc: "重复第二遍就该照着跑的标准流程。" },
  { key: "guide", label: "实践指南", desc: "一件大事的来龙去脉和落地做法，一次讲透。" },
];

type Entry = {
  id: string;
  title: string;
  hook: string;
  unit: string;
  lastVerified?: string;
  parts: { n: string; label: string }[];
};

function toEntry(id: string, p: Playbook | Guide): Entry {
  if (isGuide(p)) {
    return {
      id,
      title: p.title,
      hook: p.hook ?? p.summary ?? "",
      unit: "节",
      lastVerified: p.lastVerified,
      parts: p.sections.map((s) => ({ n: s.n, label: s.title })),
    };
  }
  return {
    id,
    title: p.title,
    hook: p.hook ?? p.summary ?? "",
    unit: "步",
    lastVerified: p.lastVerified,
    parts: p.steps.map((s, i) => ({ n: String(i + 1).padStart(2, "0"), label: s.name })),
  };
}

export const metadata: Metadata = {
  title: "手册｜BuildHub · 照着跑的流程，一次讲透的做法",
  description:
    "两种体例：分步自查手册每步带完成标志、写清常见答错，附一份能直接发给 Agent 的清单；实践指南把一件事的来龙去脉和落地做法一次讲完。",
  openGraph: {
    title: "手册｜BuildHub",
    description: "照着跑的流程，和一次讲透的做法。",
  },
};

const THUMB_ROWS = 4;

export default function PlaybooksIndexPage() {
  const groups = CATEGORY_LABELS.map((cat) => ({
    ...cat,
    id: `cat-${cat.key}`,
    items: Object.entries(LIB)
      .filter(([, p]) => p.category === cat.key)
      .map(([id, p]) => toEntry(id, p)),
  })).filter((g) => g.items.length > 0);

  return (
    <main className="pbx-main">
      <div className="pbx-wrap pbx-index">
        <header className="pbx-hero">
          <h1>手册</h1>
          <p>每篇只讲一件事：什么时候用、怎么做、做到什么程度算过。</p>
        </header>

        <nav className="pbx-cats" aria-label="手册分类">
          {groups.map((g) => (
            <a className="pbx-cat" key={g.id} href={`#${g.id}`}>
              {g.label}
              <em>{g.items.length}</em>
            </a>
          ))}
          <span className="pbx-cats-total">
            共 {groups.reduce((n, g) => n + g.items.length, 0)} 篇
          </span>
        </nav>

        {groups.map((g) => (
          <section className="pbx-sec" id={g.id} key={g.id}>
            <h2 className="pbx-sec-title">
              <span className="pbx-sec-name">{g.label}</span>
              <span>
                {g.items.length} 篇 · {g.desc}
              </span>
            </h2>
            <div className="pbx-grid">
              {g.items.map((e) => (
                <a className="pbx-item" key={e.id} href={`/playbooks/${e.id}`}>
                  <div className="pbx-thumb" aria-hidden="true">
                    {e.parts.slice(0, THUMB_ROWS).map((part) => (
                      <span className="pbx-thumb-row" key={part.n}>
                        <i>{part.n}</i>
                        <b>{part.label}</b>
                      </span>
                    ))}
                    {e.parts.length > THUMB_ROWS ? (
                      <span className="pbx-thumb-more">
                        还有 {e.parts.length - THUMB_ROWS} {e.unit}
                      </span>
                    ) : null}
                  </div>
                  <h3 className="pbx-item-title">{e.title}</h3>
                  <p className="pbx-item-hook">{e.hook}</p>
                  <p className="pbx-item-meta">
                    <span>
                      {e.parts.length} {e.unit}
                      {e.lastVerified ? <em>最后核对 {e.lastVerified}</em> : null}
                    </span>
                    <span className="pbx-item-cta">打开 →</span>
                  </p>
                </a>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
