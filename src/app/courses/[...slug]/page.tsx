import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CourseReaderView, { CourseListMain } from "@/components/CourseView";
import coursesData from "@/data/courses.json";

type Chapter = { title: string; kind: "reader"; readerHtml: string };
type ListPage = { title: string; kind: "list"; mainHtml: string };

const DATA = coursesData as unknown as {
  index: ListPage;
  [course: string]: ListPage | { chapters?: unknown } | Record<string, Chapter>;
};
const CHAPTERS = (coursesData as unknown as { chapters: Record<string, Chapter> })
  .chapters;

const LIST_KEYS = ["product-website", "git-workflow"];

function cleanTitle(t?: string): string {
  return (t ?? "").split("｜")[0].trim();
}

export function generateStaticParams() {
  const params: { slug: string[] }[] = [];
  for (const key of LIST_KEYS) params.push({ slug: [key] });
  for (const key of Object.keys(CHAPTERS)) {
    params.push({ slug: key.split("/") });
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const key = slug.join("/");
  const chapter = CHAPTERS[key];
  if (chapter) return { title: cleanTitle(chapter.title) };
  const list = (coursesData as unknown as Record<string, ListPage>)[slug[0]];
  if (list && LIST_KEYS.includes(slug[0])) return { title: cleanTitle(list.title) };
  return { title: "课程" };
}

export default async function CoursePage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const key = slug.join("/");

  if (CHAPTERS[key]) {
    return <CourseReaderView chapterKey={key} />;
  }
  if (slug.length === 1 && LIST_KEYS.includes(slug[0])) {
    return <CourseListMain pageKey={slug[0]} />;
  }
  notFound();
}

void DATA;
