"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Badge, DataTable, Select, Stats, type Column } from "@/components/proto/ui";
import { useProto } from "@/lib/proto/store";
import type { Trace } from "@/lib/proto/data";

export default function TracesPage() {
  const { state } = useProto();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");

  const rows = useMemo(
    () =>
      state.traces.filter(
        (t) =>
          (status === "all" || t.status === status) &&
          (!q || t.id.toLowerCase().includes(q.toLowerCase()) || (t.taskId ?? "").toLowerCase().includes(q.toLowerCase())),
      ),
    [state.traces, q, status],
  );

  const columns: Column<Trace>[] = [
    { key: "id", title: "Trace", width: "190px", render: (t) => <b className="p-mono">{t.id}</b> },
    {
      key: "task",
      title: "关联任务",
      render: (t) =>
        t.taskId ? (
          <div>
            <b>{state.tasks.find((x) => x.id === t.taskId)?.name ?? t.taskId}</b>
            <span className="p-cell-sub p-mono">{t.taskId}</span>
          </div>
        ) : (
          <span className="p-muted">无</span>
        ),
    },
    { key: "agent", title: "Agent", width: "210px", render: (t) => <span className="p-mono">{t.agentId}</span> },
    { key: "steps", title: "步骤", width: "70px", render: (t) => t.steps.length },
    {
      key: "status",
      title: "状态",
      width: "100px",
      render: (t) => (
        <Badge tone={t.status === "ok" ? "ok" : t.status === "running" ? "active" : "danger"}>
          {t.status === "ok" ? "成功" : t.status === "running" ? "运行中" : "失败"}
        </Badge>
      ),
    },
    {
      key: "ms",
      title: "总耗时",
      width: "100px",
      render: (t) => <span className="p-mono">{t.steps.reduce((s, x) => s + (x.ms ?? 0), 0)} ms</span>,
    },
    {
      key: "start",
      title: "开始时间",
      render: (t) => <span className="p-mono">{t.steps[0]?.startedAt ?? "—"}</span>,
    },
    {
      key: "ops",
      title: "",
      width: "70px",
      render: (t) => <button className="p-btn p-btn-text" onClick={() => router.push(`/proto/admin/traces/${t.id}`)}>查看</button>,
    },
  ];

  const failed = state.traces.filter((t) => t.status === "error").length;
  const totalSteps = state.traces.reduce((s, t) => s + t.steps.length, 0);

  return (
    <div>
      <div className="p-page-head">
        <div>
          <h1>运行追踪</h1>
          <p>每次 Agent 运行的完整链路：消息、意图、查询、工具、校验、确认与结果</p>
        </div>
      </div>

      <Stats
        items={[
          { label: "Trace 总数", value: state.traces.length },
          { label: "步骤总数", value: totalSteps },
          { label: "失败 Trace", value: failed, tone: failed ? "danger" : "ok" },
          {
            label: "平均耗时",
            value: `${Math.round(
              state.traces.reduce((s, t) => s + t.steps.reduce((a, x) => a + (x.ms ?? 0), 0), 0) / Math.max(1, state.traces.length)
            )} ms`,
          },
        ]}
      />

      <div className="p-toolbar">
        <div className="p-toolbar-search">
          <Search size={13} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索 Trace 编号或任务编号" />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: 130 }}>
          <option value="all">全部状态</option>
          <option value="ok">成功</option>
          <option value="running">运行中</option>
          <option value="error">失败</option>
        </Select>
        <span className="p-toolbar-count">{rows.length} 条</span>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(t) => t.id}
        onRowClick={(t) => router.push(`/proto/admin/traces/${t.id}`)}
        empty="没有符合条件的 Trace"
      />

      <p className="p-muted p-footnote">Trace 内容为模拟运行记录；失败步骤会标注错误码与上游信息。</p>
    </div>
  );
}
