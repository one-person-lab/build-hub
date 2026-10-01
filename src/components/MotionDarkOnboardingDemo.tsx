"use client";

import { useEffect, useRef, useState } from "react";
import MotionPromptButton from "@/components/MotionPromptButton";
import "./MotionDarkOnboardingDemo.css";

const UI_TEXT = {
  zh: {
    replay: "重播",
    hint: "点一下屏幕，切到下一个场景",
    prompt: "复制提示词",
    copied: "已复制",
  },
  en: { replay: "Replay", hint: "Tap the screen for the next scene", prompt: "Copy prompt", copied: "Copied" },
};

const REF_URL = "https://60fps.design/shots/x-money-intro-sequence-animation";

const PROMPT_ZH = (demoUrl: string) => `请帮我复刻一组深色 App 引导页的交互动画。先打开下面的参考链接，实际观看动画节奏，再按它的交互形式 1:1 实现：

- 参考原版动画：${REF_URL}
- 我的还原版（可交互 live demo）：${demoUrl}

动画形态：一台深色手机里跑四个引导场景，场景之间整块从右侧横向滑入（约 620ms，ease-out 曲线），标题与副标题跟着场景一起进场、锚在屏幕下半部左对齐。每个场景各有一个签名动作：
1. 分步入场——四行账户条目自上而下依次淡入上移，间隔约 260ms；
2. 3D 卡片翻面——卡片带 perspective 从 -46° 转到 +38° 再回落到 -6°，一道高光斜着扫过卡面；
3. 图标形变——扫描框淡出，同一位置描边画出一个圆环，圆环里再画出对勾（stroke-dashoffset 绘制，不是切换图片）；
4. 数字滚轮——金额逐位由 0-9 纵向卷轴减速停住，个位先定、高位后定，落定瞬间数字背后闪一次柔光。
交互：点屏幕推进一个场景，最后一个场景停留后自动循环回第一个，可重播。

要求：用 React + CSS 实现，文案、配色与品牌名自有，不要搬运参考网站的任何素材与代码。`;

const PROMPT_EN = (demoUrl: string) => `Please recreate a dark app onboarding motion sequence. First open the reference links below and actually watch the rhythm, then implement its interaction form 1:1:

- Original reference animation: ${REF_URL}
- My recreation (interactive live demo): ${demoUrl}

The animation: four onboarding scenes inside a dark phone. Scenes enter as a whole block sliding in from the right (~620ms, ease-out), with the title and caption riding along, anchored in the lower half, left-aligned. Each scene has one signature move:
1. Staggered entry — four account rows fade up one after another, ~260ms apart;
2. 3D card tilt — the card rotates from -46° to +38° and settles at -6° under perspective, while a specular highlight sweeps diagonally across it;
3. Icon morph — the scanner glyph fades out and, in the same spot, a ring is drawn with stroke-dashoffset, then a checkmark is drawn inside it (drawn, not swapped);
4. Digit reels — the amount settles digit by digit on vertical 0-9 reels that decelerate, ones first and the leading digit last, with a soft glow pulse behind the number on lock-in.
Interaction: tapping the screen advances one scene; the last scene loops back to the first after a pause, and it can be replayed.

Requirements: implement with React + CSS, use your own copy, palette and brand name, and do not copy any assets or code from the reference site.`;

type SceneId = "rows" | "card" | "morph" | "reels";

const SCENES: { id: SceneId; title: string; sub: string; hold: number }[] = [
  { id: "rows", title: "欢迎使用 潮汐", sub: "一个地方，看清所有的钱", hold: 3600 },
  { id: "card", title: "碰一下就能付", sub: "卡片常驻锁屏，不用解锁", hold: 3800 },
  { id: "morph", title: "面容即密钥", sub: "没有密码，也就没有被盗的密码", hold: 4400 },
  { id: "reels", title: "余额保障", sub: "资金由持牌银行托管，最高 50 万元", hold: 4800 },
];

const ROWS = [
  { label: "活期", value: "¥ 12,480", on: true },
  { label: "储蓄罐", value: "¥ 3,200" },
  { label: "指数基金", value: "¥ 8,650" },
  { label: "添加账户", value: "" },
];

const REEL_TARGET = "500000"; // 50 万
const REEL_SPINS = 2;

