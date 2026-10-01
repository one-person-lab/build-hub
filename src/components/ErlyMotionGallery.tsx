"use client";

import { useEffect, useState } from "react";
import MotionPromptButton from "./MotionPromptButton";
import "./ErlyMotionGallery.css";

type Copy = { title: string; note: string };

const SOURCE_URL = "https://apps.apple.com/us/app/id6751428380";

// Erly 没有站内设计风格条目，把视觉基调直接写进提示词（对齐 2026 年 1.3.15 版界面）
const ERLY_STYLE_ZH =
  "视觉基调：Apple 原生风极简浅色界面——暖白灰底（约 #f2f1ef）+ 纯白大圆角卡片（18-24px）+ 浅灰分组底（#e8e7e4）与发丝分隔线；正文近黑、辅助信息中灰，强调色只有 iOS 绿（开关与对勾 #2fc45f）、首页一枚淡紫呼吸光球、里程碑的虹彩圆盘徽章和紫水晶八边形徽章；闹钟时间用超大号粗黑数字，主 CTA 是通栏黑色胶囊，红色只留给破坏性操作；全站无插画无装饰，靠留白和字号层级撑住";
const ERLY_STYLE_EN =
  "Visual base: a minimal, Apple-native light UI — warm off-white background (~#f2f1ef), pure-white large-radius cards (18-24px), pale-grey inset groups (#e8e7e4) and hairline dividers; near-black body text with mid-grey secondary. The only accents are iOS green (toggles and checks, #2fc45f), one lavender breathing orb on the home screen, and iridescent disc badges plus an amethyst octagon gem on Milestones. Alarm times are huge heavy numerals, the primary CTA is a full-width black capsule, red is reserved for destructive actions — no illustration, no ornament; the page is carried by whitespace and type scale";

