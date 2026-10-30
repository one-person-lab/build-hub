import type { Metadata } from "next";
import CatalogView from "@/components/CatalogView";

export const metadata: Metadata = {
  title: "技术选型｜BuildHub · 主流技术怎么选",
  description:
    "按层给出默认答案和例外：数据库、缓存、消息、Java 框架、大数据、容器编排，每个技术写清什么时候选、什么时候别选、常见替代和面试怎么答。",
  openGraph: {
    title: "技术选型｜BuildHub",
    description: "SQLite / MySQL / PostgreSQL / Redis / Kafka / Spring Boot / k8s：默认答案、例外条件和面试答法。",
  },
};

export default function StackPage() {
  return <CatalogView catalogKey="stack" />;
}
