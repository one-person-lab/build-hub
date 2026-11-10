import type { Metadata } from "next";
import { ArchitectureIndex } from "@/components/ArchitectureView";

export const metadata: Metadata = {
  title: "架构｜BuildHub · 把系统画出来，讲清楚",
  description:
    "平台架构案例列表：每个平台一整套图——产品功能架构、核心业务流程、系统总体架构、核心技术架构、核心交互时序、系统部署架构，全部可交互。",
  openGraph: {
    title: "架构｜BuildHub",
    description: "每个平台一整套能交互的架构图，从产品功能到部署。",
  },
};

export default function ArchitecturePage() {
  return <ArchitectureIndex />;
}