"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Check,
  CircleAlert,
  FileText,
  FlaskConical,
  Layers,
  Play,
  Save,
  ShieldAlert,
  ShieldCheck,
  Undo2,
  Wrench,
} from "lucide-react";
import {
  Badge,
  Button,
  Drawer,
  EmptyState,
  Field,
  KeyValue,
  LoadingState,
  Select,
  Tabs,
  TextInput,
  Textarea,
} from "@/components/proto/ui";
import { useProto } from "@/lib/proto/store";
import { EvalMockNote, emitEvalPreset } from "@/components/proto/eval-ui";
import {
  PROMPT_LAYERS,
  PROMPT_MODULES,
  SYSTEM_PROMPT_ID,
  lineDiff,
  promptVersionKey,
  schemaLabel,
  type PromptDef,
  type PromptVersion,
} from "@/lib/proto/ai-data";

type TabKey = "edit" | "versions" | "debug" | "eval";

const STATE_LABEL: Record<PromptVersion["state"], string> = { draft: "草稿", published: "线上", archived: "归档" };

const LAYER_ICON = {
  system: FileText,
  skill: Layers,
  tool: Wrench,
  rag: BookOpen,
} as const;

interface SimPlanStep {
  step: string;
  source: string;
  note: string;
}

interface SimResult {
  json: string;
  note: string;
  schemaPass: boolean;
  businessPass: boolean;
  reply?: string;
  plan?: SimPlanStep[];
  skill?: string;
  citations?: string;
}

function simulateOutput(prompt: PromptDef, vars: Record<string, string>, systemText: string): SimResult {
  const input = (vars.user_input ?? "").trim();
  const hasArea = ["滨江", "南湖", "高架", "河道", "公园"].some((k) => input.includes(k));
  switch (prompt.purpose) {
    case "系统提示": {
      const q = vars.user_query ?? "";
      const confirmRule = /人工确认/.test(systemText);
      let skill = "未加载 Skill · 知识问答";
      let reply = "";
      let citations: string | undefined;
      const plan: SimPlanStep[] = [];
      if (/巡检|巡查|消防通道|排查/.test(q)) {
        skill = "SK-FIRE-LANE 消防通道巡检";
        plan.push({ step: "device.list_available", source: "MCP · drone-platform-mcp", note: "只读：筛选在线且电量 ≥ 40% 的设备" });
        plan.push({ step: "route.generate", source: "内部 API", note: "生成航线草稿，不写业务库" });
        plan.push({ step: "route.validate", source: "内部 API", note: "校验空域、限高与返航点" });
        plan.push({ step: "task.create", source: "内部 API · 写操作", note: confirmRule ? "人工确认后才下发" : "跳过确认直接下发（将被服务端拦截）" });
        reply = confirmRule
          ? `可以。我会按「消防通道巡检」执行：先筛可用设备，生成并校验航线草稿，然后把计划交给你确认——确认之后才会创建并下发任务。需要我现在开始吗？`
          : `可以。我会直接筛设备、生成航线并下发任务，不再单独确认。（当前提示词未强制人工确认，本回复在演练中会被服务端安全校验拦截。）`;
      } else if (/电池|故障|诊断|告警|离线/.test(q)) {
        skill = "SK-DEVICE-DIAG 设备故障诊断";
        plan.push({ step: "device.get_status", source: "MCP · drone-platform-mcp", note: "只读：读取设备状态与告警" });
        plan.push({ step: "kb.search", source: "MCP · knowledge-base-mcp", note: "只读：检索处置步骤与安全边界" });
        plan.push({ step: "event.query", source: "MCP · drone-platform-mcp", note: "只读：拉取最近事件" });
        citations = "KB-03 §3.1 电池高温处置 · KB-01 §3.2 充电规范";
        reply = `M350-01 的电池温度告警需要三路只读证据：设备实时状态、知识库处置步骤、近期事件。结论会标注来源；涉及返航或停飞的处置仍由值班长确认后执行。`;
      } else if (/通道|净宽|制度|规范|流程|规定|多宽/.test(q)) {
        citations = "KB-03 §3.1 消防通道净宽不小于 4m";
        reply = `消防通道净宽不应小于 4m；堆放物占用超过 30% 通道断面即视为占用。依据：知识库 KB-03 §3.1。若你的现场口径不同，需要以本单位最新制度为准。`;
      } else {
        reply = `我理解你的目标是「${q || "（空）"}」。请补充作业区域与期望结果，我再给出可执行的计划；涉及下发操作时会先请你确认。`;
      }
      const businessPass = /人工确认/.test(systemText) || !plan.some((p) => p.source.includes("写操作"));
      return {
        json: JSON.stringify({ reply, skill, plan, citations: citations ?? null, confirm_required: plan.some((p) => p.note.includes("人工确认")) }, null, 2),
        note: confirmRule
          ? "模拟回复遵守了人工确认约束；工具计划与回复均由规则生成，不是真实模型输出。"
          : "当前提示词缺少人工确认约束：模拟回复会直接下发写操作，服务端安全校验会拦截并记录。",
        schemaPass: true,
        businessPass,
        reply,
        plan,
        skill,
        citations,
      };
    }
    case "意图识别":
      if (input.includes("取消")) {
        return {
          json: JSON.stringify(
            { intent: "cancel_task", task_id: "T-20261029-01", missing_fields: [], requires_confirm: true, confidence: 0.93 },
            null,
            2,
          ),
          note: "结构合法，但当前角色为「作业值班员」：业务权限校验会拒绝越权取消，需要值班长确认。",
          schemaPass: true,
          businessPass: false,
        };
      }
      if (!input || (!hasArea && input.includes("巡检"))) {
        return {
          json: JSON.stringify(
            { intent: "clarify", area_id: null, missing_fields: ["area_id"], clarify_question: "请确认要巡检的作业区域", requires_confirm: false, confidence: 0.86 },
            null,
            2,
          ),
          note: "缺少作业区域时返回 clarify，不按默认区域或历史区域推断。",
          schemaPass: true,
          businessPass: true,
        };
      }
      return {
        json: JSON.stringify(
          { intent: "patrol_task", area_id: "A-01", missing_fields: [], requires_confirm: false, confidence: 0.91 },
          null,
          2,
        ),
        note: "意图与区域均可确定；下发前仍需业务平台校验设备、空域与航线。",
        schemaPass: true,
        businessPass: true,
      };
    case "任务规划":
      return {
        json: JSON.stringify(
          {
            plan: ["device.list_available", "route.generate", "route.validate", "task.create"],
            needs_confirm: true,
            business_checks: ["设备在线", "电量 ≥ 40%", "空域窗口", "返航高度"],
          },
          null,
          2,
        ),
        note: "计划只做编排，任务是否可下发由业务平台返回结论。",
        schemaPass: true,
        businessPass: true,
      };
    case "航线生成":
      return {
        json: JSON.stringify({ route_id: "R-DRAFT-01", version: "v1", waypoints: 12, alt_range: "55-65m", source: "模拟生成" }, null, 2),
        note: "航线为草稿版本，需经 route.validate 与人工确认后才可用于任务。",
        schemaPass: true,
        businessPass: true,
      };
    case "巡检分析":
      return {
        json: JSON.stringify(
          {
            task_id: vars.task_id || "T-20261029-01",
            findings: [{ type: "占道", confidence: 0.62, verified: false }],
            source: "模拟识别",
            note: "低置信度结果需人工复核，不作为确定结论",
          },
          null,
          2,
        ),
        note: "检测来源为模拟识别，低置信度不自动升级告警，也不包装成真实算法检测结果。",
        schemaPass: true,
        businessPass: true,
      };
    case "结果总结": {
      const platform = vars.platform_state || "running · 62%";
      const done = platform.includes("已完成");
      return {
        json: JSON.stringify(
          {
            summary: done ? "任务已完成，报告已生成。" : "任务仍在执行中，当前进度以业务平台为准。",
            platform_state: platform,
            report_ready: done,
          },
          null,
          2,
        ),
        note: done ? "平台状态为已完成，可生成报告结论。" : "平台状态未完成：总结不得声称任务已完成或报告已生成。",
        schemaPass: true,
        businessPass: done,
      };
    }
    default:
      return { json: "{}", note: "模拟输出", schemaPass: true, businessPass: true };
  }
}

