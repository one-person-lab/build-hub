"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "./FigureFrame.css";

/** 图的高度由图内文量出来，页面不给每张图写死 vh */
export function useFigureHeight(ref: React.RefObject<HTMLIFrameElement | null>) {
  const [h, setH] = useState(0);
  const measure = useCallback(() => {
    const doc = ref.current?.contentDocument;
    if (!doc) return;
    const next = Math.ceil(doc.documentElement.getBoundingClientRect().height) + 2;
    if (next > 2) setH(next);
  }, [ref]);
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const d = e.data as { __expFigure?: boolean; height?: number } | null;
      if (!d?.__expFigure || typeof d.height !== "number") return;
      if (e.source !== ref.current?.contentWindow) return;
      setH(Math.ceil(d.height) + 2);
    };
    window.addEventListener("message", onMsg);
    const t = window.setTimeout(measure, 400);
    return () => {
      window.removeEventListener("message", onMsg);
      window.clearTimeout(t);
    };
  }, [measure, ref]);
  return { h, measure };
}

export default function FigureFrame({ src, title }: { src: string; title: string }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const { h, measure } = useFigureHeight(ref);
  return (
    <div className="fig-frame" style={h ? { height: h } : undefined}>
      <iframe ref={ref} src={src} title={title} onLoad={measure} />
    </div>
  );
}
