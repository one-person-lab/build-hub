import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PathDetail } from "@/components/PathsView";
import { allPaths, pathById } from "@/lib/paths";

export function generateStaticParams() {
  return allPaths().map((p) => ({ id: p.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const path = pathById(id);
  if (!path) return {};
  return {
    title: `${path.name}｜路径 · BuildHub`,
    description: `${path.tagline} 共 ${path.steps.length} 步，每一步都写明完成标志。`,
    openGraph: {
      title: `${path.name}｜BuildHub 路径`,
      description: path.tagline,
    },
  };
}

export default async function PathPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const path = pathById(id);
  if (!path) notFound();
  return <PathDetail path={path} />;
}
