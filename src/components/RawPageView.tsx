import pagesData from "@/data/pages.json";
import enPagesData from "@/data/en-pages.json";
import type { RawPageData } from "@/lib/types";

const PAGES = pagesData as unknown as Record<string, RawPageData>;
const EN_PAGES = enPagesData as unknown as Record<string, RawPageData>;

export type Locale = "zh" | "en";

export default function RawPageView({
  pageKey,
  locale = "zh",
}: {
  pageKey: string;
  locale?: Locale;
}) {
  const page = (locale === "en" ? EN_PAGES : PAGES)[pageKey];
  return (
    <main>
      <div
        className="vh-raw-page"
        dangerouslySetInnerHTML={{ __html: page?.mainHtml ?? "" }}
      />
    </main>
  );
}

export function getRawTitle(pageKey: string, locale: Locale = "zh"): string | undefined {
  return (locale === "en" ? EN_PAGES : PAGES)[pageKey]?.title;
}
