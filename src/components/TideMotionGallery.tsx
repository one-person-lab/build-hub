"use client";

import { useEffect, useState } from "react";
import MotionPromptButton from "./MotionPromptButton";
import "./TideMotionGallery.css";

type Copy = { title: string; note: string };

const SOURCE_URL = "https://apps.apple.com/cn/app/id1077776989";

// 潮汐没有站内设计风格条目，把视觉基调直接写进提示词（对齐 2026 年 5.11 版界面）
const TIDE_STYLE_ZH =
  "视觉基调：首页为全屏自然影像暗色沉浸（近黑绿背景 + 半透明白玻璃圆钮 + 背景模糊），内容页为米白/淡紫浅色底 + 深绿强调色（约 #3a7d44）、大圆角白色卡片、彩色小胶囊标签（橙/绿/蓝/青/橄榄）、白色细字重数字排版，场景画面全部用 CSS 渐变自绘";
const TIDE_STYLE_EN =
  "Visual base: the home screen is a dark, immersive full-bleed nature scene (near-black green, translucent-white glass buttons + backdrop blur); content pages sit on cream/lavender light backgrounds with a deep-green accent (~#3a7d44), large-radius white cards, small colored capsule tags (orange/green/blue/teal/olive) and thin white-weight numerals — draw all scene art with your own CSS gradients";

