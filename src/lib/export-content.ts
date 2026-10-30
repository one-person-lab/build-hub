import zhTerms from "@/data/terms.json";
import enTerms from "@/data/en-terms.json";
import zhSkills from "@/data/skills.json";
import enSkills from "@/data/en-skills.json";
import zhPrompts from "@/data/prompts.json";
import enPrompts from "@/data/en-prompts.json";
import zhProducts from "@/data/products.json";
import enProducts from "@/data/en-products.json";
import zhAssets from "@/data/assets.json";
import enAssets from "@/data/en-assets.json";
import zhDistill from "@/data/distill.json";
import enDistill from "@/data/en-distill.json";
import paths from "@/data/paths.json";
import playbooks from "@/data/playbooks.json";
import explainers from "@/data/explainers.json";
import courses from "@/data/courses.json";
import type { Term } from "./types";

type Locale = "zh" | "en";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

const SITE = "https://buildhub.cn";

const TERMS: Record<Locale, Term[]> = {
  zh: zhTerms as unknown as Term[],
  en: enTerms as unknown as Term[],
};

const SKILLS: Record<Locale, AnyRecord[]> = {
  zh: (zhSkills as unknown as AnyRecord).categories.flatMap((c: AnyRecord) =>
    c.skills.map((s: AnyRecord) => ({ ...s, categoryLabel: c.label }))
  ),
  en: (enSkills as unknown as AnyRecord).categories.flatMap((c: AnyRecord) =>
    c.skills.map((s: AnyRecord) => ({ ...s, categoryLabel: c.label }))
  ),
};

const PROMPTS: Record<Locale, AnyRecord[]> = {
  zh: (zhPrompts as unknown as AnyRecord).categories.flatMap((c: AnyRecord) =>
    c.prompts.map((p: AnyRecord) => ({ ...p, categoryLabel: c.label }))
  ),
  en: (enPrompts as unknown as AnyRecord).categories.flatMap((c: AnyRecord) =>
    c.prompts.map((p: AnyRecord) => ({ ...p, categoryLabel: c.label }))
  ),
};

const PRODUCTS: Record<Locale, AnyRecord[]> = {
  zh: (zhProducts as unknown as AnyRecord).categories.flatMap((c: AnyRecord) =>
    c.products.map((p: AnyRecord) => ({ ...p, categoryLabel: c.label }))
  ),
  en: (enProducts as unknown as AnyRecord).categories.flatMap((c: AnyRecord) =>
    c.products.map((p: AnyRecord) => ({ ...p, categoryLabel: c.label }))
  ),
};

const ASSETS: Record<Locale, AnyRecord[]> = {
  zh: (zhAssets as unknown as AnyRecord).categories.flatMap((c: AnyRecord) =>
    c.styles.map((s: AnyRecord) => ({ ...s, categoryLabel: c.name }))
  ),
  en: (enAssets as unknown as AnyRecord).categories.flatMap((c: AnyRecord) =>
    c.styles.map((s: AnyRecord) => ({ ...s, categoryLabel: c.name }))
  ),
};

const MOTION: Record<Locale, AnyRecord[]> = {
  zh: zhDistill as AnyRecord[],
  en: enDistill as AnyRecord[],
};

const PATHS = (paths as unknown as AnyRecord).paths as AnyRecord[];
const PLAYBOOKS = playbooks as unknown as Record<string, AnyRecord>;
const EXPLAINERS = explainers as unknown as Record<string, AnyRecord>;
const COURSES = courses as unknown as Record<string, AnyRecord>;

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|section|tr|td|th)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function bullets(items: unknown): string[] {
  if (!Array.isArray(items)) return [];
  return items
    .map((x) => (typeof x === "string" ? x.trim() : ""))
    .filter(Boolean)
    .map((x) => `- ${x}`);
}

