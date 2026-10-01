import type { Metadata } from "next";
import LegalDocView, { getLegalTitle } from "@/components/LegalDocView";

export const metadata: Metadata = { title: getLegalTitle("privacy") };

export default function PrivacyPage() {
  return <LegalDocView docKey="privacy" />;
}
