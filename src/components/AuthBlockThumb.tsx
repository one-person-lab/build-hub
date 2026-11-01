"use client";

import { useEffect, useRef, useState } from "react";
import "./AuthBlockThumb.css";

/** auth block 的固定画布尺寸：所有 block 都按这个尺寸设计，再整体缩放进取景框 */
export const AUTH_BLOCK_W = 1056;
export const AUTH_BLOCK_H = 660;
/** footer block 的画布：页脚横着铺满、竖向收得很扁，比认证页更宽更矮 */
export const FOOTER_BLOCK_W = 1200;
export const FOOTER_BLOCK_H = 560;

export default function AuthBlockThumb({
  src,
  title,
  w = AUTH_BLOCK_W,
  h = AUTH_BLOCK_H,
  zoom = 1,
  interactive = false,
  className = "",
}: {
  src: string;
  title: string;
  /** 预览页按这套固定尺寸排版；缩略图与弹层都靠它算缩放 */
  w?: number;
  h?: number;
  /** >1 时居中放大裁切：给「内容只占画布一小块」的窄卡片用，缩略图里能看清 */
  zoom?: number;
  /** 弹层里用：允许在 iframe 内点按、输入 */
  interactive?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ scale: number; x: number; y: number } | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      const cw = el.clientWidth;
      const ch = el.clientHeight;
      if (cw <= 0) return;
      const scale = (cw * zoom) / w;
      setBox({
        scale,
        x: (cw - w * scale) / 2,
        y: (ch - h * scale) / 2,
      });
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [w, h, zoom]);

  return (
    <div
      ref={ref}
      className={`auth-block-thumb${interactive ? " is-live" : ""}${className ? ` ${className}` : ""}`}
      style={{ aspectRatio: `${w} / ${h}` }}
    >
      <iframe
        src={src}
        title={title}
        loading="lazy"
        scrolling="no"
        tabIndex={interactive ? undefined : -1}
        aria-hidden={interactive ? undefined : true}
        style={
          box
            ? {
                width: w,
                height: h,
                transform: `translate(${box.x}px, ${box.y}px) scale(${box.scale})`,
              }
            : { visibility: "hidden" }
        }
      />
    </div>
  );
}
