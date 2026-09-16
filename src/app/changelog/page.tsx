import type { Metadata } from "next";
import RawPageView, { getRawTitle } from "@/components/RawPageView";

export const metadata: Metadata = { title: getRawTitle("changelog") ?? "更新日志" };

export default function ChangelogPage() {
  return <RawPageView pageKey="changelog" />;
}
