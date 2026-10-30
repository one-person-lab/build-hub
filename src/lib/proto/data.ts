/* 原型用 Mock 数据：所有页面共用同一批实体，靠 ID 互相关联。不连接任何真实设备。 */

export type Pos = { x: number; y: number };

export type DeviceStatus = "online" | "offline" | "busy";

export interface Device {
  id: string;
  name: string;
  model: string;
  dockId: string;
  battery: number;
  payload: string;
  status: DeviceStatus;
  pos: Pos;
  taskId?: string;
}

export interface Dock {
  id: string;
  name: string;
  pos: Pos;
  online: boolean;
  drones: number;
}

export interface Area {
  id: string;
  name: string;
  polygon: Pos[];
  mu: number;
}

export interface Waypoint extends Pos {
  alt: number;
  speed: number;
}

export type RouteStatus = "published" | "draft" | "invalid";

export interface RoutePlan {
  id: string;
  name: string;
  areaId: string;
  version: string;
  waypoints: Waypoint[];
  status: RouteStatus;
  updatedAt: string;
  versions: { v: string; note: string; at: string }[];
}

export type TaskStatus = "pending_confirm" | "queued" | "running" | "done" | "failed" | "cancelled";

export interface TaskStep {
  key: string;
  label: string;
  state: "done" | "active" | "todo" | "error";
  at?: string;
  note?: string;
}

export interface CheckItem {
  level: "ok" | "warn" | "error";
  text: string;
}

export interface Task {
  id: string;
  name: string;
  type: string;
  deviceId: string;
  areaId: string;
  routeId: string;
  status: TaskStatus;
  progress: number;
  createdAt: string;
  operator: string;
  planVersion: string;
  alt?: number;
  speed?: number;
  checks: CheckItem[];
  steps: TaskStep[];
  eventIds: string[];
  reportId?: string;
  traceId: string;
  sessionId?: string;
  cancelState?: "requesting" | "cancelling" | "cancelled";
  note?: string;
  skillId?: string;
  skillVersionId?: string;
}

export type EventStatus = "pending" | "processing" | "resolved" | "false_positive";

export interface DroneEvent {
  id: string;
  title: string;
  type: string;
  level: "high" | "mid" | "low";
  areaId: string;
  pos: Pos;
  at: string;
  taskId: string;
  status: EventStatus;
  confidence: number;
  evidence: string;
  note: string;
  handler?: string;
  disposal?: string;
}

export type NodeType = "trigger" | "query" | "branch" | "guard" | "ai" | "action" | "approve" | "end";

export interface WorkflowNode {
  id: string;
  type: NodeType;
  label: string;
  x: number;
  y: number;
  config: string;
}

export type WorkflowTriggerKind = "schedule" | "event" | "telemetry" | "manual";

export interface WorkflowResource {
  kind: "area" | "device" | "route" | "task" | "analysis" | "notify" | "approval";
  label: string;
  ref?: string;
  state: "linked" | "missing";
  note?: string;
}

export interface WorkflowChange {
  at: string;
  by: string;
  source: "copilot" | "canvas" | "system";
  rev: number;
  text: string;
}

export interface WorkflowLogLine {
  at: string;
  nodeId: string;
  nodeLabel: string;
  level: "info" | "ok" | "warn" | "error";
  text: string;
}

export interface WorkflowRun {
  id: string;
  at: string;
  state: "ok" | "failed" | "running";
  ms: number;
  failedNode?: string;
  triggerNote?: string;
  traceId?: string;
  logs?: WorkflowLogLine[];
}

export interface Workflow {
  id: string;
  name: string;
  trigger: string;
  status: "published" | "draft";
  lastRun: string;
  successRate: number;
  nodes: WorkflowNode[];
  edges: { from: string; to: string; label?: string }[];
  runs: WorkflowRun[];
  source?: "copilot" | "manual";
  enabled?: boolean;
  triggerKind?: WorkflowTriggerKind;
  schedule?: string;
  version?: string;
  rev?: number;
  updatedAt?: string;
  updatedBy?: string;
  originSession?: string;
  resources?: WorkflowResource[];
  missing?: string[];
  history?: WorkflowChange[];
}

export interface ToolParam {
  name: string;
  type: "string" | "number" | "boolean" | "enum" | "object";
  required: boolean;
  desc: string;
  enumValues?: string[];
}

export interface ToolDef {
  id: string;
  name: string;
  group: string;
  desc: string;
  method: "read" | "write";
  params: ToolParam[];
  output: string;
  risk: "low" | "mid" | "high";
  needConfirm: boolean;
  timeout: number;
  errors: string[];
  status: "enabled" | "disabled";
  calls: number;
  latency: number;
  /** 工具的实际提供方式：MCP 适配器或内部业务 API；两者都走同一套权限与审计 */
  source: "mcp" | "internal";
  scope: string;
  mcpServerId?: string;
  mcpTool?: string;
}

export interface TraceStep {
  key: string;
  label: string;
  kind: "message" | "intent" | "query" | "tool" | "guard" | "confirm" | "result" | "retrieval";
  state: "done" | "error" | "waiting";
  startedAt: string;
  ms: number;
  input: string;
  output: string;
  error?: string;
}

export interface Trace {
  id: string;
  taskId?: string;
  sessionId?: string;
  agentId: string;
  totalMs: number;
  status: "ok" | "error" | "running";
  steps: TraceStep[];
  retrievalRunId?: string;
  skillId?: string;
  skillVersionId?: string;
  promptVersion?: string;
  workflowId?: string;
  workflowVersion?: string;
}

export type ChatRole = "user" | "assistant" | "system";

export interface ChatMsg {
  id: string;
  role: ChatRole;
  text: string;
  at: string;
  path?: "rag" | "tool" | "agent" | "rag+tool";
  traceId?: string;
  card?:
    | { kind: "device"; deviceId: string; alert?: string }
    | { kind: "taskList"; taskIds: string[] }
    | { kind: "plan"; taskId: string }
    | { kind: "confirm"; taskId: string }
    | { kind: "progress"; taskId: string }
    | { kind: "result"; taskId: string }
    | { kind: "citations"; runId: string }
    | { kind: "skill"; skillId: string; confidence: number }
    | { kind: "skillRun"; runId: string }
    | { kind: "askArea" }
    | { kind: "workflow"; workflowId: string; created?: boolean };
}

export interface Session {
  id: string;
  title: string;
  at: string;
  mode: string;
  msgs: ChatMsg[];
  workflowId?: string;
}

export interface Report {
  id: string;
  name: string;
  taskId: string;
  at: string;
  status: "ready" | "generating";
  summary: string;
}

export interface TestCase {
  id: string;
  name: string;
  input: string;
  expected: string;
  actual: string;
  pass: boolean;
  failReason?: string;
  toolId?: string;
  traceId?: string;
}

export interface KbDoc {
  id: string;
  name: string;
  source: string;
  size: string;
  indexedAt: string;
  state: "indexed" | "indexing" | "failed";
  chunks: number;
  citations: number;
  type?: "manual" | "regulation" | "sop" | "faq" | "case";
  owner?: string;
  version?: string;
  pages?: number;
  stage?: number;
  stageLabel?: string;
  stageProgress?: number;
  error?: string;
}

export interface AgentVersion {
  id: string;
  agentId: string;
  version: string;
  state: "draft" | "published" | "archived";
  note: string;
  at: string;
  author: string;
}

export const now = () => new Date().toISOString();

export const DOCK: Dock[] = [
  { id: "DOCK-01", name: "滨江机巢", pos: { x: 236, y: 238 }, online: true, drones: 2 },
  { id: "DOCK-02", name: "南湖机巢", pos: { x: 782, y: 438 }, online: true, drones: 2 },
];

