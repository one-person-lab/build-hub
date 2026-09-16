import type { Metadata } from "next";
import RawPageView, { getRawTitle } from "@/components/RawPageView";

export const metadata: Metadata = {
  title: getRawTitle("vibehub-skill", "en") ?? "BuildHub Skill",
};

export default function EnVibehubSkillPage() {
  return <RawPageView pageKey="vibehub-skill" locale="en" />;
}
