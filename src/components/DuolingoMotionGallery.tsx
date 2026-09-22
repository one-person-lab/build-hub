"use client";

import { useEffect, useState } from "react";
import MotionPromptButton from "./MotionPromptButton";
import "./DuolingoMotionGallery.css";

type Copy = { title: string; note: string };

const SOURCE_URL = "https://www.ripplix.com/apps/duolingo-ui-animations";

// 每个母题的实现级描述，供 AI 复刻用
const MOTION: Record<string, { zh: string; en: string }> = {
  match: {
    zh: "顶部橙色进度条；2×2 词卡网格。点第一张卡变蓝色描边选中态（轻微下压 scale .97），点配对卡后两张同时变浅绿（#d7ffb8），6 颗彩色小粒子从卡中心向四周爆散淡出，两张卡缩小消失；最后橙色「PERFECT」图章带 -3° 倾斜从 2.2x 缩放回弹砸下，停留约 1.5s 后整场复位。",
    en: "Orange progress bar on top; 2×2 grid of word tiles. Tapping the first tile turns it into a blue outlined selected state (slight scale-down press), tapping its pair turns both pale green (#d7ffb8); six colored particles burst outward from the tile centers and fade, the two tiles shrink away; finally an orange PERFECT stamp slams down from 2.2x with a bounce at -3° tilt, holds ~1.5s, then the scene resets.",
  },
  wordbank: {
    zh: "答案行有一枚空卡槽；点底部词块，词块沿弧线飞入卡槽落位（落点轻微过冲回弹），原位留下浅灰占位块；拼完句子后底部 CHECK 按钮由禁用灰变品牌绿（带 3px 深绿底边的按压立体感），随后循环复位。",
    en: "The answer row has one empty slot; tapping a tray chip sends it flying along an arc into the slot with a soft overshoot, leaving a pale gray ghost in the tray; once the sentence is complete the CHECK button arms from disabled gray to brand green (with a 3px darker bottom edge), then the loop resets.",
  },
  chest: {
    zh: "宝箱左右小幅摇摆（±5° 两次）预示升级，背景整屏按 白→浅蓝→浅紫→浅橙 四档步进换色，顶部稀有度文字同步切 COMMON/RARE/EPIC/MEGA；最后箱盖旋转弹开，5 颗蓝色宝石从箱口扇形爆散并定格，+115 计数从下方滑入淡显。",
    en: "The chest shakes side to side (two ±5° wiggles) as rarity rises; the whole background steps through white → light blue → light purple → light orange while the top label switches COMMON/RARE/EPIC/MEGA in sync; finally the lid rotates open, five blue gems burst out in a fan and freeze, and a +115 count slides up and fades in.",
  },
  sheet: {
    zh: "白色面板从底部滑入（顶部大圆角、带轻微回弹），背景压暗 35%；点面板内选项行变蓝描边高亮并弹出绿色对勾；面板向下滑出后，列表里两行按新顺序做 56px 的平滑位移交换，然后复位。",
    en: "A white sheet with large top radii slides up from the bottom with a slight bounce while the backdrop dims to 35%; tapping an option row highlights it with a blue outline and pops a green check; the sheet slides back down, then two list rows smoothly swap positions with a 56px translate, and the scene resets.",
  },
  owl: {
    zh: "绿色猫头鹰吉祥物从下方弹跳入场（scale+translate 回弹），有规律地眨眼、上下微浮；头顶对话气泡先显示三点打字省略号轮动，约 1.5s 后切换为文案；主按钮从禁用灰点亮成品牌绿。",
    en: "The green owl mascot hops in from below with a springy scale+translate, then blinks and bobs on a loop; the chat bubble above it first shows a three-dot typing animation, switching to the message after ~1.5s; the primary button arms from disabled gray to brand green.",
  },
  streak: {
    zh: "列表单选打卡目标：选中项蓝色描边点亮并轻微下压；随后任务卡从下方滑入淡显，卡内黄色进度条从左往右填充，最后 +1 徽章在右上角弹出（回弹缩放）。",
    en: "A single-select list of streak goals: the chosen row lights up with a blue outline and a slight press; then a quest card slides up and fades in, its yellow progress bar fills left to right, and a +1 badge pops at the top-right corner with a bounce.",
  },
  dropdown: {
    zh: "点顶部国旗胶囊（scale .95 按压反馈），背景压暗；下拉面板以左上角为 transform-origin 从小 scale 展开，四行语言选项错峰 80ms 依次淡入上移；收起时整体反向缩回。",
    en: "Tapping the flag pill at the top gives a scale(.95) press feedback and dims the backdrop; the dropdown panel expands from a small scale anchored at its top-left corner, while four language rows fade in and slide up staggered by 80ms; closing reverses the whole thing.",
  },
  node: {
    zh: "路径圆形节点按压缩小（scale .92），绿色圆环脉冲向外扩散淡出；绿色课程卡从节点底部弹出（transform-origin 锚定在节点处、回弹曲线），顶部有小三角指向节点，卡内含白色 START 次级按钮；收起时缩回。",
    en: "The round path node presses down (scale .92) while a green ring pulses outward and fades; a green lesson card pops from the node itself (springy curve, transform-origin anchored at the node) with a small arrow pointing up to the node and a white START button inside; it shrinks back to close.",
  },
  loading: {
    zh: "橙色加载环旋转收束；紫色圆形从中心 scale 到铺满全屏完成揭幕；白色气泡自底部上浮淡出，宝箱带弹性缩放入场，紫色 2x 徽章从宝箱上方弹出，白色说明文字最后淡入。",
    en: "An orange spinner rotates and collapses; a purple circle scales from the center to fill the screen as a wipe reveal; translucent bubbles drift up and fade, a chest bounces in with an elastic scale, a purple 2x badge pops above the chest, and the white caption fades in last.",
  },
  idle: {
    zh: "常驻待机动效：START 节点上两枚绿色圆环错峰向外脉冲扩散（1.8s 周期）；下方三枚灰色节点做 ±5px 的正弦上下浮动、彼此错峰 0.35s；节点上的小黄旗用 skewY 轻摆。",
    en: "Ambient idle motion: two green rings pulse outward off the START node in alternating phase (1.8s cycle); three gray nodes below bob ±5px on a sine curve offset by 0.35s each; a small yellow flag on a node sways with a gentle skewY.",
  },
  reward: {
    zh: "结算页：猫头鹰从下方弹入，金色标题放大弹入；三枚奖励胶囊（XP/用时/正确率）自上而下错峰 0.5s 落下，XP 数字用 steps 滚动从 0 跳到 15；星形粒子向四周散开，蓝色 CONTINUE 最后从底部滑入。",
    en: "The results screen: the owl hops up from below and the gold title pops in scaled; three reward chips (XP / time / accuracy) drop in staggered by 0.5s, the XP number rolls from 0 to 15 with a steps() counter; star-shaped sparks scatter, and the blue CONTINUE slides up last.",
  },
};

