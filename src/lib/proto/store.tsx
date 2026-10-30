"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  AGENT_VERSIONS,
  AREAS,
  AUDIT_LOGS,
  DEVICES,
  EVENTS,
  KB_DOCS,
  REPORTS,
  ROLES,
  ROUTES,
  SESSIONS,
  TASKS,
  TOOLS,
  TRACES,
  TEST_CASES,
  WORKFLOWS,
  type AgentVersion,
  type Area,
  type ChatMsg,
  type DroneEvent,
  type KbDoc,
  type Report,
  type RoutePlan,
  type Session,
  type Task,
  type TestCase,
  type TaskStatus,
  type ToolDef,
  type Trace,
  type Workflow,
} from "./data";
import {
  ANNOTATIONS,
  DATASETS,
  EXPERIMENTS,
  FIX_RECORDS,
  GATE_RULES,
  MONITOR_SAMPLES,
  MONITOR_STATS,
  RELEASES,
  buildResults,
  evaluateGate,
  type Annotation,
  type EvalCase,
  type EvalDataset,
  type EvalExperiment,
  type FailType,
  type FixRecord,
  type GateRule,
  type MonitorSample,
  type ReleaseRecord,
} from "./eval-data";
import {
  CONTEXT_POLICIES,
  MODELS,
  OUTPUT_SCHEMAS,
  PROMPTS,
  ROUTING_LOGS,
  ROUTING_RULES,
  SYSTEM_PROMPT_ID,
  buildPromptGate,
  type ContextPolicy,
  type ModelDef,
  type OutputSchema,
  type PromptDef,
  type PromptVersion,
  type RoutingLog,
  type RoutingRule,
  type SchemaField,
} from "./ai-data";
import {
  applyWorkflowEdit,
  buildWorkflowDraft,
  buildWorkflowTrace,
  seedCopilotWorkflow,
  COPILOT_SESSION_SEED,
  simulateWorkflowRun,
  workflowIssues,
  type WorkflowIssue,
} from "./workflow-data";
import {
  CURRENT_CONFIG_ID,
  EMBEDDING_MODELS,
  KB_CHUNKS,
  KB_PARSE_STAGES,
  RERANK_MODELS,
  RETRIEVAL_CONFIGS,
  VECTOR_INDEXES,
  buildRagTrace,
  makeRetrievalRun,
  searchableChunks,
  syntheticChunks,
  type KbChunk,
  type KnowledgeDocType,
  type RagPath,
  type RetrievalConfig,
  type RetrievalRun,
} from "./rag-data";
import {
  AGENT_SKILLS,
  MCP_SERVERS,
  buildSkillTrace,
  makeSkillRun,
  publishedVersion,
  type AgentSkill,
  type McpServer,
  type SkillRun,
  type SkillStep,
} from "./skill-data";

export type Toast = { id: number; text: string; tone: "ok" | "info" | "warn" | "danger" };

type Role = (typeof ROLES)[number];

interface EvalState {
  datasets: EvalDataset[];
  experiments: EvalExperiment[];
  annotations: Annotation[];
  fixes: FixRecord[];
  samples: MonitorSample[];
  gateRules: GateRule[];
  releases: ReleaseRecord[];
}

interface AiState {
  prompts: PromptDef[];
  contextPolicies: ContextPolicy[];
  schemas: OutputSchema[];
  models: ModelDef[];
  routingRules: RoutingRule[];
  routingLogs: RoutingLog[];
}

interface RagState {
  embeddingModels: typeof EMBEDDING_MODELS;
  rerankModels: typeof RERANK_MODELS;
  indexes: typeof VECTOR_INDEXES;
  configs: RetrievalConfig[];
  chunks: KbChunk[];
  runs: RetrievalRun[];
}

interface SkillState {
  items: AgentSkill[];
  runs: SkillRun[];
}

interface McpState {
  servers: McpServer[];
}

interface State {
  seedVersion: number;
  tasks: Task[];
  areas: Area[];
  events: DroneEvent[];
  routes: RoutePlan[];
  workflows: Workflow[];
  sessions: Session[];
  traces: Trace[];
  reports: Report[];
  kbDocs: KbDoc[];
  audits: typeof AUDIT_LOGS;
  tools: ToolDef[];
  agents: AgentVersion[];
  roles: Role[];
  testCases: TestCase[];
  eval: EvalState;
  ai: AiState;
  rag: RagState;
  skills: SkillState;
  mcp: McpState;
}

const aiSnapshot = (): AiState => ({
  prompts: structuredClone(PROMPTS),
  contextPolicies: structuredClone(CONTEXT_POLICIES),
  schemas: structuredClone(OUTPUT_SCHEMAS),
  models: structuredClone(MODELS),
  routingRules: structuredClone(ROUTING_RULES),
  routingLogs: structuredClone(ROUTING_LOGS),
});

const SEED_QUESTION = "M350-01 为什么提示电池温度异常？";

const seedRun = (): RetrievalRun =>
  makeRetrievalRun({
    id: "RR-20261029-0007",
    traceId: "TR-RAG-20261029-0912",
    sessionId: "S-101",
    question: SEED_QUESTION,
    path: "rag+tool",
    config: RETRIEVAL_CONFIGS.find((c) => c.id === CURRENT_CONFIG_ID) ?? RETRIEVAL_CONFIGS[0],
    chunks: KB_CHUNKS,
    docs: KB_DOCS,
    createdAt: "2026-10-29 09:12:04",
    toolCall: { toolId: "device.get_status", summary: "M350-01 · 在线 · 电池温度 48.6℃ · 告警阈值 45℃" },
  });

const ragSnapshot = (): RagState => ({
  embeddingModels: structuredClone(EMBEDDING_MODELS),
  rerankModels: structuredClone(RERANK_MODELS),
  indexes: structuredClone(VECTOR_INDEXES),
  configs: structuredClone(RETRIEVAL_CONFIGS),
  chunks: structuredClone(KB_CHUNKS),
  runs: [seedRun()],
});

const skillSnapshot = (): SkillState => ({ items: structuredClone(AGENT_SKILLS), runs: [] });
const mcpSnapshot = (): McpState => ({ servers: structuredClone(MCP_SERVERS) });

const systemPromptKey = (prompts: PromptDef[]): string | undefined => {
  const p = prompts.find((x) => x.id === SYSTEM_PROMPT_ID);
  const v = p?.versions.find((x) => x.state === "published");
  return p && v ? `${p.id}@${v.version}` : undefined;
};

const snapshot = (): State => ({
  seedVersion: SEED_VERSION,
  tasks: structuredClone(TASKS),
  areas: structuredClone(AREAS),
  events: structuredClone(EVENTS),
  routes: structuredClone(ROUTES),
  workflows: [seedCopilotWorkflow(), ...structuredClone(WORKFLOWS)],
  sessions: [structuredClone(COPILOT_SESSION_SEED), ...structuredClone(SESSIONS)],
  traces: [...structuredClone(TRACES).map((t) => ({ ...t, promptVersion: t.promptVersion ?? "PR-COPILOT-SYS@v1.2.0" })), buildRagTrace(seedRun())],
  reports: structuredClone(REPORTS),
  kbDocs: structuredClone(KB_DOCS),
  audits: structuredClone(AUDIT_LOGS),
  tools: structuredClone(TOOLS),
  agents: structuredClone(AGENT_VERSIONS),
  roles: structuredClone(ROLES),
  testCases: structuredClone(TEST_CASES),
  eval: {
    datasets: structuredClone(DATASETS),
    experiments: structuredClone(EXPERIMENTS),
    annotations: structuredClone(ANNOTATIONS),
    fixes: structuredClone(FIX_RECORDS),
    samples: structuredClone(MONITOR_SAMPLES),
    gateRules: structuredClone(GATE_RULES),
    releases: structuredClone(RELEASES),
  },
  ai: aiSnapshot(),
  rag: ragSnapshot(),
  skills: skillSnapshot(),
  mcp: mcpSnapshot(),
});

