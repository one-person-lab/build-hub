"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  DELIVERY_STEPS,
  ENGINEERING_PRACTICES,
  PRACTICE_SECTIONS,
  SOURCE_LABELS,
} from "@/data/engineering-practices";
import type { ContentBlock, Practice, SourceKind } from "@/lib/engineering-types";
import IcePanelDiagram, { DiagramStatic } from "./IcePanelDiagram";
import CopyButton from "./CopyButton";
import "./AssetLibraryView.css";
import "./ArchitectureView.css";
import "./EngineeringView.css";

/** 与图鉴 / 架构同款 scroll-spy：哪个分区进入视口，左侧目录高亮哪条 */
function useSectionSpy(ids: string[]) {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (sections.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const tops = entries.filter((e) => e.isIntersecting);
        if (tops.length === 0) return;
        const topmost = tops.reduce((a, b) =>
          a.boundingClientRect.top < b.boundingClientRect.top ? a : b
        );
        setActive(topmost.target.id);
      },
      { rootMargin: "-150px 0px -55% 0px", threshold: 0 }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [ids]);
  return active;
}

const INDEX_SECTIONS = [
  { id: "ep-index-flow", label: "交付流程" },
  { id: "ep-index-handbooks", label: "实践手册" },
];

const sourceLabel = (id: SourceKind) =>
  SOURCE_LABELS.find((s) => s.id === id)?.label ?? "";

function SpecBlock({ block }: { block: ContentBlock }) {
  return (
    <article className="ep-block">
      <p className="ep-block-src">{sourceLabel(block.source)}</p>
      <h3>{block.title}</h3>
      <ul className="ep-list">
        {block.items.map((it) => (
          <li key={it}>{it}</li>
        ))}
      </ul>
      {block.code ? (
        <details className="ep-details">
          <summary>示例</summary>
          <pre className="ep-code">{block.code}</pre>
        </details>
      ) : null}
    </article>
  );
}

/* ============================ 列表页 ============================ */

