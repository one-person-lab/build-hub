import type { Metadata } from "next";
import PromptLibraryView from "@/components/PromptLibraryView";

export const metadata: Metadata = {
  title: "Prompt Library｜BuildHub · Prompts for the whole vibe coding loop",
  description:
    "Prompts organized by the build loop: define the ask, generate code, fix errors, clean up, add features, ship it. Copy-ready, each with a breakdown of why it works.",
  openGraph: {
    title: "Prompt Library｜BuildHub",
    description:
      "Prompts for the whole vibe coding loop. One-click copy, plus why it works and where it bites.",
  },
};

export default function EnPromptsPage() {
  return <PromptLibraryView locale="en" />;
}
