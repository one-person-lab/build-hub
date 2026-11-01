import type { Metadata } from "next";
import BuildHubSkillView from "@/components/BuildHubSkillView";

export const metadata: Metadata = {
  title: "BuildHub Skill | Give your agent the right term",
  description:
    "A terminology skill for Claude Code, Cursor and any agent: it turns vague wording into a request you can send, names the term you described, and links to the BuildHub entry page.",
};

export default function EnBuildHubSkillPage() {
  return <BuildHubSkillView locale="en" />;
}
