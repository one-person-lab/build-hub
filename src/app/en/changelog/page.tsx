import type { Metadata } from "next";
import RawPageView, { getRawTitle } from "@/components/RawPageView";

export const metadata: Metadata = {
  title: getRawTitle("changelog", "en") ?? "Changelog",
};

export default function EnChangelogPage() {
  return <RawPageView pageKey="changelog" locale="en" />;
}
