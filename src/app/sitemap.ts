import type { MetadataRoute } from "next";
import catalogsData from "@/data/catalogs.json";
import enCatalogsData from "@/data/en-catalogs.json";
import termsData from "@/data/terms.json";
import enTermsData from "@/data/en-terms.json";
import productsData from "@/data/products.json";
import enProductsData from "@/data/en-products.json";
import skillsData from "@/data/skills.json";
import enSkillsData from "@/data/en-skills.json";
import assetsData from "@/data/assets.json";
import enAssetsData from "@/data/en-assets.json";
import promptsData from "@/data/prompts.json";
import enPromptsData from "@/data/en-prompts.json";
import distillData from "@/data/distill.json";
import enDistillData from "@/data/en-distill.json";
import explainersData from "@/data/explainers.json";
import playbooksData from "@/data/playbooks.json";
import coursesData from "@/data/courses.json";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_URL || "https://buildhub.cn";

// 这些路径由各自的 page.tsx 拥有，术语 slug 撞上时必须让位，否则 sitemap 会指向不存在的内容
const STANDALONE_KEYS = ["design", "principles"];
const RESERVED = new Set([
  "",
  "account",
  "anti-ai-flavor",
  "assets",
  "changelog",
  "courses",
  "design",
  "distill",
  "en",
  "explains",
  "practice",
  "playbooks",
  "principles",
  "privacy",
  "products",
  "prompts",
  "refunds",
  "skills",
  "terms",
  "topics",
  "vibehub-skill",
]);

type Lib = {
  categories: {
    products?: { id: string }[];
    skills?: { id: string }[];
    styles?: { id: string }[];
    prompts?: { id: string }[];
  }[];
};

type Catalog = { key: string };

const entries = (base: string, ids: string[]): MetadataRoute.Sitemap =>
  ids.map((url) => ({ url: `${SITE_URL}${base}/${url}`, lastModified: new Date() }));

function library(data: unknown, path: string): MetadataRoute.Sitemap {
  const lib = data as Lib;
  const ids = [...new Set(
    lib.categories.flatMap(
      (c) => [...(c.products ?? []), ...(c.skills ?? []), ...(c.styles ?? []), ...(c.prompts ?? [])],
    ).map((x) => x.id),
  )];
  return entries(path, ids);
}

function topics(base: string, data: unknown): MetadataRoute.Sitemap {
  // 设计、原理已独立成顶级路由，catalogs 里那两条不走 /topics
  const keys = (data as Catalog[])
    .filter((c) => !STANDALONE_KEYS.includes(c.key))
    .map((c) => c.key);
  return entries(`${base}/topics`, keys);
}

function glossary(base: string, data: unknown): MetadataRoute.Sitemap {
  const slugs = (data as { slug: string }[])
    .map((t) => t.slug)
    .filter((s) => !RESERVED.has(s));
  return entries(base, slugs);
}

function zh(): MetadataRoute.Sitemap {
  const chapterKeys = Object.keys(
    (coursesData as { chapters: Record<string, unknown> }).chapters,
  );
  const listKeys = Object.keys(coursesData as Record<string, unknown>)
    .filter((k) => k !== "index" && k !== "chapters");

  return [
    { url: `${SITE_URL}/`, lastModified: new Date() },
    { url: `${SITE_URL}/products`, lastModified: new Date() },
    { url: `${SITE_URL}/skills`, lastModified: new Date() },
    { url: `${SITE_URL}/prompts`, lastModified: new Date() },
    { url: `${SITE_URL}/design`, lastModified: new Date() },
    { url: `${SITE_URL}/principles`, lastModified: new Date() },
    { url: `${SITE_URL}/distill`, lastModified: new Date() },
    { url: `${SITE_URL}/explains`, lastModified: new Date() },
    { url: `${SITE_URL}/playbooks`, lastModified: new Date() },
    { url: `${SITE_URL}/courses`, lastModified: new Date() },
    { url: `${SITE_URL}/changelog`, lastModified: new Date() },
    { url: `${SITE_URL}/practice`, lastModified: new Date() },
    { url: `${SITE_URL}/anti-ai-flavor`, lastModified: new Date() },
    { url: `${SITE_URL}/vibehub-skill`, lastModified: new Date() },
    ...topics("", catalogsData),
    ...library(productsData, "/products"),
    ...library(skillsData, "/skills"),
    ...library(assetsData, "/assets"),
    ...library(promptsData, "/prompts"),
    ...entries("/distill", (distillData as { slug: string }[]).map((d) => d.slug)),
    ...entries(
      "/explains",
      Object.keys(explainersData as Record<string, unknown>),
    ),
    ...entries(
      "/playbooks",
      Object.keys(playbooksData as Record<string, unknown>),
    ),
    ...entries("/courses", listKeys),
    ...entries("/courses", chapterKeys),
    ...glossary("", termsData),
  ];
}

function en(): MetadataRoute.Sitemap {
  const base = "/en";
  return [
    { url: `${SITE_URL}/en`, lastModified: new Date() },
    { url: `${SITE_URL}${base}/products`, lastModified: new Date() },
    { url: `${SITE_URL}${base}/skills`, lastModified: new Date() },
    { url: `${SITE_URL}${base}/prompts`, lastModified: new Date() },
    { url: `${SITE_URL}${base}/design`, lastModified: new Date() },
    { url: `${SITE_URL}${base}/distill`, lastModified: new Date() },
    { url: `${SITE_URL}${base}/changelog`, lastModified: new Date() },
    { url: `${SITE_URL}${base}/practice`, lastModified: new Date() },
    { url: `${SITE_URL}${base}/anti-ai-flavor`, lastModified: new Date() },
    { url: `${SITE_URL}${base}/vibehub-skill`, lastModified: new Date() },
    ...topics(base, enCatalogsData),
    ...library(enProductsData, `${base}/products`),
    ...library(enSkillsData, `${base}/skills`),
    ...library(enAssetsData, `${base}/assets`),
    ...library(enPromptsData, `${base}/prompts`),
    ...entries(`${base}/distill`, (enDistillData as { slug: string }[]).map((d) => d.slug)),
    ...glossary(base, enTermsData),
  ];
}

export default function sitemap(): MetadataRoute.Sitemap {
  return [...zh(), ...en()];
}
