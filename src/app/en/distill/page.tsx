import type { Metadata } from "next";
import Link from "next/link";
import data from "@/data/en-distill.json";
import "@/components/DistillView.css";

export const metadata: Metadata = {
  title: "Motion｜BuildHub · Top apps' interactions, extracted",
  description:
    "Every interaction animation of an excellent app, pulled out and rebuilt 1:1 as replayable pure-CSS loops. First subject: Duolingo, 11 motifs.",
  openGraph: {
    title: "Motion｜BuildHub",
    description: "Top apps' interactions, extracted into replayable pure-CSS loops.",
  },
};

const UI = {
  eyebrow: "Motion",
  h1: "Top apps' interactions, pulled out and looked at on their own",
  sub: "One app per page: its motion is broken into motifs, each rebuilt 1:1 as a pure-CSS keyframe loop you can replay.",
  motifs: "motifs",
  view: "Open animations · copy prompts for AI →",
};

export default function EnDistillIndexPage() {
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
          <Link className="dst-app-card" href={`/en/distill/${a.slug}`} key={a.slug}>
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