// 每个母题的实现级描述，供 AI 复刻用
const MOTION: Record<string, { zh: string; en: string }> = {
  home: {
    zh: "极简首页 + 呼吸光球：暖白底，左上「Erly」字标、右上 🔥 连击数用滚动数字条从 42 跳到 43 并做一次放大回弹。下方一周日期条（Wed 29 → Tue 4）横向排开，每列是「星期 / 日期 / 橙色小太阳」，已完成的太阳以 90ms 错峰淡入点亮，今日（Mon 3）套一枚上浮的白色圆角卡、阴影加深，未来日换成灰色月亮。屏幕正中一枚直径 132px 的淡紫径向渐变光球以 4s ease-in-out 做 0.92→1.06 呼吸缩放，两圈淡紫外环错峰由内向外扩散淡出。底部白色卡里 NEXT ALARM 小标 + 超大号等宽「6:30 AM」（从 6:31 滚动跳下）+ Tomorrow + 发丝线 + 两列 Push-ups/Mission、Birds/Sound。10s 循环复位。",
    en: "A minimal home screen with a breathing orb: on warm off-white, the 'Erly' wordmark sits top-left while a 🔥 streak counter rolls 42 → 43 on a digit strip and punches once. Below, a one-week date strip (Wed 29 → Tue 4) shows weekday / date / small orange sun per column — completed suns fade in with a 90ms stagger, today (Mon 3) is lifted inside a white rounded card with a deeper shadow, and the future day shows a grey moon. Dead center, a 132px lavender radial-gradient orb breathes 0.92 → 1.06 over 4s ease-in-out while two faint halo rings expand outward and fade in alternation. The bottom white card holds a NEXT ALARM kicker, an oversized monospaced '6:30 AM' that rolls down from 6:31, 'Tomorrow', a hairline, then two columns: Push-ups/Mission and Birds/Sound. 10s loop, then reset.",
  },
  alarms: {
    zh: "闹钟列表开关拨动：「Alarms」大标题下两张白卡。每张卡上半行是粗体名称（Gym / School）+ 两枚浅灰胶囊标签（🎥 Push-ups、🔊 Birds / 🔍 Item Search、🔊 Mayhem）+ 右侧铅笔；下半行浅灰底里放「Weekends」小标 + 大号「6:30 AM」+ 右侧 iOS 绿开关。动效：卡片依次上浮淡入，胶囊标签以回弹 scale 逐个弹出；两枚开关先后从灰拨到绿——白色圆钮 240ms 缓出滑到右侧、轨道底色交叉淡变，拨到端的瞬间从开关外圈放出一圈绿色涟漪。8s 循环复位。",
    en: "An alarm list with toggles flipping on: under a large 'Alarms' title sit two white cards. Each card's top row has a bold name (Gym / School), two pale-grey capsule tags (🎥 Push-ups, 🔊 Birds / 🔍 Item Search, 🔊 Mayhem) and a pencil; the lower inset row holds a 'Weekends' label, a big '6:30 AM' and an iOS-green switch. Motion: the cards slide up and fade in, the capsules pop in one by one with a springy scale, then the two switches flip grey → green one after another — the white knob glides right over 240ms with ease-out while the track cross-fades — and a green ripple expands from the switch's edge as it lands. 8s loop.",
  },
  mission: {
    zh: "任务验证倒计时：Erly 日出字标下方一枚大圆角（28px）取景框，框内用 CSS 自绘清晨房间（米色墙面渐变 + 木地板 + 窗光），一个深灰剪影小人做俯卧撑——身体以 1.1s 一次上下压放、双臂随之屈伸。框内顶部叠白字「Push-ups for 15s」，底部一枚 🔔 每 600ms 左右甩动一次并带 2° 旋转。框外大号「15s」以滚动数字条逐档递减到 9s，下方一条 3px 细进度条同步从 0 填到满；读秒结束后整块取景框闪一层绿色描边、中央弹出白色对勾圆环，随后复位。10s 循环。",
    en: "A mission verification countdown: under the Erly sunrise wordmark, a large-radius (28px) camera frame contains self-drawn morning-room art (beige wall gradient, wood floor, window light) where a dark-grey silhouette figure does push-ups — body pressing down and up once per 1.1s with arms bending in sync. White text overlays the top of the frame ('Push-ups for 15s') and a 🔔 near its bottom edge swings left-right every 600ms with a 2° tilt. Outside, a big '15s' ticks down to 9s on a rolling digit strip while a 3px progress bar fills from 0 in lockstep; when the count ends the frame flashes a green outline and a white check ring pops at center, then everything resets. 10s loop.",
  },
  choose: {
    zh: "任务选择 bottom sheet：背景压暗成半透明灰，一张顶部大圆角（28px）的白色 sheet 从屏幕下方 320px 滑入并回弹落定，顶端带灰色拖拽条。头部左侧 ✕ 关闭钮、居中标题「Choose a Mission」+ 灰色副标「Complete a mission to turn off your alarm」。下方双列 6 张白色任务卡（🤸 Push-ups、🔍 Item Search、🏋 Squats、📕 Bible Verse、📖 Devotional、🌤️ Picture of Sky），每卡是「大号 emoji + 粗体名 + 两行灰描述」，按 70ms 错峰从下方 14px 浮入淡显；停留后其中一枚（Item Search）外圈套上一圈黑色描边、卡内 emoji 回弹放大一次表示选中，最后整张 sheet 向下滑出复位。8s 循环。",
    en: "A mission-picker bottom sheet: the page dims to translucent grey while a white sheet with 28px top corners slides up from 320px below, landing with a bounce under a grey grabber bar. Its header has an ✕ on the left and a centered 'Choose a Mission' title over the grey subtitle 'Complete a mission to turn off your alarm'. Below, a two-column grid of six white mission cards (🤸 Push-ups, 🔍 Item Search, 🏋 Squats, 📕 Bible Verse, 📖 Devotional, 🌤️ Picture of Sky) — each a big emoji, a bold name and two grey lines — float up 14px and fade in on a 70ms stagger. After a hold, one card (Item Search) gets a black ring around its edge and its emoji bounces larger once to confirm the pick, then the whole sheet slides back down and the loop resets. 8s.",
  },
  win: {
    zh: "打卡成功页：日出字标下三行居中排版——灰色「🕐 Wake up time」+ 超大号「6:30 AM」+ 灰色「🏋 Push Ups · 52s」，依次上浮淡入。下方一张白色大圆角卡整卡 scale .96→1 弹出，卡内「🔥 43 day streak」的 43 用滚动数字从 42 跳上并放大回弹；其下 7 枚 iOS 绿圆底白色对勾从周二到周一以 110ms 错峰弹出（先 scale 1.25 再落回 1），对勾本身用描边动画画出，灰色星期字标随圆点一起淡入。卡外「⇪ Share」最后淡入，底部通栏黑色胶囊「Close」上浮落定；两枚彩色纸屑从顶部斜飘而过。9s 循环复位。",
    en: "A check-in success screen: under the sunrise wordmark, three centered lines — grey '🕐 Wake up time', an oversized '6:30 AM', grey '🏋 Push Ups · 52s' — slide up and fade in in sequence. A white large-radius card then pops in at scale .96 → 1; inside, the 43 in '🔥 43 day streak' rolls up from 42 and punches larger before settling, and seven iOS-green discs with white checks pop in from Tuesday to Monday on a 110ms stagger (overshooting to 1.25 then landing at 1) while each check draws itself with a stroke animation and its grey weekday label fades in with it. Outside the card, '⇪ Share' fades in last and the full-width black 'Close' capsule slides up into place; two confetti strips drift across the top. 9s loop.",
  },
  badge: {
    zh: "里程碑徽章墙：左上圆形白色返回钮（‹）淡入，「Milestones」大标题上浮。两枚主数据并排——🔥 火焰里叠滚动数字 0→21→43 与「Day Streak」，紫水晶八边形徽章（金色描边 + 内面高光）里叠 9 与「Badges Earned」，两枚先后以回弹 scale 弹出。下方两张小白卡：「🔥 82 days / longest streak」滑入，「9/16 badges」卡内一条黑色进度条从 0 填到 56%。再往下「Streak Badges」分组里 3×2 枚虹彩圆盘（conic-gradient 淡紫/淡蓝/薄荷/藕粉）逐枚弹出，盘面一圈高光持续缓慢旋转做流光，最后一枚保持灰态并带小锁图标。10s 循环复位。",
    en: "A milestone badge wall: a round white back button (‹) fades in at top-left and the 'Milestones' title floats up. Two headline stats sit side by side — a flame holding a rolling 0 → 21 → 43 over 'Day Streak', and an amethyst octagon badge (gold rim, inner facet highlight) holding 9 over 'Badges Earned' — each popping in with a springy scale in turn. Below, two small white cards: '🔥 82 days / longest streak' slides in, and inside the '9/16 badges' card a black progress bar fills from 0 to 56%. Under the 'Streak Badges' group, six iridescent discs (conic-gradient lavender / pale blue / mint / dusty pink) pop in one by one while a rim highlight keeps rotating slowly across each face; the last disc stays greyed with a small padlock. 10s loop.",
  },
  block: {
    zh: "应用锁设置弹层：底层页面压暗，顶部大圆角白色 sheet 滑入落定——左侧圆形返回钮、居中标题「App Blocking」。卡内浅灰分组里首行是区间头：左「🌙 Blocked / 10:00 PM」、中间灰色 →、右「☀️ Unlocked / 7:00 AM」，月亮与太阳图标做 4s 交叉淡切、箭头向右轻推一次。其下三行（🌙 Starts 10:00 PM、☀️ Ends 30 min after alarm、▦ Apps All apps）以 80ms 错峰从左滑入，行间发丝线依次展开，行尾灰色 › 最后淡入。分组外通栏黑色胶囊「Done」上浮做一次呼吸脉冲，最底部浅灰卡里红字「Turn Off App Blocking」最后淡入。8s 循环复位。",
    en: "An app-blocking settings sheet: the page behind dims as a white sheet with rounded top corners slides in and lands — a round back button on the left, an 'App Blocking' title centered. Its grey inset group opens with a range header: '🌙 Blocked / 10:00 PM' on the left, a grey → in the middle, '☀️ Unlocked / 7:00 AM' on the right, where the moon and sun icons cross-fade over 4s and the arrow nudges right once. Three rows below (🌙 Starts 10:00 PM, ☀️ Ends 30 min after alarm, ▦ Apps All apps) slide in from the left on an 80ms stagger, their hairline dividers wipe open, and the grey trailing › fades in last. Outside the group, the full-width black 'Done' capsule slides up and pulses once, and the red 'Turn Off App Blocking' label fades in last inside a pale card. 8s loop.",
  },
};

