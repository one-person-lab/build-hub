import type { Metadata } from "next";
import LegalDocView, { getLegalTitle } from "@/components/LegalDocView";

export const metadata: Metadata = {
  title: getLegalTitle("refunds", "en"),
};

export default function EnRefundsPage() {
  return <LegalDocView docKey="refunds" locale="en" />;
}
