import skillsData from "@/data/skills.json";
import enSkillsData from "@/data/en-skills.json";
import productsData from "@/data/products.json";
import enProductsData from "@/data/en-products.json";

export type RelatedItem = {
  id: string;
  kind: "skill" | "product";
  name: string;
  tagline: string;
  categoryLabel: string;
  href: string;
  logo?: string;
};

type RawEntry = { id: string; name: string; tagline: string; logo?: string };
type RawCategory = {
  key: string;
  label: string;
  skills?: RawEntry[];
  products?: RawEntry[];
};
type RawLib = { categories: RawCategory[] };

const LOCALES = {
  zh: {
    skills: skillsData as unknown as RawLib,
    products: productsData as unknown as RawLib,
    prefix: "",
  },
  en: {
    skills: enSkillsData as unknown as RawLib,
    products: enProductsData as unknown as RawLib,
    prefix: "/en",
  },
} as const;

const indexes = new Map<keyof typeof LOCALES, Map<string, RelatedItem>>();

function buildIndex(locale: keyof typeof LOCALES) {
  const { skills, products, prefix } = LOCALES[locale];
  const idx = new Map<string, RelatedItem>();
  const add = (
    lib: RawLib,
    listKey: "skills" | "products",
    kind: RelatedItem["kind"]
  ) => {
    for (const c of lib.categories) {
      for (const item of c[listKey] ?? []) {
        if (!idx.has(item.id)) {
          idx.set(item.id, {
            id: item.id,
            kind,
            name: item.name,
            tagline: item.tagline,
            categoryLabel: c.label,
            href: `${prefix}/${listKey}/${item.id}`,
            logo: item.logo,
          });
        }
      }
    }
  };
  add(skills, "skills", "skill");
  add(products, "products", "product");
  return idx;
}

export function resolveRelated(
  ids: string[] | undefined,
  locale: keyof typeof LOCALES,
  selfId?: string
): RelatedItem[] {
  if (!ids || ids.length === 0) return [];
  let idx = indexes.get(locale);
  if (!idx) {
    idx = buildIndex(locale);
    indexes.set(locale, idx);
  }
  return ids
    .filter((id) => id !== selfId)
    .map((id) => idx.get(id))
    .filter((item): item is RelatedItem => Boolean(item));
}
