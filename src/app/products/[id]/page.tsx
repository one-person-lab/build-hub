import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ProductDetailView, { type ProductDetail } from "@/components/ProductDetailView";
import productsData from "@/data/products.json";

type RawProduct = ProductDetail;
type RawCategory = { key: string; label: string; products: RawProduct[] };
type RawLib = { title: string; subtitle: string; categories: RawCategory[] };

const LIB = productsData as unknown as RawLib;

const byId = new Map<string, { product: RawProduct; label: string }>();
for (const c of LIB.categories) {
  for (const p of c.products) byId.set(p.id, { product: p, label: c.label });
}

export function generateStaticParams() {
  return LIB.categories.flatMap((c) => c.products.map((p) => ({ id: p.id })));
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
    title: `${entry.product.name} 好在哪｜产品图鉴 · BuildHub`,
    description: entry.product.tagline,
    openGraph: {
      title: `${entry.product.name}｜产品图鉴`,
      description: entry.product.tagline,
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const entry = byId.get(id);
  if (!entry) notFound();
  const { product, label } = entry;
  const categories = LIB.categories.map((c) => ({ key: c.key, label: c.label }));
  return (
    <ProductDetailView
      product={product}
      locale="zh"
      categoryLabel={label}
      backHref="/products"
      categories={categories}
      currentCategory={product.category}
    />
  );
}