// 每个母题的实现级描述，供 AI 复刻用
const MOTION: Record<string, { zh: string; en: string }> = {
  home: {
    zh: "全屏自然影像首页：两层场景渐变（森林溪涧/黄昏）以 8s 交叉淡播模拟慢速视频背景；顶部问候语与 3 枚玻璃圆钮常驻，下方一枚「自然好睡眠」玻璃胶囊标签；底部 3 枚玻璃快捷钮（心流专注/睡眠监测/小憩）带图标+小字标签；最底部 4 个 tab 中，深绿胶囊在 首页→睡眠→正念→声音 之间以缓出曲线逐格滑动（每格 2s），选中文字转白。",
    en: "A full-bleed nature home screen: two scene gradients (forest stream / dusk) cross-fade over 8s to fake a slow video background; the greeting and three glass round buttons stay pinned at top with a small glass pill tag below; three glass quick buttons (Flow / Sleep / Nap) sit near the bottom; in the 4-tab bar a deep-green capsule slides cell by cell (首页→睡眠→正念→声音, ~2s per stop, ease-out) while the active label turns white.",
  },
  sounds: {
    zh: "圆形声景网格放大沉浸：浅绿底上 2×2 圆形场景缩略（雨天/森林/日出/土星，CSS 渐变绘景）。雨天圆以共享元素方式放大铺满全屏（宽高与圆角同步插值，约 600ms 缓出），放大后浮现标题、68px 玻璃播放钮与 9 条波形；播放钮内三角↔双竖条做 90° 旋转交叉淡切，波形随播放段 scaleY 起伏、暂停段统一压扁；停留后缩回圆位。",
    en: "A circular soundscape grid that expands into an immersive player: on a pale-green page, a 2×2 grid of round scene thumbnails (Rain / Forest / Sunrise / Saturn, CSS-gradient art). The Rain circle expands shared-element style to fill the screen (width/height/radius interpolated, ~600ms ease-out), revealing a title, a 68px glass play button and nine waveform bars; the button's triangle cross-rotates into pause bars while the bars undulate during playback and flatten when paused; it then shrinks back into the grid.",
  },
  focus: {
    zh: "番茄刻度计时：深色沉浸卡。顶部 5 枚彩色任务胶囊（工作/背单词/设计/阅读/做家务），选中枚以回弹 scale 1.08 并上浮 2px；卡心大号「25 分钟」用滚动数字条跳到 24，下方一排 21 根刻度线以每秒一格向左平移、中央高亮游标常驻，营造时间流逝；底部白色「开始专注」胶囊按钮。",
    en: "A Pomodoro ruler timer on a dark immersive card: five colored task capsules (Work / Recite / Design / Read / Housework) across the top, the selected one bouncing to scale 1.08 with a 2px lift; the big '25 min' numeral rolls down to 24 via a stepped digit strip, while a row of 21 tick marks scrolls left one tick per second under a fixed center cursor to convey elapsed time; a white 'Start' pill anchors the bottom.",
  },
  breath: {
    zh: "4-4-4-4 箱式呼吸：中央直径 160px 的柔光圆随吸气放大到 1.32 倍（4s ease-in-out），屏息阶段保持并让外圈光环继续向外扩散淡出，呼气缩回，再屏息；圆心上方的两字指令按 吸气/屏息/呼气/屏息 逐段切换，16s 一整轮。",
    en: "A 4-4-4-4 box-breathing loop: the soft 160px glow circle scales to 1.32 over 4s on inhale, holds on the screen phase while its outer halo keeps expanding and fading out, shrinks on exhale, holds again; the two-character instruction above the center switches 吸气/屏息/呼气/屏息 (inhale/hold/exhale/hold) segment by segment — one full round is 16s.",
  },
  sleep: {
    zh: "睡眠报告卡：淡紫底上一张 22px 大圆角白卡，顶部「昨晚睡了」+ 大号「8小时16分钟」上移淡入，右上角睡眠评分 94 用滚动数字从 0 计起；卡内 14 根睡眠分期柱（橙=清醒/绿=浅睡/蓝=深睡）以底部为原点错峰 scaleY 生长（每根 60ms）；卡外两枚「💤 梦话 · 10″」「😴 鼾声 · 8″」玻璃胶囊带迷你波形先后从左滑入。",
    en: "A sleep-report card: on a lavender page, a large-radius white card — the 'last night' line and big '8h 16m' duration slide up and fade in while the sleep score counts 0 → 94 on a rolling digit strip; inside, 14 sleep-stage bars (orange=awake, green=light, blue=deep) grow from their baseline with a 60ms stagger; outside, two glass pills ('talking · 10s', 'snoring · 8s') carrying mini waveforms slide in from the left one after another.",
  },
  quotes: {
    zh: "格言卡堆滑动：米白底中央三张 200×300 照片卡叠放（后卡依次下移 8px、scale .96/.92 露边）。顶层卡（大日期数字+两行格言+出处）以 rotate -6° 向左上飞出淡出，第二张回正成为顶层、第三张补位，8s 内完成两次换卡后复位。",
    en: "A swipeable quote-card deck: three 200×300 photo cards stack centered on a cream page (each back card peeking 8px lower at scale .96/.92). The top card — big date numeral, two quote lines, attribution — flies off to the upper-left with a -6° rotation as the second snaps forward and the third rises to fill; two swaps per 8s loop, then reset.",
  },
  stories: {
    zh: "睡眠故事卡片流：淡紫底标题「睡眠故事」，双列 4 张插画卡（CSS 渐变绘景+左下白字标题）按 90ms 错峰从下方 18px 浮入淡显，第二张卡右上角的玻璃播放角标以回弹缩放弹出；2s 停留后整场淡出复位。",
    en: "A sleep-story feed: under the page title, four two-column illustrated cards (gradient art + bottom-left label) float up 18px and fade in with a 90ms stagger, while a glass play badge pops on the second card with a bounce; after a 2s hold the scene fades and resets.",
  },
  meditate: {
    zh: "冥想精选卡：米白底一张大圆角 hero 卡，卡内一枚拱窗形插画（上圆下方，夜空渐变+山脊三角+圆月）缓慢做 1→1.02 呼吸缩放；右侧 48px 玻璃播放钮外圈做 2s 错峰脉冲环；卡下「8 章 · 系列」标签与两枚小卡露头随 hero 卡轻微视差位移。",
    en: "A featured meditation card: on a cream page a large-radius hero card holds an arch-window illustration (gradient night sky, ridge triangle, moon disc) that breathes at scale 1 → 1.02; the 48px glass play button on the right emits alternating 2s pulse rings; the '8 chapters' tag and two peeking child cards drift a few pixels in gentle parallax with the hero.",
  },
  nap: {
    zh: "小憩唤醒：深蓝夜空底，176px 进度环沿 pathLength 100 从 0 填到满（10s）；环内月亮（亏凸掩圆自绘）在 70% 处与太阳交叉淡切成日出，整屏背景同步从夜空蓝渐变暖到晨曦琥珀；环满后文案从「轻唤醒中」切到「早安」，随后复位。",
    en: "Nap wake-up: on a deep night-blue screen a 176px progress ring fills along pathLength 100 over 10s; inside, a self-drawn crescent moon cross-fades into a sun at 70% as the whole background warms from night blue to dawn amber in sync; when the ring completes the caption flips from 'gentle wake' to 'good morning', then resets.",
  },
};

