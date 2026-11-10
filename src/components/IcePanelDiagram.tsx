"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import type {
  DiagramEdge,
  DiagramKind,
  DiagramNode,
  DiagramSpec,
  EdgeSide,
  NodeIconName,
} from "@/lib/architecture-types";
import "./IcePanelDiagram.css";

const NODE_W = 176;
const NODE_H = 92;
const STORE_H = 100;

function size(n: DiagramNode): { w: number; h: number } {
  return { w: n.w ?? NODE_W, h: n.h ?? (n.kind === "store" ? STORE_H : NODE_H) };
}

function anchor(n: DiagramNode, side: EdgeSide): [number, number] {
  const { w, h } = size(n);
  switch (side) {
    case "top": return [n.x + w / 2, n.y];
    case "bottom": return [n.x + w / 2, n.y + h];
    case "left": return [n.x, n.y + h / 2];
    case "right": return [n.x + w, n.y + h / 2];
  }
}

function edgeGeometry(e: DiagramEdge, nodes: DiagramNode[]): { d: string; label: [number, number] } {
  const from = nodes.find((n) => n.id === e.from)!;
  const to = nodes.find((n) => n.id === e.to)!;
  const fs = e.fromSide ?? "bottom";
  const ts = e.toSide ?? "top";
  const [x1, y1] = anchor(from, fs);
  const [x2, y2] = anchor(to, ts);
  let pts: [number, number][];
  const vertical = (s: EdgeSide) => s === "top" || s === "bottom";
  if (vertical(fs) && vertical(ts)) {
    if (x1 === x2) pts = [[x1, y1], [x2, y2]];
    else {
      const my = e.via ?? (y1 + y2) / 2;
      pts = [[x1, y1], [x1, my], [x2, my], [x2, y2]];
    }
  } else if (!vertical(fs) && !vertical(ts)) {
    if (y1 === y2) pts = [[x1, y1], [x2, y2]];
    else {
      const mx = e.via ?? (x1 + x2) / 2;
      pts = [[x1, y1], [mx, y1], [mx, y2], [x2, y2]];
    }
  } else if (vertical(fs)) {
    pts = [[x1, y1], [x1, y2], [x2, y2]];
  } else {
    pts = [[x1, y1], [x2, y1], [x2, y2]];
  }
  const r = 10;
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [px, py] = pts[i - 1];
    const [cx, cy] = pts[i];
    const [nx, ny] = pts[i + 1];
    const inLen = Math.hypot(cx - px, cy - py);
    const outLen = Math.hypot(nx - cx, ny - cy);
    const rr = Math.min(r, inLen / 2, outLen / 2);
    const ax = cx - ((cx - px) / inLen) * rr;
    const ay = cy - ((cy - py) / inLen) * rr;
    const bx = cx + ((nx - cx) / outLen) * rr;
    const by = cy + ((ny - cy) / outLen) * rr;
    d += ` L ${ax} ${ay} Q ${cx} ${cy} ${bx} ${by}`;
  }
  d += ` L ${pts[pts.length - 1][0]} ${pts[pts.length - 1][1]}`;
  let best = 0;
  let bestLen = -1;
  for (let i = 0; i < pts.length - 1; i++) {
    const len = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
    if (len > bestLen) { bestLen = len; best = i; }
  }
  const label: [number, number] = e.labelAt ?? [
    (pts[best][0] + pts[best + 1][0]) / 2,
    (pts[best][1] + pts[best + 1][1]) / 2,
  ];
  return { d, label };
}

function labelWidth(label: string): number {
  return [...label].reduce((s, ch) => s + (ch.charCodeAt(0) > 255 ? 10.5 : 6.2), 0) + 16;
}