function termMarkdown(t: Term, locale: Locale): string {
  const lines: string[] = [`# ${t.name}${t.en ? ` (${t.en})` : ""}`];
  if (t.quote) {
    const label = t.quoteLabel || (locale === "en" ? "You might say" : "你可能会说");
    lines.push(`> ${label}: ${t.quote}`);
  }
  if (t.summaryLead) lines.push("", t.summaryLead);
  if (t.summaryRest) lines.push("", t.summaryRest);
  for (const s of t.sections ?? []) {
    if (s.title) lines.push("", `## ${s.title}`);
    let wrote = false;
    if (s.cards?.length) {
      wrote = true;
      for (const c of s.cards) {
        lines.push(`- ${c.headText.replace(/\s+/g, " ")}`);
        if (c.bodyText) lines.push(`  ${c.bodyText}`);
      }
    }
    if (s.parts?.length) {
      wrote = true;
      for (const p of s.parts)
        lines.push(`${p.idx}. **${p.name}${p.en ? ` ${p.en}` : ""}** — ${p.desc}`);
    }
    if (s.variants?.length) {
      wrote = true;
      for (const v of s.variants)
        lines.push(`- **${v.name}${v.en ? ` ${v.en}` : ""}**: ${v.when}`);
    }
    if (s.scenes?.length) {
      wrote = true;
      for (const sc of s.scenes) lines.push(`- ${sc.cap}`);
    }
    if (s.references?.length) {
      wrote = true;
      for (const r of s.references) lines.push(`- [${r.title}](${r.href}) ${r.source}`);
    }
    if (!wrote && s.html) lines.push("", stripHtml(s.html));
  }
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function skillMarkdown(s: AnyRecord, locale: Locale): string {
  const lines = [`# ${s.name}`, s.tagline ? `> ${s.tagline}` : ""];
  const meta: string[] = [];
  if (s.categoryLabel) meta.push(`- ${locale === "en" ? "Category" : "分类"}: ${s.categoryLabel}`);
  if (s.platform) meta.push(`- ${locale === "en" ? "Platform" : "平台"}: ${s.platform}`);
  if (s.pricing) meta.push(`- ${locale === "en" ? "Pricing" : "收费"}: ${s.pricing}`);
  if (s.author) meta.push(`- ${locale === "en" ? "Author" : "作者"}: ${s.author}`);
  if (s.repo) meta.push(`- ${locale === "en" ? "Repo" : "仓库"}: ${s.repo}`);
  if (s.install) meta.push(`- ${locale === "en" ? "Install" : "安装"}: \`${s.install}\``);
  if (meta.length) lines.push("", ...meta);
  if (s.overview) lines.push("", `## ${locale === "en" ? "Overview" : "详细介绍"}`, "", s.overview);
  const features = bullets(s.features);
  if (features.length) lines.push("", `## ${locale === "en" ? "Key features" : "核心特性"}`, "", ...features);
  const useCases = bullets(s.useCases);
  if (useCases.length) lines.push("", `## ${locale === "en" ? "Use cases" : "适用场景"}`, "", ...useCases);
  if (s.bestFor) lines.push("", `## ${locale === "en" ? "Best for" : "适合谁"}`, "", s.bestFor);
  const tags = bullets(s.tags);
  if (tags.length) lines.push("", `## ${locale === "en" ? "Tags" : "标签"}`, "", ...tags);
  return lines.filter((x) => x !== "").join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function promptMarkdown(p: AnyRecord, locale: Locale): string {
  const lines = [`# ${p.name}`, p.tagline ? `> ${p.tagline}` : ""];
  if (p.prompt)
    lines.push(
      "",
      `## ${locale === "en" ? "The prompt" : "提示词全文"}`,
      "",
      "```text",
      p.prompt,
      "```"
    );
  const why = bullets(p.why);
  if (why.length) lines.push("", `## ${locale === "en" ? "Why it works" : "为什么这么写"}`, "", ...why);
  if (p.example) lines.push("", `## ${locale === "en" ? "What it looks like" : "用起来的样子"}`, "", p.example);
  const pitfalls = bullets(p.pitfalls);
  if (pitfalls.length) lines.push("", `## ${locale === "en" ? "Where it bites" : "常见坑"}`, "", ...pitfalls);
  if (p.bestFor) lines.push("", `## ${locale === "en" ? "When to use it" : "什么时候用"}`, "", p.bestFor);
  if (p.models) lines.push("", `## ${locale === "en" ? "Models" : "适用模型"}`, "", p.models);
  const tags = bullets(p.tags);
  if (tags.length) lines.push("", `## ${locale === "en" ? "Tags" : "标签"}`, "", ...tags);
  return lines.filter((x) => x !== "").join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function productMarkdown(p: AnyRecord, locale: Locale): string {
  const lines = [`# ${p.name}`, p.tagline ? `> ${p.tagline}` : ""];
  const meta: string[] = [];
  if (p.categoryLabel) meta.push(`- ${locale === "en" ? "Category" : "分类"}: ${p.categoryLabel}`);
  if (p.platform) meta.push(`- ${locale === "en" ? "Platform" : "平台"}: ${p.platform}`);
  if (p.pricing) meta.push(`- ${locale === "en" ? "Pricing" : "收费"}: ${p.pricing}`);
  if (p.url) meta.push(`- ${locale === "en" ? "Website" : "官网"}: ${p.url}`);
  if (meta.length) lines.push("", ...meta);
  if (p.overview) lines.push("", p.overview);
  const highlights = bullets(p.highlights);
  if (highlights.length) lines.push("", `## ${locale === "en" ? "Highlights" : "亮点"}`, "", ...highlights);
  if (p.bestFor) lines.push("", `## ${locale === "en" ? "Best for" : "适合谁"}`, "", p.bestFor);
  const tags = bullets(p.tags);
  if (tags.length) lines.push("", `## ${locale === "en" ? "Tags" : "标签"}`, "", ...tags);
  return lines.filter((x) => x !== "").join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function assetMarkdown(a: AnyRecord, locale: Locale): string {
  const lines = [`# ${a.name}${a.en ? ` (${a.en})` : ""}`, a.tagline ? `> ${a.tagline}` : ""];
  if (a.intro) lines.push("", a.intro);
  const why = bullets(a.why);
  if (why.length) lines.push("", `## ${locale === "en" ? "Why it works" : "为什么成立"}`, "", ...why);
  const fits = bullets(a.fits);
  if (fits.length) lines.push("", `## ${locale === "en" ? "Fits" : "适合"}`, "", ...fits);
  if (a.prompt)
    lines.push(
      "",
      `## ${locale === "en" ? "Prompt" : "复刻提示词"}`,
      "",
      "```text",
      a.prompt,
      "```"
    );
  if (Array.isArray(a.cases) && a.cases.length) {
    lines.push("", `## ${locale === "en" ? "Cases" : "案例"}`);
    for (const c of a.cases) {
      lines.push(`- **${c.brand}**: ${c.note ?? ""}${c.source ? ` (${c.source})` : ""}`);
    }
  }
  return lines.filter((x) => x !== "").join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function pathMarkdown(p: AnyRecord, locale: Locale): string {
  const lines = [`# ${p.name}`, p.tagline ? `> ${p.tagline}` : ""];
  const meta: string[] = [];
  if (p.audience) meta.push(`- ${locale === "en" ? "Audience" : "适合谁"}: ${p.audience}`);
  if (p.prereq) meta.push(`- ${locale === "en" ? "Prereq" : "前置"} : ${p.prereq}`);
  if (p.duration) meta.push(`- ${locale === "en" ? "Duration" : "时长"}: ${p.duration}`);
  if (meta.length) lines.push("", ...meta);
  if (p.outcome) lines.push("", `## ${locale === "en" ? "Outcome" : "做完得到什么"}`, "", p.outcome);
  if (Array.isArray(p.steps)) {
    lines.push("", `## ${locale === "en" ? "Steps" : "步骤"}`);
    p.steps.forEach((s: AnyRecord, i: number) => {
      lines.push("", `### ${i + 1}. ${s.title}`);
      if (s.why) lines.push("", s.why);
      if (s.done) lines.push("", `${locale === "en" ? "Done when" : "完成标志"}: ${s.done}`);
    });
  }
  return lines.filter((x) => x !== "").join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function guideMarkdown(g: AnyRecord): string {
  const lines = [`# ${g.title}`, g.summary ? `> ${g.summary}` : ""];
  for (const s of Array.isArray(g.sections) ? g.sections : []) {
    lines.push("", `## ${s.n} ${s.title}`);
    for (const b of Array.isArray(s.blocks) ? s.blocks : []) {
      if (b.t === "p" || b.t === "h") lines.push("", b.text);
      else if (b.t === "note") lines.push("", `**${b.label}：** ${b.text}`);
      else if (b.t === "ul") lines.push("", ...bullets(b.items));
      else if (b.t === "copy") lines.push("", "```", b.text, "```");
      else if (b.t === "table") {
        lines.push("", `| ${b.head.join(" | ")} |`, `| ${b.head.map(() => "---").join(" |")} |`);
        for (const row of b.rows) lines.push(`| ${row.join(" | ")} |`);
      } else if (b.t === "links") {
        for (const l of b.items) lines.push(`- [${l.label}](${l.href})${l.note ? ` — ${l.note}` : ""}`);
      }
    }
  }
  return lines.filter((x) => x !== "").join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function playbookMarkdown(p: AnyRecord, locale: Locale): string {
  if (p.kind === "guide") return guideMarkdown(p);
  const lines = [`# ${p.title}`, p.summary ? `> ${p.summary}` : ""];
  if (Array.isArray(p.intro)) lines.push("", ...p.intro);
  if (Array.isArray(p.steps)) {
    lines.push("", `## ${p.stepsLabel || (locale === "en" ? "Steps" : "步骤")}`);
    p.steps.forEach((s: AnyRecord, i: number) => {
      lines.push("", `### ${i + 1}. ${s.name}`);
      if (s.question) lines.push("", s.question);
      const points = bullets(s.points);
      if (points.length) lines.push("", ...points);
      if (s.done) lines.push("", `${locale === "en" ? "Done when" : "完成标志"}: ${s.done}`);
    });
  }
  return lines.filter((x) => x !== "").join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function explainerMarkdown(e: AnyRecord, locale: Locale): string {
  const lines = [`# ${e.title}`, e.oneLiner ? `> ${e.oneLiner}` : ""];
  if (e.forWhom) lines.push("", `## ${locale === "en" ? "Who it is for" : "写给谁"}`, "", e.forWhom);
  if (Array.isArray(e.related) && e.related.length) {
    lines.push("", `## ${locale === "en" ? "Related" : "相关"}`);
    for (const r of e.related) lines.push(`- ${r.label || r.id}`);
  }
  return lines.filter((x) => x !== "").join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function motionMarkdown(m: AnyRecord, locale: Locale): string {
  const lines = [`# ${m.name}${m.en ? ` (${m.en})` : ""}`, m.tagline ? `> ${m.tagline}` : ""];
  if (m.source) lines.push("", `- ${locale === "en" ? "Source" : "出处"}: ${m.source}`);
  return lines.filter((x) => x !== "").join("\n");
}

type Resolved = {
  title: string;
  typeLabel: string;
  href: string;
  markdown: string;
};

function findTerm(id: string, locale: Locale): Term | undefined {
  const list = TERMS[locale] ?? TERMS.zh;
  return list.find((t) => t.slug === id) ?? TERMS.zh.find((t) => t.slug === id);
}

function findIn(list: AnyRecord[], id: string): AnyRecord | undefined {
  return list.find((x) => x.id === id);
}

export function resolveEntry(
  kind: string,
  id: string,
  locale: Locale = "zh"
): Resolved | null {
  if (kind === "term") {
    const t = findTerm(id, locale);
    if (!t) return null;
    return {
      title: t.name,
      typeLabel: locale === "en" ? "Concept" : "概念",
      href: `${SITE}${locale === "en" ? "/en" : ""}/${t.slug}`,
      markdown: termMarkdown(t, locale),
    };
  }
  if (kind === "skill") {
    const s = findIn(SKILLS[locale] ?? SKILLS.zh, id) ?? findIn(SKILLS.zh, id);
    if (!s) return null;
    return {
      title: s.name,
      typeLabel: locale === "en" ? "Skill" : "技能",
      href: `${SITE}${locale === "en" ? "/en" : ""}/skills/${s.id}`,
      markdown: skillMarkdown(s, locale),
    };
  }
  if (kind === "prompt") {
    const p = findIn(PROMPTS[locale] ?? PROMPTS.zh, id) ?? findIn(PROMPTS.zh, id);
    if (!p) return null;
    return {
      title: p.name,
      typeLabel: locale === "en" ? "Prompt" : "提示词",
      href: `${SITE}${locale === "en" ? "/en" : ""}/prompts/${p.id}`,
      markdown: promptMarkdown(p, locale),
    };
  }
  if (kind === "product") {
    const p = findIn(PRODUCTS[locale] ?? PRODUCTS.zh, id) ?? findIn(PRODUCTS.zh, id);
    if (!p) return null;
    return {
      title: p.name,
      typeLabel: locale === "en" ? "Product" : "产品",
      href: `${SITE}${locale === "en" ? "/en" : ""}/products/${p.id}`,
      markdown: productMarkdown(p, locale),
    };
  }
  if (kind === "asset") {
    const a = findIn(ASSETS[locale] ?? ASSETS.zh, id) ?? findIn(ASSETS.zh, id);
    if (!a) return null;
    return {
      title: a.name,
      typeLabel: locale === "en" ? "Design asset" : "设计",
      href: `${SITE}${locale === "en" ? "/en" : ""}/assets/${a.id}`,
      markdown: assetMarkdown(a, locale),
    };
  }
  if (kind === "motion") {
    const m = (MOTION[locale] ?? MOTION.zh).find((x) => x.slug === id) ?? MOTION.zh.find((x) => x.slug === id);
    if (!m) return null;
    return {
      title: m.name,
      typeLabel: locale === "en" ? "Motion" : "动效",
      href: `${SITE}${locale === "en" ? "/en" : ""}/distill/${m.slug}`,
      markdown: motionMarkdown(m, locale),
    };
  }
  if (kind === "path") {
    const p = PATHS.find((x) => x.id === id);
    if (!p) return null;
    return {
      title: p.name,
      typeLabel: locale === "en" ? "Path" : "路径",
      href: `${SITE}/paths/${p.id}`,
      markdown: pathMarkdown(p, locale),
    };
  }
  if (kind === "playbook") {
    const p = PLAYBOOKS[id];
    if (!p) return null;
    return {
      title: p.title,
      typeLabel: locale === "en" ? "Playbook" : "手册",
      href: `${SITE}/playbooks/${id}`,
      markdown: playbookMarkdown(p, locale),
    };
  }
  if (kind === "explainer") {
    const e = EXPLAINERS[id];
    if (!e) return null;
    return {
      title: e.title,
      typeLabel: locale === "en" ? "Story" : "专题",
      href: `${SITE}/explains/${id}`,
      markdown: explainerMarkdown(e, locale),
    };
  }
  if (kind === "course") {
    const c = COURSES[id];
    if (!c || c.kind !== "list") return null;
    const title = String(c.title ?? "").split("｜")[0];
    return {
      title,
      typeLabel: locale === "en" ? "Course" : "课程",
      href: `${SITE}/courses/${id}`,
      markdown: `# ${title}\n\n${SITE}/courses/${id}`,
    };
  }
  return null;
}

/** 收藏只存 slug，按现有内容类型依次解析；目前只到概念/设计/技能/提示词 */
export function resolveFavorite(slug: string, locale: Locale = "zh"): Resolved | null {
  for (const kind of ["term", "asset", "skill", "prompt"]) {
    const hit = resolveEntry(kind, slug, locale);
    if (hit) return hit;
  }
  return null;
}

function favoritesBody(
  slugs: string[],
  locale: Locale,
  notes: Record<string, string>
): string {
  return slugs
    .map((slug) => ({ slug, entry: resolveFavorite(slug, locale) }))
    .filter((x): x is { slug: string; entry: Resolved } => Boolean(x.entry))
    .map(({ slug, entry }) => {
      const note = notes[slug]?.trim();
      const parts = [entry.markdown];
      if (note)
        parts.push(
          `> ${locale === "en" ? "My note" : "我的备注"}: ${note.replace(/\n/g, "\n> ")}`
        );
      parts.push(`— ${entry.typeLabel} · ${entry.href}`);
      return parts.join("\n\n");
    })
    .join("\n\n---\n\n");
}

export function buildFavoritesMarkdown(
  slugs: string[],
  locale: Locale = "zh",
  opts: { title?: string; notes?: Record<string, string> } = {}
): string {
  const date = new Date().toISOString().slice(0, 10);
  const entries = slugs
    .map((slug) => resolveFavorite(slug, locale))
    .filter(Boolean).length;

  const heading = opts.title || (locale === "en" ? "BuildHub favorites" : "BuildHub 收藏");
  const count = locale === "en" ? `${entries} entries` : `共 ${entries} 条`;
  const intro =
    locale === "en"
      ? "Exported from BuildHub. Each entry keeps its source link."
      : "从 BuildHub 导出，每条都带原始链接。";

  const body = favoritesBody(slugs, locale, opts.notes ?? {});

  return [`# ${heading} · ${date}`, "", count, "", intro, "", "---", "", body, ""]
    .join("\n")
    .replace(/\n{4,}/g, "\n\n\n");
}

export function exportFilename(kind: string, id: string | null = null): string {
  const date = new Date().toISOString().slice(0, 10);
  const safe = (id ?? kind).replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 60);
  return `buildhub-${safe}-${date}.md`;
}

export type PackInput = {
  favorites: string[];
  notes: Record<string, string>;
  collections: { name: string; slugs: string[] }[];
  forks: {
    playbookId: string;
    title: string;
    steps: { name: string; done?: string }[];
    progress: { stepIndex: number; status: string; result: string; blocker: string }[];
  }[];
};

const MARK: Record<string, string> = { done: "✓", doing: "→", todo: "·" };

/** 资产包 = 收藏全文 + 收藏夹清单 + 复刻进度，一次拿走自己攒下的全部东西 */
export function buildPackMarkdown(input: PackInput, locale: Locale = "zh"): string {
  const date = new Date().toISOString().slice(0, 10);
  const L = (zh: string, en: string) => (locale === "en" ? en : zh);
  const out: string[] = [
    `# ${L("BuildHub 资产包", "BuildHub asset pack")} · ${date}`,
    "",
    L(
      "这里面是你在这个站上攒下的全部东西：收藏的正文、自己分的收藏夹、以及每份手册走到哪一步。",
      "Everything you have accumulated here: the full text of your favorites, your own collections, and how far you got in each playbook."
    ),
    "",
    "---",
    "",
  ];

  const CN = ["一", "二", "三", "四"];
  const sections: { head: string; body: string[] }[] = [];

  sections.push({
    head: `${L("我的收藏", "My favorites")} · ${input.favorites.length}`,
    body: ["", favoritesBody(input.favorites, locale, input.notes), ""],
  });

  if (input.collections.length) {
    const body: string[] = [""];
    for (const c of input.collections) {
      body.push(`### ${c.name} · ${c.slugs.length}`, "");
      for (const slug of c.slugs) {
        const hit = resolveFavorite(slug, locale);
        body.push(
          hit
            ? `- ${hit.typeLabel} · [${hit.title}](${hit.href})`
            : `- ${slug} ${L("（内容已下线）", "(removed)")}`
        );
      }
      body.push("");
    }
    sections.push({ head: L("我的收藏夹", "My collections"), body });
  }

  if (input.forks.length) {
    const body: string[] = [""];
    for (const f of input.forks) {
      const byIndex = new Map(f.progress.map((p) => [p.stepIndex, p]));
      const doneCount = f.steps.filter((_, i) => byIndex.get(i)?.status === "done").length;
      body.push(`### ${f.title} · ${doneCount}/${f.steps.length}`, "");
      f.steps.forEach((s, i) => {
        const p = byIndex.get(i);
        const bits = [`${i + 1}. ${MARK[p?.status ?? "todo"] ?? "·"} ${s.name}`];
        if (p?.result?.trim()) bits.push(`${L("我的结果", "Result")}: ${p.result.trim()}`);
        if (p?.blocker?.trim()) bits.push(`${L("卡点", "Blocked")}: ${p.blocker.trim()}`);
        body.push(bits.join(" — "));
      });
      body.push("");
    }
    sections.push({ head: L("我的复刻进度", "My playbooks in progress"), body });
  }

  sections.forEach((s, i) => {
    out.push(`## ${CN[i] ?? i + 1}、${s.head}`, "", ...s.body);
  });

  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}
