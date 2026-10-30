"use client";

import { useState } from "react";
import { KeyRound, Save, ShieldCheck, UserCog } from "lucide-react";
import { Badge, Button, DataTable, Field, Select, Switch, Tabs, TextInput, type Column } from "@/components/proto/ui";
import { useProto } from "@/lib/proto/store";
import { ROLES } from "@/lib/proto/data";

type TabKey = "roles" | "policies" | "audit";

const POLICIES = [
  { id: "p1", name: "高风险工具必须二次确认", desc: "下单、取消、急停类工具需要人工点击确认", on: true, level: "强制" },
  { id: "p2", name: "禁止在调试界面直连真实设备", desc: "调试调用只返回模拟回执", on: true, level: "强制" },
  { id: "p3", name: "敏感字段脱敏", desc: "设备密钥、访问令牌在界面统一显示为 ***", on: true, level: "强制" },
  { id: "p4", name: "会话保存上限", desc: "普通咨询保留 90 天，作业任务保留 365 天", on: true, level: "建议" },
  { id: "p5", name: "允许跨区域调度设备", desc: "关闭时设备只能在所属机巢范围内作业", on: false, level: "建议" },
];

export default function SecurityPage() {
  const { state, updateRoleTools, toast } = useProto();
  const [tab, setTab] = useState<TabKey>("roles");
  const [roleId, setRoleId] = useState(state.roles[0]?.id ?? "role-ops");
  const [draft, setDraft] = useState<Record<string, string[]>>(
    () => Object.fromEntries(state.roles.map((r) => [r.id, [...r.tools]])),
  );
  const [policies, setPolicies] = useState(POLICIES);

  const role = state.roles.find((r) => r.id === roleId)!;
  const selected = draft[roleId] ?? [];
  const dirty = JSON.stringify([...selected].sort()) !== JSON.stringify([...role.tools].sort());

  const auditColumns: Column<(typeof state.audits)[number]>[] = [
    { key: "id", title: "编号", width: "90px", render: (a) => <span className="p-mono">{a.id}</span> },
    { key: "at", title: "时间", width: "180px", render: (a) => <span className="p-mono">{a.at}</span> },
    { key: "actor", title: "操作人", width: "90px", render: (a) => a.actor },
    { key: "action", title: "操作", render: (a) => <b>{a.action}</b> },
    { key: "target", title: "对象", render: (a) => <span className="p-mono">{a.target}</span> },
    {
      key: "risk",
      title: "风险",
      width: "90px",
      render: (a) => (
        <Badge tone={a.risk === "high" ? "danger" : a.risk === "mid" ? "warn" : "muted"}>
          {a.risk === "high" ? "高" : a.risk === "mid" ? "中" : "低"}
        </Badge>
      ),
    },
  ];

  return (
    <div>
      <div className="p-page-head">
        <div>
          <h1>安全与权限</h1>
          <p>角色、工具授权、安全策略与操作审计</p>
        </div>
        <div className="p-page-actions">
          <Badge tone="ok"><ShieldCheck size={11} /> 策略生效中</Badge>
        </div>
      </div>

      <Tabs<TabKey>
        value={tab}
        onChange={setTab}
        items={[
          { key: "roles", label: "角色权限", count: state.roles.length },
          { key: "policies", label: "安全策略", count: policies.length },
          { key: "audit", label: "审计日志", count: state.audits.length },
        ]}
      />

      {tab === "roles" && (
        <div className="p-admin-split">
          <div className="p-card p-card-pad">
            <h3 className="p-side-h"><UserCog size={12} /> 工具授权矩阵</h3>
            <p className="p-muted p-small" style={{ marginTop: -4 }}>
              勾选表示该角色可调用对应工具；高风险工具即便授权也必须人工确认。
            </p>
            <div className="p-role-tabs">
              {state.roles.map((r) => (
                <button
                  key={r.id}
                  className={r.id === roleId ? "is-active" : undefined}
                  onClick={() => setRoleId(r.id)}
                >
                  {r.name}<em>{r.members} 人</em>
                </button>
              ))}
            </div>
            <table className="p-table p-matrix">
              <thead>
                <tr>
                  <th>工具</th>
                  <th>风险</th>
                  <th style={{ width: 90, textAlign: "center" }}>授权</th>
                </tr>
              </thead>
              <tbody>
                {state.tools.map((t) => {
                  const allowed = selected.includes("*") || selected.includes(t.id);
                  return (
                    <tr key={t.id}>
                      <td>
                        <div>
                          <b>{t.name}</b>
                          <span className="p-cell-sub p-mono">{t.id}</span>
                        </div>
                      </td>
                      <td>
                        <Badge tone={t.risk === "high" ? "danger" : t.risk === "mid" ? "warn" : "muted"}>
                          {t.risk === "high" ? "高" : t.risk === "mid" ? "中" : "低"}
                        </Badge>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <label className="p-checkbox-only">
                          <input
                            type="checkbox"
                            checked={allowed}
                            onChange={(e) =>
                              setDraft((d) => {
                                const cur = d[roleId] ?? [];
                                const next = e.target.checked
                                  ? [...cur.filter((x) => x !== "*"), t.id]
                                  : cur.filter((x) => x !== t.id && x !== "*");
                                return { ...d, [roleId]: next };
                              })
                            }
                          />
                        </label>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="p-inline-actions" style={{ marginTop: 12 }}>
              <Button
                variant="primary"
                icon={<Save size={13} />}
                disabled={!dirty}
                onClick={() => updateRoleTools(roleId, selected)}
              >
                保存权限
              </Button>
              <Button onClick={() => setDraft((d) => ({ ...d, [roleId]: [...role.tools] }))} disabled={!dirty}>
                撤销修改
              </Button>
            </div>
          </div>

          <aside className="p-stack">
            <div className="p-card p-card-pad">
              <h3 className="p-side-h">{role.name}</h3>
              <p className="p-muted p-small">成员 {role.members} 人 · 高风险操作{role.confirm ? "需确认" : "免确认"}</p>
              <div className="p-note">
                <KeyRound size={12} /> 权限变更会写入审计日志，下一版本生效。
              </div>
            </div>
          </aside>
        </div>
      )}

      {tab === "policies" && (
        <div className="p-stack">
          <div className="p-card p-card-pad">
            <h3 className="p-side-h">安全策略</h3>
            <div className="p-policy-list">
              {policies.map((p) => (
                <div key={p.id} className="p-policy-row">
                  <div>
                    <b>{p.name} <Badge tone={p.level === "强制" ? "danger" : "muted"}>{p.level}</Badge></b>
                    <span>{p.desc}</span>
                  </div>
                  <Switch
                    on={p.on}
                    onChange={(v) => {
                      if (p.level === "强制" && !v) {
                        toast("强制策略不可关闭（演示）", "warn");
                        return;
                      }
                      setPolicies((cur) => cur.map((x) => (x.id === p.id ? { ...x, on: v } : x)));
                      toast("策略状态已更新", "ok");
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="p-card p-card-pad">
            <h3 className="p-side-h">数据脱敏</h3>
            <div className="p-form">
              <div className="p-grid-2">
                <Field label="设备访问令牌"><TextInput defaultValue="••••••••••••" readOnly /></Field>
                <Field label="模型服务密钥"><TextInput defaultValue="••••••••••••" readOnly /></Field>
              </div>
              <p className="p-muted p-small" style={{ margin: 0 }}>
                原型中不展示任何真实密钥；此处仅为脱敏展示示例。
              </p>
            </div>
          </div>
        </div>
      )}

      {tab === "audit" && (
        <div>
          <div className="p-toolbar">
            <Select defaultValue="all" style={{ width: 140 }}>
              <option value="all">全部风险等级</option>
              <option value="high">高风险</option>
              <option value="mid">中风险</option>
              <option value="low">低风险</option>
            </Select>
            <span className="p-toolbar-count">{state.audits.length} 条</span>
          </div>
          <DataTable columns={auditColumns} rows={state.audits} rowKey={(a) => a.id} empty="没有审计记录" />
          <p className="p-muted p-footnote">审计日志为只读演示数据，真实环境应支持导出与留存策略。</p>
        </div>
      )}
    </div>
  );
}
