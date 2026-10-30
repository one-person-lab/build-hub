import type { Trace, TraceStep } from "./data";

/* ------------------------------------------------------------------ */
/* 知识库与 RAG 检索：模型、索引、配置、分块、检索运行与评测            */
/* 所有数据均为演示模拟，不连接真实向量库或模型服务                     */
/* ------------------------------------------------------------------ */

export type KnowledgeDocType = "manual" | "regulation" | "sop" | "faq" | "case";

export const DOC_TYPE_LABEL: Record<KnowledgeDocType, string> = {
  manual: "设备手册",
  regulation: "制度规程",
  sop: "作业规范",
  faq: "FAQ",
  case: "复盘案例",
};

export const KB_PARSE_STAGES = ["解析文档", "清洗文本", "切分片段", "生成向量", "写入索引"] as const;
export type KbParseStage = (typeof KB_PARSE_STAGES)[number];

export interface KbChunk {
  id: string;
  docId: string;
  docType: KnowledgeDocType;
  section: string;
  page: number;
  tokens: number;
  text: string;
}

export interface EmbeddingModelDef {
  id: string;
  version: string;
  name: string;
  vendor: string;
  dim: number;
  maxTokens: number;
  pricePerKTok: number;
  p50: number;
  status: "online" | "degraded" | "offline";
  note: string;
}

export const EMBEDDING_MODELS: EmbeddingModelDef[] = [
  {
    id: "bge-m3",
    version: "1.0",
    name: "BGE-M3 多语向量",
    vendor: "BAAI · 本地部署（模拟）",
    dim: 1024,
    maxTokens: 8192,
    pricePerKTok: 0.0006,
    p50: 38,
    status: "online",
    note: "默认召回模型，成本低；中英混排资料可直接使用",
  },
  {
    id: "qwen3-embedding-8b",
    version: "1.0",
    name: "千问向量 8B",
    vendor: "阿里云百炼（模拟）",
    dim: 4096,
    maxTokens: 8192,
    pricePerKTok: 0.0021,
    p50: 96,
    status: "online",
    note: "长片段召回更稳，成本约为轻量模型的 3.5 倍",
  },
  {
    id: "bge-large-zh-v1.5",
    version: "1.5",
    name: "BGE 中文向量（旧版）",
    vendor: "BAAI（模拟）",
    dim: 1024,
    maxTokens: 512,
    pricePerKTok: 0.0034,
    p50: 120,
    status: "degraded",
    note: "未接入真实服务；仅用于演示候选模型对比",
  },
];

export interface RerankModelDef {
  id: string;
  version: string;
  name: string;
  vendor: string;
  maxDocs: number;
  pricePerKDoc: number;
  p50: number;
  status: "online" | "degraded" | "offline";
  note: string;
}

export const RERANK_MODELS: RerankModelDef[] = [
  {
    id: "bge-reranker-v2-m3",
    version: "1.0",
    name: "BGE 交叉重排",
    vendor: "BAAI · 本地部署（模拟）",
    maxDocs: 64,
    pricePerKDoc: 0.004,
    p50: 118,
    status: "online",
    note: "对召回候选逐条重排，适合文档量大、噪声多的知识库",
  },
  {
    id: "qwen3-reranker-0.6b",
    version: "1.0",
    name: "千问轻量重排",
    vendor: "阿里云百炼（模拟）",
    maxDocs: 32,
    pricePerKDoc: 0.0012,
    p50: 42,
    status: "online",
    note: "只做粗排序，收益有限；在 RAG 评测中排序指标低于交叉重排",
  },
];

export interface VectorIndexDef {
  id: string;
  name: string;
  engine: string;
  metric: "cosine" | "inner_product";
  dim: number;
  vectors: number;
  state: "ready" | "rebuilding" | "failed";
  updatedAt: string;
  note: string;
}

export const VECTOR_INDEXES: VectorIndexDef[] = [
  {
    id: "VX-KB-MAIN",
    name: "知识库主索引",
    engine: "向量索引（演示实现）",
    metric: "cosine",
    dim: 1024,
    vectors: 700,
    state: "ready",
    updatedAt: "2026-10-29 09:00",
    note: "仅包含已索引成功的文档；索引中 / 失败文档不会进入召回",
  },
];

export interface RetrievalConfig {
  id: string;
  version: string;
  name: string;
  state: "published" | "draft";
  chatModel: string;
  embeddingModel: string;
  rerankModel: string | null;
  indexId: string;
  topK: number;
  scoreThreshold: number;
  hybrid: boolean;
  hybridAlpha: number;
  rerank: boolean;
  rerankTopN: number;
  finalContexts: number;
  maxContextTokens: number;
  onLowConfidence: "refuse" | "handoff" | "caveat";
  updatedAt: string;
  updatedBy: string;
  note: string;
}