const UI = {
  zh: {
    heading: "动效母题 · 7 段",
    sub: "从 Erly 当前版本（1.3.15，2026-09）真实界面提炼的 7 个动效母题，全部复刻为手机竖屏画面、纯 CSS 关键帧循环播放；点击任意卡片查看动效详情，复制提示词让 AI 1:1 复刻。",
    source: "参考来源：Erly App Store 官方截图（v1.3.15，2026-09-21 更新）",
    replay: "重播",
    prompt: "复制提示词",
    copied: "已复制",
    detail: "动效详情",
    prev: "上一个",
    next: "下一个",
    close: "关闭",
    openHint: "点击查看动效详情与提示词",
    scenes: {
      home: { title: "首页 · 呼吸光球+连击跳数", note: "淡紫光球 4s 呼吸缩放，今日白卡上浮，🔥 数字滚动跳档。" },
      alarms: { title: "闹钟列表 · 开关拨动+涟漪", note: "白卡上浮入，胶囊标签回弹，绿色开关拨到端放出一圈涟漪。" },
      mission: { title: "任务验证 · 取景框倒计时", note: "剪影小人做俯卧撑，秒数逐档递减、细进度条同步填满。" },
      choose: { title: "任务选择 · sheet 弹入+卡片错峰", note: "白色弹层回弹落定，六张任务卡逐个浮入后选中一枚。" },
      win: { title: "打卡成功 · 对勾连排弹出", note: "七枚绿色对勾错峰弹出描边，连击数跳档后黑色胶囊落定。" },
      badge: { title: "里程碑 · 虹彩徽章流光", note: "徽章回弹弹出，盘面高光旋转流光，9/16 进度条填充。" },
      block: { title: "应用锁 · 昼夜交叉淡切+行滑入", note: "月亮与太阳交叉淡切，设置行错峰左滑、发丝线展开。" },
    } as Record<string, Copy>,
  },
  en: {
    heading: "Motion motifs · 7 loops",
    sub: "Seven interaction motifs extracted from Erly's current release (1.3.15, Sep 2026), each rebuilt as a portrait phone screen running pure-CSS keyframe loops. Click any card for the motif detail and copy its prompt for AI to recreate 1:1.",
    source: "Reference: Erly's official App Store screenshots (v1.3.15, updated 2026-09-21)",
    replay: "Replay",
    prompt: "Copy prompt",
    copied: "Copied",
    detail: "Motif detail",
    prev: "Previous",
    next: "Next",
    close: "Close",
    openHint: "Click for the motion detail & prompt",
    scenes: {
      home: { title: "Home · breathing orb + streak roll", note: "A lavender orb breathes on a 4s cycle while today lifts and the 🔥 number rolls." },
      alarms: { title: "Alarms · switches flipping on", note: "Cards float in, capsules pop, and each green switch lands with a ripple." },
      mission: { title: "Mission · countdown in the frame", note: "A silhouette does push-ups as the seconds tick down and the thin bar fills." },
      choose: { title: "Picker · sheet + staggered cards", note: "The white sheet lands with a bounce and six mission cards float in one by one." },
      win: { title: "Success · checkmarks popping in", note: "Seven green checks pop and stroke themselves before the black capsule lands." },
      badge: { title: "Milestones · iridescent badge discs", note: "Badges spring in, a highlight sweeps each disc, the 9/16 bar fills." },
      block: { title: "App block · moon-to-sun crossfade", note: "Moon and sun cross-fade while setting rows slide in and dividers wipe open." },
    } as Record<string, Copy>,
  },
};