const UI = {
  zh: {
    heading: "动效母题 · 11 段",
    sub: "从多邻国真实 App 交互中提炼的 11 个动效母题，全部复刻为手机竖屏画面、CSS 关键帧循环播放；点击任意卡片查看动效详情，复制提示词让 AI 1:1 复刻。",
    source: "参考来源：ripplix.com 的多邻国交互动画收录",
    replay: "重播",
    prompt: "复制提示词",
    copied: "已复制",
    detail: "动效详情",
    prev: "上一个",
    next: "下一个",
    close: "关闭",
    openHint: "点击查看动效详情与提示词",
    scenes: {
      match: { title: "配对答题 · 选中→匹配→盖章", note: "点选两块词卡：蓝色选中态，配对后绿色闪光+粒子消散，最后盖上橙色 PERFECT 图章。" },
      wordbank: { title: "词块拼句 · 飞入卡槽", note: "点底部词块，沿弧线飞进答案行空位，原位留灰色占位；拼完 CHECK 按钮由灰变绿。" },
      chest: { title: "宝箱升级 · 背景换色+开箱", note: "每点一次稀有度升一级：COMMON→RARE→EPIC→MEGA 整屏换色，宝箱抖动开箱，宝石堆弹出计数。" },
      sheet: { title: "排序面板 · 底部弹层+列表重排", note: "面板从底部滑入、背景压暗；选中项打勾后滑出，列表按新顺序做位移交换。" },
      owl: { title: "吉祥物引导 · 打字气泡", note: "吉祥物弹跳入场，对话气泡先出打字省略号再展开文案，主按钮从禁用灰点亮成品牌绿。" },
      streak: { title: "打卡承诺 · 选项选中+进度填充", note: "列表单选高亮，承诺按钮滑入；任务卡进度条从左往右填充，+1 徽章弹出。" },
      dropdown: { title: "课程切换 · 顶部下拉展开", note: "点顶部旗帜胶囊，面板自上而下展开，列表行错峰淡入上移，背景同步压暗。" },
      node: { title: "节点气泡 · 锚定弹出", note: "点路径节点，绿色课程卡从节点底部弹出（transform-origin 在指针处），含次级 START 按钮。" },
      loading: { title: "奖励加载 · 圆形揭幕", note: "加载转圈收束成宝箱，紫色圆形揭幕铺满全屏，气泡上浮，2x 徽章错峰弹出。" },
      idle: { title: "路径待机 · 呼吸与脉冲", note: "常驻 idle 动效：START 环脉冲扩散，节点错峰上下浮动，旗帜轻摆——让界面「活着」。" },
      reward: { title: "课成结算 · 奖励逐个弹入", note: "标题弹入后奖励芯片逐个落下、数字滚动计数，星星粒子点缀，CONTINUE 从底部滑入。" },
    } as Record<string, Copy>,
  },
  en: {
    heading: "Motion motifs · 11 loops",
    sub: "Eleven interaction motifs extracted from the real Duolingo app, each rebuilt as a portrait phone screen running pure-CSS keyframe loops. Click any card for the motif detail and copy its prompt for AI to recreate 1:1.",
    source: "Reference: ripplix.com Duolingo animation collection",
    replay: "Replay",
    prompt: "Copy prompt",
    copied: "Copied",
    detail: "Motif detail",
    prev: "Previous",
    next: "Next",
    close: "Close",
    openHint: "Click for the motion detail & prompt",
    scenes: {
      match: { title: "Matching · select → match → stamp", note: "Tap two word tiles: blue selected state, green flash with particles on match, then an orange PERFECT stamp lands." },
      wordbank: { title: "Word bank · fly into slot", note: "A tapped chip flies along an arc into the answer row, leaving a ghost in the tray; CHECK arms from gray to green." },
      chest: { title: "Chest upgrade · rarity color morph", note: "Each tap raises rarity: COMMON→RARE→EPIC→MEGA repaints the screen, the chest shakes open, gems burst with a count-up." },
      sheet: { title: "Sort sheet · slide-up + reorder", note: "Sheet slides up over a dimmed backdrop; the chosen row gets a check, the sheet leaves, and list rows swap positions." },
      owl: { title: "Mascot intro · typing bubble", note: "Mascot hops in, the chat bubble shows typing dots then expands, and the primary button arms from disabled gray to brand green." },
      streak: { title: "Streak commit · option + progress", note: "Single-select highlight in a list, commit button slides in; the quest bar fills left to right with a +1 badge pop." },
      dropdown: { title: "Course switcher · top dropdown", note: "Tapping the flag pill expands a panel from the top edge; rows stagger in upward while the background dims." },
      node: { title: "Node popover · anchored pop", note: "Tapping a path node pops a green lesson card from the node itself (transform-origin at the pointer), with a START button." },
      loading: { title: "Reward loading · circle reveal", note: "A spinner collapses into a chest, a purple circle wipe fills the screen, bubbles drift up, the 2x badge pops in." },
      idle: { title: "Path idle · breathe & pulse", note: "Ambient idle motion: pulsing START ring, nodes bobbing out of phase, a gently swaying flag — the screen stays alive." },
      reward: { title: "Lesson complete · staggered rewards", note: "Title pops, reward chips drop in one by one with rolling counters, sparkle accents, CONTINUE slides up from the bottom." },
    } as Record<string, Copy>,
  },
};

