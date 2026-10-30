"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Play, ShieldAlert, Terminal, Wrench } from "lucide-react";
import { Badge, Button, Field, KeyValue, LoadingState, Select, Switch, Tabs, TextInput } from "@/components/proto/ui";
import { useProto } from "@/lib/proto/store";
import { RISK_LABEL } from "@/lib/proto/data";

type TabKey = "schema" | "output" | "permission" | "debug";

const MOCK_OUT: Record<string, string> = {
  "device.get_status": '{ "device_id": "UAV-02", "status": "online", "battery": 64, "payload": "双光吊舱", "task_id": null }',
  "device.list_available": '{ "count": 2, "devices": [{ "id": "UAV-02", "battery": 64 }, { "id": "UAV-04", "battery": 95 }] }',
  "route.generate": '{ "route_id": "R-007", "version": "v1", "waypoints": 12, "alt_range": "55-65m" }',
  "route.validate": '{ "passed": true, "warnings": ["东侧水域 10:00-11:00 有游船作业"], "errors": [] }',
  "task.create": '{ "task_id": "T-20261029-04", "status": "queued", "note": "模拟回执，未下发真实设备" }',
  "task.cancel": '{ "task_id": "T-20261029-04", "status": "cancelling", "note": "模拟回执，等待人工确认" }',
  "event.report": '{ "event_id": "E-2026-0113", "status": "pending", "note": "已写入模拟事件池" }',
  "report.generate": '{ "report_id": "RP-20261029-04", "status": "generating", "eta_seconds": 38 }',
  "kb.search": '{ "hits": 2, "top": [{ "doc": "KB-03", "section": "§3.1 机臂与散热", "score": 0.91 }] }',
  "event.query": '{ "events": 3, "last": { "type": "电池高温告警", "at": "2026-10-28 17:05", "handled": true } }',
  "workflow.query": '{ "error": { "code": 47002, "message": "MCP 连接不可用" } }',
};

