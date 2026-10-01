import type { Metadata } from "next";
import LegalDocView, { getLegalTitle } from "@/components/LegalDocView";

export const metadata: Metadata = { title: getLegalTitle("terms") };

export default function TermsPage() {
  return <LegalDocView docKey="terms" />;
}
