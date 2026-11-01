import type { Metadata } from "next";
import ProPageView from "@/components/ProPageView";

export const metadata: Metadata = {
  title: "BuildHub PRO｜资产包与 Agent Kit",
  description:
    "409 条概念、19 条提示词、25 个技能、40 条设计参考、4 条路径和 3 本手册，整理成一份可直接交给 AI 的 Markdown 资产包，外加一份 Agent Kit。",
  openGraph: {
    title: "BuildHub PRO",
    description: "把站里的知识，变成能用的资产。资产包 + Agent Kit，一次开通，整套拿走。",
  },
};

export default function ProPage() {
  return <ProPageView locale="zh" />;
}
