"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Crosshair, Minus, Plus, RotateCcw } from "lucide-react";
import type { Area, Device, DroneEvent, Pos, RoutePlan } from "@/lib/proto/data";

export type Layers = { devices: boolean; areas: boolean; routes: boolean; events: boolean; docks: boolean };

const VB = { x: 0, y: 0, w: 1000, h: 640 };

const BUILDINGS = [
  [80, 40, 90, 46], [190, 34, 80, 58], [300, 40, 110, 52], [440, 46, 84, 44],
  [560, 30, 96, 60], [690, 44, 76, 44], [800, 36, 110, 56], [930, 50, 54, 44],
  [70, 300, 84, 62], [180, 316, 104, 54], [330, 300, 92, 70], [470, 330, 80, 54],
  [600, 520, 96, 54], [720, 560, 84, 44], [860, 500, 104, 62], [90, 560, 96, 46],
  [260, 560, 110, 44], [420, 566, 74, 40], [560, 420, 66, 46], [920, 570, 60, 40],
  [60, 150, 40, 34], [140, 170, 56, 26], [470, 150, 70, 40], [580, 160, 50, 30],
  [700, 150, 90, 40], [830, 160, 60, 34],
];

const ROADS = [
  "M0 240 H1000",
  "M0 470 H1000",
  "M0 100 H1000",
  "M330 0 V640",
  "M640 0 V640",
  "M890 0 V640",
  "M0 380 H1000",
];

function tone(t: "high" | "mid" | "low") {
  return t === "high" ? "#dc2626" : t === "mid" ? "#d97706" : "#0891b2";
}

function poly(points: Pos[]) {
  return points.map((p) => `${p.x},${p.y}`).join(" ");
}

