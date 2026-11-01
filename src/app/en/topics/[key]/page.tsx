import { notFound } from "next/navigation";
import CatalogView from "@/components/CatalogView";
import enCatalogsData from "@/data/en-catalogs.json";
import type { Catalog } from "@/lib/types";

const CATALOGS = enCatalogsData as Catalog[];

// 设计、动效已独立为顶级 /en 路由，不再走 /topics
const TOPIC_CATALOGS = CATALOGS.filter((c) => c.key !== "design" && c.key !== "motion");

export function generateStaticParams() {
  return TOPIC_CATALOGS.map((c) => ({ key: c.key }));
}

export default async function EnTopicPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  const catalog = TOPIC_CATALOGS.find((c) => c.key === key);
  if (!catalog) notFound();
  return <CatalogView catalogKey={key} locale="en" />;
}
