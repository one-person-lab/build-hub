"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CircleAlert, ShieldCheck } from "lucide-react";
import { Badge, Button, EmptyState, KeyValue, Stats, Tabs } from "@/components/proto/ui";
import { useProto } from "@/lib/proto/store";
import { RISK_LABEL, type TraceStep } from "@/lib/proto/data";
import {
  buildContextSnapshot,
  buildErrorAnalysis,
  buildModelCalls,
  buildToolCalls,
  contextPolicyByAgent,
  SYSTEM_PROMPT_ID,
  taskPromptPurpose,
  type ContextItem,
} from "@/lib/proto/ai-data";
import { RAG_PATH_LABEL } from "@/lib/proto/rag-data";

type TabKey = "chain" | "model" | "tool" | "retrieval" | "context" | "errors";

const KIND_LABEL: Record<TraceStep["kind"], string> = {
  message: "消息",
  intent: "意图",
  query: "查询",
  tool: "工具",
  guard: "校验",
  confirm: "确认",
  retrieval: "检索",
  result: "结果",
};

const ITEM_STATE_LABEL: Record<ContextItem["state"], string> = {
  used: "已使用",
  compressed: "已压缩",
  dropped: "已丢弃",
};

const ITEM_STATE_TONE: Record<ContextItem["state"], "ok" | "warn" | "muted"> = {
  used: "ok",
  compressed: "warn",
  dropped: "muted",
};

