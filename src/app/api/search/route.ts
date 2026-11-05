import { NextResponse } from "next/server";
import zhCatalogs from "@/data/catalogs.json";
import enCatalogs from "@/data/en-catalogs.json";
import zhTerms from "@/data/terms.json";
import enTerms from "@/data/en-terms.json";
import zhSkills from "@/data/skills.json";
import enSkills from "@/data/en-skills.json";
import zhPrompts from "@/data/prompts.json";
import enPrompts from "@/data/en-prompts.json";
import zhProducts from "@/data/products.json";
import enProducts from "@/data/en-products.json";
import playbooks from "@/data/playbooks.json";
import explainers from "@/data/explainers.json";
import courses from "@/data/courses.json";
import paths from "@/data/paths.json";
import { BOOKS, flatChapters } from "@/lib/drone-book";
import { QUICK_LINKS } from "@/lib/palette-links";

type Item = {
  key: string;
  title: string;
  subtitle: string;
  type: string;
  href: string;
  match: string;
  /** 结果缩略图的归类：term / skill / prompt / product / … / go */
  kind: string;
  logo?: string;
  /** 正文纯文本，给全文搜索命中用；不含 HTML、链接和资源路径 */
  deep?: string;
};

type Locale = "zh" | "en";

const DEEP_LIMIT = 12000;
const SKIP_KEYS = new Set([
  "id", "slug", "demoHtml", "stageHtml", "shotHtml", "headHtml", "logo", "cover",
  "href", "url", "repo", "official", "styleHref", "prev", "next", "related",
  "install", "promptHint",
]);

/** 英文词条正文只存在 html 里，抽成纯文本再检索，class/属性名不会进索引 */
function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

/** 把任意内容对象压成一段可检索正文；html 字段只留可见文本 */
function collectText(value: unknown, budget: { n: number }, depth = 0): string[] {
  if (budget.n <= 0 || depth > 8 || value == null) return [];
  if (typeof value === "string") {
    const text = value.trim();
    if (!text) return [];
    budget.n -= text.length;
    return [text];
  }
  if (typeof value === "number") return [String(value)];
  if (Array.isArray(value)) {
    const out: string[] = [];
    for (const v of value) {
      out.push(...collectText(v, budget, depth + 1));
      if (budget.n <= 0) break;
    }
    return out;
  }
  if (typeof value === "object") {
    const out: string[] = [];
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (typeof v === "string" && /html$/i.test(k) && !SKIP_KEYS.has(k)) {
        const text = htmlToText(v);
        if (text) {
          budget.n -= text.length;
          out.push(text);
        }
        if (budget.n <= 0) break;
        continue;
      }
      if (SKIP_KEYS.has(k)) continue;
      out.push(...collectText(v, budget, depth + 1));
      if (budget.n <= 0) break;
    }
    return out;
  }
  return [];
}

function deepText(value: unknown): string {
  return collectText(value, { n: DEEP_LIMIT }).join(" ").replace(/\s+/g, " ").trim();
}

const ZONES: Record<Locale, Record<string, string>> = {
  zh: {
    frontend: "前端",
    backend: "后端",
    product: "产品",
    testing: "测试",
    technology: "技术栈",
    stack: "选型",
    ai: "AI",
    git: "Git",
    design: "设计",
    motion: "动效",
  },
  en: {
    frontend: "Frontend",
    backend: "Backend",
    product: "Product",
    testing: "Testing",
    technology: "Stack",
    stack: "Stack",
    ai: "AI",
    git: "Git",
    design: "Design",
    motion: "Motion",
  },
};

const LABELS: Record<Locale, { skill: string; prompt: string; product: string; playbook: string; explainer: string; course: string; path: string; entry: string }> = {
  zh: { skill: "技能", prompt: "提示词", product: "产品", playbook: "手册", explainer: "专题", course: "课程", path: "路径", entry: "入口" },
  en: { skill: "Skill", prompt: "Prompt", product: "Showcase", playbook: "Playbook", explainer: "Story", course: "Course", path: "Path", entry: "Go" },
};

