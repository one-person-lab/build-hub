import type { Metadata } from "next";
import ProPageView from "@/components/ProPageView";
import { packStats } from "@/lib/export-content";

const S = packStats("en");

export const metadata: Metadata = {
  title: "BuildHub PRO｜Offline pack & a SKILL.md for your agent",
  description: `${S.concepts} concepts, ${S.prompts} prompts, ${S.skills} skills, ${S.designRefs} design references, ${S.paths} paths and ${S.playbooks} playbooks in one Markdown offline pack, with a SKILL.md your agent reads first.`,
  openGraph: {
    title: "BuildHub PRO",
    description: "The site's content as one Markdown pack. Pay once, keep the whole thing.",
  },
};

export default function EnProPage() {
  return <ProPageView locale="en" />;
}