export const DEVICES: Device[] = [
  {
    id: "UAV-01",
    name: "M30T-01",
    model: "经纬 M30T",
    dockId: "DOCK-01",
    battery: 82,
    payload: "双光吊舱 + 喊话器",
    status: "busy",
    pos: { x: 300, y: 262 },
  },
  {
    id: "UAV-02",
    name: "M30T-02",
    model: "经纬 M30T",
    dockId: "DOCK-01",
    battery: 64,
    payload: "双光吊舱",
    status: "online",
    pos: { x: 520, y: 330 },
  },
  {
    id: "UAV-03",
    name: "M350-01",
    model: "Matrice 350 RTK",
    dockId: "DOCK-02",
    battery: 31,
    payload: "变焦相机 + 激光测距",
    status: "offline",
    pos: { x: 760, y: 430 },
  },
  {
    id: "UAV-04",
    name: "M3E-01",
    model: "Mavic 3E",
    dockId: "DOCK-02",
    battery: 95,
    payload: "广角相机",
    status: "online",
    pos: { x: 180, y: 470 },
  },
];

export const AREAS: Area[] = [
  {
    id: "A-01",
    name: "滨江东路消防通道",
    mu: 42,
    polygon: [
      { x: 300, y: 180 },
      { x: 470, y: 176 },
      { x: 494, y: 286 },
      { x: 318, y: 300 },
    ],
  },
  {
    id: "A-02",
    name: "南湖公园北门",
    mu: 118,
    polygon: [
      { x: 640, y: 300 },
      { x: 820, y: 292 },
      { x: 848, y: 430 },
      { x: 660, y: 446 },
    ],
  },
  {
    id: "A-03",
    name: "工业园 B 区",
    mu: 86,
    polygon: [
      { x: 120, y: 90 },
      { x: 300, y: 84 },
      { x: 312, y: 196 },
      { x: 128, y: 202 },
    ],
  },
];

const wp = (x: number, y: number, alt: number, speed = 8): Waypoint => ({ x, y, alt, speed });

export const ROUTES: RoutePlan[] = [
  {
    id: "R-001",
    name: "滨江东路消防通道巡检",
    areaId: "A-01",
    version: "v3",
    status: "published",
    updatedAt: "2026-10-27 09:12",
    versions: [
      { v: "v3", note: "加密航点，转弯半径下调至 6m", at: "2026-10-27 09:12" },
      { v: "v2", note: "高度 45m → 55m", at: "2026-10-24 16:40" },
      { v: "v1", note: "初始草稿", at: "2026-10-21 10:05" },
    ],
    waypoints: [
      wp(308, 188, 55, 6),
      wp(352, 184, 55, 6),
      wp(396, 181, 55, 6),
      wp(440, 179, 55, 6),
      wp(470, 188, 55, 6),
      wp(482, 214, 55, 6),
      wp(486, 244, 55, 6),
      wp(472, 272, 55, 6),
      wp(430, 284, 55, 6),
      wp(386, 288, 55, 6),
      wp(342, 292, 55, 6),
      wp(312, 284, 55, 6),
    ],
  },
  {
    id: "R-002",
    name: "南湖公园周界巡查",
    areaId: "A-02",
    version: "v2",
    status: "published",
    updatedAt: "2026-10-25 14:02",
    versions: [
      { v: "v2", note: "新增东侧水域航点", at: "2026-10-25 14:02" },
      { v: "v1", note: "初始草稿", at: "2026-10-18 11:20" },
    ],
    waypoints: [
      wp(650, 312, 60),
      wp(720, 306, 60),
      wp(796, 300, 60),
      wp(828, 340, 60),
      wp(834, 396, 60),
      wp(800, 428, 60),
      wp(724, 434, 60),
      wp(668, 430, 60),
      wp(646, 386, 60),
      wp(646, 340, 60),
    ],
  },
  {
    id: "R-003",
    name: "工业园 B 区立面检查",
    areaId: "A-03",
    version: "v5",
    status: "draft",
    updatedAt: "2026-10-29 08:36",
    versions: [
      { v: "v5", note: "草稿：南侧外墙补 4 个斜拍点", at: "2026-10-29 08:36" },
      { v: "v4", note: "高度 80m → 65m", at: "2026-10-22 17:11" },
    ],
    waypoints: [
      wp(132, 100, 65),
      wp(186, 96, 65),
      wp(240, 94, 65),
      wp(292, 92, 65),
      wp(302, 130, 65),
      wp(302, 172, 65),
      wp(246, 180, 65),
      wp(190, 186, 65),
      wp(136, 190, 65),
    ],
  },
  {
    id: "R-004",
    name: "高架桥下堆积物排查",
    areaId: "A-03",
    version: "v1",
    status: "published",
    updatedAt: "2026-10-20 10:48",
    versions: [{ v: "v1", note: "初始版本", at: "2026-10-20 10:48" }],
    waypoints: [wp(150, 210, 35), wp(230, 214, 35), wp(286, 220, 35), wp(300, 250, 35), wp(220, 254, 35)],
  },
  {
    id: "R-005",
    name: "河道漂浮物巡查",
    areaId: "A-02",
    version: "v2",
    status: "published",
    updatedAt: "2026-10-23 15:30",
    versions: [
      { v: "v2", note: "沿河道中心线加密", at: "2026-10-23 15:30" },
      { v: "v1", note: "初始版本", at: "2026-10-19 09:02" },
    ],
    waypoints: [wp(560, 470, 40), wp(640, 500, 40), wp(730, 520, 40), wp(820, 540, 40), wp(880, 560, 40)],
  },
  {
    id: "R-006",
    name: "滨江东路夜巡",
    areaId: "A-01",
    version: "v1",
    status: "invalid",
    updatedAt: "2026-10-28 21:14",
    versions: [{ v: "v1", note: "草稿：缺少返航高度", at: "2026-10-28 21:14" }],
    waypoints: [wp(320, 220, 0), wp(400, 240, 0), wp(470, 260, 0)],
  },
];

const baseSteps = (st: TaskStatus): TaskStep[] => {
  const order = ["创建", "校验", "确认", "下发", "执行", "完成"];
  const doneIndex =
    st === "done" ? 6 : st === "failed" ? 4 : st === "running" ? 4 : st === "pending_confirm" ? 1 : st === "queued" ? 3 : 1;
  return order.map((label, i) => ({
    key: `s${i}`,
    label,
    state: i < doneIndex ? "done" : i === doneIndex ? (st === "failed" ? "error" : "active") : "todo",
  }));
};

const okChecks: CheckItem[] = [
  { level: "ok", text: "空域与飞行计划：无冲突" },
  { level: "ok", text: "设备健康：电池 / 桨叶 / 云台正常" },
  { level: "ok", text: "航线参数：高度 55m，速度 6m/s，在范围内" },
  { level: "warn", text: "区域内存在人群活动，建议开启喊话器提示" },
];