export default function PromptDetailPage() {
  const params = useParams<{ id: string }>();
  const promptId = decodeURIComponent(params.id);
  const { state, savePromptDraft, publishPrompt, rollbackPrompt, rerunPromptGate, toast } = useProto();
  const router = useRouter();

  const prompt = state.ai.prompts.find((p) => p.id === promptId);
  const draft = prompt?.versions.find((v) => v.state === "draft") ?? prompt?.versions.find((v) => v.state === "published") ?? prompt?.versions[0];
  const published = prompt?.versions.find((v) => v.state === "published");
  const schema = state.ai.schemas.find((s) => s.impacts.prompts.includes(promptId));
  const isSystem = promptId === SYSTEM_PROMPT_ID;

  const [tab, setTab] = useState<TabKey>("edit");
  const [form, setForm] = useState({ system: "", user: "", model: "", temperature: 0.2, maxTokens: 1024, note: "" });
  const [vars, setVars] = useState<Record<string, string>>({});
  const [running, setRunning] = useState(false);
  const [sim, setSim] = useState<SimResult | null>(null);
  const [rendered, setRendered] = useState<{ system: string; user: string } | null>(null);
  const [diffTarget, setDiffTarget] = useState<PromptVersion | null>(null);
  const [debugVersionId, setDebugVersionId] = useState("");

  useEffect(() => {
    if (!draft) return;
    setForm({
      system: draft.system,
      user: draft.user,
      model: draft.model,
      temperature: draft.temperature,
      maxTokens: draft.maxTokens,
      note: draft.note,
    });
    setVars(Object.fromEntries(draft.vars.map((v) => [v.name, v.sample])));
    setSim(null);
    setRendered(null);
    setDebugVersionId(draft.id);
  }, [draft?.id]);

  const debugVersion = prompt?.versions.find((v) => v.id === debugVersionId) ?? draft;
  const testingDraft = !!debugVersion && debugVersion.id === draft?.id;
  const testSystem = testingDraft ? form.system : debugVersion?.system ?? "";
  const testUser = testingDraft ? form.user : debugVersion?.user ?? "";

  const templateVars = useMemo(() => {
    const names = new Set<string>();
    for (const m of `${form.system}\n${form.user}`.matchAll(/\{\{(\w+)\}\}/g)) names.add(m[1]);
    return Array.from(names);
  }, [form.system, form.user]);

  const undeclared = useMemo(
    () => templateVars.filter((n) => !(draft?.vars ?? []).some((v) => v.name === n)),
    [templateVars, draft],
  );

  const relatedExperiments = useMemo(() => {
    if (!prompt) return [];
    return state.eval.experiments
      .filter((e) => e.promptVersion.includes(prompt.id))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [state.eval.experiments, prompt]);

  if (!prompt || !draft) {
    return (
      <EmptyState
        title="Prompt 不存在"
        hint="该 Prompt 可能不在当前演示数据中"
        action={<Link href="/proto/admin/agents/prompts" className="p-btn p-btn-primary p-btn-md">返回 Prompt 列表</Link>}
      />
    );
  }

  const dirty =
    form.system !== draft.system ||
    form.user !== draft.user ||
    form.model !== draft.model ||
    form.temperature !== draft.temperature ||
    form.maxTokens !== draft.maxTokens;

  const gate = isSystem ? draft.gate : undefined;
  const gateFailed = gate?.checks.filter((c) => !c.pass) ?? [];
  const gatePass = !!gate && gateFailed.length === 0 && draft.state === "draft";

  const runDebug = () => {
    const targetVars = (debugVersion ?? draft).vars;
    const missing = targetVars.filter((v) => v.required && !String(vars[v.name] ?? "").trim());
    if (missing.length) {
      toast(`请填写必填变量：${missing.map((v) => v.name).join("、")}`, "danger");
      return;
    }
    setRunning(true);
    setSim(null);
    setRendered(null);
    const fill = (t: string) => t.replace(/\{\{(\w+)\}\}/g, (_, k: string) => vars[k] ?? `{{${k}}}`);
    window.setTimeout(() => {
      setRendered({ system: fill(testSystem), user: fill(testUser) });
      setSim(simulateOutput(prompt, vars, testSystem));
      setRunning(false);
    }, 620);
  };

  let diffRows: { type: "same" | "added" | "removed"; text: string }[] = [];
  if (diffTarget) {
    diffRows = [
      ...lineDiff(diffTarget.system, form.system).map((d) => ({ ...d, text: `[system] ${d.text}` })),
      ...lineDiff(diffTarget.user, form.user).map((d) => ({ ...d, text: `[user] ${d.text}` })),
    ];
  }

  return (
    <div>
      <div className="p-crumb">
        <Link href="/proto/admin/agents/prompts">Prompt 管理</Link>
        <span>/</span>
        <span>{prompt.id}</span>
      </div>

      <div className="p-page-head">
        <div>
          <h1>{prompt.name}</h1>
          <p>
            <span className="p-mono">{prompt.id}</span> · {prompt.purpose} · {prompt.desc}
          </p>
        </div>
        <div className="p-page-actions">
          {isSystem && <Badge tone="brand">核心 · 全会话共用</Badge>}
          <Badge tone={draft.state === "draft" ? "warn" : "ok"}>
            当前编辑 {draft.version} · {STATE_LABEL[draft.state]}
          </Badge>
          {published && (
            <Button
              icon={<Undo2 size={13} />}
              onClick={() => {
                setForm({
                  system: published.system,
                  user: published.user,
                  model: published.model,
                  temperature: published.temperature,
                  maxTokens: published.maxTokens,
                  note: `以线上 ${published.version} 为底稿`,
                });
                setVars(Object.fromEntries(published.vars.map((v) => [v.name, v.sample])));
                setSim(null);
                setRendered(null);
                savePromptDraft(prompt.id, {
                  system: published.system,
                  user: published.user,
                  model: published.model,
                  temperature: published.temperature,
                  maxTokens: published.maxTokens,
                  note: `以线上 ${published.version} 为底稿`,
                });
                toast(`草稿内容已替换为线上 ${published.version}，需重跑回归后才可发布`, "info");
              }}
            >
              以线上版本为底稿
            </Button>
          )}
          <Button
            variant="primary"
            icon={<FlaskConical size={13} />}
            onClick={() => {
              emitEvalPreset({ promptVersion: promptVersionKey(prompt, draft), datasetId: isSystem ? "DS-04" : "DS-01" });
              router.push("/proto/admin/eval/experiments");
            }}
          >
            用评测集验证
          </Button>
        </div>
      </div>

      <Tabs<TabKey>
        value={tab}
        onChange={setTab}
        items={[
          { key: "edit", label: "编辑器" },
          { key: "versions", label: "版本", count: prompt.versions.length },
          { key: "debug", label: "调试台" },
          { key: "eval", label: isSystem ? "评测与门禁" : "评测联动", count: relatedExperiments.length || undefined },
        ]}
      />

      <div className="p-admin-split">
        <div className="p-stack">
          {tab === "edit" && (
            <>
              {isSystem && (
                <div className="p-card p-card-pad">
                  <div className="p-row-between" style={{ marginBottom: 8 }}>
                    <div>
                      <h3 className="p-side-h">系统提示词包含什么</h3>
                      <p className="p-muted p-small" style={{ margin: 0 }}>
                        按模块检查当前编辑内容；缺模块不阻止保存，但会在发布门禁里被判不通过。
                      </p>
                    </div>
                    <span className="p-muted p-small">
                      {PROMPT_MODULES.filter(
                        (m) => form.system.includes(m.heading) && !(m.key === "safety" && !/人工确认/.test(form.system)),
                      ).length}/{PROMPT_MODULES.length} 个模块
                    </span>
                  </div>
                  <div className="p-module-grid">
                    {PROMPT_MODULES.map((m) => {
                      const hasSection = form.system.includes(m.heading);
                      const missingConfirm = m.key === "safety" && hasSection && !/人工确认/.test(form.system);
                      const ok = hasSection && !missingConfirm;
                      return (
                        <div key={m.key} className={`p-module${ok ? "" : " is-missing"}`}>
                          <b>
                            {ok ? <Check size={12} /> : <CircleAlert size={12} />}
                            {m.label}
                          </b>
                          <span>{missingConfirm ? "已分节，但未要求人工确认" : m.desc}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="p-card p-card-pad">
                <div className="p-row-between" style={{ marginBottom: 8 }}>
                  <h3 className="p-side-h">系统指令（System）</h3>
                  <span className="p-muted p-small">
                    {form.system.length} 字符 · 修改后需保存草稿{isSystem ? " · 模块标题形如「## 安全约束」" : ""}
                  </span>
                </div>
                <Textarea
                  rows={isSystem ? 22 : 10}
                  value={form.system}
                  onChange={(e) => setForm({ ...form, system: e.target.value })}
                  className="p-textarea p-mono"
                />
              </div>

              <div className="p-card p-card-pad">
                <div className="p-row-between" style={{ marginBottom: 8 }}>
                  <h3 className="p-side-h">用户模板（User）</h3>
                  <span className="p-muted p-small">变量写法 {"{{name}}"}，渲染色由调试台验证</span>
                </div>
                <Textarea
                  rows={7}
                  value={form.user}
                  onChange={(e) => setForm({ ...form, user: e.target.value })}
                  className="p-textarea p-mono"
                />
                {undeclared.length > 0 && (
                  <div className="p-warn-banner" style={{ marginTop: 10 }}>
                    <ShieldAlert size={14} />
                    <span>模板中使用了未声明的变量：{undeclared.map((n) => `{{${n}}}`).join("、")}，运行时不会被业务层填充。</span>
                  </div>
                )}
              </div>

              <div className="p-card p-card-pad">
                <h3 className="p-side-h">变量与模型参数</h3>
                <div className="p-grid-4">
                  <Field label="模型" hint="由模型路由的候选集约束">
                    <Select value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })}>
                      {state.ai.models.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Temperature">
                    <TextInput
                      type="number"
                      step="0.1"
                      min="0"
                      max="1"
                      value={form.temperature}
                      onChange={(e) => setForm({ ...form, temperature: Number(e.target.value) })}
                    />
                  </Field>
                  <Field label="Max Tokens">
                    <TextInput
                      type="number"
                      min="128"
                      max="8192"
                      value={form.maxTokens}
                      onChange={(e) => setForm({ ...form, maxTokens: Number(e.target.value) })}
                    />
                  </Field>
                  <Field label="版本备注">
                    <TextInput value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="本次改了什么、为什么" />
                  </Field>
                </div>

                <table className="p-table" style={{ marginTop: 12 }}>
                  <thead>
                    <tr>
                      <th>变量</th>
                      <th>类型</th>
                      <th>必填</th>
                      <th>说明</th>
                      <th>示例值</th>
                    </tr>
                  </thead>
                  <tbody>
                    {draft.vars.map((v) => (
                      <tr key={v.name}>
                        <td className="p-mono">{`{{${v.name}}}`}</td>
                        <td>{v.type}</td>
                        <td>{v.required ? <Badge tone="warn">必填</Badge> : "—"}</td>
                        <td className="p-muted">{v.desc}</td>
                        <td className="p-mono p-small">{v.sample}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="p-inline-actions" style={{ marginTop: 12 }}>
                  <Button
                    variant="primary"
                    icon={<Save size={13} />}
                    onClick={() =>
                      savePromptDraft(prompt.id, {
                        system: form.system,
                        user: form.user,
                        model: form.model,
                        temperature: form.temperature,
                        maxTokens: form.maxTokens,
                        note: form.note,
                      })
                    }
                  >
                    保存草稿{dirty ? "（有未保存修改）" : ""}
                  </Button>
                  {draft.state === "draft" && (
                    <Button
                      icon={<FlaskConical size={13} />}
                      disabled={isSystem && !gatePass}
                      onClick={() => {
                        savePromptDraft(prompt.id, {
                          system: form.system,
                          user: form.user,
                          model: form.model,
                          temperature: form.temperature,
                          maxTokens: form.maxTokens,
                          note: form.note,
                        });
                        publishPrompt(prompt.id);
                      }}
                    >
                      保存并发布
                    </Button>
                  )}
                  <span className="p-muted p-small">
                    {isSystem
                      ? gatePass
                        ? "门禁已通过，可以直接发布。"
                        : "系统提示词必须先过发布门禁：到「评测与门禁」里重跑回归。"
                      : "发布前建议先用同一份数据集跑一次回归，确认没有安全用例回归。"}
                  </span>
                </div>
              </div>
            </>
          )}

          {tab === "versions" && (
            <div className="p-card">
              <div className="p-card-head">
                <div>
                  <h3>版本历史</h3>
                  <p>草稿可编辑；发布后旧版本转归档；回滚会重新指向历史版本</p>
                </div>
                <span className="p-muted p-small">
                  线上 {published?.version ?? "—"}
                  {draft.state === "draft" ? ` · 草稿 ${draft.version}` : ""}
                </span>
              </div>
              <div className="p-version-list">
                {prompt.versions.map((v) => (
                  <div key={v.id} className="p-version-row">
                    <div className="p-version-main">
                      <b className="p-mono">{v.version}</b>
                      <Badge tone={v.state === "published" ? "ok" : v.state === "draft" ? "warn" : "muted"}>
                        {STATE_LABEL[v.state]}
                      </Badge>
                      {isSystem && v.gate && (
                        <Badge tone={v.gate.checks.every((c) => c.pass) ? "ok" : "danger"}>
                          门禁 {v.gate.checks.every((c) => c.pass) ? "通过" : "拦截"}
                        </Badge>
                      )}
                      <span className="p-muted p-small">{v.note}</span>
                    </div>
                    <div className="p-version-meta">
                      <span className="p-mono p-small">{v.at} · {v.author}</span>
                      <span className="p-mono p-small">
                        {v.model} · T {v.temperature} · {v.maxTokens} tok
                      </span>
                      <div className="p-row-ops">
                        <Button size="sm" onClick={() => setDiffTarget(v)}>与当前编辑对比</Button>
                        {v.state !== "published" && (
                          <Button size="sm" onClick={() => rollbackPrompt(prompt.id, v.version)}>回滚到此版本</Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "debug" && (
            <>
              <div className="p-card p-card-pad">
                <div className="p-row-between" style={{ marginBottom: 10 }}>
                  <h3 className="p-side-h"><Play size={12} /> 模拟调试台</h3>
                  <div className="p-row-ops">
                    <Select
                      value={debugVersion?.id ?? ""}
                      onChange={(e) => {
                        const v = prompt.versions.find((x) => x.id === e.target.value);
                        if (!v) return;
                        setDebugVersionId(v.id);
                        setVars(Object.fromEntries(v.vars.map((x) => [x.name, x.sample])));
                        setSim(null);
                        setRendered(null);
                      }}
                      style={{ width: 230 }}
                    >
                      {prompt.versions.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.version} · {STATE_LABEL[v.state]}
                        </option>
                      ))}
                    </Select>
                    <Badge tone="info">模拟环境</Badge>
                  </div>
                </div>
                <div className="p-warn-banner">
                  <ShieldAlert size={14} />
                  <span>
                    调试只渲染 Prompt 并返回模拟输出，<b>不调用真实模型、不连接无人机</b>。调试结果不能当作线上质量结论。
                    {testingDraft ? " 正在调试当前编辑内容（未保存的修改也会生效）。" : ` 正在调试 ${debugVersion?.version} 的已保存内容。`}
                  </span>
                </div>
                <div className="p-grid-2">
                  {(debugVersion ?? draft).vars.map((v) => (
                    <Field key={v.name} label={`${v.name}${v.required ? " *" : ""}`} hint={v.desc}>
                      <TextInput
                        value={vars[v.name] ?? ""}
                        onChange={(e) => setVars({ ...vars, [v.name]: e.target.value })}
                        placeholder={v.sample}
                      />
                    </Field>
                  ))}
                </div>
                <div className="p-inline-actions" style={{ marginTop: 12 }}>
                  <Button variant="primary" icon={<Play size={13} />} disabled={running} onClick={runDebug}>
                    {running ? "运行中…" : "运行模拟调试"}
                  </Button>
                  <Button
                    onClick={() => {
                      setVars(Object.fromEntries((debugVersion ?? draft).vars.map((v) => [v.name, v.sample])));
                      setSim(null);
                      setRendered(null);
                    }}
                  >
                    恢复示例值
                  </Button>
                  <span className="p-muted p-small">{form.model} · 预计 {Math.round(parseFloat(state.ai.models.find((m) => m.id === form.model)?.p50 ?? "1") * 1000)} ms</span>
                </div>
              </div>

              {running && <LoadingState text="渲染 Prompt 并生成模拟输出…" />}

              {rendered && sim && !running && (
                <>
                  <div className="p-card p-card-pad">
                    <h3 className="p-side-h">渲染后的 Prompt</h3>
                    <p className="p-muted p-small" style={{ marginTop: 0 }}>system</p>
                    <pre className="p-code">{rendered.system}</pre>
                    <p className="p-muted p-small">user</p>
                    <pre className="p-code">{rendered.user}</pre>
                  </div>
                  <div className="p-card p-card-pad">
                    <div className="p-row-between" style={{ marginBottom: 6 }}>
                      <h3 className="p-side-h">模拟输出</h3>
                      <div className="p-row-ops">
                        <Badge tone={sim.schemaPass ? "ok" : "danger"}>Schema {sim.schemaPass ? "通过" : "不通过"}</Badge>
                        <Badge tone={sim.businessPass ? "ok" : "danger"}>业务校验 {sim.businessPass ? "通过" : "拒绝"}</Badge>
                      </div>
                    </div>

                    {isSystem && sim.reply && (
                      <>
                        <p className="p-muted p-small" style={{ marginTop: 0 }}>模拟回复（规则生成，不是真实模型输出）</p>
                        <div className="p-sim-reply">{sim.reply}</div>
                        <div className="p-row-ops" style={{ margin: "10px 0 4px", flexWrap: "wrap" }}>
                          {sim.skill && <Badge tone="brand">{sim.skill}</Badge>}
                          {sim.citations && <Badge tone="muted">引用 {sim.citations}</Badge>}
                          <Badge tone={sim.businessPass ? "ok" : "danger"}>
                            {sim.businessPass ? "人工确认约束生效" : "缺少人工确认约束"}
                          </Badge>
                        </div>
                        {sim.plan && sim.plan.length > 0 && (
                          <div className="p-step-edit" style={{ marginTop: 8 }}>
                            <div className="p-step-edit-head">
                              <b>工具调用计划</b>
                              <span className="p-muted p-small">只读走 MCP，写操作走内部 API 且需人工确认</span>
                            </div>
                            <ul className="p-run-steps">
                              {sim.plan.map((p, i) => (
                                <li key={i} className={p.source.includes("写操作") ? "is-waiting" : ""}>
                                  <em className="p-step-kind is-tool">{i + 1}</em>
                                  <div>
                                    <b className="p-mono">{p.step}</b>
                                    <span className="p-cell-sub">{p.note}</span>
                                  </div>
                                  <Badge tone={p.source.includes("MCP") ? "info" : "muted"}>{p.source}</Badge>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <p className="p-muted p-small" style={{ marginBottom: 0 }}>结构化输出（模拟）</p>
                      </>
                    )}

                    <pre className="p-code is-result">{sim.json}</pre>
                    <div className={`p-note${sim.businessPass ? "" : " is-danger-static"}`} style={{ marginTop: 8 }}>
                      {sim.note}
                    </div>
                    <p className="p-muted p-small" style={{ marginBottom: 0 }}>
                      输出结构按 {schema ? schemaLabel(schema) : "未绑定 Schema"} 校验；Schema 通过不代表业务合法，权限、设备与空域仍由业务平台校验。
                    </p>
                  </div>
                </>
              )}
            </>
          )}

          {tab === "eval" && (
            <>
              {isSystem && (
                <>
                  <div className="p-card">
                    <div className="p-card-head">
                      <div>
                        <h3>同一份用例，对比 Prompt 版本</h3>
                        <p>
                          固定 Agent、模型、工具与工作流，只切系统提示词版本；指标来自 {gate?.datasetId ?? "DS-04"} 的模拟运行，
                          回滚后旧版本的历史结果不会重算。
                        </p>
                      </div>
                      <Link href="/proto/admin/eval/skills" className="p-link p-small">Skill 专项评测</Link>
                    </div>
                    <table className="p-table">
                      <thead>
                        <tr>
                          <th>版本</th>
                          <th>状态</th>
                          <th>任务完成率</th>
                          <th>工具调用正确率</th>
                          <th>答案质量</th>
                          <th>安全用例</th>
                          <th>回归时间</th>
                        </tr>
                      </thead>
                      <tbody>
                        {prompt.versions
                          .filter((v) => v.gate)
                          .map((v) => {
                            const g = v.gate!;
                            return (
                              <tr key={v.id}>
                                <td>
                                  <b className="p-mono">{v.version}</b>
                                  <span className="p-cell-sub">{v.note}</span>
                                </td>
                                <td>
                                  <Badge tone={v.state === "published" ? "ok" : v.state === "draft" ? "warn" : "muted"}>
                                    {STATE_LABEL[v.state]}
                                  </Badge>
                                </td>
                                <td><span className="p-mono">{g.metrics.taskCompletion}%</span></td>
                                <td><span className="p-mono">{g.metrics.toolCorrect}%</span></td>
                                <td><span className="p-mono">{g.metrics.answerQuality}%</span></td>
                                <td>
                                  <Badge tone={g.safety.pass === g.safety.total ? "ok" : "danger"}>
                                    {g.safety.pass}/{g.safety.total}
                                  </Badge>
                                </td>
                                <td><span className="p-mono p-small">{g.ranAt}</span></td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-card p-card-pad">
                    <div className="p-row-between" style={{ marginBottom: 8 }}>
                      <div>
                        <h3 className="p-side-h"><ShieldCheck size={12} /> 发布门禁 · {draft.version}</h3>
                        <p className="p-muted p-small" style={{ margin: 0 }}>
                          数据集 {gate?.datasetId ?? "—"} · 最近回归 {gate?.ranAt ?? "未跑"} · 校验对象是已保存草稿
                        </p>
                      </div>
                      <Badge tone={gatePass ? "ok" : "danger"}>{gatePass ? "允许发布" : "拦截发布"}</Badge>
                    </div>
                    {dirty && (
                      <div className="p-warn-banner">
                        <CircleAlert size={14} />
                        <span>当前有未保存修改。点「保存并重跑回归」会先落草稿，再按最新内容重算门禁。</span>
                      </div>
                    )}
                    {!gate && (
                      <div className="p-note" style={{ marginBottom: 10 }}>
                        编辑后旧回归记录已失效。点「保存并重跑回归」按当前草稿重新生成门禁结果。
                      </div>
                    )}
                    <ul className="p-gate-list">
                      {(gate?.checks ?? []).map((c) => (
                        <li key={c.key} className={c.pass ? "is-ok-static" : "is-danger-static"}>
                          {c.pass ? <Check size={13} /> : <CircleAlert size={13} />}
                          <div>
                            <b>{c.label}</b>
                            <span>{c.detail}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                    {gate?.safety.failedCase && (
                      <div className="p-warn-banner">
                        <ShieldAlert size={14} />
                        <span>
                          失败用例：<b>{gate.safety.failedCase}</b>。安全用例未通过时不得发布，其他指标再好也不能抵扣。
                        </span>
                      </div>
                    )}
                    <div className="p-inline-actions" style={{ marginTop: 10 }}>
                      <Button
                        onClick={() =>
                          rerunPromptGate(prompt.id, {
                            system: form.system,
                            user: form.user,
                            model: form.model,
                            temperature: form.temperature,
                            maxTokens: form.maxTokens,
                            note: form.note,
                          })
                        }
                      >
                        保存并重跑回归（模拟）
                      </Button>
                      <Button variant="primary" disabled={!gatePass} onClick={() => publishPrompt(prompt.id)}>
                        发布 {draft.version}
                      </Button>
                      <span className="p-muted p-small">门禁只验证模型行为回归；权限、设备与空域仍由服务端强制校验。</span>
                    </div>
                  </div>
                </>
              )}

              <div className="p-card p-card-pad">
                <h3 className="p-side-h">用同一份数据集验证 Prompt 版本</h3>
                <p className="p-muted p-small">
                  固定 Agent、模型、工具与工作流，只切换 Prompt 版本，结果差异才能归因到 Prompt。
                </p>
                <div className="p-inline-actions">
                  <Button
                    variant="primary"
                    icon={<FlaskConical size={13} />}
                    onClick={() => {
                      emitEvalPreset({ promptVersion: promptVersionKey(prompt, draft), datasetId: isSystem ? "DS-04" : "DS-01" });
                      router.push("/proto/admin/eval/experiments");
                    }}
                  >
                    用 {draft.version} 新建实验
                  </Button>
                  <Button
                    onClick={() => {
                      if (!published || published.id === draft.id) {
                        toast("当前没有可对比的线上版本", "info");
                        return;
                      }
                      emitEvalPreset({ promptVersion: promptVersionKey(prompt, published), datasetId: isSystem ? "DS-04" : "DS-01" });
                      router.push("/proto/admin/eval/experiments");
                    }}
                  >
                    用线上版本 {published?.version ?? "—"} 建基线
                  </Button>
                  <Link href="/proto/admin/eval/compare" className="p-btn p-btn-secondary p-btn-sm">去实验对比</Link>
                </div>
              </div>

              <div className="p-card">
                <div className="p-card-head">
                  <div>
                    <h3>相关实验</h3>
                    <p>只列出 Prompt 版本来自本 Prompt 的实验</p>
                  </div>
                  <Link href="/proto/admin/eval/experiments" className="p-link p-small">全部实验</Link>
                </div>
                {relatedExperiments.length === 0 ? (
                  <div className="p-card-pad">
                    <p className="p-muted p-small" style={{ margin: 0 }}>
                      还没有针对该 Prompt 的实验。新建实验时会预填 Prompt 版本与数据集。
                    </p>
                  </div>
                ) : (
                  <table className="p-table">
                    <thead>
                      <tr>
                        <th>实验</th>
                        <th>Prompt 版本</th>
                        <th>模型</th>
                        <th>通过率</th>
                        <th>安全用例</th>
                        <th>时间</th>
                      </tr>
                    </thead>
                    <tbody>
                      {relatedExperiments.map((e) => {
                        const pass = e.results.filter((r) => r.pass).length;
                        const total = e.results.length;
                        return (
                          <tr key={e.id}>
                            <td>
                              <Link href={`/proto/admin/eval/experiments/${e.id}`} className="p-link">{e.name}</Link>
                              <span className="p-cell-sub p-mono">{e.id}</span>
                            </td>
                            <td className="p-mono p-small">{e.promptVersion}</td>
                            <td className="p-mono p-small">{e.model}</td>
                            <td>{total ? `${Math.round((pass / total) * 100)}%` : "—"}</td>
                            <td>{e.results.some((r) => !r.pass) ? <Badge tone="warn">有失败</Badge> : <Badge tone="ok">全部通过</Badge>}</td>
                            <td className="p-mono p-small">{e.runAt ?? e.createdAt}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>

        <aside className="p-stack">
          <div className="p-card p-card-pad">
            <h3 className="p-side-h">基本信息</h3>
            <KeyValue
              cols={1}
              items={[
                { k: "Prompt ID", v: <span className="p-mono">{prompt.id}</span> },
                { k: "用途", v: prompt.purpose },
                { k: "线上版本", v: <span className="p-mono">{published?.version ?? "—"}</span> },
                { k: "Agent", v: <span className="p-mono">{prompt.agentId}</span> },
                ...(isSystem
                  ? [{ k: "发布门禁", v: <Badge tone={gatePass ? "ok" : "danger"}>{gatePass ? "通过" : "拦截"}</Badge> }]
                  : []),
                { k: "近 7 天调用", v: prompt.callCount.toLocaleString() },
                { k: "规则通过率", v: `${prompt.successRate}%` },
                { k: "平均耗时", v: `${prompt.avgMs} ms` },
                {
                  k: "输出 Schema",
                  v: schema ? (
                    <Link href={`/proto/admin/tools/schemas/${schema.id}`} className="p-link p-mono p-small">
                      {schemaLabel(schema)}
                    </Link>
                  ) : "—",
                },
              ]}
            />
          </div>

          <div className="p-card p-card-pad">
            <h3 className="p-side-h"><Layers size={12} /> 版本约束</h3>
            <ul className="p-issue-list">
              <li className="is-ok-static">草稿只影响调试与评测，不影响线上会话</li>
              <li className="is-ok-static">发布前必须用同一数据集跑回归</li>
              <li className="is-warn">安全用例回归时不得发布</li>
              <li className="is-ok-static">发布、回滚记录写入审计日志</li>
            </ul>
          </div>

          {isSystem && (
            <div className="p-card p-card-pad">
              <h3 className="p-side-h">四层输入，不要混在一起</h3>
              <div className="p-lines">
                {PROMPT_LAYERS.map((l) => {
                  const Icon = LAYER_ICON[l.key];
                  return (
                    <Link key={l.key} href={l.href} className="p-line p-line-link">
                      <div>
                        <b><Icon size={12} /> {l.label}</b>
                        <span>{l.desc}</span>
                      </div>
                      {l.key === "system" && <Badge tone="brand">本页</Badge>}
                    </Link>
                  );
                })}
              </div>
              <p className="p-muted p-small" style={{ marginBottom: 0 }}>
                只有 System 层由本页管理；Skill 指令、工具描述与检索证据都在各自模块维护，运行时按层拼接。
              </p>
            </div>
          )}

          <div className="p-card p-card-pad">
            <h3 className="p-side-h">相关入口</h3>
            <div className="p-lines">
              <Link href="/proto/admin/agents/contexts" className="p-line p-line-link">
                <div>
                  <b>上下文策略</b>
                  <span>Prompt 依赖的上下文来源与压缩规则</span>
                </div>
              </Link>
              <Link href="/proto/admin/traces/TR-20261029-0901" className="p-line p-line-link">
                <div>
                  <b>查看线上调用 Trace</b>
                  <span>模型调用、工具调用与上下文快照</span>
                </div>
              </Link>
              <Link href="/proto/admin/tools/schemas" className="p-line p-line-link">
                <div>
                  <b>输出 Schema</b>
                  <span>结构化输出的字段与校验策略</span>
                </div>
              </Link>
            </div>
          </div>
        </aside>
      </div>

      <EvalMockNote>调试台输出与实验数据均为模拟生成，未调用真实模型。</EvalMockNote>

      <Drawer
        open={!!diffTarget}
        title={diffTarget ? `${diffTarget.version} → 当前编辑` : ""}
        sub="仅对比当前编辑内容，不代表已保存版本"
        onClose={() => setDiffTarget(null)}
        width={640}
        footer={
          <div className="p-inline-actions" style={{ margin: 0 }}>
            <Button onClick={() => setDiffTarget(null)}>关闭</Button>
          </div>
        }
      >
        {diffTarget && (
          <div className="p-stack">
            <div className="p-diff-summary">
              <span><b>{diffTarget.model}</b> → <b>{form.model}</b></span>
              <span>T {diffTarget.temperature} → {form.temperature}</span>
              <span>{diffTarget.maxTokens} → {form.maxTokens} tok</span>
            </div>
            <div className="p-diff">
              {diffRows.map((d, i) => (
                <div key={i} className={`p-diff-line is-${d.type}`}>
                  <em>{d.type === "added" ? "+" : d.type === "removed" ? "-" : " "}</em>
                  <span>{d.text || " "}</span>
                </div>
              ))}
            </div>
            <p className="p-muted p-small" style={{ margin: 0 }}>
              绿色为新增行，红色为删除行。
            </p>
          </div>
        )}
      </Drawer>
    </div>
  );
}