export default function ToolDetailPage() {
  const params = useParams<{ id: string }>();
  const toolId = decodeURIComponent(params.id);
  const { state, toggleTool, saveTool, toast } = useProto();
  const tool = state.tools.find((t) => t.id === toolId);
  const [tab, setTab] = useState<TabKey>("schema");
  const [timeout, setTimeoutMs] = useState(tool?.timeout ?? 3000);
  const [needConfirm, setNeedConfirm] = useState(tool?.needConfirm ?? false);
  const [risk, setRisk] = useState(tool?.risk ?? "low");
  const [args, setArgs] = useState<Record<string, string>>({});
  const [running, setRunning] = useState(false);
  const [out, setOut] = useState<string | null>(null);
  const [testOn, setTestOn] = useState(false);

  const missing = useMemo(
    () => (tool?.params ?? []).filter((p) => p.required && !String(args[p.name] ?? "").trim()).map((p) => p.name),
    [tool, args],
  );

  if (!tool) {
    return (
      <div className="p-card p-card-pad">
        <b>工具不存在</b>
        <Link href="/proto/admin/tools" className="p-btn p-btn-primary p-btn-md">返回工具目录</Link>
      </div>
    );
  }

  const run = () => {
    if (missing.length) {
      toast(`请填写必填参数：${missing.join("、")}`, "danger");
      return;
    }
    if (testOn) {
      toast("调试仅运行模拟回执，不会向真实设备发送任何命令", "info");
      return;
    }
    setRunning(true);
    setOut(null);
    setTimeout(() => {
      setRunning(false);
      setOut(MOCK_OUT[tool.id] ?? '{ "ok": true, "note": "mock" }');
    }, 720);
  };

  return (
    <div>
      <div className="p-crumb">
        <Link href="/proto/admin/tools">工具管理</Link>
        <span>/</span>
        <span>{tool.id}</span>
      </div>

      <div className="p-page-head">
        <div>
          <h1>{tool.name}</h1>
          <p><span className="p-mono">{tool.id}</span> · {tool.group} · {tool.method === "read" ? "只读" : "写入"}</p>
        </div>
        <div className="p-page-actions">
          <Badge tone={tool.source === "mcp" ? "brand" : "info"}>{tool.source === "mcp" ? "MCP" : "内部 API"}</Badge>
          <Badge tone={tool.risk === "high" ? "danger" : tool.risk === "mid" ? "warn" : "muted"}>{RISK_LABEL[tool.risk]}风险</Badge>
          <Badge tone={tool.status === "enabled" ? "ok" : "muted"}>{tool.status === "enabled" ? "已启用" : "已停用"}</Badge>
          <Switch on={tool.status === "enabled"} onChange={() => toggleTool(tool.id)} label="启用" />
        </div>
      </div>

      <Tabs<TabKey>
        value={tab}
        onChange={setTab}
        items={[
          { key: "schema", label: "参数 Schema" },
          { key: "output", label: "输出 Schema" },
          { key: "permission", label: "权限与风险" },
          { key: "debug", label: "模拟调试" },
        ]}
      />

      <div className="p-admin-split">
        <div className="p-stack">
          {tab === "schema" && (
            <div className="p-card">
              <div className="p-card-head">
                <div>
                  <h3>入参 Schema</h3>
                  <p>{tool.desc}</p>
                </div>
                <span className="p-muted p-small">{tool.params.length} 个参数</span>
              </div>
              <table className="p-table">
                <thead>
                  <tr>
                    <th>参数</th>
                    <th>类型</th>
                    <th>必填</th>
                    <th>说明</th>
                  </tr>
                </thead>
                <tbody>
                  {tool.params.map((p) => (
                    <tr key={p.name}>
                      <td className="p-mono">{p.name}</td>
                      <td>{p.type}{p.enumValues ? ` · ${p.enumValues.join(" / ")}` : ""}</td>
                      <td>{p.required ? <Badge tone="warn">必填</Badge> : "—"}</td>
                      <td className="p-muted">{p.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="p-card-pad p-tight">
                <h3 className="p-side-h">出参</h3>
                <pre className="p-code">{tool.output}</pre>
                <h3 className="p-side-h">错误码</h3>
                <ul className="p-error-codes">
                  {tool.errors.map((e) => (
                    <li key={e}><Terminal size={12} /> {e}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {tab === "output" && (
            <>
              {state.ai.schemas.filter((s) => s.impacts.tools.includes(tool.id)).length === 0 ? (
                <div className="p-card p-card-pad">
                  <h3 className="p-side-h">未绑定输出 Schema</h3>
                  <p className="p-muted p-small" style={{ marginBottom: 10 }}>
                    {tool.output}
                  </p>
                  <p className="p-muted p-small" style={{ margin: 0 }}>
                    该工具目前只有文本形态的出参说明。需要结构化消费时，在结构化输出管理中新建 Schema 并登记引用。
                  </p>
                  <Link href="/proto/admin/tools/schemas" className="p-btn p-btn-secondary p-btn-md" style={{ marginTop: 12 }}>
                    去结构化输出
                  </Link>
                </div>
              ) : (
                state.ai.schemas
                  .filter((s) => s.impacts.tools.includes(tool.id))
                  .map((s) => {
                    const pub = s.versions.find((v) => v.state === "published") ?? s.versions[0];
                    const draft = s.versions.find((v) => v.state === "draft");
                    return (
                      <div key={s.id} className="p-card p-card-pad">
                        <div className="p-row-between" style={{ marginBottom: 8 }}>
                          <h3 className="p-side-h">{s.name}</h3>
                          <div className="p-row-ops">
                            <Badge tone={s.direction === "tool-output" ? "info" : "brand"}>
                              {s.direction === "tool-output" ? "工具输出" : "Agent 输出"}
                            </Badge>
                            <Badge tone={draft ? "warn" : "ok"}>
                              线上 {pub?.version ?? "—"}
                              {draft ? ` · 草稿 ${draft.version}` : ""}
                            </Badge>
                          </div>
                        </div>
                        <p className="p-muted p-small">{s.desc}</p>
                        <table className="p-table">
                          <thead>
                            <tr>
                              <th>字段</th>
                              <th>类型</th>
                              <th>必填</th>
                              <th>约束</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(pub?.fields ?? []).map((f) => (
                              <tr key={f.name}>
                                <td className="p-mono">{f.name}</td>
                                <td>{f.type}{f.enumValues ? ` · ${f.enumValues.slice(0, 4).join(" / ")}${f.enumValues.length > 4 ? " …" : ""}` : ""}</td>
                                <td>{f.required ? <Badge tone="warn">必填</Badge> : "—"}</td>
                                <td className="p-muted">{f.constraints ?? "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="p-inline-actions" style={{ marginTop: 12 }}>
                          <Link href={`/proto/admin/tools/schemas/${s.id}`} className="p-btn p-btn-secondary p-btn-sm">
                            编辑 Schema
                          </Link>
                          <span className="p-muted p-small">
                            失效策略：{s.policy.onInvalid === "reject" ? "拒绝" : s.policy.onInvalid === "repair_once" ? "修复一次" : "重新生成"}
                          </span>
                        </div>
                      </div>
                    );
                  })
              )}
              <div className="p-warn-banner">
                <ShieldAlert size={14} />
                <span>
                  <b>Schema 通过不代表业务合法。</b>工具回执结构正确后，仍要由服务端校验设备是否存在且在线、操作人权限、任务前置条件与空域状态。
                </span>
              </div>
              <div className="p-card p-card-pad">
                <h3 className="p-side-h">出参说明</h3>
                <pre className="p-code">{tool.output}</pre>
                <ul className="p-error-codes">
                  {tool.errors.map((e) => (
                    <li key={e}><Terminal size={12} /> {e}</li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {tab === "permission" && (
            <div className="p-card p-card-pad">
              <h3 className="p-side-h">权限与风险</h3>
              <div className="p-form">
                <Field label="风险等级" hint="高风险工具默认要求人工确认">
                  <Select value={risk} onChange={(e) => setRisk(e.target.value as typeof risk)}>
                    <option value="low">低风险 · 只读查询</option>
                    <option value="mid">中风险 · 生成类</option>
                    <option value="high">高风险 · 下发或取消</option>
                  </Select>
                </Field>
                <div className="p-switch-row">
                  <div>
                    <b>调用前人工确认</b>
                    <span>开启后，Agent 必须得到用户显式确认才能调用</span>
                  </div>
                  <Switch on={needConfirm} onChange={setNeedConfirm} />
                </div>
                <Field label="超时（毫秒）" hint="超过阈值将中断调用并返回 42003">
                  <TextInput type="number" value={timeout} onChange={(e) => setTimeoutMs(Number(e.target.value))} />
                </Field>
                <div className="p-note">
                  <ShieldAlert size={12} /> 该工具在原型中只返回模拟回执；不接入真实设备网关。
                </div>
                <div className="p-inline-actions">
                  <Button
                    variant="primary"
                    onClick={() => {
                      saveTool({ ...tool, risk, needConfirm, timeout });
                      toast("工具配置已保存", "ok");
                    }}
                  >
                    保存配置
                  </Button>
                </div>
              </div>
            </div>
          )}

          {tab === "debug" && (
            <>
              <div className="p-card p-card-pad">
                <div className="p-row-between">
                  <h3 className="p-side-h"><Wrench size={12} /> 调试参数</h3>
                  <Badge tone="info">模拟环境</Badge>
                </div>
                <div className="p-warn-banner">
                  <ShieldAlert size={14} />
                  <span>
                    调试入口只生成模拟回执，<b>不会向真实无人机或真实业务系统下发任何命令</b>。
                  </span>
                </div>
                <div className="p-form">
                  {tool.params.map((p) => (
                    <Field
                      key={p.name}
                      label={`${p.name}${p.required ? " *" : ""}`}
                      hint={p.desc}
                      error={p.required && args[p.name] === "" ? "必填" : undefined}
                    >
                      {p.type === "enum" ? (
                        <Select value={args[p.name] ?? ""} onChange={(e) => setArgs({ ...args, [p.name]: e.target.value })}>
                          <option value="">请选择</option>
                          {p.enumValues?.map((v) => (
                            <option key={v} value={v}>{v}</option>
                          ))}
                        </Select>
                      ) : p.type === "boolean" ? (
                        <Select value={args[p.name] ?? ""} onChange={(e) => setArgs({ ...args, [p.name]: e.target.value })}>
                          <option value="">请选择</option>
                          <option value="true">true</option>
                          <option value="false">false</option>
                        </Select>
                      ) : (
                        <TextInput
                          type={p.type === "number" ? "number" : "text"}
                          placeholder={p.type === "number" ? "数字" : "文本"}
                          value={args[p.name] ?? ""}
                          onChange={(e) => setArgs({ ...args, [p.name]: e.target.value })}
                        />
                      )}
                    </Field>
                  ))}
                  <div className="p-switch-row">
                    <div>
                      <b>防护开关</b>
                      <span>勾选后调试只做参数校验，不生成任何回执</span>
                    </div>
                    <Switch on={testOn} onChange={setTestOn} />
                  </div>
                  <div className="p-inline-actions">
                    <Button variant="primary" icon={<Play size={13} />} disabled={running} onClick={run}>
                      {running ? "运行中…" : "运行调试"}
                    </Button>
                    <Button
                      onClick={() => {
                        setArgs({});
                        setOut(null);
                      }}
                    >
                      清空
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-card">
                <div className="p-card-head">
                  <h3>返回结果</h3>
                  <span className="p-muted p-small">模拟 · {tool.latency} ms 平均</span>
                </div>
                <div className="p-card-pad" style={{ paddingTop: 0 }}>
                  {running ? (
                    <LoadingState text="调用模拟工具…" />
                  ) : out ? (
                    <pre className="p-code is-result">{out}</pre>
                  ) : (
                    <p className="p-muted p-small" style={{ margin: 0 }}>填写参数后点击「运行调试」查看模拟回执。</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <aside className="p-stack">
          <div className="p-card p-card-pad">
            <h3 className="p-side-h">工具信息</h3>
            <KeyValue
              cols={1}
              items={[
                { k: "工具 ID", v: <span className="p-mono">{tool.id}</span> },
                { k: "分组", v: tool.group },
                { k: "类型", v: tool.method === "read" ? "只读" : "写入" },
                { k: "累计调用", v: tool.calls.toLocaleString() },
                { k: "平均耗时", v: `${tool.latency} ms` },
              ]}
            />
          </div>
          <div className="p-card p-card-pad">
            <h3 className="p-side-h">调用来源</h3>
            <KeyValue
              cols={1}
              items={[
                { k: "适配器", v: tool.source === "mcp" ? "MCP 适配器" : "内部 API 适配器" },
                { k: "所需 scope", v: <span className="p-mono">{tool.scope}</span> },
                ...(tool.source === "mcp"
                  ? [
                      { k: "MCP Server", v: <span className="p-mono">{tool.mcpServerId}</span> },
                      { k: "MCP 工具名", v: <span className="p-mono">{tool.mcpTool}</span> },
                    ]
                  : []),
                { k: "超时", v: `${tool.timeout} ms` },
              ]}
            />
            {tool.source === "mcp" ? (
              <>
                <p className="p-muted p-small">
                  经 MCP Server 转发，但仍沿用同一套权限、超时、错误码与审计记录。
                </p>
                <Link href="/proto/admin/tools/mcp" className="p-btn p-btn-ghost p-btn-sm">
                  查看 MCP 连接
                </Link>
              </>
            ) : (
              <p className="p-muted p-small" style={{ marginBottom: 0 }}>
                内部业务 API 直连：写操作不经 MCP 暴露，避免外部 Server 越过业务授权。
              </p>
            )}
          </div>
          <div className="p-card p-card-pad">
            <h3 className="p-side-h">调试约束</h3>
            <ul className="p-issue-list">
              <li className="is-ok-static">参数按 Schema 校验</li>
              <li className="is-ok-static">返回固定模拟回执</li>
              <li className="is-warn">禁止连接真实设备网关</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
