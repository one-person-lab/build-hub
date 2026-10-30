import type { Metadata } from "next";
import ForksView from "@/components/ForksView";
import { playbookList } from "@/lib/playbooks";

export const metadata: Metadata = {
  title: "我的复刻｜BuildHub",
  description:
    "你复刻下来的档案都在这里：走到第几步、下次从哪一步接上、哪一步卡住了，全部记着。",
  openGraph: {
    title: "我的复刻｜BuildHub",
    description: "接着上次那一步往下走，不用从头再读一遍。",
  },
};

export default function ForksPage() {
  return <ForksView catalog={playbookList()} />;
}
