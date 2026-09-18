export type TermSection = {
  title: string;
  html: string;
  cards?: { headHtml: string; headText: string; bodyHtml: string; bodyText?: string }[];
  parts?: { idx: string; name: string; en: string; desc: string }[];
  variants?: { name: string; en: string; demoHtml: string; when: string }[];
  scenes?: { cap: string; shotHtml: string }[];
  references?: { title: string; source: string; href: string }[];
  stageHtml?: string;
};

export type Platform = "web" | "ios" | "cross";

export type Term = {
  slug: string;
  name: string;
  en: string;
  quoteLabel: string;
  quote: string;
  summaryLead: string;
  summaryRest: string;
  aliases: string[];
  platform?: Platform;
  demoHtml: string;
  sections: TermSection[];
  prev: string | null;
  next: string | null;
};

export type CatalogTerm = {
  slug: string;
  name: string;
  en: string;
  tagline: string;
  platform?: Platform;
  demoHtml: string;
  demoClass: string;
};

export type Catalog = {
  key: string;
  href: string;
  title: string;
  tabs: { label: string; count: number; active: boolean }[];
  sidebar: string[];
  groups: { id: string; title: string; count: number; terms: CatalogTerm[] }[];
};

export type RawPageData = { title: string; mainHtml: string };