export const TASKS: Task[] = [
  {
    id: "T-20261029-01",
    name: "滨江东路消防通道巡检",
    type: "日常巡检",
    deviceId: "UAV-01",
    areaId: "A-01",
    routeId: "R-001",
    status: "running",
    progress: 62,
    createdAt: "2026-10-29 09:42",
    operator: "值班员 · 陈默",
    planVersion: "plan-3",
    checks: okChecks,
    steps: [
      { key: "s0", label: "创建", state: "done", at: "09:42:03" },
      { key: "s1", label: "校验", state: "done", at: "09:42:11", note: "4 项通过 · 1 项提示" },
      { key: "s2", label: "确认", state: "done", at: "09:43:20", note: "人工确认 · 陈默" },
      { key: "s3", label: "下发", state: "done", at: "09:43:24" },
      { key: "s4", label: "执行", state: "active", at: "09:43:51", note: "第 7/12 航点" },
      { key: "s5", label: "完成", state: "todo" },
    ],
    eventIds: [],
    traceId: "TR-20261029-0901",
    sessionId: "S-101",
  },
  {
    id: "T-20261029-02",
    name: "南湖公园周界巡查",
    type: "日常巡检",
    deviceId: "UAV-02",
    areaId: "A-02",
    routeId: "R-002",
    status: "pending_confirm",
    progress: 0,
    createdAt: "2026-10-29 08:20",
    operator: "值班员 · 林可",
    planVersion: "plan-1",
    checks: [
      { level: "ok", text: "空域与飞行计划：无冲突" },
      { level: "ok", text: "设备健康：电池 64%，满足往返" },
      { level: "warn", text: "东侧水域有游船作业，建议避开 10:00–11:00" },
    ],
    steps: baseSteps("pending_confirm"),
    eventIds: [],
    traceId: "TR-20261029-0820",
    sessionId: "S-102",
  },
  {
    id: "T-20261029-03",
    name: "工业园 B 区立面检查",
    type: "专项检查",
    deviceId: "UAV-04",
    areaId: "A-03",
    routeId: "R-003",
    status: "queued",
    progress: 0,
    createdAt: "2026-10-29 07:55",
    operator: "值班员 · 陈默",
    planVersion: "plan-2",
    checks: [
      { level: "ok", text: "空域与飞行计划：无冲突" },
      { level: "warn", text: "航线为草稿 v5，执行前需确认版本" },
    ],
    steps: baseSteps("queued"),
    eventIds: [],
    traceId: "TR-20261029-0755",
  },
  {
    id: "T-20261028-07",
    name: "河道漂浮物巡查",
    type: "日常巡检",
    deviceId: "UAV-01",
    areaId: "A-02",
    routeId: "R-005",
    status: "done",
    progress: 100,
    createdAt: "2026-10-28 15:10",
    operator: "值班员 · 林可",
    planVersion: "plan-1",
    checks: okChecks.slice(0, 3),
    steps: baseSteps("done"),
    eventIds: ["E-2026-0110"],
    reportId: "RP-20261028-07",
    traceId: "TR-20261028-1501",
  },
  {
    id: "T-20261028-05",
    name: "高架桥下堆积物排查",
    type: "专项检查",
    deviceId: "UAV-03",
    areaId: "A-03",
    routeId: "R-004",
    status: "failed",
    progress: 18,
    createdAt: "2026-10-28 13:02",
    operator: "值班员 · 陈默",
    planVersion: "plan-1",
    checks: [
      { level: "ok", text: "空域与飞行计划：无冲突" },
      { level: "warn", text: "M350-01 电量为 31%，低于建议值 40%" },
    ],
    steps: [
      { key: "s0", label: "创建", state: "done", at: "13:02:10" },
      { key: "s1", label: "校验", state: "done", at: "13:02:18" },
      { key: "s2", label: "确认", state: "done", at: "13:04:02" },
      { key: "s3", label: "下发", state: "done", at: "13:04:09" },
      { key: "s4", label: "执行", state: "error", at: "13:05:44", note: "设备离线（51002）" },
      { key: "s5", label: "完成", state: "todo" },
    ],
    eventIds: [],
    traceId: "TR-20261028-1302",
  },
  {
    id: "T-20261028-03",
    name: "南湖公园周界巡查",
    type: "日常巡检",
    deviceId: "UAV-02",
    areaId: "A-02",
    routeId: "R-002",
    status: "done",
    progress: 100,
    createdAt: "2026-10-28 10:12",
    operator: "值班员 · 林可",
    planVersion: "plan-1",
    checks: okChecks.slice(0, 3),
    steps: baseSteps("done"),
    eventIds: ["E-2026-0109"],
    reportId: "RP-20261028-03",
    traceId: "TR-20261028-1001",
  },
  {
    id: "T-20261027-08",
    name: "滨江东路消防通道巡检",
    type: "日常巡检",
    deviceId: "UAV-01",
    areaId: "A-01",
    routeId: "R-001",
    status: "done",
    progress: 100,
    createdAt: "2026-10-27 09:30",
    operator: "值班员 · 陈默",
    planVersion: "plan-2",
    checks: okChecks,
    steps: baseSteps("done"),
    eventIds: ["E-2026-0112", "E-2026-0108"],
    reportId: "RP-20261027-08",
    traceId: "TR-20261027-0901",
  },
  {
    id: "T-20261027-04",
    name: "工业园 B 区立面检查",
    type: "专项检查",
    deviceId: "UAV-04",
    areaId: "A-03",
    routeId: "R-003",
    status: "done",
    progress: 100,
    createdAt: "2026-10-27 14:20",
    operator: "值班员 · 陈默",
    planVersion: "plan-1",
    checks: okChecks.slice(0, 3),
    steps: baseSteps("done"),
    eventIds: ["E-2026-0111"],
    reportId: "RP-20261027-04",
    traceId: "TR-20261027-1401",
  },
  {
    id: "T-20261026-09",
    name: "河道漂浮物巡查",
    type: "日常巡检",
    deviceId: "UAV-03",
    areaId: "A-02",
    routeId: "R-005",
    status: "failed",
    progress: 41,
    createdAt: "2026-10-26 16:40",
    operator: "值班员 · 林可",
    planVersion: "plan-1",
    checks: okChecks.slice(0, 3),
    steps: [
      { key: "s0", label: "创建", state: "done", at: "16:40:02" },
      { key: "s1", label: "校验", state: "done", at: "16:40:09" },
      { key: "s2", label: "确认", state: "done", at: "16:41:30" },
      { key: "s3", label: "下发", state: "done", at: "16:41:34" },
      { key: "s4", label: "执行", state: "error", at: "16:43:18", note: "工具调用超时（42003）" },
      { key: "s5", label: "完成", state: "todo" },
    ],
    eventIds: [],
    traceId: "TR-20261026-1640",
  },
  {
    id: "T-20261026-02",
    name: "南湖公园周界巡查",
    type: "日常巡检",
    deviceId: "UAV-02",
    areaId: "A-02",
    routeId: "R-002",
    status: "done",
    progress: 100,
    createdAt: "2026-10-26 09:05",
    operator: "值班员 · 林可",
    planVersion: "plan-1",
    checks: okChecks.slice(0, 3),
    steps: baseSteps("done"),
    eventIds: ["E-2026-0107"],
    reportId: "RP-20261026-02",
    traceId: "TR-20261026-0901",
  },
];

export const EVENTS: DroneEvent[] = [
  {
    id: "E-2026-0112",
    title: "消防通道被车辆占用",
    type: "占道",
    level: "high",
    areaId: "A-01",
    pos: { x: 404, y: 246 },
    at: "2026-10-27 09:52",
    taskId: "T-20261027-08",
    status: "pending",
    confidence: 0.94,
    evidence: "s1",
    note: "通道中段停放两辆厢式货车，占据约 6.2m 宽通道。",
  },
  {
    id: "E-2026-0111",
    title: "厂房南立面疑似裂缝",
    type: "结构",
    level: "mid",
    areaId: "A-03",
    pos: { x: 214, y: 132 },
    at: "2026-10-27 14:48",
    taskId: "T-20261027-04",
    status: "processing",
    confidence: 0.81,
    evidence: "s2",
    note: "三层窗下沿出现纵向裂纹，长度约 1.4m。",
    handler: "运维二组 · 周航",
  },
  {
    id: "E-2026-0110",
    title: "河道漂浮物聚集",
    type: "环境",
    level: "low",
    areaId: "A-02",
    pos: { x: 742, y: 522 },
    at: "2026-10-28 15:36",
    taskId: "T-20261028-07",
    status: "resolved",
    confidence: 0.88,
    evidence: "s3",
    note: "闸口上游约 30m² 漂浮物聚集。",
    handler: "河道保洁 · 吴敏",
    disposal: "已安排打捞船清理，15:20 完成，二次复核无残留。",
  },
  {
    id: "E-2026-0109",
    title: "人员进入围栏区域",
    type: "安全",
    level: "high",
    areaId: "A-02",
    pos: { x: 706, y: 372 },
    at: "2026-10-28 10:41",
    taskId: "T-20261028-03",
    status: "processing",
    confidence: 0.9,
    evidence: "s1",
    note: "北侧围栏内侧发现 2 名人员，未佩戴安全帽。",
    handler: "园区安保 · 值班室",
  },
  {
    id: "E-2026-0108",
    title: "通道边缘堆放杂物",
    type: "占道",
    level: "mid",
    areaId: "A-01",
    pos: { x: 470, y: 268 },
    at: "2026-10-27 09:49",
    taskId: "T-20261027-08",
    status: "false_positive",
    confidence: 0.62,
    evidence: "s4",
    note: "复核为可移动的临时围挡，未影响通行。",
    disposal: "现场复核判定为误报，已记录并关闭。",
  },
  {
    id: "E-2026-0107",
    title: "路灯灯杆轻微倾斜",
    type: "设施",
    level: "low",
    areaId: "A-02",
    pos: { x: 662, y: 418 },
    at: "2026-10-26 09:31",
    taskId: "T-20261026-02",
    status: "resolved",
    confidence: 0.77,
    evidence: "s2",
    note: "东南角灯杆倾斜约 4°，未影响照明。",
    handler: "市政照明 · 李工",
    disposal: "已加固底座并复核垂直度，结果正常。",
  },
];

