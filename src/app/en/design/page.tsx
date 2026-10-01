import type { Metadata } from "next";
import CatalogView from "@/components/CatalogView";

export const metadata: Metadata = {
  title: "Design｜BuildHub · UI & App Icon Style Library",
  description:
    "46 design references: 35 market-proven UI styles with live samples, 8 app-icon styles with real cases and copy-ready AI image prompts, plus mainstream icon libraries and 3 playable motion demos.",
  openGraph: {
    title: "Design｜BuildHub",
    description: "UI styles, app icon styles and icon libraries in one place.",
  },
};

export default function EnDesignPage() {
  return <CatalogView catalogKey="design" locale="en" />;
}
