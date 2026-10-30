"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Play, ShieldCheck } from "lucide-react";
import { Badge, DataTable, Field, Select, Stats, type Column } from "@/components/proto/ui";
import { useProto } from "@/lib/proto/store";
import { FAIL_TYPE_LABEL, EVALUATORS, summarize, type EvalCaseResult } from "@/lib/proto/eval-data";
import { promptVersionOptions } from "@/lib/proto/ai-data";
import { EvalCrumb, EvalMockNote, DeltaText, RunBadge, ScoreBar } from "@/components/proto/eval-ui";

const SCENARIOS = [
  { key: "qa", name: "智能问答", desc: "制度、规范与知识库引用", datasetId: "DS-03" },
  { key: "route", name: "航线规划", desc: "空域、设备与航线草稿", datasetId: "DS-01" },
  { key: "tool", name: "工具调用", desc: "Skill 选择与参数合法性", datasetId: "DS-04" },
  { key: "report", name: "巡检分析与报告", desc: "结果解释、引用与摘要", datasetId: "DS-02" },
];

const DEFAULT_EVALUATORS = ["rule-intent", "rule-tool", "rule-business", "rule-safety", "llm-quality"];

export default function StartEvalPage() {
  const { state, startExperiment } = useProto();
  const datasets = state.eval.datasets;
  const published = state.agents.find((a) => a.agentId === "AGENT-COPILOT-OPS" && a.state === "published")?.version;
  const agentVersions = Array.from(
    new Set(state.agents.filter((a) => a.agentId === "AGENT-COPILOT-OPS").map((a) => a.version)),
  );
  const promptOptions = useMemo(() => promptVersionOptions(state.ai.prompts), [state.ai.prompts]);

  const [scenario, setScenario] = useState(SCENARIOS[0].key);
  const [datasetId, setDatasetId] = useState(
    datasets.find((d) => d.id === SCENARIOS[0].datasetId)?.id ?? datasets[0]?.id ?? "",
  );
  const [agentVersion, setAgentVersion] = useState(published ?? agentVersions[0] ?? "1.4.2");
  const [promptVersion, setPromptVersion] = useState(promptOptions[0]?.value ?? "1.4.2");
  const [model, setModel] = useState("deepseek-v4-pro");
  const [runExpId, setRunExpId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const dataset = datasets.find((d) => d.id === datasetId);
  const scenarioMeta = SCENARIOS.find((s) => s.key === scenario);

  const pickScenario = (key: string) => {
    const s = SCENARIOS.find((x) => x.key === key);
    setScenario(key);
    setError("");
    const ds = datasets.find((d) => d.id === s?.datasetId);
    if (ds) setDatasetId(ds.id);
  };

  const run = () => {
    if (!dataset) {
      setError("请选择评测用例");
      return;
    }
    if (dataset.draft) {
      setError("该用例集有未保存变更，请先在评测用例页保存版本");
      return;
    }
    setError("");
    const exp = startExperiment({
      name: `${scenarioMeta?.name ?? "评测"} · ${dataset.name}`,
      datasetId: dataset.id,
      agentVersion,
      model,
      promptVersion,
      toolsVersion: "tools-2026.10.29",
      workflowVersion: "wf-1.5",
      evaluatorIds: DEFAULT_EVALUATORS,
    });
    setRunExpId(exp.id);
  };

  const exp = runExpId ? state.eval.experiments.find((e) => e.id === runExpId) : undefined;
  const running = exp?.status === "running";
  const done = exp?.status === "done";
  const progress = exp ? Math.round((exp.results.length / Math.max(1, exp.caseIds.length)) * 100) : 0;
  const summary = exp && done ? summarize(exp, datasets.find((d) => d.id === exp.datasetId)) : null;

  const baseline = useMemo(() => {
    if (!exp) return undefined;
    return [...state.eval.experiments]
      .filter((e) => e.status === "done" && e.datasetId === exp.datasetId && e.id !== exp.id)
      .sort((a, b) => ((a.runAt ?? a.createdAt) < (b.runAt ?? b.createdAt) ? 1 : -1))[0];
  }, [state.eval.experiments, exp]);
  const baseSummary = baseline ? summarize(baseline, datasets.find((d) => d.id === baseline.datasetId)) : null;

  const failedColumns: Column<EvalCaseResult>[] = [
    {
      key: "case",
      title: "用例",
      render: (r) => {
        const c = dataset?.cases.find((x) => x.id === r.caseId);
        return (
          <div>
            <b>{c?.name ?? r.caseId}</b>
            <span className="p-cell-sub p-mono">{r.caseId}</span>
          </div>
        );
      },
    },
    {
      key: "type",
      title: "失败类型",
      width: "110px",
      render: (r) => (r.failType ? <Badge tone={r.failType === "safety" ? "danger" : "warn"}>{FAIL_TYPE_LABEL[r.failType]}</Badge> : <span className="p-muted">—</span>),
    },
    {
      key: "actual",
      title: "实际结果",
      render: (r) => (
        <div>
          <span className="p-small">{r.failReason ?? r.ruleNote}</span>
          <span className="p-cell-sub p-mono">{r.actualTools.join(" → ") || r.actualIntent}</span>
        </div>
      ),
    },
    {
      key: "expected",
      title: "预期结果",
      render: (r) => <span className="p-small">{dataset?.cases.find((c) => c.id === r.caseId)?.expectedResult ?? "—"}</span>,
    },
    {
      key: "ops",
      title: "",
      width: "100px",
      render: (r) => (
        <Link href="/proto/admin/eval/failures" className="p-link p-small">
          去分析
        </Link>
      ),
    },
  ];

  return (
    <div>
      <EvalCrumb label="开始评测" />

      <div className="p-page-head">
        <div>
          <h1>开始评测</h1>
          <p>选择场景与版本，用同一批用例检查当前效果；默认配置可直接运行</p>
        </div>
        <div className="p-page-actions">
          <Badge tone="warn">模拟数据</Badge>
          <Link href="/proto/admin/eval/experiments" className="p-btn p-btn-secondary p-btn-md">
            完整实验配置
          </Link>
        </div>
      </div>

      <div className="p-admin-split">
        <div className="p-stack">
          <div className="p-card p-card-pad">
            <div className="p-row-between" style={{ marginBottom: 10 }}>
              <h3 className="p-side-h">1. 选择评测场景</h3>
              <span className="p-muted p-small">场景决定使用哪套测试用例</span>
            </div>
            <div className="p-scene-grid">
              {SCENARIOS.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  className={`p-scene${scenario === s.key ? " is-active" : ""}`}
                  onClick={() => pickScenario(s.key)}
                >
                  <b>{s.name}</b>
                  <span>{s.desc}</span>
                  <em>{datasets.find((d) => d.id === s.datasetId)?.cases.length ?? 0} 条用例</em>
                </button>
              ))}
            </div>
          </div>

          <div className="p-card p-card-pad">
            <div className="p-row-between" style={{ marginBottom: 10 }}>
              <h3 className="p-side-h">2. 确认版本与用例</h3>
              <span className="p-muted p-small">已预填推荐配置</span>
            </div>
            <div className="p-grid-2">
              <Field label="评测用例">
                <Select value={datasetId} onChange={(e) => { setDatasetId(e.target.value); setError(""); }}>
                  {datasets.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} · {d.version} · {d.cases.length} 条
                      {d.draft ? "（有未保存变更）" : ""}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="被测 Agent 版本">
                <Select value={agentVersion} onChange={(e) => setAgentVersion(e.target.value)}>
                  {agentVersions.map((v) => (
                    <option key={v} value={v}>
                      {v}
                      {v === published ? " · 线上" : " · 草稿"}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Prompt 版本">
                <Select value={promptVersion} onChange={(e) => setPromptVersion(e.target.value)}>
                  {promptOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="模型">
                <Select value={model} onChange={(e) => setModel(e.target.value)}>
                  {state.ai.models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.id} · {m.tags[0]}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="p-eval-chips">
              {DEFAULT_EVALUATORS.map((id) => {
                const ev = EVALUATORS.find((x) => x.id === id);
                return (
                  <span key={id} className={`p-eval-chip${id === "rule-safety" ? " is-safety" : ""}`}>
                    <ShieldCheck size={11} /> {ev?.name}
                  </span>
                );
              })}
            </div>
            {error && <div className="p-warn-banner" style={{ marginTop: 10, marginBottom: 0 }}>{error}</div>}
            <div className="p-row-between" style={{ marginTop: 12 }}>
              <span className="p-muted p-small">运行使用预置模拟结果，不调用真实模型或设备。</span>
              <button className="p-btn p-btn-primary p-btn-md" onClick={run} disabled={running}>
                <Play size={13} /> {exp ? "重新运行" : "开始评测"}
              </button>
            </div>
          </div>

          <div className="p-card p-card-pad">
            <div className="p-row-between" style={{ marginBottom: 10 }}>
              <h3 className="p-side-h">3. 结果</h3>
              {exp && <RunBadge status={exp.status} />}
            </div>
            {!exp ? (
              <p className="p-muted p-small" style={{ margin: 0 }}>
                运行后会在这里显示进度、通过率与失败用例；也可以到「评测实验记录」查看全部历史。
              </p>
            ) : (
              <>
                <div className="p-runbar-row">
                  <div className="p-runbar">
                    <i style={{ width: `${progress}%` }} />
                  </div>
                  <span className="p-mono p-small">
                    {exp.results.length}/{exp.caseIds.length} 条 · {progress}%
                  </span>
                </div>
                {done && summary && (
                  <>
                    <Stats
                      items={[
                        { label: "用例通过率", value: `${summary.passRate}%`, tone: summary.passRate >= 90 ? "ok" : "warn", hint: `${summary.pass}/${summary.total} 条` },
                        { label: "安全用例", value: `${summary.safetyPass}/${summary.safetyTotal}`, tone: summary.safetyRate === 100 ? "ok" : "danger", hint: "独立硬性判定" },
                        { label: "平均耗时", value: `${(summary.avgMs / 1000).toFixed(1)}s`, hint: "模拟" },
                        { label: "失败", value: summary.total - summary.pass, tone: summary.total > summary.pass ? "danger" : "ok", hint: "可进入失败分析" },
                      ]}
                    />
                    {baseline && baseSummary && (
                      <div className="p-compare-line">
                        <span>
                          与上次同用例实验对比（{baseline.id} · {baseline.agentVersion}）：通过率{" "}
                          <b>{baseSummary.passRate}%</b> → <b>{summary.passRate}%</b>
                        </span>
                        <DeltaText from={baseSummary.passRate} to={summary.passRate} />
                        <Link href="/proto/admin/eval/compare" className="p-link p-small">
                          版本对比
                        </Link>
                      </div>
                    )}
                    <div className="p-row-between" style={{ margin: "12px 0 8px" }}>
                      <h4 className="p-side-h">失败用例</h4>
                      <Link href={`/proto/admin/eval/experiments/${exp.id}`} className="p-link p-small">
                        查看完整实验
                      </Link>
                    </div>
                    <DataTable
                      columns={failedColumns}
                      rows={exp.results.filter((r) => !r.pass)}
                      rowKey={(r) => r.caseId}
                      empty="本次没有失败用例"
                      emptyHint="可以进入版本对比，确认相对基线是否有提升"
                    />
                  </>
                )}
              </>
            )}
          </div>
        </div>

        <div className="p-stack">
          <div className="p-card p-card-pad">
            <h3 className="p-side-h">这次会怎么判定</h3>
            <ul className="p-check-list">
              <li>意图与参数：确定性规则比对意图枚举与取值</li>
              <li>工具调用：期望工具集合、顺序与必填参数</li>
              <li>业务结果：平台状态与验收条件，不由模型自评</li>
              <li>安全：越权、危险操作、非法参数一票否决</li>
              <li>回答质量：模拟评分，只解释表述，不参与安全判定</li>
            </ul>
            <p className="p-muted p-small" style={{ margin: "8px 0 0" }}>
              任务成功率按业务状态与验收条件计算，不是模型给自己打分。
            </p>
          </div>

          <div className="p-card p-card-pad">
            <h3 className="p-side-h">跑完之后</h3>
            <div className="p-next-links">
              <Link href="/proto/admin/eval/failures" className="p-line p-line-link">
                <div>
                  <b>查看失败原因</b>
                  <span>按链路段归因，创建修复记录</span>
                </div>
                <ArrowRight size={12} />
              </Link>
              <Link href="/proto/admin/eval/compare" className="p-line p-line-link">
                <div>
                  <b>和基线比一比</b>
                  <span>哪些变好、哪些退步</span>
                </div>
                <ArrowRight size={12} />
              </Link>
              <Link href="/proto/admin/eval/gate" className="p-line p-line-link">
                <div>
                  <b>判断能否发布</b>
                  <span>质量阈值与安全硬性门禁</span>
                </div>
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>

          {baseline && baseSummary && (
            <div className="p-card p-card-pad">
              <div className="p-row-between">
                <h3 className="p-side-h">上次同用例结果</h3>
                <Badge tone="muted">{baseline.id}</Badge>
              </div>
              <div className="p-mini-stats" style={{ marginTop: 8 }}>
                <div><span>被测版本</span><b>{baseline.agentVersion}</b></div>
                <div><span>通过率</span><b>{baseSummary.passRate}%</b></div>
              </div>
              <div style={{ marginTop: 8 }}>
                <ScoreBar value={baseSummary.passRate} />
              </div>
            </div>
          )}

          <div className="p-note">
            <ShieldCheck size={12} /> 安全用例独立判定：平均分再高，安全不达标也不能发布。
          </div>
        </div>
      </div>

      <EvalMockNote>开始评测使用预置模拟结果逐条回填，可用于演示进度、失败定位与对比。</EvalMockNote>
    </div>
  );
}
