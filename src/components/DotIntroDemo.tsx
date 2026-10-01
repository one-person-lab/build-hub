"use client";

import { useEffect, useRef, useState } from "react";
import MotionPromptButton from "@/components/MotionPromptButton";
import "./DotIntroDemo.css";

const UI_TEXT = {
  zh: { replay: "重播", hint: "点一下屏幕，推进一步", prompt: "复制提示词", copied: "已复制" },
  en: { replay: "Replay", hint: "Tap the screen to advance", prompt: "Copy prompt", copied: "Copied" },
};

const PROMPT_ZH = (demoUrl: string) => `请帮我复刻一个 App 开场的信纸式交互动画。先打开下面的参考链接，实际观看动画效果，再按它的交互形式 1:1 实现：

- 参考原版动画：https://www.ripplix.com/library/dot
- 我的还原版（可交互 live demo）：${demoUrl}

动画形态：三步开场。第 1 步深色屏幕上，衬线问候语逐行淡入上移；第 2 步暖色渐变底上浮现引导文案；第 3 步一张略微旋转的信纸卡从下方飞入，露出「你好，」与闪烁光标。点一下屏幕推进一步，最后一步停留后自动循环回第一步，可重播。

要求：用 React + CSS 实现，文案与配色自有，不要搬运参考网站的任何素材与代码。`;

const PROMPT_EN = (demoUrl: string) => `Please recreate a letter-style app intro animation. First open the reference links below and actually watch the motion, then implement its interaction form 1:1:

- Original reference animation: https://www.ripplix.com/library/dot
- My recreation (interactive live demo): ${demoUrl}

The animation: a three-step intro. Step 1: on a dark screen, serif greeting lines fade in and drift up one by one. Step 2: guiding copy appears over a warm gradient background. Step 3: a slightly rotated letter card flies in from below, revealing "Hello," with a blinking caret. Tapping the screen advances one step; the last step loops back to the start after a pause, and it can be replayed.

Requirements: implement with React + CSS, use your own copy and palette, and do not copy any assets or code from the reference site.`;

type Step = {
  bg: string;
  lines: { text: string; serif?: boolean; size: number; delay: number }[];
  letter?: string;
};

const STEPS: Step[] = [
  {
    bg: "#0d0809",
    lines: [
      { text: "晚上好。", serif: true, size: 26, delay: 100 },
      { text: "今天有什么想记下来的？", serif: true, size: 15, delay: 700 },
    ],
  },
  {
    bg: "linear-gradient(165deg,#f3d9c4 0%,#f8efe7 55%,#e9e4f2 100%)",
    lines: [
      { text: "还有一件事", serif: true, size: 24, delay: 100 },
      { text: "写三行字，让开场更像一封信", size: 14, delay: 500 },
    ],
  },
  {
    bg: "linear-gradient(165deg,#f3d9c4 0%,#f8efe7 55%,#e9e4f2 100%)",
    lines: [],
    letter: "你好，",
  },
];

export default function DotIntroDemo({
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
  const [step, setStep] = useState(0);
  const [runId, setRunId] = useState(0);
  const timerRef = useRef<number>(0);

  // 最后一步停留后自动循环回第一步
  useEffect(() => {
    if (step !== STEPS.length - 1) return;
    timerRef.current = window.setTimeout(() => setStep(0), 3200);
    return () => window.clearTimeout(timerRef.current);
  }, [step, runId]);

  const advance = () => setStep((s) => (s + 1) % STEPS.length);
  const replay = () => {
    setStep(0);
    setRunId((r) => r + 1);
  };

  const cur = STEPS[step];
  const serif = (extra?: React.CSSProperties): React.CSSProperties => ({
    fontFamily: "Georgia, 'Songti SC', 'Noto Serif SC', serif",
    ...extra,
  });

  return (
    <div className="did">
      <div className="did-stage">
        <div
          key={`${runId}-${step}`}
          className="did-phone"
          style={{ background: cur.bg }}
          onClick={advance}
          role="button"
          tabIndex={0}
          aria-label={T.hint}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") advance();
          }}
        >
          <span className="did-notch" aria-hidden="true" />
          <div className="did-lines">
            {cur.lines.map((l, i) => (
              <span
                key={i}
                className="did-line"
                style={{
                  animationDelay: `${l.delay}ms`,
                  fontSize: l.size,
                  color: step === 0 ? "#f4efe9" : "#33291f",
                  ...(l.serif ? serif() : {}),
                }}
              >
                {l.text}
              </span>
            ))}
          </div>
          {cur.letter ? (
            <div className="did-letter" style={serif()}>
              <span>{cur.letter}</span>
              <i className="did-caret" aria-hidden="true" />
            </div>
          ) : null}
        </div>
        <div className="did-dots" aria-hidden="true">
          {STEPS.map((_, i) => (
            <span key={i} className={"did-dot" + (i === step ? " is-on" : "")} />
          ))}
        </div>
        <span className="did-hint">{T.hint}</span>
        <button type="button" className="did-replay" onClick={replay} aria-label={T.replay} title={T.replay}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <path d="M3 12a9 9 0 1 0 3-6.7" />
            <path d="M3 4v5h5" />
          </svg>
        </button>
      </div>

      <div className="did-panel">
        <div className="did-panel-head">
          <h3>
            {name}
            {en ? <span>{en}</span> : null}
          </h3>
          {tagline ? <p>{tagline}</p> : null}
        </div>
        <MotionPromptButton
          className="is-outline did-prompt"
          label={T.prompt}
          copiedLabel={T.copied}
          buildPrompt={() => {
            const url = `${window.location.origin}${window.location.pathname}?c=dot`;
            return locale === "en" ? PROMPT_EN(url) : PROMPT_ZH(url);
          }}
        />
      </div>
    </div>
  );
}
