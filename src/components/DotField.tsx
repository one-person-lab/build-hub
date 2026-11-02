"use client";

import { useEffect, useRef } from "react";

type RGB = [number, number, number];

type Props = {
  className?: string;
  dotSize?: number;
  gap?: number;
  baseColor?: string;
  activeColor?: string;
  proximity?: number;
  strength?: number;
  bounce?: number;
  tension?: number;
  returnDuration?: number;
  shockRadius?: number;
  shockStrength?: number;
  swell?: number;
  stretch?: number;
  glow?: number;
  fade?: number;
  opacity?: number;
  /** 无人操作时也自己走的一条亮带（0=不开，只在指针/点击时动） */
  ambient?: number;
  /** 滚动把亮带推着走：往下滚加速、往上滚倒退。当整页背景层用才开 */
  scrollSway?: number;
  /** 滚过 N 倍视口高，整层压到 dimFloor，亮带与跟手的劲一并撤掉（0=不开） */
  scrollDim?: number;
  /** 淡到底还剩多少 */
  dimFloor?: number;
};

function parseColor(color: string): RGB {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim());
  if (!match) return [255, 255, 255];
  const hex = match[1].length === 3 ? match[1].replace(/./g, (d) => d + d) : match[1];
  return [
    parseInt(hex.slice(0, 2), 16),
    parseInt(hex.slice(2, 4), 16),
    parseInt(hex.slice(4, 6), 16),
  ];
}

const smootherstep = (t: number) => {
  const x = Math.min(1, Math.max(0, t));
  return x * x * x * (x * (x * 6 - 15) + 10);
};

const backOut = (t: number) => {
  const s = 1.9;
  const x = t - 1;
  return 1 + x * x * ((s + 1) * x + s);
};

const STEPS = 24;
const TAU = Math.PI * 2;