const T = (zh: string, en: string, locale: "zh" | "en") => (locale === "en" ? en : zh);

const demoUrl = (locale: "zh" | "en", id: string) =>
  `${window.location.origin}${locale === "en" ? "/en" : ""}/distill/erly?m=${id}`;

function buildPrompt(id: string, locale: "zh" | "en") {
  const m = MOTION[id];
  const s = UI[locale].scenes[id];
  if (!m || !s) return "";
  if (locale === "en") {
    return `Please recreate one interaction animation for me. First open the reference links below and actually look at the current UI, then implement its interaction form 1:1:

- The app: Erly (erly.co) — an accountability alarm app for waking up early, current version 1.3.15
- Official screenshots: ${SOURCE_URL}
- My recreation (interactive live demo, loops automatically): ${demoUrl(locale, id)}

${ERLY_STYLE_EN}

The animation — ${s.title}: ${m.en}

Requirements: render it as a portrait phone screen (roughly 9:19.5 container, the motion happens inside the screen); implement with React + CSS keyframes (no third-party animation libraries), a ~8–10s auto-replay loop, use your own imagery and copy, and do not copy any assets or code from the reference sources.`;
  }
  return `请帮我复刻一个 App 交互动画。先打开下面的参考链接，实际查看 Erly 当前版本（1.3.15）的真实界面，再按它的交互形式 1:1 实现：

- 原版 App：Erly（早起问责闹钟 / 习惯打卡 App，官网 https://erly.co）
- 官方截图：${SOURCE_URL}
- 我的还原版（可交互 live demo，自动循环）：${demoUrl(locale, id)}

${ERLY_STYLE_ZH}

动画形态——${s.title}：${m.zh}

要求：画面按手机竖屏 App 界面呈现（约 9:19.5 的竖屏容器，动画发生在屏幕内）；用 React + CSS 关键帧实现（不依赖第三方动画库），自动循环重播；图片素材与文案自有，不要搬运参考来源的任何素材与代码。`;
}

