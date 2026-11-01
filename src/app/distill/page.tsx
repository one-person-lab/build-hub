import type { Metadata } from "next";
import CatalogView from "@/components/CatalogView";

export const metadata: Metadata = {
  title: "动效｜BuildHub · 4 个可点着玩的交互动效",
  description:
    "4 个可点着玩的交互动效：卡片轮播、信纸开场、暗场引导、弹跳卡片，全部用原生 CSS/JS 实现，可拖动、可点屏推进、参数实时可调。",
  openGraph: {
    title: "动效｜BuildHub",
    description: "4 个可点着玩的交互动效，点开就能玩。",
  },
};

export default function DistillIndexPage() {
  return <CatalogView catalogKey="motion" />;
}