const UI = {
  zh: {
    heading: "动效母题 · 9 段",
    sub: "从潮汐当前版本（5.11，2026-09）真实界面提炼的 9 个动效母题，全部复刻为手机竖屏画面、纯 CSS 关键帧循环播放；点击任意卡片查看动效详情，复制提示词让 AI 1:1 复刻。",
    source: "参考来源：潮汐 App Store 官方截图（v5.11.2，2026-09-13 更新）",
    replay: "重播",
    prompt: "复制提示词",
    copied: "已复制",
    detail: "动效详情",
    prev: "上一个",
    next: "下一个",
    close: "关闭",
    openHint: "点击查看动效详情与提示词",
    scenes: {
      home: { title: "首页 · 全屏影像+玻璃钮+胶囊 tab", note: "自然影像慢速交叉淡播，深绿胶囊在底部四个 tab 间逐格滑动。" },
      sounds: { title: "声音场景 · 圆形缩略放大沉浸", note: "圆形场景卡放大铺满全屏，播放/暂停图标形变，波形随播放起伏。" },
      focus: { title: "番茄专注 · 刻度尺倒计时", note: "彩色任务胶囊选中回弹，刻度线逐格左移、分钟数滚动递减。" },
      breath: { title: "呼吸训练 · 4-4-4-4 缩放圆", note: "柔光圆随吸气放大、屏息保持、呼气缩回，指令文字逐段切换。" },
      sleep: { title: "睡眠报告 · 分期柱生长+计分", note: "白卡上睡眠分期柱错峰生长，评分滚动计数，梦话鼾声胶囊滑入。" },
      quotes: { title: "正念格言 · 卡堆滑动", note: "叠放照片卡顶层向左上飞出换卡，后卡回正补位，循环两次复位。" },
      stories: { title: "睡眠故事 · 双列卡片浮入", note: "插画卡错峰从下方浮入，玻璃播放角标回弹弹出后整场复位。" },
      meditate: { title: "冥想精选 · 拱窗呼吸卡", note: "拱窗插画卡做呼吸缩放，玻璃播放钮外圈脉冲扩散，小卡视差。" },
      nap: { title: "小憩唤醒 · 月落日出进度环", note: "进度环缓慢充满，月亮淡切太阳、背景由夜蓝暖到晨曦琥珀。" },
    } as Record<string, Copy>,
  },
  en: {
    heading: "Motion motifs · 9 loops",
    sub: "Nine interaction motifs extracted from Tide's current release (5.11, Sep 2026), each rebuilt as a portrait phone screen running pure-CSS keyframe loops. Click any card for the motif detail and copy its prompt for AI to recreate 1:1.",
    source: "Reference: Tide's official App Store screenshots (v5.11.2, updated 2026-09-13)",
    replay: "Replay",
    prompt: "Copy prompt",
    copied: "Copied",
    detail: "Motif detail",
    prev: "Previous",
    next: "Next",
    close: "Close",
    openHint: "Click for the motion detail & prompt",
    scenes: {
      home: { title: "Home · full-bleed scene + glass tabs", note: "The nature backdrop cross-fades while a green capsule slides across the bottom tab bar." },
      sounds: { title: "Soundscapes · circle-to-immersive", note: "A round scene thumbnail expands full-screen; the play icon morphs and the waveform undulates." },
      focus: { title: "Pomodoro · scrolling tick ruler", note: "Colored task capsules bounce on select while tick marks scroll left and minutes roll down." },
      breath: { title: "Breathing · 4-4-4-4 pulse circle", note: "A glow circle grows on inhale, holds, shrinks on exhale, with the instruction word switching per phase." },
      sleep: { title: "Sleep report · growing stage bars", note: "Sleep-stage bars grow in stagger on a white card, the score counts up, snore pills slide in." },
      quotes: { title: "Quotes · swipeable card deck", note: "The top photo card flies off upper-left, the next snaps into place — two swaps per loop." },
      stories: { title: "Sleep stories · staggered feed", note: "Illustrated cards float up in stagger while a glass play badge pops, then the scene resets." },
      meditate: { title: "Meditation · arch-window hero card", note: "The arch illustration breathes at scale while the glass play button emits pulse rings." },
      nap: { title: "Nap wake · moon-to-sun progress ring", note: "A progress ring fills as the moon dissolves into a sun and the screen warms from night to dawn." },
    } as Record<string, Copy>,
  },
};