const ICON_PATHS: Record<NodeIconName, ReactNode> = {
  clipboard: (
    <>
      <rect x="5" y="4" width="14" height="17" rx="2.5" />
      <path d="M9 4V3h6v1M9 11h6M9 15h4" />
    </>
  ),
  route: (
    <>
      <circle cx="5" cy="18" r="2.2" />
      <circle cx="19" cy="6" r="2.2" />
      <path d="M7.2 18h6.3a3.5 3.5 0 0 0 0-7H10a3.5 3.5 0 0 1 0-7h1" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 10h16M8 3v4M16 3v4M8 14h.01M12 14h.01M16 14h.01" />
    </>
  ),
  send: <path d="M21 3 10.5 13.5M21 3l-6.8 18-3.7-7.5L3 9.8 21 3Z" />,
  activity: <path d="M3 12h4l2.5-6 4 12L16 12h5" />,
  copy: (
    <>
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" />
    </>
  ),
  dock: (
    <>
      <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-9.5Z" />
      <path d="M9 21v-6h6v6" />
    </>
  ),
  drone: (
    <>
      <circle cx="5.5" cy="5.5" r="2.2" />
      <circle cx="18.5" cy="5.5" r="2.2" />
      <circle cx="5.5" cy="18.5" r="2.2" />
      <circle cx="18.5" cy="18.5" r="2.2" />
      <path d="m7.2 7.2 9.6 9.6M16.8 7.2l-9.6 9.6" />
      <circle cx="12" cy="12" r="1.8" />
    </>
  ),
  camera: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2.5" />
      <circle cx="12" cy="13.5" r="3.6" />
      <path d="m8 7 1.6-2.5h4.8L16 7" />
    </>
  ),
  gauge: (
    <>
      <path d="M4 17a8 8 0 1 1 16 0" />
      <path d="m12 17 4.2-6.4" />
    </>
  ),
  sliders: (
    <>
      <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
      <circle cx="15" cy="7" r="2" />
      <circle cx="9" cy="17" r="2" />
    </>
  ),
  firmware: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 16.5v-9M8.5 11 12 7.5l3.5 3.5" />
    </>
  ),
  play: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m10 8.5 5.5 3.5-5.5 3.5v-7Z" />
    </>
  ),
  crosshair: (
    <>
      <circle cx="12" cy="12" r="7.5" />
      <path d="M12 2.5v4M12 17.5v4M2.5 12h4M17.5 12h4" />
      <circle cx="12" cy="12" r="1.6" />
    </>
  ),
  grid: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </>
  ),
  share: (
    <>
      <circle cx="6" cy="12" r="2.4" />
      <circle cx="18" cy="6" r="2.4" />
      <circle cx="18" cy="18" r="2.4" />
      <path d="m8.2 10.9 7.6-3.8M8.2 13.1l7.6 3.8" />
    </>
  ),
  monitor: (
    <>
      <rect x="3" y="4" width="18" height="13" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </>
  ),
  record: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3.4" fill="currentColor" stroke="none" />
    </>
  ),
  map: (
    <>
      <path d="M9 4 3.5 6.3v13.4L9 17.4l6 2.3 5.5-2.3V4L15 6.3 9 4Z" />
      <path d="M9 4v13.4M15 6.3v13.4" />
    </>
  ),
  cube: (
    <>
      <path d="M12 3 20 7.5v9L12 21l-8-4.5v-9L12 3Z" />
      <path d="m12 12 8-4.5M12 12v9M12 12 4 7.5" />
    </>
  ),
  shield: <path d="M12 3 19 6v5.5c0 4.8-3.2 7.8-7 9.5-3.8-1.7-7-4.7-7-9.5V6l7-3Z" />,
  history: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.2l3.4 2" />
    </>
  ),
  folder: <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5h3.2l2 2.5h7.8A2.5 2.5 0 0 1 21 10v8a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 18V7.5Z" />,
  download: <path d="M12 4v10M8 10.5l4 4 4-4M5 20h14" />,
  scan: (
    <>
      <path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16" />
      <path d="M4 12h16" />
    </>
  ),
  sparkles: (
    <>
      <path d="M12 3.5 13.8 8l4.5 1.8-4.5 1.8L12 16l-1.8-4.4L5.7 9.8 10.2 8 12 3.5Z" />
      <path d="m18.5 15 .9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9.9-2.1Z" />
    </>
  ),
  bell: (
    <>
      <path d="M18 16.5v-5a6 6 0 1 0-12 0v5L4 19.5h16l-2-3Z" />
      <path d="M10 21a2 2 0 0 0 4 0" />
    </>
  ),
  check: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.3 2.7 2.7 5.3-5.3" />
    </>
  ),
  report: (
    <>
      <path d="M6 3h7.5L18 7.5V21H6V3Z" />
      <path d="M13.5 3v4.5H18M9 12h6M9 16h6" />
    </>
  ),
  cpu: (
    <>
      <rect x="6" y="6" width="12" height="12" rx="2" />
      <path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4" />
      <rect x="10" y="10" width="4" height="4" rx="1" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c.7-3.4 3-5.2 6-5.2s5.3 1.8 6 5.2" />
      <path d="M16 5.5a3.2 3.2 0 0 1 0 6M17.5 14.8c2 .6 3.3 2.2 3.8 4.7" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="15.5" r="3.6" />
      <path d="m10.6 13 9.4-9.4M17 6.6l2.6 2.6M14.6 9l2.6 2.6" />
    </>
  ),
  list: (
    <>
      <path d="M8.5 6h12M8.5 12h12M8.5 18h12" />
      <circle cx="4" cy="6" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="4" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="4" cy="18" r="1.2" fill="currentColor" stroke="none" />
    </>
  ),
  message: (
    <>
      <path d="M4 5.5h16V17H9.5L4 21V5.5Z" />
      <path d="M8 10h8M8 13.5h5" />
    </>
  ),
  code: <path d="m8 8-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14" />,
  link: (
    <>
      <path d="M10 13.5a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1l-1 1" />
      <path d="M14 10.5a5 5 0 0 0-7.1 0l-2 2a5 5 0 0 0 7.1 7.1l1-1" />
    </>
  ),
};