/* ---------- 7 个循环场景 ---------- */

/** Erly 字标：日出（半圆 + 光芒 + 地平线弧） */
function Logo() {
  return (
    <span className="er-logo">
      <i className="mark">
        <b className="sun" />
        <b className="ray r1" /><b className="ray r2" /><b className="ray r3" />
        <b className="hz" />
      </i>
      Erly
    </span>
  );
}

const Sun = () => (
  <svg className="er-sun" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="4.6" />
    {Array.from({ length: 8 }).map((_, i) => (
      <line key={i} x1="12" y1="1.6" x2="12" y2="4.4" transform={`rotate(${i * 45} 12 12)`} />
    ))}
  </svg>
);

const Moon = () => (
  <svg className="er-moon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M15.6 3.4a8.6 8.6 0 1 0 5 11 7 7 0 0 1-5-11z" />
  </svg>
);

const WEEK = [
  { w: "Wed", n: 29 },
  { w: "Thu", n: 30 },
  { w: "Fri", n: 31 },
  { w: "Sat", n: 1 },
  { w: "Sun", n: 2 },
  { w: "Mon", n: 3, today: true },
  { w: "Tue", n: 4, future: true },
];

function HomeScene({ locale }: { locale: "zh" | "en" }) {
  return (
    <div className="edm-scene s-e-home">
      <div className="eh-head">
        <b className="eh-title">Erly</b>
        <span className="eh-streak">🔥<span className="win"><span className="roll"><u>42</u><u>43</u></span></span></span>
      </div>
      <div className="eh-week">
        {WEEK.map((d, i) => (
          <span className={`eh-day${d.today ? " today" : ""}`} key={i}>
            <em>{d.w}</em>
            <b>{d.n}</b>
            {d.future ? <Moon /> : <Sun />}
          </span>
        ))}
      </div>
      <div className="eh-orb">
        <i className="halo h1" />
        <i className="halo h2" />
        <i className="core" />
      </div>
      <div className="eh-card">
        <em className="eh-kicker">{T("下一个闹钟", "NEXT ALARM", locale)}</em>
        <b className="eh-time"><span className="win"><span className="roll"><u>6:31 AM</u><u>6:30 AM</u></span></span></b>
        <span className="eh-when">{T("明天", "Tomorrow", locale)}</span>
        <i className="eh-line" />
        <div className="eh-cols">
          <span><i className="ric">🏋</i><b>{T("俯卧撑", "Push-ups", locale)}</b><em>{T("任务", "Mission", locale)}</em></span>
          <i className="divi" />
          <span><i className="ric">🐦</i><b>{T("鸟鸣", "Birds", locale)}</b><em>{T("铃声", "Sound", locale)}</em></span>
        </div>
      </div>
    </div>
  );
}