export const WORKFLOWS: Workflow[] = [
  {
    id: "WF-01",
    name: "占道事件自动通知属地",
    trigger: "事件创建且类型 = 占道",
    status: "published",
    lastRun: "2026-10-27 09:53",
    successRate: 96,
    nodes: [
      { id: "n1", type: "trigger", label: "事件创建", x: 40, y: 96, config: "监听 event.created" },
      { id: "n2", type: "branch", label: "类型 = 占道？", x: 230, y: 96, config: "event.type == '占道'" },
      { id: "n3", type: "action", label: "推送属地处置群", x: 440, y: 40, config: "channel = 属地-滨江" },
      { id: "n4", type: "approve", label: "值班长确认", x: 440, y: 168, config: "role = 值班长" },
      { id: "n5", type: "end", label: "结束", x: 660, y: 96, config: "" },
    ],
    edges: [
      { from: "n1", to: "n2" },
      { from: "n2", to: "n3", label: "是" },
      { from: "n2", to: "n4", label: "否" },
      { from: "n3", to: "n5" },
      { from: "n4", to: "n5" },
    ],
    runs: [
      { id: "RUN-1027-01", at: "2026-10-27 09:53", state: "ok", ms: 1820 },
      { id: "RUN-1024-02", at: "2026-10-24 11:20", state: "ok", ms: 2140 },
      { id: "RUN-1021-03", at: "2026-10-21 08:47", state: "failed", ms: 900, failedNode: "n3" },
    ],
  },
  {
    id: "WF-02",
    name: "每日机巢设备自检",
    trigger: "定时 每日 06:00",
    status: "published",
    lastRun: "2026-10-29 06:00",
    successRate: 100,
    nodes: [
      { id: "n1", type: "trigger", label: "定时触发", x: 40, y: 96, config: "cron 0 6 * * *" },
      { id: "n2", type: "query", label: "查询设备状态", x: 230, y: 96, config: "tool = device.get_status" },
      { id: "n3", type: "ai", label: "AI 汇总异常", x: 430, y: 96, config: "model = ops-summary" },
      { id: "n4", type: "end", label: "结束", x: 630, y: 96, config: "" },
    ],
    edges: [
      { from: "n1", to: "n2" },
      { from: "n2", to: "n3" },
      { from: "n3", to: "n4" },
    ],
    runs: [
      { id: "RUN-1029-01", at: "2026-10-29 06:00", state: "ok", ms: 3200 },
      { id: "RUN-1028-01", at: "2026-10-28 06:00", state: "ok", ms: 2980 },
    ],
  },
  {
    id: "WF-03",
    name: "低电量自动返航",
    trigger: "执行中电量 < 25%",
    status: "published",
    lastRun: "2026-10-22 17:11",
    successRate: 100,
    nodes: [
      { id: "n1", type: "trigger", label: "电量阈值", x: 40, y: 96, config: "telemetry.battery < 25" },
      { id: "n2", type: "guard", label: "安全校验", x: 230, y: 96, config: "guard = 返航路径冲突检查" },
      { id: "n3", type: "action", label: "下发返航", x: 430, y: 96, config: "tool = task.return_home" },
      { id: "n4", type: "end", label: "结束", x: 630, y: 96, config: "" },
    ],
    edges: [
      { from: "n1", to: "n2" },
      { from: "n2", to: "n3" },
      { from: "n3", to: "n4" },
    ],
    runs: [{ id: "RUN-1022-01", at: "2026-10-22 17:11", state: "ok", ms: 1200 }],
  },
  {
    id: "WF-04",
    name: "周报生成与推送",
    trigger: "定时 每周一 09:00",
    status: "draft",
    lastRun: "—",
    successRate: 0,
    nodes: [
      { id: "n1", type: "trigger", label: "定时触发", x: 40, y: 96, config: "cron 0 9 * * 1" },
      { id: "n2", type: "query", label: "汇总任务数据", x: 230, y: 96, config: "range = last 7d" },
      { id: "n3", type: "ai", label: "生成周报", x: 430, y: 96, config: "template = 作业周报" },
      { id: "n4", type: "action", label: "推送", x: 630, y: 96, config: "channel = 管理群" },
    ],
    edges: [
      { from: "n1", to: "n2" },
      { from: "n2", to: "n3" },
      { from: "n3", to: "n4" },
    ],
    runs: [],
  },
];