export function MapCanvas({
  areas,
  routes,
  devices,
  events,
  layers,
  height = 460,
  selectedAreaId,
  selectedDeviceId,
  focusEventId,
  onSelectArea,
  onSelectDevice,
  onSelectEvent,
  draft,
  onDraftChange,
  onPick,
  drawMode,
  className,
  minZoom = 1,
}: {
  areas: Area[];
  routes: RoutePlan[];
  devices: Device[];
  events: DroneEvent[];
  layers: Layers;
  height?: number | string;
  selectedAreaId?: string;
  selectedDeviceId?: string;
  focusEventId?: string;
  onSelectArea?: (id: string) => void;
  onSelectDevice?: (id: string) => void;
  onSelectEvent?: (id: string) => void;
  draft?: Pos[];
  onDraftChange?: (p: Pos[]) => void;
  onPick?: (p: Pos) => void;
  drawMode?: boolean;
  className?: string;
  minZoom?: number;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [view, setView] = useState(VB);
  const drag = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);

  const toSvg = useCallback((clientX: number, clientY: number): Pos | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const m = svg.getScreenCTM();
    if (!m) return null;
    const p = pt.matrixTransform(m.inverse());
    return { x: Math.round(p.x), y: Math.round(p.y) };
  }, []);

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const p = toSvg(e.clientX, e.clientY);
      if (!p) return;
      setView((v) => {
        const factor = e.deltaY > 0 ? 1.14 : 0.88;
        const w = Math.min(VB.w * 1.6, Math.max(VB.w / 6, v.w * factor));
        const h = w * (VB.h / VB.w);
        const k = w / v.w;
        const x = p.x - (p.x - v.x) * k;
        const y = p.y - (p.y - v.y) * k;
        if (w / VB.w < minZoom && minZoom > 1) return v;
        return { x, y, w, h };
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [toSvg, minZoom]);

  const onDown = (e: React.MouseEvent) => {
    if (drawMode) return;
    drag.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y };
  };
  const onMove = (e: React.MouseEvent) => {
    const d = drag.current;
    if (!d) return;
    const el = svgRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const kx = view.w / rect.width;
    const ky = view.h / rect.height;
    setView((v) => ({ ...v, x: d.vx - (e.clientX - d.x) * kx, y: d.vy - (e.clientY - d.y) * ky }));
  };
  const onUp = () => {
    drag.current = null;
  };

  const onClick = (e: React.MouseEvent) => {
    const p = toSvg(e.clientX, e.clientY);
    if (!p) return;
    if (onPick) {
      onPick(p);
      return;
    }
    if (!drawMode) return;
    if (!onDraftChange) return;
    onDraftChange([...(draft ?? []), p]);
  };

  const zoom = (dir: 1 | -1) => {
    setView((v) => {
      const factor = dir > 0 ? 0.8 : 1.25;
      const w = Math.min(VB.w * 1.6, Math.max(VB.w / 6, v.w * factor));
      const h = w * (VB.h / VB.w);
      const cx = v.x + v.w / 2;
      const cy = v.y + v.h / 2;
      return { x: cx - w / 2, y: cy - h / 2, w, h };
    });
  };

  const cursor = drawMode || onPick ? "crosshair" : drag.current ? "grabbing" : "grab";

  return (
    <div className={`p-map${className ? ` ${className}` : ""}`} style={{ height }}>
      <svg
        ref={svgRef}
        viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
        className="p-map-svg"
        style={{ cursor }}
        onMouseDown={onDown}
        onMouseMove={onMove}
        onMouseUp={onUp}
        onMouseLeave={onUp}
        onClick={onClick}
      >
        <defs>
          <pattern id="p-map-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0H0V40" fill="none" stroke="#e8eef6" strokeWidth="1" />
          </pattern>
          <linearGradient id="p-map-water" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#dff1fb" />
            <stop offset="1" stopColor="#c9e8f7" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="1000" height="640" fill="#f6f8fc" />
        <rect x="0" y="0" width="1000" height="640" fill="url(#p-map-grid)" />

        {/* 水域 / 绿地 */}
        <path d="M900 0 C900 120 960 200 1000 250 V640 H880 C860 520 880 300 900 0 Z" fill="url(#p-map-water)" />
        <path d="M600 470 C700 440 830 470 890 520 L890 600 C800 560 700 560 600 590 Z" fill="#eaf6ec" />
        <ellipse cx="560" cy="250" rx="44" ry="26" fill="#eaf6ec" />

        {/* 道路 */}
        {ROADS.map((d) => (
          <g key={d}>
            <path d={d} stroke="#e4e9f2" strokeWidth="16" fill="none" />
            <path d={d} stroke="#ffffff" strokeWidth="11" fill="none" />
          </g>
        ))}

        {/* 建筑 */}
        {BUILDINGS.map(([x, y, w, h], i) => (
          <g key={i}>
            <rect x={x} y={y} width={w} height={h} rx="3" fill={i % 3 === 0 ? "#e9edf5" : "#eef2f8"} stroke="#dde4ee" />
            <rect x={x + 6} y={y + 6} width={w - 12} height={h - 12} rx="2" fill="#e3e9f3" opacity="0.55" />
          </g>
        ))}

        {/* 区域 */}
        {layers.areas &&
          areas.map((a) => {
            const active = a.id === selectedAreaId;
            return (
              <g key={a.id} onClick={() => onSelectArea?.(a.id)} style={{ cursor: onSelectArea ? "pointer" : "default" }}>
                <polygon
                  points={poly(a.polygon)}
                  fill={active ? "rgba(37,99,235,0.16)" : "rgba(37,99,235,0.07)"}
                  stroke={active ? "#2563eb" : "#7ea6f0"}
                  strokeWidth={active ? 2.4 : 1.4}
                  strokeDasharray={active ? undefined : "6 5"}
                />
                <text
                  x={a.polygon.reduce((s, p) => s + p.x, 0) / a.polygon.length}
                  y={a.polygon.reduce((s, p) => s + p.y, 0) / a.polygon.length}
                  textAnchor="middle"
                  className="p-map-label"
                  fill={active ? "#1d4ed8" : "#5b7cbf"}
                >
                  {a.name} · {a.mu} 亩
                </text>
              </g>
            );
          })}

        {/* 航线 */}
        {layers.routes &&
          routes.map((r) => {
            const area = areas.find((a) => a.id === r.areaId);
            if (area && selectedAreaId && area.id !== selectedAreaId) return null;
            return (
              <g key={r.id} pointerEvents="none">
                <polyline
                  points={poly(r.waypoints)}
                  fill="none"
                  stroke="#0ea5e9"
                  strokeWidth="1.8"
                  strokeDasharray="7 5"
                  opacity={r.status === "invalid" ? 0.4 : 0.9}
                />
                {r.waypoints.map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r="2.6" fill="#fff" stroke="#0ea5e9" strokeWidth="1.5" />
                ))}
              </g>
            );
          })}

        {/* 设备 */}
        {layers.docks &&
          [{ id: "DOCK-01", name: "滨江机巢", x: 236, y: 238 }, { id: "DOCK-02", name: "南湖机巢", x: 782, y: 438 }].map((d) => (
            <g key={d.id} pointerEvents="none">
              <rect x={d.x - 10} y={d.y - 10} width="20" height="20" rx="5" fill="#0f172a" opacity="0.08" />
              <rect x={d.x - 8} y={d.y - 8} width="16" height="16" rx="4" fill="#0f172a" />
              <path d={`M${d.x - 4} ${d.y} h8 M${d.x} ${d.y - 4} v8`} stroke="#e2e8f0" strokeWidth="1.4" />
              <text x={d.x} y={d.y + 24} textAnchor="middle" className="p-map-label is-strong">
                {d.name}
              </text>
            </g>
          ))}

        {layers.devices &&
          devices.map((d) => {
            const active = d.id === selectedDeviceId;
            const color = d.status === "offline" ? "#94a3b8" : d.status === "busy" ? "#2563eb" : "#16a34a";
            return (
              <g
                key={d.id}
                onClick={() => onSelectDevice?.(d.id)}
                style={{ cursor: onSelectDevice ? "pointer" : "default" }}
              >
                {active && <circle cx={d.pos.x} cy={d.pos.y} r="20" fill="rgba(37,99,235,0.12)" />}
                <circle cx={d.pos.x} cy={d.pos.y} r="9.5" fill="#fff" stroke={color} strokeWidth="2.4" />
                <path
                  d={`M${d.pos.x - 4} ${d.pos.y} h8 M${d.pos.x} ${d.pos.y - 4} v8`}
                  stroke={color}
                  strokeWidth="1.6"
                />
                <text x={d.pos.x} y={d.pos.y + 24} textAnchor="middle" className="p-map-label is-strong">
                  {d.name}
                </text>
              </g>
            );
          })}

        {/* 事件 */}
        {layers.events &&
          events.map((e) => {
            const active = e.id === focusEventId;
            return (
              <g
                key={e.id}
                onClick={() => onSelectEvent?.(e.id)}
                style={{ cursor: onSelectEvent ? "pointer" : "default" }}
              >
                <path
                  d={`M${e.pos.x} ${e.pos.y} l-7 -12 a8 8 0 1 1 14 0 z`}
                  fill={tone(e.level)}
                  stroke="#fff"
                  strokeWidth="1.5"
                />
                <circle cx={e.pos.x} cy={e.pos.y - 19} r="2.6" fill="#fff" />
                {active && (
                  <text x={e.pos.x} y={e.pos.y - 28} textAnchor="middle" className="p-map-label" fill={tone(e.level)}>
                    {e.title}
                  </text>
                )}
              </g>
            );
          })}

        {/* 绘制中的多边形 */}
        {draft && draft.length > 0 && (
          <g pointerEvents="none">
            {draft.length > 2 ? (
              <polygon points={poly(draft)} fill="rgba(22,163,74,0.12)" stroke="#16a34a" strokeWidth="2" />
            ) : (
              <polyline points={poly(draft)} fill="none" stroke="#16a34a" strokeWidth="2" />
            )}
            {draft.map((p, i) => (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r="4.5" fill="#fff" stroke="#16a34a" strokeWidth="2" />
                <text x={p.x + 8} y={p.y - 8} className="p-map-label">
                  {i + 1}
                </text>
              </g>
            ))}
          </g>
        )}
      </svg>

      <div className="p-map-zoom">
        <button onClick={() => zoom(1)} aria-label="放大">
          <Plus size={14} />
        </button>
        <button onClick={() => zoom(-1)} aria-label="缩小">
          <Minus size={14} />
        </button>
        <button
          onClick={() => setView(VB)}
          aria-label="复位"
          title="复位视角"
        >
          <RotateCcw size={13} />
        </button>
      </div>

      <div className="p-map-scale">
        <Crosshair size={11} />
        <span>模拟地图 · 非真实地理数据</span>
      </div>

      {drawMode && (
        <div className="p-map-hint">单击加点，双击区域内完成；至少 3 个点</div>
      )}
    </div>
  );
}

