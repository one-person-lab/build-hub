"use client";

import { useEffect, useRef, useState } from "react";
import NavDemo from "./NavDemo";
import "./NavDemo.css";

export default function NavDemoThumb({
  slug,
  interactive = false,
  className = "",
}: {
  slug: string;
  interactive?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => setScale(el.clientWidth / 1116);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`nd-thumb${interactive ? "" : " is-still"}${className ? ` ${className}` : ""}`}
    >
      <div
        className="nd-scale"
        style={scale ? { transform: `scale(${scale})` } : { visibility: "hidden" }}
        aria-hidden={interactive ? undefined : true}
      >
        <NavDemo slug={slug} />
      </div>
    </div>
  );
}
