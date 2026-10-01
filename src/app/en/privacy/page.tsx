import type { Metadata } from "next";
import LegalDocView, { getLegalTitle } from "@/components/LegalDocView";

export const metadata: Metadata = {
  title: getLegalTitle("privacy", "en"),
};

export default function EnPrivacyPage() {
  return <LegalDocView docKey="privacy" locale="en" />;
}
