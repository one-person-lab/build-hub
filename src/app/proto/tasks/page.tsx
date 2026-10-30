"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowUpDown, Download, Plus, Search } from "lucide-react";
import { Badge, Button, DataTable, Dialog, EmptyState, Field, Select, TextInput, Tabs, type Column } from "@/components/proto/ui";
import { useProto } from "@/lib/proto/store";
import {
  DEVICES,
  TASK_STATUS_LABEL,
  TASK_STATUS_TONE,
  deviceById,
  type Task,
  type TaskStatus,
} from "@/lib/proto/data";

type Filter = "all" | TaskStatus;

export default function TasksPage() {
  const { state, createPlan, toast } = useProto();
  const router = useRouter();
  const [tab, setTab] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [range, setRange] = useState("7");
  const [sortDesc, setSortDesc] = useState(true);
  const [creating, setCreating] = useState(false);
  const [areaId, setAreaId] = useState("A-01");
  const [deviceId, setDeviceId] = useState("UAV-02");
  const [alt, setAlt] = useState(55);
  const [altError, setAltError] = useState("");

  const counts = useMemo(() => {
    const base: Record<string, number> = { all: state.tasks.length };
    for (const t of state.tasks) base[t.status] = (base[t.status] ?? 0) + 1;
    return base;
  }, [state.tasks]);

  const rows = useMemo(() => {
    const kw = q.trim().toLowerCase();
    const list = state.tasks.filter((t) => {
      if (tab !== "all" && t.status !== tab) return false;
      if (kw && !t.name.toLowerCase().includes(kw) && !t.id.toLowerCase().includes(kw) && !deviceById(t.deviceId)?.name.toLowerCase().includes(kw)) return false;
      if (range !== "all") {
        const days = Number(range);
        const d = new Date(t.createdAt.replace(/-/g, "/"));
        const diff = (Date.now() - d.getTime()) / 86400000;
        if (diff > days + 1) return false;
      }
      return true;
    });
    return list.sort((a, b) => (sortDesc ? b.createdAt.localeCompare(a.createdAt) : a.createdAt.localeCompare(b.createdAt)));
  }, [state.tasks, tab, q, range, sortDesc]);

  const columns: Column<Task>[] = [
    {
      key: "name",
      title: "任务",
      render: (t) => (
        <div>
          <b>{t.name}</b>
          <span className="p-cell-sub">{t.id} · {t.type}</span>
        </div>
      ),
    },
    { key: "device", title: "设备", render: (t) => deviceById(t.deviceId)?.name ?? "—" },
    { key: "created", title: "创建时间", render: (t) => <span className="p-mono">{t.createdAt}</span> },
    {
      key: "status",
      title: "状态",
      render: (t) => (
        <div>
          <Badge tone={TASK_STATUS_TONE[t.status] as "warn"}>{TASK_STATUS_LABEL[t.status]}</Badge>
          {t.cancelState === "requesting" && <span className="p-cell-sub">取消申请中</span>}
        </div>
      ),
    },
    {
      key: "progress",
      title: "执行进度",
      width: "150px",
      render: (t) => (
        <div className="p-table-progress">
          <div className={`p-progress${t.status === "failed" ? " is-danger" : t.status === "done" ? " is-ok" : ""}`}>
            <i style={{ width: `${t.progress}%` }} />
          </div>
          <span>{t.progress}%</span>
        </div>
      ),
    },
    {
      key: "ops",
      title: "操作",
      width: "150px",
      render: (t) => (
        <div className="p-row-ops" onClick={(e) => e.stopPropagation()}>
          <Link href={`/proto/tasks/${t.id}`} className="p-btn p-btn-text">详情</Link>
          {t.status === "pending_confirm" && <Link href={`/proto/tasks/${t.id}`} className="p-btn p-btn-text">确认</Link>}
          {(t.status === "running" || t.status === "queued") && (
            <Link href={`/proto/tasks/${t.id}`} className="p-btn p-btn-text">跟踪</Link>
          )}
          {t.status === "done" && t.reportId && (
            <Link href={`/proto/reports/${t.reportId}`} className="p-btn p-btn-text">报告</Link>
          )}
          {t.status === "failed" && (
            <Link href={`/proto/admin/traces/${t.traceId}`} className="p-btn p-btn-text">Trace</Link>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="p-page-head">
        <div>
          <h1>任务中心</h1>
          <p>从创建、校验、确认到执行与结果，所有任务在这里闭环</p>
        </div>
        <div className="p-page-actions">
          <Button icon={<Download size={13} />} onClick={() => toast("已导出当前列表（模拟 CSV）", "ok")}>
            导出
          </Button>
          <Button variant="primary" icon={<Plus size={13} />} onClick={() => setCreating(true)}>
            新建任务
          </Button>
        </div>
      </div>

      <Tabs<Filter>
        value={tab}
        onChange={setTab}
        items={[
          { key: "all", label: "全部", count: counts.all },
          { key: "pending_confirm", label: "待确认", count: counts.pending_confirm ?? 0 },
          { key: "queued", label: "待执行", count: counts.queued ?? 0 },
          { key: "running", label: "执行中", count: counts.running ?? 0 },
          { key: "done", label: "已完成", count: counts.done ?? 0 },
          { key: "failed", label: "异常", count: counts.failed ?? 0 },
        ]}
      />

      <div className="p-toolbar">
        <div className="p-toolbar-search">
          <Search size={13} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索任务名称、编号或设备" />
        </div>
        <Select value={range} onChange={(e) => setRange(e.target.value)} style={{ width: 130 }}>
          <option value="1">今天</option>
          <option value="7">近 7 天</option>
          <option value="30">近 30 天</option>
          <option value="all">全部时间</option>
        </Select>
        <Button size="sm" icon={<ArrowUpDown size={12} />} onClick={() => setSortDesc((v) => !v)}>
          {sortDesc ? "最新在前" : "最早在前"}
        </Button>
        <span className="p-toolbar-count">{rows.length} 条</span>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(t) => t.id}
        onRowClick={(t) => router.push(`/proto/tasks/${t.id}`)}
        empty="没有符合条件的任务"
        emptyHint="调整筛选条件，或新建一个任务"
      />

      <Dialog
        open={creating}
        title="新建巡检任务"
        confirmText="生成计划"
        onClose={() => setCreating(false)}
        onConfirm={() => {
          if (alt < 20 || alt > 120) {
            setAltError("高度需在 20–120 米之间");
            return;
          }
          const area = state.areas.find((a) => a.id === areaId)!;
          const t = createPlan({ area, deviceId, alt, speed: 6, lens: "双光" });
          setCreating(false);
          toast("计划已生成，请确认后下发", "ok");
          router.push(`/proto/tasks/${t.id}`);
        }}
      >
        <div className="p-form">
          <Field label="作业区域" required>
            <Select value={areaId} onChange={(e) => setAreaId(e.target.value)}>
              {state.areas.map((a) => (
                <option key={a.id} value={a.id}>{a.name} · {a.mu} 亩</option>
              ))}
            </Select>
          </Field>
          <div className="p-grid-2">
            <Field label="执行设备" required>
              <Select value={deviceId} onChange={(e) => setDeviceId(e.target.value)}>
                {DEVICES.map((d) => (
                  <option key={d.id} value={d.id} disabled={d.status === "offline"}>
                    {d.name} · {d.battery}% · {d.status === "offline" ? "离线" : d.status === "busy" ? "任务中" : "空闲"}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="高度 (m)" required error={altError} hint="范围 20–120">
              <TextInput
                type="number"
                value={alt}
                invalid={!!altError}
                onChange={(e) => {
                  setAlt(Number(e.target.value));
                  setAltError("");
                }}
              />
            </Field>
          </div>
          <div className="p-note">生成计划后需要人工确认才会下发。原型不会向真实设备发送任何指令。</div>
        </div>
      </Dialog>

      {state.tasks.length === 0 && <EmptyState title="还没有任务" hint="从地图圈选或对话开始第一个任务" />}
    </div>
  );
}
