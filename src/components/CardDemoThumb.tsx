"use client";

import { useEffect, useRef } from "react";

export default function CardDemoThumb({
  demoHtml,
  demoClass,
}: {
  demoHtml?: string;
  demoClass?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      const host = el.querySelector<HTMLElement>(".scaled-preview") ?? el;
      const canvas = el.querySelector<HTMLElement>(".scaled-preview-canvas");
      if (!canvas) return;
      const w = parseFloat(getComputedStyle(canvas).width) || 640;
      if (el.clientWidth > 0 && w > 0)
        host.style.setProperty("--preview-scale", String(el.clientWidth / w));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [demoHtml]);

  if (!demoHtml) return null;
  return (
    <div className="card-thumb" ref={ref}>
      <div
        className={demoClass || "card-demo"}
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: demoHtml }}
      />
    </div>
  );
}
