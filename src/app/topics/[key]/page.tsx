import { notFound } from "next/navigation";
import CatalogView from "@/components/CatalogView";
import catalogsData from "@/data/catalogs.json";
import type { Catalog } from "@/lib/types";

const CATALOGS = catalogsData as Catalog[];

export function generateStaticParams() {
  return CATALOGS.filter((c) => c.key !== "frontend").map((c) => ({ key: c.key }));
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  const catalog = CATALOGS.find((c) => c.key === key);
  if (!catalog) notFound();
  return <CatalogView catalogKey={key} />;
}
