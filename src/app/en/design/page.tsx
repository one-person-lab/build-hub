import type { Metadata } from "next";
import CatalogView from "@/components/CatalogView";
import { designCounts } from "@/lib/export-content";

const D = designCounts("en");

export const metadata: Metadata = {
  title: "Design｜BuildHub · UI & App Icon Style Library",
  description: `${D.webStyles} UI styles, ${D.navStyles} navigation patterns, ${D.authBlocks} auth pages and ${D.footers} footer layouts — open any one to see the real layout. Plus ${D.iconStyles} app-icon styles with real cases and copy-ready AI image prompts.`,
  openGraph: {
    title: "Design｜BuildHub",
    description: "UI styles, navigation patterns, auth pages, footers and app icons — each with a screen you can open.",
  },
};

export default function EnDesignPage() {
  return <CatalogView catalogKey="design" locale="en" />;
}
