import type { Metadata } from "next";
import CatalogView from "@/components/CatalogView";

export const metadata: Metadata = {
  title: "动效｜BuildHub · 161 个轮播与交互动效",
  description:
    "161 个轮播与交互动效：157 个收录自 21st.dev，卡片上直接播放原版演示，另有 4 个能在站内上手操作。按 3D 透视、堆叠扇形、弧形轮盘等 9 类交互形态整理，点开卡片看原链与可复制的提示词。",
  openGraph: {
    title: "动效｜BuildHub",
    description: "161 个轮播与交互动效，按交互形态分类，点开任意卡片看预览与原链。",
  },
};

export default function DistillIndexPage() {
  return <CatalogView catalogKey="motion" />;
}