export function LayerToggles({ layers, onChange }: { layers: Layers; onChange: (l: Layers) => void }) {
  const items: { key: keyof Layers; label: string }[] = [
    { key: "devices", label: "设备" },
    { key: "docks", label: "机巢" },
    { key: "areas", label: "任务区域" },
    { key: "routes", label: "航线" },
    { key: "events", label: "异常点" },
  ];
  return (
    <div className="p-layer-toggles">
      {items.map((it) => (
        <label key={it.key}>
          <input
            type="checkbox"
            checked={layers[it.key]}
            onChange={(e) => onChange({ ...layers, [it.key]: e.target.checked })}
          />
          <span>{it.label}</span>
        </label>
      ))}
    </div>
  );
}

export function EvidenceThumb({
  variant = "s1",
  caption,
  height = 120,
  onClick,
}: {
  variant?: string;
  caption?: string;
  height?: number;
  onClick?: () => void;
}): ReactNode {
  const hot = { x: 96, y: 54, w: 74, h: 48 };
  return (
    <button type="button" className="p-evidence" style={{ height }} onClick={onClick}>
      <svg viewBox="0 0 280 168" preserveAspectRatio="xMidYMid slice">
        <rect width="280" height="168" fill={variant === "s3" ? "#dbe9ef" : "#dfe3e8"} />
        <path d="M0 40 H280 M0 96 H280 M70 0 V168 M190 0 V168" stroke="#c8ced6" strokeWidth="12" />
        <path d="M0 40 H280 M0 96 H280 M70 0 V168 M190 0 V168" stroke="#e9edf1" strokeWidth="8" />
        {variant === "s2" ? (
          <>
            <rect x="30" y="20" width="90" height="56" fill="#d3d8de" />
            <path d="M52 22 L86 62" stroke="#8f98a4" strokeWidth="2" />
            <rect x="150" y="104" width="104" height="44" fill="#d3d8de" />
          </>
        ) : variant === "s3" ? (
          <>
            <path d="M0 110 C60 92 120 130 180 112 C220 100 250 118 280 108 V168 H0 Z" fill="#bfd8e4" />
            <ellipse cx="150" cy="132" rx="52" ry="15" fill="#a9c3a3" opacity="0.75" />
            <ellipse cx="98" cy="146" rx="26" ry="9" fill="#a9c3a3" opacity="0.6" />
          </>
        ) : (
          <>
            <rect x="24" y="52" width="84" height="40" rx="3" fill="#c9cfd7" />
            <rect x="160" y="104" width="96" height="38" rx="3" fill="#c9cfd7" />
            <rect x="118" y="108" width="30" height="14" fill="#b9c0c9" />
          </>
        )}
        <rect
          x={hot.x}
          y={hot.y}
          width={hot.w}
          height={hot.h}
          fill="none"
          stroke="#dc2626"
          strokeWidth="2.2"
        />
        <rect x={hot.x} y={hot.y - 14} width="34" height="12" fill="#dc2626" />
        <text x={hot.x + 5} y={hot.y - 4.5} fill="#fff" fontSize="8" fontFamily="ui-monospace, monospace">
          发现
        </text>
        <text x="10" y="160" fill="#5b6472" fontSize="8.5" fontFamily="ui-monospace, monospace">
          SIM · UAV-01 · 2026-10-29
        </text>
      </svg>
      {caption && <span className="p-evidence-cap">{caption}</span>}
    </button>
  );
}
