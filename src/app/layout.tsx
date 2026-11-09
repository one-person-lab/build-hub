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
  title: "BuildHub AI 软件构建资产平台",
  description:
    "BuildHub 是一个 AI 驱动的软件构建资产平台，汇集软件产品构建所需的知识、技能与创作资源，并通过 AI Agent 帮助用户发现、理解、组合和应用优质资产，让软件产品构建更加高效。",
  icons: {
    icon: [{ url: "/favicon.ico", type: "image/x-icon" }, "/icon.svg"],
    apple: "/assets/buildhub-mark-180.png",
  },
  openGraph: {
    siteName: "BuildHub",
    title: "BuildHub｜把会的东西，变成可用的资产。",
    description:
      "BuildHub 是一个 AI 驱动的软件构建资产平台，汇集软件产品构建所需的知识、技能与创作资源，并通过 AI Agent 帮助用户发现、理解、组合和应用优质资产，让软件产品构建更加高效。",
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
