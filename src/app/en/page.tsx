import type { Metadata } from "next";
import HomeView from "@/components/HomeView";

export const metadata: Metadata = {
  title: "BuildHub | Ship a product with AI — no coding required",
  description:
    "An entry point for non-engineers: Vibe Coding concepts explained in plain words, each with a visual example, plus curated skills, hands-on product reviews, ready-to-use prompts and step-by-step playbooks.",
};

export default function EnHome() {
  return <HomeView locale="en" />;
}
