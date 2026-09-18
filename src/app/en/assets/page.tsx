import type { Metadata } from "next";
import AssetLibraryView from "@/components/AssetLibraryView";

export const metadata: Metadata = {
  title: "Asset Library｜BuildHub · Logo styles proven in the market",
  description:
    "Every logo style comes with real brand case studies and a copy-ready AI image prompt: why the style works, what brands it fits, and one prompt to generate in the same spirit.",
  openGraph: {
    title: "Asset Library｜BuildHub",
    description: "Market-proven logo styles with brand cases and ready-to-use prompts.",
  },
};

export default function AssetsEnPage() {
  return <AssetLibraryView locale="en" />;
}