export default function DotField({
  className = "",
  dotSize = 5,
  gap = 18,
  baseColor = "#3a3446",
  activeColor = "#ffffff",
  proximity = 140,
  strength = 1,
  bounce = 0.6,
  tension = 0.4,
  returnDuration = 0.8,
  shockRadius = 320,
  shockStrength = 5,
  swell = 0.8,
  stretch = 0.5,
  glow = 0.5,
  fade = 0,
  opacity = 1,
  ambient = 0,
  scrollSway = 0,
  scrollDim = 0,
  dimFloor = 0.4,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef<(() => void) | null>(null);
  const propsRef = useRef<Props>({
    dotSize,
    gap,
    baseColor,
    activeColor,
    proximity,
    strength,
    ambient,
    scrollSway,
    scrollDim,
    dimFloor,
  });

  useEffect(() => {
    propsRef.current = {
      dotSize,
      gap,
      baseColor,
      activeColor,
      proximity,
      strength,
      bounce,
      tension,
      returnDuration,
      shockRadius,
      shockStrength,
      swell,
      stretch,
      glow,
      fade,
      opacity,
      ambient,
      scrollSway,
      scrollDim,
      dimFloor,
    };
    drawRef.current?.();
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;
    const ctx = context;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const view = { width: 0, height: 0, ratio: 1 };
    const grid = { count: 0, cols: 1, rows: 1, cell: 1, centerX: 0, centerY: 0, reach: 1 };
    let rest = new Float32Array(0);
    let offset = new Float32Array(0);
    let velocity = new Float32Array(0);
    let force = new Float32Array(0);
    let next = new Float32Array(0);
    let wave = new Float32Array(0);
    let energy = new Float32Array(0);
    const pointer = { x: 0, y: 0, vx: 0, vy: 0, time: 0, inside: false, presence: 0 };
    const shocks: { x: number; y: number; start: number }[] = [];
    /** 环境光带：phase 走到哪一格，push 是滚动给的一脚油门 */
    const flow = { phase: 0, push: 0 };
    /** 滚动淡出进度：0=首屏原样，1=已滚过 scrollDim 屏，整层压到底 */
    const dim = { at: 0 };
    const readDim = () => {
      const span = propsRef.current.scrollDim ?? 0;
      dim.at =
        span > 0
          ? Math.min(1, Math.max(0, window.scrollY / (span * (window.innerHeight || 1))))
          : 0;
    };
    readDim();
    let quiet = true;
    let introStart: number | null = reduced ? null : -1;
    let visible = true;
    let raf = 0;
    let last = 0;
    let palette: string[] = [];
    let paletteKey = "";

    const buildPalette = () => {
      const s = propsRef.current;
      const key = `${s.baseColor}-${s.activeColor}`;
      if (key === paletteKey) return;
      paletteKey = key;
      const from = parseColor(s.baseColor ?? "#3a3446");
      const to = parseColor(s.activeColor ?? "#ffffff");
      palette = Array.from({ length: STEPS }, (_, i) => {
        const t = i / (STEPS - 1);
        return `rgb(${Math.round(from[0] + (to[0] - from[0]) * t)},${Math.round(
          from[1] + (to[1] - from[1]) * t
        )},${Math.round(from[2] + (to[2] - from[2]) * t)})`;
      });
    };

    const rebuild = () => {
      const s = propsRef.current;
      const size = s.dotSize ?? 5;
      const spacing = s.gap ?? 18;
      let cell = Math.max(2, size + spacing);
      let cols = Math.max(1, Math.floor((view.width + spacing) / cell));
      let rows = Math.max(1, Math.floor((view.height + spacing) / cell));
      // 当整页背景用时，4K 屏上能排上万个点；超预算就等比放大格距，只稀不卡
      const budget = 4600;
      if (cols * rows > budget) {
        cell = Math.ceil(cell * Math.sqrt((cols * rows) / budget));
        cols = Math.max(1, Math.floor((view.width + spacing) / cell));
        rows = Math.max(1, Math.floor((view.height + spacing) / cell));
      }
      const startX = (view.width - (cols * cell - spacing)) / 2 + size / 2;
      const startY = (view.height - (rows * cell - spacing)) / 2 + size / 2;
      const count = cols * rows;
      rest = new Float32Array(count * 2);
      offset = new Float32Array(count * 2);
      velocity = new Float32Array(count * 2);
      force = new Float32Array(count * 2);
      next = new Float32Array(count * 2);
      wave = new Float32Array(count * 4);
      energy = new Float32Array(count);
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const i = (row * cols + col) * 2;
          rest[i] = startX + col * cell;
          rest[i + 1] = startY + row * cell;
        }
      }
      Object.assign(grid, {
        count,
        cols,
        rows,
        cell,
        centerX: view.width / 2,
        centerY: view.height / 2,
        reach: Math.hypot(view.width, view.height) / 2,
      });
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      view.ratio = Math.min(window.devicePixelRatio || 1, 2);
      view.width = Math.max(1, Math.round(rect.width));
      view.height = Math.max(1, Math.round(rect.height));
      canvas.width = Math.round(view.width * view.ratio);
      canvas.height = Math.round(view.height * view.ratio);
      ctx.setTransform(view.ratio, 0, 0, view.ratio, 0, 0);
      readDim();
      rebuild();
      render(performance.now());
    };

    function step(dt: number, now: number) {
      const s = propsRef.current;
      const motion = reduced ? 0 : 1;
      // 越往下滚越「不跟手」：指针和点击的力气跟着淡出一起收掉
      const live = 1 - dim.at;
      // 光带自己往前爬；滚动踩的那一脚油门在半秒内褪掉，不会一直窜
      flow.push *= 1 - Math.exp(-dt / 0.5);
      flow.phase += dt * (0.07 + flow.push * motion * (s.scrollSway ?? 0));
      const zeta = 1 - 0.85 * Math.min(1, Math.max(0, s.bounce ?? 0.6));
      const omega = 4 / (zeta * Math.max(0.2, s.returnDuration ?? 0.8));
      const stiffness = omega * omega;
      const damping = 2 * zeta * omega;
      const radius = Math.max(1, s.proximity ?? 140);
      const speed = Math.hypot(pointer.vx, pointer.vy);
      const drive =
        !reduced && pointer.inside
          ? 6500 * Math.tanh(speed / 900) * (s.strength ?? 1) * motion * live
          : 0;
      const dirX = speed > 0.001 ? pointer.vx / speed : 0;
      const dirY = speed > 0.001 ? pointer.vy / speed : 0;
      const band = grid.cell * 1.4;
      const travel = 650;
      const active = shocks.map((shock) => {
        const front = ((now - shock.start) / 1000) * travel;
        const power = smootherstep(1 - front / Math.max(1, s.shockRadius ?? 320));
        return {
          ...shock,
          front,
          amplitude: power * (s.shockStrength ?? 5) * grid.cell * 0.24 * motion * live,
        };
      });
      const coupling = (Math.max(0, s.tension ?? 0.4) * 900) ** 2 / (grid.cell * grid.cell);
      const viscosity = Math.sqrt(coupling) * 0.06;
      const limit = Math.sqrt(stiffness + 8 * coupling) + damping + 8 * viscosity;
      const steps = Math.min(24, Math.max(1, Math.ceil(dt / Math.min(1 / 120, 1.2 / limit))));
      const h = dt / steps;

      if (drive > 0 || active.length > 0) quiet = false;

      if (!quiet) {
        for (let i = 0; i < grid.count; i++) {
          const index = i * 2;
          const rx = rest[index];
          const ry = rest[index + 1];
          let ax = 0;
          let ay = 0;
          if (drive > 0) {
            const ex = rx + offset[index] - pointer.x;
            const ey = ry + offset[index + 1] - pointer.y;
            const distance = Math.hypot(ex, ey);
            if (distance < radius) {
              const weight = smootherstep(1 - distance / radius) * drive;
              const nx = distance > 0.001 ? ex / distance : 0;
              const ny = distance > 0.001 ? ey / distance : 0;
              ax += weight * (dirX + nx * 0.6);
              ay += weight * (dirY + ny * 0.6);
            }
          }
          let wx = 0;
          let wy = 0;
          let wvx = 0;
          let wvy = 0;
          for (const shock of active) {
            if (shock.amplitude <= 0) continue;
            const ex = rx - shock.x;
            const ey = ry - shock.y;
            const distance = Math.hypot(ex, ey);
            const u = (distance - shock.front) / band;
            if (Math.abs(u) < 3 && distance > 0.001) {
              const nx = ex / distance;
              const ny = ey / distance;
              const profile = Math.exp(-u * u);
              const push = shock.amplitude * profile;
              const rate = ((shock.amplitude * 2 * u * profile) / band) * travel;
              wx += nx * push;
              wy += ny * push;
              wvx += nx * rate;
              wvy += ny * rate;
              ax += nx * push * stiffness * 0.35;
              ay += ny * push * stiffness * 0.35;
            }
          }
          force[index] = ax;
          force[index + 1] = ay;
          const target = i * 4;
          wave[target] = wx;
          wave[target + 1] = wy;
          wave[target + 2] = wvx;
          wave[target + 3] = wvy;
        }

        const stride = grid.cols * 2;
        for (let n = 0; n < steps; n++) {
          for (let row = 0; row < grid.rows; row++) {
            for (let col = 0; col < grid.cols; col++) {
              const index = (row * grid.cols + col) * 2;
              let ax = force[index] - stiffness * offset[index] - damping * velocity[index];
              let ay =
                force[index + 1] - stiffness * offset[index + 1] - damping * velocity[index + 1];
              if (coupling > 0) {
                let lx = -4 * offset[index];
                let ly = -4 * offset[index + 1];
                let mx = -4 * velocity[index];
                let my = -4 * velocity[index + 1];
                if (col > 0) {
                  lx += offset[index - 2];
                  ly += offset[index - 1];
                  mx += velocity[index - 2];
                  my += velocity[index - 1];
                }
                if (col < grid.cols - 1) {
                  lx += offset[index + 2];
                  ly += offset[index + 3];
                  mx += velocity[index + 2];
                  my += velocity[index + 3];
                }
                if (row > 0) {
                  lx += offset[index - stride];
                  ly += offset[index - stride + 1];
                  mx += velocity[index - stride];
                  my += velocity[index - stride + 1];
                }
                if (row < grid.rows - 1) {
                  lx += offset[index + stride];
                  ly += offset[index + stride + 1];
                  mx += velocity[index + stride];
                  my += velocity[index + stride + 1];
                }
                ax += coupling * lx + viscosity * mx;
                ay += coupling * ly + viscosity * my;
              }
              next[index] = velocity[index] + ax * h;
              next[index + 1] = velocity[index + 1] + ay * h;
            }
          }
          for (let i = 0; i < offset.length; i++) {
            velocity[i] = next[i];
            offset[i] += velocity[i] * h;
          }
        }

        for (let i = 0; i < grid.count; i++) {
          const index = i * 2;
          const target = i * 4;
          energy[i] = Math.min(
            1,
            (Math.hypot(velocity[index] + wave[target + 2], velocity[index + 1] + wave[target + 3]) /
              380) *
              0.85 +
              (Math.hypot(offset[index] + wave[target], offset[index + 1] + wave[target + 1]) /
                (grid.cell * 2.2)) *
                0.35
          );
        }

        // 指针和点击波都撤了、格子也归位了：下一帧起只走光带，省下最贵的那段积分
        if (drive <= 0 && active.length === 0) {
          let moved = false;
          for (let i = 0; i < offset.length; i += 5) {
            if (Math.abs(offset[i]) > 0.02 || Math.abs(velocity[i]) > 0.5) {
              moved = true;
              break;
            }
          }
          if (!moved) {
            quiet = true;
            offset.fill(0);
            velocity.fill(0);
            energy.fill(0);
          }
        }
      }
      for (let i = shocks.length - 1; i >= 0; i--) {
        if (active[i].front > (s.shockRadius ?? 320) + band * 3) shocks.splice(i, 1);
      }
      const decay = 1 - Math.exp(-dt / 0.08);
      pointer.vx -= pointer.vx * decay;
      pointer.vy -= pointer.vy * decay;
      const presenceTarget = !reduced && pointer.inside ? 1 : 0;
      pointer.presence += (presenceTarget - pointer.presence) * (1 - Math.exp(-dt / 0.2));
    }

    function render(now: number) {
      const s = propsRef.current;
      buildPalette();
      const live = 1 - dim.at;
      const amb = reduced ? 0 : (s.ambient ?? 0) * live;
      const dimK = 1 - dim.at * (1 - (s.dimFloor ?? 0.4));
      const radius = Math.max(1, s.proximity ?? 140);
      const size = Math.max(0.5, s.dotSize ?? 5);
      const introAge = introStart === null ? Infinity : introStart < 0 ? 0 : (now - introStart) / 1000;
      const introFront = introAge * grid.reach * 1.25;
      const introBand = grid.cell * 4;
      const edge = Math.max(1, (s.fade ?? 0) * 0.4 * Math.min(view.width, view.height));
      ctx.clearRect(0, 0, view.width, view.height);
      if (!palette.length) return;

      for (let i = 0; i < grid.count; i++) {
        const index = i * 2;
        const source = i * 4;
        const x = rest[index] + offset[index] + wave[source];
        const y = rest[index + 1] + offset[index + 1] + wave[source + 1];
        let glowing = energy[i];
        if (pointer.presence > 0.001) {
          const distance = Math.hypot(x - pointer.x, y - pointer.y);
          if (distance < radius)
            glowing = Math.max(
              glowing,
              smootherstep(1 - distance / radius) * 0.4 * pointer.presence * live
            );
        }
        let scale = 1;
        if (introStart !== null) {
          const distance = Math.hypot(rest[index] - grid.centerX, rest[index + 1] - grid.centerY);
          const appear = Math.min(1, Math.max(0, (introFront - distance) / introBand));
          scale = appear >= 1 ? 1 : Math.max(0, backOut(appear));
          glowing = Math.max(glowing, Math.sin(appear * Math.PI) * 0.6);
        }
        if (scale <= 0.01) continue;

        if (amb > 0) {
          // 两条不同方向的慢波只在重合处叠出亮斑，游动的是几团光，不是一条直愣愣的扫光
          const a = Math.sin(((rest[index] * 0.8 + rest[index + 1] * 0.6) / 560 - flow.phase) * TAU);
          const b = Math.sin(
            ((rest[index] * -0.55 + rest[index + 1] * 0.84) / 830 + flow.phase * 0.62) * TAU
          );
          if (a > 0 && b > 0) glowing = Math.max(glowing, amb * a ** 6 * b ** 3);
        }

        let alpha = (s.opacity ?? 1) * dimK;
        if ((s.fade ?? 0) > 0) {
          alpha *=
            smootherstep(Math.min(x, view.width - x) / edge) *
            smootherstep(Math.min(y, view.height - y) / edge);
        }
        if (alpha <= 0.004) continue;

        const r = 0.5 * size * scale * (1 + (s.swell ?? 0.8) * glowing);
        const color = palette[Math.min(STEPS - 1, Math.floor(glowing * 1.2 * STEPS))];
        const vx = velocity[index] + wave[source + 2];
        const vy = velocity[index + 1] + wave[source + 3];
        const speed = Math.hypot(vx, vy);
        ctx.fillStyle = color;

        if (speed > 40 && glowing > 0.05) {
          const half = Math.min(size * 2, speed * (s.stretch ?? 0.5) * 0.02);
          if (half > r * 0.4) {
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = color;
            ctx.lineWidth = r * 2;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(x - (vx / speed) * half, y - (vy / speed) * half);
            ctx.lineTo(x + (vx / speed) * half, y + (vy / speed) * half);
            ctx.stroke();
            continue;
          }
        }

        const halo = (s.glow ?? 0.5) * glowing;
        if (halo > 0.02) {
          ctx.globalAlpha = alpha * Math.min(0.5, halo * 0.4);
          ctx.beginPath();
          ctx.arc(x, y, r * (1 + halo * 2.5), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    function settled(now: number) {
      if (shocks.length) return false;
      if (introStart !== null) {
        if (introStart < 0 || (now - introStart) / 1000 < 1.6) return false;
        introStart = null;
      }
      if (Math.abs(pointer.vx) + Math.abs(pointer.vy) > 1) return false;
      const presenceTarget = !reduced && pointer.inside ? 1 : 0;
      if (Math.abs(presenceTarget - pointer.presence) > 0.002) return false;
      for (let i = 0; i < offset.length; i++) {
        if (Math.abs(offset[i]) > 0.02 || Math.abs(velocity[i]) > 0.5) return false;
      }
      return true;
    }

    const frame = (now: number) => {
      raf = 0;
      if (!visible || document.hidden) return;
      if (introStart !== null && introStart < 0) introStart = now;
      const dt = Math.min(0.05, (now - last) / 1000 || 0);
      last = now;
      step(dt, now);
      render(now);
      // 开了光带就一直呼吸；没开（或已淡到底）才允许彻底停下来省电
      if (!settled(now) || (!reduced && (propsRef.current.ambient ?? 0) * (1 - dim.at) > 0)) {
        raf = requestAnimationFrame(frame);
      }
    };

    const wake = () => {
      if (raf || !visible || document.hidden) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };

    const locate = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      view.width = Math.max(1, Math.round(rect.width));
      view.height = Math.max(1, Math.round(rect.height));
      return [event.clientX - rect.left, event.clientY - rect.top];
    };

    const onMove = (event: PointerEvent) => {
      if (reduced || dim.at >= 1) return;
      const [x, y] = locate(event);
      const inside = x >= 0 && y >= 0 && x <= view.width && y <= view.height;
      const time = event.timeStamp || performance.now();
      if (inside && pointer.inside && pointer.time) {
        const elapsed = Math.max(4, time - pointer.time) / 1000;
        pointer.vx += ((x - pointer.x) / elapsed - pointer.vx) * 0.6;
        pointer.vy += ((y - pointer.y) / elapsed - pointer.vy) * 0.6;
      } else {
        pointer.vx = 0;
        pointer.vy = 0;
      }
      pointer.x = x;
      pointer.y = y;
      pointer.time = time;
      if (inside !== pointer.inside || inside) {
        pointer.inside = inside;
        wake();
      }
    };

    const onLeave = () => {
      pointer.inside = false;
      pointer.time = 0;
      wake();
    };

    const onOut = (event: PointerEvent) => {
      if (!event.relatedTarget) onLeave();
    };

    const onDown = (event: PointerEvent) => {
      if (reduced || dim.at >= 1) return;
      const [x, y] = locate(event);
      if (x < 0 || y < 0 || x > view.width || y > view.height) return;
      shocks.push({ x, y, start: performance.now() });
      if (shocks.length > 6) shocks.shift();
      wake();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerout", onOut);
    window.addEventListener("blur", onLeave);

    // 滚动给光带踩一脚油门：往下滚它往前窜，往上滚它倒退，半秒内自己收住。
    // 淡出斜坡走完就不再踩，光带停在原地当质感底。
    let lastScrollY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const dy = y - lastScrollY;
      lastScrollY = y;
      const was = dim.at;
      readDim();
      if (dim.at !== was) wake();
      if (reduced || dim.at >= 1 || !(propsRef.current.scrollSway ?? 0)) return;
      flow.push = Math.max(-1.8, Math.min(1.8, flow.push + dy * 0.003 * (1 - dim.at)));
      wake();
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const resizeObserver = new ResizeObserver(() => {
      resize();
      wake();
    });
    resizeObserver.observe(canvas);

    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) wake();
    });
    visibilityObserver.observe(canvas);

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else {
        wake();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    drawRef.current = () => {
      render(performance.now());
      wake();
    };
    resize();
    wake();

    return () => {
      drawRef.current = null;
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerout", onOut);
      window.removeEventListener("blur", onLeave);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
    };
  }, []);

  return (
    <div className={`rb-dot-field${className ? ` ${className}` : ""}`}>
      <canvas ref={canvasRef} className="rb-dot-field__canvas" />
    </div>
  );
}