const T = (zh: string, en: string, locale: "zh" | "en") => (locale === "en" ? en : zh);

const demoUrl = (locale: "zh" | "en", id: string) =>
  `${window.location.origin}${locale === "en" ? "/en" : ""}/distill/duolingo?m=${id}`;

function buildPrompt(id: string, locale: "zh" | "en") {
  const m = MOTION[id];
  const s = UI[locale].scenes[id];
  if (!m || !s) return "";
  if (locale === "en") {
    return `Please recreate one interaction animation for me. First open the reference links below and actually watch the motion, then implement its interaction form 1:1:

- Original reference: ${SOURCE_URL}
- My recreation (interactive live demo, loops automatically): ${demoUrl(locale, id)}
- Design style reference (palette / type / radii / 3D buttons): ${window.location.origin}/en/style-duolingo

The animation — ${s.title}: ${m.en}

Requirements: render it as a portrait phone screen (roughly 9:19.5 container, the motion happens inside the screen); implement with React + CSS keyframes (no third-party animation libraries), a ~6s auto-replay loop, use your own imagery and copy, and do not copy any assets or code from the reference site.`;
  }
  return `请帮我复刻一个 App 交互动画。先打开下面的参考链接，实际观看动画效果，再按它的交互形式 1:1 实现：

- 参考原版动画：${SOURCE_URL}
- 我的还原版（可交互 live demo，自动循环）：${demoUrl(locale, id)}
- 设计风格参考（配色/字体/圆角/立体按钮规范）：${window.location.origin}/style-duolingo

动画形态——${s.title}：${m.zh}

要求：画面按手机竖屏 App 界面呈现（约 9:19.5 的竖屏容器，动画发生在屏幕内）；用 React + CSS 关键帧实现（不依赖第三方动画库），约 6s 自动循环重播；图片素材与文案自有，不要搬运参考网站的任何素材与代码。`;
}

