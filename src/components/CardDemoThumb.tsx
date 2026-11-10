"use client";

import { useEffect, useRef } from "react";

export default function CardDemoThumb({
  demoHtml,
  demoClass,
  img,
  video,
}: {
  demoHtml?: string;
  demoClass?: string;
  img?: string;
  video?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

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

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    // 一屏里可能有几十个视频，只让进入视口的那个播，滚走就暂停
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void v.play().catch(() => {});
        else v.pause();
      },
      { threshold: 0.25 }
    );
    io.observe(v);
    return () => io.disconnect();
  }, [video]);

  if (video) {
    return (
      <div className="card-thumb">
        <video
          ref={videoRef}
          className="card-thumb-img card-thumb-video"
          src={video}
          poster={img}
          muted
          loop
          playsInline
          preload="none"
          aria-hidden="true"
        />
      </div>
    );
  }
  if (img) {
    return (
      <div className="card-thumb">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="card-thumb-img" src={img} alt="" loading="lazy" />
      </div>
    );
  }
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
