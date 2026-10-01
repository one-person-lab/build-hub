import { notFound } from "next/navigation";
import CatalogView from "@/components/CatalogView";
import catalogsData from "@/data/catalogs.json";
import type { Catalog } from "@/lib/types";

const CATALOGS = catalogsData as Catalog[];

// 设计、原理已独立为顶级路由，不再走 /topics
const STANDALONE = new Set(["design", "principles"]);
const TOPIC_CATALOGS = CATALOGS.filter((c) => !STANDALONE.has(c.key));

export function generateStaticParams() {
  return TOPIC_CATALOGS.map((c) => ({ key: c.key }));
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  const catalog = TOPIC_CATALOGS.find((c) => c.key === key);
  if (!catalog) notFound();
  return <CatalogView catalogKey={key} />;
}
