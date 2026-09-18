import type { Metadata } from "next";
import SkillLibraryView from "@/components/SkillLibraryView";

export const metadata: Metadata = {
  title: "Skill Library｜BuildHub · Popular skills, by use case",
  description:
    "A curated set of the most popular skills right now — video, motion, self-media, dev & design. Tap a card to jump to the author's repo or site.",
  openGraph: {
    title: "Skill Library｜BuildHub",
    description:
      "Popular skills grouped by use case. Tap a card to visit the author's repo or site.",
  },
};

export default function EnSkillsPage() {
  return <SkillLibraryView locale="en" />;
}
