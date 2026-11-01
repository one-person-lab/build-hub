import type { Metadata } from "next";
import ProPageView from "@/components/ProPageView";

export const metadata: Metadata = {
  title: "BuildHub PRO｜Asset pack & Agent Kit",
  description:
    "336 concepts, 19 prompts, 25 skills, 40 design references, 4 paths and 3 playbooks packed into one Markdown asset pack you can hand straight to an AI, plus an Agent Kit.",
  openGraph: {
    title: "BuildHub PRO",
    description:
      "Turn what you learn here into assets you keep. Asset pack + Agent Kit, one purchase.",
  },
};

export default function EnProPage() {
  return <ProPageView locale="en" />;
}
