import pathsData from "@/data/paths.json";
import skillsData from "@/data/skills.json";
import promptsData from "@/data/prompts.json";
import termsData from "@/data/terms.json";
import explainersData from "@/data/explainers.json";
import coursesData from "@/data/courses.json";

export type AssetType = "course" | "chapter" | "prompt" | "skill" | "term" | "style" | "explainer";

export type AssetRef = {
  type: AssetType;
  id: string;
  note?: string;
};

export type PathStep = {
  title: string;
  why: string;
  assets: AssetRef[];
  done: string;
};

export type PathEntry = {
  id: string;
  order: number;
  kicker: string;
  name: string;
  tagline: string;
  outcome: string;
  outcomeShort: string;
  audience: string;
  prereq: string;
  duration: string;
  steps: PathStep[];
  finish: string[];
  next?: string;
};

export type ResolvedAsset = {
  key: string;
  type: AssetType;
  typeLabel: string;
  title: string;
  href: string;
  note?: string;
};

type TermRow = { slug: string; name: string; en?: string };
type SkillRow = { id: string; name: string };
type PromptRow = { id: string; name: string };
type ExplainerRow = { title: string };
type ChapterRow = { title: string };

const PATHS = (pathsData as unknown as { paths: PathEntry[] }).paths;

const TERMS = new Map(
  (termsData as unknown as TermRow[]).map((t) => [t.slug, t])
);
const SKILLS = new Map<string, SkillRow>();
for (const cat of (skillsData as unknown as { categories: { skills: SkillRow[] }[] }).categories) {
  for (const s of cat.skills) SKILLS.set(s.id, s);
}
const PROMPTS = new Map<string, PromptRow>();
for (const cat of (promptsData as unknown as { categories: { prompts: PromptRow[] }[] }).categories) {
  for (const p of cat.prompts) PROMPTS.set(p.id, p);
}
const EXPLAINERS = explainersData as unknown as Record<string, ExplainerRow>;
const COURSES = coursesData as unknown as {
  [course: string]: { title?: string; kind?: string };
  chapters: Record<string, ChapterRow>;
};

const TYPE_LABELS: Record<AssetType, string> = {
  course: "课程",
  chapter: "章节",
  prompt: "提示词",
  skill: "技能",
  term: "概念",
  style: "风格",
  explainer: "专题",
};

function cleanTitle(title?: string): string {
  return (title ?? "").split("｜")[0].trim();
}

export function resolveAsset(asset: AssetRef): ResolvedAsset | null {
  const key = `${asset.type}:${asset.id}`;
  let title = "";
  let href = "";

  switch (asset.type) {
    case "course": {
      const course = COURSES[asset.id];
      if (!course?.title) return null;
      title = cleanTitle(course.title);
      href = `/courses/${asset.id}`;
      break;
    }
    case "chapter": {
      const chapter = COURSES.chapters[asset.id];
      if (!chapter) return null;
      title = cleanTitle(chapter.title);
      href = `/courses/${asset.id}`;
      break;
    }
    case "prompt": {
      const prompt = PROMPTS.get(asset.id);
      if (!prompt) return null;
      title = prompt.name;
      href = `/prompts/${asset.id}`;
      break;
    }
    case "skill": {
      const skill = SKILLS.get(asset.id);
      if (!skill) return null;
      title = skill.name;
      href = `/skills/${asset.id}`;
      break;
    }
    case "term":
    case "style": {
      const term = TERMS.get(asset.id);
      if (!term) return null;
      title = term.en ? `${term.name} · ${term.en}` : term.name;
      href = `/${asset.id}`;
      break;
    }
    case "explainer": {
      const explainer = EXPLAINERS[asset.id];
      if (!explainer) return null;
      title = explainer.title;
      href = `/explains/${asset.id}`;
      break;
    }
  }

  return {
    key,
    type: asset.type,
    typeLabel: TYPE_LABELS[asset.type],
    title,
    href,
    note: asset.note,
  };
}

export function resolveStep(step: PathStep) {
  const assets = step.assets
    .map(resolveAsset)
    .filter((a): a is ResolvedAsset => Boolean(a));
  return { ...step, assets };
}

export function resolvePath(path: PathEntry) {
  const steps = path.steps.map(resolveStep);
  const seen = new Set<string>();
  const assets: ResolvedAsset[] = [];
  for (const step of steps) {
    for (const asset of step.assets) {
      if (seen.has(asset.key)) continue;
      seen.add(asset.key);
      assets.push(asset);
    }
  }
  return { ...path, steps, assets };
}

export function allPaths() {
  return PATHS.slice().sort((a, b) => a.order - b.order);
}

export function pathById(id: string): PathEntry | undefined {
  return PATHS.find((p) => p.id === id);
}

export function nextPath(path: PathEntry): PathEntry | undefined {
  return path.next ? pathById(path.next) : undefined;
}

export function assetGroups(assets: ResolvedAsset[]) {
  const order: AssetType[] = ["course", "chapter", "prompt", "skill", "term", "style", "explainer"];
  return order
    .map((type) => ({
      type,
      label: TYPE_LABELS[type],
      items: assets.filter((a) => a.type === type),
    }))
    .filter((g) => g.items.length > 0);
}

export type CourseEntry = { id: string; title: string; chapters: number; href: string };

/** 全部课程及章数；「课程」已从菜单收进路径，这里给路径页挂教材入口用 */
export function courseList(): CourseEntry[] {
  const raw = COURSES as unknown as Record<string, { title?: string }>;
  const chapterKeys = Object.keys(COURSES.chapters ?? {});
  return Object.entries(raw)
    .filter(([id, v]) => id !== "index" && id !== "chapters" && v?.title)
    .map(([id, v]) => ({
      id,
      title: cleanTitle(v.title),
      chapters: chapterKeys.filter((k) => k.startsWith(`${id}/`)).length,
      href: `/courses/${id}`,
    }));
}

/** 这门课在这条路径里被当成教材引进来了吗 */
export function pathCourses(resolved: { assets: ResolvedAsset[] }): (CourseEntry & { usedChapters: number })[] {
  const out: (CourseEntry & { usedChapters: number })[] = [];
  for (const c of courseList()) {
    if (!resolved.assets.some((a) => a.type === "course" && a.href === c.href)) continue;
    out.push({
      ...c,
      usedChapters: resolved.assets.filter((a) => a.type === "chapter" && a.href.startsWith(`/courses/${c.id}/`)).length,
    });
  }
  return out;
}
