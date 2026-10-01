import type { Metadata } from "next";
import CatalogView from "@/components/CatalogView";

export const metadata: Metadata = {
  title: "原理｜BuildHub · AI 是怎么把事做成的",
  description:
    "把 RAG、分块、向量化、重排、ReAct 这些 AI 应用黑话讲到底：每条都配运行流程图，说清它在哪一步起作用、做错了会是什么症状。",
  openGraph: {
    title: "原理｜BuildHub",
    description: "RAG、分块、向量化、重排与 ReAct 的工作原理，配流程图讲给不会写代码的人。",
  },
};

export default function PrinciplesPage() {
  return <CatalogView catalogKey="principles" />;
}