function NodeIcon({ kind, name }: { kind: DiagramKind; name?: NodeIconName }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };
  if (name) {
    return <svg {...common}>{ICON_PATHS[name]}</svg>;
  }
  switch (kind) {
    case "actor":
      return (
        <svg {...common}><circle cx="12" cy="8" r="3.4" /><path d="M5.5 20c.8-3.6 3.4-5.4 6.5-5.4s5.7 1.8 6.5 5.4" /></svg>
      );
    case "app":
      return (
        <svg {...common}><rect x="3" y="4.5" width="18" height="14" rx="2.5" /><path d="M3 9h18M6.2 6.8h.01M8.8 6.8h.01" /></svg>
      );
    case "store":
      return (
        <svg {...common}><ellipse cx="12" cy="6" rx="7.5" ry="2.8" /><path d="M4.5 6v12c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8V6M4.5 12c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8" /></svg>
      );
    case "external":
      return (
        <svg {...common}><rect x="3.5" y="3.5" width="17" height="17" rx="3.5" /><path d="M9.5 14.5 15 9M11 8.5h4.5V13" /></svg>
      );
    case "topic":
      return (
        <svg {...common}><circle cx="6" cy="6" r="2.2" /><circle cx="18" cy="6" r="2.2" /><circle cx="6" cy="18" r="2.2" /><circle cx="18" cy="18" r="2.2" /><path d="M8.2 6h7.6M6 8.2v7.6M18 8.2v7.6M8.2 18h7.6" /></svg>
      );
    default:
      return (
        <svg {...common}><path d="M4 7.5 12 3l8 4.5-8 4.5-8-4.5ZM4 12l8 4.5 8-4.5M4 16.5 12 21l8-4.5" /></svg>
      );
  }
}