const T = (zh: string, en: string, locale: "zh" | "en") => (locale === "en" ? en : zh);

const demoUrl = (locale: "zh" | "en", id: string) =>
  `${window.location.origin}${locale === "en" ? "/en" : ""}/distill/tide?m=${id}`;

function buildPrompt(id: string, locale: "zh" | "en") {
  const m = MOTION[id];
  const s = UI[locale].scenes[id];
  if (!m || !s) return "";
  if (locale === "en") {
    return `Please recreate one interaction animation for me. First open the reference links below and actually look at the current UI, then implement its interaction form 1:1:

- The app: Tide (tide.fm) — a meditation / sleep / focus app, current version 5.11
- Official screenshots: ${SOURCE_URL}
- My recreation (interactive live demo, loops automatically): ${demoUrl(locale, id)}

${TIDE_STYLE_EN}

The animation — ${s.title}: ${m.en}

Requirements: render it as a portrait phone screen (roughly 9:19.5 container, the motion happens inside the screen); implement with React + CSS keyframes (no third-party animation libraries), a ~6–16s auto-replay loop, use your own imagery and copy, and do not copy any assets or code from the reference sources.`;
  }
  return `请帮我复刻一个 App 交互动画。先打开下面的参考链接，实际查看潮汐当前版本（5.11）的真实界面，再按它的交互形式 1:1 实现：

- 原版 App：潮汐 Tide（冥想 / 睡眠 / 专注 App，官网 https://tide.fm）
- 官方截图：${SOURCE_URL}
- 我的还原版（可交互 live demo，自动循环）：${demoUrl(locale, id)}

${TIDE_STYLE_ZH}

动画形态——${s.title}：${m.zh}

要求：画面按手机竖屏 App 界面呈现（约 9:19.5 的竖屏容器，动画发生在屏幕内）；用 React + CSS 关键帧实现（不依赖第三方动画库），自动循环重播；图片素材与文案自有，不要搬运参考来源的任何素材与代码。`;
}

/* ---------- 9 个循环场景 ---------- */

