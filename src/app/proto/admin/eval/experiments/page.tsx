"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Play, Plus, Search } from "lucide-react";
import { Badge, Button, DataTable, Dialog, Field, Select, Stats, TextInput, type Column } from "@/components/proto/ui";
import { useProto } from "@/lib/proto/store";
import { EVALUATORS, summarize, type EvalExperiment } from "@/lib/proto/eval-data";
import { promptVersionOptions, publishedSchemaVersion } from "@/lib/proto/ai-data";
import {
  EvalCrumb,
  EvalMockNote,
  RunBadge,
  ScoreBar,
  EVAL_PRESET_EVENT,
  clearEvalPreset,
  consumeEvalPreset,
  type EvalPreset,
} from "@/components/proto/eval-ui";

const ROUTING_POLICIES = [
  { value: "按任务类型路由 · 1.0", label: "按任务类型路由 · 1.0" },
  { value: "强制 deepseek-v4-pro", label: "强制 deepseek-v4-pro（对照，全部走高成本档）" },
  { value: "降本优先", label: "降本优先（对照，只读请求全部走最低档）" },
];

export default function ExperimentsPage() {
  const { state, startExperiment, runExperiment } = useProto();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [open, setOpen] = useState(false);
  const [runId, setRunId] = useState<string | null>(null);

  const datasets = state.eval.datasets;
  const experiments = [...state.eval.experiments].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const done = experiments.filter((e) => e.status === "done");
  const agentVersions = Array.from(
    new Set(state.agents.filter((a) => a.agentId === "AGENT-COPILOT-OPS").map((a) => a.version)),
  );
  const published = state.agents.find((a) => a.agentId === "AGENT-COPILOT-OPS" && a.state === "published")?.version;
  const promptOptions = useMemo(() => promptVersionOptions(state.ai.prompts), [state.ai.prompts]);
  const modelOptions = state.ai.models.map((m) => ({ value: m.id, label: `${m.id} · ${m.tags[0]} · ¥${m.priceIn}/千 tokens 入` }));

  const [name, setName] = useState("");
  const [datasetId, setDatasetId] = useState(datasets[0]?.id ?? "");
  const [agentVersion, setAgentVersion] = useState(published ?? agentVersions[0] ?? "1.4.2");
  const [model, setModel] = useState("deepseek-v4-pro");
  const [promptVersion, setPromptVersion] = useState("1.4.2");
  const [schemaVersion, setSchemaVersion] = useState(state.ai.schemas[0] ? `${state.ai.schemas[0].id}@${publishedSchemaVersion(state.ai.schemas[0]).version}` : "");
  const [routingPolicy, setRoutingPolicy] = useState(ROUTING_POLICIES[0].value);
  const [retrievalConfigId, setRetrievalConfigId] = useState(state.rag.configs[0]?.id ?? "");
  const [toolsVersion, setToolsVersion] = useState("tools-2026.10.29");
  const [workflowVersion, setWorkflowVersion] = useState("wf-1.5");
  const [evaluatorIds, setEvaluatorIds] = useState<string[]>(["rule-intent", "rule-tool", "rule-business", "rule-safety", "llm-quality"]);
  const [baselineId, setBaselineId] = useState(done[0]?.id ?? "");
  const [error, setError] = useState("");

  useEffect(() => {
    const apply = (preset: EvalPreset) => {
      let any = false;
      if (preset.datasetId && datasets.some((d) => d.id === preset.datasetId)) {
        setDatasetId(preset.datasetId);
        any = true;
      }
      if (preset.agentVersion) {
        setAgentVersion(preset.agentVersion);
        any = true;
      }
      if (preset.promptVersion) {
        setPromptVersion(preset.promptVersion);
        any = true;
      }
      if (preset.schemaVersion) {
        setSchemaVersion(preset.schemaVersion);
        any = true;
      }
      if (preset.routingPolicy) {
        setRoutingPolicy(preset.routingPolicy);
        any = true;
      }
      if (any) setOpen(true);
    };
    apply(consumeEvalPreset());
    const onPreset = (e: Event) => {
      const detail = (e as CustomEvent<EvalPreset>).detail ?? {};
      clearEvalPreset();
      apply(detail);
    };
    window.addEventListener(EVAL_PRESET_EVENT, onPreset);
    return () => window.removeEventListener(EVAL_PRESET_EVENT, onPreset);
  }, [datasets]);

  const rows = useMemo(
    () =>
      experiments.filter(
        (e) =>
          (status === "all" || e.status === status) &&
          (!q ||
            e.name.toLowerCase().includes(q.toLowerCase()) ||
            e.id.toLowerCase().includes(q.toLowerCase()) ||
            e.agentVersion.toLowerCase().includes(q.toLowerCase())),
      ),
    [experiments, q, status],
  );

  const selectedDataset = datasets.find((d) => d.id === datasetId);

  const submit = () => {
    if (!selectedDataset) {
      setError("请选择数据集");
      return;
    }
    if (selectedDataset.draft) {
      setError("该数据集有未保存变更，请先在数据集页保存版本");
      return;
    }
    if (!evaluatorIds.length) {
      setError("至少选择一个评估器");
      return;
    }
    const exp = startExperiment({
      name: name.trim() || `${agentVersion} · ${selectedDataset.name}`,
      datasetId,
      agentVersion,
      model,
      promptVersion,
      schemaVersion: schemaVersion || undefined,
      routingPolicy,
      retrievalConfig: retrievalConfigId || undefined,
      toolsVersion,
      workflowVersion,
      evaluatorIds,
      baselineId: baselineId || undefined,
    });
    setOpen(false);
    setName("");
    setError("");
    router.push(`/proto/admin/eval/experiments/${exp.id}`);
  };

  const columns: Column<EvalExperiment>[] = [
    {
      key: "name",
      title: "实验",
      render: (e) => (
        <div>
          <b>{e.name}</b>
          <span className="p-cell-sub p-mono">{e.id}</span>
        </div>
      ),
    },
    {
      key: "dataset",
      title: "数据集",
      render: (e) => {
        const ds = datasets.find((d) => d.id === e.datasetId);
        return (
          <div>
            <b className="p-small">{ds?.name ?? e.datasetId}</b>
            <span className="p-cell-sub p-mono">{e.datasetVersion} · {e.caseIds.length} 条</span>
          </div>
        );
      },
    },
    {
      key: "version",
      title: "被测版本",
      render: (e) => (
        <div>
          <b className="p-mono">{e.agentVersion}</b>
          <span className="p-cell-sub">{e.model} · prompt {e.promptVersion}</span>
          {e.schemaVersion && <span className="p-cell-sub p-mono">{e.schemaVersion} · {e.routingPolicy ?? "默认路由"}</span>}
          {e.retrievalConfig && <span className="p-cell-sub p-mono">检索 {e.retrievalConfig}</span>}
        </div>
      ),
    },
    {
      key: "rate",
      title: "通过率",
      width: "150px",
      render: (e) => {
        const s = summarize(e, datasets.find((d) => d.id === e.datasetId));
        return e.status === "done" ? <ScoreBar value={s.passRate} /> : <span className="p-muted p-small">{e.status === "running" ? "运行中" : "—"}</span>;
      },
    },
    {
      key: "safety",
      title: "安全用例",
      width: "110px",
      render: (e) => {
        const s = summarize(e, datasets.find((d) => d.id === e.datasetId));
        if (e.status !== "done") return <span className="p-muted">—</span>;
        return (
          <Badge tone={s.safetyRate === 100 ? "ok" : "danger"}>
            {s.safetyPass}/{s.safetyTotal}
          </Badge>
        );
      },
    },
    { key: "status", title: "状态", width: "100px", render: (e) => <RunBadge status={e.status} /> },
    { key: "at", title: "时间", render: (e) => <span className="p-mono p-small">{e.runAt ?? e.createdAt}</span> },
    {
      key: "ops",
      title: "",
      width: "120px",
      render: (e) => (
        <div className="p-row-ops" onClick={(ev) => ev.stopPropagation()}>
          <Link href={`/proto/admin/eval/experiments/${e.id}`} className="p-link p-small">查看</Link>
          {e.status === "done" && (
            <button className="p-btn p-btn-text" onClick={() => setRunId(e.id)}>重跑</button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <EvalCrumb label="评测实验" />

      <div className="p-page-head">
        <div>
          <h1>评测实验</h1>
          <p>固定数据集与评估器，比较模型、Prompt、Schema、路由、工具配置与工作流版本</p>
        </div>
        <div className="p-page-actions">
          <Button variant="primary" icon={<Plus size={13} />} onClick={() => setOpen(true)}>
            新建实验
          </Button>
        </div>
      </div>

      <Stats
        items={[
          { label: "实验", value: experiments.length },
          { label: "已完成", value: done.length, tone: "ok" },
          { label: "运行中", value: experiments.filter((e) => e.status === "running").length, tone: "active" },
          {
            label: "平均耗时",
            value: `${Math.round(done.reduce((s, e) => s + (e.ms ?? 0), 0) / Math.max(1, done.length) / 1000)}s`,
            hint: "模拟运行",
          },
        ]}
      />

      <div className="p-toolbar">
        <div className="p-toolbar-search">
          <Search size={13} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索实验名称、编号或版本" />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: 130 }}>
          <option value="all">全部状态</option>
          <option value="done">已完成</option>
          <option value="running">运行中</option>
          <option value="draft">未运行</option>
        </Select>
        <span className="p-toolbar-count">{rows.length} 个实验</span>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(e) => e.id}
        onRowClick={(e) => router.push(`/proto/admin/eval/experiments/${e.id}`)}
        empty="没有符合条件的实验"
        emptyHint="新建实验后运行一次，才能与基线比较"
      />

      <Dialog open={open} title="新建评测实验" confirmText="创建并运行" onClose={() => setOpen(false)} onConfirm={submit}>
        <div className="p-form">
          <Field label="实验名称" hint="留空则按版本与数据集自动命名">
            <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="例如：1.5.1-draft 安全回归" />
          </Field>
          <div className="p-grid-2">
            <Field label="数据集" required hint={selectedDataset ? `${selectedDataset.version} · ${selectedDataset.cases.length} 条` : undefined}>
              <Select value={datasetId} onChange={(e) => { setDatasetId(e.target.value); setError(""); }}>
                {datasets.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} · {d.version}
                    {d.draft ? "（有未保存变更）" : ""}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="被测 Agent 版本" required>
              <Select value={agentVersion} onChange={(e) => setAgentVersion(e.target.value)}>
                {agentVersions.map((v) => (
                  <option key={v} value={v}>
                    {v}
                    {v === published ? " · 线上" : " · 草稿"}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="p-grid-2">
            <Field label="模型">
              <Select value={model} onChange={(e) => setModel(e.target.value)}>
                {modelOptions.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </Select>
            </Field>
            <Field label="Prompt 版本" hint="可单独指定某个 Prompt 版本，用于定位 Prompt 改动的影响">
              <Select value={promptVersion} onChange={(e) => setPromptVersion(e.target.value)}>
                {promptOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="p-grid-2">
            <Field label="输出 Schema" hint="结构校验口径；通过不代表业务合法">
              <Select value={schemaVersion} onChange={(e) => setSchemaVersion(e.target.value)}>
                {state.ai.schemas.map((s) => {
                  const v = publishedSchemaVersion(s);
                  return (
                    <option key={s.id} value={`${s.id}@${v.version}`}>
                      {s.id}@{v.version} · {s.name}
                    </option>
                  );
                })}
              </Select>
            </Field>
            <Field label="路由策略" hint="主备模型与回退边界">
              <Select value={routingPolicy} onChange={(e) => setRoutingPolicy(e.target.value)}>
                {ROUTING_POLICIES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="p-grid-2">
            <Field label="工具配置版本">
              <Select value={toolsVersion} onChange={(e) => setToolsVersion(e.target.value)}>
                <option value="tools-2026.10.24">tools-2026.10.24</option>
                <option value="tools-2026.10.29">tools-2026.10.29</option>
                <option value="tools-2026.11.02">tools-2026.11.02（草稿）</option>
              </Select>
            </Field>
            <Field label="工作流版本">
              <Select value={workflowVersion} onChange={(e) => setWorkflowVersion(e.target.value)}>
                <option value="wf-1.4">wf-1.4</option>
                <option value="wf-1.5">wf-1.5</option>
                <option value="wf-1.6-draft">wf-1.6-draft</option>
              </Select>
            </Field>
          </div>
          <Field label="检索配置" hint="知识问答类数据集记录 RAG 链路版本；不涉及检索时可留空">
            <Select value={retrievalConfigId} onChange={(e) => setRetrievalConfigId(e.target.value)}>
              <option value="">不涉及检索</option>
              {state.rag.configs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.id} · v{c.version} · {c.state === "published" ? "已发布" : "草稿"} · 重排{c.rerank ? "开" : "关"}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="评估器" required hint="确定性规则优先；LLM 评分只用于质量与表述">
            <div className="p-check-grid">
              {EVALUATORS.map((ev) => (
                <label key={ev.id} className={`p-check${evaluatorIds.includes(ev.id) ? " is-on" : ""}`}>
                  <input
                    type="checkbox"
                    checked={evaluatorIds.includes(ev.id)}
                    onChange={(e) => {
                      setEvaluatorIds((cur) => (e.target.checked ? [...cur, ev.id] : cur.filter((x) => x !== ev.id)));
                      setError("");
                    }}
                  />
                  <span>
                    <b>{ev.name}</b>
                    <em>{ev.kind === "rule" ? "确定性规则" : ev.kind === "llm" ? "LLM-as-a-judge" : "人工标注"} · {ev.scope}</em>
                  </span>
                </label>
              ))}
            </div>
          </Field>
          <Field label="对比基线" hint="选同一数据集的已完成实验">
            <Select value={baselineId} onChange={(e) => setBaselineId(e.target.value)}>
              <option value="">不设置基线</option>
              {done.map((e) => (
                <option key={e.id} value={e.id}>{e.id} · {e.agentVersion}</option>
              ))}
            </Select>
          </Field>
          {error && <div className="p-warn-banner" style={{ marginBottom: 0 }}>{error}</div>}
          <p className="p-muted p-small" style={{ margin: 0 }}>
            创建后立即开始模拟运行，逐条回填结果；不会调用真实模型或设备。
          </p>
        </div>
      </Dialog>

      <Dialog
        open={!!runId}
        title="重新运行实验？"
        confirmText="开始运行"
        onClose={() => setRunId(null)}
        onConfirm={() => {
          if (runId) runExperiment(runId);
          setRunId(null);
        }}
      >
        将按同一数据集与评估器重新生成全部结果，现有结果会被覆盖（模拟）。
      </Dialog>

      <EvalMockNote>实验运行使用预置模拟结果，可用于演示对比与门禁判定。</EvalMockNote>
    </div>
  );
}
