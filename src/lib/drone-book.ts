import bookData from "@/data/drone-book.json";

export const DRONE_BOOK_ID = "drone-copilot-handbook";

export const BOOKS: Record<string, Book> = {
  [DRONE_BOOK_ID]: bookData as unknown as Book,
};

export type FactTag = "known" | "designed" | "verified";

export type Fact = { tag: FactTag; text: string };

export type SectionKey =
  | "problem"
  | "position"
  | "design"
  | "flow"
  | "choices"
  | "code"
  | "failure"
  | "test"
  | "interview";

export type BookFigure = {
  /** 挂在哪一节正文之后 */
  at: SectionKey;
  src: string;
  title: string;
  note?: string;
};

export type Chapter = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  minutes: number;
  facts: Fact[];
  sections: Partial<Record<SectionKey, string>>;
  figures?: BookFigure[];
};

export type Volume = {
  id: string;
  n: string;
  title: string;
  intro: string;
  chapters: Chapter[];
};

export type ReadingPath = {
  name: string;
  note: string;
  chapters: string[];
};

export type Book = {
  title: string;
  subtitle: string;
  oneLiner: string;
  intro: string;
  forWhom: string;
  paths: ReadingPath[];
  volumes: Volume[];
};

export const SECTION_ORDER: { key: SectionKey; n: string; title: string }[] = [
  { key: "problem", n: "1", title: "要解决的问题" },
  { key: "position", n: "2", title: "在整个系统中的位置" },
  { key: "design", n: "3", title: "总体设计" },
  { key: "flow", n: "4", title: "完整执行链路" },
  { key: "choices", n: "5", title: "技术选型与原理" },
  { key: "code", n: "6", title: "关键数据结构与代码" },
  { key: "failure", n: "7", title: "异常、安全与边界条件" },
  { key: "test", n: "8", title: "测试与验证" },
  { key: "interview", n: "9", title: "面试表达与追问" },
];

export const FACT_LABEL: Record<FactTag, string> = {
  known: "已知事实",
  designed: "目标设计",
  verified: "验证结果",
};

export function flatChapters(book: Book): Chapter[] {
  return book.volumes.flatMap((v) => v.chapters);
}

export function volumeOf(book: Book, chapter: Chapter): Volume | undefined {
  return book.volumes.find((v) => v.chapters.some((c) => c.id === chapter.id));
}

export function adjacent(book: Book, chapter: Chapter) {
  const list = flatChapters(book);
  const i = list.findIndex((c) => c.id === chapter.id);
  return { prev: i > 0 ? list[i - 1] : undefined, next: i < list.length - 1 ? list[i + 1] : undefined };
}