function HomeScene({ locale }: { locale: "zh" | "en" }) {
  return (
    <div className="tdm-scene s-home">
      <div className="hm-bg"><i className="b1" /><i className="b2" /></div>
      <div className="hm-top">
        <b>{T("晚上好", "Good evening", locale)}</b>
        <span className="hm-glass g1">♪</span>
        <span className="hm-glass g2">⊞</span>
        <span className="hm-glass g3">◐</span>
      </div>
      <span className="hm-tag">{T("自然好睡眠", "Sleep in nature", locale)}</span>
      <div className="hm-quick">
        <span><i>◎</i><em>{T("心流专注", "Flow", locale)}</em></span>
        <span><i>◗</i><em>{T("睡眠监测", "Sleep", locale)}</em></span>
        <span><i>◔</i><em>{T("小憩", "Nap", locale)}</em></span>
      </div>
      <div className="hm-tabs">
        <i className="pill" />
        <span>{T("首页", "Home", locale)}</span>
        <span>{T("睡眠", "Sleep", locale)}</span>
        <span>{T("正念", "Mind", locale)}</span>
        <span>{T("声音", "Sounds", locale)}</span>
      </div>
    </div>
  );
}

function SoundsScene({ locale }: { locale: "zh" | "en" }) {
  return (
    <div className="tdm-scene s-sounds">
      <b className="tdm-h4 dark">{T("声音场景", "Soundscapes", locale)}</b>
      <div className="sd-grid">
        <span className="c rain" />
        <span className="c forest" />
        <span className="c sunrise" />
        <span className="c saturn" />
      </div>
      <div className="sd-names">
        <span>{T("雨天", "Rain", locale)}</span><span>{T("森林", "Forest", locale)}</span>
        <span>{T("她的城市", "Her city", locale)}</span><span>{T("日出", "Sunrise", locale)}</span>
      </div>
      <div className="sd-hero">
        <b>{T("雨天 · 窗台", "Rain · Windowsill", locale)}</b>
        <div className="sd-bars"><i /><i /><i /><i /><i /><i /><i /></div>
        <div className="sd-btn"><i className="tri" /><i className="pr"><u /><u /></i></div>
      </div>
      <b className="tdm-cap">{T("点圆形场景卡，放大进入沉浸", "Tap a circle to go immersive", locale)}</b>
    </div>
  );
}

function FocusScene({ locale }: { locale: "zh" | "en" }) {
  return (
    <div className="tdm-scene s-focus">
      <div className="fo-chips">
        <span className="ch orange">{T("工作", "Work", locale)}</span>
        <span className="ch green on">{T("背单词", "Recite", locale)}</span>
        <span className="ch blue">{T("设计", "Design", locale)}</span>
        <span className="ch teal">{T("阅读", "Read", locale)}</span>
        <span className="ch olive">{T("做家务", "Chores", locale)}</span>
      </div>
      <div className="fo-card">
        <b>{T("专注", "Focus", locale)}</b>
        <div className="fo-min"><div className="roll"><u>25</u><u>24</u><u>23</u></div><em>{T("分钟", "min", locale)}</em></div>
        <div className="fo-ruler"><div className="ticks">{Array.from({ length: 42 }).map((_, i) => <i key={i} />)}</div><span className="cursor" /></div>
        <em className="fo-tag">{T("专注 ›", "Focus ›", locale)}</em>
      </div>
      <div className="fo-sheet">
        <span><i className="av" />{T("旅程", "Journey", locale)}<em>{T("专注场景", "Soundscape", locale)}</em></span>
        <span className="divi" />
        <span>{T("番茄钟", "Pomodoro", locale)}<em>{T("专注模式", "Focus mode", locale)}</em></span>
      </div>
      <div className="fo-start">{T("开始专注", "Start", locale)}</div>
    </div>
  );
}

function BreathScene({ locale }: { locale: "zh" | "en" }) {
  return (
    <div className="tdm-scene s-breath">
      <b className="tdm-h4">{T("呼吸 · 放松训练", "Breathing · Relax", locale)}</b>
      <div className="br-circle">
        <i className="halo h1" /><i className="halo h2" />
        <i className="core" />
        <span className="w1">{T("吸气", "Inhale", locale)}</span>
        <span className="w2">{T("屏息", "Hold", locale)}</span>
        <span className="w3">{T("呼气", "Exhale", locale)}</span>
        <span className="w4">{T("屏息", "Hold", locale)}</span>
      </div>
      <b className="tdm-cap">{T("跟着圆圈呼吸，4-4-4-4", "Breathe with the circle, 4-4-4-4", locale)}</b>
    </div>
  );
}

