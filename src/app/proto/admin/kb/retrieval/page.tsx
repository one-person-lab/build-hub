"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, CircleAlert, FlaskConical, Play, Search, SlidersHorizontal } from "lucide-react";
import { Badge, Button, EmptyState, Field, Select, Stats } from "@/components/proto/ui";
import { useProto } from "@/lib/proto/store";
import {
  CURRENT_CONFIG_ID,
  RAG_PATH_LABEL,
  RAG_TEST_QUESTIONS,
  type RetrievalRun,
} from "@/lib/proto/rag-data";

const scoreTone = (v: number) => (v >= 0.75 ? "ok" : v >= 0.5 ? "warn" : "danger");

export default function RetrievalTestPage() {
  const { state, runRetrieval } = useProto();
  const [configId, setConfigId] = useState(CURRENT_CONFIG_ID);
  const [question, setQuestion] = useState(RAG_TEST_QUESTIONS[0]);
  const [run, setRun] = useState<RetrievalRun | null>(null);
  const [err, setErr] = useState("");
  const bootstrapped = useRef(false);

  const configs = state.rag.configs;
  const cfg = configs.find((c) => c.id === configId) ?? configs[0];

  const execute = (text: string, cfgId: string) => {
    if (text.trim().length < 2) {
      setErr("问题至少 2 个字符");
      return;
    }
    const r = runRetrieval(text.trim(), { configId: cfgId, path: "rag" });
    setRun(r);
    setErr("");
  };

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;
    const sp = new URLSearchParams(window.location.search);
    const q = sp.get("q");
    const c = sp.get("config");
    const cfgId = c && configs.some((x) => x.id === c) ? c : CURRENT_CONFIG_ID;
    setConfigId(cfgId);
    if (q) {
      setQuestion(q);
      // 不返回清理函数：StrictMode 下二次挂载会因 bootstrapped 提前返回，清理会掐掉首次定时器
      setTimeout(() => execute(q, cfgId), 80);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const totalMs = run
    ? run.timings.rewrite + run.timings.embed + run.timings.retrieve + run.timings.rerank + run.timings.assemble + run.timings.generate
    : 0;

  return (
    <div>
      <div className="p-crumb">
        <Link href="/proto/admin/kb">知识库管理</Link>
        <span>/</span>
        <span>检索测试</span>
      </div>

      <div className="p-page-head">
        <div>
          <h1>检索测试</h1>
          <p>用同一套模拟索引调试问题改写、召回、阈值、重排与最终上下文；结果会写入 Trace</p>
        </div>
        <div className="p-page-actions">
          <Link href={`/proto/admin/kb/config?config=${configId}`} className="p-btn p-btn-secondary p-btn-md">
            <SlidersHorizontal size={13} /> 模型与检索配置
          </Link>
        </div>
      </div>

      <div className="p-card p-card-pad" style={{ marginBottom: 12 }}>
        <div className="p-grid-2">
          <Field label="检索配置" hint={cfg?.note}>
            <Select value={configId} onChange={(e) => setConfigId(e.target.value)}>
              {configs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.id} · v{c.version} · {c.state === "published" ? "已发布" : "草稿"} · {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="问题" required error={err} hint="改写规则只在混合检索开启时生效">
            <div className="p-inline-search">
              <Search size={13} />
              <input
                value={question}
                onChange={(e) => { setQuestion(e.target.value); setErr(""); }}
                onKeyDown={(e) => { if (e.key === "Enter") execute(question, configId); }}
                placeholder="例如：电池温度异常要间隔多久才能再飞？"
              />
              <Button variant="primary" size="sm" icon={<Play size={12} />} onClick={() => execute(question, configId)}>
                运行检索
              </Button>
            </div>
          </Field>
        </div>
        <div className="p-chips" style={{ marginTop: 10 }}>
          {RAG_TEST_QUESTIONS.map((q) => (
            <button key={q} onClick={() => { setQuestion(q); execute(q, configId); }}>
              {q}
            </button>
          ))}
        </div>
        <p className="p-muted p-small" style={{ margin: "8px 0 0" }}>
          当前配置：top {cfg?.topK} · 阈值 {cfg?.scoreThreshold.toFixed(2)} · 混合检索 {cfg?.hybrid ? `α ${cfg?.hybridAlpha}` : "关闭"} ·
          重排 {cfg?.rerank ? `${cfg.rerankModel} → 前 ${cfg.rerankTopN}` : "关闭"} · 最终上下文 {cfg?.finalContexts} 条
        </p>
      </div>

      {!run ? (
        <div className="p-card p-card-pad">
          <EmptyState
            title="还没有运行检索"
            hint="输入一个问题或点选上面的示例问题；不会调用真实模型或向量数据库"
            action={<Button variant="primary" icon={<FlaskConical size={13} />} onClick={() => execute(question, configId)}>运行示例</Button>}
          />
        </div>
      ) : (
        <div className="p-stack">
          <Stats
            items={[
              { label: "问题改写", value: run.rewritten ? "已改写" : "未改写", hint: run.rewritten ?? "规则未命中" },
              { label: "召回 / 过阈值", value: `${run.candidates.length} / ${run.candidates.filter((c) => c.rank).length}`, hint: `top ${run.topK} · ≥ ${run.scoreThreshold.toFixed(2)}` },
              { label: "最终上下文", value: `${run.selected.length} 条`, hint: `${run.contextTokens} tok` },
              { label: "模型生成", value: `${run.timings.generate} ms`, hint: `总耗时 ${totalMs} ms（模拟）` },
            ]}
          />

          <div className="p-card p-card-pad">
            <div className="p-row-between" style={{ marginBottom: 8 }}>
              <div>
                <h3 className="p-side-h">本次检索</h3>
                <p className="p-muted p-small" style={{ margin: 0 }}>
                  {run.id} · {run.createdAt} · {RAG_PATH_LABEL[run.path]}
                </p>
              </div>
              <div className="p-row-ops">
                <Link href={`/proto/admin/traces/${run.traceId}`} className="p-btn p-btn-secondary p-btn-sm">
                  查看 Trace <ArrowRight size={12} />
                </Link>
                <Link
                  href={`/proto/admin/eval/datasets`}
                  className="p-btn p-btn-ghost p-btn-sm"
                >
                  登记为评测用例
                </Link>
              </div>
            </div>
            <div className="p-cite-meta">
              <span>配置 <b className="p-mono">{run.configId}</b> v{run.configVersion}</span>
              <span>向量 <b className="p-mono">{run.embeddingModel}</b></span>
              <span>重排 <b className="p-mono">{run.rerankModel ?? "未启用"}</b></span>
              <span>索引 <b className="p-mono">{run.indexId}</b></span>
            </div>
          </div>

          <div className="p-card p-card-pad">
            <h3 className="p-side-h">问题改写</h3>
            <KeyValueRows
              rows={[
                ["原始问题", run.question],
                ["改写后", run.rewritten ?? "未改写（规则未命中或混合检索关闭）"],
              ]}
            />
          </div>

          <div className="p-card">
            <div className="p-card-head">
              <div>
                <h3>召回候选与评分</h3>
                <p>融合分决定是否过阈值；重排分决定最终排序与入选</p>
              </div>
              <span className="p-muted p-small">{run.candidates.length} 个候选</span>
            </div>
            <div className="p-table-wrap">
              <table className="p-table">
                <thead>
                  <tr>
                    <th style={{ width: 56 }}>排名</th>
                    <th>文档 / 片段</th>
                    <th style={{ width: 80 }}>向量分</th>
                    <th style={{ width: 80 }}>关键词</th>
                    <th style={{ width: 80 }}>融合分</th>
                    <th style={{ width: 80 }}>重排分</th>
                    <th style={{ width: 160 }}>结果</th>
                  </tr>
                </thead>
                <tbody>
                  {run.candidates.map((c) => (
                    <tr key={c.chunkId}>
                      <td><span className="p-mono">{c.rank ? String(c.rank).padStart(2, "0") : "—"}</span></td>
                      <td>
                        <b className="p-small">{c.docId} · {c.section}</b>
                        <div className="p-cell-sub">{c.text.slice(0, 46)}…</div>
                      </td>
                      <td><span className="p-mono">{c.vectorScore.toFixed(3)}</span></td>
                      <td><span className="p-mono">{c.keywordScore.toFixed(3)}</span></td>
                      <td><Badge tone={scoreTone(c.fusedScore)}>{c.fusedScore.toFixed(3)}</Badge></td>
                      <td><span className="p-mono">{c.rerankScore?.toFixed(3) ?? "—"}</span></td>
                      <td>
                        {c.selected ? (
                          <Badge tone="ok">入选上下文</Badge>
                        ) : (
                          <span className="p-muted p-small">{c.reason ?? "未入选"}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-grid-2">
            <div className="p-card p-card-pad">
              <div className="p-row-between" style={{ marginBottom: 8 }}>
                <h3 className="p-side-h">最终上下文</h3>
                <span className="p-muted p-small">{run.contextTokens} tok</span>
              </div>
              {run.selected.length === 0 ? (
                <div className="p-warn-banner" style={{ marginBottom: 0 }}>
                  <CircleAlert size={14} /> {run.lowReason ?? "没有候选通过阈值"}
                </div>
              ) : (
                <div className="p-lines">
                  {run.selected.map((c, i) => (
                    <div key={c.chunkId} className="p-line" style={{ alignItems: "flex-start" }}>
                      <div>
                        <b>[{i + 1}] {c.docId} · {c.section}</b>
                        <span>{c.text}</span>
                      </div>
                      <span className="p-mono p-small">{c.tokens} tok</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-card p-card-pad">
              <div className="p-row-between" style={{ marginBottom: 8 }}>
                <h3 className="p-side-h">模拟回答</h3>
                <Badge tone={run.refused ? "danger" : run.lowConfidence ? "warn" : "ok"}>
                  {run.refused ? "已拒答" : "已生成"}
                </Badge>
              </div>
              <p className="p-body-text">{run.answer}</p>
              <h4 className="p-side-h" style={{ marginTop: 10 }}>引用来源</h4>
              {run.citations.length === 0 ? (
                <div className="p-note">没有可引用片段。</div>
              ) : (
                <ul className="p-issue-list">
                  {run.citations.map((c, i) => (
                    <li key={c.chunkId}>
                      <b>[{i + 1}] {c.docName}</b> · {c.section} · {c.score.toFixed(3)}
                      <div className="p-muted p-small">{c.quote.slice(0, 52)}…</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="p-note">
            演示环境使用本地确定性检索模拟：中文按 2-gram 切词、向量分与融合分为近似计算；未部署真实向量数据库、Embedding 或 Rerank 服务。
          </div>
        </div>
      )}
    </div>
  );
}

function KeyValueRows({ rows }: { rows: [string, string][] }) {
  return (
    <div className="p-lines">
      {rows.map(([k, v]) => (
        <div key={k} className="p-line">
          <span>{k}</span>
          <b style={{ fontWeight: 400 }}>{v}</b>
        </div>
      ))}
    </div>
  );
}
