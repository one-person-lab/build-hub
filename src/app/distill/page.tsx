import type { Metadata } from "next";
import Link from "next/link";
import data from "@/data/distill.json";
import "@/components/DistillView.css";

export const metadata: Metadata = {
  title: "动效｜BuildHub · 把顶级 App 的交互抽出来看",
  description:
    "把优秀 App 的交互动画逐个抽出来，用纯 CSS 循环 1:1 复刻成可点着玩的母题画廊：第一个对象是多邻国，11 段动效。",
  openGraph: {
    title: "动效｜BuildHub",
    description: "顶级 App 的交互动画，抽成可重播的纯 CSS 母题。",
  },
};

const UI = {
  eyebrow: "动效 · Motion",
  h1: "把顶级 App 的交互，抽出来单独看",
  sub: "一个 App 一页：它的交互动画被拆成若干母题，全部用纯 CSS 关键帧 1:1 循环复刻，可逐段重播。",
  motifs: "段母题",
  view: "查看动画详情 · 复制提示词给 AI →",
};

export default function DistillIndexPage() {
  const apps = data as {
    slug: string;
    name: string;
    en: string;
    motifs: number;
    tagline: string;
  }[];
  return (
    <main className="dst-main">
      <header className="dst-hero">
        <p className="dst-eyebrow">{UI.eyebrow}</p>
        <h1>{UI.h1}</h1>
        <p className="dst-sub">{UI.sub}</p>
      </header>
      <div className="dst-grid">
        {apps.map((a) => (
          <Link className="dst-app-card" href={`/distill/${a.slug}`} key={a.slug}>
            <div className="dst-app-head">
              <h2>
                {a.name}
                {a.en ? <span>{a.en}</span> : null}
              </h2>
              <em>
                {a.motifs} {UI.motifs}
              </em>
            </div>
            <p>{a.tagline}</p>
            <span className="dst-view">{UI.view}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