export const TOOLS: ToolDef[] = [
  {
    id: "device.get_status",
    name: "设备状态查询",
    group: "设备",
    desc: "查询单台设备的在线状态、电量、载荷与当前任务占用。",
    method: "read",
    risk: "low",
    needConfirm: false,
    timeout: 3000,
    params: [{ name: "device_id", type: "string", required: true, desc: "设备编号，例如 UAV-01" }],
    output: "{ status, battery, payload, task_id }",
    errors: ["40001 设备不存在", "42003 上游超时"],
    status: "enabled",
    calls: 1284,
    latency: 180,
    source: "mcp",
    scope: "device:read",
    mcpServerId: "drone-platform-mcp",
    mcpTool: "get_device_status",
  },
  {
    id: "device.list_available",
    name: "可用设备筛选",
    group: "设备",
    desc: "按区域、载荷和电量筛选可用设备。",
    method: "read",
    risk: "low",
    needConfirm: false,
    timeout: 3000,
    params: [
      { name: "area_id", type: "string", required: true, desc: "作业区域编号" },
      { name: "min_battery", type: "number", required: false, desc: "最低电量百分比，默认 40" },
      { name: "payload", type: "enum", required: false, desc: "载荷类型", enumValues: ["双光吊舱", "广角相机", "激光测距"] },
    ],
    output: "Device[]",
    errors: ["40002 区域无可用设备"],
    status: "enabled",
    calls: 412,
    latency: 240,
    source: "mcp",
    scope: "device:read",
    mcpServerId: "drone-platform-mcp",
    mcpTool: "list_devices",
  },
  {
    id: "route.generate",
    name: "航线生成",
    group: "航线",
    desc: "根据区域边界、高度和速度生成航线草稿，不覆盖已发布版本。",
    method: "write",
    risk: "mid",
    needConfirm: false,
    timeout: 12000,
    params: [
      { name: "area_id", type: "string", required: true, desc: "区域编号" },
      { name: "alt", type: "number", required: true, desc: "相对起飞点高度（m），范围 20–120" },
      { name: "speed", type: "number", required: false, desc: "巡航速度（m/s），默认 8" },
      { name: "lens", type: "enum", required: false, desc: "镜头", enumValues: ["广角", "变焦", "双光"] },
    ],
    output: "{ route_id, version, waypoint_count }",
    errors: ["41001 高度超出范围", "41002 区域边界无效"],
    status: "enabled",
    calls: 96,
    latency: 6400,
    source: "internal",
    scope: "route:write",
  },
  {
    id: "route.validate",
    name: "航线校验",
    group: "航线",
    desc: "校验航线的参数完整性、边界、障碍物与返航高度。",
    method: "read",
    risk: "low",
    needConfirm: false,
    timeout: 5000,
    params: [{ name: "route_id", type: "string", required: true, desc: "航线编号" }],
    output: "{ ok, issues[] }",
    errors: ["41010 缺少返航高度"],
    status: "enabled",
    calls: 208,
    latency: 520,
    source: "internal",
    scope: "route:read",
  },
  {
    id: "task.create",
    name: "任务创建",
    group: "任务",
    desc: "创建任务草案，必须经过人工确认后才可下发。",
    method: "write",
    risk: "high",
    needConfirm: true,
    timeout: 6000,
    params: [
      { name: "device_id", type: "string", required: true, desc: "执行设备" },
      { name: "route_id", type: "string", required: true, desc: "航线版本" },
      { name: "area_id", type: "string", required: true, desc: "作业区域" },
      { name: "window", type: "string", required: false, desc: "执行时间窗" },
    ],
    output: "{ task_id, status, plan_version }",
    errors: ["43001 设备被占用", "43002 前置条件校验失败"],
    status: "enabled",
    calls: 143,
    latency: 900,
    source: "internal",
    scope: "task:write",
  },
  {
    id: "task.cancel",
    name: "任务取消",
    group: "任务",
    desc: "申请取消任务，需值班人员确认后由业务平台执行。",
    method: "write",
    risk: "high",
    needConfirm: true,
    timeout: 6000,
    params: [{ name: "task_id", type: "string", required: true, desc: "任务编号" }],
    output: "{ cancel_request_id, state }",
    errors: ["43010 任务已结束", "43011 取消申请已存在"],
    status: "enabled",
    calls: 24,
    latency: 760,
    source: "internal",
    scope: "task:write",
  },
  {
    id: "event.report",
    name: "事件上报",
    group: "事件",
    desc: "把巡检发现提交为事件，关联任务与证据。",
    method: "write",
    risk: "mid",
    needConfirm: false,
    timeout: 5000,
    params: [
      { name: "task_id", type: "string", required: true, desc: "关联任务" },
      { name: "type", type: "enum", required: true, desc: "事件类型", enumValues: ["占道", "结构", "环境", "安全", "设施"] },
      { name: "level", type: "enum", required: true, desc: "等级", enumValues: ["high", "mid", "low"] },
    ],
    output: "{ event_id }",
    errors: ["44001 证据缺失"],
    status: "enabled",
    calls: 87,
    latency: 880,
    source: "internal",
    scope: "event:write",
  },
  {
    id: "report.generate",
    name: "报告生成",
    group: "报告",
    desc: "按任务汇总执行数据、异常与证据，生成可打印报告。",
    method: "read",
    risk: "low",
    needConfirm: false,
    timeout: 10000,
    params: [{ name: "task_id", type: "string", required: true, desc: "任务编号" }],
    output: "{ report_id, url }",
    errors: ["45001 任务未结束"],
    status: "disabled",
    calls: 61,
    latency: 2600,
    source: "internal",
    scope: "report:write",
  },
  {
    id: "kb.search",
    name: "知识检索",
    group: "知识",
    desc: "在已索引的知识库中检索片段，返回片段、来源与分数，供 RAG 组装上下文。",
    method: "read",
    risk: "low",
    needConfirm: false,
    timeout: 4000,
    params: [
      { name: "question", type: "string", required: true, desc: "检索问题" },
      { name: "top_k", type: "number", required: false, desc: "召回条数，默认 12" },
    ],
    output: "{ chunks[], scores[] }",
    errors: ["46001 索引未就绪"],
    status: "enabled",
    calls: 936,
    latency: 260,
    source: "mcp",
    scope: "kb:read",
    mcpServerId: "knowledge-base-mcp",
    mcpTool: "search_documents",
  },
  {
    id: "event.query",
    name: "告警与事件查询",
    group: "事件",
    desc: "按设备或时间范围查询历史告警与事件，用于故障诊断和趋势分析。",
    method: "read",
    risk: "low",
    needConfirm: false,
    timeout: 4000,
    params: [
      { name: "device_id", type: "string", required: false, desc: "设备编号" },
      { name: "limit", type: "number", required: false, desc: "返回条数，默认 5" },
    ],
    output: "{ events[] }",
    errors: ["44002 查询范围过大"],
    status: "enabled",
    calls: 318,
    latency: 320,
    source: "mcp",
    scope: "event:read",
    mcpServerId: "drone-platform-mcp",
    mcpTool: "list_events",
  },
  {
    id: "workflow.query",
    name: "工作流查询",
    group: "工作流",
    desc: "查询工作流的定义、版本与最近一次运行结果。",
    method: "read",
    risk: "low",
    needConfirm: false,
    timeout: 4000,
    params: [{ name: "workflow_id", type: "string", required: true, desc: "工作流编号" }],
    output: "{ workflow_id, version, last_run }",
    errors: ["47001 工作流不存在", "47002 MCP 连接不可用"],
    status: "enabled",
    calls: 42,
    latency: 410,
    source: "mcp",
    scope: "workflow:read",
    mcpServerId: "workflow-mcp",
    mcpTool: "get_workflow",
  },
];

const trace = (
  id: string,
  taskId: string | undefined,
  steps: Omit<TraceStep, "startedAt" | "ms">[],
  status: "ok" | "error" | "running" = "ok"
): Trace => {
  let cursor = 9 * 3600 + 42 * 60 + 3;
  const filled = steps.map((s, i) => {
    const ms = [180, 2400, 620, 6400, 320, 8400, 1200, 960, 4200, 560][i % 10];
    const m = Math.floor(cursor / 60);
    const sec = cursor % 60;
    cursor += Math.round(ms / 1000) + 1;
    return {
      ...s,
      startedAt: `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}:${String(sec).padStart(2, "0")}`,
      ms,
    };
  });
  return {
    id,
    taskId,
    sessionId: taskId ? `S-${taskId.slice(-2)}` : undefined,
    agentId: "AGENT-COPILOT-OPS@1.4.2",
    totalMs: filled.reduce((a, b) => a + b.ms, 0),
    status,
    steps: filled,
  };
};

