import type { Metadata } from "next";
import RawPageView, { getRawTitle } from "@/components/RawPageView";

export const metadata: Metadata = {
  title: getRawTitle("anti-ai-flavor", "en") ?? "Avoid AI Slop",
};

export default function EnAntiAiFlavorPage() {
  return <RawPageView pageKey="anti-ai-flavor" locale="en" />;
}
