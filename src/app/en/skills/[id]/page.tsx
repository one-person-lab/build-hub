import { notFound } from "next/navigation";
import type { Metadata } from "next";
import SkillDetailView, { type SkillDetail } from "@/components/SkillDetailView";
import enSkillsData from "@/data/en-skills.json";

type RawSkill = {
  id: string;
  category: string;
  name: string;
  tagline: string;
  overview: string;
  features: string[];
  useCases: string[];
  bestFor: string;
  pricing: string;
  platform: string;
  author?: string;
  official?: string;
  repo?: string;
  tags?: string[];
};
type RawCategory = { key: string; label: string; skills: RawSkill[] };
type RawLib = { title: string; subtitle: string; categories: RawCategory[] };

const LIB = enSkillsData as unknown as RawLib;

const byId = new Map<string, { skill: RawSkill; label: string }>();
for (const c of LIB.categories) {
  for (const s of c.skills) byId.set(s.id, { skill: s, label: c.label });
}

export function generateStaticParams() {
  return LIB.categories.flatMap((c) => c.skills.map((s) => ({ id: s.id })));
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
    title: `${entry.skill.name}｜Skill Library · BuildHub`,
    description: entry.skill.tagline,
    openGraph: {
      title: `${entry.skill.name}｜Skill Library`,
      description: entry.skill.tagline,
    },
  };
}

export default async function EnSkillDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const entry = byId.get(id);
  if (!entry) notFound();
  const { skill, label } = entry;
  const categories = LIB.categories.map((c) => ({ key: c.key, label: c.label }));
  return (
    <SkillDetailView
      skill={skill as SkillDetail}
      locale="en"
      categoryLabel={label}
      backHref="/en/skills"
      categories={categories}
      currentCategory={skill.category}
    />
  );
}
