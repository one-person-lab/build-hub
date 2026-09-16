import { notFound } from "next/navigation";
import type { Metadata } from "next";
import TermDetail from "@/components/TermDetail";
import termsData from "@/data/terms.json";
import type { Term } from "@/lib/types";

const TERMS = termsData as unknown as Term[];
const bySlug = new Map(TERMS.map((t) => [t.slug, t]));

export function generateStaticParams() {
  return TERMS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const term = bySlug.get(slug);
  if (!term) return {};
  return {
    title: `${term.name}${term.en ? `（${term.en}）` : ""}是什么｜BuildHub`,
    description: term.summaryLead || term.quote,
  };
}

export default async function TermPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const term = bySlug.get(slug);
  if (!term) notFound();
  return <TermDetail term={term} />;
}
