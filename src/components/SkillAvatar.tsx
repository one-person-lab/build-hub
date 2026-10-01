"use client";

import { useState } from "react";

// 卡片头像：logo 一律用本地镜像（见 scripts/fetch-logos.mjs）。
// 缺失或加载失败时回退到首字母 monogram，不做远程兜底——
// 跨域直链会让格子空等几百毫秒，兜底域名在大陆网络下还会整片落空。
export default function SkillAvatar({
  name,
  logo,
  className = "",
}: {
  name: string;
  logo?: string;
  className?: string;
}) {
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  const [errored, setErrored] = useState(false);

  return (
    <span className={className} aria-hidden="true">
      {logo && !errored ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt={name} loading="lazy" onError={() => setErrored(true)} />
      ) : (
        <span className="skill-avatar-initial">{initial}</span>
      )}
    </span>
  );
}
