import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PlaybookView, { type Playbook } from "@/components/PlaybookView";
import playbooksData from "@/data/playbooks.json";

const LIB = playbooksData as unknown as Record<string, Playbook>;

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
  return {
    title: `${p.title}｜操作手册 · BuildHub`,
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
  return <PlaybookView data={p} slug={id} />;
}