/* ---------- 11 个循环场景 ---------- */

function MatchScene({ locale }: { locale: "zh" | "en" }) {
  return (
    <div className="dgm-scene s-match">
      <div className="dgm-bar"><i /></div>
      <b className="dgm-h4">{T("找出配对项", "Tap the matching pairs", locale)}</b>
      <div className="dgm-mgrid">
        <span className="mt sel">{T("米饭", "rice", locale)}</span>
        <span className="mt pair">{T("ごはん", "gohan", locale)}</span>
        <span className="mt">水</span>
        <span className="mt">{T("请", "please", locale)}</span>
      </div>
      <div className="dgm-particles"><i /><i /><i /><i /><i /><i /></div>
      <div className="dgm-btn gray">{T("检查", "CHECK", locale)}</div>
      <div className="dgm-stamp">
        <span>{T("完美！", "PERFECT!", locale)}</span>
      </div>
    </div>
  );
}

function WordbankScene({ locale }: { locale: "zh" | "en" }) {
  return (
    <div className="dgm-scene s-wb">
      <div className="dgm-bar"><i /></div>
      <b className="dgm-h4">{T("把句子拼完整", "Build the sentence", locale)}</b>
      <div className="dgm-answer">
        <span className="fixed">{T("これは", "kore wa", locale)}</span>
        <span className="slot flyin">{T("米饭", "rice", locale)}</span>
        <span className="fixed punct">。</span>
      </div>
      <div className="dgm-tray">
        <span className="ghost" />
        <span className="chip">{T("お茶", "ocha", locale)}</span>
        <span className="chip">{T("です", "desu", locale)}</span>
      </div>
      <div className="dgm-btn green">{T("检查", "CHECK", locale)}</div>
    </div>
  );
}

function ChestScene({ locale }: { locale: "zh" | "en" }) {
  return (
    <div className="dgm-scene s-chest">
      <div className="dgm-rarity">
        <span className="r1">COMMON</span><span className="r2">RARE</span><span className="r3">EPIC</span><span className="r4">MEGA</span>
      </div>
      <div className="dgm-chest">
        <i className="lid" /><i className="body" /><i className="lock" />
      </div>
      <div className="dgm-gems"><i /><i /><i /><i /><i /></div>
      <div className="dgm-count">+115</div>
      <b className="dgm-cap">{T("点击宝箱升一级", "Tap to upgrade", locale)}</b>
    </div>
  );
}

function SheetScene({ locale }: { locale: "zh" | "en" }) {
  return (
    <div className="dgm-scene s-sheet">
      <div className="dgm-list">
        <span className="row swapA">{T("がくしゅう · 学习", "gakushuu · study", locale)}</span>
        <span className="row">{T("ひと · 人", "hito · person", locale)}</span>
        <span className="row swapB">{T("いしゃ · 医生", "isha · doctor", locale)}</span>
      </div>
      <div className="dgm-dim" />
      <div className="dgm-sheet">
        <b>{T("排序", "Sort", locale)}</b>
        <span>{T("字母顺序", "Alphabetically", locale)}<i className="tick">✓</i></span>
        <span className="on">{T("最近学过", "Recently learned", locale)}<i className="tick">✓</i></span>
      </div>
    </div>
  );
}

