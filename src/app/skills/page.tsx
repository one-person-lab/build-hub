import type { Metadata } from "next";
import SkillLibraryView from "@/components/SkillLibraryView";

export const metadata: Metadata = {
  title: "技能库｜BuildHub · 主流 Agent Skills 精选",
  description:
    "精选市面主流、真正好用的 Agent Skills：元技能、工程工作流、设计与前端、文档处理、浏览器自动化。每个技能附一键复制的安装命令。",
  openGraph: {
    title: "技能库｜BuildHub",
    description: "主流 Agent Skills 精选，每个技能都带验证过的安装命令。",
  },
};

export default function SkillsPage() {
  return <SkillLibraryView locale="zh" />;
}
