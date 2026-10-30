import playbooksData from "@/data/playbooks.json";
import { isGuide, type Guide, type LibEntry, type Playbook, type PlaybookStep } from "./playbook-types";

export type { Playbook, PlaybookStep };

const LIB = playbooksData as unknown as Record<string, LibEntry>;

export function playbookIds(): string[] {
  return Object.keys(LIB);
}

/** 带 id 的分步手册清单，给「还能复刻的档案」这类列表页用；指南没有步，不参与复刻 */
export function playbookList(): (Playbook & { id: string })[] {
  return Object.entries(LIB)
    .filter(([, p]) => !isGuide(p))
    .map(([id, p]) => ({ id, ...(p as Playbook) }));
}

export function getPlaybook(id: string): Playbook | null {
  const entry = LIB[id];
  return entry && !isGuide(entry) ? (entry as Playbook) : null;
}

export function getGuide(id: string): Guide | null {
  const entry = LIB[id];
  return entry && isGuide(entry) ? entry : null;
}

/**
 * 服务端只要步数就能判断某一步存不存在，所以给 API 用；
 * 直接 require 整个 JSON 会让 API 路由背上全部正文。
 */
export function playbookSteps(id: string): PlaybookStep[] | null {
  return (LIB[id] as Playbook | undefined)?.steps ?? null;
}
