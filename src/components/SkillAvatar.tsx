"use client";

import { useState } from "react";

function hostOf(url?: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

// 用站点官方域名的 favicon 当「真实 logo」；支持 per-skill logo 覆盖。
// 加载失败时（onError）回退到首字母 monogram。
function faviconFor(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}

export default function SkillAvatar({
  name,
  logo,
  official,
  repo,
  className = "",
}: {
  name: string;
  logo?: string;
  official?: string;
  repo?: string;
  className?: string;
}) {
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  const domain = logo ? null : hostOf(official || repo);
  const src = logo || (domain ? faviconFor(domain) : null);
  const [errored, setErrored] = useState(false);

  return (
    <span className={className} aria-hidden="true">
      {src && !errored ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} loading="lazy" onError={() => setErrored(true)} />
      ) : (
        <span className="skill-avatar-initial">{initial}</span>
      )}
    </span>
  );
}