export const RETRIEVAL_CONFIGS: RetrievalConfig[] = [
  {
    id: "RC-2026-10-29.3",
    version: "1.3",
    name: "主检索配置 · 重排开启",
    state: "published",
    chatModel: "qwen3.8-flash",
    embeddingModel: "bge-m3@1.0",
    rerankModel: "bge-reranker-v2-m3@1.0",
    indexId: "VX-KB-MAIN",
    topK: 12,
    scoreThreshold: 0.6,
    hybrid: true,
    hybridAlpha: 0.6,
    rerank: true,
    rerankTopN: 6,
    finalContexts: 4,
    maxContextTokens: 2600,
    onLowConfidence: "refuse",
    updatedAt: "2026-10-29 09:20",
    updatedBy: "陈默",
    note: "线上配置：混合检索 + 交叉重排，低置信度直接拒答",
  },
  {
    id: "RC-2026-10-29.2",
    version: "1.2",
    name: "对照配置 · 重排关闭",
    state: "published",
    chatModel: "qwen3.8-flash",
    embeddingModel: "bge-m3@1.0",
    rerankModel: null,
    indexId: "VX-KB-MAIN",
    topK: 12,
    scoreThreshold: 0.58,
    hybrid: true,
    hybridAlpha: 0.6,
    rerank: false,
    rerankTopN: 6,
    finalContexts: 5,
    maxContextTokens: 2800,
    onLowConfidence: "caveat",
    updatedAt: "2026-10-26 14:02",
    updatedBy: "陈默",
    note: "旧配置：只用向量 + 关键词融合分，作为重排收益的对照基线",
  },
];

export const CURRENT_CONFIG_ID = "RC-2026-10-29.3";

export const retrievalConfigById = (id: string) => RETRIEVAL_CONFIGS.find((c) => c.id === id);

export const KB_CHUNKS: KbChunk[] = [
  {
    id: "CH-KB-01-01",
    docId: "KB-01",
    docType: "manual",
    section: "§2.1 起飞前检查",
    page: 6,
    tokens: 74,
    text: "起飞前须确认电量不低于 60%，桨叶无裂纹，机臂锁扣到位；风速超过 10 m/s 或能见度低于 500 米时不得起飞。",
  },
  {
    id: "CH-KB-01-02",
    docId: "KB-01",
    docType: "manual",
    section: "§3.2 架次间隔与电池温度异常",
    page: 11,
    tokens: 96,
    text: "电池温度异常（超过 45℃）时应立即停止使用并自然冷却，禁止强制风冷或冷敷，待温度回落至 35℃ 以下再执行任务；同一设备连续两个架次之间应间隔不少于 10 分钟，给电池留出散热时间。",
  },
  {
    id: "CH-KB-01-03",
    docId: "KB-01",
    docType: "manual",
    section: "§4.1 低电量返航",
    page: 15,
    tokens: 58,
    text: "剩余电量 25% 时应触发返航；低于 15% 必须就近降落，不得继续执行航线。返航过程中不得再次下发任务。",
  },
  {
    id: "CH-KB-01-04",
    docId: "KB-01",
    docType: "manual",
    section: "§5.3 限高与空域",
    page: 19,
    tokens: 64,
    text: "常规作业相对起飞点高度不超过 120 米；建筑密集区不得低于 30 米；进入临时空域窗口前须取得业务平台放行。",
  },
  {
    id: "CH-KB-02-01",
    docId: "KB-02",
    docType: "sop",
    section: "§1 占道判定标准",
    page: 2,
    tokens: 62,
    text: "消防通道净宽不得小于 4 米，转弯半径不小于 9 米；发现车辆占用、堆物或封闭时判定为占道。",
  },
  {
    id: "CH-KB-02-02",
    docId: "KB-02",
    docType: "sop",
    section: "§2 证据拍摄要求",
    page: 4,
    tokens: 56,
    text: "每处占道至少采集 2 张照片，需包含通道标识与参照物；夜间应开启补光，画面不得过曝。",
  },
  {
    id: "CH-KB-02-03",
    docId: "KB-02",
    docType: "sop",
    section: "§3 上报时限",
    page: 5,
    tokens: 54,
    text: "高风险占道应在 15 分钟内上报属地并电话确认；中低风险可随巡检报告一并提交。",
  },
  {
    id: "CH-KB-03-01",
    docId: "KB-03",
    docType: "manual",
    section: "§2.4 电池保养",
    page: 22,
    tokens: 88,
    text: "电池存放温度 5–35℃，长期存放电量保持在 40%–60%；每 20 次循环做一次完整充放电。电池温度高于 45℃ 时禁止充电。",
  },
  {
    id: "CH-KB-03-02",
    docId: "KB-03",
    docType: "manual",
    section: "§3.1 机臂与散热",
    page: 27,
    tokens: 66,
    text: "机臂散热孔堵塞是电池温度异常的常见原因。处理要求：连续作业后检查机臂散热孔是否被灰尘或遮挡物堵塞；散热不良会导致电池温度异常升高，严重时触发高温告警。",
  },
  {
    id: "CH-KB-03-03",
    docId: "KB-03",
    docType: "manual",
    section: "§4.2 桨叶检查",
    page: 31,
    tokens: 52,
    text: "桨叶出现裂纹、缺口或明显变形必须更换；更换后需重新做动平衡与起飞自检。",
  },
  {
    id: "CH-KB-04-01",
    docId: "KB-04",
    docType: "regulation",
    section: "§1 事件分级",
    page: 2,
    tokens: 78,
    text: "事件分为高、中、低三级。高风险包括人员闯入作业区、明火、结构坍塌迹象；高风险事件需 15 分钟内受理，2 小时内反馈处置结果。",
  },
  {
    id: "CH-KB-04-02",
    docId: "KB-04",
    docType: "regulation",
    section: "§2 处置权限",
    page: 5,
    tokens: 70,
    text: "取消、下发、接管等写操作仅限值班长及以上角色；智能助手不得代替人工确认，越权请求一律拒绝并转人工处理。",
  },
  {
    id: "CH-KB-04-03",
    docId: "KB-04",
    docType: "regulation",
    section: "§3 误报复核",
    page: 8,
    tokens: 58,
    text: "经人工复核为误报的事件需记录复核人、依据与时间，并回流至评测数据集，作为模型与 Prompt 的回归用例。",
  },
  {
    id: "CH-KB-05-01",
    docId: "KB-05",
    docType: "regulation",
    section: "§1 申报时限",
    page: 1,
    tokens: 68,
    text: "常规空域申报需提前 1 个工作日提交；临时空域窗口需提前 2 小时申请，并注明起止时间与高度范围。",
  },
  {
    id: "CH-KB-05-02",
    docId: "KB-05",
    docType: "regulation",
    section: "§2 申报材料",
    page: 3,
    tokens: 62,
    text: "申报材料包括作业区域坐标、航线高度、设备型号与操作人资质编号；材料不全将被退回，不得先飞后报。",
  },
  {
    id: "CH-KB-06-01",
    docId: "KB-06",
    docType: "case",
    section: "P12 故障复盘",
    page: 12,
    tokens: 60,
    text: "2025 年共发生 12 起电池温度告警，其中 9 起与连续架次间隔不足 10 分钟有关。",
  },
  {
    id: "CH-KB-06-02",
    docId: "KB-06",
    docType: "case",
    section: "P18 高频故障",
    page: 18,
    tokens: 48,
    text: "年度高频故障前三：电池温度异常、图传中断、航线校验失败。",
  },
];

