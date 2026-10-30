"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CircleAlert, Database, ShieldCheck } from "lucide-react";
import { Badge, Field, KeyValue, Select, Switch, Tabs, TextInput } from "@/components/proto/ui";
import { useProto } from "@/lib/proto/store";
import { buildContextSnapshot, type ContextItem, type ContextSource } from "@/lib/proto/ai-data";

type TabKey = "policy" | "inspect";

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

export default function ContextsPage() {
  const { state, saveContextPolicy, toggleContextSource } = useProto();
  const policies = state.ai.contextPolicies;

  const [tab, setTab] = useState<TabKey>("policy");
  const [policyId, setPolicyId] = useState(policies[0]?.id ?? "");
  const policy = policies.find((p) => p.id === policyId) ?? policies[0];

  const [maxTokens, setMaxTokens] = useState(policy?.maxTokens ?? 12000);
  const [reserve, setReserve] = useState(policy?.reserveForOutput ?? 2048);
  const [sources, setSources] = useState<ContextSource[]>(policy?.sources ?? []);

  useEffect(() => {
    if (!policy) return;
    setMaxTokens(policy.maxTokens);
    setReserve(policy.reserveForOutput);
    setSources(policy.sources);
  }, [policy?.id, policy?.updatedAt]);

  const [traceId, setTraceId] = useState("TR-20261023-1110");
  const [debugPolicyId, setDebugPolicyId] = useState(policies[0]?.id ?? "");

  const snapshot = useMemo(() => {
    const trace = state.traces.find((t) => t.id === traceId) ?? state.traces[0];
    if (!trace) return null;
    const task = state.tasks.find((t) => t.id === trace.taskId);
    const session = state.sessions.find((s) => s.id === (task?.sessionId ?? trace.sessionId));
    const dp = policies.find((p) => p.id === debugPolicyId) ?? policies[0];
    const model = trace.steps.some((s) => s.kind === "tool") ? "deepseek-v4-pro" : "qwen3.8-flash";
    return buildContextSnapshot({ trace, task, session, policy: dp, model, kbDocs: state.kbDocs });
  }, [state.traces, state.tasks, state.sessions, state.kbDocs, policies, debugPolicyId, traceId]);

  const dirty =
    !!policy &&
    (maxTokens !== policy.maxTokens ||
      reserve !== policy.reserveForOutput ||
      JSON.stringify(sources) !== JSON.stringify(policy.sources));

  const usedPct = snapshot ? Math.round((snapshot.used / snapshot.budget) * 100) : 0;

  return (
    <div>
      <div className="p-crumb">
        <Link href="/proto/admin/agents">智能体管理</Link>
        <span>/</span>
        <span>上下文策略</span>
      </div>

      <div className="p-page-head">
        <div>
          <h1>上下文管理</h1>
          <p>配置会话、任务、检索与执行四类上下文的来源、优先级、保留与压缩规则，并逐轮查看模型实际拿到了什么</p>
        </div>
        <div className="p-page-actions">
          <Link href="/proto/admin/agents/prompts" className="p-btn p-btn-secondary p-btn-md">Prompt 管理</Link>
          <Link href="/proto/admin/traces" className="p-btn p-btn-secondary p-btn-md">运行追踪</Link>
        </div>
      </div>

      <div className="p-warn-banner">
        <ShieldCheck size={14} />
        <span>
          <b>任务状态以业务平台为准。</b>模型上下文中的任务状态只是提示；不得因为上下文中写着「已完成」就回显完成结论，必须重新读取业务平台状态。
        </span>
      </div>

      <Tabs<TabKey>
        value={tab}
        onChange={setTab}
        items={[
          { key: "policy", label: "策略配置" },
          { key: "inspect", label: "上下文调试" },
        ]}
      />

      {tab === "policy" && policy && (
        <div className="p-admin-split">
          <div className="p-stack">
            <div className="p-card p-card-pad">
              <div className="p-row-between" style={{ marginBottom: 10 }}>
                <h3 className="p-side-h">适用 Agent</h3>
                <Select value={policyId} onChange={(e) => setPolicyId(e.target.value)} style={{ width: 260 }}>
                  {policies.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.agentName} · {p.id}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="p-grid-2">
                <Field label="上下文预算（tokens）" hint="包括系统指令、历史消息、业务数据与检索片段">
                  <TextInput type="number" value={maxTokens} onChange={(e) => setMaxTokens(Number(e.target.value))} />
                </Field>
                <Field label="为输出预留（tokens）" hint="预留不足时优先压缩会话历史，不裁剪任务状态">
                  <TextInput type="number" value={reserve} onChange={(e) => setReserve(Number(e.target.value))} />
                </Field>
              </div>
              <div className="p-note">
                当前生效：{Math.round(((maxTokens - reserve) / maxTokens) * 100)}% 用于输入上下文，{policy.refresh}。
              </div>
            </div>

            <div className="p-card">
              <div className="p-card-head">
                <div>
                  <h3>上下文来源</h3>
                  <p>按优先级装配；高优先级来源不会被低优先级挤掉</p>
                </div>
                <span className="p-muted p-small">{sources.filter((s) => s.enabled).length}/{sources.length} 启用</span>
              </div>
              <div className="p-ctx-sources">
                {sources.map((s) => (
                  <div key={s.id} className={`p-ctx-source${s.enabled ? "" : " is-off"}`}>
                    <div className="p-ctx-source-head">
                      <Badge tone={s.priority === 1 ? "danger" : s.priority === 2 ? "warn" : "muted"}>P{s.priority}</Badge>
                      <b>{s.name}</b>
                      <Switch
                        on={s.enabled}
                        onChange={() => {
                          setSources(sources.map((x) => (x.id === s.id ? { ...x, enabled: !x.enabled } : x)));
                          toggleContextSource(policy.id, s.id);
                        }}
                        label="启用"
                      />
                    </div>
                    <div className="p-ctx-source-body">
                      <p><span>来源</span>{s.source}</p>
                      <p><span>保留</span>{s.retention}</p>
                      <p><span>摘要</span>{s.summary}</p>
                      <p><span>约束</span>{s.policy}</p>
                    </div>
                    <div className="p-ctx-source-foot">
                      <span className="p-muted p-small">预算</span>
                      <TextInput
                        type="number"
                        value={s.maxTokens}
                        onChange={(e) =>
                          setSources(sources.map((x) => (x.id === s.id ? { ...x, maxTokens: Number(e.target.value) } : x)))
                        }
                        style={{ width: 120 }}
                      />
                      <span className="p-muted p-small">tokens</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-card-pad p-tight" style={{ borderTop: "1px solid var(--p-line)" }}>
                <div className="p-inline-actions" style={{ margin: 0 }}>
                  <button
                    className="p-btn p-btn-primary p-btn-md"
                    disabled={!dirty}
                    onClick={() => saveContextPolicy(policy.id, { maxTokens, reserveForOutput: reserve, sources })}
                  >
                    保存策略{dirty ? "（有未保存修改）" : ""}
                  </button>
                  <button
                    className="p-btn p-btn-secondary p-btn-md"
                    onClick={() => {
                      setMaxTokens(policy.maxTokens);
                      setReserve(policy.reserveForOutput);
                      setSources(policy.sources);
                    }}
                  >
                    撤销修改
                  </button>
                  <span className="p-muted p-small">保存后下一轮对话生效</span>
                </div>
              </div>
            </div>
          </div>

          <aside className="p-stack">
            <div className="p-card p-card-pad">
              <h3 className="p-side-h">策略信息</h3>
              <KeyValue
                cols={1}
                items={[
                  { k: "策略 ID", v: <span className="p-mono">{policy.id}</span> },
                  { k: "Agent", v: policy.agentName },
                  { k: "可信来源", v: policy.truthSource },
                  { k: "刷新策略", v: policy.refresh },
                  { k: "最近修改", v: `${policy.updatedAt} · ${policy.author}` },
                ]}
              />
            </div>

            <div className="p-card p-card-pad">
              <h3 className="p-side-h">四类上下文</h3>
              <ul className="p-issue-list">
                <li className="is-warn">任务与业务状态：每轮刷新，不压缩</li>
                <li>执行结果：失败回执优先保留</li>
                <li>会话历史：超轮次压缩为摘要</li>
                <li>知识检索：低于阈值直接丢弃并记录</li>
              </ul>
            </div>

            <div className="p-card p-card-pad">
              <h3 className="p-side-h">明确不做</h3>
              <p className="p-muted p-small" style={{ margin: 0 }}>
                本版不做向量库配置、嵌入模型选择与分块策略调整，检索上下文只展示来源、阈值与丢弃原因。
              </p>
            </div>
          </aside>
        </div>
      )}

      {tab === "inspect" && (
        <div className="p-admin-split">
          <div className="p-stack">
            <div className="p-card p-card-pad">
              <div className="p-row-between" style={{ marginBottom: 10 }}>
                <h3 className="p-side-h"><Database size={12} /> 选择会话与轮次</h3>
                <div className="p-row-ops">
                  <Select value={debugPolicyId} onChange={(e) => setDebugPolicyId(e.target.value)} style={{ width: 220 }}>
                    {policies.map((p) => (
                      <option key={p.id} value={p.id}>{p.agentName}</option>
                    ))}
                  </Select>
                  <Select value={traceId} onChange={(e) => setTraceId(e.target.value)} style={{ width: 260 }}>
                    {state.traces.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.id} · {t.taskId ?? "无任务"}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
              <p className="p-muted p-small" style={{ margin: 0 }}>
                会话详情展示该轮实际装配进模型的内容；压缩与丢弃都给出原因，便于定位「模型为什么不知道」。
                包含演示样本：TR-20261023-1110 的任务状态冲突。
              </p>
            </div>

            {snapshot && (
              <>
                <div className="p-card p-card-pad">
                  <div className="p-row-between" style={{ marginBottom: 10 }}>
                    <h3 className="p-side-h">状态一致性</h3>
                    <Badge tone={snapshot.match ? "ok" : "danger"}>
                      {snapshot.match ? "上下文与业务平台一致" : "上下文与业务平台不一致"}
                    </Badge>
                  </div>
                  <div className="p-ctx-compare">
                    <div className="p-ctx-state is-truth">
                      <span>业务平台（唯一可信来源）</span>
                      <b>{snapshot.platformState}</b>
                    </div>
                    <div className={`p-ctx-state${snapshot.match ? "" : " is-stale"}`}>
                      <span>模型上下文中的状态</span>
                      <b>{snapshot.modelState}</b>
                    </div>
                  </div>
                  {!snapshot.match && (
                    <div className="p-warn-banner" style={{ marginTop: 10 }}>
                      <CircleAlert size={14} />
                      <span>{snapshot.mismatchNote ?? "模型上下文中的任务状态已过期，回答时必须回读业务平台。"}</span>
                    </div>
                  )}
                </div>

                <div className="p-card p-card-pad">
                  <div className="p-row-between" style={{ marginBottom: 8 }}>
                    <h3 className="p-side-h">Token 使用</h3>
                    <span className="p-muted p-small">{snapshot.model} · {snapshot.at}</span>
                  </div>
                  <div className="p-score is-mid">
                    <div className="p-score-bar"><i style={{ width: `${Math.min(100, usedPct)}%` }} /></div>
                    <b>{snapshot.used} / {snapshot.budget} tok</b>
                  </div>
                  <p className="p-muted p-small" style={{ marginBottom: 0 }}>
                    共 {snapshot.layers.length} 层、{snapshot.layers.reduce((s, l) => s + l.items.length, 0)} 条内容，
                    {snapshot.layers.reduce((s, l) => s + l.items.filter((i) => i.state === "dropped").length, 0)} 条被丢弃。
                  </p>
                </div>

                <div className="p-card">
                  <div className="p-card-head">
                    <div>
                      <h3>实际装配的上下文</h3>
                      <p>按优先级降低排列；同一轮内不会跨层重排</p>
                    </div>
                    <span className="p-muted p-small">{snapshot.id}</span>
                  </div>
                  <div className="p-ctx-layers">
                    {snapshot.layers.map((layer) => (
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
                    {snapshot.decisions.map((d, i) => (
                      <li key={i} className={d.includes("错误") || d.includes("过期") || d.includes("失败") ? "is-warn" : ""}>{d}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>

          <aside className="p-stack">
            {snapshot && (
              <div className="p-card p-card-pad">
                <h3 className="p-side-h">本轮信息</h3>
                <KeyValue
                  cols={1}
                  items={[
                    { k: "Trace", v: <Link href={`/proto/admin/traces/${snapshot.traceId}`} className="p-link p-mono p-small">{snapshot.traceId}</Link> },
                    { k: "会话", v: <span className="p-mono">{snapshot.sessionId ?? "—"}</span> },
                    { k: "任务", v: <span className="p-mono">{snapshot.taskId ?? "—"}</span> },
                    { k: "Agent", v: <span className="p-mono">{snapshot.agentId}</span> },
                    { k: "模型", v: <span className="p-mono">{snapshot.model}</span> },
                    { k: "时间", v: snapshot.at },
                  ]}
                />
              </div>
            )}

            <div className="p-card p-card-pad">
              <h3 className="p-side-h">怎么读这个视图</h3>
              <ul className="p-issue-list">
                <li className="is-ok-static">「已使用」= 参与本轮模型输入</li>
                <li className="is-warn">「已压缩」= 以摘要形式参与，细节丢失</li>
                <li>「已丢弃」= 未参与本轮输入，附原因</li>
                <li className="is-ok-static">状态冲突时，以业务平台为准并阻断完成类结论</li>
              </ul>
            </div>

            <div className="p-card p-card-pad">
              <h3 className="p-side-h">相关错误</h3>
              <p className="p-muted p-small" style={{ margin: 0 }}>
                上下文状态不一致会被 Trace 的错误分析标记为「数据源缺失 / 缺陷」，并可登记为评测用例。
              </p>
              <Link href="/proto/admin/eval/datasets" className="p-btn p-btn-secondary p-btn-sm" style={{ width: "100%", justifyContent: "center", marginTop: 10 }}>
                去数据集登记用例
              </Link>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
