"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Badge, Button, DataTable, Dialog, Select, Stats, Switch, type Column } from "@/components/proto/ui";
import { useProto } from "@/lib/proto/store";
import { RISK_LABEL, type ToolDef } from "@/lib/proto/data";

export default function ToolsPage() {
  const { state, toggleTool } = useProto();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [group, setGroup] = useState("all");
  const [risk, setRisk] = useState("all");
  const [confirming, setConfirming] = useState<ToolDef | null>(null);

  const groups = useMemo(() => Array.from(new Set(state.tools.map((t) => t.group))), [state.tools]);

  const rows = useMemo(
    () =>
      state.tools.filter(
        (t) =>
          (group === "all" || t.group === group) &&
          (risk === "all" || t.risk === risk) &&
          (!q || t.name.includes(q) || t.id.toLowerCase().includes(q.toLowerCase())),
      ),
    [state.tools, group, risk, q],
  );

  const columns: Column<ToolDef>[] = [
    {
      key: "name",
      title: "工具",
      render: (t) => (
        <div>
          <b>{t.name}</b>
          <span className="p-cell-sub p-mono">{t.id}</span>
        </div>
      ),
    },
    { key: "group", title: "分组", width: "90px", render: (t) => t.group },
    {
      key: "source",
      title: "来源",
      width: "150px",
      render: (t) =>
        t.source === "mcp" ? (
          <div>
            <Badge tone="brand">MCP</Badge>
            <span className="p-cell-sub p-mono">{t.mcpServerId}</span>
          </div>
        ) : (
          <Badge tone="info">内部 API</Badge>
        ),
    },
    {
      key: "method",
      title: "类型",
      width: "90px",
      render: (t) => <Badge tone={t.method === "read" ? "info" : "warn"}>{t.method === "read" ? "只读" : "写入"}</Badge>,
    },
    {
      key: "risk",
      title: "风险",
      width: "100px",
      render: (t) => (
        <Badge tone={t.risk === "high" ? "danger" : t.risk === "mid" ? "warn" : "muted"}>{RISK_LABEL[t.risk]}</Badge>
      ),
    },
    { key: "confirm", title: "人工确认", width: "100px", render: (t) => (t.needConfirm ? "需要" : "不需要") },
    { key: "calls", title: "调用量", width: "90px", render: (t) => t.calls.toLocaleString() },
    { key: "latency", title: "平均耗时", width: "100px", render: (t) => <span className="p-mono">{t.latency} ms</span> },
    {
      key: "status",
      title: "启用",
      width: "80px",
      render: (t) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Switch
            on={t.status === "enabled"}
            onChange={() => {
              if (t.risk === "high" && t.status === "enabled") setConfirming(t);
              else toggleTool(t.id);
            }}
          />
        </div>
      ),
    },
    {
      key: "ops",
      title: "",
      width: "80px",
      render: (t) => (
        <div className="p-row-ops" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" onClick={() => router.push(`/proto/admin/tools/${t.id}`)}>配置</Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="p-page-head">
        <div>
          <h1>工具管理</h1>
          <p>工具目录、参数 Schema、权限风险与模拟调试</p>
        </div>
        <div className="p-page-actions">
          <Link href="/proto/admin/tools/mcp" className="p-btn p-btn-secondary p-btn-md">MCP 管理</Link>
          <Link href="/proto/admin/tools/schemas" className="p-btn p-btn-secondary p-btn-md">结构化输出</Link>
        </div>
      </div>

      <Stats
        items={[
          { label: "工具总数", value: state.tools.length },
          { label: "已启用", value: state.tools.filter((t) => t.status === "enabled").length, tone: "ok" },
          { label: "需人工确认", value: state.tools.filter((t) => t.needConfirm).length, tone: "warn" },
          { label: "高风险", value: state.tools.filter((t) => t.risk === "high").length, tone: "danger" },
        ]}
      />

      <div className="p-toolbar">
        <div className="p-toolbar-search">
          <Search size={13} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索工具名称或 ID" />
        </div>
        <Select value={group} onChange={(e) => setGroup(e.target.value)} style={{ width: 120 }}>
          <option value="all">全部分组</option>
          {groups.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </Select>
        <Select value={risk} onChange={(e) => setRisk(e.target.value)} style={{ width: 120 }}>
          <option value="all">全部风险</option>
          <option value="low">低风险</option>
          <option value="mid">中风险</option>
          <option value="high">高风险</option>
        </Select>
        <span className="p-toolbar-count">{rows.length} 个</span>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(t) => t.id}
        onRowClick={(t) => router.push(`/proto/admin/tools/${t.id}`)}
        empty="没有符合条件的工具"
      />

      <Dialog
        open={!!confirming}
        title={`停用「${confirming?.name ?? ""}」？`}
        confirmText="确认停用"
        danger
        onClose={() => setConfirming(null)}
        onConfirm={() => {
          if (confirming) toggleTool(confirming.id);
          setConfirming(null);
        }}
      >
        高风险的写入类工具停用后，依赖它的工作流会在运行前被拦截。原型只会修改演示状态，不会影响任何真实服务。
      </Dialog>
    </div>
  );
}