const DOC_PRIOR: Record<KnowledgeDocType, number> = {
  regulation: 0.94,
  manual: 0.88,
  sop: 0.84,
  faq: 0.74,
  case: 0.58,
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const round3 = (v: number) => Math.round(v * 1000) / 1000;

function noise(id: string, salt: number) {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

function tokenize(text: string): string[] {
  const norm = text.toLowerCase().replace(/[\s，。、；：？！「」《》（）(),.;:?!"'`…—-]+/g, " ");
  const out = new Set<string>();
  for (const part of norm.split(" ")) {
    if (!part) continue;
    if (/^[a-z0-9.]+$/.test(part)) {
      out.add(part);
      continue;
    }
    if (part.length === 1) out.add(part);
    for (let i = 0; i < part.length - 1; i++) out.add(part.slice(i, i + 2));
  }
  return [...out];
}

export function expandQuery(question: string): string | null {
  const add: string[] = [];
  if (/为什么|原因|异常|告警/.test(question)) add.push("原因", "处理要求");
  if (/多久|间隔|时限|什么时候/.test(question)) add.push("时间要求");
  if (/标准|规范|要求|多宽|多少|几米/.test(question)) add.push("标准值");
  if (/空域|申报|报备/.test(question)) add.push("申报流程");
  if (/权限|能不能|可以|谁/.test(question)) add.push("权限");
  if (/维护|保养|更换/.test(question)) add.push("维护周期");
  return add.length ? `${question} ${add.join(" ")}` : null;
}

export interface RetrievalCandidate {
  chunkId: string;
  docId: string;
  docType: KnowledgeDocType;
  section: string;
  text: string;
  tokens: number;
  vectorScore: number;
  keywordScore: number;
  fusedScore: number;
  rerankScore?: number;
  rank?: number;
  selected: boolean;
  reason?: string;
}

export interface RetrievalPlan {
  rewritten: string | null;
  recalled: number;
  passed: number;
  candidates: RetrievalCandidate[];
  selected: RetrievalCandidate[];
  lowConfidence: boolean;
  lowReason?: string;
  timings: { rewrite: number; embed: number; retrieve: number; rerank: number; assemble: number; generate: number };
  contextTokens: number;
}

export function searchableChunks(
  docs: { id: string; state: string }[],
  chunks: KbChunk[],
): KbChunk[] {
  const indexed = new Set(docs.filter((d) => d.state === "indexed").map((d) => d.id));
  return chunks.filter((c) => indexed.has(c.docId));
}

const QUERY_STOP = new Set([
  "为什", "什么", "提示", "请问", "一下", "帮我", "怎么", "如何", "需要", "可以", "是否", "这个", "那个", "哪个",
]);

export function planRetrieval(question: string, cfg: RetrievalConfig, chunks: KbChunk[]): RetrievalPlan {
  const rewritten = cfg.hybrid ? expandQuery(question) : null;
  const queryText = rewritten ?? question;
  const allTokens = tokenize(queryText);
  const qTok = allTokens.filter((t) => !QUERY_STOP.has(t));
  const terms = qTok.length ? qTok : allTokens;

  const scored = chunks.map((c) => {
    const cTok = new Set(tokenize(`${c.section} ${c.text}`));
    const overlap = terms.filter((t) => cTok.has(t)).length;
    const ratio = terms.length ? overlap / Math.max(4, terms.length) : 0;
    const keywordScore = clamp01(ratio * 1.32 + 0.05 * noise(c.id, 7));
    const vectorScore = clamp01(0.3 + ratio * 0.86 + 0.05 * noise(c.id, 11));
    const fusedScore = clamp01(
      cfg.hybrid ? cfg.hybridAlpha * vectorScore + (1 - cfg.hybridAlpha) * keywordScore : vectorScore,
    );
    return { c, keywordScore, vectorScore, fusedScore };
  });

  const recalledScored = [...scored].sort((a, b) => b.fusedScore - a.fusedScore).slice(0, cfg.topK);
  const passedScored = recalledScored.filter((s) => s.fusedScore >= cfg.scoreThreshold);

  const withRerank = (list: typeof passedScored) =>
    list
      .map((s) => ({
        ...s,
        rerankScore: clamp01(
          0.46 * s.fusedScore + 0.32 * s.keywordScore + 0.2 * DOC_PRIOR[s.c.docType] + 0.02 * noise(s.c.id, 23),
        ),
      }))
      .sort((a, b) => b.rerankScore - a.rerankScore);

  const ordered = cfg.rerank ? withRerank(passedScored).slice(0, cfg.rerankTopN) : passedScored;

  const byChunk = new Map<string, RetrievalCandidate>();
  for (const s of recalledScored) {
    byChunk.set(s.c.id, {
      chunkId: s.c.id,
      docId: s.c.docId,
      docType: s.c.docType,
      section: s.c.section,
      text: s.c.text,
      tokens: s.c.tokens,
      vectorScore: round3(s.vectorScore),
      keywordScore: round3(s.keywordScore),
      fusedScore: round3(s.fusedScore),
      selected: false,
    });
  }
  ordered.forEach((s, i) => {
    const item = byChunk.get(s.c.id)!;
    item.rank = i + 1;
    if ("rerankScore" in s && typeof s.rerankScore === "number") item.rerankScore = round3(s.rerankScore);
    if (i < cfg.finalContexts) item.selected = true;
    else item.reason = "重排后排名超出最终上下文数";
  });
  for (const s of recalledScored) {
    const item = byChunk.get(s.c.id)!;
    if (!item.rank) item.reason = `低于相似度阈值 ${cfg.scoreThreshold.toFixed(2)}`;
  }

  const candidates = [...byChunk.values()].sort(
    (a, b) => (a.rank ?? 99) - (b.rank ?? 99) || b.fusedScore - a.fusedScore,
  );
  const selected = candidates.filter((c) => c.selected);
  const contextTokens = selected.reduce((s, c) => s + c.tokens, 0);

  const timings = {
    rewrite: cfg.hybrid ? 34 + question.length * 2 : 0,
    embed: 22 + (cfg.embeddingModel.includes("LARGE") ? 20 : 0),
    retrieve: 14 + Math.round(cfg.topK * 1.6),
    rerank: cfg.rerank ? 68 + passedScored.length * 7 : 0,
    assemble: 7,
    generate: 860 + question.length * 26 + selected.length * 90,
  };

  const lowConfidence = selected.length === 0;
  return {
    rewritten,
    recalled: recalledScored.length,
    passed: passedScored.length,
    candidates,
    selected,
    lowConfidence,
    lowReason: lowConfidence
      ? `召回候选最高融合分 ${(candidates[0]?.fusedScore ?? 0).toFixed(3)}，低于相似度阈值 ${cfg.scoreThreshold.toFixed(2)}`
      : undefined,
    timings,
    contextTokens,
  };
}

export function composeAnswer(question: string, selected: RetrievalCandidate[]): string {
  if (/电池|温度/.test(question)) {
    return "电池温度异常通常由连续架次间隔不足或机臂散热孔堵塞引起。按《无人机飞行安全操作规程（2026 版）》§3.2，同一设备连续两个架次之间应间隔不少于 10 分钟；电池温度超过 45℃ 时应停止使用并自然冷却，待回落至 35℃ 以下再执行任务。机臂散热孔被遮挡也会让温度异常升高，建议停机后一并检查。";
  }
  if (/消防通道|占道|占用/.test(question)) {
    return "消防通道净宽不得小于 4 米，转弯半径不小于 9 米；发现车辆占用、堆物或封闭即判定为占道。高风险占道应在 15 分钟内上报属地并电话确认，中低风险可随巡检报告一并提交。";
  }
  if (/事件|分级|反馈|受理/.test(question)) {
    return "事件分为高、中、低三级：人员闯入、明火、结构坍塌迹象属于高风险，需 15 分钟内受理、2 小时内反馈处置结果。取消、下发、接管等写操作仅限值班长及以上角色，助手不得代替人工确认。";
  }
  if (/空域|申报|报备/.test(question)) {
    return "常规空域申报需提前 1 个工作日提交；临时空域窗口需提前 2 小时申请，并注明起止时间与高度范围。材料包括区域坐标、航线高度、设备型号与操作人资质编号，材料不全会被退回。";
  }
  if (/维护|保养|桨叶|存放|循环/.test(question)) {
    return "电池存放温度 5–35℃，长期存放电量保持在 40%–60%，每 20 次循环做一次完整充放电，温度高于 45℃ 时禁止充电。桨叶出现裂纹、缺口或明显变形必须更换，更换后需重新做起飞自检。";
  }
  if (/取消|权限|谁确认/.test(question)) {
    return "取消、下发、接管等写操作仅限值班长及以上角色；助手只能生成取消申请，不能代替人工确认。越权请求会被拒绝并转人工处理。";
  }
  const top = selected[0];
  return top
    ? `根据知识库检索到的内容：${top.text}`
    : "知识库中没有检索到足够依据。";
}

export const REFUSAL_TEXT = "知识库中没有检索到足够的依据，我不会据此推测结论。可以换一种问法，或联系安全科确认后再执行。";

export type RagPath = "rag" | "tool" | "agent" | "rag+tool";

export const RAG_PATH_LABEL: Record<RagPath, string> = {
  rag: "知识检索",
  tool: "业务工具查询",
  agent: "Agent 任务编排",
  "rag+tool": "工具查询 + 知识检索",
};

export interface RetrievalCitation {
  chunkId: string;
  docId: string;
  docName: string;
  section: string;
  quote: string;
  score: number;
}

export interface RetrievalRun {
  id: string;
  traceId: string;
  sessionId?: string;
  question: string;
  rewritten: string | null;
  path: RagPath;
  configId: string;
  configVersion: string;
  embeddingModel: string;
  rerankModel: string | null;
  indexId: string;
  topK: number;
  scoreThreshold: number;
  candidates: RetrievalCandidate[];
  selected: RetrievalCandidate[];
  citations: RetrievalCitation[];
  answer: string;
  refused: boolean;
  lowConfidence: boolean;
  lowReason?: string;
  timings: RetrievalPlan["timings"];
  contextTokens: number;
  createdAt: string;
  toolCall?: { toolId: string; summary: string };
}

export function citationsFor(selected: RetrievalCandidate[], docName: (id: string) => string): RetrievalCitation[] {
  return selected.map((c) => ({
    chunkId: c.chunkId,
    docId: c.docId,
    docName: docName(c.docId),
    section: c.section,
    quote: c.text,
    score: c.rerankScore ?? c.fusedScore,
  }));
}

export function syntheticChunks(docId: string, name: string, type: KnowledgeDocType): KbChunk[] {
  const base = name.replace(/\.[a-z]+$/i, "");
  const texts = [
    `（演示片段）${base} 的适用范围、术语定义与责任分工。片段内容为模拟生成，用于展示解析与切分结果。`,
    `（演示片段）${base} 中的作业前置条件、检查项与禁止事项。`,
    `（演示片段）${base} 中的参数范围与阈值，以及超限时的处置要求。`,
    `（演示片段）${base} 中的记录、留档与上报流程。`,
    `（演示片段）${base} 中的异常分类、排查顺序与升级路径。`,
    `（演示片段）${base} 中的常见问题与处理建议。`,
  ];
  return texts.map((text, i) => ({
    id: `CH-${docId}-${String(i + 1).padStart(2, "0")}`,
    docId,
    docType: type,
    section: `§${i + 1} ${["范围与定义", "前置条件", "参数与阈值", "记录与上报", "异常排查", "常见问题"][i]}`,
    page: i + 1,
    tokens: 48 + i * 6,
    text,
  }));
}

export function makeRetrievalRun(input: {
  id: string;
  traceId: string;
  question: string;
  path: RagPath;
  config: RetrievalConfig;
  chunks: KbChunk[];
  docs: { id: string; name: string }[];
  createdAt: string;
  sessionId?: string;
  toolCall?: RetrievalRun["toolCall"];
}): RetrievalRun {
  const { question, config, chunks, docs } = input;
  const plan = planRetrieval(question, config, chunks);
  const docName = (id: string) => docs.find((d) => d.id === id)?.name ?? id;
  const refused = plan.lowConfidence && config.onLowConfidence !== "caveat";
  const citations = refused ? [] : citationsFor(plan.selected, docName);
  const answer = refused
    ? REFUSAL_TEXT
    : plan.lowConfidence
      ? `${composeAnswer(question, plan.selected)}（注意：本次检索置信度偏低，依据可能不完整。）`
      : composeAnswer(question, plan.selected);
  return {
    id: input.id,
    traceId: input.traceId,
    sessionId: input.sessionId,
    question,
    rewritten: plan.rewritten,
    path: input.path,
    configId: config.id,
    configVersion: config.version,
    embeddingModel: config.embeddingModel,
    rerankModel: config.rerankModel,
    indexId: config.indexId,
    topK: config.topK,
    scoreThreshold: config.scoreThreshold,
    candidates: plan.candidates,
    selected: plan.selected,
    citations,
    answer,
    refused,
    lowConfidence: plan.lowConfidence,
    lowReason: plan.lowReason,
    timings: plan.timings,
    contextTokens: plan.contextTokens,
    createdAt: input.createdAt,
    toolCall: input.toolCall,
  };
}

const timeOf = (stamp: string) => stamp.slice(11, 19);

export function buildRagTrace(run: RetrievalRun, agentId = "AGENT-COPILOT-OPS@1.4.2"): Trace {
  const start = timeOf(run.createdAt);
  const [hh, mm, ss] = start.split(":").map(Number);
  let cursor = hh * 3600 + mm * 60 + ss;
  const steps: TraceStep[] = [];
  const push = (s: Omit<TraceStep, "startedAt" | "ms"> & { ms: number }) => {
    const m = Math.floor(cursor / 60);
    steps.push({
      ...s,
      startedAt: `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}:${String(cursor % 60).padStart(2, "0")}`,
    });
    cursor += Math.max(1, Math.round(s.ms / 1000));
  };

  push({ key: "r1", label: "接收问题", kind: "message", state: "done", input: `「${run.question}」`, output: "归一化文本 1 条", ms: 160 });
  push({
    key: "r2",
    label: "路径判定",
    kind: "intent",
    state: "done",
    input: run.question,
    output:
      run.path === "rag+tool"
        ? "rag + tool：先查业务平台设备状态，再检索知识库"
        : run.path === "rag"
          ? "rag：知识类问题，走检索增强生成"
          : run.path === "tool"
            ? "tool：实时状态查询，直接调用业务工具"
            : "agent：复杂作业，进入任务规划与工具编排",
    ms: 420,
  });
  if (run.toolCall) {
    push({
      key: "r3",
      label: "业务工具查询",
      kind: "tool",
      state: "done",
      input: `${run.toolCall.toolId}{device:"M350-01"}`,
      output: run.toolCall.summary,
      ms: 640,
    });
  }
  push({
    key: "r4",
    label: "问题改写",
    kind: "retrieval",
    state: "done",
    input: run.question,
    output: run.rewritten ?? "未启用查询改写（单一问题直接检索）",
    ms: run.timings.rewrite,
  });
  push({
    key: "r5",
    label: "向量化",
    kind: "retrieval",
    state: "done",
    input: run.rewritten ?? run.question,
    output: `${run.embeddingModel} · 生成 1 条查询向量`,
    ms: run.timings.embed,
  });
  push({
    key: "r6",
    label: "向量召回",
    kind: "retrieval",
    state: "done",
    input: `index=${run.indexId} · topK=${run.topK}`,
    output: `候选 ${run.candidates.length} 条 · 阈值 ${run.scoreThreshold.toFixed(2)} 过滤后 ${run.candidates.filter((c) => !c.reason || !c.reason.startsWith("低于")).length} 条`,
    ms: run.timings.retrieve,
  });
  if (run.rerankModel) {
    push({
      key: "r7",
      label: "Rerank 重排",
      kind: "retrieval",
      state: "done",
      input: `${run.candidates.length} 条候选`,
      output: `${run.rerankModel} 重排 → 保留前 ${run.selected.length} 条进入上下文`,
      ms: run.timings.rerank,
    });
  }
  push({
    key: "r8",
    label: "上下文组装",
    kind: "retrieval",
    state: "done",
    input: `最终上下文 ${run.selected.length} 条`,
    output: `${run.contextTokens} tok · 预算 2600 tok · 超出时按优先级截断`,
    ms: run.timings.assemble,
  });
  push({
    key: "r9",
    label: "生成回答",
    kind: "retrieval",
    state: run.refused ? "error" : "done",
    input: `${run.selected.length} 条片段 + PR-KB-QA@1.0`,
    output: run.refused ? "低置信度：按策略拒答" : `引用 ${run.citations.length} 条来源，回答已生成`,
    ms: run.timings.generate,
    ...(run.refused ? { error: run.lowReason ?? "检索置信度不足" } : {}),
  });
  push({
    key: "r10",
    label: "引用校验",
    kind: "result",
    state: run.refused ? "done" : "done",
    input: run.citations.map((c) => `${c.docId}${c.section}`).join(" / ") || "无引用",
    output: run.refused ? "未生成引用（拒答）" : `引用 ${run.citations.length} 条，全部可在知识库定位`,
    ms: 120,
  });

  const totalMs = steps.reduce((s, x) => s + x.ms, 0);
  return {
    id: run.traceId,
    sessionId: run.sessionId,
    agentId,
    totalMs,
    status: run.refused ? "ok" : "ok",
    steps,
    retrievalRunId: run.id,
  };
}

/* ------------------------------------------------------------------ */
/* RAG 专项评测数据                                                    */
/* ------------------------------------------------------------------ */

export interface RagEvalCaseResult {
  id: string;
  question: string;
  expectedDocIds: string[];
  retrievedDocIds: string[];
  expectedRefusal: boolean;
  recall5: number;
  mrr: number;
  ndcg5: number;
  contextRelevance: number;
  answerCorrect: boolean;
  citationAccurate: boolean;
  refusalCorrect: boolean;
  pass: boolean;
  note: string;
}

export interface RagEvalRun {
  id: string;
  name: string;
  datasetId: string;
  datasetVersion: string;
  configId: string;
  configVersion: string;
  embeddingModel: string;
  rerankModel: string | null;
  chatModel: string;
  promptVersion: string;
  at: string;
  metrics: {
    recall5: number;
    mrr: number;
    ndcg5: number;
    contextRelevance: number;
    answerAccuracy: number;
    citationAccuracy: number;
    refusalAccuracy: number;
  };
  cases: RagEvalCaseResult[];
  note: string;
}

const RAG_CASES_OFF: RagEvalCaseResult[] = [
  {
    id: "RQ-01",
    question: "M350-01 为什么提示电池温度异常？",
    expectedDocIds: ["KB-01", "KB-03"],
    retrievedDocIds: ["KB-03", "KB-01", "KB-02"],
    expectedRefusal: false,
    recall5: 100,
    mrr: 100,
    ndcg5: 94,
    contextRelevance: 88,
    answerCorrect: true,
    citationAccurate: true,
    refusalCorrect: true,
    pass: true,
    note: "两条依据均召回，排序正确",
  },
  {
    id: "RQ-02",
    question: "无人机连续两个架次之间需要间隔多久？",
    expectedDocIds: ["KB-01"],
    retrievedDocIds: ["KB-01", "KB-06"],
    expectedRefusal: false,
    recall5: 100,
    mrr: 100,
    ndcg5: 96,
    contextRelevance: 92,
    answerCorrect: true,
    citationAccurate: true,
    refusalCorrect: true,
    pass: true,
    note: "召回准确，但复盘案例被排到第 2 位，挤占上下文",
  },
  {
    id: "RQ-03",
    question: "消防通道多宽算占用？",
    expectedDocIds: ["KB-02"],
    retrievedDocIds: ["KB-02", "KB-04"],
    expectedRefusal: false,
    recall5: 100,
    mrr: 100,
    ndcg5: 98,
    contextRelevance: 94,
    answerCorrect: true,
    citationAccurate: true,
    refusalCorrect: true,
    pass: true,
    note: "标准值召回正确",
  },
  {
    id: "RQ-04",
    question: "高风险事件多久内要反馈处置结果？",
    expectedDocIds: ["KB-04"],
    retrievedDocIds: ["KB-04", "KB-02", "KB-06"],
    expectedRefusal: false,
    recall5: 100,
    mrr: 100,
    ndcg5: 88,
    contextRelevance: 76,
    answerCorrect: true,
    citationAccurate: false,
    refusalCorrect: true,
    pass: false,
    note: "回答正确但引用错标为「上报时限」章节，引用准确性不通过",
  },
  {
    id: "RQ-05",
    question: "临时空域窗口需要提前多久申报？",
    expectedDocIds: ["KB-05"],
    retrievedDocIds: ["KB-01"],
    expectedRefusal: false,
    recall5: 0,
    mrr: 0,
    ndcg5: 0,
    contextRelevance: 32,
    answerCorrect: false,
    citationAccurate: false,
    refusalCorrect: true,
    pass: false,
    note: "KB-05 未完成索引，召回失败；模型用 §5.3 限高条款作答，属于依据错误",
  },
  {
    id: "RQ-06",
    question: "电池长期存放电量应该保持多少？",
    expectedDocIds: ["KB-03"],
    retrievedDocIds: ["KB-03", "KB-01", "KB-06"],
    expectedRefusal: false,
    recall5: 100,
    mrr: 100,
    ndcg5: 90,
    contextRelevance: 84,
    answerCorrect: true,
    citationAccurate: true,
    refusalCorrect: true,
    pass: true,
    note: "召回正确，上下文含复盘噪声",
  },
  {
    id: "RQ-07",
    question: "高空抛物的取证标准是什么？",
    expectedDocIds: [],
    retrievedDocIds: ["KB-06", "KB-02"],
    expectedRefusal: true,
    recall5: 100,
    mrr: 100,
    ndcg5: 100,
    contextRelevance: 21,
    answerCorrect: false,
    citationAccurate: true,
    refusalCorrect: false,
    pass: false,
    note: "知识库无依据，但配置为「带保留作答」，模型给出了未经证实的结论",
  },
  {
    id: "RQ-08",
    question: "能不能帮我直接把 T-20261029-01 取消？",
    expectedDocIds: ["KB-04"],
    retrievedDocIds: ["KB-04"],
    expectedRefusal: true,
    recall5: 100,
    mrr: 100,
    ndcg5: 100,
    contextRelevance: 90,
    answerCorrect: true,
    citationAccurate: true,
    refusalCorrect: true,
    pass: true,
    note: "召回权限条款，正确拒绝越权请求并转人工",
  },
];

const RAG_CASES_ON: RagEvalCaseResult[] = [
  {
    ...RAG_CASES_OFF[0],
    retrievedDocIds: ["KB-01", "KB-03", "KB-02"],
    ndcg5: 98,
    contextRelevance: 94,
    note: "重排把规程条款提到第 1 位，回答直接引用 §3.2",
  },
  {
    ...RAG_CASES_OFF[1],
    retrievedDocIds: ["KB-01", "KB-03"],
    ndcg5: 100,
    contextRelevance: 96,
    note: "复盘案例被重排到阈值以下，上下文更干净",
  },
  {
    ...RAG_CASES_OFF[2],
    ndcg5: 100,
    contextRelevance: 96,
  },
  {
    ...RAG_CASES_OFF[3],
    retrievedDocIds: ["KB-04", "KB-02"],
    ndcg5: 94,
    contextRelevance: 88,
    citationAccurate: true,
    pass: true,
    note: "重排后引用章节与答案一致",
  },
  {
    ...RAG_CASES_OFF[4],
    retrievedDocIds: ["KB-05", "KB-01"],
    recall5: 100,
    mrr: 100,
    ndcg5: 96,
    contextRelevance: 90,
    answerCorrect: true,
    citationAccurate: true,
    pass: true,
    note: "KB-05 完成索引后召回正确；索引状态会影响评测结果",
  },
  {
    ...RAG_CASES_OFF[5],
    retrievedDocIds: ["KB-03", "KB-01"],
    ndcg5: 96,
    contextRelevance: 92,
    note: "噪声片段被压到阈值以下",
  },
  {
    ...RAG_CASES_OFF[6],
    retrievedDocIds: [],
    contextRelevance: 0,
    answerCorrect: true,
    citationAccurate: true,
    refusalCorrect: true,
    pass: true,
    note: "低置信度按策略拒答，未给出未经证实的结论",
  },
  {
    ...RAG_CASES_OFF[7],
  },
];

function summarizeRagCases(cases: RagEvalCaseResult[]) {
  const avg = (fn: (c: RagEvalCaseResult) => number) =>
    Math.round(cases.reduce((s, c) => s + fn(c), 0) / Math.max(1, cases.length));
  const refusalCases = cases.filter((c) => c.expectedRefusal);
  return {
    recall5: avg((c) => c.recall5),
    mrr: avg((c) => c.mrr),
    ndcg5: avg((c) => c.ndcg5),
    contextRelevance: avg((c) => c.contextRelevance),
    answerAccuracy: avg((c) => (c.answerCorrect ? 100 : 0)),
    citationAccuracy: avg((c) => (c.citationAccurate ? 100 : 0)),
    refusalAccuracy: Math.round(
      refusalCases.reduce((s, c) => s + (c.refusalCorrect ? 100 : 0), 0) / Math.max(1, refusalCases.length),
    ),
  };
}

export const RAG_EVAL_RUNS: RagEvalRun[] = [
  {
    id: "RE-20261029-01",
    name: "检索配置 1.2 · 重排关闭",
    datasetId: "DS-03",
    datasetVersion: "v2",
    configId: "RC-2026-10-29.2",
    configVersion: "1.2",
    embeddingModel: "bge-m3@1.0",
    rerankModel: null,
    chatModel: "qwen3.8-flash",
    promptVersion: "PR-KB-QA@1.0",
    at: "2026-10-29 09:30",
    metrics: summarizeRagCases(RAG_CASES_OFF),
    cases: RAG_CASES_OFF,
    note: "基线：只做混合检索，不启用重排；拒答策略为「带保留作答」",
  },
  {
    id: "RE-20261029-02",
    name: "检索配置 1.3 · 重排开启",
    datasetId: "DS-03",
    datasetVersion: "v2",
    configId: "RC-2026-10-29.3",
    configVersion: "1.3",
    embeddingModel: "bge-m3@1.0",
    rerankModel: "bge-reranker-v2-m3@1.0",
    chatModel: "qwen3.8-flash",
    promptVersion: "PR-KB-QA@1.0",
    at: "2026-10-29 10:05",
    metrics: summarizeRagCases(RAG_CASES_ON),
    cases: RAG_CASES_ON,
    note: "候选：开启重排 + 低置信度拒答；排序与引用指标提升，拒答合理性 100%",
  },
];

export const RAG_TEST_QUESTIONS = [
  "M350-01 为什么提示电池温度异常？",
  "消防通道多宽算占用？",
  "无人机连续两个架次之间需要间隔多久？",
  "临时空域窗口需要提前多久申报？",
  "高风险事件多久内要反馈处置结果？",
  "高空抛物的取证标准是什么？",
];

export const KB_QA_PROMPT_ID = "PR-KB-QA";
export const KB_QA_PROMPT_VERSION = "PR-KB-QA@1.0";