function NodeCard({ n }: { n: DiagramNode }) {
  const { w, h } = size(n);
  const cx = w / 2;
  const cls = `ipd-node kind-${n.kind}${n.tone ? ` tone-${n.tone}` : ""}`;
  if (n.kind === "actor") {
    return (
      <g className={cls} data-node={n.id}>
        <circle cx={cx} cy={-17} r={13} className="ipd-actor-head" />
        <g transform={`translate(${cx - 9} -26)`} className="ipd-actor-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="12" cy="8.5" r="3.2" /><path d="M6 19.5c.8-3.2 3.2-4.8 6-4.8s5.2 1.6 6 4.8" />
          </svg>
        </g>
        <rect x={0} y={0} width={w} height={h} rx={12} className="ipd-card" />
        <text x={cx} y={h / 2 - 4} className="ipd-name" textAnchor="middle">{n.label}</text>
        <text x={cx} y={h / 2 + 15} className="ipd-desc" textAnchor="middle">{n.desc}</text>
      </g>
    );
  }
  if (n.kind === "store") {
    const ry = 10;
    return (
      <g className={cls} data-node={n.id}>
        <path
          className="ipd-card ipd-cylinder"
          d={`M 0 ${ry} A ${cx} ${ry} 0 0 1 ${w} ${ry} L ${w} ${h - ry} A ${cx} ${ry} 0 0 1 0 ${h - ry} Z`}
        />
        <path className="ipd-cylinder-lid" d={`M 0 ${ry} A ${cx} ${ry} 0 0 0 ${w} ${ry}`} />
        <text x={cx} y={40} className="ipd-name" textAnchor="middle">{n.label}</text>
        <text x={cx} y={59} className="ipd-desc" textAnchor="middle">{n.desc}</text>
        <text x={cx} y={78} className="ipd-tech" textAnchor="middle">{n.tech}</text>
      </g>
    );
  }
  return (
    <g className={cls} data-node={n.id}>
      <rect x={0} y={0} width={w} height={h} rx={12} className="ipd-card" />
      <g transform={`translate(${cx - 9} 12)`} className="ipd-icon">
        <NodeIcon kind={n.kind} name={n.icon} />
      </g>
      <text x={cx} y={50} className="ipd-name" textAnchor="middle">{n.label}</text>
      <text x={cx} y={67} className="ipd-desc" textAnchor="middle">{n.desc}</text>
      <text x={cx} y={83} className="ipd-tech" textAnchor="middle">{n.tech}</text>
    </g>
  );
}

function EdgeLabel({ x, y, label }: { x: number; y: number; label: string }) {
  const lw = labelWidth(label);
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-lw / 2} y={-11} width={lw} height={22} rx={6} className="ipd-edge-pill" />
      <text className="ipd-edge-label" textAnchor="middle" dominantBaseline="central">{label}</text>
    </g>
  );
}

/** 静态缩略：同一张图按原比例缩小，列表卡片用 */
export function DiagramStatic({ spec }: { spec: DiagramSpec }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const dots = `ipd-dots-${uid}`;
  const arrow = `ipd-arrow-${uid}`;
  return (
    <svg
      className="ipd-svg ipd-static"
      viewBox={`0 0 ${spec.vb.w} ${spec.vb.h}`}
      role="img"
      aria-label={spec.title}
    >
      <Defs dots={dots} arrow={arrow} />
      <rect x={0} y={0} width={spec.vb.w} height={spec.vb.h} fill={`url(#${dots})`} />
      <DiagramBody spec={spec} arrow={arrow} />
    </svg>
  );
}

function Defs({ dots, arrow }: { dots: string; arrow: string }) {
  return (
    <defs>
      <pattern id={dots} width="26" height="26" patternUnits="userSpaceOnUse">
        <circle cx="1.3" cy="1.3" r="1.3" className="ipd-dot" />
      </pattern>
      <marker id={arrow} viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M 0.5 1.5 L 8.5 5 L 0.5 8.5" className="ipd-arrowhead" />
      </marker>
    </defs>
  );
}

