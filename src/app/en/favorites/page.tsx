import type { Metadata } from "next";
import FavoritesView from "@/components/FavoritesView";
import { PLANS } from "@/lib/plans";

export const metadata: Metadata = {
  title: "My favorites · BuildHub",
  robots: { index: false, follow: false },
};

export default function EnFavoritesPage() {
  return (
    <FavoritesView
      locale="en"
      plans={PLANS.map((p) => ({ key: p.key, name: p.name, money: p.money, days: p.days }))}
    />
  );
}
