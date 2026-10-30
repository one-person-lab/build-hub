import { notFound } from "next/navigation";
import type { Metadata } from "next";
import BookChapter from "@/components/BookChapter";
import { BOOKS, flatChapters, volumeOf } from "@/lib/drone-book";

export function generateStaticParams() {
  return Object.entries(BOOKS).flatMap(([id, book]) =>
    flatChapters(book).map((chapter) => ({ id, chapter: chapter.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; chapter: string }>;
}): Promise<Metadata> {
  const { id, chapter: slug } = await params;
  const book = BOOKS[id];
  if (!book) return {};
  const chapter = flatChapters(book).find((c) => c.slug === slug);
  if (!chapter) return {};
  return {
    title: `第 ${chapter.id} 章 ${chapter.title}｜${book.title}${book.subtitle} · BuildHub`,
    description: chapter.summary,
    openGraph: {
      title: `第 ${chapter.id} 章 ${chapter.title}｜${book.title}`,
      description: chapter.summary,
    },
  };
}

export default async function BookChapterPage({
  params,
}: {
  params: Promise<{ id: string; chapter: string }>;
}) {
  const { id, chapter: slug } = await params;
  const book = BOOKS[id];
  if (!book) notFound();
  const chapter = flatChapters(book).find((c) => c.slug === slug);
  if (!chapter) notFound();
  return (
    <BookChapter
      book={book}
      bookId={id}
      chapter={chapter}
      volume={volumeOf(book, chapter)}
    />
  );
}
