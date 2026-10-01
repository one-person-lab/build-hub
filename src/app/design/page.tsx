import type { Metadata } from "next";
import CatalogView from "@/components/CatalogView";

export const metadata: Metadata = {
  title: "设计｜BuildHub · 设计风格与 App 图标图鉴",
  description:
    "46 条设计参考：36 种经过市场验证的 UI 设计风格，每个都配可视化样张；8 种 App 图标风格附真实案例与 AI 生图提示词，另有主流图标库介绍与 3 个可点着玩的交互动效。",
  openGraph: {
    title: "设计｜BuildHub",
    description: "UI 设计风格、App 图标风格与图标库，一站式设计参考。",
  },
};

export default function DesignPage() {
  return <CatalogView catalogKey="design" />;
}