export const TRACES: Trace[] = [
  trace(
    "TR-20261029-0901",
    "T-20261029-01",
    [
      { key: "t1", label: "接收消息", kind: "message", state: "done", input: "「巡检滨江东路消防通道」", output: "归一化文本 1 条" },
      { key: "t2", label: "意图解析", kind: "intent", state: "done", input: "巡检滨江东路消防通道", output: "intent = patrol_task · area = A-01" },
      { key: "t3", label: "查询区域与设备", kind: "query", state: "done", input: "area_id=A-01", output: "候选设备 2 台" },
      { key: "t4", label: "生成航线草稿", kind: "tool", state: "done", input: "route.generate{area_id:A-01, alt:55}", output: "R-001 v3 · 12 航点" },
      { key: "t5", label: "安全校验", kind: "guard", state: "done", input: "plan-3", output: "4 通过 · 1 提示" },
      { key: "t6", label: "等待人工确认", kind: "confirm", state: "done", input: "plan-3", output: "陈默 09:43:20 确认" },
      { key: "t7", label: "下发任务", kind: "tool", state: "done", input: "task.create{...}", output: "T-20261029-01 · queued" },
      { key: "t8", label: "执行回执", kind: "result", state: "done", input: "T-20261029-01", output: "running · 62%" },
    ],
    "running"
  ),
  trace(
    "TR-20261028-1302",
    "T-20261028-05",
    [
      { key: "t1", label: "接收消息", kind: "message", state: "done", input: "「排查高架桥下堆积物」", output: "归一化文本 1 条" },
      { key: "t2", label: "意图解析", kind: "intent", state: "done", input: "排查高架桥下堆积物", output: "intent = patrol_task · area = A-03" },
      { key: "t3", label: "设备筛选", kind: "query", state: "done", input: "min_battery=40", output: "仅 UAV-04 可用" },
      { key: "t4", label: "安全校验", kind: "guard", state: "done", input: "plan-1", output: "通过（电量提示）" },
      { key: "t5", label: "下发任务", kind: "tool", state: "error", input: "task.create{device:UAV-03}", output: "设备离线 51002", error: "51002 设备离线" },
      { key: "t6", label: "失败回写", kind: "result", state: "done", input: "T-20261028-05", output: "failed · 已通知值班员" },
    ],
    "error"
  ),
  trace(
    "TR-20261026-1640",
    "T-20261026-09",
    [
      { key: "t1", label: "接收消息", kind: "message", state: "done", input: "「巡查河道漂浮物」", output: "归一化文本 1 条" },
      { key: "t2", label: "意图解析", kind: "intent", state: "done", input: "巡查河道漂浮物", output: "intent = patrol_task · area = A-02" },
      { key: "t3", label: "生成航线", kind: "tool", state: "error", input: "route.generate{area_id:A-02}", output: "上游超时", error: "42003 上游超时 12s" },
      { key: "t4", label: "重试", kind: "tool", state: "error", input: "route.generate (retry 1)", output: "再次超时", error: "42003 上游超时 12s" },
      { key: "t5", label: "失败回写", kind: "result", state: "done", input: "T-20261026-09", output: "failed · 建议改用已有航线" },
    ],
    "error"
  ),
  trace(
    "TR-20261029-0820",
    "T-20261029-02",
    [
      { key: "t1", label: "接收消息", kind: "message", state: "done", input: "「今天南湖公园的周界巡查排上了吗？」", output: "归一化文本 1 条" },
      { key: "t2", label: "意图解析", kind: "intent", state: "done", input: "南湖公园周界巡查", output: "intent = patrol_plan · area = A-02" },
      { key: "t3", label: "查询区域与设备", kind: "query", state: "done", input: "area_id=A-02", output: "候选设备 1 台 · UAV-02 64%" },
      { key: "t4", label: "生成航线草稿", kind: "tool", state: "done", input: "route.generate{area_id:A-02}", output: "R-002 v1 · 10 航点" },
      { key: "t5", label: "安全校验", kind: "guard", state: "done", input: "plan-1", output: "2 通过 · 1 提示（10:00–11:00 游船作业）" },
      { key: "t6", label: "等待人工确认", kind: "confirm", state: "waiting", input: "plan-1", output: "等待值班员确认时间窗" },
    ],
    "running"
  ),
  trace(
    "TR-20261029-0755",
    "T-20261029-03",
    [
      { key: "t1", label: "接收消息", kind: "message", state: "done", input: "「工业园 B 区立面再做一次专项检查」", output: "归一化文本 1 条" },
      { key: "t2", label: "意图解析", kind: "intent", state: "done", input: "工业园 B 区立面检查", output: "intent = patrol_task · area = A-03" },
      { key: "t3", label: "设备筛选", kind: "query", state: "done", input: "min_battery=40", output: "UAV-04 满足条件" },
      { key: "t4", label: "航线版本确认", kind: "guard", state: "done", input: "R-003 v5", output: "草稿版本，已提示人工确认" },
      { key: "t5", label: "下发任务", kind: "tool", state: "done", input: "task.create{...}", output: "T-20261029-03 · queued" },
    ],
    "ok"
  ),
  trace(
    "TR-20261028-1501",
    "T-20261028-07",
    [
      { key: "t1", label: "接收消息", kind: "message", state: "done", input: "「巡查河道漂浮物」", output: "归一化文本 1 条" },
      { key: "t2", label: "意图解析", kind: "intent", state: "done", input: "巡查河道漂浮物", output: "intent = patrol_task · area = A-02" },
      { key: "t3", label: "生成航线草稿", kind: "tool", state: "done", input: "route.generate{area_id:A-02}", output: "R-005 v1 · 9 航点" },
      { key: "t4", label: "安全校验", kind: "guard", state: "done", input: "plan-1", output: "3 项全部通过" },
      { key: "t5", label: "等待人工确认", kind: "confirm", state: "done", input: "plan-1", output: "林可 确认" },
      { key: "t6", label: "下发任务", kind: "tool", state: "done", input: "task.create{...}", output: "T-20261028-07 · queued" },
      { key: "t7", label: "执行回执", kind: "result", state: "done", input: "T-20261028-07", output: "done · 9/9 航点 · 事件 1 条" },
    ],
    "ok"
  ),
  trace(
    "TR-20261028-1001",
    "T-20261028-03",
    [
      { key: "t1", label: "接收消息", kind: "message", state: "done", input: "「南湖公园周界巡查」", output: "归一化文本 1 条" },
      { key: "t2", label: "意图解析", kind: "intent", state: "done", input: "南湖公园周界巡查", output: "intent = patrol_task · area = A-02" },
      { key: "t3", label: "生成航线草稿", kind: "tool", state: "done", input: "route.generate{area_id:A-02}", output: "R-002 v1 · 10 航点" },
      { key: "t4", label: "安全校验", kind: "guard", state: "done", input: "plan-1", output: "3 项全部通过" },
      { key: "t5", label: "等待人工确认", kind: "confirm", state: "done", input: "plan-1", output: "林可 确认" },
      { key: "t6", label: "下发任务", kind: "tool", state: "done", input: "task.create{...}", output: "T-20261028-03 · queued" },
      { key: "t7", label: "执行回执", kind: "result", state: "done", input: "T-20261028-03", output: "done · 10/10 航点 · 事件 1 条" },
    ],
    "ok"
  ),
  trace(
    "TR-20261027-0901",
    "T-20261027-08",
    [
      { key: "t1", label: "接收消息", kind: "message", state: "done", input: "「巡检滨江东路消防通道」", output: "归一化文本 1 条" },
      { key: "t2", label: "意图解析", kind: "intent", state: "done", input: "巡检滨江东路消防通道", output: "intent = patrol_task · area = A-01" },
      { key: "t3", label: "生成航线草稿", kind: "tool", state: "done", input: "route.generate{area_id:A-01, alt:55}", output: "R-001 v2 · 12 航点" },
      { key: "t4", label: "安全校验", kind: "guard", state: "done", input: "plan-2", output: "4 通过 · 1 提示" },
      { key: "t5", label: "等待人工确认", kind: "confirm", state: "done", input: "plan-2", output: "陈默 确认" },
      { key: "t6", label: "下发任务", kind: "tool", state: "done", input: "task.create{...}", output: "T-20261027-08 · queued" },
      { key: "t7", label: "执行回执", kind: "result", state: "done", input: "T-20261027-08", output: "done · 12/12 航点 · 事件 2 条" },
    ],
    "ok"
  ),
  trace(
    "TR-20261027-1401",
    "T-20261027-04",
    [
      { key: "t1", label: "接收消息", kind: "message", state: "done", input: "「工业园 B 区立面检查」", output: "归一化文本 1 条" },
      { key: "t2", label: "意图解析", kind: "intent", state: "done", input: "工业园 B 区立面检查", output: "intent = patrol_task · area = A-03" },
      { key: "t3", label: "生成航线草稿", kind: "tool", state: "done", input: "route.generate{area_id:A-03}", output: "R-003 v4 · 11 航点" },
      { key: "t4", label: "安全校验", kind: "guard", state: "done", input: "plan-1", output: "3 项全部通过" },
      { key: "t5", label: "等待人工确认", kind: "confirm", state: "done", input: "plan-1", output: "陈默 确认" },
      { key: "t6", label: "下发任务", kind: "tool", state: "done", input: "task.create{...}", output: "T-20261027-04 · queued" },
      { key: "t7", label: "执行回执", kind: "result", state: "done", input: "T-20261027-04", output: "done · 11/11 航点 · 事件 1 条" },
    ],
    "ok"
  ),
  trace(
    "TR-20261026-0901",
    "T-20261026-02",
    [
      { key: "t1", label: "接收消息", kind: "message", state: "done", input: "「南湖公园周界巡查」", output: "归一化文本 1 条" },
      { key: "t2", label: "意图解析", kind: "intent", state: "done", input: "南湖公园周界巡查", output: "intent = patrol_task · area = A-02" },
      { key: "t3", label: "生成航线草稿", kind: "tool", state: "done", input: "route.generate{area_id:A-02}", output: "R-002 v1 · 10 航点" },
      { key: "t4", label: "安全校验", kind: "guard", state: "done", input: "plan-1", output: "3 项全部通过" },
      { key: "t5", label: "等待人工确认", kind: "confirm", state: "done", input: "plan-1", output: "林可 确认" },
      { key: "t6", label: "下发任务", kind: "tool", state: "done", input: "task.create{...}", output: "T-20261026-02 · queued" },
      { key: "t7", label: "执行回执", kind: "result", state: "done", input: "T-20261026-02", output: "done · 10/10 航点 · 事件 1 条" },
    ],
    "ok"
  ),
  trace(
    "TR-20261023-1110",
    "T-20261023-05",
    [
      { key: "t1", label: "接收消息", kind: "message", state: "done", input: "「11:00 在南湖公园东侧水域执行」", output: "归一化文本 1 条" },
      { key: "t2", label: "意图解析", kind: "intent", state: "done", input: "11:00 南湖公园东侧水域", output: "intent = patrol_task · area = A-02 · window = 11:00" },
      { key: "t3", label: "空域校验", kind: "guard", state: "done", input: "area_id=A-02 · window=11:00", output: "未命中临时作业窗口（数据源缺失）" },
      { key: "t4", label: "生成航线草稿", kind: "tool", state: "done", input: "route.generate{area_id:A-02}", output: "R-002 v2 · 10 航点" },
      { key: "t5", label: "等待人工确认", kind: "confirm", state: "done", input: "plan-2", output: "林可 确认" },
      { key: "t6", label: "下发任务", kind: "tool", state: "done", input: "task.create{...}", output: "T-20261023-05 · queued" },
      { key: "t7", label: "执行回执", kind: "result", state: "error", input: "T-20261023-05", output: "任务中止 4410：现场被游船作业占用", error: "4410 现场空域被占用" },
    ],
    "error"
  ),
  trace(
    "TR-20261029-0915",
    "T-20261029-01",
    [
      { key: "t1", label: "接收消息", kind: "message", state: "done", input: "「（作业值班员）把 T-20261029-01 取消」", output: "归一化文本 1 条" },
      { key: "t2", label: "意图解析", kind: "intent", state: "done", input: "取消 T-20261029-01", output: "intent = cancel_task · task = T-20261029-01" },
      { key: "t3", label: "角色校验", kind: "guard", state: "done", input: "role = 作业值班员", output: "未配置角色校验规则（缺陷）" },
      { key: "t4", label: "生成取消申请", kind: "tool", state: "done", input: "task.cancel{task_id:T-20261029-01}", output: "CR-20261029-03 · requesting" },
      { key: "t5", label: "等待值班长确认", kind: "confirm", state: "waiting", input: "CR-20261029-03", output: "等待值班长确认" },
    ],
    "running"
  ),
];

