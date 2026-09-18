import { notFound } from "next/navigation";
import type { Metadata } from "next";
import AssetDetailView, { type AssetStyle } from "@/components/AssetDetailView";
import assetsData from "@/data/assets.json";

type Category = { key: string; label: string; styles: AssetStyle[] };
type Lib = { title: string; subtitle: string; categories: Category[] };

const LIB = assetsData as unknown as Lib;

const byId = new Map<string, { style: AssetStyle; cat: Category }>();
for (const c of LIB.categories) for (const s of c.styles) byId.set(s.id, { style: s, cat: c });

export function generateStaticParams() {
  return LIB.categories.flatMap((c) => c.styles.map((s) => ({ id: s.id })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const hit = byId.get(id);
  if (!hit) return {};
  const { style, cat } = hit;
  return {
    title: `${style.name} ${cat.label}｜素材库 · BuildHub`,
    description: style.tagline,
    openGraph: {
      title: `${style.name} ${cat.label}｜素材库`,
      description: style.tagline,
    },
  };
}

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const hit = byId.get(id);
  if (!hit) notFound();
  const related = hit.cat.styles
    .filter((s) => s.id !== id)
    .map((s) => ({ id: s.id, name: s.name }));
  return (
    <AssetDetailView
      style={hit.style}
      locale="zh"
      backHref="/assets"
      related={related}
      kind={hit.cat.key === "app-icon-style" ? "app-icon" : "logo"}
    />
  );
}
