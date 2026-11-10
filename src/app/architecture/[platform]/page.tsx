import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlatformDetail } from "@/components/ArchitectureView";
import { ARCHITECTURE_PLATFORMS } from "@/data/architecture-diagrams";

export function generateStaticParams() {
  return ARCHITECTURE_PLATFORMS.map((p) => ({ platform: p.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ platform: string }>;
}): Promise<Metadata> {
  const { platform: id } = await params;
  const p = ARCHITECTURE_PLATFORMS.find((x) => x.id === id);
  if (!p) return {};
  return {
    title: `${p.name} · 架构｜BuildHub`,
    description: p.tagline,
    openGraph: { title: `${p.name} · 架构｜BuildHub`, description: p.tagline },
  };
}

export default async function PlatformPage({
  params,
}: {
  params: Promise<{ platform: string }>;
}) {
  const { platform: id } = await params;
  const p = ARCHITECTURE_PLATFORMS.find((x) => x.id === id);
  if (!p) notFound();
  return <PlatformDetail platform={p} />;
}