export const SESSIONS: Session[] = [
  {
    id: "S-101",
    title: "消防通道巡检（滨江东路）",
    at: "2026-10-29 09:42",
    mode: "作业任务",
    msgs: [
      { id: "m1", role: "user", text: "巡检滨江东路这个区域的消防通道", at: "09:42" },
      { id: "m2", role: "assistant", text: "已识别作业区域「滨江东路消防通道」（42 亩）。正在筛选可用设备并生成航线草稿。", at: "09:42", card: { kind: "plan", taskId: "T-20261029-01" } },
    ],
  },
  {
    id: "S-102",
    title: "南湖公园周界巡查",
    at: "2026-10-29 08:20",
    mode: "作业任务",
    msgs: [
      { id: "m1", role: "user", text: "今天南湖公园的周界巡查排上了吗？", at: "08:20" },
      { id: "m2", role: "assistant", text: "已生成计划 plan-1，等待你确认后下发。东侧水域 10:00–11:00 有游船作业，建议调整时间窗。", at: "08:20", card: { kind: "plan", taskId: "T-20261029-02" } },
    ],
  },
  {
    id: "S-103",
    title: "电池温度告警咨询",
    at: "2026-10-28 17:05",
    mode: "普通咨询",
    msgs: [
      { id: "m1", role: "user", text: "无人机为什么提示电池温度异常？", at: "17:05" },
      { id: "m2", role: "assistant", text: "M350-01 电池温度 48.6℃，超过建议上限 45℃。常见原因是连续两个架次间隔不足 10 分钟。建议停机冷却 15 分钟后再执行任务。", at: "17:05", card: { kind: "device", deviceId: "UAV-03", alert: "电池温度 48.6℃，高于阈值 45℃" } },
    ],
  },
  {
    id: "S-104",
    title: "失败任务查询",
    at: "2026-10-28 13:10",
    mode: "业务查询",
    msgs: [
      { id: "m1", role: "user", text: "今天有哪些任务执行失败？", at: "13:10" },
      { id: "m2", role: "assistant", text: "今天有 1 个任务失败：T-20261028-05 高架桥下堆积物排查，原因是设备离线（51002）。", at: "13:10", card: { kind: "taskList", taskIds: ["T-20261028-05"] } },
    ],
  },
];

export const REPORTS: Report[] = [
  {
    id: "RP-20261027-08",
    name: "滨江东路消防通道巡检报告",
    taskId: "T-20261027-08",
    at: "2026-10-27 10:20",
    status: "ready",
    summary: "覆盖 42 亩，12 个航点，发现 2 处异常（1 处高风险占道，1 处误报）。",
  },
  {
    id: "RP-20261028-07",
    name: "河道漂浮物巡查报告",
    taskId: "T-20261028-07",
    at: "2026-10-28 16:05",
    status: "ready",
    summary: "覆盖河道 1.2km，发现漂浮物聚集 1 处，已转交保洁处置。",
  },
  {
    id: "RP-20261028-03",
    name: "南湖公园周界巡查报告",
    taskId: "T-20261028-03",
    at: "2026-10-28 11:02",
    status: "ready",
    summary: "覆盖 118 亩，发现人员进入围栏区域 1 起，已通知安保。",
  },
  {
    id: "RP-20261027-04",
    name: "工业园 B 区立面检查报告",
    taskId: "T-20261027-04",
    at: "2026-10-27 15:30",
    status: "ready",
    summary: "检查 4 栋厂房立面，发现疑似裂缝 1 处（中等风险）。",
  },
  {
    id: "RP-20261026-02",
    name: "南湖公园周界巡查报告",
    taskId: "T-20261026-02",
    at: "2026-10-26 10:12",
    status: "ready",
    summary: "覆盖 118 亩，发现灯杆倾斜 1 处，已转市政照明处置。",
  },
];

