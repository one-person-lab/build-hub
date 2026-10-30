"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Badge, type Tone } from "@/components/proto/ui";
import { EVALUATOR_KIND_LABEL, type EvaluatorKind } from "@/lib/proto/eval-data";

export function EvalCrumb({ label }: { label: string }) {
  return (
    <div className="p-crumb">
      <Link href="/proto/admin/eval">AI 评测与优化</Link>
      <span>/</span>
      <span>{label}</span>
    </div>
  );
}

export function EvalMockNote({ children }: { children?: ReactNode }) {
  return (
    <p className="p-footnote">
      数据集、实验、评分与指标均为模拟数据，未调用真实模型或设备，也不代表真实线上表现。{children}
    </p>
  );
}

export function ScoreBar({ value, suffix = "%" }: { value: number; suffix?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  const tone = pct >= 90 ? "is-ok" : pct >= 70 ? "is-mid" : "is-low";
  return (
    <div className={`p-score ${tone}`}>
      <div className="p-score-bar">
        <i style={{ width: `${pct}%` }} />
      </div>
      <b>
        {value}
        {suffix}
      </b>
    </div>
  );
}

export function KindBadge({ kind }: { kind: EvaluatorKind }) {
  const tone: Tone = kind === "rule" ? "info" : kind === "llm" ? "brand" : "muted";
  return <Badge tone={tone}>{EVALUATOR_KIND_LABEL[kind]}</Badge>;
}

export function RunBadge({ status }: { status: "draft" | "running" | "done" }) {
  if (status === "draft") return <Badge tone="muted">未运行</Badge>;
  if (status === "running") return <Badge tone="active">运行中</Badge>;
  return <Badge tone="ok">已完成</Badge>;
}

export function FailTypeBadge({ label, safety }: { label: string; safety?: boolean }) {
  return <span className={`p-tag${safety ? " is-safety" : ""}`}>{label}</span>;
}

export function DeltaText({ from, to, suffix = "%" }: { from: number; to: number; suffix?: string }) {
  const diff = to - from;
  if (diff === 0) return <span className="p-delta is-flat">持平</span>;
  return (
    <span className={`p-delta ${diff > 0 ? "is-up" : "is-down"}`}>
      {diff > 0 ? "+" : ""}
      {diff}
      {suffix}
    </span>
  );
}

export function EmptyLine({ children }: { children: ReactNode }) {
  return <p className="p-muted p-small" style={{ margin: 0 }}>{children}</p>;
}

export interface EvalPreset {
  datasetId?: string;
  agentVersion?: string;
  experimentId?: string;
  promptVersion?: string;
  schemaVersion?: string;
  routingPolicy?: string;
}

export const EVAL_PRESET_EVENT = "eval-preset";

const PRESET_KEYS = {
  datasetId: "eval-preset-dataset",
  agentVersion: "eval-preset-version",
  experimentId: "eval-preset-experiment",
  promptVersion: "eval-preset-prompt",
  schemaVersion: "eval-preset-schema",
  routingPolicy: "eval-preset-routing",
} as const;

/** 跨页预填：sessionStorage 兜底整页刷新，页面已挂载时用事件立即生效 */
export function emitEvalPreset(preset: EvalPreset) {
  try {
    for (const key of Object.keys(PRESET_KEYS) as (keyof EvalPreset)[]) {
      const value = preset[key];
      if (value) window.sessionStorage.setItem(PRESET_KEYS[key], value);
    }
  } catch {}
  window.dispatchEvent(new CustomEvent<EvalPreset>(EVAL_PRESET_EVENT, { detail: preset }));
}

export function consumeEvalPreset(): EvalPreset {
  const preset: EvalPreset = {};
  try {
    const datasetId = window.sessionStorage.getItem(PRESET_KEYS.datasetId);
    const agentVersion = window.sessionStorage.getItem(PRESET_KEYS.agentVersion);
    const experimentId = window.sessionStorage.getItem(PRESET_KEYS.experimentId);
    const promptVersion = window.sessionStorage.getItem(PRESET_KEYS.promptVersion);
    const schemaVersion = window.sessionStorage.getItem(PRESET_KEYS.schemaVersion);
    const routingPolicy = window.sessionStorage.getItem(PRESET_KEYS.routingPolicy);
    preset.datasetId = datasetId ?? undefined;
    preset.agentVersion = agentVersion ?? undefined;
    preset.experimentId = experimentId ?? undefined;
    preset.promptVersion = promptVersion ?? undefined;
    preset.schemaVersion = schemaVersion ?? undefined;
    preset.routingPolicy = routingPolicy ?? undefined;
    for (const key of Object.values(PRESET_KEYS)) window.sessionStorage.removeItem(key);
  } catch {}
  return preset;
}

export function clearEvalPreset() {
  try {
    for (const key of Object.values(PRESET_KEYS)) window.sessionStorage.removeItem(key);
  } catch {}
}
