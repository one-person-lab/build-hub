"use client";

import { useEffect, useRef, useState } from "react";
import MotionPromptButton from "@/components/MotionPromptButton";
import "./MotionCarouselDemo.css";

const CARDS = [
  { src: "/assets/motion/dune.png", alt: "Golden dunes" },
  { src: "/assets/motion/forest.png", alt: "Misty forest" },
  { src: "/assets/motion/citrus.png", alt: "Citrus still life" },
];

const DEFAULTS = { float: 15, sink: 50, settle: 50, spread: 138, depth: 100, corner: 18 };
type Params = typeof DEFAULTS;
type ParamKey = keyof Params;

// 量程与步进对齐 bencho.dev 的 carousel 控制面板
const PARAM_META: { key: ParamKey; label: string; min: number; max: number; step: number; unit?: string }[] = [
  { key: "float", label: "Float", min: 0, max: 100, step: 5 },
  { key: "sink", label: "Sink", min: 0, max: 100, step: 5 },
  { key: "settle", label: "Settle", min: 0, max: 100, step: 5 },
  { key: "spread", label: "Spread", min: 110, max: 150, step: 2, unit: "px" },
  { key: "depth", label: "Depth", min: 0, max: 150, step: 5 },
  { key: "corner", label: "Corner", min: 0, max: 40, step: 2, unit: "px" },
];

const UI_TEXT = {
  zh: {
    play: "自动演示",
    pause: "暂停演示",
    hint: "移动指针、拖拽或点击卡片试试",
    share: "复制链接",
    copied: "已复制",
    prompt: "复制提示词",
  },
  en: {
    play: "Auto demo",
    pause: "Pause",
    hint: "Move the pointer, drag or click a card",
    share: "Copy link",
    copied: "Copied",
    prompt: "Copy prompt",
  },
};

const paramLine = (p: Params) =>
  `float=${p.float} sink=${p.sink} settle=${p.settle} spread=${p.spread}px depth=${p.depth} corner=${p.corner}px`;

const PROMPT_ZH = (demoUrl: string, p: Params) => `请帮我复刻一个交互动画。先打开下面的参考链接，实际观看动画效果，再按它的交互形式 1:1 实现：

- 参考原版动画：https://bencho.dev/?c=carousel&theme=light
- 我的还原版（可交互 live demo，URL 带当前参数）：${demoUrl}

动画形态：三张竖版照片卡组成的轮播。中间卡直立在前、略微左旋；两侧卡后退、缩小并反向旋转；指针在舞台内移动时卡片跟随视差；悬停某张卡时其余卡下沉缩小；拖拽超过阈值或点击侧卡换卡；右下角按钮开关自动演示循环。
控制面板：Float / Sink / Settle / Spread / Depth / Corner 六个参数，整行即滑杆、右侧显示当前值；参数实时写入 URL，分享链接可完整恢复现场。
当前参数：${paramLine(p)}

要求：用 React + CSS 实现（不依赖第三方轮播库），图片素材自有，不要搬运参考网站的任何素材与代码。`;

const PROMPT_EN = (demoUrl: string, p: Params) => `Please recreate an interactive animation for me. First open the reference links below and actually watch the motion, then implement its interaction form 1:1:

- Original reference animation: https://bencho.dev/?c=carousel&theme=light
- My recreation (interactive live demo, URL carries current params): ${demoUrl}

The animation: a carousel of three portrait photo cards. The center card stands upright in front, slightly rotated left; side cards recede, shrink and rotate the opposite way. Cards follow the pointer with parallax inside the stage; hovering one card sinks and shrinks the others; drag past a threshold or click a side card to swap; a bottom-right button toggles the auto-demo loop.
Control panel: six params — Float / Sink / Settle / Spread / Depth / Corner — each row is the slider itself with the live value on the right; params sync to the URL in real time so a shared link restores the exact scene.
Current params: ${paramLine(p)}

Requirements: implement with React + CSS (no third-party carousel library), use your own imagery, and do not copy any assets or code from the reference site.`;

type CardAnim = { x: number; y: number; r: number; s: number };

