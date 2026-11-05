import zhCatalogs from "@/data/catalogs.json";
import enCatalogs from "@/data/en-catalogs.json";
import zhProducts from "@/data/products.json";
import enProducts from "@/data/en-products.json";
import zhPrompts from "@/data/prompts.json";
import enPrompts from "@/data/en-prompts.json";
import zhSkills from "@/data/skills.json";
import enSkills from "@/data/en-skills.json";
import zhTerms from "@/data/terms.json";
import enTerms from "@/data/en-terms.json";
import playbooks from "@/data/playbooks.json";
import pathsData from "@/data/paths.json";

type Locale = "zh" | "en";

type RawTerm = {
  slug: string;
  name: string;
  en?: string;
  tagline?: string;
  quote?: string;
  demoHtml?: string;
  demoClass?: string;
};
type RawCatalog = {
  key: string;
  groups: { id?: string; category?: string; terms: RawTerm[] }[];
};
type RawProduct = {
  categories: { key: string; label: string; products: unknown[] }[];
};
type RawPrompt = {
  categories: { key: string; label: string; prompts?: unknown[]; items?: unknown[] }[];
};

const ZONE_LABELS: Record<Locale, Record<string, string>> = {
  zh: {
    frontend: "前端",
    backend: "后端",
    product: "产品",
    testing: "测试",
    technology: "技术栈",
    ai: "AI",
    git: "Git",
    design: "设计",
    motion: "动效",
    stack: "选型",
  },
  en: {
    frontend: "Frontend",
    backend: "Backend",
    product: "Product",
    testing: "Testing",
    technology: "Stack",
    ai: "AI",
    git: "Git",
    design: "Design",
    motion: "Motion",
    stack: "Stack",
  },
};

const SHOWCASE_PICKS = [
  { zone: "frontend", slug: "component" },
  { zone: "backend", slug: "http" },
  { zone: "product", slug: "user-flow" },
  { zone: "testing", slug: "test-case" },
  { zone: "technology", slug: "terminal" },
  { zone: "ai", slug: "vibe-coding" },
  { zone: "git", slug: "branch" },
  { zone: "design", slug: "style-journal-cards" },
];

const STYLE_PICKS = [
  "style-journal-cards",
  "style-paywall",
  "style-minimal",
  "style-apple",
  "style-notion",
  "style-bento",
  "style-brutalism",
  "style-glass",
];

const HERO_SHOTS = [
  "style-apple",
  "style-notion",
  "style-journal-cards",
  "style-brutalism",
  "style-glass",
];

const QUOTE_PICKS = [
  "frontend",
  "deployment",
  "token",
  "terminal",
  "https",
  "context-window",
  "data-validation",
  "react",
  "ai-agent",
];

function uniqueTerms(catalogs: RawCatalog[]): RawTerm[] {
  const seen = new Set<string>();
  const out: RawTerm[] = [];
  for (const c of catalogs) {
    for (const g of c.groups) {
      for (const t of g.terms ?? []) {
        if (seen.has(t.slug)) continue;
        seen.add(t.slug);
        out.push(t);
      }
    }
  }
  return out;
}