function DiagramBody({
  spec,
  arrow,
  focus,
}: {
  spec: DiagramSpec;
  arrow: string;
  focus?: Set<string> | null;
}) {
  const dimNode = (id: string) => focus != null && !focus.has(id);
  const dimEdge = (from: string, to: string) => focus != null && !(focus.has(from) && focus.has(to));
  if (spec.sequence) {
    const { top, bottom, lifelines, messages } = spec.sequence;
    const lx = (id: string) => lifelines.find((l) => l.id === id)!.x;
    return (
      <>
        {lifelines.map((l) => (
          <g key={l.id} className={dimNode(l.id) ? "is-dim" : undefined}>
            <line x1={l.x} y1={top + 64} x2={l.x} y2={bottom} className="ipd-lifeline" />
            <rect x={l.x - 88} y={top} width={176} height={64} rx={12} className="ipd-card" />
            <text x={l.x} y={top + 28} className="ipd-name" textAnchor="middle">{l.label}</text>
            {l.sub ? <text x={l.x} y={top + 47} className="ipd-desc" textAnchor="middle">{l.sub}</text> : null}
          </g>
        ))}
        {messages.map((m, i) => {
          const x1 = lx(m.from);
          const x2 = lx(m.to);
          const dir = x2 > x1 ? 1 : -1;
          return (
            <g key={i} className={`ipd-edge${m.dashed ? " is-dashed" : ""}${dimEdge(m.from, m.to) ? " is-dim" : ""}`}>
              <line x1={x1} y1={m.y} x2={x2 - dir * 4} y2={m.y} className="ipd-edge-line" markerEnd={`url(#${arrow})`} />
              <EdgeLabel x={(x1 + x2) / 2} y={m.y - 16} label={m.label} />
            </g>
          );
        })}
        {spec.caption ? (
          <text x={spec.vb.w - 24} y={spec.vb.h - 16} className="ipd-caption" textAnchor="end">{spec.caption}</text>
        ) : null}
      </>
    );
  }
  const nodes = spec.nodes ?? [];
  return (
    <>
      {(spec.groups ?? []).map((g) => {
        const left = g.labelPos === "left";
        const lw = g.labelW ?? 150;
        return (
          <g key={g.id} className={`ipd-group${g.external ? " is-external" : ""}${left ? " has-label-left" : ""}`}>
            <rect x={g.x} y={g.y} width={g.w} height={g.h} rx={16} className="ipd-group-box" />
            {left ? (
              <>
                <line x1={g.x + lw} y1={g.y + 18} x2={g.x + lw} y2={g.y + g.h - 18} className="ipd-group-divider" />
                <text x={g.x + 22} y={g.y + g.h / 2 + (g.sub ? -6 : 4)} className="ipd-group-name">{g.label}</text>
                {g.sub ? <text x={g.x + 22} y={g.y + g.h / 2 + 16} className="ipd-group-sub">{g.sub}</text> : null}
              </>
            ) : (
              <>
                <text x={g.x + 18} y={g.y + 27} className="ipd-group-name">{g.label}</text>
                {g.sub ? <text x={g.x + 18} y={g.y + 45} className="ipd-group-sub">{g.sub}</text> : null}
              </>
            )}
          </g>
        );
      })}
      {(spec.edges ?? []).map((e) => {
        const { d, label } = edgeGeometry(e, nodes);
        return (
          <g key={`${e.from}-${e.to}-${e.label}`} className={`ipd-edge${e.dashed ? " is-dashed" : ""}${dimEdge(e.from, e.to) ? " is-dim" : ""}`}>
            <path d={d} className="ipd-edge-line" markerEnd={`url(#${arrow})`} />
            <EdgeLabel x={label[0]} y={label[1]} label={e.label} />
          </g>
        );
      })}
      {nodes.map((n) => (
        <g key={n.id} transform={`translate(${n.x} ${n.y})`} className={dimNode(n.id) ? "is-dim" : undefined}>
          <NodeCard n={n} />
        </g>
      ))}
      {spec.caption ? (
        <text x={spec.vb.w - 24} y={spec.vb.h - 16} className="ipd-caption" textAnchor="end">{spec.caption}</text>
      ) : null}
    </>
  );
}

