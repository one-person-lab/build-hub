import type { Metadata } from "next";
import CatalogView from "@/components/CatalogView";

export const metadata: Metadata = {
  title: "Motion｜BuildHub · Four playable interaction demos",
  description:
    "Four playable interaction demos: card carousel, letter intro, dark onboarding and bounce cards — all built with native CSS/JS, ready to drag, tap through and retune live.",
  openGraph: {
    title: "Motion｜BuildHub",
    description: "Four playable interaction demos, open any card and play.",
  },
};

export default function EnDistillIndexPage() {
  return <CatalogView catalogKey="motion" locale="en" />;
}
