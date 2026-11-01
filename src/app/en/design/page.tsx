import type { Metadata } from "next";
import CatalogView from "@/components/CatalogView";

export const metadata: Metadata = {
  title: "Design｜BuildHub · UI & App Icon Style Library",
  description:
    "61 design references: market-proven UI styles with live samples, 15 navigation patterns and 6 auth-page blocks with full-size previews, 8 app-icon styles with real cases and copy-ready AI image prompts, plus mainstream icon libraries.",
  openGraph: {
    title: "Design｜BuildHub",
    description:
      "UI styles, navigation patterns, auth pages, app icon styles and icon libraries in one place.",
  },
};

export default function EnDesignPage() {
  return <CatalogView catalogKey="design" locale="en" />;
}