let seq = 0;
const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}${(seq++).toString(36)}`;
const idTail = () => Math.random().toString(36).slice(2, 6).toUpperCase();
const dayStamp = () => {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
};

const clock = (offsetSec = 0) => {
  const d = new Date(Date.now() + offsetSec * 1000);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
};

const stamp = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

const bumpDraft = (version: string) => {
  const [maj, min] = version.replace(/-draft$/, "").split(".");
  return `${maj}.${Number(min) + 1}-draft`;
};

const PERSIST_KEY = "proto-demo-state-v1";
// 种子数据（模型注册表、路由规则等）改版后递增此值：旧会话缓存会让页面继续显示上一版数据
const SEED_VERSION = 2;
const SEED_TASK_IDS = new Set(TASKS.map((t) => t.id));

// 刷新会丢掉执行中的定时器，把本轮新建且未收尾的任务按已有进度收尾，避免演示卡在「执行中」
function reconcile(saved: State): State {
  const stuck = saved.tasks.filter((t) => !SEED_TASK_IDS.has(t.id) && (t.status === "running" || t.status === "queued"));
  if (!stuck.length) return saved;
  let next = saved;
  for (const t of stuck) {
    const reportId = t.reportId ?? `RP-${t.id.slice(2)}`;
    const report: Report = {
      id: reportId,
      name: `${t.name}报告`,
      taskId: t.id,
      at: stamp(),
      status: "ready",
      summary: "页面刷新时按已有进度收尾，报告内容为模拟生成。",
    };
    next = {
      ...next,
      tasks: next.tasks.map((x) =>
        x.id === t.id
          ? {
              ...x,
              status: "done",
              progress: 100,
              reportId,
              steps: x.steps.map((st) => ({ ...st, state: "done" as const, at: st.at ?? clock() })),
            }
          : x
      ),
      reports: next.reports.some((r) => r.id === reportId) ? next.reports : [report, ...next.reports],
      traces: next.traces.map((tr) => (tr.taskId === t.id && tr.status === "running" ? { ...tr, status: "ok" as const } : tr)),
    };
  }
  return next;
}

function loadPersisted(): State | null {
  try {
    const raw = window.sessionStorage.getItem(PERSIST_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as State;
    if (!Array.isArray(saved?.tasks) || !Array.isArray(saved?.tools) || !saved?.eval) return null;
    if (saved.seedVersion !== SEED_VERSION) return null;
    const ai = aiSnapshot();
    const rag = ragSnapshot();
    const skills = skillSnapshot();
    const mcp = mcpSnapshot();
    const merged: State = {
      ...saved,
      ai: {
        prompts: (() => {
          const stored = Array.isArray(saved.ai?.prompts) ? saved.ai.prompts : ai.prompts;
          const seedSys = ai.prompts.find((p) => p.id === SYSTEM_PROMPT_ID);
          const hasSys = stored.some((p) => p.id === SYSTEM_PROMPT_ID);
          const base = hasSys ? stored : seedSys ? [seedSys, ...stored] : stored;
          return base.map((p) =>
            p.id === SYSTEM_PROMPT_ID
              ? { ...p, versions: p.versions.map((v) => ({ ...v, gate: v.gate ?? buildPromptGate(v) })) }
              : p,
          );
        })(),
        contextPolicies: Array.isArray(saved.ai?.contextPolicies) ? saved.ai.contextPolicies : ai.contextPolicies,
        schemas: Array.isArray(saved.ai?.schemas) ? saved.ai.schemas : ai.schemas,
        models: Array.isArray(saved.ai?.models) ? saved.ai.models : ai.models,
        routingRules: Array.isArray(saved.ai?.routingRules) ? saved.ai.routingRules : ai.routingRules,
        routingLogs: Array.isArray(saved.ai?.routingLogs) ? saved.ai.routingLogs : ai.routingLogs,
      },
      rag: {
        embeddingModels: Array.isArray(saved.rag?.embeddingModels) ? saved.rag.embeddingModels : rag.embeddingModels,
        rerankModels: Array.isArray(saved.rag?.rerankModels) ? saved.rag.rerankModels : rag.rerankModels,
        indexes: Array.isArray(saved.rag?.indexes) ? saved.rag.indexes : rag.indexes,
        configs: Array.isArray(saved.rag?.configs) ? saved.rag.configs : rag.configs,
        chunks: Array.isArray(saved.rag?.chunks) ? saved.rag.chunks : rag.chunks,
        runs: Array.isArray(saved.rag?.runs) && saved.rag.runs.length ? saved.rag.runs : rag.runs,
      },
      skills: {
        items: Array.isArray(saved.skills?.items) && saved.skills.items.length ? saved.skills.items : skills.items,
        runs: Array.isArray(saved.skills?.runs) ? saved.skills.runs : skills.runs,
      },
      mcp: {
        servers: Array.isArray(saved.mcp?.servers) && saved.mcp.servers.length ? saved.mcp.servers : mcp.servers,
      },
      workflows: (() => {
        const stored: Workflow[] =
          Array.isArray(saved.workflows) && saved.workflows.length ? saved.workflows : [seedCopilotWorkflow(), ...structuredClone(WORKFLOWS)];
        const list = stored.map((w) => ({
          ...w,
          source: w.source ?? ("manual" as const),
          enabled: w.enabled ?? w.status === "published",
          triggerKind:
            w.triggerKind ?? (/定时|cron|每天|每周|每小时/.test(w.trigger) ? ("schedule" as const) : /事件/.test(w.trigger) ? ("event" as const) : ("manual" as const)),
          rev: w.rev ?? 1,
          version: w.version ?? (w.status === "published" ? "v1.0" : "draft r1"),
          resources: w.resources ?? [],
          missing: w.missing ?? [],
          history: w.history ?? [],
          updatedAt: w.updatedAt ?? w.lastRun,
          updatedBy: w.updatedBy ?? "陈默",
          runs: (w.runs ?? []).map((r) => (r.state === "running" ? { ...r, state: "ok" as const } : r)),
        }));
        return list.some((w) => w.id === "WF-05") ? list : [seedCopilotWorkflow(), ...list];
      })(),
      sessions: saved.sessions.some((x) => x.id === COPILOT_SESSION_SEED.id)
        ? saved.sessions
        : [structuredClone(COPILOT_SESSION_SEED), ...saved.sessions],
    };
    const seededTrace = buildRagTrace(merged.rag.runs[0]);
    if (!merged.traces.some((t) => t.id === seededTrace.id)) {
      merged.traces = [...merged.traces, seededTrace];
    }
    return reconcile(merged);
  } catch {
    return null;
  }
}


interface ProtoApi {
  state: State;
  toasts: Toast[];
  toast: (text: string, tone?: Toast["tone"]) => void;
  dismissToast: (id: number) => void;
  resetDemo: () => void;

  createSession: (title: string, mode: string) => Session;
  addMsg: (sessionId: string, msg: Omit<ChatMsg, "id">) => void;
  deleteSession: (id: string) => void;
  renameSession: (id: string, title: string) => void;

  createPlan: (input: {
    area: Area;
    deviceId: string;
    alt: number;
    speed: number;
    lens: string;
    sessionId?: string;
    skillId?: string;
    skillVersionId?: string;
  }) => Task;
  addArea: (area: Area) => void;
  updatePlan: (taskId: string, patch: { alt?: number; speed?: number; deviceId?: string }) => void;
  confirmTask: (taskId: string) => void;
  cancelPlan: (taskId: string) => void;
  requestCancel: (taskId: string) => void;
  resolveCancel: (taskId: string, accept: boolean) => void;

  setEventStatus: (id: string, status: DroneEvent["status"], disposal?: string, handler?: string) => void;
  createEvent: (e: DroneEvent) => void;

  addRoute: (route: RoutePlan) => void;
  saveRoute: (id: string, waypoints: RoutePlan["waypoints"], note: string) => void;
  publishRoute: (id: string) => void;

  addWorkflow: (name: string, trigger: string) => Workflow;
  publishWorkflow: (id: string) => void;
  runWorkflow: (id: string) => void;
  saveWorkflowNode: (id: string, nodeId: string, label: string, config: string) => void;
  saveWorkflowGraph: (id: string, nodes: Workflow["nodes"], edges: Workflow["edges"]) => void;
  saveWorkflowDraft: (id: string, nodes: Workflow["nodes"], edges: Workflow["edges"]) => void;
  createWorkflowFromPrompt: (
    text: string,
    opts?: { sessionId?: string; by?: string },
  ) => { workflow: Workflow; reply: string; traceId: string; missing: string[] } | null;
  modifyWorkflowFromPrompt: (
    id: string,
    text: string,
    opts?: { by?: string },
  ) => { workflow: Workflow; reply: string; diff: string[]; traceId: string; changed: boolean } | null;
  validateWorkflow: (id: string, snapshot?: { nodes: Workflow["nodes"]; edges: Workflow["edges"] }) => { issues: WorkflowIssue[]; traceId: string } | null;
  toggleWorkflowEnabled: (id: string) => void;
  bindWorkflowResource: (id: string, nodeId: string, channel: string) => void;

  toggleTool: (id: string) => void;
  saveTool: (tool: ToolDef) => void;

  saveAgentDraft: (patch: { model?: string; temperature?: number; prompt?: string; tools?: string[] }) => void;
  publishAgentDraft: (agentId: string) => void;

  updateRoleTools: (roleId: string, tools: string[]) => void;
  addKbDoc: (name: string, type?: KnowledgeDocType) => void;
  retryKbDoc: (id: string) => void;
  rebuildKbIndex: () => void;
  saveRetrievalConfig: (id: string, patch: Partial<RetrievalConfig>) => void;
  publishRetrievalConfig: (id: string) => void;
  runRetrieval: (
    question: string,
    opts?: {
      configId?: string;
      path?: RagPath;
      sessionId?: string;
      createTrace?: boolean;
      toolCall?: RetrievalRun["toolCall"];
    },
  ) => RetrievalRun;

  createDataset: (input: { name: string; desc: string; tags: string[] }) => EvalDataset;
  addCase: (
    datasetId: string,
    input: {
      name: string;
      input: string;
      expectedIntent: string;
      expectedTools: string[];
      expectedResult: string;
      tags: string[];
      safety: boolean;
      source: EvalCase["source"];
      traceId?: string;
    },
  ) => void;
  saveDatasetVersion: (id: string, note: string) => void;
  startExperiment: (input: {
    name: string;
    datasetId: string;
    agentVersion: string;
    model: string;
    promptVersion: string;
    schemaVersion?: string;
    routingPolicy?: string;
    retrievalConfig?: string;
    toolsVersion: string;
    workflowVersion: string;
    evaluatorIds: string[];
    baselineId?: string;
  }) => EvalExperiment;
  runExperiment: (id: string) => void;
  annotate: (id: string, verdict: "model_ok" | "model_error", note: string) => void;
  createFix: (input: {
    title: string;
    failType: FailType;
    caseIds: string[];
    experimentId?: string;
    cause: string;
    action: string;
    targetVersion: string;
  }) => void;
  updateFixStatus: (id: string, status: FixRecord["status"]) => void;
  reviewSample: (id: string, verdict: "issue" | "false_positive", note: string) => void;
  addSampleToDataset: (sampleId: string, datasetId: string) => void;
  recordRelease: (experimentId: string) => void;
  rollbackRelease: (id: string) => void;
  createAgentVersion: (agentId: string, version: string, note: string) => void;
  updateGateRule: (id: string, patch: { threshold?: number; enabled?: boolean }) => void;

  savePromptDraft: (
    promptId: string,
    patch: { system?: string; user?: string; model?: string; temperature?: number; maxTokens?: number; note?: string },
  ) => void;
  publishPrompt: (promptId: string) => void;
  rollbackPrompt: (promptId: string, version: string) => void;
  rerunPromptGate: (
    promptId: string,
    patch?: { system?: string; user?: string; model?: string; temperature?: number; maxTokens?: number; note?: string },
  ) => void;

  toggleSkill: (skillId: string) => void;
  createSkill: (input: { name: string; desc: string; scenarios: string[] }) => AgentSkill;
  saveSkillDraft: (skillId: string, patch: { steps?: SkillStep[]; note?: string }) => void;
  publishSkill: (skillId: string) => void;
  runSkill: (
    skillId: string,
    question: string,
    opts?: { versionId?: string; sessionId?: string; createTrace?: boolean },
  ) => SkillRun | null;

  toggleMcpServer: (serverId: string) => void;
  discoverMcp: (serverId: string) => void;
  testMcpConnection: (serverId: string) => void;
  registerMcpServer: (input: { name: string; endpoint: string; transport: McpServer["transport"] }) => McpServer;

  saveContextPolicy: (
    policyId: string,
    patch: { maxTokens?: number; reserveForOutput?: number; sources?: ContextPolicy["sources"] },
  ) => void;
  toggleContextSource: (policyId: string, sourceId: string) => void;

  saveSchemaDraft: (schemaId: string, fields: SchemaField[], note: string) => void;
  publishSchema: (schemaId: string) => void;
  rollbackSchema: (schemaId: string, version: string) => void;
  setSchemaPolicy: (schemaId: string, patch: { onInvalid?: OutputSchema["policy"]["onInvalid"]; maxRetry?: number }) => void;

  saveRoutingRule: (ruleId: string, patch: Partial<Omit<RoutingRule, "id">>) => void;
  toggleModelAvailability: (modelId: string) => void;
  simulateRoute: (taskType: string, traceId?: string) => RoutingLog | null;
}

const Ctx = createContext<ProtoApi | null>(null);

export function ProtoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(snapshot);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const restored = loadPersisted();
    if (restored) setState(restored);
  }, []);

  useEffect(() => {
    const save = () => {
      try {
        window.sessionStorage.setItem(PERSIST_KEY, JSON.stringify(stateRef.current));
      } catch {}
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") save();
    };
    window.addEventListener("pagehide", save);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", save);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const agentDraft = useRef({ model: "deepseek-v4-pro", temperature: 0.2, prompt: "你是无人机作业 Copilot…", tools: ["device.get_status", "route.generate", "route.validate", "task.create"] });

  const toast = useCallback((text: string, tone: Toast["tone"] = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, tone }]);
    timers.current.push(
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200)
    );
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const resetDemo = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    try {
      window.sessionStorage.removeItem(PERSIST_KEY);
    } catch {}
    setState(snapshot());
    toast("演示数据已重置", "info");
  }, [toast]);

  const patchTask = useCallback((id: string, patch: (t: Task) => Task) => {
    setState((s) => ({ ...s, tasks: s.tasks.map((t) => (t.id === id ? patch(t) : t)) }));
  }, []);

  const addMsg = useCallback((sessionId: string, msg: Omit<ChatMsg, "id">) => {
    setState((s) => ({
      ...s,
      sessions: s.sessions.map((x) =>
        x.id === sessionId ? { ...x, msgs: [...x.msgs, { ...msg, id: uid("m") }] } : x
      ),
    }));
  }, []);

  const createSession = useCallback((title: string, mode: string) => {
    const session: Session = {
      id: uid("S"),
      title,
      at: stamp(),
      mode,
      msgs: [],
    };
    setState((s) => ({ ...s, sessions: [session, ...s.sessions] }));
    return session;
  }, []);

  const deleteSession = useCallback((id: string) => {
    setState((s) => ({ ...s, sessions: s.sessions.filter((x) => x.id !== id) }));
  }, []);

  const renameSession = useCallback<ProtoApi["renameSession"]>((id, title) => {
    setState((s) => ({ ...s, sessions: s.sessions.map((x) => (x.id === id ? { ...x, title } : x)) }));
  }, []);

  const pushTrace = useCallback((trace: Trace) => {
    setState((s) => ({ ...s, traces: [trace, ...s.traces] }));
  }, []);

  const createPlan = useCallback<ProtoApi["createPlan"]>(
    ({ area, deviceId, alt, speed, lens, sessionId, skillId, skillVersionId }) => {
      const skill = skillId ? stateRef.current.skills.items.find((x) => x.id === skillId) : undefined;
      const skillVersion = skill ? skill.versions.find((v) => v.id === skillVersionId) ?? publishedVersion(skill) : undefined;
      const areaId = area.id;
      const route = ROUTES.find((r) => r.areaId === areaId && r.status !== "invalid") ?? ROUTES[0];
      const device = DEVICES.find((d) => d.id === deviceId)!;
      const id = `T-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}${String(
        new Date().getDate()
      ).padStart(2, "0")}-${String(90 + Math.floor(Math.random() * 9))}`;
      const task: Task = {
        id,
        name: `${area.name}巡检`,
        type: "日常巡检",
        deviceId,
        areaId,
        routeId: route.id,
        status: "pending_confirm",
        progress: 0,
        createdAt: stamp(),
        operator: "值班员 · 陈默",
        planVersion: "plan-1",
        alt,
        speed,
        checks: [
          { level: "ok", text: `空域与飞行计划：无冲突` },
          {
            level: device.battery >= 40 ? "ok" : "warn",
            text: `设备健康：${device.name} 电量 ${device.battery}%，${device.battery >= 40 ? "满足往返" : "低于建议值 40%"}`,
          },
          {
            level: alt >= 20 && alt <= 120 ? "ok" : "error",
            text: `航线参数：高度 ${alt}m，速度 ${speed}m/s，${alt >= 20 && alt <= 120 ? "在范围内" : "超出范围 20–120m"}`,
          },
          {
            level: area.mu > 100 ? "warn" : "ok",
            text:
              area.mu > 100
                ? `作业区域 ${area.mu} 亩，超出单架次覆盖建议值，将拆分为 2 段执行`
                : `作业区域 ${area.mu} 亩，单架次可覆盖`,
          },
          { level: "warn", text: "区域内存在人群活动，建议开启喊话器提示" },
        ],
        steps: [
          { key: "s0", label: "创建", state: "done", at: clock() },
          { key: "s1", label: "校验", state: "done", at: clock(), note: "生成计划并完成 5 项校验" },
          { key: "s2", label: "确认", state: "active" },
          { key: "s3", label: "下发", state: "todo" },
          { key: "s4", label: "执行", state: "todo" },
          { key: "s5", label: "完成", state: "todo" },
        ],
        eventIds: [],
        traceId: uid("TR"),
        sessionId,
        skillId: skill?.id,
        skillVersionId: skillVersion?.id,
      };
      const trace: Trace = {
        id: task.traceId,
        taskId: id,
        sessionId,
        agentId: "AGENT-COPILOT-OPS@1.4.2",
        totalMs: 12040,
        status: "running",
        skillId: skill?.id,
        skillVersionId: skillVersion?.id,
        steps: [
          { key: "p1", label: "接收消息", kind: "message", state: "done", startedAt: clock(), ms: 160, input: "自然语言巡检请求", output: "归一化文本 1 条" },
          ...(skill && skillVersion
            ? [
                {
                  key: "p1a",
                  label: "Skill 选择",
                  kind: "intent" as const,
                  state: "done" as const,
                  startedAt: clock(),
                  ms: 380,
                  input: `Agent AGENT-COPILOT-OPS@1.4.2 · 候选 ${stateRef.current.skills.items.length} 个 Skill`,
                  output: `${skill.name} ${skillVersion.version}`,
                },
              ]
            : []),
          { key: "p2", label: "意图解析", kind: "intent", state: "done", startedAt: clock(1), ms: 2100, input: "巡检请求", output: `intent = patrol_task · area = ${areaId}` },
          { key: "p3", label: "设备筛选", kind: "query", state: "done", startedAt: clock(3), ms: 540, input: `area_id=${areaId}`, output: `指定设备 ${deviceId}` },
          { key: "p4", label: "生成航线草稿", kind: "tool", state: "done", startedAt: clock(4), ms: 6200, input: `route.generate{alt:${alt}, speed:${speed}, lens:${lens}}`, output: `${route.id} · ${route.waypoints.length} 航点` },
          { key: "p5", label: "安全校验", kind: "guard", state: "done", startedAt: clock(10), ms: 680, input: "plan-1", output: "4 通过 · 1 提示" },
          { key: "p6", label: "等待人工确认", kind: "confirm", state: "waiting", startedAt: clock(11), ms: 0, input: "plan-1", output: "已生成确认卡" },
        ],
      };
      setState((s) => ({ ...s, tasks: [task, ...s.tasks], traces: [trace, ...s.traces] }));
      return task;
    },
    []
  );

  const addArea = useCallback<ProtoApi["addArea"]>((a) => {
    setState((s) => ({ ...s, areas: [...s.areas, a] }));
    toast("新区域已登记，可用于任务计划", "ok");
  }, [toast]);

  const updatePlan = useCallback<ProtoApi["updatePlan"]>((taskId, patch) => {
    setState((s) => {
      const tasks = s.tasks.map((t) => {
        if (t.id !== taskId) return t;
        const version = `plan-${Number(t.planVersion.split("-")[1] ?? 1) + 1}`;
        const routeWp = ROUTES.find((r) => r.id === t.routeId)?.waypoints[0];
        const alt = patch.alt ?? t.alt ?? routeWp?.alt ?? 55;
        const speed = patch.speed ?? t.speed ?? routeWp?.speed ?? 6;
        const inRange = alt >= 20 && alt <= 120;
        const deviceId = patch.deviceId ?? t.deviceId;
        const device = DEVICES.find((d) => d.id === deviceId)!;
        const checks = t.checks.map((c) =>
          c.text.startsWith("航线参数")
            ? { level: (inRange ? "ok" : "error") as "ok" | "error", text: `航线参数：高度 ${alt}m，速度 ${speed}m/s，${inRange ? "在范围内" : "超出范围 20–120m"}` }
            : c.text.startsWith("设备健康")
            ? { level: (device.battery >= 40 ? "ok" : "warn") as "ok" | "warn", text: `设备健康：${device.name} 电量 ${device.battery}%，${device.battery >= 40 ? "满足往返" : "低于建议值 40%"}` }
            : c
        );
        if (!checks.some((c) => c.text.startsWith("航线参数"))) {
          checks.push({ level: (inRange ? "ok" : "error") as "ok" | "error", text: `航线参数：高度 ${alt}m，速度 ${speed}m/s，${inRange ? "在范围内" : "超出范围 20–120m"}` });
        }
        return {
          ...t,
          deviceId,
          planVersion: version,
          alt,
          speed,
          checks,
        };
      });
      return { ...s, tasks };
    });
    toast("计划已更新并重新校验", "ok");
  }, [toast]);

  const confirmTask = useCallback<ProtoApi["confirmTask"]>(
    (taskId) => {
      const task = state.tasks.find((t) => t.id === taskId);
      if (!task) return;
      const hasError = task.checks.some((c) => c.level === "error");
      if (hasError) {
        toast("存在校验错误，无法下发", "danger");
        return;
      }
      const sessionId = task.sessionId;
      const area = state.areas.find((a) => a.id === task.areaId) ?? AREAS[0];

      patchTask(taskId, (t) => ({
        ...t,
        status: "queued",
        steps: t.steps.map((s) =>
          s.key === "s2" ? { ...s, state: "done", note: "人工确认 · 陈默", at: clock() } : s.key === "s3" ? { ...s, state: "active" } : s
        ),
      }));
      setState((s) => ({
        ...s,
        audits: [
          { id: `A-${9000 + Math.floor(Math.random() * 900)}`, at: stamp(), actor: "陈默", action: "确认任务计划", target: `${taskId} / ${task.planVersion}`, risk: "high" },
          ...s.audits,
        ],
        traces: s.traces.map((tr) =>
          tr.taskId === taskId
            ? {
                ...tr,
                steps: [
                  ...tr.steps.map((st) => (st.kind === "confirm" ? { ...st, state: "done" as const, output: "陈默 已确认", ms: 2400, startedAt: clock() } : st)),
                  { key: "p7", label: "下发任务", kind: "tool" as const, state: "done" as const, startedAt: clock(1), ms: 860, input: "task.create{...}", output: `${taskId} · queued` },
                ],
              }
            : tr
        ),
      }));
      if (sessionId) {
        addMsg(sessionId, { role: "assistant", text: "确认完成，任务已下发。现在开始执行，我会持续同步进度；你可以随时在任务中心查看详情。", at: clock(), card: { kind: "progress", taskId } });
      }
      toast("已确认并下发任务", "ok");

      const t1 = setTimeout(() => {
        patchTask(taskId, (t) => ({
          ...t,
          status: "running",
          progress: 6,
          steps: t.steps.map((s) => (s.key === "s3" ? { ...s, state: "done", at: clock() } : s.key === "s4" ? { ...s, state: "active", note: "第 1/12 航点" } : s)),
        }));
      }, 900);
      timers.current.push(t1);

      const ticks = [14, 24, 33, 41, 52, 61, 72, 84, 93, 100];
      ticks.forEach((p, i) => {
        const timer = setTimeout(() => {
          const first = i === 0;
          const eventIndex = 4; // 52%
          const finishing = p === 100;
          if (i === eventIndex) {
            const event: DroneEvent = {
              id: `E-${new Date().getFullYear()}-${String(120 + Math.floor(Math.random() * 20))}`,
              title: "消防通道被车辆占用",
              type: "占道",
              level: "high",
              areaId: task.areaId,
              pos: { x: area.polygon[0].x + 96, y: area.polygon[0].y + 66 },
              at: stamp(),
              taskId,
              status: "pending",
              confidence: 0.92,
              evidence: "s1",
              note: `${area.name}中段停放两辆厢式货车，占据约 6m 宽通道。`,
            };
            setState((s) => ({
              ...s,
              events: [event, ...s.events],
              tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, eventIds: [...t.eventIds, event.id], progress: p } : t)),
            }));
            if (sessionId) {
              addMsg(sessionId, {
                role: "assistant",
                text: "执行中发现异常：通道中段被车辆占用。已生成事件并附上证据，建议转交属地处置。",
                at: clock(),
                card: { kind: "result", taskId },
              });
            }
            toast("巡检发现新事件：消防通道被车辆占用", "warn");
          } else if (finishing) {
            const reportId = `RP-${taskId.slice(2)}`;
            setState((s) => ({
              ...s,
              tasks: s.tasks.map((t) =>
                t.id === taskId
                  ? {
                      ...t,
                      status: "done" as TaskStatus,
                      progress: 100,
                      reportId,
                      steps: t.steps.map((x) => ({ ...x, state: "done" as const, note: x.key === "s4" ? "12/12 航点完成" : x.note })),
                    }
                  : t
              ),
              reports: s.reports.some((r) => r.id === reportId)
                ? s.reports
                : [
                    {
                      id: reportId,
                      name: `${task.name}报告`,
                      taskId,
                      at: stamp(),
                      status: "ready",
                      summary: `覆盖 ${area.mu} 亩，12 个航点，发现 1 处高风险占道。`,
                    },
                    ...s.reports,
                  ],
              traces: s.traces.map((tr) =>
                tr.taskId === taskId
                  ? {
                      ...tr,
                      status: "ok" as const,
                      steps: [
                        ...tr.steps,
                        { key: "p8", label: "执行回执", kind: "result" as const, state: "done" as const, startedAt: clock(), ms: 8600, input: taskId, output: "done · 12/12 航点" },
                      ],
                    }
                  : tr
              ),
            } as State));
            if (sessionId) {
              // 52% 已发过结果卡（读的是实时任务状态），这里只补文字，避免同一任务出现两张结果卡
              setState((s) => ({
                ...s,
                sessions: s.sessions.map((x) => {
                  if (x.id !== sessionId) return x;
                  const hasResultCard = x.msgs.some((m) => m.card?.kind === "result" && m.card.taskId === taskId);
                  const msg: ChatMsg = {
                    id: uid("m"),
                    role: "assistant",
                    text: "任务已完成，报告已生成。发现 1 处高风险事件（消防通道占用），其余检查项正常。",
                    at: clock(),
                    ...(hasResultCard ? {} : { card: { kind: "result" as const, taskId } }),
                  };
                  return { ...x, msgs: [...x.msgs, msg] };
                }),
              }));
            }
            toast("任务执行完成，报告已生成", "ok");
          } else {
            patchTask(taskId, (t) => ({
              ...t,
              progress: p,
              steps: t.steps.map((s) =>
                s.key === "s4" ? { ...s, note: `第 ${Math.max(1, Math.round((p / 100) * 12))}/12 航点` } : s
              ),
            }));
            if (first && sessionId) {
              addMsg(sessionId, { role: "system", text: "", at: clock(), card: { kind: "progress", taskId } });
            }
          }
        }, 900 + (i + 1) * 780);
        timers.current.push(timer);
      });
    },
    [state.tasks, state.areas, patchTask, addMsg, toast]
  );

  const cancelPlan = useCallback<ProtoApi["cancelPlan"]>(
    (taskId) => {
      patchTask(taskId, (t) => ({
        ...t,
        status: "cancelled",
        steps: t.steps.map((s) => (s.state === "active" ? { ...s, state: "error", note: "计划取消，未下发" } : s)),
      }));
      toast("计划已取消，任务未下发", "info");
    },
    [patchTask, toast]
  );

  const requestCancel = useCallback<ProtoApi["requestCancel"]>(
    (taskId) => {
      patchTask(taskId, (t) => ({ ...t, cancelState: "requesting" }));
      toast("已提交取消申请，等待值班长确认", "info");
    },
    [patchTask, toast]
  );

  const resolveCancel = useCallback<ProtoApi["resolveCancel"]>(
    (taskId, accept) => {
      if (!accept) {
        patchTask(taskId, (t) => ({ ...t, cancelState: undefined }));
        toast("已驳回取消申请，任务继续执行", "info");
        return;
      }
      patchTask(taskId, (t) => ({
        ...t,
        status: "cancelled",
        cancelState: "cancelled",
        steps: t.steps.map((s) => (s.state === "active" ? { ...s, state: "error", note: "人工取消" } : s)),
      }));
      toast("任务已取消（由业务平台确认停止）", "ok");
    },
    [patchTask, toast]
  );

  const setEventStatus = useCallback<ProtoApi["setEventStatus"]>(
    (id, status, disposal, handler) => {
      setState((s) => ({
        ...s,
        events: s.events.map((e) =>
          e.id === id
            ? { ...e, status, disposal: disposal ?? e.disposal, handler: handler ?? e.handler ?? "值班员 · 陈默" }
            : e
        ),
      }));
      toast(`事件状态已更新为「${status === "resolved" ? "已解决" : status === "false_positive" ? "误报" : status === "processing" ? "处理中" : "待确认"}」`, "ok");
    },
    [toast]
  );

  const createEvent = useCallback<ProtoApi["createEvent"]>((e) => {
    setState((s) => ({ ...s, events: [e, ...s.events] }));
  }, []);

  const addRoute = useCallback<ProtoApi["addRoute"]>((route) => {
    setState((s) => ({ ...s, routes: [route, ...s.routes] }));
    toast("航线框架已创建", "ok");
  }, [toast]);

  const saveRoute = useCallback<ProtoApi["saveRoute"]>(
    (id, waypoints, note) => {
      setState((s) => ({
        ...s,
        routes: s.routes.map((r) =>
          r.id === id
            ? {
                ...r,
                waypoints,
                status: "draft",
                updatedAt: stamp(),
                version: `v${Number(r.version.replace("v", "")) + 1}`,
                versions: [{ v: `v${Number(r.version.replace("v", "")) + 1}`, note, at: stamp() }, ...r.versions],
              }
            : r
        ),
      }));
      toast("航线草稿已保存（新版本）", "ok");
    },
    [toast]
  );

  const publishRoute = useCallback<ProtoApi["publishRoute"]>(
    (id) => {
      setState((s) => ({
        ...s,
        routes: s.routes.map((r) => (r.id === id ? { ...r, status: "published", updatedAt: stamp() } : r)),
      }));
      toast("航线已发布，可用于任务计划", "ok");
    },
    [toast]
  );

  const nextWorkflowId = useCallback(() => {
    const max = state.workflows.reduce((m, w) => {
      const n = Number(w.id.replace(/^WF-/, ""));
      return Number.isFinite(n) ? Math.max(m, n) : m;
    }, 0);
    return `WF-${String(max + 1).padStart(2, "0")}`;
  }, [state.workflows]);

  const addWorkflow = useCallback<ProtoApi["addWorkflow"]>((name, trigger) => {
    const id = nextWorkflowId();
    const at = stamp();
    const wf: Workflow = {
      id,
      name,
      trigger,
      status: "draft",
      lastRun: "—",
      successRate: 0,
      nodes: [
        { id: "n1", type: "trigger", label: trigger, x: 40, y: 96, config: `trigger = ${trigger}` },
        { id: "n2", type: "end", label: "结束", x: 300, y: 96, config: "" },
      ],
      edges: [{ from: "n1", to: "n2" }],
      runs: [],
      source: "manual",
      enabled: false,
      triggerKind: "manual",
      version: "draft r1",
      rev: 1,
      updatedAt: at,
      updatedBy: "陈默",
      resources: [],
      missing: [],
      history: [{ at, by: "陈默", source: "canvas", rev: 1, text: "手动创建空白工作流" }],
    };
    setState((s) => ({ ...s, workflows: [wf, ...s.workflows] }));
    toast("空白工作流已创建", "ok");
    return wf;
  }, [nextWorkflowId, toast]);

  const createWorkflowFromPrompt = useCallback<ProtoApi["createWorkflowFromPrompt"]>(
    (text, opts = {}) => {
      const at = stamp();
      const id = nextWorkflowId();
      const result = buildWorkflowDraft(text, { id, at, by: opts.by ?? "陈默", sessionId: opts.sessionId });
      const traceId = uid("TR-WF");
      const trace = buildWorkflowTrace({
        id: traceId,
        at,
        kind: "create",
        wf: result.workflow,
        note: text,
        sessionId: opts.sessionId,
        promptVersion: systemPromptKey(state.ai.prompts),
      });
      setState((s) => ({
        ...s,
        workflows: [result.workflow, ...s.workflows],
        traces: [trace, ...s.traces],
        sessions: opts.sessionId
          ? s.sessions.map((x) => (x.id === opts.sessionId ? { ...x, workflowId: result.workflow.id, mode: "工作流搭建" } : x))
          : s.sessions,
        audits: [
          { id: `A-${9000 + Math.floor(Math.random() * 900)}`, at, actor: opts.by ?? "陈默", action: "生成工作流草稿", target: `${id} · r1`, risk: "low" },
          ...s.audits,
        ],
      }));
      toast(`工作流草稿 ${id} 已生成（${result.workflow.nodes.length} 个节点，未启用）`, "ok");
      return { workflow: result.workflow, reply: result.reply, traceId, missing: result.missing };
    },
    [nextWorkflowId, state.ai.prompts, toast],
  );

  const modifyWorkflowFromPrompt = useCallback<ProtoApi["modifyWorkflowFromPrompt"]>(
    (id, text, opts = {}) => {
      const wf = state.workflows.find((w) => w.id === id);
      if (!wf) return null;
      const at = stamp();
      const result = applyWorkflowEdit(wf, text, at, opts.by ?? "陈默");
      if (!result.changed) return { workflow: wf, reply: result.reply, diff: [], traceId: "", changed: false };
      const traceId = uid("TR-WF");
      const trace = buildWorkflowTrace({
        id: traceId,
        at,
        kind: "edit",
        wf: result.workflow,
        note: text,
        promptVersion: systemPromptKey(state.ai.prompts),
      });
      setState((s) => ({
        ...s,
        workflows: s.workflows.map((w) => (w.id === id ? result.workflow : w)),
        traces: [trace, ...s.traces],
        audits: [
          { id: `A-${9000 + Math.floor(Math.random() * 900)}`, at, actor: opts.by ?? "陈默", action: "对话修改工作流", target: `${id} · r${result.workflow.rev}`, risk: "low" },
          ...s.audits,
        ],
      }));
      toast(`工作流 ${id} 已更新到 draft r${result.workflow.rev}`, "ok");
      return { workflow: result.workflow, reply: result.reply, diff: result.diff, traceId, changed: true };
    },
    [state.workflows, state.ai.prompts, toast],
  );

  const validateWorkflow = useCallback<ProtoApi["validateWorkflow"]>(
    (id, snapshot) => {
      const found = state.workflows.find((w) => w.id === id);
      if (!found) return null;
      const wf = snapshot ? { ...found, nodes: snapshot.nodes, edges: snapshot.edges } : found;
      const at = stamp();
      const issues = workflowIssues(wf);
      const traceId = uid("TR-WF");
      const trace = buildWorkflowTrace({
        id: traceId,
        at,
        kind: "validate",
        wf,
        note: "流程校验",
        issues,
        promptVersion: systemPromptKey(state.ai.prompts),
      });
      setState((s) => ({
        ...s,
        workflows: s.workflows.map((w) =>
          w.id === id
            ? {
                ...w,
                updatedAt: at,
                updatedBy: "陈默",
                history: [
                  { at, by: "陈默", source: "system", rev: w.rev ?? 1, text: `流程校验：${issues.length ? `${issues.length} 条提示` : "全部通过"}` },
                  ...(w.history ?? []),
                ],
              }
            : w,
        ),
        traces: [trace, ...s.traces],
      }));
      toast(issues.some((i) => i.level === "error") ? "校验发现错误，发布会被拦截" : issues.length ? `校验完成：${issues.length} 条提示` : "校验通过，可以保存并发布", issues.some((i) => i.level === "error") ? "danger" : "ok");
      return { issues, traceId };
    },
    [state.workflows, state.ai.prompts, toast],
  );

  const toggleWorkflowEnabled = useCallback<ProtoApi["toggleWorkflowEnabled"]>(
    (id) => {
      const wf = state.workflows.find((w) => w.id === id);
      if (!wf) return;
      const at = stamp();
      if (!wf.enabled) {
        if (wf.status !== "published") {
          toast("启用被拦截：请先发布工作流", "danger");
          return;
        }
        const missing = (wf.resources ?? []).filter((r) => r.state === "missing");
        const errors = workflowIssues({ ...wf, enabled: true }).filter((i) => i.level === "error");
        if (errors.length) {
          toast(`启用被拦截：${errors[0].text}`, "danger");
          return;
        }
        if (missing.length) {
          toast(`启用被拦截：${missing[0].label} 待补充`, "danger");
          return;
        }
        const next: Workflow = {
          ...wf,
          enabled: true,
          updatedAt: at,
          history: [{ at, by: "陈默", source: "system", rev: wf.rev ?? 1, text: "启用流程（模拟，不接真实调度）" }, ...(wf.history ?? [])],
        };
        const trace = buildWorkflowTrace({ id: uid("TR-WF"), at, kind: "enable", wf: next, note: "启用工作流", promptVersion: systemPromptKey(state.ai.prompts) });
        setState((s) => ({
          ...s,
          workflows: s.workflows.map((w) => (w.id === id ? next : w)),
          traces: [trace, ...s.traces],
          audits: [{ id: `A-${9000 + Math.floor(Math.random() * 900)}`, at, actor: "陈默", action: "启用工作流", target: id, risk: "mid" }, ...s.audits],
        }));
        toast("工作流已启用（模拟调度，不触发真实飞行）", "ok");
        return;
      }
      const next: Workflow = {
        ...wf,
        enabled: false,
        updatedAt: at,
        history: [{ at, by: "陈默", source: "system", rev: wf.rev ?? 1, text: "停用流程，定时与事件触发不再运行" }, ...(wf.history ?? [])],
      };
      setState((s) => ({
        ...s,
        workflows: s.workflows.map((w) => (w.id === id ? next : w)),
        audits: [{ id: `A-${9000 + Math.floor(Math.random() * 900)}`, at, actor: "陈默", action: "停用工作流", target: id, risk: "mid" }, ...s.audits],
      }));
      toast("工作流已停用", "warn");
    },
    [state.workflows, state.ai.prompts, toast],
  );

  const bindWorkflowResource = useCallback<ProtoApi["bindWorkflowResource"]>(
    (id, nodeId, channel) => {
      const at = stamp();
      setState((s) => ({
        ...s,
        workflows: s.workflows.map((w) => {
          if (w.id !== id) return w;
          const rev = (w.rev ?? 1) + 1;
          const resources = (w.resources ?? []).map((r) => (r.kind === "notify" && r.state === "missing" ? { ...r, state: "linked" as const, note: undefined } : r));
          return {
            ...w,
            nodes: w.nodes.map((n) => (n.id === nodeId ? { ...n, config: `channel = ${channel}` } : n)),
            resources,
            missing: resources.filter((r) => r.state === "missing").map((r) => r.label),
            rev,
            version: w.status === "published" ? `${w.version ?? "v1.0"} · draft r${rev}` : `draft r${rev}`,
            updatedAt: at,
            updatedBy: "陈默",
            history: [{ at, by: "陈默", source: "canvas", rev, text: `在画布绑定通知渠道「${channel}」` }, ...(w.history ?? [])],
          };
        }),
      }));
      toast(`通知渠道已绑定为「${channel}」（模拟）`, "ok");
    },
    [toast],
  );

  const publishWorkflow = useCallback<ProtoApi["publishWorkflow"]>(
    (id) => {
      const at = stamp();
      setState((s) => ({
        ...s,
        workflows: s.workflows.map((w) => {
          if (w.id !== id) return w;
          const m = (w.version ?? "").match(/v(\d+)\.(\d+)/);
          const nextVer = m ? `v${m[1]}.${Number(m[2]) + 1}` : "v1.0";
          return {
            ...w,
            status: "published",
            version: nextVer,
            lastRun: w.lastRun === "—" ? at : w.lastRun,
            updatedAt: at,
            history: [{ at, by: "陈默", source: "system", rev: w.rev ?? 1, text: `发布为 ${nextVer}，启用前需确认资源已补齐` }, ...(w.history ?? [])],
          };
        }),
        audits: [{ id: `A-${9000 + Math.floor(Math.random() * 900)}`, at, actor: "陈默", action: "发布工作流", target: id, risk: "mid" }, ...s.audits],
      }));
      toast("工作流已发布，可在管理页启用", "ok");
    },
    [toast],
  );

  const runWorkflow = useCallback<ProtoApi["runWorkflow"]>(
    (id) => {
      const wf = state.workflows.find((w) => w.id === id);
      if (!wf) return;
      if (!wf.enabled) {
        toast("运行被拦截：工作流未启用", "danger");
        return;
      }
      const runId = uid("RUN");
      const at = stamp();
      const simulated = simulateWorkflowRun(wf, runId, at);
      setState((s) => ({
        ...s,
        workflows: s.workflows.map((w) =>
          w.id === id
            ? {
                ...w,
                lastRun: at,
                runs: [{ ...simulated, state: "running" as const }, ...w.runs],
              }
            : w,
        ),
      }));
      const timer = setTimeout(() => {
        const trace = buildWorkflowTrace({
          id: uid("TR-WF"),
          at,
          kind: "run",
          wf: { ...wf, lastRun: at },
          note: `模拟运行 ${runId}`,
          promptVersion: systemPromptKey(state.ai.prompts),
        });
        setState((s) => ({
          ...s,
          traces: [trace, ...s.traces],
          workflows: s.workflows.map((w) => {
            if (w.id !== id) return w;
            const runs = w.runs.map((r) => (r.id === runId ? { ...simulated, traceId: trace.id } : r));
            const ok = simulated.state === "ok";
            return {
              ...w,
              successRate: ok ? Math.min(100, Math.round(w.successRate * 0.9 + 10)) : Math.max(0, Math.round(w.successRate * 0.9)),
              runs,
            };
          }),
        }));
        toast(simulated.state === "ok" ? "模拟运行完成（未调用真实设备）" : "模拟运行失败：流程被安全校验拦截", simulated.state === "ok" ? "ok" : "danger");
      }, 1400);
      timers.current.push(timer);
    },
    [state.workflows, state.ai.prompts, toast],
  );

  const saveWorkflowNode = useCallback<ProtoApi["saveWorkflowNode"]>(
    (id, nodeId, label, config) => {
      const at = stamp();
      setState((s) => ({
        ...s,
        workflows: s.workflows.map((w) => {
          if (w.id !== id) return w;
          const rev = (w.rev ?? 1) + 1;
          return {
            ...w,
            nodes: w.nodes.map((n) => (n.id === nodeId ? { ...n, label, config } : n)),
            rev,
            version: w.status === "published" ? `${w.version ?? "v1.0"} · draft r${rev}` : `draft r${rev}`,
            updatedAt: at,
            history: [{ at, by: "陈默", source: "canvas", rev, text: `画布修改节点「${label}」` }, ...(w.history ?? [])],
          };
        }),
      }));
      toast("节点配置已保存到草稿", "ok");
    },
    [toast],
  );

  const saveWorkflowGraph = useCallback<ProtoApi["saveWorkflowGraph"]>((id, nodes, edges) => {
    const at = stamp();
    setState((s) => ({
      ...s,
      workflows: s.workflows.map((w) => {
        if (w.id !== id) return w;
        const rev = (w.rev ?? 1) + 1;
        return {
          ...w,
          nodes,
          edges,
          rev,
          version: w.status === "published" ? `${w.version ?? "v1.0"} · draft r${rev}` : `draft r${rev}`,
          updatedAt: at,
          updatedBy: "陈默",
          history: [{ at, by: "陈默", source: "canvas", rev, text: `画布保存：${nodes.length} 个节点 · ${edges.length} 条连线` }, ...(w.history ?? [])],
        };
      }),
    }));
  }, []);

  const saveWorkflowDraft = useCallback<ProtoApi["saveWorkflowDraft"]>((id, nodes, edges) => {
    const at = stamp();
    setState((s) => {
      const wf = s.workflows.find((w) => w.id === id);
      if (!wf) return s;
      const rev = (wf.rev ?? 1) + 1;
      const next: Workflow = {
        ...wf,
        nodes,
        edges,
        rev,
        version: wf.status === "published" ? `${wf.version ?? "v1.0"} · draft r${rev}` : `draft r${rev}`,
        updatedAt: at,
        updatedBy: "陈默",
        history: [{ at, by: "陈默", source: "canvas", rev, text: `画布保存：${nodes.length} 个节点 · ${edges.length} 条连线` }, ...(wf.history ?? [])],
      };
      const trace = buildWorkflowTrace({
        id: uid("TR-WF"),
        at,
        kind: "save",
        wf: next,
        note: `画布保存草稿 ${nodes.length} 个节点 · ${edges.length} 条连线`,
        promptVersion: systemPromptKey(s.ai.prompts),
      });
      return {
        ...s,
        workflows: s.workflows.map((w) => (w.id === id ? next : w)),
        traces: [trace, ...s.traces],
      };
    });
  }, []);

  const toggleTool = useCallback<ProtoApi["toggleTool"]>(
    (id) => {
      setState((s) => ({
        ...s,
        tools: s.tools.map((t) => (t.id === id ? { ...t, status: t.status === "enabled" ? "disabled" : "enabled" } : t)),
      }));
      toast("工具状态已更新", "ok");
    },
    [toast]
  );

  const saveTool = useCallback<ProtoApi["saveTool"]>((tool) => {
    setState((s) => ({
      ...s,
      tools: s.tools.some((t) => t.id === tool.id) ? s.tools.map((t) => (t.id === tool.id ? tool : t)) : [...s.tools, tool],
    }));
  }, []);

  const saveAgentDraft = useCallback<ProtoApi["saveAgentDraft"]>((patch) => {
    agentDraft.current = { ...agentDraft.current, ...patch };
    toast("已保存到草稿版本", "ok");
  }, [toast]);

  const publishAgentDraft = useCallback<ProtoApi["publishAgentDraft"]>((agentId) => {
    setState((s) => {
      const hasDraft = s.agents.some((a) => a.agentId === agentId && a.state === "draft");
      if (!hasDraft) return s;
      return {
        ...s,
        agents: s.agents.map((a) => {
          if (a.agentId !== agentId) return a;
          if (a.state === "published") return { ...a, state: "archived" };
          if (a.state === "draft") return { ...a, state: "published", at: stamp() };
          return a;
        }),
      };
    });
    toast("草稿版本已发布，旧版本转为归档", "ok");
  }, [toast]);

  const updateRoleTools = useCallback<ProtoApi["updateRoleTools"]>(
    (roleId, tools) => {
      setState((s) => ({ ...s, roles: s.roles.map((r) => (r.id === roleId ? { ...r, tools } : r)) }));
      toast("权限配置已保存", "ok");
    },
    [toast]
  );

  const toggleSkill = useCallback<ProtoApi["toggleSkill"]>(
    (skillId) => {
      const target = stateRef.current.skills.items.find((k) => k.id === skillId);
      if (!target) return;
      setState((s) => ({
        ...s,
        skills: {
          ...s.skills,
          items: s.skills.items.map((k) => (k.id === skillId ? { ...k, enabled: !k.enabled } : k)),
        },
      }));
      toast(target.enabled ? `已停用「${target.name}」，Agent 不会再选中它` : `已启用「${target.name}」`, target.enabled ? "warn" : "ok");
    },
    [toast],
  );

  const createSkill = useCallback<ProtoApi["createSkill"]>(
    ({ name, desc, scenarios }) => {
      const id = `SK-${idTail()}`;
      const skill: AgentSkill = {
        id,
        name,
        desc,
        agentId: "AGENT-COPILOT-OPS",
        owner: "陈默",
        enabled: false,
        scenarios,
        triggers: [],
        inputs: [{ name: "area_id", type: "string", required: true, desc: "作业区域编号" }],
        outputs: [{ name: "result", type: "string", required: true, desc: "执行结论" }],
        preconditions: ["待补充前置条件"],
        failurePolicy: ["待补充失败处理"],
        safety: ["高风险动作必须人工确认"],
        needConfirm: [],
        callCount: 0,
        successRate: 0,
        avgMs: 0,
        versions: [
          {
            id: `SV-${idTail()}`,
            version: "0.1-draft",
            state: "draft",
            at: stamp(),
            author: "陈默",
            note: "新建 Skill",
            steps: [
              {
                key: "n1",
                title: "解析诉求",
                desc: "读取用户诉求与业务上下文，确认可执行范围。",
                kind: "reason",
                onError: "信息不足时追问，不按默认值推断。",
              },
            ],
          },
        ],
      };
      setState((s) => ({ ...s, skills: { ...s.skills, items: [skill, ...s.skills.items] } }));
      toast("Skill 已创建，补充步骤后发布才会被 Agent 使用", "info");
      return skill;
    },
    [toast],
  );

  const saveSkillDraft = useCallback<ProtoApi["saveSkillDraft"]>(
    (skillId, patch) => {
      setState((s) => ({
        ...s,
        skills: {
          ...s.skills,
          items: s.skills.items.map((k) => {
            if (k.id !== skillId) return k;
            const draft = k.versions.find((v) => v.state === "draft");
            if (draft) {
              return {
                ...k,
                versions: k.versions.map((v) =>
                  v.id === draft.id
                    ? { ...v, steps: patch.steps ?? v.steps, note: patch.note ?? v.note, at: stamp(), author: "陈默" }
                    : v,
                ),
              };
            }
            const base = publishedVersion(k);
            return {
              ...k,
              versions: [
                {
                  ...base,
                  id: `SV-${idTail()}`,
                  version: bumpDraft(base.version),
                  state: "draft" as const,
                  at: stamp(),
                  author: "陈默",
                  note: patch.note ?? "从线上版本创建草稿",
                  steps: patch.steps ?? base.steps,
                },
                ...k.versions,
              ],
            };
          }),
        },
      }));
      toast("Skill 草稿已保存，发布后才会被 Agent 使用", "ok");
    },
    [toast],
  );

  const publishSkill = useCallback<ProtoApi["publishSkill"]>(
    (skillId) => {
      setState((s) => ({
        ...s,
        skills: {
          ...s.skills,
          items: s.skills.items.map((k) => {
            if (k.id !== skillId) return k;
            const draft = k.versions.find((v) => v.state === "draft");
            if (!draft) return k;
            return {
              ...k,
              versions: k.versions.map((v) => {
                if (v.id === draft.id) return { ...v, state: "published" as const, at: stamp() };
                if (v.state === "published") return { ...v, state: "archived" as const };
                return v;
              }),
            };
          }),
        },
        audits: [
          { id: `A-${9000 + Math.floor(Math.random() * 900)}`, at: stamp(), actor: "陈默", action: "发布 Skill 版本", target: skillId, risk: "mid" },
          ...s.audits,
        ],
      }));
      toast("Skill 新版本已发布；需跑 Skill 回归后才进入发布门禁", "ok");
    },
    [toast],
  );

  const runSkill = useCallback<ProtoApi["runSkill"]>(
    (skillId, question, opts = {}) => {
      const s = stateRef.current;
      const skill = s.skills.items.find((k) => k.id === skillId);
      if (!skill) return null;
      if (!skill.enabled) {
        toast(`「${skill.name}」已停用，无法执行`, "danger");
        return null;
      }
      const version = (opts.versionId ? skill.versions.find((v) => v.id === opts.versionId) : undefined) ?? publishedVersion(skill);
      const seqNo = String(s.skills.runs.length + 1).padStart(4, "0");
      const run = makeSkillRun({
        skill,
        version,
        question,
        id: `SR-${dayStamp()}-${seqNo}`,
        traceId: `TR-SKILL-${dayStamp()}-${seqNo}`,
        sessionId: opts.sessionId,
        createdAt: stamp(),
      });
      const trace = buildSkillTrace(run);
      trace.promptVersion = systemPromptKey(s.ai.prompts);
      setState((prev) => ({
        ...prev,
        skills: { ...prev.skills, runs: [run, ...prev.skills.runs] },
        traces: opts.createTrace === false ? prev.traces : [trace, ...prev.traces],
      }));
      toast(
        run.status === "waiting_confirm"
          ? `「${skill.name}」前置步骤已完成，等待人工确认`
          : `「${skill.name}」执行完成`,
        run.status === "waiting_confirm" ? "info" : "ok",
      );
      return run;
    },
    [toast],
  );

  const mcpLog = (level: "info" | "warn" | "error", msg: string) => ({ at: stamp(), level, msg });

  const toggleMcpServer = useCallback<ProtoApi["toggleMcpServer"]>(
    (serverId) => {
      const target = stateRef.current.mcp.servers.find((x) => x.id === serverId);
      if (!target) return;
      if (target.status === "error") {
        toast("连接异常，先做连接测试确认可用后再启用", "warn");
        return;
      }
      const next = target.status === "connected" ? "disconnected" : "connected";
      setState((s) => ({
        ...s,
        mcp: {
          ...s.mcp,
          servers: s.mcp.servers.map((x) =>
            x.id === serverId
              ? {
                  ...x,
                  status: next as McpServer["status"],
                  logs: [mcpLog("info", next === "connected" ? "已启用连接（模拟）" : "已停用连接（模拟）"), ...x.logs],
                }
              : x,
          ),
        },
      }));
      toast(next === "connected" ? "MCP Server 已启用" : "已停用，依赖它的工具调用会显式失败", next === "connected" ? "ok" : "warn");
    },
    [toast],
  );

  const discoverMcp = useCallback<ProtoApi["discoverMcp"]>(
    (serverId) => {
      const target = stateRef.current.mcp.servers.find((x) => x.id === serverId);
      if (!target) return;
      if (target.status === "error") {
        setState((s) => ({
          ...s,
          mcp: {
            ...s.mcp,
            servers: s.mcp.servers.map((x) =>
              x.id === serverId ? { ...x, logs: [mcpLog("error", "capabilities/discover 失败：上游不可达（模拟）"), ...x.logs] } : x,
            ),
          },
        }));
        toast("能力发现失败：Server 不可达，沿用上次发现的工具列表", "danger");
        return;
      }
      setState((s) => ({
        ...s,
        mcp: {
          ...s.mcp,
          servers: s.mcp.servers.map((x) =>
            x.id === serverId
              ? {
                  ...x,
                  discoveredAt: stamp(),
                  logs: [mcpLog("info", `capabilities/discover 成功，返回 ${x.tools.length} 个工具`), ...x.logs],
                }
              : x,
          ),
        },
      }));
      toast(`已发现 ${target.tools.length} 个工具（模拟）`, "ok");
    },
    [toast],
  );

  const testMcpConnection = useCallback<ProtoApi["testMcpConnection"]>(
    (serverId) => {
      const target = stateRef.current.mcp.servers.find((x) => x.id === serverId);
      if (!target) return;
      // workflow-mcp 固定失败，用来演示「依赖该 Server 的步骤必须显式失败」
      const fail = serverId === "workflow-mcp";
      setState((s) => ({
        ...s,
        mcp: {
          ...s.mcp,
          servers: s.mcp.servers.map((x) =>
            x.id === serverId
              ? {
                  ...x,
                  status: (fail ? "error" : "connected") as McpServer["status"],
                  discoveredAt: fail ? x.discoveredAt : stamp(),
                  logs: [
                    fail
                      ? mcpLog("error", "连接测试失败：502 Bad Gateway（模拟）")
                      : mcpLog("info", `连接测试成功 · ${x.transport} · ${x.authKind} 鉴权通过（模拟）`),
                    ...x.logs,
                  ],
                }
              : x,
          ),
        },
      }));
      toast(fail ? "连接测试失败：502（模拟），请检查地址与鉴权" : "连接测试通过（模拟）", fail ? "danger" : "ok");
    },
    [toast],
  );

  const registerMcpServer = useCallback<ProtoApi["registerMcpServer"]>(
    ({ name, endpoint, transport }) => {
      const server: McpServer = {
        id: `${name.toLowerCase().replace(/[^a-z0-9-]/g, "-") || "mcp"}-${idTail().toLowerCase()}`,
        name,
        desc: "新注册的 MCP Server（模拟），尚未做能力发现。",
        endpoint,
        transport,
        status: "disconnected",
        authKind: "api-key",
        authRef: "vault://mcp/new（模拟引用，未存真实凭证）",
        scopes: [],
        tools: [{ name: "ping", desc: "连接自检，不执行业务操作", schema: "{}" }],
        logs: [mcpLog("info", "已登记 Server，等待连接测试与能力发现")],
        note: "新 Server 需先通过连接测试，再做能力发现，工具才会出现在工具管理中。",
      };
      setState((s) => ({ ...s, mcp: { ...s.mcp, servers: [...s.mcp.servers, server] } }));
      toast("MCP Server 已登记，请先做连接测试", "info");
      return server;
    },
    [toast],
  );

  const advanceKbDoc = useCallback(
    (docId: string, totalChunks: number) => {
      KB_PARSE_STAGES.forEach((label, i) => {
        const last = i === KB_PARSE_STAGES.length - 1;
        const timer = setTimeout(() => {
          setState((s) => ({
            ...s,
            kbDocs: s.kbDocs.map((d) =>
              d.id === docId
                ? {
                    ...d,
                    state: last ? "indexed" : "indexing",
                    stage: i,
                    stageLabel: label,
                    stageProgress: Math.round(((i + 1) / KB_PARSE_STAGES.length) * 100),
                    chunks: last ? totalChunks : d.chunks,
                    indexedAt: last ? stamp() : d.indexedAt,
                    error: undefined,
                  }
                : d,
            ),
            rag: last
              ? {
                  ...s.rag,
                  indexes: s.rag.indexes.map((x, xi) =>
                    xi === 0 ? { ...x, vectors: x.vectors + totalChunks, updatedAt: stamp() } : x,
                  ),
                }
              : s.rag,
          }));
          if (last) toast("文档索引完成，已进入可召回范围", "ok");
        }, 480 * (i + 1));
        timers.current.push(timer);
      });
    },
    [toast],
  );

  const addKbDoc = useCallback<ProtoApi["addKbDoc"]>(
    (name, type = "manual") => {
      const docId = `KB-${String(stateRef.current.kbDocs.length + 1).padStart(2, "0")}`;
      const doc: KbDoc = {
        id: docId,
        name,
        source: "上传 · PDF",
        size: "1.2 MB",
        indexedAt: "—",
        state: "indexing",
        chunks: 0,
        citations: 0,
        type,
        owner: "当前用户",
        version: "v1",
        pages: 24,
        stage: 0,
        stageLabel: KB_PARSE_STAGES[0],
        stageProgress: 20,
      };
      const chunks = syntheticChunks(docId, name, type);
      setState((s) => ({ ...s, kbDocs: [doc, ...s.kbDocs], rag: { ...s.rag, chunks: [...s.rag.chunks, ...chunks] } }));
      advanceKbDoc(docId, chunks.length * 8);
    },
    [advanceKbDoc],
  );

  const retryKbDoc = useCallback<ProtoApi["retryKbDoc"]>(
    (id) => {
      const doc = stateRef.current.kbDocs.find((d) => d.id === id);
      if (!doc) return;
      setState((s) => ({
        ...s,
        kbDocs: s.kbDocs.map((d) =>
          d.id === id ? { ...d, state: "indexing", stage: 0, stageLabel: KB_PARSE_STAGES[0], stageProgress: 20, error: undefined } : d,
        ),
      }));
      toast(`已重新提交「${doc.name}」的解析与索引（模拟）`, "info");
      advanceKbDoc(id, doc.chunks || (id === "KB-05" ? 32 : 48));
    },
    [advanceKbDoc, toast],
  );

  const rebuildKbIndex = useCallback<ProtoApi["rebuildKbIndex"]>(() => {
    setState((s) => ({
      ...s,
      rag: { ...s.rag, indexes: s.rag.indexes.map((x, i) => (i === 0 ? { ...x, state: "rebuilding" } : x)) },
    }));
    toast("已触发全量重建索引（模拟）", "info");
    const timer = setTimeout(() => {
      setState((s) => ({
        ...s,
        rag: {
          ...s.rag,
          indexes: s.rag.indexes.map((x, i) => (i === 0 ? { ...x, state: "ready", updatedAt: stamp() } : x)),
        },
      }));
      toast("重建完成，向量索引已就绪", "ok");
    }, 1800);
    timers.current.push(timer);
  }, [toast]);

  const saveRetrievalConfig = useCallback<ProtoApi["saveRetrievalConfig"]>(
    (id, patch) => {
      setState((s) => ({
        ...s,
        rag: {
          ...s.rag,
          configs: s.rag.configs.map((c) =>
            c.id === id ? { ...c, ...patch, state: "draft" as const, updatedAt: stamp(), updatedBy: "陈默" } : c,
          ),
        },
      }));
      toast("检索配置已保存为草稿，发布后才会生效（模拟）", "ok");
    },
    [toast],
  );

  const publishRetrievalConfig = useCallback<ProtoApi["publishRetrievalConfig"]>(
    (id) => {
      setState((s) => ({
        ...s,
        rag: { ...s.rag, configs: s.rag.configs.map((c) => (c.id === id ? { ...c, state: "published" as const } : c)) },
      }));
      toast("检索配置已发布（模拟），仅影响之后的新会话", "ok");
    },
    [toast],
  );

  const runRetrieval = useCallback<ProtoApi["runRetrieval"]>((question, opts = {}) => {
    const s = stateRef.current;
    const cfg = s.rag.configs.find((c) => c.id === (opts.configId ?? CURRENT_CONFIG_ID)) ?? s.rag.configs[0];
    const chunks = searchableChunks(s.kbDocs, s.rag.chunks);
    const d = new Date();
    const createdAt = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
    const seqNo = String(s.rag.runs.length + 1).padStart(4, "0");
    const run = makeRetrievalRun({
      id: `RR-${dayStamp()}-${seqNo}`,
      traceId: `TR-RAG-${dayStamp()}-${seqNo}`,
      question,
      path: opts.path ?? "rag",
      config: cfg,
      chunks,
      docs: s.kbDocs,
      createdAt,
      sessionId: opts.sessionId,
      toolCall: opts.toolCall,
    });
    const trace = buildRagTrace(run);
    setState((prev) => ({
      ...prev,
      rag: { ...prev.rag, runs: [run, ...prev.rag.runs] },
      traces: opts.createTrace === false ? prev.traces : [trace, ...prev.traces],
    }));
    return run;
  }, []);

  const createDataset = useCallback<ProtoApi["createDataset"]>(
    ({ name, desc, tags }) => {
      const ds: EvalDataset = {
        id: `DS-${String(state.eval.datasets.length + 1).padStart(2, "0")}`,
        name,
        desc,
        tags,
        version: "v1",
        updatedAt: stamp(),
        draft: false,
        cases: [],
        versions: [{ v: "v1", at: stamp(), cases: 0, note: "创建数据集", author: "陈默" }],
      };
      setState((s) => ({ ...s, eval: { ...s.eval, datasets: [ds, ...s.eval.datasets] } }));
      toast("数据集已创建，可以开始添加用例", "ok");
      return ds;
    },
    [state.eval.datasets.length, toast],
  );

  const addCase = useCallback<ProtoApi["addCase"]>((datasetId, input) => {
    const c: EvalCase = { ...input, id: `E-${String(Date.now()).slice(-4)}` };
    setState((s) => ({
      ...s,
      eval: {
        ...s.eval,
        datasets: s.eval.datasets.map((d) =>
          d.id === datasetId ? { ...d, draft: true, updatedAt: stamp(), cases: [...d.cases, c] } : d,
        ),
      },
    }));
    toast("用例已加入草稿，保存版本后用于新实验", "info");
  }, [toast]);

  const saveDatasetVersion = useCallback<ProtoApi["saveDatasetVersion"]>(
    (id, note) => {
      setState((s) => ({
        ...s,
        eval: {
          ...s.eval,
          datasets: s.eval.datasets.map((d) => {
            if (d.id !== id) return d;
            const v = `v${Number(d.version.replace("v", "")) + 1}`;
            return {
              ...d,
              draft: false,
              version: v,
              updatedAt: stamp(),
              versions: [{ v, at: stamp(), cases: d.cases.length, note: note || "保存当前用例集", author: "陈默" }, ...d.versions],
            };
          }),
        },
      }));
      toast("数据集已保存为新版本", "ok");
    },
    [toast],
  );

  const scheduleRun = useCallback(
    (exp: EvalExperiment, dataset: EvalDataset) => {
      const results = buildResults(dataset, exp.agentVersion, exp.model, exp.caseIds, exp.promptVersion);
      const totalMs = results.reduce((a, b) => a + b.ms, 0);
      setState((s) => ({
        ...s,
        eval: {
          ...s.eval,
          experiments: s.eval.experiments.map((x) =>
            x.id === exp.id ? { ...x, status: "running" as const, runAt: stamp(), results: [], ms: undefined } : x,
          ),
        },
      }));
      results.forEach((r, i) => {
        const last = i === results.length - 1;
        const timer = setTimeout(() => {
          setState((s) => ({
            ...s,
            eval: {
              ...s.eval,
              experiments: s.eval.experiments.map((x) =>
                x.id === exp.id
                  ? { ...x, status: (last ? "done" : "running") as EvalExperiment["status"], results: [...x.results, r], ms: last ? totalMs : x.ms }
                  : x,
              ),
            },
          }));
          if (!last) return;
          const allPass = results.every((x) => x.pass);
          setState((s) => ({
            ...s,
            eval: {
              ...s.eval,
              fixes: s.eval.fixes.map((f) =>
                f.targetVersion === exp.agentVersion && f.status !== "closed"
                  ? { ...f, status: (allPass ? "closed" : "verifying") as FixRecord["status"], updatedAt: stamp() }
                  : f,
              ),
            },
          }));
          toast(
            `实验完成：${results.filter((x) => x.pass).length}/${results.length} 通过`,
            allPass ? "ok" : "warn",
          );
        }, 360 * (i + 1));
        timers.current.push(timer);
      });
    },
    [toast],
  );

  const startExperiment = useCallback<ProtoApi["startExperiment"]>(
    (input) => {
      const ds = state.eval.datasets.find((d) => d.id === input.datasetId) ?? state.eval.datasets[0];
      const exp: EvalExperiment = {
        id: `EX-${dayStamp()}-${idTail().slice(0, 3)}`,
        name: input.name,
        status: "draft",
        datasetId: ds.id,
        datasetVersion: ds.version,
        caseIds: ds.cases.map((c) => c.id),
        agentId: "AGENT-COPILOT-OPS",
        agentVersion: input.agentVersion,
        model: input.model,
        promptVersion: input.promptVersion,
        schemaVersion: input.schemaVersion,
        routingPolicy: input.routingPolicy,
        retrievalConfig: input.retrievalConfig,
        toolsVersion: input.toolsVersion,
        workflowVersion: input.workflowVersion,
        evaluatorIds: input.evaluatorIds,
        baselineId: input.baselineId,
        createdAt: stamp(),
        results: [],
      };
      setState((s) => ({ ...s, eval: { ...s.eval, experiments: [exp, ...s.eval.experiments] } }));
      scheduleRun(exp, ds);
      return exp;
    },
    [state.eval.datasets, scheduleRun],
  );

  const runExperiment = useCallback<ProtoApi["runExperiment"]>(
    (id) => {
      const exp = state.eval.experiments.find((e) => e.id === id);
      const ds = exp ? state.eval.datasets.find((d) => d.id === exp.datasetId) : undefined;
      if (!exp || !ds) return;
      scheduleRun(exp, ds);
    },
    [state.eval.experiments, state.eval.datasets, scheduleRun],
  );

  const annotate = useCallback<ProtoApi["annotate"]>(
    (id, verdict, note) => {
      setState((s) => {
        const target = s.eval.annotations.find((a) => a.id === id);
        if (!target) return s;
        const agree = (verdict === "model_error") === (target.autoVerdict === "fail");
        return {
          ...s,
          eval: {
            ...s.eval,
            annotations: s.eval.annotations.map((a) =>
              a.id === id
                ? {
                    ...a,
                    status: (agree ? "confirmed" : "overturned") as Annotation["status"],
                    verdict,
                    note,
                    at: stamp(),
                    by: "陈默",
                  }
                : a,
            ),
            experiments: s.eval.experiments.map((x) =>
              x.id === target.experimentId
                ? {
                    ...x,
                    results: x.results.map((r) =>
                      r.caseId === target.caseId
                        ? { ...r, human: (agree ? "confirmed" : "overturned") as "confirmed" | "overturned" }
                        : r,
                    ),
                  }
                : x,
            ),
          },
        };
      });
      toast("人工标注已保存，评估器一致性已更新", "ok");
    },
    [toast],
  );

  const createFix = useCallback<ProtoApi["createFix"]>(
    (input) => {
      const fix: FixRecord = {
        ...input,
        id: `FX-${dayStamp()}-${idTail().slice(0, 2)}`,
        status: "open",
        createdAt: stamp(),
        updatedAt: stamp(),
      };
      setState((s) => ({ ...s, eval: { ...s.eval, fixes: [fix, ...s.eval.fixes] } }));
      toast("修复记录已创建，可用目标版本跑回归", "ok");
    },
    [toast],
  );

  const updateFixStatus = useCallback<ProtoApi["updateFixStatus"]>(
    (id, status) => {
      setState((s) => ({
        ...s,
        eval: { ...s.eval, fixes: s.eval.fixes.map((f) => (f.id === id ? { ...f, status, updatedAt: stamp() } : f)) },
      }));
      toast(`修复记录状态已更新为「${status === "closed" ? "已关闭" : status === "verifying" ? "验证中" : "待修复"}」`, "ok");
    },
    [toast],
  );

  const reviewSample = useCallback<ProtoApi["reviewSample"]>(
    (id, verdict, note) => {
      setState((s) => ({
        ...s,
        eval: {
          ...s.eval,
          samples: s.eval.samples.map((m) =>
            m.id === id
              ? {
                  ...m,
                  reviewed: true,
                  needReview: false,
                  issue: verdict === "false_positive" ? `复核为误报：${note || "回答符合预期"}` : m.issue,
                }
              : m,
          ),
        },
      }));
      toast(verdict === "issue" ? "已确认问题，可加入数据集" : "已标记为误报并关闭复核", verdict === "issue" ? "warn" : "ok");
    },
    [toast],
  );

  const addSampleToDataset = useCallback<ProtoApi["addSampleToDataset"]>(
    (sampleId, datasetId) => {
      const sample = state.eval.samples.find((m) => m.id === sampleId);
      if (!sample) return;
      const c: EvalCase = {
        id: `E-L${String(Date.now()).slice(-3)}`,
        name: `线上样本 · ${sample.title.slice(0, 12)}`,
        input: sample.title,
        expectedIntent: sample.intent,
        expectedTools: [],
        expectedResult: "按人工复核结论给出正确处置，并说明依据与来源",
        tags: ["线上样本", "待补预期"],
        safety: false,
        source: "线上样本",
        traceId: sample.traceId,
      };
      setState((s) => ({
        ...s,
        eval: {
          ...s.eval,
          datasets: s.eval.datasets.map((d) =>
            d.id === datasetId ? { ...d, draft: true, updatedAt: stamp(), cases: [...d.cases, c] } : d,
          ),
          samples: s.eval.samples.map((m) => (m.id === sampleId ? { ...m, datasetId, reviewed: true, needReview: false } : m)),
        },
      }));
      toast("已转为数据集用例，保存版本后可用于回归", "ok");
    },
    [state.eval.samples, toast],
  );

  const recordRelease = useCallback<ProtoApi["recordRelease"]>(
    (experimentId) => {
      const exp = state.eval.experiments.find((e) => e.id === experimentId);
      if (!exp) return;
      const ds = state.eval.datasets.find((d) => d.id === exp.datasetId);
      const gate = evaluateGate(exp, ds, MONITOR_STATS.negRate, state.eval.gateRules);
      const record: ReleaseRecord = {
        id: `REL-${dayStamp()}-${idTail().slice(0, 2)}`,
        version: exp.agentVersion,
        at: stamp(),
        experimentId,
        passRate: gate.summary.passRate,
        safetyRate: gate.summary.safetyRate,
        passed: gate.passed,
        blockedBy: gate.passed
          ? undefined
          : gate.checks
              .filter((c) => !c.passed)
              .map((c) => `${c.rule.name} ${c.value}${c.rule.unit}，要求 ${c.rule.op} ${c.rule.threshold}${c.rule.unit}`)
              .join("；"),
        operator: "陈默",
        status: gate.passed ? "released" : "blocked",
      };
      setState((s) => ({
        ...s,
        eval: { ...s.eval, releases: [record, ...s.eval.releases] },
        agents: gate.passed
          ? s.agents.map((a) => {
              if (a.agentId !== exp.agentId) return a;
              if (a.version === exp.agentVersion) return { ...a, state: "published" as const, at: stamp() };
              if (a.state === "published") return { ...a, state: "archived" as const };
              return a;
            })
          : s.agents,
      }));
      toast(
        gate.passed ? "门禁通过，已模拟发布新版本" : "门禁未通过，发布被阻止",
        gate.passed ? "ok" : "danger",
      );
    },
    [state.eval.experiments, state.eval.datasets, state.eval.gateRules, toast],
  );

  const rollbackRelease = useCallback<ProtoApi["rollbackRelease"]>(
    (id) => {
      setState((s) => ({
        ...s,
        eval: {
          ...s.eval,
          releases: s.eval.releases.map((r) => (r.id === id ? { ...r, status: "rolled_back" as const } : r)),
        },
      }));
      toast("已模拟回滚到上一版本，回滚记录已保留", "info");
    },
    [toast],
  );

  const createAgentVersion = useCallback<ProtoApi["createAgentVersion"]>(
    (agentId, version, note) => {
      setState((s) => ({
        ...s,
        agents: [
          { id: `AV-${idTail()}`, agentId, version, state: "draft" as const, note, at: stamp(), author: "陈默" },
          ...s.agents,
        ],
      }));
      toast(`已创建草稿版本 ${version}`, "ok");
    },
    [toast],
  );

  const updateGateRule = useCallback<ProtoApi["updateGateRule"]>(
    (id, patch) => {
      setState((s) => ({
        ...s,
        eval: {
          ...s.eval,
          gateRules: s.eval.gateRules.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        },
      }));
      toast("门禁规则已保存（模拟配置）", "ok");
    },
    [toast],
  );

  const savePromptDraft = useCallback<ProtoApi["savePromptDraft"]>(
    (promptId, patch) => {
      setState((s) => ({
        ...s,
        ai: {
          ...s.ai,
          prompts: s.ai.prompts.map((p) => {
            if (p.id !== promptId) return p;
            if (p.versions.some((v) => v.state === "draft")) {
              return {
                ...p,
                versions: p.versions.map((v) =>
                  v.state === "draft" ? { ...v, ...patch, at: stamp(), author: "陈默", gate: undefined } : v,
                ),
              };
            }
            const base = p.versions.find((v) => v.state === "published") ?? p.versions[0];
            const created: PromptVersion = {
              ...base,
              ...patch,
              id: `PV-${idTail()}`,
              version: bumpDraft(base.version),
              state: "draft",
              at: stamp(),
              author: "陈默",
              note: patch.note ?? "从线上版本创建草稿",
              gate: undefined,
            };
            return { ...p, versions: [created, ...p.versions] };
          }),
        },
      }));
      toast("Prompt 草稿已保存", "ok");
    },
    [toast],
  );

  const publishPrompt = useCallback<ProtoApi["publishPrompt"]>(
    (promptId) => {
      const current = stateRef.current;
      const target = current.ai.prompts.find((p) => p.id === promptId);
      const targetDraft = target?.versions.find((v) => v.state === "draft");
      if (!target || !targetDraft) {
        toast("当前没有可发布的草稿", "info");
        return;
      }
      if (promptId === SYSTEM_PROMPT_ID) {
        const blocked = targetDraft.gate?.checks.filter((c) => !c.pass) ?? [];
        if (!targetDraft.gate || blocked.length) {
          toast(
            !targetDraft.gate
              ? "发布被门禁拦截：系统提示词必须先跑一次回归"
              : `发布被门禁拦截：${blocked.map((c) => c.label).join("、")}`,
            "danger",
          );
          return;
        }
      }
      setState((s) => ({
        ...s,
        ai: {
          ...s.ai,
          prompts: s.ai.prompts.map((p) => {
            if (p.id !== promptId) return p;
            const draft = p.versions.find((v) => v.state === "draft");
            if (!draft) return p;
            return {
              ...p,
              versions: p.versions.map((v) => {
                if (v.id === draft.id)
                  return { ...v, version: v.version.replace(/-draft$/, ""), state: "published" as const, at: stamp() };
                if (v.state === "published") return { ...v, state: "archived" as const };
                return v;
              }),
            };
          }),
        },
        audits: [
          { id: `A-${9000 + Math.floor(Math.random() * 900)}`, at: stamp(), actor: "陈默", action: "发布 Prompt 版本", target: promptId, risk: "mid" },
          ...s.audits,
        ],
      }));
      toast("Prompt 已发布，旧版本转为归档；需跑回归后才可进入发布门禁", "ok");
    },
    [toast],
  );

  const rerunPromptGate = useCallback<ProtoApi["rerunPromptGate"]>(
    (promptId, patch) => {
      const target = stateRef.current.ai.prompts.find((p) => p.id === promptId);
      const draft = target?.versions.find((v) => v.state === "draft");
      if (!draft) {
        toast("当前没有草稿，先保存草稿再跑回归", "info");
        return;
      }
      const next = patch ? { ...draft, ...patch, at: stamp(), author: "陈默" } : draft;
      const gate = buildPromptGate(next, stamp());
      const failed = gate.checks.filter((c) => !c.pass);
      setState((s) => ({
        ...s,
        ai: {
          ...s.ai,
          prompts: s.ai.prompts.map((p) =>
            p.id !== promptId
              ? p
              : { ...p, versions: p.versions.map((v) => (v.state === "draft" ? { ...next, gate } : v)) },
          ),
        },
      }));
      toast(
        failed.length
          ? `模拟回归完成：${failed.length} 项未通过（${failed.map((c) => c.label).join("、")}）`
          : "模拟回归完成：门禁检查全部通过，可发布",
        failed.length ? "warn" : "ok",
      );
    },
    [toast],
  );

  const rollbackPrompt = useCallback<ProtoApi["rollbackPrompt"]>(
    (promptId, version) => {
      setState((s) => ({
        ...s,
        ai: {
          ...s.ai,
          prompts: s.ai.prompts.map((p) => {
            if (p.id !== promptId) return p;
            return {
              ...p,
              versions: p.versions.map((v) => {
                if (v.version === version) return { ...v, state: "published" as const };
                if (v.state === "published") return { ...v, state: "archived" as const };
                return v;
              }),
            };
          }),
        },
      }));
      toast(`已回滚到 ${version}`, "info");
    },
    [toast],
  );

  const saveContextPolicy = useCallback<ProtoApi["saveContextPolicy"]>(
    (policyId, patch) => {
      setState((s) => ({
        ...s,
        ai: {
          ...s.ai,
          contextPolicies: s.ai.contextPolicies.map((p) =>
            p.id === policyId ? { ...p, ...patch, updatedAt: stamp(), author: "陈默" } : p,
          ),
        },
      }));
      toast("上下文策略已保存", "ok");
    },
    [toast],
  );

  const toggleContextSource = useCallback<ProtoApi["toggleContextSource"]>(
    (policyId, sourceId) => {
      setState((s) => ({
        ...s,
        ai: {
          ...s.ai,
          contextPolicies: s.ai.contextPolicies.map((p) =>
            p.id === policyId
              ? {
                  ...p,
                  updatedAt: stamp(),
                  sources: p.sources.map((c) => (c.id === sourceId ? { ...c, enabled: !c.enabled } : c)),
                }
              : p,
          ),
        },
      }));
      toast("上下文来源状态已更新", "ok");
    },
    [toast],
  );

  const saveSchemaDraft = useCallback<ProtoApi["saveSchemaDraft"]>(
    (schemaId, fields, note) => {
      setState((s) => ({
        ...s,
        ai: {
          ...s.ai,
          schemas: s.ai.schemas.map((sc) => {
            if (sc.id !== schemaId) return sc;
            if (sc.versions.some((v) => v.state === "draft")) {
              return {
                ...sc,
                versions: sc.versions.map((v) =>
                  v.state === "draft" ? { ...v, fields, note: note || v.note, at: stamp(), author: "陈默" } : v,
                ),
              };
            }
            const base = sc.versions.find((v) => v.state === "published") ?? sc.versions[0];
            return {
              ...sc,
              versions: [
                { ...base, id: `SV-${idTail()}`, version: bumpDraft(base.version), state: "draft", at: stamp(), author: "陈默", note: note || "从线上版本创建草稿", fields },
                ...sc.versions,
              ],
            };
          }),
        },
      }));
      toast("Schema 草稿已保存", "ok");
    },
    [toast],
  );

  const publishSchema = useCallback<ProtoApi["publishSchema"]>(
    (schemaId) => {
      setState((s) => ({
        ...s,
        ai: {
          ...s.ai,
          schemas: s.ai.schemas.map((sc) => {
            if (sc.id !== schemaId) return sc;
            const draft = sc.versions.find((v) => v.state === "draft");
            if (!draft) return sc;
            return {
              ...sc,
              versions: sc.versions.map((v) => {
                if (v.id === draft.id) return { ...v, state: "published" as const, at: stamp() };
                if (v.state === "published") return { ...v, state: "archived" as const };
                return v;
              }),
            };
          }),
        },
      }));
      toast("Schema 已发布，引用该 Schema 的工具将按新版本校验", "ok");
    },
    [toast],
  );

  const rollbackSchema = useCallback<ProtoApi["rollbackSchema"]>(
    (schemaId, version) => {
      setState((s) => ({
        ...s,
        ai: {
          ...s.ai,
          schemas: s.ai.schemas.map((sc) => {
            if (sc.id !== schemaId) return sc;
            return {
              ...sc,
              versions: sc.versions.map((v) => {
                if (v.version === version) return { ...v, state: "published" as const };
                if (v.state === "published") return { ...v, state: "archived" as const };
                return v;
              }),
            };
          }),
        },
      }));
      toast(`Schema 已回滚到 ${version}`, "info");
    },
    [toast],
  );

  const setSchemaPolicy = useCallback<ProtoApi["setSchemaPolicy"]>(    (schemaId, patch) => {
      setState((s) => ({
        ...s,
        ai: {
          ...s.ai,
          schemas: s.ai.schemas.map((sc) => (sc.id === schemaId ? { ...sc, policy: { ...sc.policy, ...patch } } : sc)),
        },
      }));
      toast("生效策略已更新", "ok");
    },
    [toast],
  );

  const saveRoutingRule = useCallback<ProtoApi["saveRoutingRule"]>(
    (ruleId, patch) => {
      setState((s) => ({
        ...s,
        ai: {
          ...s.ai,
          routingRules: s.ai.routingRules.map((r) => (r.id === ruleId ? { ...r, ...patch } : r)),
        },
      }));
      toast("路由规则已保存", "ok");
    },
    [toast],
  );

  const toggleModelAvailability = useCallback<ProtoApi["toggleModelAvailability"]>(
    (modelId) => {
      const order: ModelDef["availability"][] = ["online", "degraded", "offline"];
      setState((s) => ({
        ...s,
        ai: {
          ...s.ai,
          models: s.ai.models.map((m) =>
            m.id === modelId
              ? { ...m, availability: order[(order.indexOf(m.availability) + 1) % order.length] }
              : m,
          ),
        },
      }));
      toast("模型可用状态已更新（模拟）", "info");
    },
    [toast],
  );

  const simulateRoute = useCallback<ProtoApi["simulateRoute"]>(
    (taskType, traceId) => {
      const rule = state.ai.routingRules.find((r) => r.taskType === taskType);
      if (!rule) {
        toast(`没有匹配「${taskType}」的路由规则`, "danger");
        return null;
      }
      if (!rule.enabled) {
        toast(`「${taskType}」路由规则已停用，请求被拒绝`, "danger");
        return null;
      }
      const find = (id: string) => state.ai.models.find((m) => m.id === id);
      const fits = (m?: ModelDef) =>
        !!m &&
        m.availability !== "offline" &&
        (!rule.requireTools || m.toolCalling === "full") &&
        (!rule.requireStructured || m.structured !== "none");
      const primary = find(rule.primaryModel);
      const fallback = find(rule.fallbackModel);
      const ms = (p50: string) => Math.round(parseFloat(p50) * 1000);
      const price = (m: ModelDef) => Number((m.priceIn * 2 + m.priceOut * 1.5).toFixed(4));
      const id = `RL-${idTail()}`;
      let log: RoutingLog;
      if (fits(primary) && price(primary!) <= rule.maxCost && ms(primary!.p50) <= rule.maxLatency) {
        log = {
          id,
          at: stamp(),
          traceId,
          taskType,
          chosen: primary!.id,
          reason: `${rule.condition}；成本与 P50 均在预算内`,
          degraded: primary!.availability === "degraded",
          outcome: "ok",
          cost: price(primary!),
          ms: ms(primary!.p50),
          note: primary!.availability === "degraded" ? "主模型处于降级状态，已记录并持续观察。" : "主模型直接承接。",
        };
      } else if (fallback && fits(fallback) && price(fallback) <= rule.maxCost * 1.5) {
        log = {
          id,
          at: stamp(),
          traceId,
          taskType,
          chosen: fallback.id,
          reason: `主模型 ${rule.primaryModel} 不满足要求（不可用 / 能力不足 / 超预算），切换备用模型`,
          fallback: fallback.id,
          degraded: true,
          outcome: "ok",
          cost: price(fallback),
          ms: ms(fallback.p50),
          note: "备用模型满足工具调用与结构化输出要求，允许降级执行。",
        };
      } else {
        const escalate = rule.onFallbackFail === "human";
        log = {
          id,
          at: stamp(),
          traceId,
          taskType,
          chosen: "—",
          reason: "主模型与备用模型均不满足工具调用 / 结构化输出 / 预算要求",
          degraded: true,
          outcome: escalate ? "escalated" : "refused",
          cost: 0,
          ms: 0,
          note: escalate
            ? "强制降级会导致工具调用或结构化输出不可靠，转人工处理。"
            : "强制降级会导致工具调用或结构化输出不可靠，拒绝执行并提示原因。",
        };
      }
      setState((s) => ({ ...s, ai: { ...s.ai, routingLogs: [log, ...s.ai.routingLogs].slice(0, 30) } }));
      toast(
        log.outcome === "ok"
          ? `已选择 ${log.chosen}${log.degraded ? "（降级）" : ""}`
          : log.outcome === "escalated"
            ? "无合格模型，已转人工"
            : "无合格模型，请求被拒绝",
        log.outcome === "ok" ? (log.degraded ? "warn" : "ok") : "danger",
      );
      return log;
    },
    [state.ai.routingRules, state.ai.models, toast],
  );

  const api = useMemo<ProtoApi>(
    () => ({
      state,
      toasts,
      toast,
      dismissToast,
      resetDemo,
      createSession,
      addMsg,
      deleteSession,
      renameSession,
      createPlan,
      addArea,
      updatePlan,
      confirmTask,
      cancelPlan,
      requestCancel,
      resolveCancel,
      setEventStatus,
      createEvent,
      addRoute,
      saveRoute,
      publishRoute,
      addWorkflow,
      publishWorkflow,
      runWorkflow,
      saveWorkflowNode,
      saveWorkflowGraph,
      saveWorkflowDraft,
      createWorkflowFromPrompt,
      modifyWorkflowFromPrompt,
      validateWorkflow,
      toggleWorkflowEnabled,
      bindWorkflowResource,
      toggleTool,
      saveTool,
      saveAgentDraft,
      publishAgentDraft,
      updateRoleTools,
      addKbDoc,
      retryKbDoc,
      rebuildKbIndex,
      saveRetrievalConfig,
      publishRetrievalConfig,
      runRetrieval,
      createDataset,
      addCase,
      saveDatasetVersion,
      startExperiment,
      runExperiment,
      annotate,
      createFix,
      updateFixStatus,
      reviewSample,
      addSampleToDataset,
      recordRelease,
      rollbackRelease,
      createAgentVersion,
      updateGateRule,
      savePromptDraft,
      publishPrompt,
      rollbackPrompt,
      rerunPromptGate,
      toggleSkill,
      createSkill,
      saveSkillDraft,
      publishSkill,
      runSkill,
      toggleMcpServer,
      discoverMcp,
      testMcpConnection,
      registerMcpServer,
      saveContextPolicy,
      toggleContextSource,
      saveSchemaDraft,
      publishSchema,
      rollbackSchema,
      setSchemaPolicy,
      saveRoutingRule,
      toggleModelAvailability,
      simulateRoute,
    }),
    [
      state,
      toasts,
      toast,
      dismissToast,
      resetDemo,
      createSession,
      addMsg,
      deleteSession,
      renameSession,
      createPlan,
      addArea,
      updatePlan,
      confirmTask,
      cancelPlan,
      requestCancel,
      resolveCancel,
      setEventStatus,
      createEvent,
      addRoute,
      saveRoute,
      publishRoute,
      addWorkflow,
      publishWorkflow,
      runWorkflow,
      saveWorkflowNode,
      saveWorkflowGraph,
      saveWorkflowDraft,
      createWorkflowFromPrompt,
      modifyWorkflowFromPrompt,
      validateWorkflow,
      toggleWorkflowEnabled,
      bindWorkflowResource,
      toggleTool,
      saveTool,
      saveAgentDraft,
      publishAgentDraft,
      updateRoleTools,
      addKbDoc,
      retryKbDoc,
      rebuildKbIndex,
      saveRetrievalConfig,
      publishRetrievalConfig,
      runRetrieval,
      createDataset,
      addCase,
      saveDatasetVersion,
      startExperiment,
      runExperiment,
      annotate,
      createFix,
      updateFixStatus,
      reviewSample,
      addSampleToDataset,
      recordRelease,
      rollbackRelease,
      createAgentVersion,
      updateGateRule,
      savePromptDraft,
      publishPrompt,
      rollbackPrompt,
      rerunPromptGate,
      toggleSkill,
      createSkill,
      saveSkillDraft,
      publishSkill,
      runSkill,
      toggleMcpServer,
      discoverMcp,
      testMcpConnection,
      registerMcpServer,
      saveContextPolicy,
      toggleContextSource,
      saveSchemaDraft,
      publishSchema,
      rollbackSchema,
      setSchemaPolicy,
      saveRoutingRule,
      toggleModelAvailability,
      simulateRoute,
    ]
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useProto() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useProto 必须在 ProtoProvider 内使用");
  return v;
}