function AlarmsScene({ locale }: { locale: "zh" | "en" }) {
  return (
    <div className="edm-scene s-e-alarms">
      <b className="ea-h1">{T("闹钟", "Alarms", locale)}</b>
      <div className="ea-card c1">
        <div className="ea-top">
          <b>{T("健身", "Gym", locale)}</b>
          <span className="tag"><i>🎥</i>{T("俯卧撑", "Push-ups", locale)}</span>
          <span className="tag"><i>🔊</i>{T("鸟鸣", "Birds", locale)}</span>
          <i className="pen">✎</i>
        </div>
        <div className="ea-body">
          <div className="ea-when"><em>{T("周末", "Weekends", locale)}</em><b>6:30 AM</b></div>
          <span className="sw on"><i /></span>
        </div>
      </div>
      <div className="ea-card c2">
        <div className="ea-top">
          <b>{T("上学", "School", locale)}</b>
          <span className="tag"><i>🔍</i>{T("找物品", "Item Search", locale)}</span>
          <span className="tag"><i>🔊</i>{T("喧闹", "Mayhem", locale)}</span>
          <i className="pen">✎</i>
        </div>
        <div className="ea-body">
          <div className="ea-when"><em>{T("工作日", "Weekdays", locale)}</em><b>6:00 AM</b></div>
          <span className="sw"><i /></span>
        </div>
      </div>
    </div>
  );
}

function MissionScene({ locale }: { locale: "zh" | "en" }) {
  return (
    <div className="edm-scene s-e-mission">
      <div className="em-head"><Logo /></div>
      <div className="em-frame">
        <i className="em-wall" /><i className="em-window" /><i className="em-floor" />
        <i className="em-figure">
          <b className="head" /><b className="torso" /><b className="arm a1" /><b className="arm a2" /><b className="legs" />
        </i>
        <i className="em-guide" />
        <b className="em-label">{T("做俯卧撑 15 秒", "Push-ups for 15s", locale)}</b>
        <span className="em-bell">🔔</span>
        <i className="em-flash" />
        <i className="em-check"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.6 4.6L19 7.5" /></svg></i>
      </div>
      <b className="em-count"><span className="win"><span className="roll"><u>15s</u><u>13s</u><u>11s</u><u>9s</u></span></span></b>
      <div className="em-bar"><i /></div>
    </div>
  );
}

const MISSIONS = [
  { ic: "🤸", zh: "俯卧撑", en: "Push-ups", dz: "做俯卧撑，强力开启一天", de: "Complete push-ups to start your day strong" },
  { ic: "🔍", zh: "找物品", en: "Item Search", dz: "找到并拍下随机指定物品", de: "Find and photograph a random item" },
  { ic: "🏋", zh: "深蹲", en: "Squats", dz: "做深蹲，强力开启一天", de: "Complete squats to start your day strong" },
  { ic: "📕", zh: "圣经经文", en: "Bible Verse", dz: "大声朗读一节经文开启早晨", de: "Read a Bible verse out loud to begin your morning" },
  { ic: "📖", zh: "灵修", en: "Devotional", dz: "拍下经文并朗读灵修", de: "Photograph a Bible verse and read a devotional" },
  { ic: "🌤", zh: "拍天空", en: "Picture of Sky", dz: "走到户外拍一张天空", de: "Step outside and take a photo of the sky" },
];

