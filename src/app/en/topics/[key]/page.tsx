import { notFound } from "next/navigation";
import CatalogView from "@/components/CatalogView";
import enCatalogsData from "@/data/en-catalogs.json";
import type { Catalog } from "@/lib/types";

const CATALOGS = enCatalogsData as Catalog[];

// 设计分区已独立为顶级 /en/design，不再走 /topics 路由
const TOPIC_CATALOGS = CATALOGS.filter((c) => c.key !== "design");

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
