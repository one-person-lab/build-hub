"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight, CircleAlert, Cpu, Database, Radio, ShieldCheck, Sparkles } from "lucide-react";
import { Badge, BarChart, Button, Donut, Stats } from "@/components/proto/ui";
import { useProto } from "@/lib/proto/store";
import { EVENT_STATUS_LABEL, EVENT_STATUS_TONE, LEVEL_LABEL, METRIC_SERIES, TASK_STATUS_LABEL, TASK_STATUS_TONE } from "@/lib/proto/data";

const RANGES = [
  { key: "1", label: "今天" },
  { key: "7", label: "近 7 天" },
  { key: "30", label: "近 30 天" },
];

const SYSTEMS = [
  { name: "Agent 推理服务", detail: "模拟 · 平均 1.8s / 次", icon: Sparkles, ok: true },
  { name: "工具网关", detail: "8 个工具 · 2 个需确认", icon: Cpu, ok: true },
  { name: "设备接入（模拟）", detail: "4 台设备 · 1 台离线", icon: Radio, ok: false },
  { name: "知识库索引", detail: "6 份文档 · 索引正常", icon: Database, ok: true },
];

export default function AdminOverviewPage() {
  const { state } = useProto();
  const [range, setRange] = useState("7");

  const series = useMemo(() => (range === "1" ? METRIC_SERIES.slice(-1) : range === "7" ? METRIC_SERIES : METRIC_SERIES), [range]);

  const totals = useMemo(() => {
    const tasks = series.reduce((s, d) => s + d.tasks, 0);
    const done = series.reduce((s, d) => s + d.done, 0);
    const events = series.reduce((s, d) => s + d.events, 0);
    return { tasks, done, events, rate: tasks ? Math.round((done / tasks) * 100) : 0 };
  }, [series]);

  const pendingEvents = state.events.filter((e) => e.status === "pending" || e.status === "processing");
  const pendingTasks = state.tasks.filter((t) => t.status === "pending_confirm");
  const resolved = state.events.filter((e) => e.status === "resolved").length;
  const toolCalls = state.tools.reduce((s, t) => s + t.calls, 0);

  return (
    <div>
      <div className="p-page-head">
        <div>
          <h1>工作概览</h1>
          <p>作业、事件、Agent 与工具的运行态势（全部为模拟数据）</p>
        </div>
        <div className="p-page-actions">
          <div className="p-toggle-group">
            {RANGES.map((r) => (
              <button key={r.key} className={range === r.key ? "is-active" : undefined} onClick={() => setRange(r.key)}>
                {r.label}
              </button>
            ))}
          </div>
          <Link href="/proto/tasks" className="p-btn p-btn-secondary p-btn-md">
            进入任务中心 <ArrowUpRight size={13} />
          </Link>
        </div>
      </div>

      <Stats
        items={[
          { label: "任务总数", value: totals.tasks, hint: range === "1" ? "今日" : "区间内" },
          { label: "完成率", value: `${totals.rate}%`, tone: "ok", hint: `${totals.done} 个已完成` },
          { label: "有效事件", value: totals.events, tone: "warn", hint: `${pendingEvents.length} 个待处置` },
          { label: "工具调用", value: toolCalls.toLocaleString(), hint: "累计（模拟）" },
        ]}
      />

      <div className="p-admin-overview">
        <div className="p-stack">
          <div className="p-card p-card-pad">
            <div className="p-row-between" style={{ marginBottom: 8 }}>
              <h3 className="p-side-h">作业趋势</h3>
              <span className="p-muted p-small">任务 / 完成 / 事件</span>
            </div>
            <BarChart
              data={series}
              series={[
                { key: "tasks", label: "任务", color: "#CBD5E1" },
                { key: "done", label: "完成", color: "#2563EB" },
                { key: "events", label: "事件", color: "#F59E0B" },
              ]}
              height={170}
            />
          </div>

          <div className="p-card">
            <div className="p-card-head">
              <h3>待处理事项</h3>
              <span className="p-muted">{pendingEvents.length + pendingTasks.length} 项</span>
            </div>
            <div className="p-lines">
              {pendingTasks.map((t) => (
                <Link key={t.id} href={`/proto/tasks/${t.id}`} className="p-line p-line-link">
                  <div>
                    <b>{t.name} 待确认下发</b>
                    <span>{t.id} · {t.createdAt}</span>
                  </div>
                  <Badge tone={TASK_STATUS_TONE[t.status] as "warn"}>{TASK_STATUS_LABEL[t.status]}</Badge>
                </Link>
              ))}
              {pendingEvents.map((e) => (
                <Link key={e.id} href={`/proto/events?focus=${e.id}`} className="p-line p-line-link">
                  <div>
                    <b>{e.title}</b>
                    <span>{e.id} · {LEVEL_LABEL[e.level]}风险 · {e.at}</span>
                  </div>
                  <Badge tone={EVENT_STATUS_TONE[e.status] as "warn"}>{EVENT_STATUS_LABEL[e.status]}</Badge>
                </Link>
              ))}
              {pendingEvents.length + pendingTasks.length === 0 && (
                <p className="p-card-pad p-muted" style={{ margin: 0 }}>当前没有待处理事项。</p>
              )}
            </div>
          </div>
        </div>

        <div className="p-stack">
          <div className="p-card p-card-pad">
            <h3 className="p-side-h">事件处置</h3>
            <div className="p-donut-row">
              <Donut value={resolved} total={state.events.length} label="已解决占比" color="#16A34A" />
              <div className="p-mini-stats">
                <div><span>待确认</span><b>{state.events.filter((e) => e.status === "pending").length}</b></div>
                <div><span>处理中</span><b>{state.events.filter((e) => e.status === "processing").length}</b></div>
                <div><span>已解决</span><b>{resolved}</b></div>
                <div><span>误报</span><b>{state.events.filter((e) => e.status === "false_positive").length}</b></div>
              </div>
            </div>
            <Button size="sm" onClick={() => (window.location.href = "/proto/events")} style={{ width: "100%", justifyContent: "center" }}>
              去处置事件
            </Button>
          </div>

          <div className="p-card p-card-pad">
            <h3 className="p-side-h">系统状态（模拟）</h3>
            <div className="p-sys-list">
              {SYSTEMS.map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.name} className="p-sys-row">
                    <i className={`p-sys-icon${s.ok ? "" : " is-warn"}`}><Icon size={13} /></i>
                    <div>
                      <b>{s.name}</b>
                      <span>{s.detail}</span>
                    </div>
                    <Badge tone={s.ok ? "ok" : "warn"}>{s.ok ? "正常" : "降级"}</Badge>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-card">
            <div className="p-card-head">
              <h3>最近操作</h3>
              <Link href="/proto/admin/security" className="p-link p-small">全部日志</Link>
            </div>
            <div className="p-lines">
              {state.audits.slice(0, 4).map((a) => (
                <div key={a.id} className="p-line">
                  <div>
                    <b>{a.action}</b>
                    <span>{a.actor} · {a.target}</span>
                  </div>
                  <Badge tone={a.risk === "high" ? "danger" : a.risk === "mid" ? "warn" : "muted"}>
                    {a.risk === "high" ? "高风险" : a.risk === "mid" ? "中风险" : "低风险"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="p-note">
            <CircleAlert size={12} /> 概览指标由演示数据汇总得出，不反映真实业务量。
            <ShieldCheck size={12} /> 原型不连接真实设备。
          </div>
        </div>
      </div>
    </div>
  );
}