function SleepScene({ locale }: { locale: "zh" | "en" }) {
  return (
    <div className="tdm-scene s-sleep">
      <div className="sl-card">
        <div className="sl-head">
          <div><small>{T("昨晚睡了", "Last night", locale)}</small><b><div className="roll"><u>{T("7小时50分钟", "7h 50m", locale)}</u><u>{T("8小时16分钟", "8h 16m", locale)}</u></div></b></div>
          <span className="sl-score"><em>{T("睡眠评分", "Score", locale)}</em><div className="numroll"><u>0</u><u>47</u><u>78</u><u>94</u></div></span>
        </div>
        <div className="sl-bars">
          <i className="d" /><i className="l" /><i className="l" /><i className="p" /><i className="p" /><i className="p" /><i className="l" /><i className="p" /><i className="p" /><i className="l" /><i className="a" /><i className="l" /><i className="p" /><i className="a" />
        </div>
        <div className="sl-legend"><span className="a">{T("清醒", "Awake", locale)}</span><span className="l">{T("浅睡", "Light", locale)}</span><span className="p">{T("深睡", "Deep", locale)}</span></div>
        <div className="sl-metrics">
          <span>{T("梦话时长", "Talking", locale)}<b>10″</b></span>
          <span>{T("鼾声时长", "Snoring", locale)}<b>8″</b></span>
          <span>{T("环境音量", "Ambient", locale)}<b>32dB</b></span>
        </div>
      </div>
      <div className="sl-pill p1"><i>💤</i>{T("梦话", "Talking", locale)}<span className="mini"><i /><i /><i /><i /><i /></span>10″</div>
      <div className="sl-pill p2"><i>😴</i>{T("鼾声", "Snoring", locale)}<span className="mini"><i /><i /><i /><i /><i /></span>8″</div>
    </div>
  );
}

function QuotesScene({ locale }: { locale: "zh" | "en" }) {
  return (
    <div className="tdm-scene s-quotes">
      <b className="tdm-h4 dark">{T("正念格言", "Daily quotes", locale)}</b>
      <div className="qt-deck">
        <span className="card c3" />
        <span className="card c2">
          <b>02</b><small>SEP 2026</small>
          <p>{T("把心带回当下，一步一呼吸。", "Bring the mind home to this breath, this step.", locale)}</p>
          <em>{T("一行禅师", "Thich Nhat Hanh", locale)}</em>
        </span>
        <span className="card c1">
          <b>01</b><small>SEP 2026</small>
          <p>{T("我们无法遏制波浪，但我们可以学会冲浪。", "You can't stop the waves, but you can learn to surf.", locale)}</p>
          <em>{T("正念冥想大师 · 乔·卡巴金", "Jon Kabat-Zinn", locale)}</em>
        </span>
      </div>
      <b className="tdm-cap dark">{T("左滑换下一张格言卡", "Swipe left for the next quote", locale)}</b>
    </div>
  );
}

function StoriesScene({ locale }: { locale: "zh" | "en" }) {
  return (
    <div className="tdm-scene s-stories">
      <b className="tdm-h4 dark">{T("睡眠故事", "Sleep stories", locale)}</b>
      <div className="st-grid">
        <span className="c art-a"><em>{T("山间溯溪", "Upstream", locale)}</em></span>
        <span className="c art-b"><i className="badge">▶</i><em>{T("夜游者", "Night swimmer", locale)}</em></span>
        <span className="c art-c"><em>{T("兔子洞之夏", "Rabbit hole", locale)}</em></span>
        <span className="c art-d"><em>{T("地中海的和平气味", "Mediterranean", locale)}</em></span>
      </div>
      <b className="tdm-cap dark">{T("影视级插画卡 · 错峰浮入", "Cinematic cards, staggered float-in", locale)}</b>
    </div>
  );
}

