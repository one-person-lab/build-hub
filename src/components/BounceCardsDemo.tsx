"use client";

import { useEffect, useRef, useState } from "react";
import MotionPromptButton from "@/components/MotionPromptButton";
import "./BounceCardsDemo.css";

// 五张方卡扇形叠放，左右对称（中间两张图复用，避免出现相邻同图）
const CARDS = [
  { src: "/assets/motion/citrus.png", alt: "Citrus still life" },
  { src: "/assets/motion/dune.png", alt: "Golden dunes" },
  { src: "/assets/motion/forest.png", alt: "Misty forest" },
  { src: "/assets/motion/dune.png", alt: "Golden dunes" },
  { src: "/assets/motion/citrus.png", alt: "Citrus still life" },
];

// 与 React Bits BounceCards 的默认扇形旋转节奏一致
const PATTERN = [1, 0.5, -0.3, -1, 0.2, 0.75, -0.6, 0.35, -0.85, 0.1];

const DEFAULTS = { spread: 85, rotation: 10, arc: 0, bounce: 60, push: 160, corner: 25 };
type Params = typeof DEFAULTS;
type ParamKey = keyof Params;

const PARAM_META: {
  key: ParamKey;
  label: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
}[] = [
  { key: "spread", label: "Spread", min: 40, max: 130, step: 5, unit: "px" },
  { key: "rotation", label: "Rotation", min: 0, max: 30, step: 2, unit: "°" },
  { key: "arc", label: "Arc", min: -60, max: 60, step: 5, unit: "px" },
  { key: "bounce", label: "Bounce", min: 0, max: 100, step: 5, unit: "%" },
  { key: "push", label: "Push", min: 0, max: 240, step: 10, unit: "px" },
  { key: "corner", label: "Corner", min: 0, max: 40, step: 2, unit: "px" },
];

const UI_TEXT = {
  zh: {
    hint: "把指针移到卡片上，点一下试试",
    copied: "已复制",
    prompt: "复制提示词",
  },
  en: {
    hint: "Move the pointer over a card, then click it",
    copied: "Copied",
    prompt: "Copy prompt",
  },
};

const paramLine = (p: Params) =>
  `spread=${p.spread}px rotation=${p.rotation}° arc=${p.arc}px bounce=${p.bounce}% push=${p.push}px corner=${p.corner}px`;

const PROMPT_ZH = (demoUrl: string, p: Params) => `请帮我复刻一个交互动画。先打开下面的参考链接，实际观看动画效果，再按它的交互形式 1:1 实现：

- 参考原版：https://reactbits.dev/c/components/bounce-cards
- 我的还原版（可交互 live demo，URL 带当前参数）：${demoUrl}

动画形态：五张方形照片卡在主舞台中央呈扇形叠开，卡片依次以弹簧缓动从 0 缩放弹入；指针悬停某张卡时，该卡抽正、轻轻抬起并放大，左右两侧的卡被弹簧推开；点击卡片像弹簧一样抖一下。
控制面板：Spread / Rotation / Arc / Bounce / Push / Corner 六个参数，整行即滑杆、右侧显示当前值；参数实时写入 URL，分享链接可完整恢复现场。
当前参数：${paramLine(p)}

要求：用 React + CSS/JS 实现（不引入第三方物理库），弹簧用手写阻尼积分；图片素材自有，不要搬运参考站点的素材与代码。`;

const PROMPT_EN = (demoUrl: string, p: Params) => `Please recreate an interactive animation for me. First open the reference link below and actually watch the motion, then implement its interaction form 1:1:

- Original reference: https://reactbits.dev/c/components/bounce-cards
- My recreation (interactive live demo, URL carries current params): ${demoUrl}

The animation: five square photo cards fanned out in the center of the stage. Cards spring in one by one, scaling from 0 with a bouncy ease. Hovering a card straightens it, lifts it slightly and scales it up while the neighbouring cards are pushed apart by the spring. Clicking a card makes it spring-poke.
Control panel: six params — Spread / Rotation / Arc / Bounce / Push / Corner — each row is the slider itself with the live value on the right; params sync to the URL in real time so a shared link restores the exact scene.
Current params: ${paramLine(p)}

Requirements: implement with React + CSS/JS (no third-party physics library; hand-write the damped spring), use your own imagery, and do not copy any assets or code from the reference site.`;

