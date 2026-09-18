import type { Metadata } from "next";
import "./globals.css";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "BuildHub｜Vibe Coding 概念图鉴 · 用大白话找准前端、后端、AI 概念",
  description:
    "用大白话和真实场景解释前端、后端、产品、测试、AI、Git 等Vibe Coding 高频概念，每个概念配可视化示例。",
  icons: { apple: "/assets/buildhub-icon-180.png" },
  openGraph: {
    title: "BuildHub｜Vibe Coding 概念图鉴",
    images: ["/assets/social-card-zh.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <div className="site-shell">
          <SiteNav />
          {children}
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
