import type { Metadata } from "next";
import FavoritesView from "@/components/FavoritesView";
import { PLANS } from "@/lib/plans";

export const metadata: Metadata = {
  title: "我的收藏 · BuildHub",
  robots: { index: false, follow: false },
};

export default function FavoritesPage() {
  return (
    <FavoritesView
      locale="zh"
      plans={PLANS.map((p) => ({ key: p.key, name: p.name, money: p.money, days: p.days }))}
    />
  );
}