export default function TraceDetailPage() {
  const params = useParams<{ id: string }>();
  const { state } = useProto();
  const trace = state.traces.find((t) => t.id === decodeURIComponent(params.id));
  const [idx, setIdx] = useState(0);
  const [tab, setTab] = useState<TabKey>("chain");

  const total = useMemo(() => trace?.steps.reduce((s, x) => s + x.ms, 0) ?? 0, [trace]);
  const modelCalls = useMemo(() => (trace ? buildModelCalls(trace) : []), [trace]);
  const toolCalls = useMemo(() => (trace ? buildToolCalls(trace) : []), [trace]);
  const errors = useMemo(() => (trace ? buildErrorAnalysis(trace) : []), [trace]);
  const ragRun = useMemo(
    () => (trace?.retrievalRunId ? state.rag.runs.find((r) => r.id === trace.retrievalRunId) : undefined),
    [trace, state.rag.runs],
  );

  const contextSnapshot = useMemo(() => {
    if (!trace) return null;
    const task = state.tasks.find((t) => t.id === trace.taskId);
    const session = state.sessions.find((s) => s.id === (task?.sessionId ?? trace.sessionId));
    const policy = contextPolicyByAgent(trace.agentId.split("@")[0]) ?? state.ai.contextPolicies[0];
    if (!policy) return null;
    const model = buildModelCalls(trace)[0]?.model ?? "qwen3.8-flash";
    return buildContextSnapshot({ trace, task, session, policy, model, kbDocs: state.kbDocs });
  }, [trace, state.tasks, state.sessions, state.ai.contextPolicies, state.kbDocs]);

  if (!trace) {
    return (
      <div className="p-card p-card-pad">
        <EmptyState title="Trace 不存在" hint="演示数据可能已被重置" action={<Link href="/proto/admin/traces" className="p-btn p-btn-primary p-btn-md">返回列表</Link>} />
      </div>
    );
  }

  const step = trace.steps[Math.min(idx, trace.steps.length - 1)];
  const task = state.tasks.find((t) => t.id === trace.taskId);
  const gotoStep = (stepKey: string) => {
    const i = trace.steps.findIndex((s) => s.key === stepKey);
    if (i >= 0) setIdx(i);
    setTab("chain");
  };

  const totalTokens = modelCalls.reduce((s, c) => s + c.tokensIn + c.tokensOut, 0);
  const totalCost = modelCalls.reduce((s, c) => s + c.cost, 0);
  const usedPct = contextSnapshot ? Math.round((contextSnapshot.used / contextSnapshot.budget) * 100) : 0;
  const skill = trace.skillId ? state.skills.items.find((s) => s.id === trace.skillId) : undefined;
  const skillVersion = skill?.versions.find((v) => v.id === trace.skillVersionId);
  const skillRun = state.skills.runs.find((r) => r.traceId === trace.id);
  const wf = trace.workflowId ? state.workflows.find((w) => w.id === trace.workflowId) : undefined;
  const wfVersionKey = trace.workflowVersion ?? wf?.version;

  const sysPrompt = state.ai.prompts.find((p) => p.id === SYSTEM_PROMPT_ID);
  const sysPublished = sysPrompt?.versions.find((v) => v.state === "published");
  const sysPromptKey = trace.promptVersion ?? (sysPrompt && sysPublished ? `${sysPrompt.id}@${sysPublished.version}` : undefined);
  const promptForTask = (taskType: string) => {
    const p = state.ai.prompts.find((x) => x.purpose === taskPromptPurpose(taskType));
    const v = p?.versions.find((x) => x.state === "published");
    return p && v ? { id: p.id, key: `${p.id}@${v.version}` } : null;
  };
  const taskPromptKeys = Array.from(
    new Set(modelCalls.map((c) => promptForTask(c.taskType)?.key).filter((x): x is string => !!x)),
  );

  return (
    <div>
      <div className="p-crumb">
        <Link href="/proto/admin/traces">运行追踪</Link>
        <span>/</span>
        <span>{trace.id}</span>
      </div>

      <div className="p-page-head">
        <div>
          <h1 className="p-mono">{trace.id}</h1>
          <p>
            {trace.agentId} · {trace.steps.length} 个步骤 · 总耗时 {total} ms
            {task ? <> · <Link href={`/proto/tasks/${task.id}`} className="p-link">{task.name}</Link></> : null}
          </p>
        </div>
        <div className="p-page-actions">
          {skill && (
            <Badge tone="brand">
              Skill {skill.name} {skillVersion?.version ?? ""}
            </Badge>
          )}
          <Badge tone={trace.status === "ok" ? "ok" : trace.status === "running" ? "active" : "danger"}>
            {trace.status === "ok" ? "成功" : trace.status === "running" ? "运行中" : "失败"}
          </Badge>
        </div>
      </div>

      {skill && (
        <div className="p-skill-strip">
          <Badge tone="brand">{skill.id}</Badge>
          <span>
            Skill 版本 {skillVersion?.version ?? "—"} · {skillVersion?.steps.length ?? 0} 个步骤 · Agent {trace.agentId}
          </span>
          <Link href={`/proto/admin/agents/skills/${skill.id}`} className="p-link p-small">
            查看定义
          </Link>
          {skillRun && (
            <Link href={`/proto/admin/eval/skills`} className="p-link p-small">
              在评测中查看
            </Link>
          )}
        </div>
      )}

      {wf && (
        <div className="p-skill-strip">
          <Badge tone="brand">工作流</Badge>
          <span>
            <span className="p-mono">{wf.id}</span> · {wf.name} · <span className="p-mono">{wfVersionKey}</span> ·{" "}
            {wf.source === "copilot" ? "对话生成" : "手动创建"} ·{" "}
            {wf.status === "draft" ? "草稿" : wf.enabled ? "已发布并启用" : "已发布未启用"}
            {wf.missing?.length ? ` · ${wf.missing.length} 项资源待补充` : ""}
          </span>
          <Link href={`/proto/workflows/${wf.id}`} className="p-link p-small">
            打开画布
          </Link>
          <Link href="/proto/admin/eval/workflows" className="p-link p-small">
            工作流评测
          </Link>
        </div>
      )}

      {sysPromptKey && (
        <div className="p-skill-strip">
          <Badge tone="info">Prompt</Badge>
          <span>
            系统 <span className="p-mono">{sysPromptKey}</span>
            {taskPromptKeys.length > 0 && (
              <>
                {" "}· 任务级 <span className="p-mono">{taskPromptKeys.join(" / ")}</span>
              </>
            )}{" "}
            · Agent {trace.agentId}
          </span>
          <Link href={`/proto/admin/agents/prompts/${SYSTEM_PROMPT_ID}`} className="p-link p-small">
            查看系统提示词
          </Link>
        </div>
      )}

      <Stats
        items={[
          { label: "步骤", value: trace.steps.length },
          { label: "成功步骤", value: trace.steps.filter((s) => s.state === "done").length, tone: "ok" },
          { label: "失败步骤", value: trace.steps.filter((s) => s.state === "error").length, tone: trace.steps.some((s) => s.state === "error") ? "danger" : "muted" },
          { label: "步骤耗时合计", value: `${total} ms`, hint: "按已记录步骤累加" },
        ]}
      />

      <Tabs<TabKey>
        value={tab}
        onChange={setTab}
        items={[
          { key: "chain", label: "执行链路", count: trace.steps.length },
          { key: "model", label: "模型调用", count: modelCalls.length },
          { key: "tool", label: "工具调用", count: toolCalls.length },
          ...(ragRun ? [{ key: "retrieval" as const, label: "检索链路", count: ragRun.candidates.length }] : []),
          { key: "context", label: "上下文快照" },
          { key: "errors", label: "错误分析", count: errors.length },
        ]}
      />

      {tab === "chain" && (
        <div className="p-trace-layout">
          <div className="p-card">
            <div className="p-card-head">
              <h3>执行链路</h3>
              <span className="p-muted p-small">点击步骤查看输入输出</span>
            </div>
            <ol className="p-trace-list">
              {trace.steps.map((s, i) => (
                <li key={s.key}>
                  <button
                    className={`p-trace-step is-${s.state}${i === idx ? " is-active" : ""}`}
                    onClick={() => setIdx(i)}
                  >
                    <em>{String(i + 1).padStart(2, "0")}</em>
                    <div>
                      <b>{s.label}</b>
                      <span>{KIND_LABEL[s.kind]} · {s.startedAt} · {s.ms} ms</span>
                    </div>
                    <i className="p-trace-dot" />
                  </button>
                </li>
              ))}
            </ol>
          </div>

          <div className="p-stack">
            <div className="p-card p-card-pad">
              <div className="p-row-between" style={{ marginBottom: 10 }}>
                <h3 className="p-side-h">{step.label}</h3>
                <Badge tone={step.state === "done" ? "ok" : step.state === "error" ? "danger" : "warn"}>
                  {step.state === "done" ? "完成" : step.state === "error" ? "失败" : "等待"}
                </Badge>
              </div>
              <KeyValue
                cols={1}
                items={[
                  { k: "类型", v: KIND_LABEL[step.kind] },
                  { k: "开始时间", v: <span className="p-mono">{step.startedAt}</span> },
                  { k: "耗时", v: <span className="p-mono">{step.ms} ms</span> },
                ]}
              />
              <h4 className="p-side-h" style={{ marginTop: 12 }}>输入</h4>
              <pre className="p-code">{step.input}</pre>
              <h4 className="p-side-h">输出</h4>
              <pre className={`p-code${step.state === "error" ? "" : " is-result"}`}>{step.output}</pre>
              {step.error && (
                <div className="p-warn-banner" style={{ marginBottom: 0 }}>
                  错误：{step.error}
                </div>
              )}
              <div className="p-inline-actions" style={{ marginTop: 12 }}>
                <Button size="sm" icon={<ChevronLeft size={12} />} disabled={idx === 0} onClick={() => setIdx(idx - 1)}>
                  上一步
                </Button>
                <Button
                  size="sm"
                  disabled={idx >= trace.steps.length - 1}
                  onClick={() => setIdx(idx + 1)}
                >
                  下一步 <ChevronRight size={12} />
                </Button>
              </div>
            </div>

            {task && (
              <div className="p-card p-card-pad">
                <h3 className="p-side-h">关联任务</h3>
                <KeyValue
                  cols={1}
                  items={[
                    { k: "任务", v: <Link href={`/proto/tasks/${task.id}`} className="p-link">{task.name}</Link> },
                    { k: "任务状态", v: task.status },
                    { k: "进度", v: `${task.progress}%` },
                  ]}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "model" && (
        <div className="p-stack">
          <div className="p-card p-card-pad">
            <div className="p-row-between" style={{ marginBottom: 10 }}>
              <div>
                <h3 className="p-side-h">模型调用</h3>
                <p className="p-muted p-small" style={{ margin: 0 }}>
                  每次调用记录路由选择、耗时、成本与结构化输出的校验结果。点击行可回到对应步骤。
                </p>
              </div>
              <Link href="/proto/admin/models/routing" className="p-btn p-btn-secondary p-btn-sm">路由策略</Link>
            </div>
            <Stats
              items={[
                { label: "调用次数", value: modelCalls.length },
                { label: "tokens", value: totalTokens },
                { label: "成本合计", value: `¥${totalCost.toFixed(4)}`, hint: "按模型注册价格估算" },
                { label: "Schema 未通过", value: modelCalls.filter((c) => c.schemaPass === false).length, tone: modelCalls.some((c) => c.schemaPass === false) ? "danger" : "muted" },
              ]}
            />
            <div className="p-table-wrap">
              <table className="p-table">
                <thead>
                  <tr>
                    <th>时间</th>
                    <th>任务类型</th>
                    <th>Prompt 版本</th>
                    <th>模型</th>
                    <th>耗时</th>
                    <th>tokens</th>
                    <th>成本</th>
                    <th>Schema</th>
                    <th>业务校验</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  {modelCalls.map((c) => (
                    <tr key={c.id} className="is-clickable" onClick={() => gotoStep(c.stepKey)}>
                      <td><span className="p-mono">{c.at}</span></td>
                      <td>{c.taskType}</td>
                      <td>
                        {sysPromptKey ? (
                          <Link
                            href={`/proto/admin/agents/prompts/${SYSTEM_PROMPT_ID}`}
                            className="p-link p-mono p-small"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {sysPromptKey}
                          </Link>
                        ) : (
                          <span className="p-muted p-small">—</span>
                        )}
                        {(() => {
                          const tp = promptForTask(c.taskType);
                          return tp ? (
                            <div className="p-cell-sub">
                              <Link
                                href={`/proto/admin/agents/prompts/${tp.id}`}
                                className="p-link p-mono p-small"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {tp.key}
                              </Link>
                            </div>
                          ) : (
                            <div className="p-cell-sub p-muted">无任务级 Prompt</div>
                          );
                        })()}
                      </td>
                      <td>
                        <span className="p-mono">{c.model}</span>
                        <div className="p-cell-sub">{c.reason}</div>
                      </td>
                      <td><span className="p-mono">{c.ms} ms</span></td>
                      <td><span className="p-mono">{c.tokensIn} / {c.tokensOut}</span></td>
                      <td><span className="p-mono">¥{c.cost.toFixed(4)}</span></td>
                      <td>
                        {c.schema ? (
                          <Link
                            href={`/proto/admin/tools/schemas/${c.schema.split("@")[0]}`}
                            className="p-link p-mono p-small"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {c.schema}
                          </Link>
                        ) : (
                          <span className="p-muted">—</span>
                        )}
                        {typeof c.schemaPass === "boolean" && (
                          <div className="p-cell-sub">
                            <Badge tone={c.schemaPass ? "ok" : "danger"}>{c.schemaPass ? "通过" : "不通过"}</Badge>
                          </div>
                        )}
                      </td>
                      <td>
                        {typeof c.businessPass === "boolean" ? (
                          <Badge tone={c.businessPass ? "ok" : "danger"}>{c.businessPass ? "通过" : "拒绝"}</Badge>
                        ) : (
                          <span className="p-muted">—</span>
                        )}
                      </td>
                      <td>
                        <Badge tone={c.status === "ok" ? "ok" : "danger"}>{c.status === "ok" ? "成功" : "失败"}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {modelCalls.length === 0 && <EmptyState title="本轮没有模型调用" hint="仅有消息或等待中的步骤" />}
            </div>
          </div>

          <div className="p-warn-banner" style={{ marginBottom: 0 }}>
            <ShieldCheck size={14} />
            <span>
              <b>Schema 通过不代表业务合法。</b>结构校验只保证字段与类型；任务状态、设备状态、权限与空域冲突必须以业务平台校验结果为准。
            </span>
          </div>

          {modelCalls.some((c) => c.businessNote) && (
            <div className="p-lines p-card">
              {modelCalls
                .filter((c) => c.businessNote)
                .map((c) => (
                  <div key={c.id} className="p-line">
                    <div>
                      <b>{c.taskType} · {c.schema ?? "—"}</b>
                      <span>{c.businessNote}</span>
                    </div>
                    <Badge tone={c.businessPass === false ? "danger" : "ok"}>{c.businessPass === false ? "业务拒绝" : "业务通过"}</Badge>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {tab === "tool" && (
        <div className="p-stack">
          <div className="p-card">
            <div className="p-card-head">
              <div>
                <h3>工具调用</h3>
                <p>入参、出参与业务回执；写操作的回执会写回业务平台</p>
              </div>
              <Link href="/proto/admin/tools" className="p-btn p-btn-secondary p-btn-sm">工具管理</Link>
            </div>
            {toolCalls.length === 0 ? (
              <EmptyState title="本轮没有工具调用" hint="该 Trace 只有识读或校验步骤" />
            ) : (
              <div className="p-lines">
                {toolCalls.map((c) => {
                  const def = state.tools.find((t) => t.id === c.toolId);
                  return (
                    <div key={c.id} className="p-line" style={{ alignItems: "flex-start" }}>
                      <div>
                        <div className="p-row-ops" style={{ marginBottom: 2 }}>
                          <b className="p-mono">{c.toolId}</b>
                          {def && (
                            <Badge tone={def.source === "mcp" ? "brand" : "info"}>
                              {def.source === "mcp" ? `MCP · ${def.mcpServerId}` : "内部 API"}
                            </Badge>
                          )}
                          {def && (
                            <Badge tone={def.risk === "high" ? "danger" : def.risk === "mid" ? "warn" : "muted"}>
                              {RISK_LABEL[def.risk]}
                            </Badge>
                          )}
                          {def && <span className="p-muted p-small p-mono">scope {def.scope}</span>}
                        </div>
                        <span>{c.at} · {c.ms} ms · {c.needConfirm ? "写操作，需人工确认" : "只读调用"}</span>
                        <pre className="p-code" style={{ margin: "8px 0 6px" }}>{c.args}</pre>
                        <pre className={`p-code${c.status === "error" ? "" : " is-result"}`} style={{ marginBottom: 6 }}>{c.result}</pre>
                        <p className="p-muted p-small" style={{ margin: 0 }}>{c.businessNote}</p>
                      </div>
                      <div className="p-stack" style={{ flex: "none", alignItems: "flex-end", gap: 6 }}>
                        <Badge tone={c.status === "ok" ? "ok" : "danger"}>{c.status === "ok" ? "成功" : "失败"}</Badge>
                        <Link href={`/proto/admin/tools/${encodeURIComponent(c.toolId)}`} className="p-link p-small">查看工具</Link>
                        <button className="p-inline-link" onClick={() => gotoStep(c.stepKey)}>定位步骤</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="p-note">
            MCP 与内部 API 走同一套工具调用层：统一入参、超时、错误码与审计记录；区别只在适配器，权限与业务校验不因此豁免。
          </div>
        </div>
      )}

      {tab === "retrieval" && ragRun && (
        <div className="p-stack">
          <div className="p-card p-card-pad">
            <div className="p-row-between" style={{ marginBottom: 10 }}>
              <div>
                <h3 className="p-side-h">问题与检索路径</h3>
                <p className="p-muted p-small" style={{ margin: 0 }}>
                  知识问题走检索增强；实时设备信息走业务工具；复杂作业再交给 Agent 编排。
                </p>
              </div>
              <div className="p-row-ops">
                <Badge tone="brand">{RAG_PATH_LABEL[ragRun.path]}</Badge>
                <Link
                  href={`/proto/admin/kb/retrieval?q=${encodeURIComponent(ragRun.question)}&config=${ragRun.configId}`}
                  className="p-btn p-btn-secondary p-btn-sm"
                >
                  在检索测试中复现
                </Link>
              </div>
            </div>
            <KeyValue
              items={[
                { k: "原始问题", v: ragRun.question },
                { k: "问题改写", v: ragRun.rewritten ?? "未改写（未命中扩展规则）" },
                {
                  k: "检索配置",
                  v: (
                    <Link href={`/proto/admin/kb/config?config=${ragRun.configId}`} className="p-link p-mono">
                      {ragRun.configId} v{ragRun.configVersion}
                    </Link>
                  ),
                },
                { k: "Embedding 模型", v: <span className="p-mono">{ragRun.embeddingModel}</span> },
                { k: "Rerank 模型", v: <span className="p-mono">{ragRun.rerankModel ?? "未启用"}</span> },
                {
                  k: "索引 / TopK / 阈值",
                  v: <span className="p-mono">{ragRun.indexId} · top {ragRun.topK} · ≥ {ragRun.scoreThreshold.toFixed(2)}</span>,
                },
                {
                  k: "业务工具",
                  v: ragRun.toolCall ? (
                    <span>
                      <span className="p-mono">{ragRun.toolCall.toolId}</span> · {ragRun.toolCall.summary}
                    </span>
                  ) : (
                    "未调用"
                  ),
                },
                {
                  k: "最终上下文",
                  v: `${ragRun.selected.length} 条 · ${ragRun.contextTokens} tok`,
                },
              ]}
            />
          </div>

          <div className="p-card">
            <div className="p-card-head">
              <div>
                <h3>召回候选与重排</h3>
                <p>先按融合分取 TopK，再按阈值过滤；开启重排时按重排分重新排序，只保留最终上下文数</p>
              </div>
              <span className="p-muted p-small">{ragRun.candidates.length} 个候选 · 入选 {ragRun.selected.length}</span>
            </div>
            <div className="p-table-wrap">
              <table className="p-table">
                <thead>
                  <tr>
                    <th style={{ width: 56 }}>排名</th>
                    <th>文档 / 片段</th>
                    <th style={{ width: 78 }}>向量分</th>
                    <th style={{ width: 78 }}>关键词</th>
                    <th style={{ width: 78 }}>融合分</th>
                    <th style={{ width: 78 }}>重排分</th>
                    <th style={{ width: 150 }}>结果</th>
                  </tr>
                </thead>
                <tbody>
                  {ragRun.candidates.map((c) => (
                    <tr key={c.chunkId}>
                      <td><span className="p-mono">{c.rank ? String(c.rank).padStart(2, "0") : "—"}</span></td>
                      <td>
                        <b className="p-small">{c.docId} · {c.section}</b>
                        <div className="p-cell-sub">{c.text.slice(0, 42)}…</div>
                      </td>
                      <td><span className="p-mono">{c.vectorScore.toFixed(3)}</span></td>
                      <td><span className="p-mono">{c.keywordScore.toFixed(3)}</span></td>
                      <td><span className="p-mono">{c.fusedScore.toFixed(3)}</span></td>
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
              <h3 className="p-side-h">步骤耗时</h3>
              <div className="p-lines">
                {(
                  [
                    ["问题改写", ragRun.timings.rewrite],
                    ["向量化", ragRun.timings.embed],
                    ["向量召回", ragRun.timings.retrieve],
                    ["Rerank", ragRun.timings.rerank],
                    ["上下文组装", ragRun.timings.assemble],
                    ["模型生成", ragRun.timings.generate],
                  ] as const
                ).map(([label, ms]) => (
                  <div key={label} className="p-line">
                    <span>{label}</span>
                    <b className="p-mono">{ms === 0 ? "跳过" : `${ms} ms`}</b>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-card p-card-pad">
              <div className="p-row-between" style={{ marginBottom: 8 }}>
                <h3 className="p-side-h">引用校验</h3>
                <Badge tone={ragRun.refused ? "danger" : ragRun.lowConfidence ? "warn" : "ok"}>
                  {ragRun.refused ? "已拒答" : `${ragRun.citations.length} 条可追溯`}
                </Badge>
              </div>
              {ragRun.refused ? (
                <div className="p-warn-banner" style={{ marginBottom: 0 }}>{ragRun.lowReason ?? "未检索到高于阈值的内容"}</div>
              ) : (
                <ul className="p-issue-list">
                  {ragRun.citations.map((c) => (
                    <li key={c.chunkId}>
                      <b>{c.docName}</b> · {c.section} · 评分 {c.score.toFixed(3)}
                      <div className="p-muted p-small">{c.quote.slice(0, 60)}…</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="p-note">
            演示环境的向量召回、Embedding 与 Rerank 均为本地模拟实现，未部署真实向量数据库或模型服务。
          </div>
        </div>
      )}

      {tab === "context" && (
        <div className="p-stack">
          {contextSnapshot ? (
            <>
              <div className="p-card p-card-pad">
                <div className="p-row-between" style={{ marginBottom: 10 }}>
                  <div>
                    <h3 className="p-side-h">状态一致性</h3>
                    <p className="p-muted p-small" style={{ margin: 0 }}>任务状态以业务平台为准，上下文状态仅作提示</p>
                  </div>
                  <div className="p-row-ops">
                    <Badge tone={contextSnapshot.match ? "ok" : "danger"}>
                      {contextSnapshot.match ? "与业务平台一致" : "与业务平台不一致"}
                    </Badge>
                    <Link href="/proto/admin/agents/contexts" className="p-btn p-btn-secondary p-btn-sm">上下文策略</Link>
                  </div>
                </div>
                <div className="p-ctx-compare">
                  <div className="p-ctx-state is-truth">
                    <span>业务平台（唯一可信来源）</span>
                    <b>{contextSnapshot.platformState}</b>
                  </div>
                  <div className={`p-ctx-state${contextSnapshot.match ? "" : " is-stale"}`}>
                    <span>模型上下文中的状态</span>
                    <b>{contextSnapshot.modelState}</b>
                  </div>
                </div>
                {!contextSnapshot.match && (
                  <div className="p-warn-banner" style={{ marginTop: 10 }}>
                    <CircleAlert size={14} />
                    <span>{contextSnapshot.mismatchNote ?? "模型上下文中的任务状态已过期，回答时必须回读业务平台。"}</span>
                  </div>
                )}
              </div>

              <div className="p-card p-card-pad">
                <div className="p-row-between" style={{ marginBottom: 8 }}>
                  <h3 className="p-side-h">Token 使用</h3>
                  <span className="p-muted p-small">{contextSnapshot.model} · {contextSnapshot.at}</span>
                </div>
                <div className="p-score is-mid">
                  <div className="p-score-bar"><i style={{ width: `${Math.min(100, usedPct)}%` }} /></div>
                  <b>{contextSnapshot.used} / {contextSnapshot.budget} tok</b>
                </div>
                <p className="p-muted p-small" style={{ marginBottom: 0 }}>
                  共 {contextSnapshot.layers.length} 层、{contextSnapshot.layers.reduce((s, l) => s + l.items.length, 0)} 条内容，
                  {contextSnapshot.layers.reduce((s, l) => s + l.items.filter((i) => i.state === "dropped").length, 0)} 条被丢弃。
                </p>
              </div>

              <div className="p-card">
                <div className="p-card-head">
                  <div>
                    <h3>实际装配的上下文</h3>
                    <p>按优先级降低排列；压缩与丢弃都给出原因</p>
                  </div>
                  <span className="p-muted p-small p-mono">{contextSnapshot.id}</span>
                </div>
                <div className="p-ctx-layers">
                  {contextSnapshot.layers.map((layer) => (
                    <div key={layer.type} className="p-ctx-layer">
                      <header>
                        <Badge tone={layer.priority <= 2 ? "warn" : "muted"}>P{layer.priority}</Badge>
                        <b>{layer.label}</b>
                        <span className="p-muted p-small">预算 {layer.budget} tok</span>
                      </header>
                      <ul>
                        {layer.items.map((it, i) => (
                          <li key={i} className={`is-${it.state}`}>
                            <div className="p-ctx-item-main">
                              <span className="p-ctx-item-text">{it.text}</span>
                              <span className="p-ctx-item-meta">
                                {it.tokens} tok · <Badge tone={ITEM_STATE_TONE[it.state]}>{ITEM_STATE_LABEL[it.state]}</Badge>
                              </span>
                            </div>
                            {it.note && <em>{it.note}</em>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-card p-card-pad">
                <h3 className="p-side-h">装配决策</h3>
                <ul className="p-issue-list">
                  {contextSnapshot.decisions.map((d, i) => (
                    <li key={i} className={d.includes("错误") || d.includes("过期") || d.includes("失败") ? "is-warn" : ""}>{d}</li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <div className="p-card p-card-pad">
              <EmptyState title="缺少上下文策略" hint="请先在上下文管理中为智能体建立策略" action={<Link href="/proto/admin/agents/contexts" className="p-btn p-btn-primary p-btn-md">配置策略</Link>} />
            </div>
          )}
        </div>
      )}

      {tab === "errors" && (
        <div className="p-stack">
          <div className="p-card p-card-pad">
            <div className="p-row-between" style={{ marginBottom: 4 }}>
              <div>
                <h3 className="p-side-h">错误与风险定位</h3>
                <p className="p-muted p-small" style={{ margin: 0 }}>
                  区分失败（error）与结构性风险（risk）；风险项即使步骤成功也应修配置，而不是改结论。
                </p>
              </div>
              <Link
                href={`/proto/admin/eval/datasets/DS-04?add=trace&trace=${encodeURIComponent(trace.id)}`}
                className="p-btn p-btn-secondary p-btn-sm"
              >
                加入评测集
              </Link>
            </div>
          </div>

          {errors.length === 0 ? (
            <div className="p-card p-card-pad">
              <EmptyState title="本轮没有失败或风险项" hint="所有步骤均成功且未命中已知风险规则" />
            </div>
          ) : (
            errors.map((e) => (
              <div key={e.id} className="p-card p-card-pad">
                <div className="p-row-between" style={{ marginBottom: 10 }}>
                  <div className="p-row-ops">
                    <Badge tone={e.severity === "error" ? "danger" : "warn"}>{e.severity === "error" ? "失败" : "风险"}</Badge>
                    <b className="p-mono">{e.code}</b>
                    <span className="p-muted p-small">{e.stepLabel}</span>
                  </div>
                  <button className="p-inline-link" onClick={() => gotoStep(e.stepKey)}>定位步骤</button>
                </div>
                <KeyValue
                  items={[
                    { k: "错误层", v: e.layer },
                    { k: "上游定位", v: e.upstream },
                    { k: "是否重试", v: e.retried },
                    { k: "步骤", v: <span className="p-mono">{e.stepKey}</span> },
                  ]}
                />
                <h4 className="p-side-h" style={{ marginTop: 12 }}>现象</h4>
                <pre className="p-code">{e.message}</pre>
                <div className="p-note">建议：{e.suggestion}</div>
              </div>
            ))
          )}

          <div className="p-note">
            错误分析可直接登记为评测用例，形成「发现 → 分析 → 修复 → 对比实验 → 回归评测 → 发布门禁」的闭环。
          </div>
        </div>
      )}
    </div>
  );
}
