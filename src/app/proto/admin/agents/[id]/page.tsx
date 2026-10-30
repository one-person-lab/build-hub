"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Bot, CheckCircle2, RotateCcw, Save, Send } from "lucide-react";
import { Badge, Button, Dialog, Field, KeyValue, Select, Switch, Tabs, TextInput } from "@/components/proto/ui";
import { useProto } from "@/lib/proto/store";
import { TOOLS } from "@/lib/proto/data";
import { contextPolicyByAgent } from "@/lib/proto/ai-data";

type TabKey = "base" | "skills" | "model" | "prompt" | "context" | "versions";

const AGENTS: Record<string, { name: string; desc: string; owner: string }> = {
  "AGENT-COPILOT-OPS": { name: "作业 Copilot", desc: "对话下单、任务理解、航线与安全校验", owner: "陈默" },
  "AGENT-REPORT": { name: "报告助手", desc: "报告摘要、异常归类与处置建议草稿", owner: "周航" },
};

export default function AgentDetailPage() {
  const params = useParams<{ id: string }>();
  const agentId = decodeURIComponent(params.id);
  const meta = AGENTS[agentId];
  const { state, saveAgentDraft, publishAgentDraft, toggleSkill, toast } = useProto();
  const [tab, setTab] = useState<TabKey>("base");
  const [publishOpen, setPublishOpen] = useState(false);
  const [rollback, setRollback] = useState<string | null>(null);

  const versions = state.agents.filter((a) => a.agentId === agentId);
  const agentPrompts = state.ai.prompts.filter((p) => p.agentId === agentId);
  const agentSkills = state.skills.items.filter((s) => s.agentId === agentId);
  const policy = contextPolicyByAgent(agentId) ?? state.ai.contextPolicies[0];
  const modelOptions = state.ai.models.map((m) => ({ value: m.id, label: `${m.id} · ${m.tags[0]}` }));

  const [model, setModel] = useState(agentId === "AGENT-REPORT" ? "qwen3.8-flash" : "deepseek-v4-pro");
  const [temperature, setTemperature] = useState(0.2);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [tools, setTools] = useState<string[]>(
    agentId === "AGENT-REPORT"
      ? ["report.generate", "event.report"]
      : ["device.get_status", "route.generate", "route.validate", "task.create"],
  );
  const [prompt] = useState(
    agentId === "AGENT-REPORT"
      ? "你是无人机巡检报告助手。根据任务执行结果与事件台账生成结构化报告，结论必须区分「已核实」与「待核实」，不得虚构检测结果。"
      : "你是无人机作业 Copilot。用户用自然语言下达巡检意图时，先确认作业区域与目标，再筛选可用设备、生成航线草稿并完成安全校验；任何下发动作都必须经过人工确认。",
  );

  if (!meta) {
    return (
      <div className="p-card p-card-pad">
        <b>智能体不存在</b>
        <Link href="/proto/admin/agents" className="p-btn p-btn-primary p-btn-md">返回列表</Link>
      </div>
    );
  }

  const save = () => {
    saveAgentDraft({ model, temperature, prompt, tools });
  };

  return (
    <div>
      <div className="p-crumb">
        <Link href="/proto/admin/agents">智能体管理</Link>
        <span>/</span>
        <span>{agentId}</span>
      </div>

      <div className="p-page-head">
        <div>
          <h1>{meta.name}</h1>
          <p>{meta.desc} · 负责人 {meta.owner}</p>
        </div>
        <div className="p-page-actions">
          {versions.find((v) => v.state === "published") && (
            <Badge tone="ok">线上 {versions.find((v) => v.state === "published")!.version}</Badge>
          )}
          {versions.some((v) => v.state === "draft") && <Badge tone="warn">存在未发布草稿</Badge>}
          <Button icon={<Save size={13} />} onClick={save}>保存草稿</Button>
          <Button
            variant="primary"
            icon={<Send size={13} />}
            disabled={!versions.some((v) => v.state === "draft")}
            onClick={() => setPublishOpen(true)}
          >
            发布草稿
          </Button>
        </div>
      </div>

      <Tabs<TabKey>
        value={tab}
        onChange={setTab}
        items={[
          { key: "base", label: "基础信息" },
          { key: "skills", label: "Skill 授权", count: agentSkills.length },
          { key: "model", label: "模型配置" },
          { key: "prompt", label: "提示词" },
          { key: "context", label: "上下文策略" },
          { key: "versions", label: "版本发布", count: versions.length },
        ]}
      />

      <div className="p-admin-split">
        <div className="p-stack">
          {tab === "base" && (
            <div className="p-card p-card-pad">
              <h3 className="p-side-h">基础信息</h3>
              <div className="p-form">
                <div className="p-grid-2">
                  <Field label="名称"><TextInput defaultValue={meta.name} /></Field>
                  <Field label="编号"><TextInput defaultValue={agentId} disabled /></Field>
                </div>
                <Field label="职责描述"><TextInput defaultValue={meta.desc} /></Field>
                <div className="p-grid-2">
                  <Field label="负责人"><TextInput defaultValue={meta.owner} /></Field>
                  <Field label="服务对象" hint="仅影响后台展示">
                    <Select defaultValue="ops">
                      <option value="ops">作业值班组</option>
                      <option value="admin">管理控制台</option>
                    </Select>
                  </Field>
                </div>
                <Field label="授权工具" hint="勾选后该智能体可调用；高风险工具仍需人工确认">
                  <div className="p-check-grid">
                    {TOOLS.map((t) => (
                      <label key={t.id} className={`p-check${tools.includes(t.id) ? " is-on" : ""}`}>
                        <input
                          type="checkbox"
                          checked={tools.includes(t.id)}
                          onChange={(e) =>
                            setTools((cur) => (e.target.checked ? [...cur, t.id] : cur.filter((x) => x !== t.id)))
                          }
                        />
                        <span>
                          <b>{t.name}</b>
                          <em className="p-mono">{t.id}</em>
                        </span>
                        {t.risk === "high" && <Badge tone="danger">高风险</Badge>}
                      </label>
                    ))}
                  </div>
                </Field>
                <div className="p-inline-actions">
                  <Button variant="primary" icon={<Save size={13} />} onClick={save}>保存</Button>
                  <Button onClick={() => toast("已恢复为线上版本配置", "info")}>恢复线上配置</Button>
                </div>
              </div>
            </div>
          )}

          {tab === "skills" && (
            <div className="p-stack">
              <div className="p-card">
                <div className="p-card-head">
                  <div>
                    <h3>可用 Skill</h3>
                    <p>Agent 只能选择已授权且已启用的 Skill；Skill 再编排工具</p>
                  </div>
                  <Link href="/proto/admin/agents/skills" className="p-btn p-btn-ghost p-btn-sm">
                    打开 Skill 管理
                  </Link>
                </div>
                <div className="p-lines">
                  {agentSkills.map((s) => {
                    const published = s.versions.find((v) => v.state === "published");
                    const draft = s.versions.find((v) => v.state === "draft");
                    return (
                      <div key={s.id} className="p-line">
                        <div>
                          <b>{s.name}</b>
                          <span>
                            {s.id} · 线上 {published?.version ?? "—"}
                            {draft ? ` · 草稿 ${draft.version}` : ""} · {published?.steps.length ?? 0} 个步骤
                          </span>
                        </div>
                        <div className="p-row-ops">
                          <Badge tone={s.enabled ? "ok" : "muted"}>{s.enabled ? "已授权" : "未授权"}</Badge>
                          <Switch on={s.enabled} onChange={() => toggleSkill(s.id)} />
                          <Link href={`/proto/admin/agents/skills/${s.id}`} className="p-link p-small">
                            配置
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                  {!agentSkills.length && <p className="p-muted p-small">该 Agent 还没有可用的 Skill。</p>}
                </div>
              </div>

              <div className="p-card p-card-pad">
                <h3 className="p-side-h">执行策略</h3>
                <KeyValue
                  cols={1}
                  items={[
                    { k: "Skill 选择方式", v: "按意图与场景匹配，匹配不足时按普通问答处理，不强行加载 Skill" },
                    { k: "工具选择", v: "由 Skill 步骤声明，Agent 组织参数并处理超时与错误码" },
                    { k: "高风险动作", v: "必须停在人工确认节点；确认前不得调用下发类工具" },
                    { k: "工具来源", v: "只读查询可用 MCP；写操作只走内部业务 API" },
                    { k: "失败策略", v: "显式失败并给出替代方案，禁止静默降级到未校验路径" },
                  ]}
                />
              </div>

              <div className="p-note">
                授权 Skill ≠ 授权飞行。Skill 步骤里的设备状态校验、空域校验与权限判断始终由业务服务执行；Agent 只负责选择、组织参数与串联步骤。
              </div>
            </div>
          )}

          {tab === "model" && (
            <div className="p-card p-card-pad">
              <h3 className="p-side-h">模型配置</h3>
              <div className="p-form">
                <Field label="推理模型" required hint="原型仅展示选项，不调用真实模型">
                  <Select value={model} onChange={(e) => setModel(e.target.value)}>
                    {modelOptions.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </Select>
                </Field>
                <Field label={`温度 ${temperature.toFixed(2)}`} hint="越低越稳定，作业类建议 0.1–0.3">
                  <input
                    type="range"
                    className="p-range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={temperature}
                    onChange={(e) => setTemperature(Number(e.target.value))}
                  />
                </Field>
                <div className="p-grid-2">
                  <Field label="最大输出长度">
                    <TextInput type="number" value={maxTokens} onChange={(e) => setMaxTokens(Number(e.target.value))} />
                  </Field>
                  <Field label="超时（秒）">
                    <TextInput type="number" defaultValue={30} />
                  </Field>
                </div>
                <div className="p-note">模型服务为模拟配置，保存后写入草稿版本，发布后才会作用于线上会话。</div>
                <div className="p-inline-actions">
                  <Button variant="primary" icon={<Save size={13} />} onClick={save}>保存到草稿</Button>
                </div>
              </div>
            </div>
          )}

          {tab === "prompt" && (
            <div className="p-stack">
              <div className="p-card p-card-pad">
                <div className="p-row-between" style={{ marginBottom: 8 }}>
                  <h3 className="p-side-h">Prompt 由「Prompt 管理」统一维护</h3>
                  <Link href="/proto/admin/agents/prompts" className="p-link p-small">打开 Prompt 管理</Link>
                </div>
                <p className="p-muted p-small" style={{ marginTop: 0 }}>
                  Prompt 按用途拆分，每个用途独立版本、调试与评测；Agent 发布时锁定一组 Prompt 版本。
                </p>
                <div className="p-lines">
                  {agentPrompts.map((p) => {
                    const draft = p.versions.find((v) => v.state === "draft");
                    const published = p.versions.find((v) => v.state === "published");
                    return (
                      <Link key={p.id} href={`/proto/admin/agents/prompts/${p.id}`} className="p-line p-line-link">
                        <div>
                          <b>{p.name}</b>
                          <span>
                            {p.purpose} · 线上 {published?.version ?? "—"}
                            {draft ? ` · 草稿 ${draft.version}` : ""}
                          </span>
                        </div>
                        <Badge tone={draft ? "warn" : "ok"}>{draft ? "有草稿" : "已同步"}</Badge>
                      </Link>
                    );
                  })}
                  {agentPrompts.length === 0 && <p className="p-muted p-small">该 Agent 暂无独立 Prompt。</p>}
                </div>
              </div>
              <div className="p-card p-card-pad">
                <div className="p-row-between" style={{ marginBottom: 6 }}>
                  <h3 className="p-side-h">当前组合的角色指令（只读）</h3>
                  <Badge tone="muted">只读预览</Badge>
                </div>
                <pre className="p-code">{prompt}</pre>
                <p className="p-muted p-small" style={{ marginBottom: 0 }}>
                  此处仅展示角色约束，编辑请进入对应 Prompt 版本；不再在 Agent 页内直接改系统提示词。
                </p>
              </div>
            </div>
          )}

          {tab === "context" && (
            <div className="p-stack">
              <div className="p-card p-card-pad">
                <div className="p-row-between" style={{ marginBottom: 8 }}>
                  <h3 className="p-side-h">上下文策略由独立页面管理</h3>
                  <Link href="/proto/admin/agents/contexts" className="p-link p-small">打开上下文策略</Link>
                </div>
                <p className="p-muted p-small" style={{ marginTop: 0 }}>
                  四类上下文按优先级装配：任务与业务状态 → 执行结果 → 会话历史 → 知识检索。
                </p>
                {policy && (
                  <div className="p-lines">
                    {policy.sources.map((s) => (
                      <div key={s.id} className="p-line">
                        <div>
                          <b>{s.name}</b>
                          <span>P{s.priority} · {s.source} · 预算 {s.maxTokens} tok</span>
                        </div>
                        <Badge tone={s.enabled ? "ok" : "muted"}>{s.enabled ? "启用" : "停用"}</Badge>
                      </div>
                    ))}
                  </div>
                )}
                <div className="p-inline-actions" style={{ marginTop: 10 }}>
                  <Link href="/proto/admin/agents/contexts" className="p-btn p-btn-secondary p-btn-sm">编辑策略</Link>
                </div>
              </div>
              <div className="p-note">
                任务是否完成、设备是否在线只以业务平台为准；上下文中的任务状态仅作提示，不得据此回显完成结论。
              </div>
            </div>
          )}

          {tab === "versions" && (
            <div className="p-card">
              <div className="p-card-head">
                <div>
                  <h3>版本记录</h3>
                  <p>发布后线上会话立即生效，已在执行的任务不受影响</p>
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  icon={<Send size={12} />}
                  disabled={!versions.some((v) => v.state === "draft")}
                  onClick={() => setPublishOpen(true)}
                >
                  发布草稿
                </Button>
              </div>
              <div className="p-lines">
                {versions.map((v) => (
                  <div key={v.id} className="p-line">
                    <div>
                      <b className="p-mono">{v.version}</b>
                      <span>{v.note} · {v.author} · {v.at}</span>
                    </div>
                    <Badge tone={v.state === "published" ? "ok" : v.state === "draft" ? "warn" : "muted"}>
                      {v.state === "published" ? "线上" : v.state === "draft" ? "草稿" : "已归档"}
                    </Badge>
                    {v.state === "archived" && (
                      <Button size="sm" variant="ghost" icon={<RotateCcw size={12} />} onClick={() => setRollback(v.version)}>
                        回滚
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="p-stack">
          <div className="p-card p-card-pad">
            <div className="p-inspector-head">
              <h3 className="p-side-h">当前配置摘要</h3>
              <i className="p-agent-mark"><Bot size={14} /></i>
            </div>
            <KeyValue
              cols={1}
              items={[
                { k: "模型", v: <span className="p-mono">{model}</span> },
                { k: "温度", v: temperature.toFixed(2) },
                { k: "工具", v: `${tools.length} 个已授权` },
                { k: "Prompt", v: `${agentPrompts.length} 个 · 版本锁定` },
                { k: "上下文", v: policy ? `${policy.sources.filter((s) => s.enabled).length} 类来源 · 预算 ${policy.maxTokens} tok` : "默认策略" },
              ]}
            />
          </div>
          <div className="p-card p-card-pad">
            <h3 className="p-side-h">发布检查</h3>
            <ul className="p-issue-list">
              <li className="is-ok-static"><CheckCircle2 size={13} /> 工具参数 Schema 校验通过</li>
              <li className="is-ok-static"><CheckCircle2 size={13} /> 提示词无未定义变量</li>
              <li className={tools.length ? "is-ok-static" : "is-warn"}>
                <CheckCircle2 size={13} /> {tools.length ? "至少授权 1 个工具" : "尚未授权任何工具"}
              </li>
            </ul>
          </div>
          <div className="p-note">所有配置均为演示用途，不会调用真实模型服务。</div>
        </aside>
      </div>

      <Dialog
        open={publishOpen}
        title="发布新版本？"
        confirmText="确认发布"
        onClose={() => setPublishOpen(false)}
        onConfirm={() => {
          publishAgentDraft(agentId);
          setPublishOpen(false);
        }}
      >
        发布会把当前草稿置为线上版本，原线上版本转为归档。正在运行的任务与已确认的会话不受影响。
      </Dialog>

      <Dialog
        open={!!rollback}
        title={`回滚到 ${rollback}？`}
        confirmText="确认回滚"
        danger
        onClose={() => setRollback(null)}
        onConfirm={() => {
          toast(`已回滚到 ${rollback}（模拟），新版本将重新走发布流程`, "ok");
          setRollback(null);
        }}
      >
        回滚不会删除现有版本记录，回滚后需要再次发布才会生效。
      </Dialog>
    </div>
  );
}
