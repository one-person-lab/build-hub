import type { Metadata, Viewport } from "next";
import "./globals.css";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { AuthModalHost } from "@/components/AuthModal";
import { CopyLimitHost } from "@/components/CopyLimitHost";
import { THEME_INIT_SCRIPT } from "@/lib/theme";

/* 手机浏览器地址栏配色：站内默认深色，取 --ground 深色档 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#14151a",
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_URL || "http://localhost:3000",
  ),
  title: "BuildHub 软件构建资产平台",
  description:
    "BuildHub 收的是概念、界面参考、技术栈、提示词、技能和使用路径，每条都是完整正文：人能直接读，AI 能直接拿去用。",
  icons: {
    icon: [{ url: "/favicon.ico", type: "image/x-icon" }, "/icon.svg"],
    apple: "/assets/buildhub-mark-180.png",
  },
  openGraph: {
    siteName: "BuildHub",
    title: "BuildHub｜把会的东西，变成可用的资产。",
    description:
      "AI 驱动的软件构建知识与数字资产平台。概念、界面参考、技术栈、提示词、技能和使用路径都在站里，每条都是完整正文。",
    images: ["/assets/social-card-zh-v2.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" data-scroll-behavior="smooth" suppressHydrationWarning>
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
          <AuthModalHost />
          <CopyLimitHost />
        </div>
      </body>
    </html>
  );
}
