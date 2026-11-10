import type { Metadata } from "next";
import CatalogView from "@/components/CatalogView";

export const metadata: Metadata = {
  title: "Motion｜BuildHub · 161 carousels & motion components",
  description:
    "161 carousel and motion components: 157 carousels curated from 21st.dev that play their original demo videos on the cards, plus 4 you can operate in place — grouped into 9 interaction types. Open any card for the original link and a copyable prompt.",
  openGraph: {
    title: "Motion｜BuildHub",
    description: "161 carousels and motion components, grouped by interaction type.",
  },
};

export default function EnDistillIndexPage() {
  return <CatalogView catalogKey="motion" locale="en" />;
}