function ChooseScene({ locale }: { locale: "zh" | "en" }) {
  return (
    <div className="edm-scene s-e-choose">
      <i className="ec-dim" />
      <div className="ec-sheet">
        <i className="ec-handle" />
        <div className="ec-head">
          <span className="ec-x">✕</span>
          <div>
            <b>{T("选择任务", "Choose a Mission", locale)}</b>
            <em>{T("完成任务才能关掉闹钟", "Complete a mission to turn off your alarm", locale)}</em>
          </div>
        </div>
        <div className="ec-grid">
          {MISSIONS.map((m, i) => (
            <span className={`ec-card k${i}${i === 1 ? " pick" : ""}`} key={m.en}>
              <i>{m.ic}</i>
              <b>{T(m.zh, m.en, locale)}</b>
              <em>{T(m.dz, m.de, locale)}</em>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

const DAYS = ["Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Mon"];

function WinScene({ locale }: { locale: "zh" | "en" }) {
  return (
    <div className="edm-scene s-e-win">
      <div className="ew-head"><Logo /></div>
      <em className="ew-label"><i>🕐</i>{T("起床时间", "Wake up time", locale)}</em>
      <b className="ew-time">6:30 AM</b>
      <em className="ew-sub"><i>🏋</i>{T("俯卧撑 · 52 秒", "Push Ups · 52s", locale)}</em>
      <div className="ew-card">
        <b className="ew-streak">🔥 <span className="win"><span className="roll"><u>42</u><u>43</u></span></span> {T("天连击", "day streak", locale)}</b>
        <div className="ew-week">
          {DAYS.map((d, i) => (
            <span key={d} className={`ew-ck k${i}`}>
              <i><svg viewBox="0 0 24 24"><path d="M6 12.4l4 4L18 7.6" /></svg></i>
              <em>{d}</em>
            </span>
          ))}
        </div>
      </div>
      <span className="ew-share"><i>⇪</i>{T("分享", "Share", locale)}</span>
      <div className="ew-cta">{T("关闭", "Close", locale)}</div>
      <div className="ew-confetti"><i className="cf c1" /><i className="cf c2" /><i className="cf c3" /></div>
    </div>
  );
}

const BADGES = [
  { zh: "早起者", en: "Early Riser", d: 1, hue: "a" },
  { zh: "破晓者", en: "Dawn Seeker", d: 3, hue: "b" },
  { zh: "早鸟", en: "Early Bird", d: 1, hue: "c" },
  { zh: "习惯建立", en: "Routine Builder", d: 10, hue: "d" },
  { zh: "晨型人", en: "Morning Person", d: 14, hue: "e" },
  { zh: "仪式者", en: "Ritualist", d: 21, hue: "f", locked: true },
];

function BadgeScene({ locale }: { locale: "zh" | "en" }) {
  return (
    <div className="edm-scene s-e-badge">
      <i className="eb-back">‹</i>
      <b className="eb-h1">{T("里程碑", "Milestones", locale)}</b>
      <div className="eb-stats">
        <span className="st1">
          <i className="flame">🔥<b><span className="win"><span className="roll"><u>0</u><u>21</u><u>43</u></span></span></b></i>
          <em>{T("连击天数", "Day Streak", locale)}</em>
        </span>
        <span className="st2">
          <i className="gem"><b>9</b></i>
          <em>{T("已获得徽章", "Badges Earned", locale)}</em>
        </span>
      </div>
      <div className="eb-pills">
        <span className="p1"><i>🔥</i><b>82 {T("天", "days", locale)}</b><em>{T("最长连击", "longest streak", locale)}</em></span>
        <span className="p2"><i className="gem-s" /><b>9/16 {T("枚徽章", "badges", locale)}</b><em className="bar"><u /></em></span>
      </div>
      <b className="eb-h2">{T("连击徽章", "Streak Badges", locale)}</b>
      <div className="eb-grid">
        {BADGES.map((b, i) => (
          <span key={b.en} className={`eb-cell k${i}${b.locked ? " locked" : ""}`}>
            <i className={`disc h-${b.hue}`}><b className="shine" /></i>
            <b>{T(b.zh, b.en, locale)}</b>
            <em>{b.d} {T("天连击", "day streak", locale)}</em>
          </span>
        ))}
      </div>
    </div>
  );
}

const BLOCK_ROWS = [
  { ic: "🌙", zh: "开始", en: "Starts", vz: "10:00 PM", ve: "10:00 PM" },
  { ic: "☀️", zh: "结束", en: "Ends", vz: "闹钟后 30 分钟", ve: "30 min after alarm" },
  { ic: "▦", zh: "应用", en: "Apps", vz: "所有应用", ve: "All apps" },
];

function BlockScene({ locale }: { locale: "zh" | "en" }) {
  return (
    <div className="edm-scene s-e-block">
      <i className="ebk-under" />
      <div className="ebk-sheet">
        <div className="ebk-head"><i className="back">‹</i><b>{T("应用锁定", "App Blocking", locale)}</b></div>
        <div className="ebk-card">
          <div className="ebk-range">
            <span className="l"><em><i className="mo">🌙</i>{T("锁定", "Blocked", locale)}</em><b>10:00 PM</b></span>
            <i className="arw">→</i>
            <span className="r"><em><i className="su">☀️</i>{T("解锁", "Unlocked", locale)}</em><b>7:00 AM</b></span>
          </div>
          {BLOCK_ROWS.map((r, i) => (
            <div key={r.en} className={`ebk-row k${i}`}>
              <i>{r.ic}</i><b>{T(r.zh, r.en, locale)}</b><em>{T(r.vz, r.ve, locale)}</em><span>›</span>
            </div>
          ))}
        </div>
        <div className="ebk-cta">{T("完成", "Done", locale)}</div>
        <div className="ebk-off">{T("关闭应用锁定", "Turn Off App Blocking", locale)}</div>
      </div>
    </div>
  );
}

const SCENES: { id: string; light?: boolean; render: (locale: "zh" | "en") => React.ReactNode }[] = [
  { id: "home", light: true, render: (l) => <HomeScene locale={l} /> },
  { id: "alarms", light: true, render: (l) => <AlarmsScene locale={l} /> },
  { id: "mission", light: true, render: (l) => <MissionScene locale={l} /> },
  { id: "choose", light: true, render: (l) => <ChooseScene locale={l} /> },
  { id: "win", light: true, render: (l) => <WinScene locale={l} /> },
  { id: "badge", light: true, render: (l) => <BadgeScene locale={l} /> },
  { id: "block", light: true, render: (l) => <BlockScene locale={l} /> },
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
    <div className={`edm-phone${light ? " light" : ""}`}>
      <div className="edm-phone-inner">
        <div className="edm-sb">
          <b>6:25</b>
          <i className="cam" />
          <i className="bat"><i /></i>
        </div>
        {children}
        <i className="edm-home" />
      </div>
    </div>
  );
}

export default function ErlyMotionGallery({ locale = "zh" }: { locale?: "zh" | "en" }) {
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
    <section className="edm-root" id="erly-motion">
      <header className="edm-head">
        <div>
          <h2>{u.heading}</h2>
          <p>{u.sub}</p>
        </div>
      </header>
      <div className="edm-grid" key={cycle}>
        {SCENES.map((s) => (
          <figure
            className="edm-card"
            id={s.id}
            key={s.id}
            onClick={() => setOpen(s.id)}
            title={u.openHint}
          >
            <div className="edm-viewport">
              <div className="edm-phonebox"><Phone light={s.light}>{s.render(locale)}</Phone></div>
              <span className="edm-veil"><b>{u.scenes[s.id]?.title}</b></span>
              <button
                type="button"
                className="edm-round edm-replay"
                aria-label={u.replay}
                title={u.replay}
                onClick={(e) => {
                  e.stopPropagation();
                  setCycle((c) => c + 1);
                }}
              >
                <Icon d={ICONS.replay} />
              </button>
              <span className="edm-round edm-expand" aria-hidden="true">
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
      <footer className="edm-foot">{u.source}</footer>

      {scene && copy && open && (
        <div className="edmm-backdrop" onPointerDown={(e) => e.target === e.currentTarget && setOpen(null)}>
          <div className="edmm-panel" role="dialog" aria-modal="true" aria-label={copy.title}>
            <div className="edmm-head">
              <div className="edmm-title">
                <b>{copy.title}</b>
                <em>{idx + 1} / {SCENE_IDS.length}</em>
              </div>
              <div className="edmm-nav">
                <button type="button" aria-label={u.prev} title={u.prev} onClick={() => step(-1)}><Icon d={ICONS.prev} /></button>
                <button type="button" aria-label={u.next} title={u.next} onClick={() => step(1)}><Icon d={ICONS.next} /></button>
                <button type="button" aria-label={u.replay} title={u.replay} onClick={() => setCycle((c) => c + 1)}><Icon d={ICONS.replay} /></button>
                <button type="button" aria-label={u.close} title={u.close} onClick={() => setOpen(null)}><Icon d={ICONS.close} /></button>
              </div>
            </div>
            <div className="edmm-stage">
              <div className="edm-phonebox" key={open + cycle}><Phone light={scene.light}>{scene.render(locale)}</Phone></div>
            </div>
            <p className="edmm-desc">{MOTION[open][locale]}</p>
            <div className="edmm-actions">
              <MotionPromptButton label={u.prompt} copiedLabel={u.copied} buildPrompt={() => buildPrompt(open, locale)} />
              <a className="edmm-src" href={SOURCE_URL} target="_blank" rel="noreferrer">{u.source}</a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
