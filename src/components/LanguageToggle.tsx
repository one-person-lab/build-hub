"use client";

import { usePathname, useRouter } from "next/navigation";

type Locale = "zh" | "en";

const LABEL: Record<Locale, string> = { zh: "切换为中文", en: "Switch to English" };

// 英文站没做这些分区，硬加 /en 前缀会落到 404，切过去时直接进英文首页
const NO_EN_SECTION = new Set([
  "paths",
  "stack",
  "explains",
  "playbooks",
  "principles",
  "courses",
  "forks",
]);

export default function LanguageToggle({
  locale,
  className,
}: {
  locale: Locale;
  className: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const next: Locale = locale === "zh" ? "en" : "zh";

  // 语言由 URL 前缀 /en 决定，cookie 仅作记录
  function go() {
    document.cookie = `vibehub-locale=${next}; path=/; max-age=31536000`;
    if (next === "en") {
      const section = pathname.split("/")[1];
      router.push(pathname === "/" || NO_EN_SECTION.has(section) ? "/en" : `/en${pathname}`);
    } else {
      router.push(pathname.replace(/^\/en(?=\/|$)/, "") || "/");
    }
  }

  return (
    <button
      type="button"
      className={className}
      onClick={go}
      aria-label={LABEL[next]}
      title={LABEL[next]}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <ellipse cx="12" cy="12" rx="4.2" ry="9" />
        <path d="M3.4 8.6h17.2M3.4 15.4h17.2" />
      </svg>
      <span>{next === "zh" ? "中文" : "English"}</span>
    </button>
  );
}