function makeIndex(locale: Locale): Item[] {
  const base = locale === "en" ? "/en" : "";
  const L = LABELS[locale];
  const zones = ZONES[locale];
  const items: Item[] = [];

  const catalogs = (locale === "en" ? enCatalogs : zhCatalogs) as any[];
  const termBodies = new Map<string, any>(
    ((locale === "en" ? enTerms : zhTerms) as any[]).map((t) => [t.slug, t])
  );
  for (const cat of catalogs) {
    const zone = zones[cat.key] ?? cat.key;
    for (const group of cat.groups ?? []) {
      for (const t of group.terms ?? []) {
        items.push({
          key: `term:${t.slug}`,
          title: t.name,
          subtitle: t.tagline ?? "",
          type: zone,
          // 图鉴里只有预览、没有详情页的条目（导航样式）直接深链到设计页弹层
          href: t.demoOnly ? `${base}/design?nav=${t.slug}` : `${base}/${t.slug}`,
          kind: "term",
          match: [t.name, t.en, t.tagline, ...(t.aliases ?? []), ...(termBodies.get(t.slug)?.aliases ?? [])]
            .filter(Boolean)
            .join(" "),
          deep: deepText(termBodies.get(t.slug) ?? { name: t.name, tagline: t.tagline }),
        });
      }
    }
  }

  const skills = (locale === "en" ? enSkills : zhSkills) as any;
  for (const cat of skills.categories ?? []) {
    for (const s of cat.skills ?? []) {
      items.push({
        key: `skill:${s.id}`,
        title: s.name,
        subtitle: [cat.label, s.tagline].filter(Boolean).join(" · "),
        type: L.skill,
        href: `${base}/skills/${s.id}`,
        kind: "skill",
        match: [s.name, s.tagline, s.overview, s.platform, s.author, ...(s.tags ?? [])].filter(Boolean).join(" "),
        deep: deepText(s),
      });
    }
  }

  const prompts = (locale === "en" ? enPrompts : zhPrompts) as any;
  for (const cat of prompts.categories ?? []) {
    for (const p of cat.prompts ?? []) {
      items.push({
        key: `prompt:${p.id}`,
        title: p.name,
        subtitle: [cat.label, p.tagline].filter(Boolean).join(" · "),
        type: L.prompt,
        href: `${base}/prompts/${p.id}`,
        kind: "prompt",
        match: [p.name, p.tagline, ...(p.tags ?? [])].filter(Boolean).join(" "),
        deep: deepText(p),
      });
    }
  }

  const products = (locale === "en" ? enProducts : zhProducts) as any;
  for (const cat of products.categories ?? []) {
    for (const p of cat.products ?? []) {
      items.push({
        key: `product:${p.id}`,
        title: p.name,
        subtitle: [cat.label, p.tagline].filter(Boolean).join(" · "),
        type: L.product,
        href: `${base}/products/${p.id}`,
        kind: "product",
        logo: typeof p.logo === "string" && p.logo.startsWith("/") ? p.logo : undefined,
        match: [p.name, p.tagline, p.overview, ...(p.tags ?? [])].filter(Boolean).join(" "),
        deep: deepText(p),
      });
    }
  }

  // 手册、专题、课程只有中文版
  if (locale === "zh") {
    for (const p of (paths as {
      paths: {
        id: string;
        name: string;
        kicker: string;
        duration: string;
        steps: unknown[];
        tagline?: string;
        outcome?: string;
        audience?: string;
      }[];
    }).paths) {
      items.push({
        key: `path:${p.id}`,
        title: p.name,
        subtitle: `${p.kicker} · ${p.steps.length} 步 · ${p.duration}`,
        type: L.path,
        href: `/paths/${p.id}`,
        kind: "path",
        match: [p.name, p.tagline, p.outcome, p.audience, p.kicker].filter(Boolean).join(" "),
        deep: deepText(p),
      });
    }
    for (const [id, p] of Object.entries(playbooks as Record<string, any>)) {
      items.push({
        key: `playbook:${id}`,
        title: p.title,
        subtitle: p.summary ?? "",
        type: L.playbook,
        href: `/playbooks/${id}`,
        kind: "playbook",
        match: [p.title, p.summary, p.category, p.hook].filter(Boolean).join(" "),
        deep: deepText(p),
      });
    }
    for (const [id, e] of Object.entries(explainers as Record<string, any>)) {
      items.push({
        key: `explainer:${id}`,
        title: e.title,
        subtitle: e.oneLiner ?? "",
        type: L.explainer,
        href: `/explains/${id}`,
        kind: "explainer",
        match: [e.title, e.oneLiner, e.category].filter(Boolean).join(" "),
        deep: deepText(e),
      });
    }
    for (const [id, book] of Object.entries(BOOKS)) {
      items.push({
        key: `book:${id}`,
        title: `${book.title}${book.subtitle}`,
        subtitle: book.oneLiner,
        type: L.explainer,
        href: `/explains/${id}`,
        kind: "book",
        match: [book.title, book.subtitle, book.oneLiner, book.intro].join(" "),
        deep: deepText(book),
      });
      for (const chapter of flatChapters(book)) {
        items.push({
          key: `book:${id}:${chapter.id}`,
          title: `第 ${chapter.id} 章 ${chapter.title}`,
          subtitle: `${book.title} · ${chapter.summary}`,
          type: L.explainer,
          href: `/explains/${id}/${chapter.slug}`,
          kind: "book",
          match: [chapter.title, chapter.summary, ...Object.values(chapter.sections)].filter(Boolean).join(" "),
          deep: deepText(chapter),
        });
      }
    }
    for (const [id, c] of Object.entries(courses as Record<string, any>)) {
      if (id === "index" || id === "chapters") continue;
      if (c.kind !== "list") continue;
      const title = String(c.title ?? "").split("｜")[0];
      items.push({
        key: `course:${id}`,
        title,
        subtitle: L.course,
        type: L.course,
        href: `/courses/${id}`,
        kind: "course",
        match: [title, L.course].join(" "),
        deep: deepText(c),
      });
    }
  }

  return items;
}

