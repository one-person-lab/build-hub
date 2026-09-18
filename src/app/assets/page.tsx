import type { Metadata } from "next";
import AssetLibraryView from "@/components/AssetLibraryView";

export const metadata: Metadata = {
  title: "素材库｜BuildHub · 经市场验证的 Logo 设计风格",
  description:
    "每个 Logo 风格都配真实商业品牌案例拆解和可直接复制的 AI 生图提示词：风格为什么有效、适合什么品牌、一句话生成同款气质。",
  openGraph: {
    title: "素材库｜BuildHub",
    description: "经市场验证的 Logo 设计风格，案例 + 提示词，拿来即用。",
  },
};

export default function AssetsPage() {
  return <AssetLibraryView locale="zh" />;
}
