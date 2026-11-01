import type { Metadata } from "next";
import BuildHubSkillView from "@/components/BuildHubSkillView";

export const metadata: Metadata = {
  title: "BuildHub Skill｜让 Agent 把你说的效果叫出准确术语",
  description:
    "装进 Claude Code、Cursor 的术语 Skill：把模糊描述改成可以直接发送的需求，主动点出你没叫出名字的术语，并链接到 BuildHub 词条页。复制一句话就能装。",
};

export default function BuildHubSkillPage() {
  return <BuildHubSkillView />;
}