function Scene({ id }: { id: SceneId }) {
  if (id === "rows") {
    return (
      <div className="dod-rows">
        {ROWS.map((r, i) => (
          <div className="dod-row" key={r.label} style={{ animationDelay: `${260 + i * 260}ms` }}>
            <span className="dod-row-dot" />
            <span className="dod-row-label">{r.label}</span>
            <span className="dod-row-value">{r.value || "+"}</span>
            {r.on ? <span className="dod-row-bar"><i style={{ width: "62%" }} /></span> : null}
          </div>
        ))}
      </div>
    );
  }
  if (id === "card") {
    return (
      <div className="dod-card-wrap">
        <div className="dod-card">
          <span className="dod-card-brand">潮汐</span>
          <span className="dod-card-chip" />
          <span className="dod-card-num">•••• •••• •••• 4291</span>
          <span className="dod-card-sheen" aria-hidden="true" />
        </div>
      </div>
    );
  }
  if (id === "morph") {
    return (
      <div className="dod-morph">
        <svg viewBox="0 0 96 96" className="dod-morph-scan" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
          <path d="M22 32v-6a4 4 0 0 1 4-4h6M64 22h6a4 4 0 0 1 4 4v6M74 64v6a4 4 0 0 1-4 4h-6M32 74h-6a4 4 0 0 1-4-4v-6" />
          <path d="M38 42v6M58 42v6M40 58c3 3.4 6.4 5 8 5s5-1.6 8-5" />
        </svg>
        <svg viewBox="0 0 96 96" className="dod-morph-ring" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round">
          <circle cx="48" cy="48" r="27" pathLength={100} />
        </svg>
        <svg viewBox="0 0 96 96" className="dod-morph-check" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M37 49l8 8 16-18" pathLength={100} />
        </svg>
      </div>
    );
  }
  return (
    <div className="dod-reels">
      <span className="dod-odo-glow" aria-hidden="true" />
      <span className="dod-currency">¥</span>
      {REEL_TARGET.split("").map((digit, i) => (
        <span className="dod-reel-group" key={i}>
          <span className="dod-reel">
            <span
              className="dod-strip"
              style={
                {
                  "--stop": REEL_SPINS * 10 + Number(digit),
                  animationDuration: `${1500 + i * 130}ms`,
                  animationDelay: `${180 + i * 70}ms`,
                } as React.CSSProperties
              }
            >
              {Array.from({ length: REEL_SPINS * 10 + 10 }, (_, k) => (
                <span className="dod-cell" key={k}>
                  {k % 10}
                </span>
              ))}
            </span>
          </span>
          {(REEL_TARGET.length - i - 1) % 3 === 0 && i !== REEL_TARGET.length - 1 ? (
            <span className="dod-comma">,</span>
          ) : null}
        </span>
      ))}
    </div>
  );
}

export default function MotionDarkOnboardingDemo({
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
  const [scene, setScene] = useState(0);
  const [runId, setRunId] = useState(0);
  const timerRef = useRef<number>(0);

  useEffect(() => {
    if (scene !== SCENES.length - 1) return;
    timerRef.current = window.setTimeout(() => setScene(0), SCENES[scene].hold);
    return () => window.clearTimeout(timerRef.current);
  }, [scene, runId]);

  const advance = () => setScene((s) => (s + 1) % SCENES.length);
  const replay = () => {
    setScene(0);
    setRunId((r) => r + 1);
  };

  const cur = SCENES[scene];

  return (
    <div className="dod">
      <div className="dod-stage">
        <div className="dod-phone" onClick={advance} role="button" tabIndex={0} aria-label={T.hint} onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") advance();
        }}>
          <span className="dod-notch" aria-hidden="true" />
          <div className="dod-scene" key={`${runId}-${scene}`}>
            <Scene id={cur.id} />
            <div className="dod-caption">
              <h4>{cur.title}</h4>
              <p>{cur.sub}</p>
            </div>
          </div>
        </div>
        <div className="dod-dots" aria-hidden="true">
          {SCENES.map((s, i) => (
            <span key={s.id} className={"dod-dot" + (i === scene ? " is-on" : "")} />
          ))}
        </div>
        <span className="dod-hint">{T.hint}</span>
        <button type="button" className="dod-replay" onClick={replay} aria-label={T.replay} title={T.replay}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <path d="M3 12a9 9 0 1 0 3-6.7" />
            <path d="M3 4v5h5" />
          </svg>
        </button>
      </div>

      <div className="dod-panel">
        <div className="dod-panel-head">
          <h3>
            {name}
            {en ? <span>{en}</span> : null}
          </h3>
          {tagline ? <p>{tagline}</p> : null}
        </div>
        <MotionPromptButton
          className="is-outline dod-prompt"
          label={T.prompt}
          copiedLabel={T.copied}
          buildPrompt={() => {
            const url = `${window.location.origin}${window.location.pathname}?c=onboarding`;
            return locale === "en" ? PROMPT_EN(url) : PROMPT_ZH(url);
          }}
        />
      </div>
    </div>
  );
}
