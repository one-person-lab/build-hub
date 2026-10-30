"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpDown, CheckCircle2, Download, Search, ShieldAlert } from "lucide-react";
import {
  Badge,
  Button,
  DataTable,
  Dialog,
  Drawer,
  EmptyState,
  Field,
  KeyValue,
  Select,
  Tabs,
  Textarea,
  Timeline,
  type Column,
} from "@/components/proto/ui";
import { EvidenceThumb, MapCanvas, type Layers } from "@/components/proto/MapCanvas";
import { useProto } from "@/lib/proto/store";
import {
  EVENT_STATUS_LABEL,
  EVENT_STATUS_TONE,
  LEVEL_LABEL,
  areaById,
  type DroneEvent,
  type EventStatus,
} from "@/lib/proto/data";

type Filter = "all" | EventStatus;

const LAYERS: Layers = { devices: false, areas: true, routes: false, events: true, docks: false };
const HANDLERS = ["值班员 · 林可", "运维二组 · 周航", "园区安保 · 值班室", "河道保洁 · 吴敏", "属地城管 · 滨江中队"];

export default function EventsPage() {
  const { state, setEventStatus, toast } = useProto();
  const [tab, setTab] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [level, setLevel] = useState("all");
  const [sortDesc, setSortDesc] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [handler, setHandler] = useState("");
  const [disposal, setDisposal] = useState("");
  const [confirm, setConfirm] = useState<null | "resolve" | "false_positive">(null);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("focus");
    if (id) setOpenId(id);
  }, []);

  const counts = useMemo(() => {
    const base: Record<string, number> = { all: state.events.length };
    for (const e of state.events) base[e.status] = (base[e.status] ?? 0) + 1;
    return base;
  }, [state.events]);

  const rows = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return state.events
      .filter((e) => {
        if (tab !== "all" && e.status !== tab) return false;
        if (level !== "all" && e.level !== level) return false;
        if (kw && !e.title.includes(kw) && !e.id.toLowerCase().includes(kw) && !e.type.includes(kw)) return false;
        return true;
      })
      .sort((a, b) => (sortDesc ? b.at.localeCompare(a.at) : a.at.localeCompare(b.at)));
  }, [state.events, tab, level, q, sortDesc]);

  const event = state.events.find((e) => e.id === openId) ?? null;

  const columns: Column<DroneEvent>[] = [
    {
      key: "title",
      title: "事件",
      render: (e) => (
        <div>
          <b>{e.title}</b>
          <span className="p-cell-sub">{e.id} · {e.type}</span>
        </div>
      ),
    },
    {
      key: "level",
      title: "等级",
      width: "90px",
      render: (e) => (
        <Badge tone={e.level === "high" ? "danger" : e.level === "mid" ? "warn" : "info"}>
          {LEVEL_LABEL[e.level]}
        </Badge>
      ),
    },
    { key: "area", title: "区域", render: (e) => areaById(e.areaId)?.name ?? "—" },
    { key: "at", title: "发现时间", render: (e) => <span className="p-mono">{e.at}</span> },
    {
      key: "status",
      title: "状态",
      width: "110px",
      render: (e) => <Badge tone={EVENT_STATUS_TONE[e.status] as "warn"}>{EVENT_STATUS_LABEL[e.status]}</Badge>,
    },
    {
      key: "task",
      title: "关联任务",
      width: "130px",
      render: (e) => (
        <Link href={`/proto/tasks/${e.taskId}`} className="p-link p-mono" onClick={(ev) => ev.stopPropagation()}>
          {e.taskId}
        </Link>
      ),
    },
    {
      key: "ops",
      title: "操作",
      width: "100px",
      render: (e) => (
        <div className="p-row-ops" onClick={(ev) => ev.stopPropagation()}>
          <button className="p-btn p-btn-text" onClick={() => openEvent(e.id)}>
            {e.status === "pending" ? "处置" : "查看"}
          </button>
        </div>
      ),
    },
  ];

  const openEvent = (id: string) => {
    const e = state.events.find((x) => x.id === id);
    setHandler(e?.handler ?? "值班员 · 林可");
    setDisposal(e?.disposal ?? "");
    setOpenId(id);
  };

  const closeDrawer = () => setOpenId(null);

  return (
    <div>
      <div className="p-page-head">
        <div>
          <h1>巡检事件</h1>
          <p>识别到的异常进入事件池，经由确认、派单、处置、复核完成闭环</p>
        </div>
        <div className="p-page-actions">
          <Button icon={<Download size={13} />} onClick={() => toast("已导出事件台账（模拟 CSV）", "ok")}>
            导出台账
          </Button>
        </div>
      </div>

      <div className="p-note p-note-wide">
        <ShieldAlert size={13} />
        事件内容来自模拟巡检结果，仅用于演示处置流程，不代表真实算法检测。
      </div>

      <Tabs<Filter>
        value={tab}
        onChange={setTab}
        items={[
          { key: "all", label: "全部", count: counts.all },
          { key: "pending", label: "待确认", count: counts.pending ?? 0 },
          { key: "processing", label: "处理中", count: counts.processing ?? 0 },
          { key: "resolved", label: "已解决", count: counts.resolved ?? 0 },
          { key: "false_positive", label: "误报", count: counts.false_positive ?? 0 },
        ]}
      />

      <div className="p-toolbar">
        <div className="p-toolbar-search">
          <Search size={13} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索事件名称、编号或类型" />
        </div>
        <Select value={level} onChange={(e) => setLevel(e.target.value)} style={{ width: 120 }}>
          <option value="all">全部等级</option>
          <option value="high">高风险</option>
          <option value="mid">中风险</option>
          <option value="low">低风险</option>
        </Select>
        <Button size="sm" icon={<ArrowUpDown size={12} />} onClick={() => setSortDesc((v) => !v)}>
          {sortDesc ? "最新在前" : "最早在前"}
        </Button>
        <span className="p-toolbar-count">{rows.length} 条</span>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(e) => e.id}
        onRowClick={(e) => openEvent(e.id)}
        empty="没有符合条件的事件"
        emptyHint="调整筛选条件，或等待新的巡检结果"
      />

      {state.events.length === 0 && <EmptyState title="还没有巡检事件" hint="执行一次巡检任务后，识别结果会进入事件池" />}

      <Drawer
        open={!!event}
        title={event ? event.title : ""}
        sub={event ? `${event.id} · ${event.type} · ${areaById(event.areaId)?.name ?? ""}` : undefined}
        onClose={closeDrawer}
        width={620}
        footer={
          event && (
            <div className="p-drawer-actions">
              {event.status === "pending" && (
                <>
                  <Button onClick={() => setConfirm("false_positive")}>标记误报</Button>
                  <Button
                    variant="primary"
                    onClick={() => {
                      setEventStatus(event.id, "processing", undefined, handler);
                      toast("事件已受理，可继续填写处置结果", "ok");
                    }}
                  >
                    受理并派单
                  </Button>
                </>
              )}
              {event.status === "processing" && (
                <>
                  <Button onClick={() => setConfirm("false_positive")}>标记误报</Button>
                  <Button
                    variant="primary"
                    onClick={() => {
                      if (disposal.trim().length < 6) {
                        toast("请先填写处置说明（不少于 6 个字）", "danger");
                        return;
                      }
                      setConfirm("resolve");
                    }}
                  >
                    提交处置结果
                  </Button>
                </>
              )}
              {(event.status === "resolved" || event.status === "false_positive") && (
                <Button onClick={() => toast("已生成处置回执（模拟）", "ok")}>导出处置回执</Button>
              )}
            </div>
          )
        }
      >
        {event && (
          <div className="p-stack">
            <div className="p-row-between">
              <Badge tone={EVENT_STATUS_TONE[event.status] as "warn"}>{EVENT_STATUS_LABEL[event.status]}</Badge>
              <span className="p-muted p-mono">置信度 {Math.round(event.confidence * 100)}% · 模拟</span>
            </div>

            <EvidenceThumb variant={event.evidence} caption={`${event.id} · 巡检证据帧（模拟渲染）`} height={200} />

            <KeyValue
              cols={2}
              items={[
                { k: "风险等级", v: LEVEL_LABEL[event.level] },
                { k: "发现时间", v: event.at },
                { k: "作业区域", v: areaById(event.areaId)?.name ?? "—" },
                { k: "关联任务", v: <Link href={`/proto/tasks/${event.taskId}`} className="p-link p-mono">{event.taskId}</Link> },
                { k: "处置人", v: event.handler ?? "未指派" },
                { k: "坐标", v: <span className="p-mono">{event.pos.x}, {event.pos.y}</span> },
              ]}
            />

            <div>
              <h4 className="p-side-h">现场描述</h4>
              <p className="p-body-text">{event.note}</p>
            </div>

            <div className="p-map-inline" style={{ height: 200 }}>
              <MapCanvas
                areas={state.areas}
                routes={[]}
                devices={[]}
                events={[event]}
                layers={LAYERS}
                height={200}
                focusEventId={event.id}
                selectedAreaId={event.areaId}
                minZoom={1}
              />
            </div>

            <div>
              <h4 className="p-side-h">处置记录</h4>
              <Timeline
                compact
                items={[
                  { key: "found", label: "巡检识别并生成事件", at: event.at, note: "模拟识别结果，需人工确认", state: "done" },
                  {
                    key: "accept",
                    label: event.status === "pending" ? "等待受理" : "已受理并派单",
                    at: event.handler ? event.at : undefined,
                    note: event.handler ? `指派给 ${event.handler}` : undefined,
                    state: event.status === "pending" ? "todo" : "done",
                  },
                  {
                    key: "dispose",
                    label: event.disposal ? "处置完成" : "现场处置中",
                    note: event.disposal,
                    state:
                      event.status === "resolved"
                        ? "done"
                        : event.status === "false_positive"
                          ? "done"
                          : event.status === "processing"
                            ? "active"
                            : "todo",
                  },
                  {
                    key: "close",
                    label: event.status === "false_positive" ? "复核判定为误报" : "复核关闭",
                    state: event.status === "resolved" || event.status === "false_positive" ? "done" : "todo",
                  },
                ]}
              />
            </div>

            {event.status !== "resolved" && event.status !== "false_positive" && (
              <div className="p-card p-card-pad">
                <h4 className="p-side-h">处置填写</h4>
                <div className="p-form">
                  <Field label="处置人 / 责任组" required>
                    <Select value={handler} onChange={(e) => setHandler(e.target.value)}>
                      {HANDLERS.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="处置说明" hint="不少于 6 个字，提交后写入事件台账">
                    <Textarea
                      rows={3}
                      value={disposal}
                      onChange={(e) => setDisposal(e.target.value)}
                      placeholder="例如：已通知物业挪车，通道恢复通行"
                    />
                  </Field>
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>

      <Dialog
        open={!!confirm}
        danger={confirm === "false_positive"}
        title={confirm === "false_positive" ? "标记为误报？" : "确认处置完成？"}
        confirmText={confirm === "false_positive" ? "确认误报" : "确认完成"}
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          if (!event || !confirm) return;
          if (confirm === "false_positive") {
            setEventStatus(event.id, "false_positive", "人工复核判定为误报，事件关闭。");
            toast("事件已标记为误报", "ok");
          } else {
            setEventStatus(event.id, "resolved", disposal.trim(), handler);
            toast("处置结果已提交，事件关闭", "ok");
          }
          setConfirm(null);
        }}
      >
        {confirm === "false_positive"
          ? "误报将保留在台账中，但不计入有效事件统计。此操作可在后续复核中撤销。"
          : `将把「${disposal.trim() || "（未填写说明）"}」记为最终处置结果，并把事件状态改为已解决。`}
      </Dialog>
    </div>
  );
}
