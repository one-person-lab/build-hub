import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PlaybookView, { type Playbook } from "@/components/PlaybookView";
import GuideView from "@/components/GuideView";
import { isGuide, type Guide, type LibEntry } from "@/lib/playbook-types";
import playbooksData from "@/data/playbooks.json";

const LIB = playbooksData as unknown as Record<string, LibEntry>;

export function generateStaticParams() {
  return Object.keys(LIB).map((id) => ({ id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const p = LIB[id];
  if (!p) return {};
  const kindLabel = isGuide(p) ? "实践指南" : "自查手册";
  return {
    title: `${p.title}｜${kindLabel} · BuildHub`,
    description: p.summary,
    openGraph: { title: p.title, description: p.summary },
  };
}

export default async function PlaybookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const p = LIB[id];
  if (!p) notFound();
  return isGuide(p) ? (
    <GuideView data={p as Guide} />
  ) : (
    <PlaybookView data={p as Playbook} slug={id} />
  );
}