const INDEX: Record<Locale, Item[]> = {
  zh: makeIndex("zh"),
  en: makeIndex("en"),
};

const countByCatalog = (
  catalogs: { key: string; groups: { terms?: unknown[] }[] }[],
  key: string
) =>
  catalogs
    .filter((c) => c.key === key)
    .reduce((n, c) => n + c.groups.reduce((m, g) => m + (g.terms?.length ?? 0), 0), 0);

const PATH_COUNT = (paths as { paths: unknown[] }).paths.length;
const MOTION_ZH = countByCatalog(zhCatalogs, "motion");
const MOTION_EN = countByCatalog(enCatalogs, "motion");

const SECTIONS: Record<Locale, { label: string; title: string; subtitle: string; href: string }[]> = {
  zh: [
    { label: "路径", title: "路径", subtitle: `${PATH_COUNT} 条排好顺序的动手路线`, href: "/paths" },
    { label: "概念", title: "概念", subtitle: `${zhTerms.length} 个词条，每条配能跑的示例`, href: "/topics/frontend" },
    { label: "课程", title: "课程", subtitle: "成体系地走完一遍", href: "/courses" },
    { label: "技能", title: "技能库", subtitle: "精选 Agent Skills，附安装命令", href: "/skills" },
    { label: "产品", title: "产品图鉴", subtitle: "真实用过的工具与网站", href: "/products" },
    { label: "提示词", title: "提示词库", subtitle: "可直接复制的全流程提示词", href: "/prompts" },
    { label: "设计", title: "设计", subtitle: "可点开看的界面风格", href: "/design" },
    { label: "动效", title: "动效", subtitle: `${MOTION_ZH} 个可点着玩的交互动效`, href: "/distill" },
    { label: "专题", title: "专题", subtitle: "从 0 到 1 的完整拆解", href: "/explains" },
    { label: "手册", title: "手册", subtitle: "什么时候用、怎么做、做到什么程度算过", href: "/playbooks" },
  ],
  en: [
    { label: "concepts", title: "Concepts", subtitle: `${enTerms.length} plain-word entries, each with a demo`, href: "/en/topics/frontend" },
    { label: "skills", title: "Skills", subtitle: "Curated agent skills with install commands", href: "/en/skills" },
    { label: "products", title: "Showcase", subtitle: "Tools we have actually used", href: "/en/products" },
    { label: "prompts", title: "Prompts", subtitle: "Copy-ready prompts for the whole build", href: "/en/prompts" },
    { label: "design", title: "Design", subtitle: "Interface styles you can open and compare", href: "/en/design" },
    { label: "motion", title: "Motion", subtitle: `${MOTION_EN} playable interaction demos`, href: "/en/distill" },
  ],
};