// 初始参数取自 URL（bencho 同款深链：?c=carousel&float=..&sink=..）。
// 必须在 useState 初始化器里读：放到 effect 里会被「参数写回 URL」的 effect 抢先覆盖成默认值。
function initialParams(): Params {
  const next = { ...DEFAULTS };
  const q = new URLSearchParams(window.location.search);
  if (q.get("c") === "carousel") {
    for (const m of PARAM_META) {
      const raw = q.get(m.key);
      if (raw === null) continue;
      const v = Number(raw);
      if (Number.isFinite(v) && v >= m.min && v <= m.max) next[m.key] = Math.round(v);
    }
  }
  return next;
}

export default function MotionCarouselDemo({
  locale = "zh",
  name,
  en,
  tagline,
}: {
  locale?: "zh" | "en";
  name: string;
  en?: string;
  tagline?: string;
}) {
  const T = UI_TEXT[locale];
  const [params, setParams] = useState<Params>(initialParams);
  const [front, setFront] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [copied, setCopied] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const animRef = useRef<CardAnim[]>(CARDS.map(() => ({ x: 0, y: 0, r: 0, s: 1 })));
  const paramsRef = useRef(params);
  const frontRef = useRef(front);
  const hoverRef = useRef(-1);
  const dragRef = useRef({ idx: -1, startX: 0, dx: 0 });
  const pointerRef = useRef({ x: 0, y: 0, inside: false });
  paramsRef.current = params;
  frontRef.current = front;

  // 参数变化实时写回 URL（bencho 交付形式：链接即现场）
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("c") !== "carousel") return;
    for (const m of PARAM_META) q.set(m.key, String(params[m.key]));
    window.history.replaceState(null, "", `${window.location.pathname}?${q}`);
  }, [params]);

  // 自动演示循环
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => setFront((f) => (f + 2) % 3), 1800);
    return () => window.clearInterval(id);
  }, [playing]);

  // 主动画循环：目标位姿由参数/指针/悬停/拖拽算出，settle 控制趋近速度
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(now - last, 50);
      last = now;
      const p = paramsRef.current;
      const stage = stageRef.current;
      if (!stage) return;
      const narrow = stage.clientWidth < 520 ? 0.68 : 1;
      const f = frontRef.current;
      const hover = hoverRef.current;
      const ptr = pointerRef.current;
      const k = reduced ? 1 : 1 - Math.exp(-dt * (0.004 + p.settle * 0.00012));
      CARDS.forEach((_, i) => {
        const slot = (i - f + 3) % 3; // 0 前卡 1 右后 2 左后
        const par = slot === 0 ? 1 : 0.55;
        let tx = slot === 1 ? p.spread * narrow : slot === 2 ? -p.spread * narrow : 0;
        let ty = slot === 1 ? 10 : slot === 2 ? 6 : 0;
        let tr = slot === 0 ? -3 : slot === 1 ? 7 : -8;
        let ts = slot === 0 ? 1 : 1 - p.depth * (slot === 1 ? 0.0012 : 0.0016);
        if (!reduced) {
          ty += Math.sin(now * 0.0018 + i * 2.4) * p.float * 0.18;
          tr += Math.sin(now * 0.0013 + i * 1.7) * p.float * 0.03;
        }
        if (ptr.inside) {
          tx += ptr.x * 18 * par;
          ty += ptr.y * 10 * par;
        }
        if (hover >= 0 && i !== hover) {
          ty += p.sink * 0.22;
          ts -= p.sink * 0.0009;
        }
        if (hover >= 0 && i === hover) ts += 0.03;
        if (dragRef.current.idx === i && slot === 0) {
          tx += dragRef.current.dx;
          tr += dragRef.current.dx * 0.02;
        }
        const a = animRef.current[i];
        a.x += (tx - a.x) * k;
        a.y += (ty - a.y) * k;
        a.r += (tr - a.r) * k;
        a.s += (ts - a.s) * k;
        const el = cardRefs.current[i];
        if (!el) return;
        el.style.transform = `translate3d(${a.x}px, ${a.y}px, 0) rotate(${a.r}deg) scale(${a.s})`;
        el.style.zIndex = String(30 - slot * 10);
      });
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const onStagePointerMove = (e: React.PointerEvent) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    pointerRef.current = {
      x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
      y: ((e.clientY - rect.top) / rect.height) * 2 - 1,
      inside: true,
    };
  };

  const onCardPointerDown = (i: number) => (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { idx: i, startX: e.clientX, dx: 0 };
  };
  const onCardPointerMove = (i: number) => (e: React.PointerEvent) => {
    if (dragRef.current.idx !== i) return;
    dragRef.current.dx = e.clientX - dragRef.current.startX;
  };
  const onCardPointerUp = (i: number) => (e: React.PointerEvent) => {
    const { dx } = dragRef.current;
    dragRef.current = { idx: -1, startX: 0, dx: 0 };
    if (Math.abs(dx) > 60) {
      setFront(dx > 0 ? (i + 1) % 3 : (i + 2) % 3);
      return;
    }
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    const inside =
      e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
    if (!inside) return;
    if ((i - frontRef.current + 3) % 3 !== 0) setFront(i);
  };

  const shareUrl = () => {
    const q = new URLSearchParams({
      c: "carousel",
      ...Object.fromEntries(PARAM_META.map((m) => [m.key, String(params[m.key])])),
    });
    return `${window.location.origin}${window.location.pathname}?${q}`;
  };

  const writeClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="mcd">
      <div className="mcd-layout">
        <div
          ref={stageRef}
          className="mcd-stage"
          style={{ "--mcd-corner": `${params.corner}px` } as React.CSSProperties}
          onPointerMove={onStagePointerMove}
          onPointerLeave={() => (pointerRef.current.inside = false)}
        >
          {CARDS.map((c, i) => (
            <div
              key={c.src}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              className="mcd-card"
              onPointerEnter={() => (hoverRef.current = i)}
              onPointerLeave={() => {
                if (hoverRef.current === i) hoverRef.current = -1;
              }}
              onPointerDown={onCardPointerDown(i)}
              onPointerMove={onCardPointerMove(i)}
              onPointerUp={onCardPointerUp(i)}
            >
              <img src={c.src} alt={c.alt} draggable={false} loading="lazy" />
            </div>
          ))}
          <button
            type="button"
            className="mcd-play"
            aria-label={playing ? T.pause : T.play}
            title={playing ? T.pause : T.play}
            aria-pressed={playing}
            onClick={() => setPlaying((v) => !v)}
          >
            {playing ? (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="6" y="5" width="4" height="14" rx="1.5" />
                <rect x="14" y="5" width="4" height="14" rx="1.5" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8 5.5v13a1 1 0 0 0 1.53.85l10.2-6.5a1 1 0 0 0 0-1.7L9.53 4.65A1 1 0 0 0 8 5.5Z" />
              </svg>
            )}
          </button>
          <span className="mcd-hint">{T.hint}</span>
        </div>

        <div className="mcd-panel">
          <div className="mcd-panel-head">
            <h3>
              {name}
              {en ? <span>{en}</span> : null}
            </h3>
            {tagline ? <p>{tagline}</p> : null}
          </div>
          <div className="mcd-params">
            {PARAM_META.map((m) => {
              const v = params[m.key];
              return (
                <label
                  className="mcd-param"
                  key={m.key}
                  style={{ "--pct": `${((v - m.min) / (m.max - m.min)) * 100}%` } as React.CSSProperties}
                >
                  <span className="mcd-param-label">{m.label}</span>
                  <span className="mcd-param-value">
                    {v}
                    {m.unit}
                  </span>
                  <input
                    type="range"
                    min={m.min}
                    max={m.max}
                    step={m.step}
                    value={v}
                    aria-label={m.label}
                    onChange={(e) => setParams((prev) => ({ ...prev, [m.key]: Number(e.target.value) }))}
                  />
                </label>
              );
            })}
          </div>
          <div className="mcd-actions">
            <button type="button" className="mcd-share" onClick={() => writeClipboard(shareUrl())}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <path d="M10 14a4.5 4.5 0 0 0 6.8.5l2.7-2.7a4.5 4.5 0 0 0-6.4-6.4l-1.5 1.5" />
                <path d="M14 10a4.5 4.5 0 0 0-6.8-.5l-2.7 2.7a4.5 4.5 0 0 0 6.4 6.4l1.5-1.5" />
              </svg>
              {copied ? T.copied : T.share}
            </button>
            <MotionPromptButton
              label={T.prompt}
              copiedLabel={T.copied}
              buildPrompt={() => (locale === "en" ? PROMPT_EN(shareUrl(), params) : PROMPT_ZH(shareUrl(), params))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
