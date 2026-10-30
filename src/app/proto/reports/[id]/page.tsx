"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Copy, Download, FileText, Printer } from "lucide-react";
import { Badge, Button, DataTable, KeyValue, Stats, type Column } from "@/components/proto/ui";
import { EvidenceThumb, MapCanvas, type Layers } from "@/components/proto/MapCanvas";
import { useProto } from "@/lib/proto/store";
import {
  EVENT_STATUS_LABEL,
  EVENT_STATUS_TONE,
  LEVEL_LABEL,
  ROUTE_STATUS_LABEL,
  areaById,
  deviceById,
  DEVICES,
  routeById,
  type DroneEvent,
} from "@/lib/proto/data";

const LAYERS: Layers = { devices: false, areas: true, routes: true, events: true, docks: true };

export default function ReportDetailPage() {
  const params = useParams<{ id: string }>();
  const { state, toast } = useProto();
  const [expand, setExpand] = useState(false);
  const report = state.reports.find((r) => r.id === decodeURIComponent(params.id));

  const task = state.tasks.find((t) => t.id === report?.taskId);
  const area = areaById(task?.areaId ?? "");
  const device = deviceById(task?.deviceId ?? "");
  const route = routeById(task?.routeId ?? "");
  const events = useMemo(
    () => state.events.filter((e) => task?.eventIds.includes(e.id)),
    [state.events, task],
  );

  if (!report || !task) {
    return (
      <div className="p-card p-card-pad">
        <b>报告不存在</b>
        <p className="p-muted">演示数据可能已被重置，请返回报告列表。</p>
        <Link href="/proto/reports" className="p-btn p-btn-primary p-btn-md">返回报告列表</Link>
      </div>
    );
  }

  const columns: Column<DroneEvent>[] = [
    { key: "title", title: "异常", render: (e) => <b>{e.title}</b> },
    {
      key: "level",
      title: "等级",
      width: "90px",
      render: (e) => (
        <Badge tone={e.level === "high" ? "danger" : e.level === "mid" ? "warn" : "info"}>{LEVEL_LABEL[e.level]}</Badge>
      ),
    },
    { key: "type", title: "类型", width: "90px", render: (e) => e.type },
    { key: "at", title: "发现时间", render: (e) => <span className="p-mono">{e.at}</span> },
    {
      key: "status",
      title: "处置状态",
      width: "110px",
      render: (e) => <Badge tone={EVENT_STATUS_TONE[e.status] as "warn"}>{EVENT_STATUS_LABEL[e.status]}</Badge>,
    },
    {
      key: "ops",
      title: "",
      width: "80px",
      render: (e) => (
        <Link href={`/proto/events?focus=${e.id}`} className="p-link">
          处置
        </Link>
      ),
    },
  ];

  return (
    <div className="p-report">
      <div className="p-crumb p-no-print">
        <Link href="/proto/reports">作业报告</Link>
        <span>/</span>
        <span>{report.id}</span>
      </div>

      <div className="p-page-head">
        <div>
          <h1>{report.name}</h1>
          <p>{report.id} · 关联任务 {task.id} · {report.at} 生成</p>
        </div>
        <div className="p-page-actions p-no-print">
          <Button icon={<Copy size={13} />} onClick={() => toast("报告链接已复制（模拟）", "ok")}>
            复制链接
          </Button>
          <Button icon={<Printer size={13} />} onClick={() => window.print()}>
            打印
          </Button>
          <Button variant="primary" icon={<Download size={13} />} onClick={() => toast("已导出 PDF（模拟）", "ok")}>
            导出 PDF
          </Button>
        </div>
      </div>

      <div className="p-report-paper">
        <div className="p-report-brand">
          <span><FileText size={13} /> 无人机 Copilot · 巡检作业报告</span>
          <Badge tone="muted">模拟数据</Badge>
        </div>

        <Stats
          items={[
            { label: "覆盖面积", value: `${area?.mu ?? "—"} 亩` },
            { label: "航点完成", value: `${route?.waypoints.length ?? 12}/12` },
            { label: "飞行时长", value: "14 分 32 秒" },
            {
              label: "发现异常",
              value: events.length,
              tone: events.length ? "warn" : "ok",
              hint: events.length
                ? `${events.filter((e) => e.status === "false_positive").length} 处误报 · ${
                    events.filter((e) => e.status === "pending" || e.status === "processing").length
                  } 处待处置`
                : "本轮无异常",
            },
          ]}
        />

        <section className="p-report-section">
          <h2>一、作业概况</h2>
          <KeyValue
            cols={3}
            items={[
              { k: "作业区域", v: area?.name ?? "—" },
              { k: "执行设备", v: device?.name ?? "—" },
              { k: "航线版本", v: `${route?.id ?? "R-001"} · ${route ? ROUTE_STATUS_LABEL[route.status] : "—"}` },
              { k: "任务编号", v: <Link href={`/proto/tasks/${task.id}`} className="p-link p-mono">{task.id}</Link> },
              { k: "执行时间", v: task.createdAt },
              { k: "操作人", v: task.operator },
            ]}
          />
        </section>

        <section className="p-report-section">
          <h2>二、结论摘要</h2>
          <p className="p-report-summary">{report.summary}</p>
          <p className="p-muted p-small">
            本次巡检按计划航线完成 12 个航点，云台与载荷工作正常，未触发安全告警。
            报告中的异常由模拟识别流程产生，仅用于演示，不作为真实处置依据。
          </p>
        </section>

        <section className="p-report-section">
          <h2>三、异常明细</h2>
          <DataTable columns={columns} rows={events} rowKey={(e) => e.id} empty="本次作业未发现异常" />
        </section>

        <section className="p-report-section">
          <h2>四、证据影像</h2>
          <div className="p-evidence-row">
            {events.slice(0, 3).map((e) => (
              <EvidenceThumb
                key={e.id}
                variant={e.evidence}
                caption={`${e.id} · ${e.type} · 模拟渲染`}
                height={120}
              />
            ))}
            {events.length === 0 && <p className="p-muted">本次作业没有异常影像。</p>}
          </div>
        </section>

        <section className="p-report-section">
          <h2>五、航迹与区域</h2>
          <div className="p-map-inline" style={{ height: 260 }}>
            <MapCanvas
              areas={state.areas}
              routes={state.routes}
              devices={DEVICES}
              events={events}
              layers={LAYERS}
              height={260}
              selectedAreaId={area?.id}
              selectedDeviceId={device?.id}
            />
          </div>
        </section>

        {expand && (
          <section className="p-report-section">
            <h2>附录：执行时间线</h2>
            <table className="p-table">
              <thead>
                <tr>
                  <th>步骤</th>
                  <th>时间</th>
                  <th>说明</th>
                </tr>
              </thead>
              <tbody>
                {task.steps.map((s) => (
                  <tr key={s.key}>
                    <td>{s.label}</td>
                    <td className="p-mono">{s.at}</td>
                    <td>{s.note ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        <div className="p-report-foot p-no-print">
          <span>报告由任务执行结果自动生成 · {report.at}</span>
          <Button size="sm" variant="text" onClick={() => setExpand((v) => !v)}>
            {expand ? "收起附录" : "展开执行时间线"}
          </Button>
        </div>
      </div>
    </div>
  );
}
