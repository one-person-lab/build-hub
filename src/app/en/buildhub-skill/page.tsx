import type { Metadata } from "next";
import BuildHubSkillView from "@/components/BuildHubSkillView";

export const metadata: Metadata = {
  title: "BuildHub Skill | Accurate frontend terminology for your agent",
  description:
    "A terminology skill for Claude Code, Cursor and any agent: rewrites vague descriptions into precise requirements, surfaces relevant terms, and links to BuildHub entries with live demos. One prompt to install.",
};

export default function EnBuildHubSkillPage() {
  return <BuildHubSkillView locale="en" />;
}
