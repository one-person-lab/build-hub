import type { Metadata } from "next";
import ProductLibraryView from "@/components/ProductLibraryView";

export const metadata: Metadata = {
  title: "产品图鉴｜BuildHub · 优秀网站与 App 的收藏",
  description:
    "我们观察到的一些优秀产品：AI 工具、设计创意、效率工具、灵感网站。不写软文，只说它们好在哪、适合谁。",
  openGraph: {
    title: "产品图鉴｜BuildHub",
    description: "优秀网站与 App 的收藏，只说它们好在哪、适合谁。",
  },
};

export default function ProductsPage() {
  return <ProductLibraryView locale="zh" />;
}
