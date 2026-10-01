import type { Metadata, Viewport } from "next";
import "./globals.css";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { THEME_INIT_SCRIPT } from "@/lib/theme";

/* 手机浏览器地址栏配色：跟随系统深浅，取站内 --ground 两档 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f7f8" },
    { media: "(prefers-color-scheme: dark)", color: "#14151a" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_URL || "http://localhost:3000",
  ),
  title: "技能资产库 BuildHub｜把会的东西，变成可用的资产。",
  description:
    "给非工程师的 AI 编程入门站：用大白话解释前端、后端、AI、Git 等高频概念，每个词条配可视化示例；精选技能、实测产品、可直接抄的提示词和动手手册，帮你从看懂第一个概念开始，把产品做出来。",
  icons: { icon: "/icon.svg", apple: "/assets/buildhub-icon-180.png" },
  openGraph: {
    title: "技能资产库 BuildHub｜把会的东西，变成可用的资产。",
    images: ["/assets/social-card-zh.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <script
          async
          defer
          src="https://stat.buildhub.cn/script.js"
          data-website-id="cc7d51ce-8cc5-476b-aef7-9e2e0c3a5cd5"
        />
      </head>
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
