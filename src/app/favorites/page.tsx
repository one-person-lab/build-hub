import type { Metadata } from "next";
import FavoritesView from "@/components/FavoritesView";

export const metadata: Metadata = {
  title: "我的收藏 · BuildHub",
  robots: { index: false, follow: false },
};

export default function FavoritesPage() {
  return <FavoritesView locale="zh" />;
}
