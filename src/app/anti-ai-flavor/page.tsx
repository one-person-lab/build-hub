import type { Metadata } from "next";
import RawPageView, { getRawTitle } from "@/components/RawPageView";

export const metadata: Metadata = { title: getRawTitle("anti-ai-flavor") ?? "防止 AI 味儿" };

export default function AntiAiFlavorPage() {
  return <RawPageView pageKey="anti-ai-flavor" />;
}
