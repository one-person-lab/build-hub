"use client";

import Link from "next/link";
import { useState } from "react";
import { GitBranch, ListChecks, MessageSquare, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { Badge, DataTable, Select, Stats, type Column } from "@/components/proto/ui";
import {
  WORKFLOW_EVAL_METRICS,
  WORKFLOW_EVAL_RUNS,
  workflowEvalSummary,
  type WorkflowEvalCase,
} from "@/lib/proto/workflow-data";
import { DeltaText, EvalCrumb, EvalMockNote, ScoreBar } from "@/components/proto/eval-ui";

export default function WorkflowEvalPage() {
  const [runId, setRunId] = useState(WORKFLOW_EVAL_RUNS[0].id);
  const run = WORKFLOW_EVAL_RUNS.find((r) => r.id === runId) ?? WORKFLOW_EVAL_RUNS[0];
  const baseline = WORKFLOW_EVAL_RUNS.find((r) => r.baseline) ?? WORKFLOW_EVAL_RUNS[1];
  const { failed, safetyCases } = workflowEvalSummary(run);

  const columns: Column<WorkflowEvalCase>[] = [
    {
      key: "case",
      title: "用例",
      render: (c) => (
        <div>
          <b>{c.question}</b>
          <span className="p-cell-sub p-mono">{c.id}</span>
          <span className="p-cell-sub">{c.note}</span>
        </div>
      ),
    },
    {
      key: "expect",
      title: "期望",
      render: (c) => <span className="p-small">{c.expect}</span>,
    },
    {
      key: "trigger",
      title: "触发",
      width: "84px",
      render: (c) => <Badge tone={c.triggerOk ? "ok" : "danger"}>{c.triggerOk ? "正确" : "错误"}</Badge>,
    },
    {
      key: "nodes",
      title: "节点",
      width: "84px",
      render: (c) => <Badge tone={c.nodesOk ? "ok" : "danger"}>{c.nodesOk ? "完整" : "缺失"}</Badge>,
    },
    {
      key: "params",
      title: "参数",
      width: "84px",
      render: (c) => <Badge tone={c.paramsOk ? "ok" : "warn"}>{c.paramsOk ? "齐全" : "待补"}</Badge>,
    },
    {
      key: "validation",
      title: "校验",
      width: "92px",
      render: (c) => <Badge tone={c.validationOk ? "ok" : "warn"}>{c.validationOk ? "通过" : "未通过"}</Badge>,
    },
    {
      key: "safety",
      title: "安全",
      width: "90px",
      render: (c) =>
        c.safetyCase ? (
          <Badge tone={c.safety ? "ok" : "danger"}>{c.safety ? "通过" : "未通过"}</Badge>
        ) : (
          <span className="p-muted">—</span>
        ),
    },
    {
      key: "ops",
      title: "",
      width: "90px",
      render: () => (
        <Link href="/proto/admin/workflows" className="p-link p-small">
          工作流管理
        </Link>
      ),
    },
  ];

  return (
    <div>
      <EvalCrumb label="工作流专项评测" />

      <div className="p-page-head">
        <div>
          <h1>工作流专项评测</h1>
          <p>衡量自然语言生成的草稿是否可用、节点与参数是否齐全、校验能否一次通过，以及安全节点有没有被吃掉</p>
        </div>
        <div className="p-page-actions">
          <Link href="/proto/workflows" className="p-btn p-btn-secondary p-btn-md">
            去前台工作流
          </Link>
          <Link href="/proto/admin/workflows" className="p-btn p-btn-secondary p-btn-md">
            工作流管理
          </Link>
        </div>
      </div>

      <Stats
        items={[
          { label: "草稿生成可用率", value: `${run.metrics.generation}%`, tone: run.metrics.generation >= 90 ? "ok" : "warn" },
          { label: "节点完整率", value: `${run.metrics.nodeComplete}%`, tone: run.metrics.nodeComplete >= 90 ? "ok" : "warn" },
          { label: "参数补全率", value: `${run.metrics.paramFill}%`, tone: run.metrics.paramFill >= 85 ? "ok" : "warn" },
          { label: "校验一次通过率", value: `${run.metrics.validation}%`, tone: run.metrics.validation >= 90 ? "ok" : "warn" },
          {
            label: "安全用例",
            value: `${run.metrics.safetyPass}/${run.metrics.safetyTotal}`,
            tone: run.metrics.safetyPass === run.metrics.safetyTotal ? "ok" : "danger",
            hint: safetyCases.length ? `${safetyCases.length} 条硬性用例` : undefined,
          },
        ]}
      />

      <div className="p-admin-split">
        <div className="p-stack">
          <div className="p-card p-card-pad">
            <div className="p-row-between" style={{ marginBottom: 10 }}>
              <div>
                <h3 className="p-side-h">同一份工作流用例，对比 Agent 与模型版本</h3>
                <p className="p-muted p-small" style={{ margin: 0 }}>
                  用例固定、期望结果固定，换模型或换编排策略都要重跑这组；画布共享草稿的逻辑也在这组里。
                </p>
              </div>
              <Select value={runId} onChange={(e) => setRunId(e.target.value)} style={{ width: 250 }}>
                {WORKFLOW_EVAL_RUNS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.id} · {r.baseline ? "基线" : "候选"}
                  </option>
                ))}
              </Select>
            </div>

            <div className="p-table-wrap">
              <table className="p-table">
                <thead>
                  <tr>
                    <th>指标</th>
                    <th>{baseline.id}（基线）</th>
                    <th>{run.id}（当前）</th>
                    <th>变化</th>
                  </tr>
                </thead>
                <tbody>
                  {WORKFLOW_EVAL_METRICS.map((m) => (
                    <tr key={m.key}>
                      <td>{m.label}</td>
                      <td><span className="p-mono">{baseline.metrics[m.key]}%</span></td>
                      <td><ScoreBar value={run.metrics[m.key]} /></td>
                      <td><DeltaText from={baseline.metrics[m.key]} to={run.metrics[m.key]} /></td>
                    </tr>
                  ))}
                  <tr>
                    <td>安全用例</td>
                    <td><span className="p-mono">{baseline.metrics.safetyPass}/{baseline.metrics.safetyTotal}</span></td>
                    <td><span className="p-mono">{run.metrics.safetyPass}/{run.metrics.safetyTotal}</span></td>
                    <td>
                      <Badge tone={run.metrics.safetyPass === run.metrics.safetyTotal ? "ok" : "danger"}>
                        {run.metrics.safetyPass === run.metrics.safetyTotal ? "全部通过" : "存在未通过"}
                      </Badge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-lines" style={{ marginTop: 12 }}>
              <div className="p-line">
                <div>
                  <b>{run.id}</b>
                  <span>{run.at} · Agent {run.agentVersion} · {run.model}</span>
                  <span>被测工作流 {run.workflowVersion}</span>
                </div>
                <Badge tone="info">{run.cases.length} 条用例</Badge>
              </div>
            </div>
          </div>
        </div>

        <aside className="p-stack">
          <div className="p-card p-card-pad">
            <h3 className="p-side-h">这组用例在守什么</h3>
            <ul className="p-issue-list">
              <li className="is-ok-static"><GitBranch size={13} /> 触发条件解析正确，周期与事件不混淆</li>
              <li className="is-ok-static"><ListChecks size={13} /> 节点齐全且顺序可用，少一步就判缺节点</li>
              <li className="is-ok-static"><SlidersHorizontal size={13} /> 参数能补全；缺区域、缺渠道要标待补充</li>
              <li className="is-ok-static"><MessageSquare size={13} /> 追加修改只动目标节点，不覆盖画布改动</li>
              <li className="is-warn"><ShieldCheck size={13} /> 任何生成结果都不能跳过人工确认或自动启用</li>
            </ul>
          </div>

          <div className="p-card p-card-pad">
            <h3 className="p-side-h">何时跑</h3>
            <div className="p-lines">
              <div className="p-line">
                <div>
                  <b>Prompt 或模型版本变更后</b>
                  <span>解析触发与补全参数的策略会直接改变草稿质量</span>
                </div>
              </div>
              <div className="p-line">
                <div>
                  <b>工作流模板调整后</b>
                  <span>节点链与资源引用变化需要重跑这组用例</span>
                </div>
              </div>
              <div className="p-line">
                <div>
                  <b>对话与画布共享逻辑改动后</b>
                  <span>追加修改不能覆盖用户已做的画布修改</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-note">
            工作流生成、校验、运行与 MCP 连接状态全部为模拟数据；本页指标不来自真实模型、调度器或真实设备。
          </div>
        </aside>
      </div>

      <div className="p-card" style={{ marginTop: 14 }}>
        <div className="p-card-head">
          <div>
            <h3>逐条结果</h3>
            <p>失败只记事实：触发解析错、节点缺、参数臆造、校验不过或安全节点被跳过</p>
          </div>
          <span className="p-muted p-small">{failed.length} 条未完全通过</span>
        </div>
        <DataTable
          columns={columns}
          rows={run.cases}
          rowKey={(c) => c.id}
          empty="没有用例"
          emptyHint="从 Trace 导入失败的生成样本后可加入这组用例"
        />
      </div>

      <EvalMockNote>工作流专项评测同样使用模拟生成与模拟运行记录。</EvalMockNote>
    </div>
  );
}
