"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, FlaskConical, Search } from "lucide-react";
import { Badge, Button, Field, Select, Stats } from "@/components/proto/ui";
import { useProto } from "@/lib/proto/store";
import { RAG_EVAL_RUNS, type RagEvalCaseResult } from "@/lib/proto/rag-data";
import { DeltaText, EvalCrumb, EvalMockNote, ScoreBar } from "@/components/proto/eval-ui";

const METRICS = [
  { key: "recall5", label: "检索召回 Recall@5" },
  { key: "mrr", label: "排序 MRR" },
  { key: "ndcg5", label: "排序 nDCG@5" },
  { key: "contextRelevance", label: "上下文相关性" },
  { key: "answerAccuracy", label: "答案正确性" },
  { key: "citationAccuracy", label: "引用准确性" },
  { key: "refusalAccuracy", label: "拒答合理性" },
] as const;

export default function RagEvalPage() {
  const { toast } = useProto();
  const [runId, setRunId] = useState(RAG_EVAL_RUNS[1].id);
  const [failedOnly, setFailedOnly] = useState(false);
  const [q, setQ] = useState("");

  const run = RAG_EVAL_RUNS.find((r) => r.id === runId) ?? RAG_EVAL_RUNS[0];
  const baseline = RAG_EVAL_RUNS[0];
  const compare = RAG_EVAL_RUNS[1];
  const cases = useMemo(
    () =>
      run.cases.filter(
        (c) => (!failedOnly || !c.pass) && (!q || c.question.includes(q) || c.id.toLowerCase().includes(q.toLowerCase())),
      ),
    [run, failedOnly, q],
  );

  const failed = run.cases.filter((c) => !c.pass).length;

  return (
    <div>
      <EvalCrumb label="RAG 专项评测" />

      <div className="p-page-head">
        <div>
          <h1>RAG 专项评测</h1>
          <p>固定知识问答数据集，分项衡量召回、排序、上下文相关性、答案正确性、引用准确性与拒答合理性</p>
        </div>
        <div className="p-page-actions">
          <Link href="/proto/admin/kb/config" className="p-btn p-btn-secondary p-btn-md">
            模型与检索配置
          </Link>
          <Button
            icon={<FlaskConical size={13} />}
            onClick={() => toast(`已按 ${run.configId} 模拟重跑 ${run.cases.length} 条用例（不调用真实模型）`, "ok")}
          >
            重跑评测（模拟）
          </Button>
        </div>
      </div>

      <div className="p-card p-card-pad" style={{ marginBottom: 12 }}>
        <div className="p-grid-2">
          <Field label="评测运行" hint="两版固定运行，用于对比检索配置与重排收益">
            <Select value={runId} onChange={(e) => setRunId(e.target.value)}>
              {RAG_EVAL_RUNS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.id} · {r.name} · {r.at}
                </option>
              ))}
            </Select>
          </Field>
          <div className="p-row-ops" style={{ alignItems: "flex-end", justifyContent: "flex-start", gap: 10 }}>
            <Badge tone={run.id === RAG_EVAL_RUNS[1].id ? "ok" : "muted"}>
              {run.id === RAG_EVAL_RUNS[1].id ? "候选配置" : "对照基线"}
            </Badge>
            <span className="p-muted p-small">
              {run.datasetId} · {run.datasetVersion} · 配置 <span className="p-mono">{run.configId}</span> v{run.configVersion}
            </span>
          </div>
        </div>
        <div className="p-cite-meta">
          <span>Chat <b className="p-mono">{run.chatModel}</b></span>
          <span>Embedding <b className="p-mono">{run.embeddingModel}</b></span>
          <span>Rerank <b className="p-mono">{run.rerankModel ?? "未启用"}</b></span>
          <span>Prompt <b className="p-mono">{run.promptVersion}</b></span>
        </div>
        <p className="p-muted p-small" style={{ margin: "8px 0 0" }}>{run.note}</p>
      </div>

      <Stats
        items={[
          { label: "用例", value: run.cases.length, hint: `${failed} 条未通过` },
          { label: "召回 Recall@5", value: `${run.metrics.recall5}%`, tone: run.metrics.recall5 >= 90 ? "ok" : "warn" },
          { label: "上下文相关性", value: `${run.metrics.contextRelevance}%`, tone: run.metrics.contextRelevance >= 85 ? "ok" : "warn" },
          { label: "引用准确性", value: `${run.metrics.citationAccuracy}%`, tone: run.metrics.citationAccuracy >= 95 ? "ok" : "danger" },
          { label: "拒答合理性", value: `${run.metrics.refusalAccuracy}%`, tone: run.metrics.refusalAccuracy === 100 ? "ok" : "danger" },
        ]}
      />

      {baseline && (
        <div className="p-card" style={{ marginBottom: 12 }}>
          <div className="p-card-head">
            <div>
              <h3>配置对比</h3>
              <p>{compare.id} 相比 {baseline.id}；重排与拒答策略是主要变量</p>
            </div>
            <Link href={`/proto/admin/kb/config?config=${baseline.configId}`} className="p-btn p-btn-ghost p-btn-sm">
              打开基线配置
            </Link>
          </div>
          <div className="p-table-wrap">
            <table className="p-table">
              <thead>
                <tr>
                  <th>指标</th>
                  <th style={{ width: 220 }}>{baseline.id} · v{baseline.configVersion}</th>
                  <th style={{ width: 220 }}>{compare.id} · v{compare.configVersion}</th>
                  <th style={{ width: 100 }}>变化</th>
                </tr>
              </thead>
              <tbody>
                {METRICS.map((m) => (
                  <tr key={m.key}>
                    <td>{m.label}</td>
                    <td><ScoreBar value={baseline.metrics[m.key]} /></td>
                    <td><ScoreBar value={compare.metrics[m.key]} /></td>
                    <td><DeltaText from={baseline.metrics[m.key]} to={compare.metrics[m.key]} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="p-toolbar">
        <div className="p-toolbar-search">
          <Search size={13} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索问题或用例编号" />
        </div>
        <label className={`p-check${failedOnly ? " is-on" : ""}`} style={{ padding: "0 10px" }}>
          <input type="checkbox" checked={failedOnly} onChange={(e) => setFailedOnly(e.target.checked)} />
          <span><b>只看未通过</b></span>
        </label>
        <span className="p-toolbar-count">{cases.length} 条用例</span>
        <Link href={`/proto/admin/kb/retrieval?config=${run.configId}`} className="p-btn p-btn-secondary p-btn-sm">
          打开检索测试 <ArrowRight size={12} />
        </Link>
      </div>

      <div className="p-card">
        <div className="p-table-wrap">
          <table className="p-table">
            <thead>
              <tr>
                <th style={{ width: 72 }}>用例</th>
                <th>问题与期望</th>
                <th style={{ width: 150 }}>召回文档</th>
                <th style={{ width: 80 }}>Recall@5</th>
                <th style={{ width: 80 }}>nDCG@5</th>
                <th style={{ width: 90 }}>上下文</th>
                <th style={{ width: 90 }}>答案</th>
                <th style={{ width: 90 }}>引用</th>
                <th style={{ width: 90 }}>拒答</th>
                <th style={{ width: 90 }}>结论</th>
                <th style={{ width: 90 }} />
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => (
                <CaseRow key={c.id} c={c} configId={run.configId} />
              ))}
            </tbody>
          </table>
          {cases.length === 0 && (
            <p className="p-muted p-small" style={{ padding: 14, margin: 0 }}>没有符合条件的用例。</p>
          )}
        </div>
      </div>

      <div className="p-stack" style={{ marginTop: 12 }}>
        <div className="p-card p-card-pad">
          <h3 className="p-side-h">未通过项说明</h3>
          <ul className="p-issue-list">
            {run.cases
              .filter((c) => !c.pass)
              .map((c) => (
                <li key={c.id} className={c.expectedRefusal && !c.refusalCorrect ? "is-error" : "is-warn"}>
                  <b>{c.id}</b> {c.note}
                </li>
              ))}
            {failed === 0 && <li>本次运行全部通过。</li>}
          </ul>
        </div>
      </div>

      <EvalMockNote>
        RAG 专项指标由固定模拟结果计算；检索测试页可按同一配置复现问题，但不会连接真实向量数据库或模型服务。
      </EvalMockNote>
    </div>
  );
}

function CaseRow({ c, configId }: { c: RagEvalCaseResult; configId: string }) {
  const flag = (ok: boolean, on = "通过", off = "未通过") => (
    <Badge tone={ok ? "ok" : "danger"}>{ok ? on : off}</Badge>
  );
  return (
    <tr>
      <td><span className="p-mono p-small">{c.id}</span></td>
      <td>
        <b className="p-small">{c.question}</b>
        <div className="p-cell-sub">
          期望：{c.expectedRefusal ? "应拒答" : c.expectedDocIds.join(" / ") || "—"}
        </div>
      </td>
      <td>
        <span className="p-small p-mono">{c.retrievedDocIds.length ? c.retrievedDocIds.join(", ") : "未召回"}</span>
      </td>
      <td><span className="p-mono p-small">{c.recall5}%</span></td>
      <td><span className="p-mono p-small">{c.ndcg5}</span></td>
      <td><span className="p-mono p-small">{c.contextRelevance}</span></td>
      <td>{flag(c.answerCorrect, "正确", "错误")}</td>
      <td>{flag(c.citationAccurate, "准确", "错标")}</td>
      <td>{c.expectedRefusal ? flag(c.refusalCorrect, "正确", "应拒未拒") : <span className="p-muted p-small">不适用</span>}</td>
      <td>{flag(c.pass)}</td>
      <td>
        <Link
          href={`/proto/admin/kb/retrieval?q=${encodeURIComponent(c.question)}&config=${configId}`}
          className="p-link p-small"
        >
          复现
        </Link>
      </td>
    </tr>
  );
}
