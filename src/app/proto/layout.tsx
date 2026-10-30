import type { Metadata } from "next";
import type { ReactNode } from "react";
import ProtoRoot from "@/components/proto/ProtoRoot";
import "@/components/proto/proto.css";

export const metadata: Metadata = {
  title: "无人机 Copilot · 交互原型",
  description: "无人机 Copilot 前后台高保真交互原型（模拟数据，不连接真实设备）。",
  robots: { index: false, follow: false },
  /* 子域 uav.buildhub.cn 上的独立标识：不跟主站的金色 B 混用 */
  icons: { icon: "/uav-icon.svg", apple: "/uav-icon-180.png" },
};

export default function ProtoLayout({ children }: { children: ReactNode }) {
  return <ProtoRoot>{children}</ProtoRoot>;
}
