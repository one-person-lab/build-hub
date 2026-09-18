import type { Metadata } from "next";
import HomeView from "@/components/HomeView";

export const metadata: Metadata = {
  title: "BuildHub | Vibe Coding Terms",
  description:
    "Plain-language explanations of frontend, backend, product, testing, AI and Git terms used in Vibe Coding, each with a visual example.",
};

export default function EnHome() {
  return <HomeView locale="en" />;
}