function OwlScene({ locale }: { locale: "zh" | "en" }) {
  return (
    <div className="dgm-scene s-owl">
      <div className="dgm-owl">
        <i className="ear l" /><i className="ear r" />
        <i className="eye l" /><i className="eye r" />
        <i className="beak" />
      </div>
      <div className="dgm-bubble">
        <i className="dots"><i /><i /><i /></i>
        <span>{T("嗨！我是豆豆 🌱", "Hi there! I'm Sprout 🌱", locale)}</span>
      </div>
      <div className="dgm-btn arm">{T("继续", "CONTINUE", locale)}</div>
    </div>
  );
}

function StreakScene({ locale }: { locale: "zh" | "en" }) {
  return (
    <div className="dgm-scene s-streak">
      <b className="dgm-h4">{T("选一个打卡目标", "Pick a streak goal", locale)}</b>
      <div className="dgm-opts">
        <span>{T("7 天", "7 days", locale)}<em>+50</em></span>
        <span className="on">{T("14 天", "14 days", locale)}<em>+100</em></span>
        <span>{T("30 天", "30 days", locale)}<em>+250</em></span>
      </div>
      <div className="dgm-quest">
        <b>{T("开始打卡", "Start a streak", locale)}</b>
        <i className="track"><i className="fill" /></i>
        <span className="badge">+1</span>
      </div>
    </div>
  );
}

function DropdownScene({ locale }: { locale: "zh" | "en" }) {
  return (
    <div className="dgm-scene s-dd">
      <div className="dgm-dd-head">
        <span className="pill press"><i className="flag" />{T("日语", "Japanese", locale)}<em>⌄</em></span>
        <i className="gem">◆ 120</i>
      </div>
      <div className="dgm-dd-panel">
        <span><i className="flag es" />{T("西班牙语", "Spanish", locale)}</span>
        <span><i className="flag fr" />{T("法语", "French", locale)}</span>
        <span><i className="flag de" />{T("德语", "German", locale)}</span>
        <span><i className="flag it" />{T("意大利语", "Italian", locale)}</span>
      </div>
      <div className="dgm-dim" />
    </div>
  );
}

function NodeScene({ locale }: { locale: "zh" | "en" }) {
  return (
    <div className="dgm-scene s-node">
      <div className="dgm-node press">
        <i className="ring" />
        <span>★</span>
      </div>
      <div className="dgm-pop">
        <i className="arrow" />
        <b>{T("点餐与食物", "Order food & drinks", locale)}</b>
        <small>{T("第 3 课 · 共 4 课", "Lesson 3 of 4", locale)}</small>
        <button type="button">{T("开始 +10 XP", "START +10 XP", locale)}</button>
      </div>
    </div>
  );
}

function LoadingScene({ locale }: { locale: "zh" | "en" }) {
  return (
    <div className="dgm-scene s-load">
      <i className="dgm-spinner" />
      <i className="dgm-wipe" />
      <div className="dgm-bubbles"><i /><i /><i /><i /></div>
      <div className="dgm-chest small">
        <i className="lid" /><i className="body" /><i className="lock" />
      </div>
      <span className="dgm-xp">2x</span>
      <b className="dgm-cap">{T("等级提升！双倍经验 15 分钟", "Level up! Double XP for 15 min", locale)}</b>
    </div>
  );
}

function IdleScene() {
  return (
    <div className="dgm-scene s-idle">
      <div className="dgm-path">
        <span className="n start"><i className="ring" /><i className="ring d2" />★</span>
        <span className="n bob"><i className="flag2" /></span>
        <span className="n bob d2">🐾</span>
        <span className="n bob d3">🎒</span>
      </div>
    </div>
  );
}

function RewardScene({ locale }: { locale: "zh" | "en" }) {
  return (
    <div className="dgm-scene s-reward">
      <div className="dgm-owl tiny">
        <i className="eye l" /><i className="eye r" /><i className="beak" />
      </div>
      <b className="dgm-h2">{T("完美一课！", "Perfect lesson!", locale)}</b>
      <div className="dgm-chips">
        <span className="c1"><em>{T("总经验", "TOTAL XP", locale)}</em><i>⚡<b className="roll"><u>0</u><u>5</u><u>10</u><u>15</u></b></i></span>
        <span className="c2"><em>{T("用时", "TIME", locale)}</em><i>⏱ 0:48</i></span>
        <span className="c3"><em>{T("正确率", "ACCURACY", locale)}</em><i>✓ 100%</i></span>
      </div>
      <div className="dgm-sparks"><i /><i /><i /></div>
      <div className="dgm-btn blue">{T("继续", "CONTINUE", locale)}</div>
    </div>
  );
}

