"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, CircleAlert, FileText, MapPin, PlayCircle, XCircle } from "lucide-react";
import { EvidenceThumb, MapCanvas, type Layers } from "@/components/proto/MapCanvas";
import { Badge, Button, Dialog, EmptyState, KeyValue, Section, Timeline } from "@/components/proto/ui";
import { useProto } from "@/lib/proto/store";
import {
  DEVICES,
  EVENT_STATUS_LABEL,
  EVENT_STATUS_TONE,
  LEVEL_LABEL,
  TASK_STATUS_LABEL,
  TASK_STATUS_TONE,
  deviceById,
  routeById,
} from "@/lib/proto/data";

const LAYERS: Layers = { devices: false, areas: true, routes: true, events: true, docks: false };

export default function TaskDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { state, confirmTask, requestCancel, resolveCancel, toast } = useProto();
  const [cancelOpen, setCancelOpen] = useState(false);

  const task = state.tasks.find((t) => t.id === decodeURIComponent(params.id));
  if (!task) {
    return (
      <EmptyState
        title="任务不存在"
        hint="链接可能已失效，或演示数据被重置"
        action={<Button onClick={() => router.push("/proto/tasks")}>返回任务中心</Button>}
      />
    );
  }

  const device = deviceById(task.deviceId);
  const route = routeById(task.routeId);
  const area = state.areas.find((a) => a.id === task.areaId) ?? state.areas[0];
  const events = task.eventIds.map((id) => state.events.find((e) => e.id === id)).filter(Boolean);
  const running = task.status === "running" || task.status === "queued";

  return (
    <div>
      <div className="p-crumb">
        <Link href="/proto/tasks">任务中心</Link>
        <span>/</span>
        <span>{task.id}</span>
      </div>

      <div className="p-page-head">
        <div>
          <h1>{task.name}</h1>
          <p>
            {task.id} · {task.type} · 创建于 {task.createdAt}
          </p>
        </div>
        <div className="p-page-actions">
          <Button icon={<ArrowLeft size={13} />} onClick={() => router.push("/proto/tasks")}>
            返回列表
          </Button>
          {task.status === "pending_confirm" && (
            <Button variant="primary" icon={<PlayCircle size={13} />} onClick={() => confirmTask(task.id)}>
              确认并下发
            </Button>
          )}
          {running && !task.cancelState && (
            <Button variant="danger" icon={<XCircle size={13} />} onClick={() => setCancelOpen(true)}>
              申请取消
            </Button>
          )}
          {task.reportId && (
            <Link href={`/proto/reports/${task.reportId}`} className="p-btn p-btn-secondary">
              <FileText size={13} /> 查看报告
            </Link>
          )}
          <Link href={`/proto/admin/traces/${task.traceId}`} className="p-btn p-btn-secondary">
            查看 Trace
          </Link>
        </div>
      </div>

      <div className="p-detail-grid">
        <div className="p-stack">
          <Section>
            <div className="p-card p-card-pad">
              <div className="p-task-headline">
                <div>
                  <Badge tone={TASK_STATUS_TONE[task.status] as "warn"}>{TASK_STATUS_LABEL[task.status]}</Badge>
                  <span className="p-muted">计划版本 {task.planVersion}</span>
                  {task.cancelState === "requesting" && <Badge tone="warn">取消申请中</Badge>}
                </div>
                <div className="p-task-progress">
                  <div className={`p-progress${task.status === "failed" ? " is-danger" : task.status === "done" ? " is-ok" : ""}`}>
                    <i style={{ width: `${task.progress}%` }} />
                  </div>
                  <b>{task.progress}%</b>
                </div>
              </div>

              <KeyValue
                items={[
                  { k: "作业区域", v: area?.name ?? "—" },
                  { k: "执行设备", v: device ? `${device.name} · ${device.model}` : "—" },
                  { k: "任务类型", v: task.type },
                  { k: "创建人", v: task.operator },
                  { k: "航线", v: route ? `${route.id} ${route.version} · ${route.waypoints.length} 航点` : "—" },
                  { k: "计划高度 / 速度", v: route ? `${task.alt ?? route.waypoints[0]?.alt ?? 55} m / ${task.speed ?? route.waypoints[0]?.speed ?? 6} m/s` : "—" },
                ]}
              />
              {task.cancelState === "requesting" && (
                <div className="p-alert-line">
                  取消申请已提交，业务平台尚未停止飞行。原型可模拟值班长处理：
                  <button className="p-inline-link" onClick={() => resolveCancel(task.id, true)}>确认取消</button>
                  <button className="p-inline-link" onClick={() => resolveCancel(task.id, false)}>驳回申请</button>
                </div>
              )}
            </div>
          </Section>

          <Section title="执行时间线" desc="创建 → 校验 → 确认 → 下发 → 执行 → 完成">
            <div className="p-card p-card-pad">
              <Timeline items={task.steps.map((s) => ({ ...s }))} />
            </div>
          </Section>

          <Section title="计划与校验" desc={`${task.planVersion} · 共 ${task.checks.length} 项校验`}>
            <div className="p-card p-card-pad">
              <ul className="p-checks-panel">
                {task.checks.map((c, i) => (
                  <li key={i} className={`is-${c.level}`}>
                    {c.level === "ok" ? <CheckCircle2 size={14} /> : <CircleAlert size={14} />}
                    <span>{c.text}</span>
                    <em>{c.level === "ok" ? "通过" : c.level === "warn" ? "提示" : "未通过"}</em>
                  </li>
                ))}
              </ul>
              {task.status === "pending_confirm" && (
                <div className="p-inline-actions">
                  <Link href={`/proto/routes/${task.routeId}`} className="p-btn p-btn-secondary p-btn-sm">调整航线</Link>
                  <Button size="sm" variant="primary" onClick={() => confirmTask(task.id)}>确认并下发</Button>
                </div>
              )}
            </div>
          </Section>

          <Section title="巡检结果" desc={events.length ? `发现 ${events.length} 处情况` : "任务执行中，暂无异常"}>
            {events.length === 0 ? (
              <div className="p-card p-card-pad">
                <p className="p-muted" style={{ margin: 0 }}>若执行中发现异常，会在这里同步事件与证据。</p>
              </div>
            ) : (
              <div className="p-stack">
                {events.map((e) => (
                  <div key={e!.id} className="p-result-row p-card">
                    <EvidenceThumb variant={e!.evidence} height={96} />
                    <div>
                      <div className="p-result-head">
                        <b>{e!.title}</b>
                        <Badge tone={EVENT_STATUS_TONE[e!.status] as "warn"}>{EVENT_STATUS_LABEL[e!.status]}</Badge>
                      </div>
                      <p className="p-result-note">{e!.note}</p>
                      <div className="p-result-meta">
                        <span>{LEVEL_LABEL[e!.level]}风险</span>
                        <span>置信度 {(e!.confidence * 100).toFixed(0)}%</span>
                        <span>{e!.at}</span>
                      </div>
                      <div className="p-inline-actions">
                        <Link href={`/proto/events?focus=${e!.id}`} className="p-btn p-btn-secondary p-btn-sm">查看事件</Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>

        <aside className="p-stack">
          <div className="p-card">
            <div className="p-card-head">
              <h3>作业范围</h3>
              <span className="p-muted">{area?.mu} 亩</span>
            </div>
            <div className="p-map-inline">
              <MapCanvas
                areas={state.areas}
                routes={state.routes.filter((r) => r.id === task.routeId)}
                devices={DEVICES}
                events={state.events.filter((e) => task.eventIds.includes(e.id))}
                layers={LAYERS}
                height="100%"
                selectedAreaId={task.areaId}
              />
            </div>
            <div className="p-card-pad p-tight">
              <div className="p-mini-row">
                <MapPin size={12} />
                <span>{area?.name}</span>
              </div>
              {route && <p className="p-muted p-small">{route.waypoints.length} 航点 · 高度 {task.alt ?? route.waypoints[0]?.alt}m · 速度 {task.speed ?? route.waypoints[0]?.speed}m/s</p>}
            </div>
          </div>

          <div className="p-card p-card-pad">
            <h3 className="p-side-h">快速操作</h3>
            <div className="p-side-actions-col">
              <Link href={`/proto/routes/${task.routeId}`} className="p-btn p-btn-secondary p-btn-sm">查看航线版本</Link>
              <Link href={`/proto/admin/traces/${task.traceId}`} className="p-btn p-btn-secondary p-btn-sm">执行 Trace</Link>
              <Button size="sm" onClick={() => toast("已复制任务编号 " + task.id, "ok")}>复制任务编号</Button>
              {task.reportId && (
                <Link href={`/proto/reports/${task.reportId}`} className="p-btn p-btn-secondary p-btn-sm">打开作业报告</Link>
              )}
            </div>
          </div>

          <div className="p-card p-card-pad">
            <h3 className="p-side-h">安全提示</h3>
            <p className="p-small p-muted" style={{ margin: 0 }}>
              取消、下发等高风险动作都会进入确认流程并记录审计；原型不会向真实设备下发指令。
            </p>
          </div>
        </aside>
      </div>

      <Dialog
        open={cancelOpen}
        title="申请取消任务？"
        confirmText="提交申请"
        danger
        onClose={() => setCancelOpen(false)}
        onConfirm={() => {
          requestCancel(task.id);
          setCancelOpen(false);
        }}
      >
        任务已开始执行。提交后进入「取消申请」状态，需值班长确认后才由业务平台停止飞行。<br />
        直接点按钮不等于任务已停止。
      </Dialog>
    </div>
  );
}