function moduleLinks(locale: Locale, q: string): Item[] {
  const L = LABELS[locale];
  return SECTIONS[locale]
    .filter((s) => s.label.startsWith(q) || q.startsWith(s.label))
    .map((s) => ({
      key: `go:${s.href}`,
      title: s.title,
      subtitle: s.subtitle,
      type: L.entry,
      href: s.href,
      kind: "go",
      match: "",
    }));
}

function excerpt(text: string, token: string): string {
  const i = text.toLowerCase().indexOf(token);
  if (i < 0) return "";
  const start = Math.max(0, i - 36);
  const end = Math.min(text.length, i + token.length + 64);
  return `${start ? "…" : ""}${text.slice(start, end).replace(/\s+/g, " ").trim()}${end < text.length ? "…" : ""}`;
}

/** 标题命中永远排在正文命中前面；返回 null 表示这条不匹配 */
function scoreItem(
  item: Item,
  tokens: string[],
  full: boolean
): { score: number; snippet: string } | null {
  if (!tokens.length) return { score: 0, snippet: "" };
  const title = item.title.toLowerCase();
  const match = item.match.toLowerCase();
  const type = item.type.toLowerCase();
  const deepSource = full ? item.deep ?? "" : "";
  const deep = deepSource.toLowerCase();
  let total = 0;
  let snippet = "";
  for (const token of tokens) {
    if (title.startsWith(token)) total += 60;
    else if (title.includes(token)) total += 40;
    else if (type === token) total += 25;
    else if (match.includes(token)) total += 15;
    else if (deep.includes(token)) {
      total += 8;
      if (!snippet) snippet = excerpt(deepSource, token);
    } else return null;
  }
  return { score: total, snippet };
}

function brief(items: Item[], snippets = new Map<string, string>()) {
  return items.map(({ title, subtitle, type, href, key, kind, logo }) => ({
    title,
    subtitle,
    type,
    href,
    kind,
    logo,
    snippet: snippets.get(key) || undefined,
  }));
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const locale: Locale = url.searchParams.get("locale") === "en" ? "en" : "zh";
  const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
  /* 全文搜索免费：内容本来就全公开，把「找得到」锁进 PRO 等于给自己造诱饵 */
  const full = url.searchParams.get("full") === "1";

  if (!q) {
    const items = QUICK_LINKS[locale].map((l) => ({ ...l, match: "" }));
    return NextResponse.json({ items: brief(items), full });
  }

  const tokens = q.split(/\s+/).filter(Boolean).slice(0, 4);
  const snippets = new Map<string, string>();
  const scored = INDEX[locale]
    .map((item) => ({ item, hit: scoreItem(item, tokens, full) }))
    .filter((r): r is { item: Item; hit: { score: number; snippet: string } } => !!r.hit)
    .sort((a, b) => b.hit.score - a.hit.score)
    .slice(0, 14);
  for (const r of scored) if (r.hit.snippet) snippets.set(r.item.key, r.hit.snippet);

  const links = moduleLinks(locale, q);
  const seen = new Set(links.map((l) => l.href));
  const items = [...links, ...scored.map((r) => r.item).filter((i) => !seen.has(i.href))].slice(
    0,
    14
  );

  return NextResponse.json({ items: brief(items, snippets), full });
}
