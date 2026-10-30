"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FlaskConical, Plus, Save, ShieldAlert, Trash2 } from "lucide-react";
import {
  Badge,
  Button,
  EmptyState,
  Field,
  KeyValue,
  Select,
  Tabs,
  TextInput,
} from "@/components/proto/ui";
import { useProto } from "@/lib/proto/store";
import { EvalMockNote, emitEvalPreset } from "@/components/proto/eval-ui";
import {
  draftSchemaVersion,
  publishedSchemaVersion,
  schemaJson,
  type OutputSchema,
  type SchemaField,
  type SchemaFieldType,
} from "@/lib/proto/ai-data";

type TabKey = "fields" | "mock" | "versions";

const FIELD_TYPES: SchemaFieldType[] = ["string", "number", "integer", "boolean", "enum", "array", "object"];

const POLICY_LABEL: Record<OutputSchema["policy"]["onInvalid"], string> = {
  reject: "拒绝并返回错误",
  repair_once: "自动修复一次",
  regenerate: "重新生成",
};

const DIRECTION_LABEL: Record<OutputSchema["direction"], string> = {
  "tool-output": "工具输出",
  "agent-output": "Agent 输出",
};

export default function SchemaDetailPage() {
  const params = useParams<{ id: string }>();
  const schemaId = decodeURIComponent(params.id);
  const router = useRouter();
  const { state, saveSchemaDraft, publishSchema, rollbackSchema, setSchemaPolicy, toast } = useProto();

  const schema = state.ai.schemas.find((s) => s.id === schemaId);
  const draft = schema ? draftSchemaVersion(schema) : undefined;
  const published = schema ? publishedSchemaVersion(schema) : undefined;
  const base = draft ?? published;

  const [tab, setTab] = useState<TabKey>("fields");
  const [fields, setFields] = useState<SchemaField[]>(base?.fields ?? []);
  const [note, setNote] = useState(draft?.note ?? "");

  useEffect(() => {
    if (!base) return;
    setFields(base.fields);
    setNote(draft?.note ?? "");
  }, [base?.id]);

  const [onInvalid, setOnInvalid] = useState<OutputSchema["policy"]["onInvalid"]>(schema?.policy.onInvalid ?? "reject");
  const [maxRetry, setMaxRetry] = useState(schema?.policy.maxRetry ?? 0);

  const json = useMemo(() => schemaJson(fields), [fields]);

  const dirty = !!base && JSON.stringify(fields) !== JSON.stringify(base.fields);

  if (!schema || !base) {
    return (
      <EmptyState
        title="Schema 不存在"
        hint="该 Schema 可能不在当前演示数据中"
        action={<Link href="/proto/admin/tools/schemas" className="p-btn p-btn-primary p-btn-md">返回 Schema 列表</Link>}
      />
    );
  }

  const save = (publish = false) => {
    const invalid = fields.filter((f) => !f.name.trim());
    if (invalid.length) {
      toast("字段名不能为空", "danger");
      return;
    }
    const names = fields.map((f) => f.name.trim());
    const dup = names.find((n, i) => names.indexOf(n) !== i);
    if (dup) {
      toast(`字段名重复：${dup}`, "danger");
      return;
    }
    saveSchemaDraft(schema.id, fields, note);
    if (publish) publishSchema(schema.id);
  };

  const update = (i: number, patch: Partial<SchemaField>) =>
    setFields(fields.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));

  return (
    <div>
      <div className="p-crumb">
        <Link href="/proto/admin/tools">工具管理</Link>
        <span>/</span>
        <Link href="/proto/admin/tools/schemas">结构化输出</Link>
        <span>/</span>
        <span>{schema.id}</span>
      </div>

      <div className="p-page-head">
        <div>
          <h1>{schema.name}</h1>
          <p>
            <span className="p-mono">{schema.id}</span> · {schema.purpose} · {schema.desc}
          </p>
        </div>
        <div className="p-page-actions">
          <Badge tone={schema.direction === "tool-output" ? "info" : "brand"}>{DIRECTION_LABEL[schema.direction]}</Badge>
          <Badge tone={draft ? "warn" : "ok"}>
            线上 {published?.version ?? "—"}
            {draft ? ` · 草稿 ${draft.version}` : ""}
          </Badge>
          <Button
            icon={<FlaskConical size={13} />}
            onClick={() => {
              emitEvalPreset({ schemaVersion: `${schema.id}@${published?.version ?? base.version}`, datasetId: "DS-01" });
              router.push("/proto/admin/eval/experiments");
            }}
          >
            用评测集验证
          </Button>
        </div>
      </div>

      <div className="p-warn-banner">
        <ShieldAlert size={14} />
        <span>
          <b>Schema 校验通过 ≠ 业务合法。</b>此处只约束字段、类型与取值范围；设备是否存在且在线的判断、操作人权限、
          空域与前置条件，仍由服务端业务校验决定。
        </span>
      </div>

      <Tabs<TabKey>
        value={tab}
        onChange={setTab}
        items={[
          { key: "fields", label: "字段定义", count: fields.length },
          { key: "mock", label: "校验样例", count: schema.mockCases.length },
          { key: "versions", label: "版本与引用", count: schema.versions.length },
        ]}
      />

      <div className="p-admin-split">
        <div className="p-stack">
          {tab === "fields" && (
            <>
              <div className="p-card">
                <div className="p-card-head">
                  <div>
                    <h3>字段定义</h3>
                    <p>编辑的是 {draft ? `草稿 ${draft.version}` : `线上 ${base.version}（保存会创建新草稿）`}</p>
                  </div>
                  <span className="p-muted p-small">{fields.filter((f) => f.required).length} 个必填</span>
                </div>
                <div className="p-schema-editor">
                  <table className="p-table">
                    <thead>
                      <tr>
                        <th style={{ width: 160 }}>字段名</th>
                        <th style={{ width: 120 }}>类型</th>
                        <th style={{ width: 70 }}>必填</th>
                        <th>说明</th>
                        <th style={{ width: 180 }}>约束 / 枚举</th>
                        <th style={{ width: 44 }} />
                      </tr>
                    </thead>
                    <tbody>
                      {fields.map((f, i) => (
                        <tr key={i}>
                          <td>
                            <TextInput
                              className="p-mono"
                              value={f.name}
                              onChange={(e) => update(i, { name: e.target.value })}
                            />
                          </td>
                          <td>
                            <Select value={f.type} onChange={(e) => update(i, { type: e.target.value as SchemaFieldType })}>
                              {FIELD_TYPES.map((t) => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </Select>
                          </td>
                          <td>
                            <input
                              type="checkbox"
                              checked={f.required}
                              onChange={(e) => update(i, { required: e.target.checked })}
                              aria-label={`${f.name} 必填`}
                            />
                          </td>
                          <td>
                            <TextInput value={f.desc} onChange={(e) => update(i, { desc: e.target.value })} placeholder="业务含义" />
                          </td>
                          <td>
                            <TextInput
                              value={f.type === "enum" ? (f.enumValues ?? []).join(" / ") : f.constraints ?? ""}
                              onChange={(e) =>
                                update(
                                  i,
                                  f.type === "enum"
                                    ? { enumValues: e.target.value.split("/").map((x) => x.trim()).filter(Boolean) }
                                    : { constraints: e.target.value },
                                )
                              }
                              placeholder={f.type === "enum" ? "值 A / 值 B" : "如 20–120"}
                            />
                          </td>
                          <td>
                            <button
                              className="p-icon-btn"
                              onClick={() => setFields(fields.filter((_, idx) => idx !== i))}
                              aria-label="删除字段"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-card-pad" style={{ borderTop: "1px solid var(--p-line)" }}>
                  <div className="p-row-between" style={{ marginBottom: 10 }}>
                    <Button
                      icon={<Plus size={13} />}
                      onClick={() => setFields([...fields, { name: "", type: "string", required: false, desc: "" }])}
                    >
                      添加字段
                    </Button>
                    <TextInput
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="版本备注：本次改了什么、为什么"
                      style={{ width: 320 }}
                    />
                  </div>
                  <div className="p-inline-actions" style={{ margin: 0 }}>
                    <Button variant="primary" icon={<Save size={13} />} onClick={() => save(false)}>
                      保存草稿{dirty ? "（有未保存修改）" : ""}
                    </Button>
                    <Button onClick={() => save(true)}>保存并发布</Button>
                    <span className="p-muted p-small">发布后引用该 Schema 的工具与 Agent 按新版本校验</span>
                  </div>
                </div>
              </div>

              <div className="p-card p-card-pad">
                <div className="p-row-between" style={{ marginBottom: 6 }}>
                  <h3 className="p-side-h">JSON Schema 预览</h3>
                  <span className="p-muted p-small">由字段定义生成 · 只读</span>
                </div>
                <pre className="p-code">{json}</pre>
                <p className="p-muted p-small" style={{ marginBottom: 0 }}>
                  `additionalProperties: false` 保证不返回未声明字段；枚举与约束用于拦截明显非法值。
                </p>
              </div>
            </>
          )}

          {tab === "mock" && (
            <>
              <div className="p-note">
                样例用于说明「结构通过、业务拒绝」的分界：Schema 只能拦下格式与范围问题，业务规则由服务端校验。
              </div>
              {schema.mockCases.map((m) => (
                <div key={m.name} className="p-card p-card-pad">
                  <div className="p-row-between" style={{ marginBottom: 8 }}>
                    <h3 className="p-side-h">{m.name}</h3>
                    <div className="p-row-ops">
                      <Badge tone={m.schemaPass ? "ok" : "danger"}>Schema {m.schemaPass ? "通过" : "不通过"}</Badge>
                      <Badge tone={m.businessPass ? "ok" : m.schemaPass ? "danger" : "muted"}>
                        业务 {m.businessPass ? "通过" : "拒绝"}
                      </Badge>
                    </div>
                  </div>
                  <pre className="p-code">{m.sample}</pre>
                  {m.schemaErrors.length > 0 && (
                    <ul className="p-issue-list" style={{ marginTop: 8 }}>
                      {m.schemaErrors.map((e) => (
                        <li key={e} className="is-error">{e}</li>
                      ))}
                    </ul>
                  )}
                  <div className={m.businessPass ? "p-note" : "p-warn-banner"} style={{ marginTop: 8 }}>
                    {m.businessNote}
                  </div>
                </div>
              ))}
            </>
          )}

          {tab === "versions" && (
            <>
              <div className="p-card">
                <div className="p-card-head">
                  <div>
                    <h3>版本历史</h3>
                    <p>发布后旧版本转归档；回滚会重新指向历史版本</p>
                  </div>
                  <span className="p-muted p-small">{schema.versions.length} 个版本</span>
                </div>
                <div className="p-version-list">
                  {schema.versions.map((v) => (
                    <div key={v.id} className="p-version-row">
                      <div className="p-version-main">
                        <b className="p-mono">{v.version}</b>
                        <Badge tone={v.state === "published" ? "ok" : v.state === "draft" ? "warn" : "muted"}>
                          {v.state === "published" ? "线上" : v.state === "draft" ? "草稿" : "归档"}
                        </Badge>
                        <span className="p-muted p-small">{v.note}</span>
                      </div>
                      <div className="p-version-meta">
                        <span className="p-mono p-small">{v.at} · {v.author}</span>
                        <span className="p-mono p-small">{v.fields.length} 字段</span>
                        <div className="p-row-ops">
                          {v.state === "draft" && (
                            <Button size="sm" onClick={() => publishSchema(schema.id)}>发布此草稿</Button>
                          )}
                          {v.state !== "published" && (
                            <Button size="sm" onClick={() => rollbackSchema(schema.id, v.version)}>回滚到此版本</Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-card p-card-pad">
                <h3 className="p-side-h">影响面</h3>
                <p className="p-muted p-small">改动 Schema 会影响以下对象的校验与回归口径：</p>
                <div className="p-lines">
                  {schema.impacts.tools.map((id) => (
                    <Link key={id} href={`/proto/admin/tools/${id}`} className="p-line p-line-link">
                      <div>
                        <b>{state.tools.find((t) => t.id === id)?.name ?? id}</b>
                        <span className="p-mono">{id} · 工具</span>
                      </div>
                    </Link>
                  ))}
                  {schema.impacts.prompts.map((id) => (
                    <Link key={id} href={`/proto/admin/agents/prompts/${id}`} className="p-line p-line-link">
                      <div>
                        <b>{state.ai.prompts.find((p) => p.id === id)?.name ?? id}</b>
                        <span className="p-mono">{id} · Prompt</span>
                      </div>
                    </Link>
                  ))}
                  {schema.impacts.workflows.map((id) => (
                    <Link key={id} href="/proto/admin/workflows" className="p-line p-line-link">
                      <div>
                        <b>{state.workflows.find((w) => w.id === id)?.name ?? id}</b>
                        <span className="p-mono">{id} · 工作流</span>
                      </div>
                    </Link>
                  ))}
                  {schema.impacts.evalCases.length > 0 && (
                    <Link href="/proto/admin/eval/datasets" className="p-line p-line-link">
                      <div>
                        <b>评测用例 {schema.impacts.evalCases.join(" · ")}</b>
                        <span>变更后必须重跑对应数据集</span>
                      </div>
                    </Link>
                  )}
                </div>
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
                { k: "Schema ID", v: <span className="p-mono">{schema.id}</span> },
                { k: "方向", v: DIRECTION_LABEL[schema.direction] },
                { k: "用途", v: schema.purpose },
                { k: "线上版本", v: <span className="p-mono">{published?.version ?? "—"}</span> },
                { k: "字段数", v: `${published?.fields.length ?? 0}` },
              ]}
            />
          </div>

          <div className="p-card p-card-pad">
            <h3 className="p-side-h">失效策略</h3>
            <p className="p-muted p-small">输出不满足 Schema 时的处理方式</p>
            <div className="p-form">
              <Field label="处理方式">
                <Select
                  value={onInvalid}
                  onChange={(e) => setOnInvalid(e.target.value as OutputSchema["policy"]["onInvalid"])}
                >
                  <option value="reject">拒绝并返回错误</option>
                  <option value="repair_once">自动修复一次</option>
                  <option value="regenerate">重新生成</option>
                </Select>
              </Field>
              <Field label="最大重试次数" hint="0 表示不重试，直接拒绝">
                <TextInput type="number" min={0} max={3} value={maxRetry} onChange={(e) => setMaxRetry(Number(e.target.value))} />
              </Field>
              <div className="p-note">
                安全相关输出（下发、取消、报告结论）建议使用「拒绝」；修复与重生成都可能引入新偏差。
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setSchemaPolicy(schema.id, { onInvalid, maxRetry })}
              >
                保存策略
              </Button>
            </div>
          </div>

          <div className="p-card p-card-pad">
            <h3 className="p-side-h">边界说明</h3>
            <ul className="p-issue-list">
              <li className="is-ok-static">约束字段、类型、枚举与取值范围</li>
              <li className="is-ok-static">拦截格式错误的输出，避免污染下游</li>
              <li className="is-warn">不校验设备是否在线、是否有权、空域是否可用</li>
              <li className="is-warn">不替代业务平台的最终状态判定</li>
            </ul>
          </div>
        </aside>
      </div>

      <EvalMockNote>校验样例与评测均为模拟数据，未调用真实模型。</EvalMockNote>
    </div>
  );
}
