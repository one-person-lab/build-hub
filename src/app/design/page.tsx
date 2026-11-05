import type { Metadata } from "next";
import CatalogView from "@/components/CatalogView";
import { designCounts } from "@/lib/export-content";

const D = designCounts("zh");

export const metadata: Metadata = {
  title: "设计｜BuildHub · 设计风格与 App 图标图鉴",
  description: `${D.webStyles} 种 UI 风格、${D.navStyles} 种导航样式、${D.authBlocks} 个认证页、${D.footers} 种页脚，每条都能点开看真实排版；另有 ${D.iconStyles} 种 App 图标风格，附真实案例和 AI 生图提示词。`,
  openGraph: {
    title: "设计｜BuildHub",
    description: "UI 风格、导航样式、认证页、页脚与 App 图标，每条都配能点开的界面。",
  },
};

export default function DesignPage() {
  return <CatalogView catalogKey="design" />;
}
