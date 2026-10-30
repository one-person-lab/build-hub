"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Layers3, MapPin, Pentagon, Route as RouteIcon, X } from "lucide-react";
import { MapCanvas, LayerToggles, type Layers } from "@/components/proto/MapCanvas";
import { Badge, Button, Dialog, Drawer, Field, Select, TextInput } from "@/components/proto/ui";
import { useProto } from "@/lib/proto/store";
import { AREAS, DEVICES, EVENT_STATUS_LABEL, EVENT_STATUS_TONE, LEVEL_LABEL, type Area, type Pos } from "@/lib/proto/data";

const DEFAULT_LAYERS: Layers = { devices: true, areas: true, routes: true, events: true, docks: true };

function polygonMu(points: Pos[]) {
  let s = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    s += a.x * b.y - b.x * a.y;
  }
  return Math.max(1, Math.round(Math.abs(s / 2) / 260));
}

export default function MapPage() {
  const { state, addArea, createPlan, toast } = useProto();
  const router = useRouter();
  const [layers, setLayers] = useState<Layers>(DEFAULT_LAYERS);
  const [selectedArea, setSelectedArea] = useState<string | undefined>("A-01");
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [drawMode, setDrawMode] = useState(false);
  const [draft, setDraft] = useState<Pos[]>([]);
  const [naming, setNaming] = useState(false);
  const [areaName, setAreaName] = useState("滨江东路东段消防通道");
  const [areaNameError, setAreaNameError] = useState("");
  const [starting, setStarting] = useState<Area | null>(null);
  const [deviceId, setDeviceId] = useState("UAV-02");
  const [alt, setAlt] = useState(55);
  const [altError, setAltError] = useState("");

  const areas = state.areas.length ? state.areas : AREAS;
  const device = DEVICES;
  const current = device.find((d) => d.id === selectedDevice) ?? null;
  const area = areas.find((a) => a.id === selectedArea) ?? null;
  const areaRoutes = useMemo(
    () => state.routes.filter((r) => !selectedArea || r.areaId === selectedArea),
    [state.routes, selectedArea]
  );

  const finishDraw = () => {
    if (draft.length < 3) return;
    setAreaNameError("");
    setNaming(true);
  };

  const saveArea = () => {
    if (!areaName.trim()) {
      setAreaNameError("请填写区域名称");
      return;
    }
    const id = `A-${String(areas.length + 1).padStart(2, "0")}-N`;
    const newArea: Area = { id, name: areaName.trim(), mu: polygonMu(draft), polygon: draft };
    addArea(newArea);
    setSelectedArea(id);
    setDrawMode(false);
    setDraft([]);
    setNaming(false);
    toast("区域已登记，可直接用于任务计划", "ok");
  };

  return (
    <div className="p-map-page">
      <section className="p-map-main">
        <header className="p-map-toolbar">
          <div>
            <h1>作业地图</h1>
            <p>设备位置、任务区域、航线与异常点 · 模拟地理数据</p>
          </div>
          <div className="p-map-toolbar-right">
            <div className="p-map-layer-pop">
              <Layers3 size={13} />
              <LayerToggles layers={layers} onChange={setLayers} />
            </div>
            {drawMode ? (
              <>
                <Button size="sm" onClick={() => { setDraft([]); setDrawMode(false); }} icon={<X size={13} />}>
                  退出圈选
                </Button>
                <Button size="sm" variant="primary" disabled={draft.length < 3} onClick={finishDraw}>
                  完成圈选{draft.length ? `（${draft.length} 点）` : ""}
                </Button>
              </>
            ) : (
              <Button size="sm" variant="primary" icon={<Pentagon size={13} />} onClick={() => { setDrawMode(true); setDraft([]); }}>
                圈选区域
              </Button>
            )}
          </div>
        </header>

        <div className="p-map-wrap">
        <MapCanvas
          className="p-map-full"
          height="100%"
          areas={areas}
          routes={areaRoutes}
          devices={device}
          events={state.events}
          layers={layers}
          selectedAreaId={selectedArea}
          selectedDeviceId={selectedDevice ?? undefined}
          drawMode={drawMode}
          draft={draft}
          onDraftChange={setDraft}
          onSelectArea={(id) => setSelectedArea(id)}
          onSelectDevice={(id) => setSelectedDevice(id)}
          onSelectEvent={() => router.push("/proto/events")}
        />
        </div>

        {drawMode && (
          <div className="p-draw-bar">
            <span>
              {draft.length === 0
                ? "单击地图开始圈选作业区域"
                : draft.length < 3
                ? `已点 ${draft.length} 个点，至少需要 3 个`
                : `多边形 ${polygonMu(draft)} 亩 · 可继续加点或完成`}
            </span>
            <Button size="sm" onClick={() => setDraft(draft.slice(0, -1))} disabled={!draft.length}>
              撤销上一点
            </Button>
          </div>
        )}
      </section>

      <aside className="p-map-side">
        {area && (
          <div className="p-map-side-block">
            <header>
              <h3>当前区域</h3>
              <Badge tone="brand">{areas.length} 个</Badge>
            </header>
            <div className="p-map-area-card">
              <b><MapPin size={12} /> {area.name}</b>
              <span>{area.mu} 亩 · {area.polygon.length} 个边界点</span>
              <div className="p-map-area-links">
                {areaRoutes.map((r) => (
                  <Link key={r.id} href={`/proto/routes/${r.id}`} className="p-mini-link">
                    <RouteIcon size={11} /> {r.id} {r.version}
                    <em>{r.waypoints.length} 航点</em>
                  </Link>
                ))}
                {areaRoutes.length === 0 && <span className="p-muted">该区域暂无航线</span>}
              </div>
              <Button size="sm" variant="primary" onClick={() => setStarting(area)}>
                在此区域发起巡检
              </Button>
            </div>
            <div className="p-map-area-list">
              {areas.map((a) => (
                <button key={a.id} className={a.id === selectedArea ? "is-active" : undefined} onClick={() => setSelectedArea(a.id)}>
                  <span>{a.name}</span>
                  <em>{a.mu} 亩</em>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="p-map-side-block">
          <header>
            <h3>设备</h3>
            <span className="p-muted">{device.filter((d) => d.status !== "offline").length}/{device.length} 在线</span>
          </header>
          <div className="p-map-devices">
            {device.map((d) => (
              <button key={d.id} onClick={() => setSelectedDevice(d.id)} className={d.id === selectedDevice ? "is-active" : undefined}>
                <i className={`p-dot p-dot-${d.status === "offline" ? "muted" : d.status === "busy" ? "active" : "ok"}`} />
                <div>
                  <b>{d.name}</b>
                  <span>{d.model} · 电量 {d.battery}%</span>
                </div>
                <em>{d.status === "offline" ? "离线" : d.status === "busy" ? "任务中" : "空闲"}</em>
              </button>
            ))}
          </div>
        </div>

        <div className="p-map-side-block">
          <header>
            <h3>异常点</h3>
            <Link href="/proto/events" className="p-btn p-btn-text">全部事件</Link>
          </header>
          <div className="p-map-events">
            {state.events.slice(0, 5).map((e) => (
              <Link key={e.id} href={`/proto/events?focus=${e.id}`}>
                <i className={`p-dot p-dot-${e.level === "high" ? "danger" : e.level === "mid" ? "warn" : "info"}`} />
                <div>
                  <b>{e.title}</b>
                  <span>{LEVEL_LABEL[e.level]}风险 · {e.at.slice(5)}</span>
                </div>
                <Badge tone={EVENT_STATUS_TONE[e.status] as "warn"}>{EVENT_STATUS_LABEL[e.status]}</Badge>
              </Link>
            ))}
          </div>
        </div>
      </aside>

      <Drawer
        open={!!current}
        title={current ? current.name : ""}
        sub={current ? `${current.model} · ${current.id}` : undefined}
        onClose={() => setSelectedDevice(null)}
        footer={
          current?.taskId ? (
            <Link href={`/proto/tasks/${current.taskId}`} className="p-btn p-btn-secondary p-btn-sm">
              查看当前任务
            </Link>
          ) : (
            <Button size="sm" onClick={() => setSelectedDevice(null)}>关闭</Button>
          )
        }
      >
        {current && (
          <div className="p-drawer-stack">
            <div className="p-device-hero">
              <div className="p-device-badge">
                <i className={`p-dot p-dot-${current.status === "offline" ? "muted" : current.status === "busy" ? "active" : "ok"}`} />
                {current.status === "offline" ? "离线" : current.status === "busy" ? "任务中" : "空闲"}
              </div>
              <div>
                <span>电量</span>
                <b>{current.battery}%</b>
              </div>
              <div>
                <span>所属机巢</span>
                <b>{current.dockId}</b>
              </div>
            </div>
            <dl className="p-kv" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <div><dt>型号</dt><dd>{current.model}</dd></div>
              <div><dt>载荷</dt><dd>{current.payload}</dd></div>
              <div><dt>当前位置</dt><dd className="p-mono">{current.pos.x}, {current.pos.y}</dd></div>
              <div><dt>当前任务</dt><dd>{current.taskId ?? "—"}</dd></div>
            </dl>
            <div className="p-note">
              设备状态来自模拟数据。原型不会连接真实无人机，也不会向任何设备下发指令。
            </div>
          </div>
        )}
      </Drawer>

      <Dialog
        open={naming}
        title="登记新区域"
        confirmText="保存区域"
        onClose={() => setNaming(false)}
        onConfirm={saveArea}
      >
        <div className="p-form">
          <Field label="区域名称" required error={areaNameError}>
            <TextInput value={areaName} invalid={!!areaNameError} onChange={(e) => setAreaName(e.target.value)} />
          </Field>
          <div className="p-note">
            面积约 {polygonMu(draft)} 亩，共 {draft.length} 个边界点。保存后会出现在区域列表，可用于航线与任务计划。
          </div>
        </div>
      </Dialog>

      <Dialog
        open={!!starting}
        title="发起巡检任务"
        confirmText="生成计划"
        onClose={() => setStarting(null)}
        onConfirm={() => {
          if (alt < 20 || alt > 120) {
            setAltError("高度需在 20–120 米之间");
            return;
          }
          if (!starting) return;
          const t = createPlan({ area: starting, deviceId, alt, speed: 6, lens: "双光" });
          setStarting(null);
          toast("计划已生成，等待确认", "ok");
          router.push(`/proto/tasks/${t.id}`);
        }}
      >
        <div className="p-form">
          <Field label="作业区域">
            <TextInput value={starting?.name ?? ""} readOnly />
          </Field>
          <div className="p-grid-2">
            <Field label="执行设备">
              <Select value={deviceId} onChange={(e) => setDeviceId(e.target.value)}>
                {device.map((d) => (
                  <option key={d.id} value={d.id} disabled={d.status === "offline"}>
                    {d.name} · {d.battery}% · {d.status === "offline" ? "离线" : d.status === "busy" ? "任务中" : "空闲"}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="高度 (m)" error={altError}>
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
          <div className="p-note">生成后仍需在任务详情中人工确认，确认前不会下发到业务平台。</div>
        </div>
      </Dialog>
    </div>
  );
}
