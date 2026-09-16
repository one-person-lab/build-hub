import type { Metadata } from "next";
import PracticeView from "@/components/PracticeView";
import { getRawTitle } from "@/components/RawPageView";

export const metadata: Metadata = { title: getRawTitle("practice") ?? "术语练习" };

export default function PracticePage() {
  return <PracticeView />;
}
