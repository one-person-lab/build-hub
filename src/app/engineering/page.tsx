import type { Metadata } from "next";
import { EngineeringIndex } from "@/components/EngineeringView";

export const metadata: Metadata = {
  title: "工程实践｜BuildHub · AI 原生软件工程实践体系",
  description:
    "AI 原生软件工程的实践体系：AI 编程、架构设计、自动化测试、质量与交付。每份包含目标、原则、流程图、规范清单和案例。",
  openGraph: {
    title: "工程实践｜BuildHub",
    description: "AI 编程、架构设计、自动化测试、质量与交付。",
  },
};

export default function EngineeringPage() {
  return <EngineeringIndex />;
}
