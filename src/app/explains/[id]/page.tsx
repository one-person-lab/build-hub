import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ExplainerView, { type Explainer } from "@/components/ExplainerView";
import BookHub from "@/components/BookHub";
import explainersData from "@/data/explainers.json";
import { BOOKS } from "@/lib/drone-book";

const LIB = explainersData as unknown as Record<string, Explainer>;

export function generateStaticParams() {
  return [...Object.keys(LIB), ...Object.keys(BOOKS)].map((id) => ({ id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const book = BOOKS[id];
  if (book) {
    return {
      title: `${book.title}${book.subtitle}｜专题 · BuildHub`,
      description: book.oneLiner,
      openGraph: { title: `${book.title}${book.subtitle}`, description: book.oneLiner },
    };
  }
  const e = LIB[id];
  if (!e) return {};
  return {
    title: `${e.title}｜专题 · BuildHub`,
    description: e.oneLiner,
    openGraph: { title: e.title, description: e.oneLiner },
  };
}

export default async function ExplainerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const book = BOOKS[id];
  if (book) return <BookHub book={book} bookId={id} />;
  const e = LIB[id];
  if (!e) notFound();
  return <ExplainerView data={e} />;
}
