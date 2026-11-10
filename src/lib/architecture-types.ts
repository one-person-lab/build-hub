export type DiagramKind = "actor" | "app" | "component" | "store" | "external" | "topic";

export type NodeIconName =
  | "clipboard"
  | "route"
  | "calendar"
  | "send"
  | "activity"
  | "copy"
  | "dock"
  | "drone"
  | "camera"
  | "gauge"
  | "sliders"
  | "firmware"
  | "play"
  | "crosshair"
  | "grid"
  | "share"
  | "monitor"
  | "record"
  | "map"
  | "cube"
  | "shield"
  | "history"
  | "folder"
  | "download"
  | "scan"
  | "sparkles"
  | "bell"
  | "check"
  | "report"
  | "cpu"
  | "users"
  | "key"
  | "list"
  | "message"
  | "code"
  | "link";

/** 节点强调色，仅影响图标颜色；不传则按 kind 取色 */
export type NodeTone = "green" | "blue" | "cyan" | "violet" | "amber" | "rose";

export type DiagramNode = {
  id: string;
  label: string;
  desc?: string;
  tech?: string;
  kind: DiagramKind;
  icon?: NodeIconName;
  tone?: NodeTone;
  x: number;
  y: number;
  w?: number;
  h?: number;
};

export type DiagramGroup = {
  id: string;
  label: string;
  sub?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  external?: boolean;
  /** 分组名默认在左上角；left 为左栏式层名（分层图用） */
  labelPos?: "top" | "left";
  /** labelPos 为 left 时的左栏宽度 */
  labelW?: number;
};

export type EdgeSide = "top" | "bottom" | "left" | "right";

export type DiagramEdge = {
  from: string;
  to: string;
  label: string;
  fromSide?: EdgeSide;
  toSide?: EdgeSide;
  dashed?: boolean;
  /** 正交折线的中间拐点 x（竖直段）或 y（水平段） */
  via?: number;
  labelAt?: [number, number];
};

export type DiagramFlow = { id: string; label: string; note: string; focus: string[] };

export type Lifeline = { id: string; label: string; sub?: string; x: number };

export type SeqMessage = {
  from: string;
  to: string;
  y: number;
  label: string;
  dashed?: boolean;
};

export type DiagramSpec = {
  id: string;
  title: string;
  en: string;
  category: "product" | "system" | "core";
  required: boolean;
  desc: string;
  vb: { w: number; h: number };
  caption?: string;
  groups?: DiagramGroup[];
  nodes?: DiagramNode[];
  edges?: DiagramEdge[];
  flows?: DiagramFlow[];
  sequence?: {
    top: number;
    bottom: number;
    lifelines: Lifeline[];
    messages: SeqMessage[];
  };
};

export type ArchitecturePlatform = {
  id: string;
  name: string;
  en: string;
  tagline: string;
  diagrams: DiagramSpec[];
};