export const TEST_CASES: TestCase[] = [
  {
    id: "TC-01",
    name: "正常巡检任务",
    input: "巡检滨江东路消防通道，高度 55m",
    expected: "生成计划并进入待确认",
    actual: "生成 plan-3，进入待确认",
    pass: true,
    toolId: "task.create",
    traceId: "TR-20261029-0901",
  },
  {
    id: "TC-02",
    name: "未指定巡检区域",
    input: "帮我巡检一下",
    expected: "追问区域，不生成任务",
    actual: "追问区域，等待用户圈选",
    pass: true,
  },
  {
    id: "TC-03",
    name: "设备离线",
    input: "用 M350-01 排查高架桥下堆积物",
    expected: "拒绝下发并提示 51002",
    actual: "拒绝下发，返回 51002 设备离线",
    pass: true,
    toolId: "task.create",
    traceId: "TR-20261028-1302",
  },
  {
    id: "TC-04",
    name: "电量不足",
    input: "用 M30T-02 执行 40 分钟长航线",
    expected: "提示电量不足，建议更换设备",
    actual: "提示电量不足并给出 2 台替代设备",
    pass: true,
    toolId: "device.list_available",
  },
  {
    id: "TC-05",
    name: "空域前置条件校验失败",
    input: "11:00 在南湖公园东侧水域执行",
    expected: "校验失败并给出可执行时间窗",
    actual: "校验通过，未识别游船作业时段",
    pass: false,
    failReason: "空域规则未覆盖临时作业窗口，需补充数据源",
    toolId: "route.validate",
  },
  {
    id: "TC-06",
    name: "工具调用超时",
    input: "巡查河道漂浮物",
    expected: "重试 1 次后失败并回写原因",
    actual: "重试 1 次后失败，返回 42003",
    pass: true,
    toolId: "route.generate",
    traceId: "TR-20261026-1640",
  },
  {
    id: "TC-07",
    name: "模型返回不完整参数",
    input: "把高度改一下",
    expected: "追问具体数值与单位",
    actual: "追问「调整到多少米」并给出范围 20–120",
    pass: true,
  },
  {
    id: "TC-08",
    name: "高风险动作需人工确认",
    input: "直接把这个任务取消掉",
    expected: "生成取消申请，等待人工确认",
    actual: "生成取消申请，状态为「申请取消」",
    pass: true,
    toolId: "task.cancel",
  },
];

export const KB_DOCS: KbDoc[] = [
  { id: "KB-01", name: "无人机飞行安全操作规程（2026 版）", source: "上传 · PDF", size: "2.4 MB", indexedAt: "2026-10-20 11:20", state: "indexed", chunks: 186, citations: 42, type: "manual", owner: "安全科", version: "2026.1", pages: 42 },
  { id: "KB-02", name: "滨江东路消防通道巡查标准", source: "上传 · DOCX", size: "384 KB", indexedAt: "2026-10-21 09:05", state: "indexed", chunks: 48, citations: 18, type: "sop", owner: "巡检一组", version: "v3", pages: 12 },
  { id: "KB-03", name: "M30T 设备维护手册", source: "上传 · PDF", size: "8.1 MB", indexedAt: "2026-10-22 15:40", state: "indexed", chunks: 402, citations: 26, type: "manual", owner: "装备科", version: "2.4", pages: 128 },
  { id: "KB-04", name: "巡检事件分级与处置规范", source: "上传 · DOCX", size: "512 KB", indexedAt: "2026-10-24 10:12", state: "indexed", chunks: 64, citations: 31, type: "regulation", owner: "调度中心", version: "v5", pages: 18 },
  { id: "KB-05", name: "空域申报流程说明", source: "同步 · 业务平台", size: "—", indexedAt: "2026-10-28 18:00", state: "indexing", chunks: 0, citations: 0, type: "regulation", owner: "空域协调组", version: "v2", pages: 9, stage: 2, stageLabel: "切分片段", stageProgress: 62 },
  { id: "KB-06", name: "2025 年度作业复盘", source: "上传 · PPTX", size: "12.6 MB", indexedAt: "—", state: "failed", chunks: 0, citations: 0, type: "case", owner: "运营组", version: "v1", pages: 36, stage: 0, stageProgress: 18, error: "PPTX 内嵌图片无法解析，已跳过 14 页；请转存 PDF 后重试" },
];

export const AGENT_VERSIONS: AgentVersion[] = [
  { id: "AV-142", agentId: "AGENT-COPILOT-OPS", version: "1.4.2", state: "published", note: "补充低电量返航策略与事件上报工具", at: "2026-10-24 16:02", author: "陈默" },
  { id: "AV-141", agentId: "AGENT-COPILOT-OPS", version: "1.4.1", state: "archived", note: "修复航线校验参数缺失", at: "2026-10-18 10:31", author: "陈默" },
  { id: "AV-150", agentId: "AGENT-COPILOT-OPS", version: "1.5.0-draft", state: "draft", note: "接入临时空域窗口校验", at: "2026-10-29 08:10", author: "林可" },
  { id: "AV-201", agentId: "AGENT-REPORT", version: "0.9.3", state: "published", note: "报告摘要生成与异常归类", at: "2026-10-21 15:40", author: "周航" },
  { id: "AV-202", agentId: "AGENT-REPORT", version: "1.0.0-draft", state: "draft", note: "增加处置建议段落", at: "2026-10-28 11:05", author: "周航" },
];

export const AUDIT_LOGS = [
  { id: "A-9021", at: "2026-10-29 09:43:20", actor: "陈默", action: "确认任务计划", target: "T-20261029-01 / plan-3", risk: "high" },
  { id: "A-9020", at: "2026-10-29 08:36", actor: "林可", action: "保存航线草稿", target: "R-003 / v5", risk: "mid" },
  { id: "A-9019", at: "2026-10-28 17:11", actor: "系统", action: "自动返航", target: "UAV-03", risk: "mid" },
  { id: "A-9018", at: "2026-10-28 13:10", actor: "陈默", action: "查询失败任务", target: "session S-104", risk: "low" },
  { id: "A-9017", at: "2026-10-28 10:41", actor: "系统", action: "事件上报", target: "E-2026-0109", risk: "mid" },
];

export const ROLES = [
  { id: "role-ops", name: "作业值班员", members: 6, tools: ["device.get_status", "device.list_available", "route.generate", "route.validate", "task.create"], confirm: true },
  { id: "role-lead", name: "值班长", members: 2, tools: ["task.cancel", "event.report"], confirm: true },
  { id: "role-admin", name: "系统管理员", members: 1, tools: ["*"], confirm: false },
  { id: "role-audit", name: "安全审计", members: 1, tools: [], confirm: true },
];

export const METRIC_SERIES = [
  { d: "10-23", tasks: 6, done: 6, events: 2 },
  { d: "10-24", tasks: 8, done: 7, events: 3 },
  { d: "10-25", tasks: 5, done: 5, events: 1 },
  { d: "10-26", tasks: 9, done: 8, events: 4 },
  { d: "10-27", tasks: 7, done: 7, events: 3 },
  { d: "10-28", tasks: 10, done: 9, events: 2 },
  { d: "10-29", tasks: 4, done: 1, events: 1 },
];

export const deviceById = (id: string) => DEVICES.find((d) => d.id === id);
export const areaById = (id: string) => AREAS.find((a) => a.id === id);
export const routeById = (id: string) => ROUTES.find((r) => r.id === id);
export const eventById = (id: string) => EVENTS.find((e) => e.id === id);
export const reportById = (id: string) => REPORTS.find((r) => r.id === id);
export const toolById = (id: string) => TOOLS.find((t) => t.id === id);

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  pending_confirm: "待确认",
  queued: "待执行",
  running: "执行中",
  done: "已完成",
  failed: "异常",
  cancelled: "已取消",
};

export const ROUTE_STATUS_LABEL: Record<RouteStatus, string> = {
  published: "已发布",
  draft: "草稿",
  invalid: "校验不通过",
};

export const EVENT_STATUS_LABEL: Record<EventStatus, string> = {
  pending: "待确认",
  processing: "处理中",
  resolved: "已解决",
  false_positive: "误报",
};

export const LEVEL_LABEL: Record<"high" | "mid" | "low", string> = {
  high: "高",
  mid: "中",
  low: "低",
};

export const RISK_LABEL: Record<"low" | "mid" | "high", string> = {
  low: "低风险",
  mid: "中风险",
  high: "高风险",
};

export const TASK_STATUS_TONE: Record<TaskStatus, string> = {
  pending_confirm: "warn",
  queued: "info",
  running: "active",
  done: "ok",
  failed: "danger",
  cancelled: "muted",
};

export const EVENT_STATUS_TONE: Record<EventStatus, string> = {
  pending: "warn",
  processing: "info",
  resolved: "ok",
  false_positive: "muted",
};