function MeditateScene({ locale }: { locale: "zh" | "en" }) {
  return (
    <div className="tdm-scene s-meditate">
      <b className="tdm-h4 dark">{T("正念冥想", "Meditation", locale)}</b>
      <div className="md-hero">
        <div className="md-arch"><i className="moon" /><i className="ridge" /></div>
        <div className="md-meta">
          <b>{T("正念冥想 · 入门", "Meditation · Beginner", locale)}</b>
          <small>{T("8 章 · 系列", "8 chapters · series", locale)}</small>
        </div>
        <div className="md-btn"><i className="tri" /><i className="ring r1" /><i className="ring r2" /></div>
      </div>
      <div className="md-minis">
        <span className="m1">{T("YogaNidra 温暖入眠", "Yoga Nidra", locale)}</span>
        <span className="m2">{T("缓解疲劳", "Unwind", locale)}</span>
      </div>
    </div>
  );
}

function NapScene({ locale }: { locale: "zh" | "en" }) {
  return (
    <div className="tdm-scene s-nap">
      <i className="np-dawn" />
      <b className="tdm-h4">{T("小憩 · 20 分钟", "Nap · 20 min", locale)}</b>
      <svg className="np-svg" viewBox="0 0 200 200" aria-hidden="true">
        <circle className="trk" cx="100" cy="100" r="80" pathLength={100} />
        <circle className="bar" cx="100" cy="100" r="80" pathLength={100} />
      </svg>
      <div className="np-body">
        <i className="moon" />
        <i className="sun" />
      </div>
      <div className="np-text">
        <span className="a">{T("轻唤醒中", "Gentle wake…", locale)}</span>
        <span className="b">{T("早安", "Good morning", locale)}</span>
      </div>
      <b className="tdm-cap">{T("醒来前 1 分钟，光与声渐亮", "Light fades in 1 min before", locale)}</b>
    </div>
  );
}

const SCENES: { id: string; light?: boolean; render: (locale: "zh" | "en") => React.ReactNode }[] = [
  { id: "home", render: (l) => <HomeScene locale={l} /> },
  { id: "sounds", light: true, render: (l) => <SoundsScene locale={l} /> },
  { id: "focus", render: (l) => <FocusScene locale={l} /> },
  { id: "breath", render: (l) => <BreathScene locale={l} /> },
  { id: "sleep", light: true, render: (l) => <SleepScene locale={l} /> },
  { id: "quotes", light: true, render: (l) => <QuotesScene locale={l} /> },
  { id: "stories", light: true, render: (l) => <StoriesScene locale={l} /> },
  { id: "meditate", light: true, render: (l) => <MeditateScene locale={l} /> },
  { id: "nap", render: (l) => <NapScene locale={l} /> },
];

const SCENE_IDS = SCENES.map((s) => s.id);

const Icon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);
const ICONS = {
  expand: "M9 4H4v5 M15 4h5v5 M9 20H4v-5 M15 20h5v-5",
  replay: "M3 12a9 9 0 1 0 3-6.7 M3 4v5h5",
  prev: "M15 6l-6 6 6 6",
  next: "M9 6l6 6-6 6",
  close: "M6 6l12 12 M18 6L6 18",
};

function Phone({ light, children }: { light?: boolean; children: React.ReactNode }) {
  return (
    <div className={`tdm-phone${light ? " light" : ""}`}>
      <div className="tdm-phone-inner">
        <div className="tdm-sb">
          <b>9:41</b>
          <i className="cam" />
          <i className="bat"><i /></i>
        </div>
        {children}
        <i className="tdm-home" />
      </div>
    </div>
  );
}

