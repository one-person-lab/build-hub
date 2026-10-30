import type { Metadata } from "next";
import type { ReactNode } from "react";
import ProtoRoot from "@/components/proto/ProtoRoot";
import "@/components/proto/proto.css";

export const metadata: Metadata = {
  title: "无人机 Copilot · 交互原型",
  description: "无人机 Copilot 前后台高保真交互原型（模拟数据，不连接真实设备）。",
  robots: { index: false, follow: false },
};

export default function ProtoLayout({ children }: { children: ReactNode }) {
  return <ProtoRoot>{children}</ProtoRoot>;
}
