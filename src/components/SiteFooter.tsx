"use client";

import { usePathname } from "next/navigation";
import chromeData from "@/data/chrome.json";
import enChromeData from "@/data/en-chrome.json";

export default function SiteFooter() {
  const pathname = usePathname();
  const isEn = pathname === "/en" || pathname.startsWith("/en/");
  const chrome = (isEn ? enChromeData : chromeData) as { footerHtml: string };
  return <div dangerouslySetInnerHTML={{ __html: chrome.footerHtml }} />;
}
