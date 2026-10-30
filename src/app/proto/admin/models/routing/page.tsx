"use client";

import Link from "next/link";
import { useState } from "react";
import { Play, ShieldAlert } from "lucide-react";
import { Badge, Button, Drawer, Field, KeyValue, Select, Switch, TextInput } from "@/components/proto/ui";
import { useProto } from "@/lib/proto/store";
import { modelById, type RoutingLog, type RoutingRule } from "@/lib/proto/ai-data";

const OUTCOME: Record<RoutingLog["outcome"], { label: string; tone: "ok" | "danger" | "warn" }> = {
  ok: { label: "正常", tone: "ok" },
  refused: { label: "拒绝执行", tone: "danger" },
  escalated: { label: "转人工", tone: "warn" },
};

export default function RoutingPage() {
  const { state, saveRoutingRule, simulateRoute } = useProto();
  const [editing, setEditing] = useState<RoutingRule | null>(null);
  const [taskType, setTaskType] = useState("航线生成");
  const [result, setResult] = useState<RoutingLog | null>(null);

  const runSim = () => {
    const log = simulateRoute(taskType, "TR-DEMO-ROUTE");
    setResult(log);
  };

  return (
    <div>
      <div className="p-crumb">
        <Link href="/proto/admin/models">模型管理</Link>
        <span>/</span>
        <span>路由策略</span>
      </div>

      <div className="p-page-head">
        <div>
          <h1>路由策略</h1>
          <p>按任务类型选择主模型与回退模型，约束预算与延迟；备用模型不满足要求时拒绝或转人工，而不是强行降级</p>
        </div>
        <div className="p-page-actions">
          <Link href="/proto/admin/models" className="p-btn p-btn-secondary p-btn-md">模型注册表</Link>
          <Link href="/proto/admin/traces" className="p-btn p-btn-secondary p-btn-md">调用追踪</Link>
        </div>
      </div>

      <div className="p-warn-banner">
        <ShieldAlert size={14} />
        <span>
          <b>回退边界。</b>如果备用模型不能满足工具调用、结构化输出或规划质量要求，必须拒绝执行或转人工（本版只演示「拒绝」与「转人工」两种结果），
          不允许把安全相关任务强行降级到能力不足的模型。
        </span>
      </div>

      <div className="p-card">
        <div className="p-card-head">
          <div>
            <h3>路由规则</h3>
            <p>每类任务一条规则；关闭后该类请求直接拒绝</p>
          </div>
          <span className="p-muted p-small">{state.ai.routingRules.filter((r) => r.enabled).length} 条启用</span>
        </div>
        <table className="p-table">
          <thead>
            <tr>
              <th>任务类型</th>
              <th>条件</th>
              <th>主模型 → 备用</th>
              <th>能力要求</th>
              <th>预算 / 延迟</th>
              <th>回退失败</th>
              <th>启用</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {state.ai.routingRules.map((r) => (
              <tr key={r.id}>
                <td>
                  <b>{r.taskType}</b>
                  <span className="p-cell-sub p-mono">{r.id}</span>
                </td>
                <td className="p-small p-muted">{r.condition}</td>
                <td className="p-small">
                  <span className="p-mono">{r.primaryModel}</span>
                  <span className="p-cell-sub p-mono">→ {r.fallbackModel}</span>
                </td>
                <td>
                  <div className="p-ver-cell">
                    {r.requireTools && <span className="p-tag">工具调用</span>}
                    {r.requireStructured && <span className="p-tag">结构化</span>}
                    {!r.requireTools && !r.requireStructured && <span className="p-muted">—</span>}
                  </div>
                </td>
                <td className="p-mono p-small">
                  ¥{r.maxCost} · {r.maxLatency / 1000}s
                </td>
                <td>
                  <Badge tone={r.onFallbackFail === "refuse" ? "danger" : "warn"}>
                    {r.onFallbackFail === "refuse" ? "拒绝" : "转人工"}
                  </Badge>
                </td>
                <td>
                  <Switch on={r.enabled} onChange={() => saveRoutingRule(r.id, { enabled: !r.enabled })} />
                </td>
                <td>
                  <Button size="sm" onClick={() => setEditing({ ...r })}>编辑</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-admin-split" style={{ marginTop: 16 }}>
        <div className="p-stack">
          <div className="p-card p-card-pad">
            <h3 className="p-side-h"><Play size={12} /> 模拟路由</h3>
            <p className="p-muted p-small">
              按当前模型的可用状态与规则预算模拟一次选择；结果是固定策略推导，不调用真实模型。
            </p>
            <div className="p-inline-actions">
              <Select value={taskType} onChange={(e) => setTaskType(e.target.value)} style={{ width: 220 }}>
                {state.ai.routingRules.map((r) => (
                  <option key={r.id} value={r.taskType}>{r.taskType}</option>
                ))}
              </Select>
              <Button variant="primary" icon={<Play size={13} />} onClick={runSim}>
                运行模拟
              </Button>
              <span className="p-muted p-small">提示：先在模型注册表把 deepseek-v4-pro 切到不可用，再运行「航线生成」</span>
            </div>

            {result && (
              <div className="p-route-result">
                <div className="p-row-between">
                  <b>{result.taskType}</b>
                  <div className="p-row-ops">
                    {result.degraded && <Badge tone="warn">降级</Badge>}
                    <Badge tone={OUTCOME[result.outcome].tone}>{OUTCOME[result.outcome].label}</Badge>
                  </div>
                </div>
                <KeyValue
                  cols={2}
                  items={[
                    { k: "选择模型", v: <span className="p-mono">{result.chosen}</span> },
                    { k: "备用模型", v: <span className="p-mono">{result.fallback ?? "—"}</span> },
                    { k: "预计成本", v: result.cost ? `¥${result.cost.toFixed(4)}` : "—" },
                    { k: "预计耗时", v: result.ms ? `${result.ms} ms` : "—" },
                    { k: "原因", v: result.reason },
                    { k: "说明", v: result.note },
                  ]}
                />
                {result.outcome !== "ok" && (
                  <div className="p-warn-banner" style={{ marginTop: 8 }}>
                    <ShieldAlert size={14} />
                    <span>{result.note}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="p-card">
            <div className="p-card-head">
              <div>
                <h3>路由记录</h3>
                <p>每次选择都会记录：选中谁、为什么、是否降级</p>
              </div>
              <span className="p-muted p-small">{state.ai.routingLogs.length} 条（模拟）</span>
            </div>
            <table className="p-table">
              <thead>
                <tr>
                  <th>时间</th>
                  <th>任务类型</th>
                  <th>Trace</th>
                  <th>选择</th>
                  <th>原因</th>
                  <th>结果</th>
                  <th>成本</th>
                  <th>耗时</th>
                </tr>
              </thead>
              <tbody>
                {state.ai.routingLogs.map((l) => (
                  <tr key={l.id}>
                    <td className="p-mono p-small">{l.at}</td>
                    <td>{l.taskType}</td>
                    <td>
                      {l.traceId ? (
                        <Link href={`/proto/admin/traces/${l.traceId}`} className="p-link p-mono p-small">{l.traceId}</Link>
                      ) : (
                        <span className="p-muted">—</span>
                      )}
                    </td>
                    <td>
                      <span className="p-mono p-small">{l.chosen}</span>
                      {l.fallback && <span className="p-cell-sub p-mono">备用 {l.fallback}</span>}
                    </td>
                    <td className="p-small p-muted">{l.reason}</td>
                    <td>
                      <div className="p-ver-cell">
                        {l.degraded && <Badge tone="warn">降级</Badge>}
                        <Badge tone={OUTCOME[l.outcome].tone}>{OUTCOME[l.outcome].label}</Badge>
                      </div>
                    </td>
                    <td className="p-mono p-small">{l.cost ? `¥${l.cost.toFixed(4)}` : "—"}</td>
                    <td className="p-mono p-small">{l.ms ? `${l.ms} ms` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="p-stack">
          <div className="p-card p-card-pad">
            <h3 className="p-side-h">回退原则</h3>
            <ul className="p-issue-list">
              <li className="is-ok-static">只读任务可降级到满足约束的备用模型</li>
              <li className="is-warn">写操作、下发、取消链路不允许能力不足的降级</li>
              <li className="is-warn">备用模型缺失工具调用 / 结构化能力时直接拒绝</li>
              <li className="is-ok-static">拒绝与转人工都写入路由记录，可追溯</li>
            </ul>
          </div>

          <div className="p-card p-card-pad">
            <h3 className="p-side-h">本版范围</h3>
            <p className="p-muted p-small" style={{ margin: 0 }}>
              模型路由首版做到「可配置、可观察、可对比」：规则可编辑、每次选择有记录、按任务类型看成功率与成本。
              不做自动调参、不做跨供应商实时压测。
            </p>
          </div>

          <div className="p-card p-card-pad">
            <h3 className="p-side-h">相关入口</h3>
            <div className="p-lines">
              <Link href="/proto/admin/models" className="p-line p-line-link">
                <div><b>模型注册表</b><span>能力、价格与可用状态</span></div>
              </Link>
              <Link href="/proto/admin/traces" className="p-line p-line-link">
                <div><b>运行追踪</b><span>逐条查看模型调用与结果</span></div>
              </Link>
              <Link href="/proto/admin/eval/compare" className="p-line p-line-link">
                <div><b>实验对比</b><span>比较不同模型版本的通过率与成本</span></div>
              </Link>
            </div>
          </div>
        </aside>
      </div>

      <Drawer
        open={!!editing}
        title={editing ? `编辑规则 · ${editing.taskType}` : ""}
        sub="保存后立即生效（模拟）；已有记录不受影响"
        onClose={() => setEditing(null)}
        width={560}
        footer={
          <div className="p-inline-actions" style={{ margin: 0 }}>
            <Button onClick={() => setEditing(null)}>取消</Button>
            <Button
              variant="primary"
              onClick={() => {
                if (!editing) return;
                saveRoutingRule(editing.id, {
                  primaryModel: editing.primaryModel,
                  fallbackModel: editing.fallbackModel,
                  requireTools: editing.requireTools,
                  requireStructured: editing.requireStructured,
                  maxCost: editing.maxCost,
                  maxLatency: editing.maxLatency,
                  onFallbackFail: editing.onFallbackFail,
                  condition: editing.condition,
                });
                setEditing(null);
              }}
            >
              保存规则
            </Button>
          </div>
        }
      >
        {editing && (
          <div className="p-form">
            <Field label="触发条件">
              <TextInput value={editing.condition} onChange={(e) => setEditing({ ...editing, condition: e.target.value })} />
            </Field>
            <div className="p-grid-2">
              <Field label="主模型">
                <Select value={editing.primaryModel} onChange={(e) => setEditing({ ...editing, primaryModel: e.target.value })}>
                  {state.ai.models.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </Select>
              </Field>
              <Field label="备用模型">
                <Select value={editing.fallbackModel} onChange={(e) => setEditing({ ...editing, fallbackModel: e.target.value })}>
                  {state.ai.models.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="p-grid-2">
              <Field label="单次成本上限（¥）">
                <TextInput type="number" step="0.01" value={editing.maxCost} onChange={(e) => setEditing({ ...editing, maxCost: Number(e.target.value) })} />
              </Field>
              <Field label="延迟上限（毫秒）">
                <TextInput type="number" step="100" value={editing.maxLatency} onChange={(e) => setEditing({ ...editing, maxLatency: Number(e.target.value) })} />
              </Field>
            </div>
            <div className="p-switch-row">
              <div>
                <b>要求工具调用</b>
                <span>备用模型必须支持完整工具调用，否则不得降级</span>
              </div>
              <Switch on={editing.requireTools} onChange={(v) => setEditing({ ...editing, requireTools: v })} />
            </div>
            <div className="p-switch-row">
              <div>
                <b>要求结构化输出</b>
                <span>输出必须满足对应 Schema，否则不得降级</span>
              </div>
              <Switch on={editing.requireStructured} onChange={(v) => setEditing({ ...editing, requireStructured: v })} />
            </div>
            <Field label="备用模型也无法满足时" hint="安全相关任务建议选择「转人工」或「拒绝」">
              <Select
                value={editing.onFallbackFail}
                onChange={(e) => setEditing({ ...editing, onFallbackFail: e.target.value as RoutingRule["onFallbackFail"] })}
              >
                <option value="refuse">拒绝执行并返回原因</option>
                <option value="human">转人工处理</option>
              </Select>
            </Field>
            <div className="p-note">
              当前主模型：{modelById(editing.primaryModel)?.p50 ?? "—"} P50 · ¥{modelById(editing.primaryModel)?.priceOut ?? 0}/千 tokens 输出。
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
