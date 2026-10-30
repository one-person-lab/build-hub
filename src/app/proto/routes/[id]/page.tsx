"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CheckCircle2, CircleAlert, MapPin, Plus, Save, Send, Trash2 } from "lucide-react";
import { MapCanvas } from "@/components/proto/MapCanvas";
import { Badge, Button, Dialog, Field, KeyValue, Section, TextInput } from "@/components/proto/ui";
import { useProto } from "@/lib/proto/store";
import {
  DEVICES,
  ROUTE_STATUS_LABEL,
  TASK_STATUS_LABEL,
  TASK_STATUS_TONE,
  type Pos,
  type RouteStatus,
  type Waypoint,
} from "@/lib/proto/data";

const LAYERS = { devices: false, areas: true, routes: true, events: false, docks: false };

export default function RouteDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { state, saveRoute, publishRoute, toast } = useProto();
  const id = decodeURIComponent(params.id);
  const route = state.routes.find((r) => r.id === id);

  const [waypoints, setWaypoints] = useState<Waypoint[]>(route?.waypoints ?? []);
  const [addMode, setAddMode] = useState(false);
  const [validateOpen, setValidateOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [restore, setRestore] = useState<string | null>(null);

  const area = state.areas.find((a) => a.id === route?.areaId);
  const issues = useMemo(() => {
    const out: { level: "error" | "warn"; text: string }[] = [];
    if (waypoints.length < 3) out.push({ level: "error", text: "航点不足 3 个，无法构成航线" });
    if (waypoints.some((w) => w.alt < 20 || w.alt > 120)) out.push({ level: "error", text: "存在高度超出 20–120m 的航点" });
    if (waypoints.some((w) => w.speed < 2 || w.speed > 15)) out.push({ level: "error", text: "存在速度超出 2–15 m/s 的航点" });
    if (waypoints.length && waypoints.every((w) => w.alt === waypoints[0].alt)) {
      out.push({ level: "warn", text: "所有航点高度相同，建筑立面检查建议设置分层高度" });
    }
    if (waypoints.some((w) => w.alt === 0)) out.push({ level: "error", text: "缺少返航高度，执行前必须补齐" });
    return out;
  }, [waypoints]);
  const related = state.tasks.filter((t) => t.routeId === id);

  if (!route) {
    return (
      <div className="p-card p-card-pad">
        <b>航线不存在</b>
        <p className="p-muted">演示数据可能已被重置。</p>
        <Button onClick={() => router.push("/proto/routes")}>返回航线列表</Button>
      </div>
    );
  }

  const patch = (i: number, key: "alt" | "speed", value: number) =>
    setWaypoints((ws) => ws.map((w, idx) => (idx === i ? { ...w, [key]: value } : w)));

  const publish = () => {
    if (issues.some((i) => i.level === "error")) {
      toast("存在校验错误，无法发布", "danger");
      setPublishOpen(false);
      setValidateOpen(true);
      return;
    }
    saveRoute(route.id, waypoints, "发布前保存");
    publishRoute(route.id);
    setPublishOpen(false);
  };

  return (
    <div>
      <div className="p-crumb">
        <Link href="/proto/routes">航线管理</Link>
        <span>/</span>
        <span>{route.id}</span>
      </div>

      <div className="p-page-head">
        <div>
          <h1>{route.name}</h1>
          <p>
            {route.id} · {route.version} · 更新于 {route.updatedAt}
          </p>
        </div>
        <div className="p-page-actions">
          <Badge tone={route.status === "published" ? "ok" : route.status === "draft" ? "warn" : "danger"}>
            {ROUTE_STATUS_LABEL[route.status as RouteStatus]}
          </Badge>
          <Button icon={<CircleAlert size={13} />} onClick={() => setValidateOpen(true)}>
            校验
          </Button>
          <Button icon={<Save size={13} />} onClick={() => saveRoute(route.id, waypoints, "手动保存草稿")}>
            保存为新版本
          </Button>
          <Button variant="primary" icon={<Send size={13} />} onClick={() => setPublishOpen(true)}>
            发布
          </Button>
        </div>
      </div>

      <div className="p-detail-grid">
        <div className="p-stack">
          <div className="p-card">
            <div className="p-card-head">
              <div>
                <h3>航线预览</h3>
                <p>{addMode ? "单击地图追加航点" : "点击航点表格可逐点修改高度与速度"}</p>
              </div>
              <Button size="sm" variant={addMode ? "primary" : "secondary"} icon={<Plus size={12} />} onClick={() => setAddMode((v) => !v)}>
                {addMode ? "结束加点" : "加点"}
              </Button>
            </div>
            <div className="p-map-inline is-tall">
              <MapCanvas
                areas={state.areas}
                routes={[{ ...route, waypoints }]}
                devices={DEVICES}
                events={[]}
                layers={LAYERS}
                height="100%"
                selectedAreaId={route.areaId}
                onPick={
                  addMode
                    ? (p: Pos) =>
                        setWaypoints((ws) => [...ws, { x: p.x, y: p.y, alt: ws[ws.length - 1]?.alt ?? 55, speed: 6 }])
                    : undefined
                }
              />
            </div>
            <div className="p-card-pad">
              <KeyValue
                cols={4}
                items={[
                  { k: "作业区域", v: area?.name ?? "—" },
                  { k: "航点数量", v: `${waypoints.length} 个` },
                  { k: "高度范围", v: waypoints.length ? `${Math.min(...waypoints.map((w) => w.alt))}–${Math.max(...waypoints.map((w) => w.alt))} m` : "—" },
                  { k: "速度范围", v: waypoints.length ? `${Math.min(...waypoints.map((w) => w.speed))}–${Math.max(...waypoints.map((w) => w.speed))} m/s` : "—" },
                ]}
              />
              <p className="p-small p-muted" style={{ marginTop: 8 }}>
                高度为相对起飞点高度；速度单位 m/s。执行前会按当前空域规则再次校验。
              </p>
            </div>
          </div>

          <Section
            title="航点"
            desc="修改后点「保存为新版本」才会写入草稿；发布前必须通过校验"
            actions={
              <Button size="sm" onClick={() => setWaypoints([...waypoints, { x: 320, y: 260, alt: 55, speed: 6 }])}>
                追加默认航点
              </Button>
            }
          >
            <div className="p-card">
              <div className="p-table-wrap is-flat">
                <table className="p-table">
                  <thead>
                    <tr>
                      <th style={{ width: 60 }}>序号</th>
                      <th>坐标 (地图单位)</th>
                      <th style={{ width: 120 }}>高度 m</th>
                      <th style={{ width: 120 }}>速度 m/s</th>
                      <th style={{ width: 70 }}>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {waypoints.map((w, i) => (
                      <tr key={i}>
                        <td className="p-mono">{String(i + 1).padStart(2, "0")}</td>
                        <td className="p-mono">{w.x}, {w.y}</td>
                        <td>
                          <TextInput
                            type="number"
                            value={w.alt}
                            invalid={w.alt < 20 || w.alt > 120}
                            onChange={(e) => patch(i, "alt", Number(e.target.value))}
                            className="p-input-tiny"
                          />
                        </td>
                        <td>
                          <TextInput
                            type="number"
                            value={w.speed}
                            invalid={w.speed < 2 || w.speed > 15}
                            onChange={(e) => patch(i, "speed", Number(e.target.value))}
                            className="p-input-tiny"
                          />
                        </td>
                        <td>
                          <button className="p-icon-btn" aria-label="删除航点" onClick={() => setWaypoints(waypoints.filter((_, idx) => idx !== i))}>
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {waypoints.length === 0 && <p className="p-empty-sub">还没有航点，可在地图上加点</p>}
              </div>
            </div>
          </Section>

          <Section title="关联任务" desc={`${related.length} 个任务使用该航线`}>
            <div className="p-card">
              {related.length === 0 ? (
                <p className="p-card-pad p-muted" style={{ margin: 0 }}>暂无任务引用这条航线。</p>
              ) : (
                <div className="p-lines">
                  {related.map((t) => (
                    <Link key={t.id} href={`/proto/tasks/${t.id}`} className="p-line">
                      <div>
                        <b>{t.name}</b>
                        <span>{t.id} · {t.createdAt}</span>
                      </div>
                      <Badge tone={TASK_STATUS_TONE[t.status] as "warn"}>{TASK_STATUS_LABEL[t.status]}</Badge>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </Section>
        </div>

        <aside className="p-stack">
          <div className="p-card p-card-pad">
            <h3 className="p-side-h">版本记录</h3>
            <ol className="p-version-list">
              {route.versions.map((v) => (
                <li key={v.v} className={v.v === route.version ? "is-current" : undefined}>
                  <div>
                    <b>{v.v}</b>
                    <time>{v.at}</time>
                  </div>
                  <p>{v.note}</p>
                  {v.v !== route.version && (
                    <button className="p-inline-link" onClick={() => setRestore(v.v)}>
                      恢复此版本
                    </button>
                  )}
                </li>
              ))}
            </ol>
          </div>

          <div className="p-card p-card-pad">
            <h3 className="p-side-h">校验结果</h3>
            {issues.length === 0 ? (
              <div className="p-ok-line">
                <CheckCircle2 size={14} /> 全部检查通过
              </div>
            ) : (
              <ul className="p-issue-list">
                {issues.map((it, i) => (
                  <li key={i} className={`is-${it.level}`}>
                    <CircleAlert size={13} /> {it.text}
                  </li>
                ))}
              </ul>
            )}
            <Button size="sm" onClick={() => setValidateOpen(true)}>查看校验详情</Button>
          </div>

          <div className="p-card p-card-pad">
            <h3 className="p-side-h">用途说明</h3>
            <p className="p-small p-muted" style={{ margin: 0 }}>
              <MapPin size={11} /> 航线只描述飞行路径与相机参数，不包含任何真实设备指令。发布后可被任务计划引用。
            </p>
          </div>
        </aside>
      </div>

      <Dialog
        open={validateOpen}
        title="航线校验"
        confirmText="知道了"
        cancelText="关闭"
        onClose={() => setValidateOpen(false)}
        onConfirm={() => setValidateOpen(false)}
      >
        <div className="p-form">
          <div className={issues.length ? "p-alert-line" : "p-ok-line"}>
            {issues.length ? <CircleAlert size={13} /> : <CheckCircle2 size={14} />}
            {issues.length ? `发现 ${issues.length} 个问题` : "全部检查通过，可以发布"}
          </div>
          <ul className="p-issue-list">
            {issues.map((it, i) => (
              <li key={i} className={`is-${it.level}`}>
                <CircleAlert size={13} /> {it.text}
              </li>
            ))}
            {issues.length === 0 && <li className="is-ok"><CheckCircle2 size={13} /> 参数、边界与返航高度均正常</li>}
          </ul>
        </div>
      </Dialog>

      <Dialog
        open={publishOpen}
        title="发布航线？"
        confirmText="发布"
        onClose={() => setPublishOpen(false)}
        onConfirm={publish}
      >
        发布后新的任务计划会优先使用该版本，已在执行的任务不受影响。
        {issues.some((i) => i.level === "error") && (
          <p className="t-danger" style={{ marginTop: 8 }}>当前仍有校验错误，发布会失败。</p>
        )}
      </Dialog>

      <Dialog
        open={!!restore}
        title={`恢复到 ${restore}？`}
        confirmText="恢复"
        onClose={() => setRestore(null)}
        onConfirm={() => {
          toast(`已恢复 ${restore} 的航点参数（原型演示）`, "ok");
          setRestore(null);
        }}
      >
        恢复会以旧版本参数生成一条新草稿，不会覆盖已发布版本的历史记录。
      </Dialog>
    </div>
  );
}
