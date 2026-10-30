"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Cable, Plus, RefreshCw, ShieldCheck, Wifi, WifiOff } from "lucide-react";
import { Badge, Button, Dialog, Field, KeyValue, Select, StatusDot, Switch, TextInput, type Tone } from "@/components/proto/ui";
import { useProto } from "@/lib/proto/store";
import { MCP_TRANSPORT_LABEL, toolById, type McpServer, type McpTransport } from "@/lib/proto/skill-data";

const STATUS: Record<McpServer["status"], { label: string; tone: Tone }> = {
  connected: { label: "已连接", tone: "ok" },
  disconnected: { label: "已停用", tone: "muted" },
  error: { label: "连接异常", tone: "danger" },
};

const AUTH_LABEL: Record<McpServer["authKind"], string> = {
  oauth: "OAuth 2.0（模拟）",
  "api-key": "API Key（模拟）",
  none: "无鉴权",
};

export default function McpPage() {
  const proto = useProto();
  const { state } = proto;
  const servers = state.mcp.servers;
  const [selectedId, setSelectedId] = useState(servers[0]?.id ?? "");
  const [registering, setRegistering] = useState(false);
  const [name, setName] = useState("");
  const [endpoint, setEndpoint] = useState("https://mcp.example.internal/");
  const [transport, setTransport] = useState<McpTransport>("streamable-http");

  const selected = servers.find((s) => s.id === selectedId) ?? servers[0];
  const toolRows = useMemo(
    () => (selected ? selected.tools.map((t) => ({ ...t, tool: t.mappedToolId ? toolById(t.mappedToolId) : undefined })) : []),
    [selected],
  );

  return (
    <div>
      <div className="p-page-head">
        <div>
          <h1>MCP 管理</h1>
          <p>MCP 是连接协议：负责把外部能力接进 Agent，不替代业务授权、权限与安全校验</p>
        </div>
        <div className="p-page-actions">
          <Link href="/proto/admin/tools" className="p-btn p-btn-ghost p-btn-md">
            工具管理
          </Link>
          <Link href="/proto/admin/agents/skills" className="p-btn p-btn-ghost p-btn-md">
            Skill 管理
          </Link>
          <Button variant="primary" icon={<Plus size={13} />} onClick={() => setRegistering(true)}>
            登记 Server
          </Button>
        </div>
      </div>

      <div className="p-admin-split">
        <div className="p-stack">
          <div className="p-card">
            <div className="p-card-head">
              <div>
                <h3>MCP Server</h3>
                <p>连接状态、能力发现结果与工具清单；全部为模拟连接</p>
              </div>
              <Badge tone="muted">{servers.length} 个</Badge>
            </div>
            <div className="p-lines">
              {servers.map((s) => {
                const st = STATUS[s.status];
                return (
                  <button
                    key={s.id}
                    className={`p-mcp-server${s.id === selected?.id ? " is-active" : ""}`}
                    onClick={() => setSelectedId(s.id)}
                  >
                    <div className="p-mcp-server-head">
                      <StatusDot tone={st.tone} />
                      <b>{s.name}</b>
                      <Badge tone={st.tone}>{st.label}</Badge>
                    </div>
                    <span className="p-cell-sub">
                      {MCP_TRANSPORT_LABEL[s.transport]} · {s.tools.length} 个工具 · {AUTH_LABEL[s.authKind]}
                    </span>
                    <span className="p-cell-sub p-mono">{s.endpoint}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {selected && (
            <div className="p-card p-card-pad">
              <h3 className="p-side-h">连接信息</h3>
              <KeyValue
                cols={1}
                items={[
                  { k: "Server ID", v: <span className="p-mono">{selected.id}</span> },
                  { k: "Endpoint", v: <span className="p-mono p-small">{selected.endpoint}</span> },
                  { k: "传输方式", v: MCP_TRANSPORT_LABEL[selected.transport] },
                  { k: "鉴权", v: AUTH_LABEL[selected.authKind] },
                  { k: "凭据引用", v: <span className="p-mono p-small">{selected.authRef}</span> },
                  { k: "最近发现", v: selected.discoveredAt ?? "—" },
                ]}
              />
              <div className="p-note">凭据只保存为 Vault 引用，原型不存储任何真实密钥或令牌。</div>
            </div>
          )}
        </div>

        <aside className="p-stack">
          {selected ? (
            <>
              <div className="p-card p-card-pad">
                <div className="p-row-between" style={{ marginBottom: 8 }}>
                  <h3 className="p-side-h">
                    {selected.status === "error" ? <WifiOff size={12} /> : <Wifi size={12} />} 操作
                  </h3>
                  <Switch
                    on={selected.status === "connected"}
                    onChange={() => proto.toggleMcpServer(selected.id)}
                    label="启用"
                  />
                </div>
                <div className="p-inline-actions">
                  <Button size="sm" icon={<Cable size={12} />} onClick={() => proto.testMcpConnection(selected.id)}>
                    连接测试
                  </Button>
                  <Button size="sm" icon={<RefreshCw size={12} />} onClick={() => proto.discoverMcp(selected.id)}>
                    能力发现
                  </Button>
                </div>
                <p className="p-muted p-small" style={{ marginBottom: 0 }}>
                  {selected.note}
                </p>
              </div>

              <div className="p-card p-card-pad">
                <h3 className="p-side-h">
                  <ShieldCheck size={12} /> 授权范围
                </h3>
                <div className="p-chips" style={{ marginBottom: 6 }}>
                  {selected.scopes.map((s) => (
                    <span key={s} className="p-badge p-badge-muted p-mono">
                      {s}
                    </span>
                  ))}
                  {!selected.scopes.length && <span className="p-muted p-small">尚未申请任何 scope</span>}
                </div>
                <p className="p-muted p-small" style={{ marginBottom: 0 }}>
                  Scope 只决定这个 Server 能读什么，不决定 Agent 能否下发；写操作仍在业务服务侧校验权限与风险。
                </p>
              </div>

              <div className="p-card p-card-pad">
                <h3 className="p-side-h">错误与事件日志</h3>
                <div className="p-log-list">
                  {selected.logs.slice(0, 8).map((l, i) => (
                    <div key={`${l.at}-${i}`} className={`p-log is-${l.level}`}>
                      <time>{l.at}</time>
                      <span>{l.msg}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="p-card p-card-pad">
              <p className="p-muted p-small">还没有登记任何 MCP Server。</p>
            </div>
          )}
        </aside>
      </div>

      {selected && (
        <div className="p-card" style={{ marginTop: 12 }}>
          <div className="p-card-head">
            <div>
              <h3>能力发现结果 · {selected.name}</h3>
              <p>Server 暴露的工具与本地工具目录的映射关系</p>
            </div>
            <Badge tone={selected.status === "error" ? "danger" : "ok"}>
              {selected.tools.length} 个工具{selected.status === "error" ? " · 沿用上次发现结果" : ""}
            </Badge>
          </div>
          <div className="p-table-wrap">
            <table className="p-table">
              <thead>
                <tr>
                  <th>MCP 工具</th>
                  <th style={{ width: 220 }}>参数 Schema</th>
                  <th style={{ width: 180 }}>映射到本地工具</th>
                  <th style={{ width: 100 }}>风险</th>
                  <th style={{ width: 90 }}>状态</th>
                </tr>
              </thead>
              <tbody>
                {toolRows.map((t) => (
                  <tr key={t.name}>
                    <td>
                      <b className="p-mono">{t.name}</b>
                      <div className="p-cell-sub">{t.desc}</div>
                    </td>
                    <td>
                      <code className="p-code p-code-inline">{t.schema}</code>
                    </td>
                    <td>
                      {t.tool ? (
                        <Link href={`/proto/admin/tools/${t.tool.id}`} className="p-link p-mono p-small">
                          {t.tool.id}
                        </Link>
                      ) : (
                        <span className="p-muted p-small">未映射（仅登记）</span>
                      )}
                    </td>
                    <td>
                      {t.tool ? (
                        <Badge tone={t.tool.risk === "high" ? "danger" : t.tool.risk === "mid" ? "warn" : "muted"}>
                          {t.tool.risk === "high" ? "高" : t.tool.risk === "mid" ? "中" : "低"}
                        </Badge>
                      ) : (
                        <span className="p-muted">—</span>
                      )}
                    </td>
                    <td>
                      <Badge tone={selected.status === "error" ? "danger" : t.tool?.status === "enabled" ? "ok" : "muted"}>
                        {selected.status === "error" ? "不可用" : t.tool?.status === "enabled" ? "可用" : "未启用"}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {!toolRows.length && (
                  <tr>
                    <td colSpan={5} className="p-muted">
                      尚未做能力发现
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-card-pad" style={{ paddingTop: 0 }}>
            <div className="p-note">
              写操作（任务下发、取消、参数修改）不映射到任何 MCP 工具：这些动作必须经过内部业务 API，由权限系统、设备状态校验与人工确认共同把关。
            </div>
          </div>
        </div>
      )}

      <Dialog
        open={registering}
        title="登记 MCP Server"
        confirmText="登记"
        onClose={() => setRegistering(false)}
        onConfirm={() => {
          if (!name.trim()) return;
          const server = proto.registerMcpServer({ name: name.trim(), endpoint: endpoint.trim(), transport });
          setSelectedId(server.id);
          setRegistering(false);
          setName("");
        }}
      >
        <div className="p-form">
          <Field label="名称" required>
            <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="例如：report-service-mcp" />
          </Field>
          <Field label="Endpoint" hint="仅作登记，原型不会发起真实连接">
            <TextInput value={endpoint} onChange={(e) => setEndpoint(e.target.value)} />
          </Field>
          <Field label="传输方式">
            <Select value={transport} onChange={(e) => setTransport(e.target.value as McpTransport)}>
              <option value="streamable-http">Streamable HTTP</option>
              <option value="sse">SSE</option>
              <option value="stdio">stdio</option>
            </Select>
          </Field>
          <div className="p-note">登记后状态为「已停用」，需要先做连接测试与能力发现，工具才会进入工具管理。</div>
        </div>
      </Dialog>
    </div>
  );
}
