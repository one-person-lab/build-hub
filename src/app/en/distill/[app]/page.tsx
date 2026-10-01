import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import data from "@/data/en-distill.json";
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
  if (!a) return { title: "Motion｜BuildHub" };
  return {
    title: `${a.name} motion｜BuildHub`,
    description: a.tagline,
  };
}

const GALLERIES: Record<string, React.ReactNode> = {
  duolingo: <DuolingoMotionGallery locale="en" />,
  tide: <TideMotionGallery locale="en" />,
  finch: <FinchMotionGallery locale="en" />,
  erly: <ErlyMotionGallery locale="en" />,
};

export default async function EnDistillAppPage({ params }: { params: Promise<{ app: string }> }) {
  const { app } = await params;
  const a = apps.find((x) => x.slug === app);
  const gallery = app ? GALLERIES[app] : undefined;
  if (!a || !gallery) return notFound();
  return (
    <main className="dst-main">
      <header className="dst-hero">
        <p className="dst-eyebrow">
          <Link href="/en/distill">Motion</Link> · {a.name}
        </p>
        <h1>
          {a.name}&apos;s {a.motifs} interaction loops
        </h1>
        <p className="dst-sub">{a.tagline}</p>
        <p className="dst-links">
          <a href={a.source} target="_blank" rel="noreferrer">
            Reference
          </a>
          {a.styleHref && (
            <Link href={a.styleHref}>Style entry: {a.name}</Link>
          )}
        </p>
      </header>
      {gallery}
    </main>
  );
}
