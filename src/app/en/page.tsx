import type { Metadata } from "next";
import HomeView from "@/components/HomeView";

export const metadata: Metadata = {
  title: "BuildHub | AI-Powered Software Creation Asset Platform",
  description:
    "BuildHub holds concepts, UI references, stack picks, prompts, skills and build paths — every entry the full text, readable by you and ready for your agent to use.",
};

export default function EnHome() {
  return <HomeView locale="en" />;
}
