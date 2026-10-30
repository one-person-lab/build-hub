"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, CheckCircle2, Play, Plus, RotateCcw, Save, Send, Trash2 } from "lucide-react";
import { Badge, Button, Dialog, Field, KeyValue, Select, Switch, Tabs, TextInput, Textarea } from "@/components/proto/ui";
import { useProto } from "@/lib/proto/store";
import { RISK_LABEL } from "@/lib/proto/data";
import {
  SKILL_STEP_LABEL,
  SKILL_TEST_INPUTS,
  activeVersion,
  publishedVersion,
  toolById,
  toolSourceLabel,
  type SkillStep,
  type SkillStepKind,
} from "@/lib/proto/skill-data";

type TabKey = "steps" | "io" | "tools" | "safety" | "versions" | "test";

const KIND_OPTIONS: SkillStepKind[] = ["reason", "tool", "confirm", "summary"];

export default function SkillDetailPage() {
  const params = useParams<{ id: string }>();
  const skillId = decodeURIComponent(params.id);
  const proto = useProto();
  const { state } = proto;
  const skill = state.skills.items.find((s) => s.id === skillId);

  const [tab, setTab] = useState<TabKey>("steps");
  const [steps, setSteps] = useState<SkillStep[]>(() => (skill ? activeVersion(skill).steps : []));
  const [note, setNote] = useState("");
  const [publishOpen, setPublishOpen] = useState(false);
  const [testInput, setTestInput] = useState(SKILL_TEST_INPUTS[0]);
  const [testRunId, setTestRunId] = useState<string | null>(null);
  const [testVersionId, setTestVersionId] = useState<string | undefined>(undefined);

  const testRun = state.skills.runs.find((r) => r.id === testRunId) ?? null;

  const tools = useMemo(() => {
    const ids = Array.from(new Set(steps.filter((s) => s.toolId).map((s) => s.toolId!)));
    return ids.map((id) => toolById(id)).filter((t): t is NonNullable<typeof t> => !!t);
  }, [steps]);

  if (!skill) {
    return (
      <div className="p-card p-card-pad">
        <b>Skill 不存在</b>
        <Link href="/proto/admin/agents/skills" className="p-btn p-btn-primary p-btn-md">
          返回列表
        </Link>
      </div>
    );
  }

  const published = publishedVersion(skill);
  const draft = skill.versions.find((v) => v.state === "draft");
  const active = activeVersion(skill);

  const patchStep = (key: string, patch: Partial<SkillStep>) =>
    setSteps((cur) => cur.map((s) => (s.key === key ? { ...s, ...patch } : s)));

  const move = (index: number, delta: number) =>
    setSteps((cur) => {
      const next = [...cur];
      const [item] = next.splice(index, 1);
      next.splice(index + delta, 0, item);
      return next;
    });

  const removeStep = (key: string) => setSteps((cur) => cur.filter((s) => s.key !== key));

  const addStep = () =>
    setSteps((cur) => [
      ...cur,
      {
        key: `n${cur.length + 1}`,
        title: "新步骤",
        desc: "描述这一步做什么、依据什么。",
        kind: "tool",
        onError: "说明失败时怎么处理，不得静默跳过。",
      },
    ]);

  return (
    <div>
      <div className="p-crumb">
        <Link href="/proto/admin/agents/skills">Skill 管理</Link>
        <span>/</span>
        <span>{skill.id}</span>
      </div>

      <div className="p-page-head">
        <div>
          <h1>{skill.name}</h1>
          <p>
            {skill.desc} · 负责人 {skill.owner}
          </p>
        </div>
        <div className="p-page-actions">
          <Badge tone="ok">线上 {published.version}</Badge>
          {draft && <Badge tone="warn">草稿 {draft.version}</Badge>}
          <Switch on={skill.enabled} onChange={() => proto.toggleSkill(skill.id)} label={skill.enabled ? "已启用" : "已停用"} />
          <Button icon={<Save size={13} />} onClick={() => proto.saveSkillDraft(skill.id, { steps, note })}>
            保存草稿
          </Button>
          <Button variant="primary" icon={<Send size={13} />} disabled={!draft} onClick={() => setPublishOpen(true)}>
            发布
          </Button>
        </div>
      </div>

      <Tabs<TabKey>
        value={tab}
        onChange={setTab}
        items={[
          { key: "steps", label: "步骤编排", count: steps.length },
          { key: "io", label: "输入输出" },
          { key: "tools", label: "依赖工具", count: tools.length },
          { key: "safety", label: "安全与失败处理" },
          { key: "versions", label: "版本", count: skill.versions.length },
          { key: "test", label: "模拟测试" },
        ]}
      />

      <div className="p-admin-split">
        <div className="p-stack">
          {tab === "steps" && (
            <div className="p-card p-card-pad">
              <div className="p-row-between" style={{ marginBottom: 10 }}>
                <div>
                  <h3 className="p-side-h">步骤编排</h3>
                  <p className="p-muted p-small" style={{ margin: 0 }}>
                    正在编辑 {draft ? `草稿 ${draft.version}` : `线上 ${published.version}（保存后会新建草稿）`}
                  </p>
                </div>
                <Button size="sm" icon={<RotateCcw size={12} />} onClick={() => setSteps(active.steps)}>
                  还原
                </Button>
              </div>

              <div className="p-stack">
                {steps.map((st, i) => {
                  const tool = st.toolId ? toolById(st.toolId) : undefined;
                  const src = toolSourceLabel(st.toolId);
                  return (
                    <div key={st.key} className="p-step-edit">
                      <div className="p-step-edit-head">
                        <span className={`p-step-kind is-${st.kind}`}>{SKILL_STEP_LABEL[st.kind]}</span>
                        <span className="p-mono p-small">{st.key}</span>
                        <Select
                          value={st.kind}
                          style={{ width: 110 }}
                          onChange={(e) => patchStep(st.key, { kind: e.target.value as SkillStepKind })}
                        >
                          {KIND_OPTIONS.map((k) => (
                            <option key={k} value={k}>
                              {SKILL_STEP_LABEL[k]}
                            </option>
                          ))}
                        </Select>
                        <Select
                          value={st.toolId ?? ""}
                          style={{ width: 200 }}
                          onChange={(e) =>
                            patchStep(st.key, { toolId: e.target.value || undefined, risk: toolById(e.target.value)?.risk })
                          }
                        >
                          <option value="">不调用工具</option>
                          {state.tools.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}（{t.source === "mcp" ? "MCP" : "内部 API"}）
                            </option>
                          ))}
                        </Select>
                        {tool && <Badge tone={tool.risk === "high" ? "danger" : tool.risk === "mid" ? "warn" : "muted"}>{RISK_LABEL[tool.risk]}</Badge>}
                        <div className="p-row-ops">
                          <Button size="sm" variant="ghost" disabled={i === 0} onClick={() => move(i, -1)}>
                            <ArrowUp size={12} />
                          </Button>
                          <Button size="sm" variant="ghost" disabled={i === steps.length - 1} onClick={() => move(i, 1)}>
                            <ArrowDown size={12} />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => removeStep(st.key)}>
                            <Trash2 size={12} />
                          </Button>
                        </div>
                      </div>
                      <div className="p-grid-2">
                        <Field label="步骤名称">
                          <TextInput value={st.title} onChange={(e) => patchStep(st.key, { title: e.target.value })} />
                        </Field>
                        <Field label="调用方式">
                          <TextInput value={tool ? `${tool.id} · ${src.text}${src.text === "MCP" ? ` (${src.detail})` : ""}` : st.service ?? "模型推理"} disabled />
                        </Field>
                      </div>
                      <Field label="步骤说明">
                        <Textarea rows={2} value={st.desc} onChange={(e) => patchStep(st.key, { desc: e.target.value })} />
                      </Field>
                      <Field label="失败处理" hint="必须写清楚：失败时是重试、降级、中止还是转人工">
                        <Textarea rows={2} value={st.onError} onChange={(e) => patchStep(st.key, { onError: e.target.value })} />
                      </Field>
                    </div>
                  );
                })}
              </div>

              <div className="p-inline-actions" style={{ marginTop: 10 }}>
                <Button icon={<Plus size={13} />} onClick={addStep}>
                  添加步骤
                </Button>
                <Field label="草稿说明">
                  <TextInput value={note} onChange={(e) => setNote(e.target.value)} placeholder="这次改了什么，例如：下发前增加通行条件复核" />
                </Field>
                <Button variant="primary" icon={<Save size={13} />} onClick={() => proto.saveSkillDraft(skill.id, { steps, note })}>
                  保存草稿
                </Button>
              </div>

              <div className="p-note">
                高风险写操作只应经由内部业务 API 完成；把下发类动作包装成 MCP 暴露给外部 Server 会绕过业务授权，本原型不做这种映射。
              </div>
            </div>
          )}

          {tab === "io" && (
            <div className="p-stack">
              <div className="p-card p-card-pad">
                <h3 className="p-side-h">输入</h3>
                <div className="p-table-wrap">
                  <table className="p-table">
                    <thead>
                      <tr>
                        <th>字段</th>
                        <th style={{ width: 110 }}>类型</th>
                        <th style={{ width: 80 }}>必填</th>
                        <th>说明</th>
                      </tr>
                    </thead>
                    <tbody>
                      {skill.inputs.map((f) => (
                        <tr key={f.name}>
                          <td className="p-mono">{f.name}</td>
                          <td>{f.type}</td>
                          <td>{f.required ? "是" : "否"}</td>
                          <td>{f.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="p-card p-card-pad">
                <h3 className="p-side-h">输出</h3>
                <div className="p-table-wrap">
                  <table className="p-table">
                    <thead>
                      <tr>
                        <th>字段</th>
                        <th style={{ width: 110 }}>类型</th>
                        <th style={{ width: 80 }}>必填</th>
                        <th>说明</th>
                      </tr>
                    </thead>
                    <tbody>
                      {skill.outputs.map((f) => (
                        <tr key={f.name}>
                          <td className="p-mono">{f.name}</td>
                          <td>{f.type}</td>
                          <td>{f.required ? "是" : "否"}</td>
                          <td>{f.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="p-card p-card-pad">
                <h3 className="p-side-h">适用场景与触发说法</h3>
                <div className="p-lines">
                  {skill.scenarios.map((s) => (
                    <div key={s} className="p-line">
                      <div>
                        <b>{s}</b>
                        <span>适用场景</span>
                      </div>
                    </div>
                  ))}
                  {skill.triggers.map((t) => (
                    <div key={t} className="p-line">
                      <div>
                        <b>「{t}」</b>
                        <span>命中示例（原型用关键词匹配，不是真实语义模型）</span>
                      </div>
                    </div>
                  ))}
                  {!skill.triggers.length && <p className="p-muted p-small">尚未配置触发示例。</p>}
                </div>
              </div>
            </div>
          )}

          {tab === "tools" && (
            <div className="p-stack">
              <div className="p-card">
                <div className="p-card-head">
                  <div>
                    <h3>依赖工具</h3>
                    <p>同一份工具目录，来源可以是 MCP Server 或内部业务 API</p>
                  </div>
                  <Link href="/proto/admin/tools" className="p-btn p-btn-ghost p-btn-sm">
                    打开工具管理
                  </Link>
                </div>
                <div className="p-table-wrap">
                  <table className="p-table">
                    <thead>
                      <tr>
                        <th>工具</th>
                        <th style={{ width: 110 }}>来源</th>
                        <th style={{ width: 90 }}>类型</th>
                        <th style={{ width: 90 }}>风险</th>
                        <th style={{ width: 100 }}>超时</th>
                        <th style={{ width: 80 }}>人工确认</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tools.map((t) => {
                        const src = toolSourceLabel(t!.id);
                        return (
                          <tr key={t!.id}>
                            <td>
                              <Link href={`/proto/admin/tools/${t!.id}`} className="p-link">
                                {t!.name}
                              </Link>
                              <div className="p-cell-sub p-mono">{t!.id}</div>
                            </td>
                            <td>
                              <Badge tone={src.text === "MCP" ? "brand" : "info"}>{src.text}</Badge>
                              {src.text === "MCP" && <div className="p-cell-sub">{src.detail}</div>}
                            </td>
                            <td>{t!.method === "read" ? "只读" : "写入"}</td>
                            <td>
                              <Badge tone={t!.risk === "high" ? "danger" : t!.risk === "mid" ? "warn" : "muted"}>{RISK_LABEL[t!.risk]}</Badge>
                            </td>
                            <td className="p-mono">{t!.timeout} ms</td>
                            <td>{t!.needConfirm ? "需要" : "不需要"}</td>
                          </tr>
                        );
                      })}
                      {!tools.length && (
                        <tr>
                          <td colSpan={6} className="p-muted">
                            当前版本没有调用任何工具
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="p-note">
                MCP 只解决「怎么连」，不提供业务授权与飞行安全保障：设备状态可以经 MCP 查询，但航线校验、任务下发仍由业务服务校验与执行。
              </div>
            </div>
          )}

          {tab === "safety" && (
            <div className="p-stack">
              <div className="p-card p-card-pad">
                <h3 className="p-side-h">前置条件</h3>
                <ul className="p-issue-list">
                  {skill.preconditions.map((s) => (
                    <li key={s} className="is-ok-static">
                      <CheckCircle2 size={13} /> {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-card p-card-pad">
                <h3 className="p-side-h">失败处理</h3>
                <ul className="p-issue-list">
                  {skill.failurePolicy.map((s) => (
                    <li key={s} className="is-warn">
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-card p-card-pad">
                <h3 className="p-side-h">安全约束</h3>
                <ul className="p-issue-list">
                  {skill.safety.map((s) => (
                    <li key={s} className="is-ok-static">
                      <CheckCircle2 size={13} /> {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-card p-card-pad">
                <h3 className="p-side-h">人工确认节点</h3>
                {skill.needConfirm.length ? (
                  <ul className="p-issue-list">
                    {skill.needConfirm.map((s) => (
                      <li key={s} className="is-warn">
                        {s}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="p-muted p-small">该 Skill 全程只读，不需要人工确认节点。</p>
                )}
              </div>
            </div>
          )}

          {tab === "versions" && (
            <div className="p-card">
              <div className="p-card-head">
                <div>
                  <h3>版本记录</h3>
                  <p>发布后 Agent 下次选择即使用新版本；实验通过锁定版本对比</p>
                </div>
                <Button size="sm" variant="primary" icon={<Send size={12} />} disabled={!draft} onClick={() => setPublishOpen(true)}>
                  发布草稿
                </Button>
              </div>
              <div className="p-lines">
                {skill.versions.map((v) => (
                  <div key={v.id} className="p-line">
                    <div>
                      <b className="p-mono">{v.version}</b>
                      <span>
                        {v.note} · {v.author} · {v.at} · {v.steps.length} 个步骤
                      </span>
                    </div>
                    <Badge tone={v.state === "published" ? "ok" : v.state === "draft" ? "warn" : "muted"}>
                      {v.state === "published" ? "线上" : v.state === "draft" ? "草稿" : "已归档"}
                    </Badge>
                    {v.state === "draft" && (
                      <Button size="sm" variant="ghost" onClick={() => setSteps(v.steps)}>
                        载入编辑
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "test" && (
            <div className="p-stack">
              <div className="p-card p-card-pad">
                <h3 className="p-side-h">模拟测试</h3>
                <p className="p-muted p-small" style={{ marginTop: 0 }}>
                  用固定输入跑一遍 Skill 的步骤编排，全部为模拟数据：不连真实设备，也不调用真实模型。
                </p>
                <div className="p-chips" style={{ marginBottom: 10 }}>
                  {SKILL_TEST_INPUTS.map((t) => (
                    <button key={t} onClick={() => setTestInput(t)}>
                      {t}
                    </button>
                  ))}
                </div>
                <div className="p-inline-actions">
                  <TextInput value={testInput} onChange={(e) => setTestInput(e.target.value)} />
                  <Button
                    variant="primary"
                    icon={<Play size={13} />}
                    onClick={() => {
                      const versionId = draft?.id ?? published.id;
                      setTestVersionId(versionId);
                      const run = proto.runSkill(skill.id, testInput, { versionId });
                      setTestRunId(run?.id ?? null);
                    }}
                  >
                    运行
                  </Button>
                </div>
              </div>

              {testRun && (
                <div className="p-card p-card-pad">
                  <div className="p-row-between" style={{ marginBottom: 8 }}>
                    <h3 className="p-side-h">运行 {testRun.id}</h3>
                    <div className="p-inline-actions">
                      <Badge tone={testRun.status === "waiting_confirm" ? "warn" : "ok"}>
                        {testRun.status === "waiting_confirm" ? "待人工确认" : "已完成"}
                      </Badge>
                      <Link href={`/proto/admin/traces/${testRun.traceId}`} className="p-link p-small">
                        Trace {testRun.traceId}
                      </Link>
                    </div>
                  </div>
                  <ol className="p-run-steps">
                    {testRun.steps.map((st) => (
                      <li key={st.key} className={`is-${st.status}`}>
                        <span className={`p-step-kind is-${st.kind}`}>{SKILL_STEP_LABEL[st.kind]}</span>
                        <div>
                          <b>{st.title}</b>
                          <span className="p-cell-sub">
                            {st.source === "mcp"
                              ? `MCP · ${st.serverName}`
                              : st.source === "internal"
                                ? "内部 API"
                                : st.source === "service"
                                  ? "业务服务"
                                  : "模型推理"}
                            {st.ms ? ` · ${st.ms}ms` : ""}
                          </span>
                          {st.result && <span className="p-run-result">{st.result}</span>}
                        </div>
                      </li>
                    ))}
                  </ol>
                  <div className="p-note">版本 {testVersionId === draft?.id ? `草稿 ${draft?.version}` : `线上 ${published.version}`}</div>
                </div>
              )}
            </div>
          )}
        </div>

        <aside className="p-stack">
          <div className="p-card p-card-pad">
            <h3 className="p-side-h">概览</h3>
            <KeyValue
              cols={1}
              items={[
                { k: "归属 Agent", v: <span className="p-mono">{skill.agentId}</span> },
                { k: "线上版本", v: <span className="p-mono">{published.version}</span> },
                { k: "状态", v: skill.enabled ? "已启用" : "已停用" },
                { k: "调用量", v: skill.callCount.toLocaleString() },
                { k: "成功率", v: skill.callCount ? `${skill.successRate}%` : "—" },
                { k: "平均耗时", v: skill.avgMs ? `${skill.avgMs} ms` : "—" },
              ]}
            />
          </div>
          <div className="p-card p-card-pad">
            <h3 className="p-side-h">依赖来源</h3>
            <div className="p-lines">
              {["mcp", "internal"].map((src) => {
                const list = tools.filter((t) => t!.source === src);
                return (
                  <div key={src} className="p-line">
                    <div>
                      <b>{src === "mcp" ? "MCP Server" : "内部业务 API"}</b>
                      <span>{list.map((t) => t!.id).join(" · ") || "未使用"}</span>
                    </div>
                    <Badge tone={src === "mcp" ? "brand" : "info"}>{list.length}</Badge>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="p-card p-card-pad">
            <h3 className="p-side-h">发布检查</h3>
            <ul className="p-issue-list">
              <li className="is-ok-static">
                <CheckCircle2 size={13} /> 至少一个步骤
              </li>
              <li className={skill.enabled ? "is-ok-static" : "is-warn"}>
                <CheckCircle2 size={13} /> {skill.enabled ? "Skill 已启用" : "Skill 已停用，发布后 Agent 也不会选中"}
              </li>
              <li className={steps.some((s) => s.kind === "confirm") || !skill.needConfirm.length ? "is-ok-static" : "is-warn"}>
                <CheckCircle2 size={13} />
                {skill.needConfirm.length ? "包含人工确认节点" : "只读 Skill，无需确认节点"}
              </li>
            </ul>
          </div>
          <div className="p-note">Skill、工具与 Agent 版本都会写入 Trace 与评测记录，方便比较不同版本的差异。</div>
        </aside>
      </div>

      <Dialog
        open={publishOpen}
        title={`发布 ${skill.name} ${draft?.version ?? ""}？`}
        confirmText="确认发布"
        onClose={() => setPublishOpen(false)}
        onConfirm={() => {
          proto.publishSkill(skill.id);
          setPublishOpen(false);
        }}
      >
        发布会把草稿置为线上版本，原线上版本转为归档。已在进行中的任务不受影响；建议先在「模拟测试」里跑一遍。
      </Dialog>
    </div>
  );
}