export default function TideMotionGallery({ locale = "zh" }: { locale?: "zh" | "en" }) {
  const u = UI[locale];
  const [cycle, setCycle] = useState(0);
  const [open, setOpen] = useState<string | null>(null);

  // 挂载后读取 ?m= 深链，直接打开对应动效详情
  useEffect(() => {
    const m = new URLSearchParams(window.location.search).get("m");
    if (m && SCENE_IDS.includes(m)) setOpen(m);
  }, []);

  // 详情深链同步：?m=母题id 可直接打开对应动效详情
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (open) q.set("m", open);
    else q.delete("m");
    const qs = q.toString();
    window.history.replaceState(null, "", window.location.pathname + (qs ? `?${qs}` : ""));
  }, [open]);

  const idx = open ? SCENE_IDS.indexOf(open) : -1;
  const step = (d: number) => setOpen(SCENE_IDS[(idx + d + SCENE_IDS.length) % SCENE_IDS.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  });

  const scene = idx >= 0 ? SCENES[idx] : undefined;
  const copy = open ? u.scenes[open] : undefined;

  return (
    <section className="tdm-root" id="tide-motion">
      <header className="tdm-head">
        <div>
          <h2>{u.heading}</h2>
          <p>{u.sub}</p>
        </div>
      </header>
      <div className="tdm-grid" key={cycle}>
        {SCENES.map((s) => (
          <figure
            className="tdm-card"
            id={s.id}
            key={s.id}
            onClick={() => setOpen(s.id)}
            title={u.openHint}
          >
            <div className="tdm-viewport">
              <div className="tdm-phonebox"><Phone light={s.light}>{s.render(locale)}</Phone></div>
              <span className="tdm-veil"><b>{u.scenes[s.id]?.title}</b></span>
              <button
                type="button"
                className="tdm-round tdm-replay"
                aria-label={u.replay}
                title={u.replay}
                onClick={(e) => {
                  e.stopPropagation();
                  setCycle((c) => c + 1);
                }}
              >
                <Icon d={ICONS.replay} />
              </button>
              <span className="tdm-round tdm-expand" aria-hidden="true">
                <Icon d={ICONS.expand} />
              </span>
            </div>
            <figcaption>
              <b>{u.scenes[s.id]?.title}</b>
              <span>{u.scenes[s.id]?.note}</span>
            </figcaption>
          </figure>
        ))}
      </div>
      <footer className="tdm-foot">{u.source}</footer>

      {scene && copy && open && (
        <div className="tdmm-backdrop" onPointerDown={(e) => e.target === e.currentTarget && setOpen(null)}>
          <div className="tdmm-panel" role="dialog" aria-modal="true" aria-label={copy.title}>
            <div className="tdmm-head">
              <div className="tdmm-title">
                <b>{copy.title}</b>
                <em>{idx + 1} / {SCENE_IDS.length}</em>
              </div>
              <div className="tdmm-nav">
                <button type="button" aria-label={u.prev} title={u.prev} onClick={() => step(-1)}><Icon d={ICONS.prev} /></button>
                <button type="button" aria-label={u.next} title={u.next} onClick={() => step(1)}><Icon d={ICONS.next} /></button>
                <button type="button" aria-label={u.replay} title={u.replay} onClick={() => setCycle((c) => c + 1)}><Icon d={ICONS.replay} /></button>
                <button type="button" aria-label={u.close} title={u.close} onClick={() => setOpen(null)}><Icon d={ICONS.close} /></button>
              </div>
            </div>
            <div className="tdmm-stage">
              <div className="tdm-phonebox" key={open + cycle}><Phone light={scene.light}>{scene.render(locale)}</Phone></div>
            </div>
            <p className="tdmm-desc">{MOTION[open][locale]}</p>
            <div className="tdmm-actions">
              <MotionPromptButton label={u.prompt} copiedLabel={u.copied} buildPrompt={() => buildPrompt(open, locale)} />
              <a className="tdmm-src" href={SOURCE_URL} target="_blank" rel="noreferrer">{u.source}</a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
