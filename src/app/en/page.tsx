import type { Metadata } from "next";
import HomeView from "@/components/HomeView";

export const metadata: Metadata = {
  title: "BuildHub | AI-Powered Software Creation Asset Platform",
  description:
    "BuildHub is an AI-powered software creation asset platform. It gathers the knowledge, skills and creative resources a software build needs, and uses AI agents to help you find, understand, combine and apply them — so building software products takes less effort.",
};

export default function EnHome() {
  return <HomeView locale="en" />;
}