// 初始参数取自 URL（?c=bounce&spread=..）；必须在 useState 初始化器里读，
// 否则会被「参数写回 URL」的 effect 抢先覆盖成默认值
function initialParams(): Params {
  const next = { ...DEFAULTS };
  const q = new URLSearchParams(window.location.search);
  if (q.get("c") === "bounce") {
    for (const m of PARAM_META) {
      const raw = q.get(m.key);
      if (raw === null) continue;
      const v = Number(raw);
      if (Number.isFinite(v) && v >= m.min && v <= m.max) next[m.key] = Math.round(v);
    }
  }
  return next;
}

type Body = { x: number; y: number; r: number; s: number; vx: number; vy: number; vr: number; vs: number };

function step(value: number, velocity: number, target: number, stiffness: number, damping: number, dt: number) {
  const next = velocity + ((target - value) * stiffness - velocity * damping) * dt;
  return [value + next * dt, next] as const;
}

export default function BounceCardsDemo({
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
  const [size, setSize] = useState(188);

  const stageRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const hoverRef = useRef(-1);
  const paramsRef = useRef(params);
  const sizeRef = useRef(size);
  const bodiesRef = useRef<Body[]>(
    CARDS.map(() => ({ x: 0, y: 0, r: 0, s: 0, vx: 0, vy: 0, vr: 0, vs: 0 }))
  );
  paramsRef.current = params;
  sizeRef.current = size;

  // 参数变化实时写回 URL（与卡片轮播一致的交付形式：链接即现场）
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("c") !== "bounce") return;
    for (const m of PARAM_META) q.set(m.key, String(params[m.key]));
    window.history.replaceState(null, "", `${window.location.pathname}?${q}`);
  }, [params]);

  // 舞台宽度决定卡片尺寸，窄屏整体缩小
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const fit = () => {
      const w = stage.clientWidth;
      setSize(Math.round(w < 520 ? 132 : Math.min(188, Math.max(150, w * 0.3))));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(stage);
    return () => ro.disconnect();
  }, []);

  // 弹簧积分：入场依次弹入；悬停抽正抬升、邻近卡推开；点击抖一下
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const middle = (CARDS.length - 1) / 2;
    let raf = 0;
    let last = performance.now();
    let time = 0;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(1 / 30, Math.max(1 / 240, (now - last) / 1000));
      last = now;
      time += dt;

      const p = paramsRef.current;
      const cardSize = sizeRef.current;
      const scale = cardSize / 188;
      const spread = p.spread * scale;
      const push = p.push * scale;
      const arc = p.arc * scale;
      const hovered = hoverRef.current;
      const bounciness = p.bounce / 100;
      // 窄舞台上把扇形收拢，避免首尾卡片被舞台裁掉
      const stageW = stageRef.current?.clientWidth ?? 0;
      const fanWidth = (CARDS.length - 1) * spread + cardSize;
      const fit = stageW > 0 ? Math.min(1, (stageW - 20) / fanWidth) : 1;

      const popStiffness = 170;
      const popDamping = 2 * (1 - 0.85 * bounciness) * Math.sqrt(popStiffness);
      const moveStiffness = 210;
      const moveDamping = 2 * (reduced ? 1 : 0.72) * Math.sqrt(moveStiffness);
      const substeps = Math.ceil(dt / (1 / 240));
      const h = dt / substeps;

      CARDS.forEach((_, i) => {
        const b = bodiesRef.current[i];
        const offset = i - middle;
        const baseX = offset * spread * fit;
        const baseY = arc * (offset / middle) ** 2;
        const baseR = p.rotation * PATTERN[i % PATTERN.length];
        const appeared = reduced || time >= 0.35 + i * 0.07;

        let tx = baseX;
        let ty = baseY;
        let tr = baseR;
        let ts = appeared ? 1 : 0;
        if (hovered >= 0 && appeared) {
          if (i === hovered) {
            ty = baseY - cardSize * 0.04;
            tr = 0;
            ts = 1.06;
          } else {
            tx = baseX + Math.sign(i - hovered) * push * fit;
          }
        }

        for (let k = 0; k < substeps; k++) {
          [b.x, b.vx] = step(b.x, b.vx, tx, moveStiffness, moveDamping, h);
          [b.y, b.vy] = step(b.y, b.vy, ty, moveStiffness, moveDamping, h);
          [b.r, b.vr] = step(b.r, b.vr, tr, moveStiffness, moveDamping, h);
          if (reduced) {
            b.s = ts;
            b.vs = 0;
          } else {
            [b.s, b.vs] = step(b.s, b.vs, ts, popStiffness, popDamping, h);
          }
        }

        const el = cardRefs.current[i];
        if (el) {
          el.style.transform = `translate(-50%, -50%) translate3d(${b.x.toFixed(2)}px, ${b.y.toFixed(2)}px, 0) rotate(${b.r.toFixed(2)}deg) scale(${Math.max(0, b.s).toFixed(4)})`;
        }
      });
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const setHover = (index: number) => {
    hoverRef.current = index;
    cardRefs.current.forEach((el, i) => {
      if (!el) return;
      el.style.zIndex = String(i === index ? CARDS.length + 1 : i + 1);
      el.toggleAttribute("data-active", i === index);
    });
  };

  const poke = (index: number) => {
    if (hoverRef.current !== index) setHover(index);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    bodiesRef.current[index].vs -= 2.2;
  };

  const shareUrl = () => {
    const q = new URLSearchParams({
      c: "bounce",
      ...Object.fromEntries(PARAM_META.map((m) => [m.key, String(params[m.key])])),
    });
    return `${window.location.origin}${window.location.pathname}?${q}`;
  };

  return (
    <div className="bcd">
      <div className="bcd-layout">
        <div
          ref={stageRef}
          className="bcd-stage"
          style={
            {
              "--bcd-size": `${size}px`,
              "--bcd-corner": `${params.corner}px`,
            } as React.CSSProperties
          }
          onPointerLeave={() => setHover(-1)}
        >
          {CARDS.map((c, i) => (
            <div
              key={`${c.src}-${i}`}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              className="bcd-card"
              role="button"
              tabIndex={0}
              aria-label={c.alt}
              style={{ zIndex: i + 1 }}
              onPointerEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(-1)}
              onClick={() => poke(i)}
              onKeyDown={(e) => {
                if (e.key !== "Enter" && e.key !== " ") return;
                e.preventDefault();
                poke(i);
              }}
            >
              <img src={c.src} alt={c.alt} draggable={false} loading="lazy" />
            </div>
          ))}
          <span className="bcd-hint">{T.hint}</span>
        </div>

        <div className="bcd-panel">
          <div className="bcd-panel-head">
            <h3>
              {name}
              {en ? <span>{en}</span> : null}
            </h3>
            {tagline ? <p>{tagline}</p> : null}
          </div>
          <div className="bcd-params">
            {PARAM_META.map((m) => {
              const v = params[m.key];
              return (
                <label
                  className="bcd-param"
                  key={m.key}
                  style={{ "--pct": `${((v - m.min) / (m.max - m.min)) * 100}%` } as React.CSSProperties}
                >
                  <span className="bcd-param-label">{m.label}</span>
                  <span className="bcd-param-value">
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
          <div className="bcd-actions">
            <MotionPromptButton
              label={T.prompt}
              copiedLabel={T.copied}
              source="motion-bounce"
              buildPrompt={() => (locale === "en" ? PROMPT_EN(shareUrl(), params) : PROMPT_ZH(shareUrl(), params))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
