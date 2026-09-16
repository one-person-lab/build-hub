import { notFound } from "next/navigation";
import CatalogView from "@/components/CatalogView";
import enCatalogsData from "@/data/en-catalogs.json";
import type { Catalog } from "@/lib/types";

const CATALOGS = enCatalogsData as Catalog[];

export function generateStaticParams() {
  return CATALOGS.filter((c) => c.key !== "frontend").map((c) => ({ key: c.key }));
}

export default async function EnTopicPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  const catalog = CATALOGS.find((c) => c.key === key);
  if (!catalog) notFound();
  return <CatalogView catalogKey={key} locale="en" />;
}
