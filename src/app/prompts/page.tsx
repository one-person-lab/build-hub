import type { Metadata } from "next";
import PromptLibraryView from "@/components/PromptLibraryView";

export const metadata: Metadata = {
  title: "提示词库｜BuildHub · Vibe Coding 全流程提示词",
  description:
    "按做产品的流程分类的提示词合集：说清需求、生成代码、调试报错、优化重构、加功能、部署上线。每条都给可复制全文，并讲清楚为什么这么写。",
  openGraph: {
    title: "提示词库｜BuildHub",
    description: "Vibe Coding 全流程提示词，每条可一键复制，附原理拆解与避坑指南。",
  },
};

export default function PromptsPage() {
  return <PromptLibraryView locale="zh" />;
}
