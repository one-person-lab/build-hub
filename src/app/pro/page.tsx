import type { Metadata } from "next";
import ProPageView from "@/components/ProPageView";
import { packStats } from "@/lib/export-content";

const S = packStats("zh");

export const metadata: Metadata = {
  title: "BuildHub PRO｜离线包与给 AI 的 SKILL.md",
  description: `${S.concepts} 条概念、${S.prompts} 条提示词、${S.skills} 个技能、${S.designRefs} 条设计参考、${S.paths} 条路径和 ${S.playbooks} 本手册，整理成一份 Markdown 离线包，开头附一份给 AI 读的 SKILL.md。`,
  openGraph: {
    title: "BuildHub PRO",
    description: "把站里的内容整理成一份 Markdown 离线包，一次开通，整套拿走。",
  },
};

export default function ProPage() {
  return <ProPageView locale="zh" />;
}
