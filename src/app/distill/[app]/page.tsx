import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import data from "@/data/distill.json";
import DuolingoMotionGallery from "@/components/DuolingoMotionGallery";
import TideMotionGallery from "@/components/TideMotionGallery";
import FinchMotionGallery from "@/components/FinchMotionGallery";
import ErlyMotionGallery from "@/components/ErlyMotionGallery";
import "@/components/DistillView.css";

type App = {
  slug: string;
  name: string;
  en: string;
  motifs: number;
  tagline: string;
  source: string;
  styleHref: string;
};

const apps = data as App[];

export function generateStaticParams() {
  return apps.map((a) => ({ app: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ app: string }> }): Promise<Metadata> {
  const { app } = await params;
  const a = apps.find((x) => x.slug === app);
  if (!a) return { title: "动效｜BuildHub" };
  return {
    title: `${a.name} 动效｜BuildHub`,
    description: a.tagline,
  };
}

const GALLERIES: Record<string, React.ReactNode> = {
  duolingo: <DuolingoMotionGallery locale="zh" />,
  tide: <TideMotionGallery locale="zh" />,
  finch: <FinchMotionGallery locale="zh" />,
  erly: <ErlyMotionGallery locale="zh" />,
};

export default async function DistillAppPage({ params }: { params: Promise<{ app: string }> }) {
  const { app } = await params;
  const a = apps.find((x) => x.slug === app);
  const gallery = app ? GALLERIES[app] : undefined;
  if (!a || !gallery) return notFound();
  return (
    <main className="dst-main">
      <header className="dst-hero">
        <p className="dst-eyebrow">
          <Link href="/distill">动效</Link> · {a.en || a.name}
        </p>
        <h1>{a.name}的 {a.motifs} 段交互动效</h1>
        <p className="dst-sub">{a.tagline}</p>
        <p className="dst-links">
          <a href={a.source} target="_blank" rel="noreferrer">参考来源</a>
          {a.styleHref && (
            <Link href={a.styleHref}>设计风格条目：{a.name}式</Link>
          )}
        </p>
      </header>
      {gallery}
    </main>
  );
}
