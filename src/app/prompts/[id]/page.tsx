import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PromptDetailView, {
  type PromptDetail,
} from "@/components/PromptDetailView";
import promptsData from "@/data/prompts.json";

type RawPrompt = {
  id: string;
  category: string;
  name: string;
  tagline: string;
  prompt: string;
  why: string[];
  example: string;
  pitfalls: string[];
  bestFor: string;
  models: string;
  tags?: string[];
};
type RawCategory = { key: string; label: string; prompts: RawPrompt[] };
type RawLib = { title: string; subtitle: string; categories: RawCategory[] };

const LIB = promptsData as unknown as RawLib;

const byId = new Map<string, { prompt: RawPrompt; label: string }>();
for (const c of LIB.categories) {
  for (const p of c.prompts) byId.set(p.id, { prompt: p, label: c.label });
}

export function generateStaticParams() {
  return LIB.categories.flatMap((c) => c.prompts.map((p) => ({ id: p.id })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const entry = byId.get(id);
  if (!entry) return {};
  return {
    title: `${entry.prompt.name}｜提示词库 · BuildHub`,
    description: entry.prompt.tagline,
    openGraph: {
      title: `${entry.prompt.name}｜提示词库`,
      description: entry.prompt.tagline,
    },
  };
}

export default async function PromptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const entry = byId.get(id);
  if (!entry) notFound();
  const { prompt, label } = entry;
  const categories = LIB.categories.map((c) => ({ key: c.key, label: c.label }));
  return (
    <PromptDetailView
      prompt={prompt as PromptDetail}
      locale="zh"
      categoryLabel={label}
      backHref="/prompts"
      categories={categories}
      currentCategory={prompt.category}
    />
  );
}
