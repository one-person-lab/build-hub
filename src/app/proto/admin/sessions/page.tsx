"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Badge, DataTable, Select, Tabs, type Column } from "@/components/proto/ui";
import { useProto } from "@/lib/proto/store";
import { TASK_STATUS_LABEL, TASK_STATUS_TONE, deviceById, type Session, type Task } from "@/lib/proto/data";

type TabKey = "sessions" | "tasks";

export default function AdminSessionsPage() {
  const { state } = useProto();
  const [tab, setTab] = useState<TabKey>("sessions");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");

  const sessions = useMemo(
    () => state.sessions.filter((s) => !q || s.title.includes(q) || s.id.toLowerCase().includes(q.toLowerCase())),
    [state.sessions, q],
  );

  const tasks = useMemo(
    () =>
      state.tasks.filter(
        (t) =>
          (status === "all" || t.status === status) &&
          (!q || t.name.includes(q) || t.id.toLowerCase().includes(q.toLowerCase())),
      ),
    [state.tasks, q, status],
  );

  const sessionColumns: Column<Session>[] = [
    {
      key: "title",
      title: "会话",
      render: (s) => (
        <div>
          <b>{s.title}</b>
          <span className="p-cell-sub">{s.id} · {s.mode}</span>
        </div>
      ),
    },
    { key: "msgs", title: "消息", width: "80px", render: (s) => `${s.msgs.length} 条` },
    {
      key: "cards",
      title: "关联任务",
      render: (s) => {
        const ids = new Set<string>();
        for (const m of s.msgs) {
          const c = m.card;
          if (!c) continue;
          if (c.kind === "taskList") c.taskIds.forEach((id) => ids.add(id));
          else if (c.kind !== "device" && c.kind !== "askArea" && c.kind !== "citations" && c.kind !== "skill" && c.kind !== "skillRun" && c.kind !== "workflow") ids.add(c.taskId);
        }
        return ids.size ? (
          <div className="p-ver-cell">
            {[...ids].slice(0, 3).map((id) => (
              <Link key={id} href={`/proto/tasks/${id}`} className="p-link p-mono p-small">{id}</Link>
            ))}
          </div>
        ) : (
          <span className="p-muted">—</span>
        );
      },
    },
    { key: "at", title: "时间", render: (s) => <span className="p-mono">{s.at}</span> },
    {
      key: "ops",
      title: "",
      width: "80px",
      render: (s) => <Link href={`/proto?session=${s.id}`} className="p-link">回放</Link>,
    },
  ];

  const taskColumns: Column<Task>[] = [
    {
      key: "name",
      title: "任务",
      render: (t) => (
        <div>
          <b>{t.name}</b>
          <span className="p-cell-sub">{t.id} · {t.operator}</span>
        </div>
      ),
    },
    { key: "device", title: "设备", render: (t) => deviceById(t.deviceId)?.name ?? "—" },
    {
      key: "status",
      title: "状态",
      width: "110px",
      render: (t) => <Badge tone={TASK_STATUS_TONE[t.status] as "warn"}>{TASK_STATUS_LABEL[t.status]}</Badge>,
    },
    { key: "progress", title: "进度", width: "90px", render: (t) => `${t.progress}%` },
    {
      key: "trace",
      title: "Trace",
      width: "170px",
      render: (t) => <Link href={`/proto/admin/traces/${t.traceId}`} className="p-link p-mono">{t.traceId}</Link>,
    },
    { key: "at", title: "创建时间", render: (t) => <span className="p-mono">{t.createdAt}</span> },
    {
      key: "ops",
      title: "",
      width: "70px",
      render: (t) => <Link href={`/proto/tasks/${t.id}`} className="p-link">详情</Link>,
    },
  ];

  return (
    <div>
      <div className="p-page-head">
        <div>
          <h1>会话与任务</h1>
          <p>统一查看 Agent 会话、关联任务与执行情况</p>
        </div>
        <div className="p-page-actions">
          <Link href="/proto/history" className="p-btn p-btn-secondary p-btn-md">前台历史记录</Link>
        </div>
      </div>

      <Tabs<TabKey>
        value={tab}
        onChange={(v) => { setTab(v); setQ(""); setStatus("all"); }}
        items={[
          { key: "sessions", label: "会话", count: state.sessions.length },
          { key: "tasks", label: "任务", count: state.tasks.length },
        ]}
      />

      <div className="p-toolbar">
        <div className="p-toolbar-search">
          <Search size={13} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={tab === "sessions" ? "搜索会话标题或编号" : "搜索任务名称或编号"}
          />
        </div>
        {tab === "tasks" && (
          <Select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: 130 }}>
            <option value="all">全部状态</option>
            <option value="pending_confirm">待确认</option>
            <option value="queued">待执行</option>
            <option value="running">执行中</option>
            <option value="done">已完成</option>
            <option value="failed">异常</option>
          </Select>
        )}
        <span className="p-toolbar-count">{tab === "sessions" ? sessions.length : tasks.length} 条</span>
      </div>

      {tab === "sessions" ? (
        <DataTable columns={sessionColumns} rows={sessions} rowKey={(s) => s.id} empty="没有符合条件的会话" />
      ) : (
        <DataTable columns={taskColumns} rows={tasks} rowKey={(t) => t.id} empty="没有符合条件的任务" />
      )}
    </div>
  );
}
