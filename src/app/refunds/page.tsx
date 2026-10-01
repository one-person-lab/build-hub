import type { Metadata } from "next";
import LegalDocView, { getLegalTitle } from "@/components/LegalDocView";

export const metadata: Metadata = { title: getLegalTitle("refunds") };

export default function RefundsPage() {
  return <LegalDocView docKey="refunds" />;
}
