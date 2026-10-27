import type { Metadata } from "next";
import { PathsIndex } from "@/components/PathsView";

export const metadata: Metadata = {
  title: "路径｜BuildHub · 从想法到上线，走这三条",
  description:
    "三条排好顺序的动手路径：做出第一个产品官网、给 AI 装一套工作流、把界面做出质感。每一步都连到课程、提示词和技能，并写明完成标志。",
  openGraph: {
    title: "路径｜BuildHub",
    description:
      "三条排好顺序的动手路径，每一步都有完成标志，点开就是能用的课程、提示词和技能。",
  },
};

export default function PathsPage() {
  return <PathsIndex />;
}
