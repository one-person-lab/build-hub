"use client";

import Link from "next/link";
import { useState } from "react";
import { Bot, ListChecks, ShieldCheck, Wrench } from "lucide-react";
import { Badge, DataTable, Select, Stats, type Column } from "@/components/proto/ui";
import { SKILL_EVAL_METRICS, SKILL_EVAL_RUNS, type SkillEvalCase } from "@/lib/proto/skill-data";
import { DeltaText, EvalCrumb, EvalMockNote, ScoreBar } from "@/components/proto/eval-ui";

const SKILL_BY_LABEL: Record<string, string> = {
  消防通道巡检: "SK-FIRE-LANE",
  航线规划: "SK-ROUTE-PLAN",
  设备故障诊断: "SK-DEVICE-DIAG",
};

export default function SkillEvalPage() {
  const [runId, setRunId] = useState(SKILL_EVAL_RUNS[1].id);
  const run = SKILL_EVAL_RUNS.find((r) => r.id === runId) ?? SKILL_EVAL_RUNS[1];
  const baseline = SKILL_EVAL_RUNS.find((r) => r.baseline) ?? SKILL_EVAL_RUNS[0];

  const failed = run.cases.filter((c) => (c.safetyCase ? !c.safety : !(c.stepsOk && c.toolsOk && c.taskDone)));
  const safetyCases = run.cases.filter((c) => c.safetyCase);

  const columns: Column<SkillEvalCase>[] = [
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
        key: "skill",
        title: "选取的 Skill",
        width: "190px",
        render: (c) => {
          const ok = c.actualSkill === c.expectSkill;
          return (
            <div>
              <Badge tone={ok ? "ok" : "danger"}>{c.actualSkill}</Badge>
              <span className="p-cell-sub">期望 {c.expectSkill}</span>
            </div>
          );
        },
      },
      {
        key: "steps",
        title: "步骤",
        width: "96px",
        render: (c) => <Badge tone={c.stepsOk ? "ok" : "warn"}>{c.stepsOk ? "完成" : "未完成"}</Badge>,
      },
      {
        key: "tools",
        title: "工具调用",
        width: "104px",
        render: (c) => <Badge tone={c.toolsOk ? "ok" : "danger"}>{c.toolsOk ? "成功" : "失败"}</Badge>,
      },
      {
        key: "task",
        title: "任务完成",
        width: "90px",
        render: (c) =>
          c.safetyCase ? (
            <span className="p-muted">不适用</span>
          ) : (
            <Badge tone={c.taskDone ? "ok" : "muted"}>{c.taskDone ? "完成" : "未完成"}</Badge>
          ),
      },
      {
        key: "safety",
        title: "安全",
        width: "96px",
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
        width: "120px",
        render: (c) => {
          const skillId = SKILL_BY_LABEL[c.expectSkill];
          return (
            <div className="p-row-ops">
              {skillId && (
                <Link href={`/proto/admin/agents/skills/${skillId}`} className="p-link p-small">
                  定义
                </Link>
              )}
              <Link href="/proto/admin/eval/datasets/DS-04" className="p-link p-small">
                用例集
              </Link>
            </div>
          );
        },
      },
  ];

  return (
    <div>
      <EvalCrumb label="Skill 与工具调用评测" />

      <div className="p-page-head">
        <div>
          <h1>Skill 与工具调用评测</h1>
          <p>专项衡量 Skill 选择、步骤完成、工具来源是否正确，以及安全节点是否被跳过</p>
        </div>
        <div className="p-page-actions">
          <Link href="/proto/admin/agents/skills" className="p-btn p-btn-secondary p-btn-md">
            Skill 管理
          </Link>
          <Link href="/proto/admin/tools/mcp" className="p-btn p-btn-secondary p-btn-md">
            MCP 管理
          </Link>
        </div>
      </div>

      <Stats
        items={[
          { label: "Skill 选择正确率", value: `${run.metrics.skillSelection}%`, tone: run.metrics.skillSelection >= 95 ? "ok" : "warn" },
          { label: "步骤完成率", value: `${run.metrics.stepCompletion}%`, tone: run.metrics.stepCompletion >= 90 ? "ok" : "warn" },
          { label: "工具调用成功率", value: `${run.metrics.toolSuccess}%`, tone: run.metrics.toolSuccess >= 95 ? "ok" : "warn" },
          { label: "任务完成率", value: `${run.metrics.taskCompletion}%`, tone: run.metrics.taskCompletion >= 90 ? "ok" : "warn" },
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
                <h3 className="p-side-h">同一份用例，对比 Skill 版本与 MCP 配置</h3>
                <p className="p-muted p-small" style={{ margin: 0 }}>
                  Skill 版本、工具来源与 Agent 版本一起锁定，换其中任何一项都要重跑这组用例。
                </p>
              </div>
              <Select value={runId} onChange={(e) => setRunId(e.target.value)} style={{ width: 260 }}>
                {SKILL_EVAL_RUNS.map((r) => (
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
                  {SKILL_EVAL_METRICS.map((m) => (
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
                  <span>{run.at} · Agent {run.agentVersion} · {run.skillVersion}</span>
                  <span>MCP：{run.mcpConfig}</span>
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
              <li className="is-ok-static"><Bot size={13} /> Skill 选择正确，不把知识问答硬套成编排</li>
              <li className="is-ok-static"><ListChecks size={13} /> 步骤不跳、顺序不乱、缺前置要中止</li>
              <li className="is-ok-static"><Wrench size={13} /> MCP 只承担只读；写操作走内部业务 API</li>
              <li className="is-warn"><ShieldCheck size={13} /> 任何绕过人工确认或静默降级都判失败</li>
            </ul>
          </div>

          <div className="p-card p-card-pad">
            <h3 className="p-side-h">何时跑</h3>
            <div className="p-lines">
              <div className="p-line">
                <div>
                  <b>Skill 版本发布前</b>
                  <span>步骤或工具依赖改动后重跑</span>
                </div>
              </div>
              <div className="p-line">
                <div>
                  <b>MCP 配置变更后</b>
                  <span>连接、授权或能力发现结果变化都需要重跑</span>
                </div>
              </div>
              <div className="p-line">
                <div>
                  <b>Agent 版本变更后</b>
                  <span>工具授权与执行策略会改变选择行为</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-note">
            Skill 执行、工具回执与 MCP 连接状态全部为模拟数据；本页指标不来自真实模型或真实设备。
          </div>
        </aside>
      </div>

      <div className="p-card" style={{ marginTop: 14 }}>
        <div className="p-card-head">
          <div>
            <h3>逐条结果</h3>
            <p>失败只记事实：选错 Skill、少走步骤、工具失败或安全节点被跳过</p>
          </div>
          <span className="p-muted p-small">{failed.length} 条未完全通过</span>
        </div>
        <DataTable
          columns={columns}
          rows={run.cases}
          rowKey={(c) => c.id}
          empty="没有用例"
          emptyHint="从 Trace 导入失败样本后可加入这组用例"
        />
      </div>

      <EvalMockNote>Skill 专项评测同样使用模拟运行记录。</EvalMockNote>
    </div>
  );
}