function buildLocale(locale: Locale) {
  const catalogs = (locale === "en" ? enCatalogs : zhCatalogs) as unknown as RawCatalog[];
  const labels = ZONE_LABELS[locale];
  const base = locale === "en" ? "/en" : "";
  const terms = uniqueTerms(catalogs);
  const termBySlug = new Map(terms.map((t) => [t.slug, t]));
  const zoneBySlug = new Map<string, string>();
  for (const c of catalogs) {
    for (const g of c.groups) {
      for (const t of g.terms ?? []) zoneBySlug.set(t.slug, c.key);
    }
  }
  const allTerms = terms;

  const designTerms = catalogs
    .find((c) => c.key === "design")
    ?.groups.filter((g) => g.category === "web-style")
    .flatMap((g) => g.terms) ?? [];

  const products = (locale === "en" ? enProducts : zhProducts) as unknown as RawProduct;
  const prompts = (locale === "en" ? enPrompts : zhPrompts) as unknown as RawPrompt;
  const skills = (locale === "en" ? enSkills : zhSkills) as unknown as {
    categories: { key: string; label: string; skills?: unknown[] }[];
  };

  const counts = {
    concepts: allTerms.length,
    styles: designTerms.length,
    stack:
      catalogs.find((c) => c.key === "stack")?.groups.flatMap((g) => g.terms).length ??
      catalogs.find((c) => c.key === "technology")?.groups.flatMap((g) => g.terms).length ??
      0,
    prompts: prompts.categories.reduce(
      (n, c) => n + (c.prompts?.length ?? c.items?.length ?? 0),
      0
    ),
    skills: skills.categories.reduce((n, c) => n + (c.skills?.length ?? 0), 0),
    products: products.categories.reduce((n, c) => n + c.products.length, 0),
    paths: pathsData.paths.length,
    playbooks: Object.keys(playbooks).length,
    motion: catalogs.find((c) => c.key === "motion")?.groups.flatMap((g) => g.terms).length ?? 0,
    dictZh: zhTerms.length,
    dictEn: enTerms.length,
  };

  const toCard = (t: RawTerm, zone: string) => ({
    slug: t.slug,
    name: t.name,
    en: t.en ?? "",
    tagline: t.tagline ?? "",
    demoHtml: t.demoHtml ?? "",
    demoClass: t.demoClass ?? "",
    zoneLabel: labels[zone] ?? zone,
    count: catalogs.find((c) => c.key === zone)?.groups.flatMap((g) => g.terms).length ?? 0,
    href: `${base}/${t.slug}`,
  });

  const showcase = SHOWCASE_PICKS.map(({ zone, slug }) => {
    const t = termBySlug.get(slug) ?? catalogs.find((c) => c.key === zone)?.groups[0]?.terms[0];
    return t ? toCard(t, zone) : null;
  }).filter((x): x is NonNullable<typeof x> => Boolean(x));

  const styles = STYLE_PICKS.map((slug) => {
    const t = designTerms.find((x) => x.slug === slug);
    return t ? toCard(t, "design") : null;
  }).filter((x): x is NonNullable<typeof x> => Boolean(x));

  const heroShots = HERO_SHOTS.map((slug) => {
    const t = designTerms.find((x) => x.slug === slug);
    return t ? toCard(t, "design") : null;
  }).filter((x): x is NonNullable<typeof x> => Boolean(x));

  const fullTerms = (locale === "en" ? enTerms : zhTerms) as unknown as RawTerm[];
  const fullBySlug = new Map(fullTerms.map((t) => [t.slug, t]));
  const quotes = QUOTE_PICKS.map((slug) => {
    const t = fullBySlug.get(slug);
    const zone = zoneBySlug.get(slug) ?? "frontend";
    if (!t?.quote) return null;
    return {
      quote: t.quote,
      name: t.name,
      en: t.en ?? "",
      zoneLabel: labels[zone] ?? zone,
      href: `${base}/${slug}`,
      initial: (labels[zone] ?? zone).slice(0, 1),
    };
  }).filter((x): x is NonNullable<typeof x> => Boolean(x));

  const zoneChips = catalogs
    .filter((c) => labels[c.key])
    .map((c) => ({
      key: c.key,
      label: labels[c.key],
      count: c.groups.flatMap((g) => g.terms).length,
    }));

  return { counts, showcase, styles, heroShots, quotes, zoneChips, labels, base };
}

const CACHE = new Map<Locale, ReturnType<typeof buildLocale>>();

export function getHomeData(locale: Locale) {
  const cached = CACHE.get(locale);
  if (cached) return cached;
  const data = buildLocale(locale);
  CACHE.set(locale, data);
  return data;
}