export function EngineeringIndex() {
  const ids = useMemo(() => INDEX_SECTIONS.map((s) => s.id), []);
  const active = useSectionSpy(ids);

  return (
    <main>
      <div className="catalog-page catalog-directory-page">
        <div className="catalog-layout catalog-directory-layout">
          <aside className="cat-live-toc" aria-label="工程实践目录">
            <nav className="cat-live-toc-nav">
              {INDEX_SECTIONS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={"cat-live-toc-item" + (active === s.id ? " is-active" : "")}
                  onClick={() =>
                    document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }
                >
                  <span>{s.label}</span>
                </button>
              ))}
            </nav>
          </aside>
          <div className="grid-wrap arc-grid-wrap ep-grid-wrap">
            <header className="catalog-heading">
              <h1>工程实践</h1>
              <p className="cat-page-intro">
                AI 原生软件工程的实践体系：定义、实现、验证、交付。
              </p>
            </header>

            <section className="cat-section ep-section" id="ep-index-flow">
              <h2 className="cat-title">交付流程</h2>
              <nav className="ep-pipeline" aria-label="工程交付流程">
                {DELIVERY_STEPS.map((step) => {
                  const practice = ENGINEERING_PRACTICES.find((p) => p.id === step.practice);
                  if (!practice) return null;
                  return (
                    <Link
                      key={step.label}
                      href={`/engineering/${practice.id}`}
                      className="ep-pipeline-step"
                      title={step.desc}
                    >
                      <b>{step.label}</b>
                      <span>{practice.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </section>

            <section className="cat-section ep-section" id="ep-index-handbooks">
              <h2 className="cat-title">实践手册</h2>
              <div className="grid ep-card-grid">
                {ENGINEERING_PRACTICES.map((p) => (
                  <Link key={p.id} href={`/engineering/${p.id}`} className="card ep-card">
                    <div className="card-thumb ep-thumb">
                      <DiagramStatic spec={p.flow.diagram} />
                    </div>
                    <div className="card-head">
                      <span className="card-title-group">
                        <h3>
                          {p.name}
                          <span>{p.en}</span>
                        </h3>
                      </span>
                    </div>
                    <div className="card-tagline card-quote">{p.tagline}</div>
                    <div className="ep-card-meta">
                      <span>{p.handbook}</span>
                      <span title={p.priority === "P0" ? "优先建设" : "后续建设"}>
                        {p.priority}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
              <p className="ep-note">规范条目标注来源；案例区分真实项目与演示案例。</p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ============================ 详情页 ============================ */

export function PracticeDetail({ practice }: { practice: Practice }) {
  const ids = useMemo(() => PRACTICE_SECTIONS.map((s) => s.id), []);
  const active = useSectionSpy(ids);
  const caseLabel = practice.workshop.kind === "real" ? "真实项目" : "演示案例";

  return (
    <main>
      <div className="catalog-page catalog-directory-page">
        <div className="catalog-layout catalog-directory-layout">
          <aside className="cat-live-toc" aria-label="本文目录">
            <nav className="cat-live-toc-nav">
              {PRACTICE_SECTIONS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={"cat-live-toc-item" + (active === s.id ? " is-active" : "")}
                  onClick={() =>
                    document
                      .getElementById(s.id)
                      ?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }
                >
                  <span>{s.label}</span>
                </button>
              ))}
            </nav>
          </aside>
          <div className="grid-wrap arc-grid-wrap ep-grid-wrap">
            <header className="catalog-heading arc-heading">
              <p className="arc-crumb">
                <Link
                  href="/engineering"
                  className="detail-back-button"
                  aria-label="返回工程实践"
                  title="返回工程实践"
                >
                  <svg className="ui-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M19 12H5m6-6-6 6 6 6" />
                  </svg>
                </Link>
                <Link href="/engineering">工程实践</Link>
                <span aria-hidden> / </span>
                {practice.no}
              </p>
              <h1>{practice.name}</h1>
              <p className="cat-page-intro">{practice.tagline}</p>
              <p className="ep-meta-line">
                {practice.priority} · {practice.handbook}
              </p>
            </header>

            <section className="cat-section ep-section" id="ep-goal">
              <h2 className="cat-title">目标</h2>
              <p className="ep-lead">{practice.goal.lead}</p>
              <ul className="ep-list ep-list-cols">
                {practice.goal.items.map((it) => (
                  <li key={it}>{it}</li>
                ))}
              </ul>
            </section>

            <section className="cat-section ep-section" id="ep-principles">
              <h2 className="cat-title">原则</h2>
              <ol className="ep-principles">
                {practice.principles.map((kp) => (
                  <li key={kp.title}>
                    <b>{kp.title}</b>
                    <span>{kp.body}</span>
                  </li>
                ))}
              </ol>
            </section>

            <section className="cat-section ep-section" id="ep-flow">
              <h2 className="cat-title">流程</h2>
              <IcePanelDiagram spec={practice.flow.diagram} />
              <details className="ep-details">
                <summary>阶段与产物</summary>
                <div className="ep-stage-wrap">
                  <table className="ep-stage-table">
                    <thead>
                      <tr>
                        <th>阶段</th>
                        <th>输入</th>
                        <th>处理</th>
                        <th>输出</th>
                      </tr>
                    </thead>
                    <tbody>
                      {practice.flow.stages.map((s) => (
                        <tr key={s.stage}>
                          <td data-label="阶段">{s.stage}</td>
                          <td data-label="输入">{s.input}</td>
                          <td data-label="处理">{s.process}</td>
                          <td data-label="输出">{s.output}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </section>

            <section className="cat-section ep-section" id="ep-specs">
              <h2 className="cat-title">规范</h2>
              <div className="ep-spec-grid">
                {practice.specs.map((b) => (
                  <SpecBlock key={b.title} block={b} />
                ))}
              </div>
              <details className="ep-details">
                <summary>交付物与提示词模板</summary>
                <ul className="ep-list ep-list-cols ep-deliverables">
                  {practice.deliverables.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
                <div className="ep-prompt">
                  <pre className="ep-prompt-text">{practice.prompt.text}</pre>
                  <div className="ep-prompt-bar">
                    <CopyButton
                      text={practice.prompt.text}
                      label="复制提示词"
                      copiedLabel="已复制"
                      failLabel="复制失败"
                      className="ep-copy-btn"
                    />
                  </div>
                </div>
              </details>
              <details className="ep-details">
                <summary>行业参考</summary>
                <ul className="ep-refs">
                  {practice.refs.map((r) => (
                    <li key={r.name}>
                      <a href={r.href} target="_blank" rel="noopener noreferrer">
                        <b>
                          {r.name}
                          <span className="ep-ref-out" aria-hidden>
                            ↗
                          </span>
                        </b>
                        <span>{r.note}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </details>
            </section>

            <section className="cat-section ep-section" id="ep-case">
              <h2 className="cat-title">
                案例
                <span className={`ep-case-kind is-${practice.workshop.kind}`}>{caseLabel}</span>
              </h2>
              <h3 className="ep-case-title">{practice.workshop.title}</h3>
              <ul className="ep-list">
                {practice.workshop.items.map((it) => (
                  <li key={it}>{it}</li>
                ))}
              </ul>
              <p className="ep-note">{practice.workshop.evidence}</p>
            </section>

            <section className="cat-section ep-section" id="ep-results">
              <h2 className="cat-title">效果与局限</h2>
              <div className="ep-metrics">
                {practice.results.metrics.map((m) => (
                  <div className="ep-metric" key={m.label}>
                    <span className="ep-metric-value">{m.value}</span>
                    <span className="ep-metric-label">{m.label}</span>
                    <p>{m.note}</p>
                  </div>
                ))}
              </div>
              <h3 className="ep-subhead">局限</h3>
              <ul className="ep-list">
                {practice.results.limitations.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
              <p className="ep-note">{practice.results.evidence}</p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
