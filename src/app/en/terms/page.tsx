import type { Metadata } from "next";
import LegalDocView, { getLegalTitle } from "@/components/LegalDocView";

export const metadata: Metadata = {
  title: getLegalTitle("terms", "en"),
};

export default function EnTermsPage() {
  return <LegalDocView docKey="terms" locale="en" />;
}