const SCENES: { id: string; render: (locale: "zh" | "en") => React.ReactNode }[] = [
  { id: "match", render: (l) => <MatchScene locale={l} /> },
  { id: "wordbank", render: (l) => <WordbankScene locale={l} /> },
  { id: "chest", render: (l) => <ChestScene locale={l} /> },
  { id: "sheet", render: (l) => <SheetScene locale={l} /> },
  { id: "owl", render: (l) => <OwlScene locale={l} /> },
  { id: "streak", render: (l) => <StreakScene locale={l} /> },
  { id: "dropdown", render: (l) => <DropdownScene locale={l} /> },
  { id: "node", render: (l) => <NodeScene locale={l} /> },
  { id: "loading", render: (l) => <LoadingScene locale={l} /> },
  { id: "idle", render: () => <IdleScene /> },
  { id: "reward", render: (l) => <RewardScene locale={l} /> },
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

function Phone({ children }: { children: React.ReactNode }) {
  return (
    <div className="dgm-phone">
      <div className="dgm-phone-inner">
        <div className="dgm-sb">
          <b>9:41</b>
          <i className="cam" />
          <i className="bat"><i /></i>
        </div>
        {children}
        <i className="dgm-home" />
      </div>
    </div>
  );
}

export default function DuolingoMotionGallery({ locale = "zh" }: { locale?: "zh" | "en" }) {
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
    <section className="dgm-root" id="duolingo-motion">
      <header className="dgm-head">
        <div>
          <h2>{u.heading}</h2>
          <p>{u.sub}</p>
        </div>
      </header>
      <div className="dgm-grid" key={cycle}>
        {SCENES.map((s) => (
          <figure
            className="dgm-card"
            id={s.id}
            key={s.id}
            onClick={() => setOpen(s.id)}
            title={u.openHint}
          >
            <div className="dgm-viewport">
              <div className="dgm-phonebox"><Phone>{s.render(locale)}</Phone></div>
              <span className="dgm-veil"><b>{u.scenes[s.id]?.title}</b></span>
              <button
                type="button"
                className="dgm-round dgm-replay"
                aria-label={u.replay}
                title={u.replay}
                onClick={(e) => {
                  e.stopPropagation();
                  setCycle((c) => c + 1);
                }}
              >
                <Icon d={ICONS.replay} />
              </button>
              <span className="dgm-round dgm-expand" aria-hidden="true">
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
      <footer className="dgm-foot">{u.source}</footer>

      {scene && copy && open && (
        <div className="dmm-backdrop" onPointerDown={(e) => e.target === e.currentTarget && setOpen(null)}>
          <div className="dmm-panel" role="dialog" aria-modal="true" aria-label={copy.title}>
            <div className="dmm-head">
              <div className="dmm-title">
                <b>{copy.title}</b>
                <em>{idx + 1} / {SCENE_IDS.length}</em>
              </div>
              <div className="dmm-nav">
                <button type="button" aria-label={u.prev} title={u.prev} onClick={() => step(-1)}><Icon d={ICONS.prev} /></button>
                <button type="button" aria-label={u.next} title={u.next} onClick={() => step(1)}><Icon d={ICONS.next} /></button>
                <button type="button" aria-label={u.replay} title={u.replay} onClick={() => setCycle((c) => c + 1)}><Icon d={ICONS.replay} /></button>
                <button type="button" aria-label={u.close} title={u.close} onClick={() => setOpen(null)}><Icon d={ICONS.close} /></button>
              </div>
            </div>
            <div className="dmm-stage">
              <div className="dgm-phonebox" key={open + cycle}><Phone>{scene.render(locale)}</Phone></div>
            </div>
            <p className="dmm-desc">{MOTION[open][locale]}</p>
            <div className="dmm-actions">
              <MotionPromptButton label={u.prompt} copiedLabel={u.copied} buildPrompt={() => buildPrompt(open, locale)} />
              <a className="dmm-src" href={SOURCE_URL} target="_blank" rel="noreferrer">{u.source}</a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
