import type { Metadata } from "next";
import FavoritesView from "@/components/FavoritesView";

export const metadata: Metadata = {
  title: "My favorites · BuildHub",
  robots: { index: false, follow: false },
};

export default function EnFavoritesPage() {
  return <FavoritesView locale="en" />;
}
