import type { Metadata } from "next";
import BuildHubSkillView from "@/components/BuildHubSkillView";

export const metadata: Metadata = {
  title: "BuildHub Skill｜为 Agent 补全准确的前端术语",
  description:
    "安装到 Claude Code、Cursor 等 Agent 的术语 Skill：将模糊描述改写为规范需求，主动提示相关术语并链接到带示例的 BuildHub 词条页。一条指令即可安装。",
};

export default function BuildHubSkillPage() {
  return <BuildHubSkillView />;
}
