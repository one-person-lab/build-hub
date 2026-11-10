import type { DiagramSpec } from "./architecture-types";

export type PillarId = "ai-coding" | "architecture" | "testing" | "delivery";

/** 建设优先级：P0 先行，P1 跟进 */
export type Priority = "P0" | "P1";

/** 内容来源：行业最佳实践 / 工程做法 / 个人实践 / 实战案例 */
export type SourceKind = "industry" | "solution" | "personal" | "case";

/** 案例类型：真实项目或演示案例，必须在页面上标明 */
export type CaseKind = "real" | "demo";

export type KeyPoint = { title: string; body: string };
export type IndustryRef = { name: string; note: string; href: string };

export type SourceMeta = { id: SourceKind; label: string };

export type ContentBlock = {
  source: SourceKind;
  title: string;
  body: string;
  items: string[];
  /** 关键配置或代码片段 */
  code?: string;
};

/** 流程图的阶段说明：每段的输入、处理与输出 */
export type FlowStage = {
  stage: string;
  input: string;
  process: string;
  output: string;
};

export type Metric = { label: string; value: string; note: string };

export type Practice = {
  /** 同时作为详情页 slug */
  id: PillarId;
  no: string;
  name: string;
  en: string;
  /** 一句话说清这一栏做什么 */
  tagline: string;
  /** 关键词 */
  focus: string;
  priority: Priority;
  /** 这份实践对应的可复用手册 */
  handbook: string;
  /** 1 目标 */
  goal: { lead: string; items: string[] };
  /** 2 原则 */
  principles: KeyPoint[];
  /** 3 流程：主流程图 + 阶段输入/处理/输出 */
  flow: { diagram: DiagramSpec; stages: FlowStage[] };
  /** 4 规范：可复用的规则、模板与检查单 */
  specs: ContentBlock[];
  /** 4 规范：行业参考做法与出处 */
  refs: IndustryRef[];
  /** 5 案例 */
  workshop: ContentBlock & { kind: CaseKind; evidence: string };
  /** 6 效果与局限 */
  results: { metrics: Metric[]; limitations: string[]; evidence: string };
  /** 可复用的交付物 */
  deliverables: string[];
  /** 提示词模板 */
  prompt: { title: string; hint: string; text: string };
};
