import type { Metadata } from "next";
import RawPageView, { getRawTitle } from "@/components/RawPageView";

export const metadata: Metadata = { title: getRawTitle("vibehub-skill") ?? "BuildHub Skill" };

export default function VibehubSkillPage() {
  return <RawPageView pageKey="vibehub-skill" />;
}
