import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PracticeDetail } from "@/components/EngineeringView";
import { ENGINEERING_PRACTICES, getPractice } from "@/data/engineering-practices";

export function generateStaticParams() {
  return ENGINEERING_PRACTICES.map((p) => ({ slug: p.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = getPractice(slug);
  if (!p) return {};
  return {
    title: `${p.name} · 工程实践｜BuildHub`,
    description: p.tagline,
    openGraph: { title: `${p.name} · 工程实践｜BuildHub`, description: p.tagline },
  };
}

export default async function PracticePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = getPractice(slug);
  if (!p) notFound();
  return <PracticeDetail practice={p} />;
}
