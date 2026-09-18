"use client";

import { useState } from "react";

export default function SkillCover({
  name,
  categoryLabel,
  cover,
}: {
  name: string;
  categoryLabel: string;
  cover?: string;
}) {
  const [errored, setErrored] = useState(false);

  if (cover && !errored) {
    return (
      <div className="skill-detail-cover">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cover}
          alt={name}
          loading="lazy"
          onError={() => setErrored(true)}
        />
      </div>
    );
  }

  // 无封面图时，用主题色渐变占位，并展示分类名
  return (
    <div className="skill-detail-cover skill-detail-cover-gradient" aria-hidden="true">
      <span className="skill-detail-cover-cat">{categoryLabel}</span>
    </div>
  );
}