export default function IcePanelDiagram({ spec }: { spec: DiagramSpec }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const dots = `ipd-dots-${uid}`;
  const arrow = `ipd-arrow-${uid}`;
  const VB = { x: 0, y: 0, w: spec.vb.w, h: spec.vb.h };
  const [flow, setFlow] = useState<string | null>(null);
  const [view, setView] = useState(VB);
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);
  const flows = spec.flows ?? [];
  const active = flows.find((f) => f.id === flow) ?? null;
  const focus = active ? new Set(active.focus) : null;
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // 降级 fixed 全屏（无 Fullscreen API 的环境）用 Escape 退出
  useEffect(() => {
    if (!isFullscreen || document.fullscreenElement) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isFullscreen]);

  const toggleFullscreen = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
      return;
    }
    if (isFullscreen) {
      setIsFullscreen(false);
      return;
    }
    if (el.requestFullscreen) {
      void el.requestFullscreen().catch(() => setIsFullscreen(true));
    } else {
      setIsFullscreen(true);
    }
  }, [isFullscreen]);

  const zoom = useCallback((factor: number) => {
    setView((v) => {
      const w = Math.min(spec.vb.w * 1.5, Math.max(spec.vb.w * 0.35, v.w * factor));
      const h = (w / spec.vb.w) * spec.vb.h;
      return { x: v.x + (v.w - w) / 2, y: v.y + (v.h - h) / 2, w, h };
    });
  }, [spec.vb.w, spec.vb.h]);

  const onWheel = useCallback((e: React.WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    zoom(e.deltaY > 0 ? 1.12 : 0.89);
  }, [zoom]);

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    drag.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!drag.current || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scale = view.w / rect.width;
    const dx = (e.clientX - drag.current.x) * scale;
    const dy = (e.clientY - drag.current.y) * scale;
    if (Math.abs(dx) + Math.abs(dy) < 2) return;
    setView((v) => ({ ...v, x: drag.current!.vx - dx, y: drag.current!.vy - dy }));
  };
  const onPointerUp = () => { drag.current = null; };

  return (
    <div
      ref={wrapRef}
      className={"ipd-canvas-wrap" + (isFullscreen ? " is-fullscreen" : "")}
    >
      <div className="ipd-toolbar">
          {flows.length > 0 ? (
            <div className="ipd-flows" role="tablist" aria-label="链路视图">
              <button
                type="button"
                role="tab"
                aria-selected={flow === null}
                className={flow === null ? "is-on" : ""}
                onClick={() => setFlow(null)}
              >
                全景
              </button>
              {flows.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  role="tab"
                  aria-selected={flow === f.id}
                  className={flow === f.id ? "is-on" : ""}
                  onClick={() => setFlow((cur) => (cur === f.id ? null : f.id))}
                >
                  {f.label}
                </button>
              ))}
            </div>
          ) : <span />}
          <div className="ipd-zoom">
            <button type="button" aria-label="放大" onClick={() => zoom(0.85)}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
            </button>
            <button type="button" aria-label="缩小" onClick={() => zoom(1.18)}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14" /></svg>
            </button>
            <button type="button" aria-label="重置视图" onClick={() => setView(VB)}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5" /></svg>
            </button>
            <button
              type="button"
              aria-label={isFullscreen ? "退出全屏" : "全屏"}
              onClick={toggleFullscreen}
            >
              {isFullscreen ? (
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3v3a2 2 0 0 1-2 2H3M16 3v3a2 2 0 0 0 2 2h3M8 21v-3a2 2 0 0 0-2-2H3M16 21v-3a2 2 0 0 1 2-2h3" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" /></svg>
              )}
            </button>
          </div>
      </div>
      <svg
        ref={svgRef}
        className="ipd-svg"
        style={isFullscreen ? undefined : { aspectRatio: `${spec.vb.w} / ${spec.vb.h}` }}
        viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
        role="img"
        aria-label={spec.title}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <Defs dots={dots} arrow={arrow} />
        <rect x={-1200} y={-800} width={spec.vb.w + 2400} height={spec.vb.h + 1600} fill={`url(#${dots})`} />
        <DiagramBody spec={spec} arrow={arrow} focus={focus} />
      </svg>
      {active ? <p className="ipd-flow-note">{active.note}</p> : null}
    </div>
  );
}