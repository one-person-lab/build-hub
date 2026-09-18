import type { Metadata } from "next";
import SkillLibraryView from "@/components/SkillLibraryView";

export const metadata: Metadata = {
  title: "Skill Library｜BuildHub · Curated Agent Skills",
  description:
    "Mainstream Agent Skills that earn their place — meta, workflow, design, documents, browser automation. Every entry ships a one-click install command.",
  openGraph: {
    title: "Skill Library｜BuildHub",
    description:
      "Curated Agent Skills with verified install commands, grouped by purpose.",
  },
};

export default function EnSkillsPage() {
  return <SkillLibraryView locale="en" />;
}
