import type { Metadata } from "next";
import PracticeView from "@/components/PracticeView";
import { getRawTitle } from "@/components/RawPageView";

export const metadata: Metadata = {
  title: getRawTitle("practice", "en") ?? "Term Practice",
};

export default function EnPracticePage() {
  return <PracticeView locale="en" />;
}
