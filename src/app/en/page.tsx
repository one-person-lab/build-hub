import type { Metadata } from "next";
import CatalogView from "@/components/CatalogView";

export const metadata: Metadata = {
  title: "BuildHub | Vibe Coding Terms",
  description:
    "Plain-language explanations of frontend, backend, product, testing, AI and Git terms used in Vibe Coding, each with a visual example.",
};

export default function EnHome() {
  return <CatalogView catalogKey="frontend" locale="en" />;
}
