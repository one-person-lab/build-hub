import type { Metadata } from "next";
import SkillLibraryView from "@/components/SkillLibraryView";

export const metadata: Metadata = {
  title: "技能库｜BuildHub · 时下最流行的 Skill 合集",
  description:
    "按用途分类的流行 Skill 合集：视频、动效、自媒体发布、开发设计。点卡片直达原作者的仓库或官网。",
  openGraph: {
    title: "技能库｜BuildHub",
    description: "时下最流行的 Skill 合集，点卡片直达原作者仓库 / 官网。",
  },
};

export default function SkillsPage() {
  return <SkillLibraryView locale="zh" />;
}
