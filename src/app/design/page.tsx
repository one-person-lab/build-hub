import type { Metadata } from "next";
import CatalogView from "@/components/CatalogView";

export const metadata: Metadata = {
  title: "设计｜BuildHub · 设计风格与 App 图标图鉴",
  description:
    "61 条设计参考：经过市场验证的 UI 设计风格，每个都配可视化样张；15 种导航样式与 6 个认证页 block 可点开看大图；8 种 App 图标风格附真实案例与 AI 生图提示词，另有主流图标库介绍。",
  openGraph: {
    title: "设计｜BuildHub",
    description: "UI 设计风格、导航样式、认证页 block、App 图标风格与图标库，一站式设计参考。",
  },
};

export default function DesignPage() {
  return <CatalogView catalogKey="design" />;
}
