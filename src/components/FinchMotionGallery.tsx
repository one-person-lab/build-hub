"use client";

import { useEffect, useState } from "react";
import MotionPromptButton from "./MotionPromptButton";
import "./FinchMotionGallery.css";

type Copy = { title: string; note: string };

const SOURCE_URL = "https://apps.apple.com/us/app/id1528595748";

// Finch 没有站内设计风格条目，把视觉基调直接写进提示词（对齐 2026 年 3.73 版界面）
const FINCH_STYLE_ZH =
  "视觉基调：天蓝渐变背景 + 草绿地面/城市剪影场景板；主角是扁平卡通 Finch 鸟（灰/桃/粉羽色、腮红圆点、黄色小喙、圆润身形），全部用 CSS 渐变与圆角自绘；内容承载在大圆角（16-22px）白色卡片上，勾选态与 CTA 用紫/蓝胶囊按钮，能量用金色闪电图标，整体圆润、柔和、治愈系儿童插画风";
const FINCH_STYLE_EN =
  "Visual base: sky-blue gradient backgrounds with grass/city-silhouette scene boards; the star is a flat cartoon Finch bird (gray/peach/pink plumage, blush dots, tiny yellow beak, rounded body) drawn entirely with CSS gradients and border-radius; content sits on large-radius (16-22px) white cards, checked states and CTAs are purple/blue capsule buttons, energy is a gold lightning bolt — soft, rounded, wholesome illustration style";

// 每个母题的实现级描述，供 AI 复刻用
const MOTION: Record<string, { zh: string; en: string }> = {
  checkin: {
    zh: "每日自我关怀打卡：绿色场景带里 Finch 鸟站在中央，头顶气泡按节奏弹出「早上好！」；下方 START THE DAY 分组里三张白色目标卡（起床/刷牙/洗脸）各带 5⚡ 金色能量。第二张卡的圆形复选框被点击：圈先收缩回弹，白色对勾以描边动画画出，整卡淡染为已完成灰态，一枚「+5⚡」金币从卡片右侧飞出、划弧落入顶部能量计数，计数 10→15 跳动放大后复位；8s 循环复位。",
    en: "A daily self-care check-in: on a green scene strip the Finch bird stands center with a 'Good morning!' speech bubble popping in on beat; below, a START THE DAY group holds three white goal cards (wake up / brush teeth / wash face), each worth 5⚡ gold energy. The second card's round checkbox is tapped: the ring squeezes and bounces, a white check draws in with a stroke animation, the card fades to its done-grey state, and a '+5⚡' coin flies from the card's right edge in an arc into the top energy counter, which punches from 10 to 15 before settling; the 8s loop resets.",
  },
  grow: {
    zh: "成长花园浇水：云白天空底，一枝花从土里钻出——先是一枚粉色心形花苞（scale 弹出+回弹），Finch 鸟从右侧滑入举起陶土洒水壶，壶嘴倾斜倒出 5 颗蓝色水滴（错峰落下、落到花瓣消失），花朵随之长高并绽开、四周 4 枚四角星闪烁；下方「My Self-Care Progress」白卡列表里 4 条迷你进度条（蓝柱/橙点/绿柱/橙条）以底部为原点错峰生长，配「Nourish what matters to you, cheep!」气泡。",
    en: "Watering the growth garden: on a cloudy sky, a flower pushes out of the soil — first a pink heart-shaped bud (scale pop with overshoot); the Finch bird slides in from the right raising a clay watering can, its spout tilts and pours 5 blue droplets (staggered fall, vanishing on the petals), the stem stretches and the bloom opens while four-point sparkles twinkle around it; below, a 'My Self-Care Progress' white card list shows four mini progress bars (blue columns / orange dots / green columns / orange strokes) growing from their baseline in stagger, captioned 'Nourish what matters to you, cheep!'.",
  },
  streak: {
    zh: "连击庆祝页：饱和度高的品牌蓝全屏底，放射状光束（conic-gradient 条纹圆）在中央缓慢旋转；金色锯齿太阳徽章从 0.6 倍回弹放大到 1，Finch 鸟从徽章下缘探头、双翅举起。白色气泡滑入「You kept going for a whole month! Every day! WOW!」；下方巨大白色数字 30 用滚动数字条从 0 计起，「DAY STREAK」字标随后淡入；彩色纸屑（粉/绿/橙/蓝小长条）从顶部带旋转飘落整屏；底部周历条里 M-T-W-T-F-S-S 七枚圆点依次点亮为金色对勾，第 4 天是一枚木槌图标。",
    en: "A streak celebration screen: on a saturated brand-blue full screen, radial light beams (a conic-gradient striped disc) rotate slowly at center; a gold serrated sun badge pops from 0.6× to 1× with overshoot while the Finch bird peeks over its lower edge with wings raised; a white speech bubble slides in ('You kept going for a whole month! Every day! WOW!'); below, a giant white 30 counts up from 0 on a rolling digit strip, then the 'DAY STREAK' wordmark fades in; confetti strips (pink/green/orange/blue) rotate down from the top across the screen; in the bottom week bar the seven dots M-T-W-T-F-S-S light up one by one into gold checkmarks, day 4 showing a wooden mallet icon.",
  },
  buddy: {
    zh: "Goal Buddy 配对成功弹窗：背景压暗——夜色邮箱立牌，红色小旗旋转弹起，顶部喷出一束彩色纸屑。白色大圆角 bottom sheet 从下方 240px 滑入回弹落定，右上角灰色 × 钮缩放淡入；卡内两只 Finch 鸟（桃色/灰色）手持蓝紫啦啦球交替跳起（各差半拍，落地时啦啦球抖动），标题「You & Sam are now Goal Buddies!」随卡片落定上浮淡入；下方 YOU/SAM 两枚淡彩卡中间浮出一杯吸管水杯图标，紫色「Send encouragement」胶囊按钮最后弹入并做一次呼吸脉冲。",
    en: "A Goal Buddy pair-up modal: the backdrop dims to a night mailbox with its red flag spinning up and a burst of confetti shooting from the top. A large-radius white bottom sheet slides up from 240px below and lands with a bounce, its grey × button scaling in; inside, two Finch birds (peach/grey) hold blue and purple pom-poms and jump alternately (a half-beat apart, pom-poms jiggling on landing) while the title 'You & Sam are now Goal Buddies!' floats up and fades in with the card; below, a straw-cup water icon floats between pale YOU and SAM cards, and the purple 'Send encouragement' capsule button pops in last with one breathing pulse.",
  },
  care: {
    zh: "伙伴互道早安：草地 + 大树 + 树桩 + 岩石的日间场景板。灰色大 Finch 与粉色小 Finch 面对面原地踏步（身体上下 2px 颠动、脚交替抬起），灰色大鸟的翅膀做 90° 挥手摆动（3 次）；两者头顶先后弹出白色对话气泡——先「Good morning!」后「Let's do our best today!」（缩放弹出、停留、淡出）；粉色小鸟脸颊腮红做一次加深闪烁；底部「Goal Buddies」白卡上两枚圆形头像从右滑入，蓝色小箭头在头像下轻点两下。",
    en: "Two buddies greeting each other: a daytime scene board with grass, a big tree, a stump and rocks. A large grey Finch and a small pink Finch face each other marching in place (bodies bobbing 2px, feet alternating), the grey one waving its wing through a 90° swing (three times); white speech bubbles pop above them in sequence — 'Good morning!' then 'Let's do our best today!' (scale-in, hold, fade-out); the pink bird's blush dots flash deeper once; on the white 'Goal Buddies' card at the bottom, two round avatars slide in from the right while a small blue arrow taps twice under them.",
  },
  support: {
    zh: "发送支持卡片：粉色底铺满半透明大爱心图案。顶部 TO 胶囊（黄色头像 + 「Bagel & Sam」）淡入；白色气泡「Let's remind them that they're special to us!」弹出；中央灰色 Finch 抱着一颗红心，心做 1→1.08 挤压跳动（每 1.2s 一次）并溢出 3 颗小爱心向上飘浮淡出。下方 sheet 拖出 6 枚圆形主题胶囊（雪晶/棒棒糖/心形礼盒/墨镜笑脸/太阳/感恩脸），选中枚白色描边+四角星以回弹 scale 放大并切换标签；底部白色「Send a Valentine!」按钮——点击后整只抱心鸟与卡片向上飞出、缩放到顶部收件人胶囊处，按钮文案短暂切到 ✓ 后复位，10s 循环。",
    en: "Sending a support card: a pink screen tiled with translucent big hearts. A TO capsule (yellow avatar + 'Bagel & Sam') fades in; a white bubble pops ('Let's remind them that they're special to us!'); at center a grey Finch hugs a red heart that squash-pulses 1 → 1.08 every 1.2s while three mini hearts float up and fade out. A sheet below drags out 6 round theme capsules (snowflake / lollipop / heart box / sunglasses smiley / sun / grateful face); the selected one gets a white ring + sparkles and scales up with a bounce as its label switches; the white 'Send a Valentine!' button at the bottom — on tap the whole heart-hugging bird and card fly upward, shrinking into the recipient capsule at top, the button briefly flips to ✓, then the scene resets in a 10s loop.",
  },
  adventure: {
    zh: "城市冒险出行：粉橙夕阳→暮蓝渐变天空下的纽约式城市剪影（自由女神、摩天楼、黄色出租车）。灰色与淡紫两只背红色背包的 Finch 鸟并排向右迈步循环（身体颠动+脚交替），头顶两枚思考气泡（披萨/老鼠）交替弹出淡出；下方白色「Adventuring」卡里，虚线进度轨道从左侧闪电徽章向右侧金色 ? 宝箱延伸，小鸟头像圆点沿轨道逐格右移，「back in 7:36」倒计时分秒滚动递减，轨道填满后 ? 宝箱弹跳一下复位。",
    en: "A city adventure walk: under a pink-orange sunset fading to dusk blue, a New-York-style skyline (Statue of Liberty, skyscrapers, a yellow cab). Two Finch birds — grey and lilac, both with red backpacks — stride right in a loop (body bob, feet alternating) while two thought bubbles (pizza / mouse) above them pop in and out in turn; on the white 'Adventuring' card below, a dotted progress track runs from a lightning badge on the left to a gold ? chest on the right, a bird-face dot hops along the track cell by cell, the 'back in 7:36' countdown ticks down on rolling digits, and when the track completes the ? chest bounces once before reset.",
  },
};

const UI = {
  zh: {
    heading: "动效母题 · 7 段",
    sub: "从 Finch 当前版本（3.73，2026-09）真实界面提炼的 7 个动效母题，全部复刻为手机竖屏画面、纯 CSS 关键帧循环播放；点击任意卡片查看动效详情，复制提示词让 AI 1:1 复刻。",
    source: "参考来源：Finch App Store 官方截图（v3.73.206，2026-09-17 更新）",
    replay: "重播",
    prompt: "复制提示词",
    copied: "已复制",
    detail: "动效详情",
    prev: "上一个",
    next: "下一个",
    close: "关闭",
    openHint: "点击查看动效详情与提示词",
    scenes: {
      checkin: { title: "每日打卡 · 勾选回弹+能量飞入", note: "复选框画出对勾整卡转灰，+5⚡ 金币划弧飞入顶部能量计数。" },
      grow: { title: "成长花园 · 浇水开花+进度生长", note: "洒水壶倒出蓝色水滴，心形花苞弹出绽放，下方进度条错峰生长。" },
      streak: { title: "连击庆祝 · 太阳徽章+纸屑雨", note: "放射光束旋转，30 滚动计数，纸屑飘落，周历金勾逐日点亮。" },
      buddy: { title: "伙伴配对 · bottom sheet 弹入", note: "邮箱升旗喷彩屑，白卡回弹落定，双鸟举啦啦球交替跳起。" },
      care: { title: "伙伴早安 · 踏步挥手+气泡对话", note: "两只小鸟原地踏步挥翅，对话气泡先后弹出淡出。" },
      support: { title: "支持卡片 · 主题选择+卡片飞出", note: "抱心鸟挤压跳动溢小爱心，选中主题回弹，点发送卡片飞入收件人。" },
      adventure: { title: "城市冒险 · 迈步循环+归途进度", note: "夕阳剪影前双鸟背包迈步，虚线轨道逐格推进、倒计时递减。" },
    } as Record<string, Copy>,
  },
  en: {
    heading: "Motion motifs · 7 loops",
    sub: "Seven interaction motifs extracted from Finch's current release (3.73, Sep 2026), each rebuilt as a portrait phone screen running pure-CSS keyframe loops. Click any card for the motif detail and copy its prompt for AI to recreate 1:1.",
    source: "Reference: Finch's official App Store screenshots (v3.73.206, updated 2026-09-17)",
    replay: "Replay",
    prompt: "Copy prompt",
    copied: "Copied",
    detail: "Motif detail",
    prev: "Previous",
    next: "Next",
    close: "Close",
    openHint: "Click for the motion detail & prompt",
    scenes: {
      checkin: { title: "Daily check-in · stamp + energy fly-in", note: "The checkbox draws a check, the card greys out and a +5⚡ coin arcs into the counter." },
      grow: { title: "Garden · watering bloom + bar growth", note: "Droplets pour from the can, a heart bud pops open, mini progress bars grow in stagger." },
      streak: { title: "Streak party · sun badge + confetti", note: "Beams rotate, 30 counts up, confetti rains and the week bar lights gold checks." },
      buddy: { title: "Buddy pair-up · bouncing bottom sheet", note: "The mailbox flag pops with confetti; the sheet lands as two birds jump with pom-poms." },
      care: { title: "Morning greeting · march + speech bubbles", note: "Two birds march and wave in a grass scene while bubbles pop in sequence." },
      support: { title: "Support card · theme picker + send-off", note: "A heart-hugging bird pulses; the chosen capsule bounces and the card flies to the recipient." },
      adventure: { title: "City adventure · walk + return track", note: "Backpack birds stride past a sunset skyline as the dotted track and countdown advance." },
    } as Record<string, Copy>,
  },
};

const T = (zh: string, en: string, locale: "zh" | "en") => (locale === "en" ? en : zh);

const demoUrl = (locale: "zh" | "en", id: string) =>
  `${window.location.origin}${locale === "en" ? "/en" : ""}/distill/finch?m=${id}`;

function buildPrompt(id: string, locale: "zh" | "en") {
  const m = MOTION[id];
  const s = UI[locale].scenes[id];
  if (!m || !s) return "";
  if (locale === "en") {
    return `Please recreate one interaction animation for me. First open the reference links below and actually look at the current UI, then implement its interaction form 1:1:

- The app: Finch — a self-care pet / habit tracker (finchcare.com), current version 3.73
- Official screenshots: ${SOURCE_URL}
- My recreation (interactive live demo, loops automatically): ${demoUrl(locale, id)}

${FINCH_STYLE_EN}

The animation — ${s.title}: ${m.en}

Requirements: render it as a portrait phone screen (roughly 9:19.5 container, the motion happens inside the screen); implement with React + CSS keyframes (no third-party animation libraries), a ~8–10s auto-replay loop, use your own imagery and copy, and do not copy any assets or code from the reference sources.`;
  }
  return `请帮我复刻一个 App 交互动画。先打开下面的参考链接，实际查看 Finch 当前版本（3.73）的真实界面，再按它的交互形式 1:1 实现：

- 原版 App：Finch（自我关怀电子宠物 / 习惯打卡 App，官网 https://finchcare.com）
- 官方截图：${SOURCE_URL}
- 我的还原版（可交互 live demo，自动循环）：${demoUrl(locale, id)}

${FINCH_STYLE_ZH}

动画形态——${s.title}：${m.zh}

要求：画面按手机竖屏 App 界面呈现（约 9:19.5 的竖屏容器，动画发生在屏幕内）；用 React + CSS 关键帧实现（不依赖第三方动画库），自动循环重播；图片素材与文案自有，不要搬运参考来源的任何素材与代码。`;
}

/* ---------- 7 个循环场景 ---------- */

function Bird({ v = "gray" }: { v?: "gray" | "pink" | "peach" | "lilac" }) {
  return (
    <i className={`bird bv-${v}`}>
      <b className="blush l" />
      <b className="blush r" />
      <b className="beak" />
      <b className="eye l" />
      <b className="eye r" />
      <i className="wing" />
    </i>
  );
}

function CheckinScene({ locale }: { locale: "zh" | "en" }) {
  return (
    <div className="fdm-scene s-checkin">
      <div className="ck-top">
        <span className="ck-streak">🔥 12</span>
        <b className="ck-title">{T("今日", "Today", locale)}</b>
        <span className="ck-energy"><i className="bolt">⚡</i><span className="win"><u className="roll"><u>10</u><u>15</u></u></span></span>
      </div>
      <div className="ck-stage">
        <div className="ck-bubble">{T("早上好！", "Good morning!", locale)}</div>
        <Bird />
        <i className="ground" />
      </div>
      <div className="ck-cards">
        <div className="ck-group">{T("START THE DAY", "START THE DAY", locale)}<em>⌄</em></div>
        <div className="ck-card done">
          <span className="ic">🌻</span>
          <b>{T("起床", "Get out of bed", locale)}</b>
          <em>5<i className="bolt">⚡</i></em>
          <span className="cbx on"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.6 4.6L19 7.5" /></svg></span>
        </div>
        <div className="ck-card target">
          <span className="ic">🪥</span>
          <b>{T("刷牙", "Brush teeth", locale)}</b>
          <em>5<i className="bolt">⚡</i></em>
          <span className="cbx"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.6 4.6L19 7.5" /></svg></span>
        </div>
        <div className="ck-card">
          <span className="ic">🧼</span>
          <b>{T("洗脸", "Wash my face", locale)}</b>
          <em>5<i className="bolt">⚡</i></em>
          <span className="cbx" />
        </div>
      </div>
      <i className="ck-coin">+5<i className="bolt">⚡</i></i>
    </div>
  );
}

function GrowScene({ locale }: { locale: "zh" | "en" }) {
  return (
    <div className="fdm-scene s-grow">
      <div className="gr-sky">
        <i className="cloud c1" /><i className="cloud c2" />
        <div className="gr-bubble">{T("滋养对你重要的事，cheep！", "Nourish what matters, cheep!", locale)}</div>
        <div className="gr-flower">
          <i className="stem" />
          <i className="leaf l" /><i className="leaf r" />
          <i className="bloom" />
        </div>
        <div className="gr-bird"><Bird /></div>
        <i className="can">
          <b className="spout" />
          <i className="drop d1" /><i className="drop d2" /><i className="drop d3" /><i className="drop d4" /><i className="drop d5" />
        </i>
        <i className="spark s1" /><i className="spark s2" /><i className="spark s3" /><i className="spark s4" />
        <i className="soil" />
      </div>
      <b className="gr-h">{T("我的自我关怀进度", "My Self-Care Progress", locale)}</b>
      <div className="gr-rows">
        <span><i className="ric a">🍎</i>{T("饮食", "Nutrition", locale)}<i className="bars b-blue"><u /><u /><u /><u /></i></span>
        <span><i className="ric b">👟</i>{T("运动", "Movement", locale)}<i className="bars b-dot"><u /><u /><u /><u /></i></span>
        <span><i className="ric c">🎯</i>{T("效率", "Productivity", locale)}<i className="bars b-green"><u /><u /><u /></i></span>
        <span><i className="ric d">🌻</i>{T("自我关爱", "Self-kindness", locale)}<i className="bars b-orange"><u /><u /><u /><u /></i></span>
      </div>
    </div>
  );
}

function StreakScene({ locale }: { locale: "zh" | "en" }) {
  return (
    <div className="fdm-scene s-streak">
      <i className="st-beams" />
      <div className="st-bubble">{T("你坚持了整整一个月！每天！WOW！", "You kept going a whole month! Every day! WOW!", locale)}</div>
      <div className="st-badge">
        <i className="sun" />
        <div className="st-bird"><Bird /></div>
      </div>
      <div className="st-num"><div className="win"><div className="roll"><u>0</u><u>7</u><u>19</u><u>30</u></div></div></div>
      <b className="st-word">DAY {T("STREAK", "STREAK", locale)}</b>
      <div className="st-week">
        <span>M<i className="ok" /></span><span>T<i className="ok" /></span><span>W<i className="ok" /></span>
        <span>T<i className="mallet">🔨</i></span><span>F<i className="ok" /></span><span>S<i /></span><span>S<i /></span>
      </div>
      <div className="st-confetti">
        {Array.from({ length: 14 }).map((_, i) => <i key={i} className={`cf cf-${i}`} />)}
      </div>
    </div>
  );
}

function BuddyScene({ locale }: { locale: "zh" | "en" }) {
  return (
    <div className="fdm-scene s-buddy">
      <div className="bd-night">
        <i className="moon" />
        <div className="bd-mail">
          <i className="box" /><i className="door" />
          <i className="flag" />
        </div>
        <div className="bd-burst">{Array.from({ length: 10 }).map((_, i) => <i key={i} className={`bf bf-${i}`} />)}</div>
      </div>
      <div className="bd-sheet">
        <i className="bd-x">×</i>
        <div className="bd-birds">
          <span className="b1"><i className="pom p1" /><i className="pom p2" /><Bird v="peach" /></span>
          <span className="b2"><i className="pom p3" /><i className="pom p4" /><Bird /></span>
        </div>
        <b className="bd-title">{T("你和 Sam 成为目标伙伴！", "You & Sam are now Goal Buddies!", locale)}</b>
        <p className="bd-sub">{T("鼓励 Sam 今天完成「喝水」目标！", "Encourage Sam to complete their “Drink water” goal today!", locale)}</p>
        <div className="bd-cards">
          <span className="you">{T("YOU", "YOU", locale)}<i className="ring" /></span>
          <i className="cup">🥤</i>
          <span className="sam">SAM<i className="ring" /></span>
        </div>
        <div className="bd-cta">{T("发送鼓励", "Send encouragement", locale)}</div>
      </div>
    </div>
  );
}

function CareScene({ locale }: { locale: "zh" | "en" }) {
  return (
    <div className="fdm-scene s-care">
      <div className="ca-sky"><i className="cloud" /></div>
      <i className="ca-tree"><b className="crown" /><b className="trunk" /><b className="stump" /><b className="rock" /></i>
      <div className="ca-bubble b1">{T("早上好！", "Good morning!", locale)}</div>
      <div className="ca-bubble b2">{T("今天也要加油！", "Let's do our best!", locale)}</div>
      <div className="ca-ground" />
      <div className="ca-bird big"><Bird /></div>
      <div className="ca-bird small"><Bird v="pink" /></div>
      <div className="ca-card">
        <b>{T("目标伙伴", "Goal Buddies", locale)}</b>
        <span className="av a1"><Bird /></span>
        <span className="av a2"><Bird v="pink" /></span>
        <i className="arrow">▾</i>
      </div>
    </div>
  );
}

function SupportScene({ locale }: { locale: "zh" | "en" }) {
  return (
    <div className="fdm-scene s-support">
      <i className="sp-heart bg h1" /><i className="sp-heart bg h2" /><i className="sp-heart bg h3" />
      <div className="sp-to">TO<i className="pill"><span className="av">🙂</span>Bagel &amp; Sam</i></div>
      <div className="sp-bubble">{T("提醒 TA 有多特别！", "Let's remind them they're special!", locale)}</div>
      <div className="sp-fly">
        <div className="sp-bird"><Bird /><i className="heart" /><i className="mh m1" /><i className="mh m2" /><i className="mh m3" /></div>
      </div>
      <div className="sp-sheet">
        <i className="handle" />
        <div className="sp-grid">
          <span className="th t1"><i>❄️</i>{T("冬日", "Winter", locale)}</span>
          <span className="th t2"><i>🍭</i>{T("小零食", "Treat", locale)}</span>
          <span className="th t3 on"><i>💝</i>{T("情人节", "Valentines", locale)}<b className="sk s1" /><b className="sk s2" /></span>
          <span className="th t4"><i>🤩</i>{T("新 outfit", "Outfit Love", locale)}</span>
          <span className="th t5"><i>☀️</i>{T("早安", "Good Morning", locale)}</span>
          <span className="th t6"><i>🥰</i>{T("感恩", "Gratitude", locale)}</span>
        </div>
        <div className="sp-cta"><span className="lbl">{T("发送情人节卡片！", "Send a Valentine!", locale)}</span><span className="ok">✓</span></div>
      </div>
    </div>
  );
}

function AdventureScene({ locale }: { locale: "zh" | "en" }) {
  return (
    <div className="fdm-scene s-adventure">
      <div className="ad-sky" />
      <div className="ad-city">
        <i className="liberty" /><i className="bld b1" /><i className="bld b2" /><i className="bld b3" /><i className="bld b4" /><i className="taxi" />
      </div>
      <div className="ad-ground" />
      <i className="ad-think t1">🍕</i>
      <i className="ad-think t2">🐭</i>
      <div className="ad-bird a"><Bird /><i className="pack" /></div>
      <div className="ad-bird b"><Bird v="lilac" /><i className="pack" /></div>
      <div className="ad-card">
        <div className="ad-head"><b>{T("冒险中", "Adventuring", locale)}</b><em>{T("还有", "back in", locale)} <span className="win"><span className="roll"><u>7:36</u><u>7:35</u><u>7:34</u><u>7:33</u></span></span></em></div>
        <div className="ad-track">
          <i className="bolt">⚡</i>
          <i className="runner"><Bird /></i>
          <i className="dots">{Array.from({ length: 9 }).map((_, i) => <u key={i} />)}</i>
          <i className="chest">?</i>
        </div>
      </div>
      <b className="ad-left">🗓 3 {T("个目标待完成！", "goals left today!", locale)}</b>
    </div>
  );
}

const SCENES: { id: string; light?: boolean; render: (locale: "zh" | "en") => React.ReactNode }[] = [
  { id: "checkin", light: true, render: (l) => <CheckinScene locale={l} /> },
  { id: "grow", light: true, render: (l) => <GrowScene locale={l} /> },
  { id: "streak", render: (l) => <StreakScene locale={l} /> },
  { id: "buddy", light: true, render: (l) => <BuddyScene locale={l} /> },
  { id: "care", light: true, render: (l) => <CareScene locale={l} /> },
  { id: "support", light: true, render: (l) => <SupportScene locale={l} /> },
  { id: "adventure", light: true, render: (l) => <AdventureScene locale={l} /> },
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
    <div className={`fdm-phone${light ? " light" : ""}`}>
      <div className="fdm-phone-inner">
        <div className="fdm-sb">
          <b>9:41</b>
          <i className="cam" />
          <i className="bat"><i /></i>
        </div>
        {children}
        <i className="fdm-home" />
      </div>
    </div>
  );
}

export default function FinchMotionGallery({ locale = "zh" }: { locale?: "zh" | "en" }) {
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
    <section className="fdm-root" id="finch-motion">
      <header className="fdm-head">
        <div>
          <h2>{u.heading}</h2>
          <p>{u.sub}</p>
        </div>
      </header>
      <div className="fdm-grid" key={cycle}>
        {SCENES.map((s) => (
          <figure
            className="fdm-card"
            id={s.id}
            key={s.id}
            onClick={() => setOpen(s.id)}
            title={u.openHint}
          >
            <div className="fdm-viewport">
              <div className="fdm-phonebox"><Phone light={s.light}>{s.render(locale)}</Phone></div>
              <span className="fdm-veil"><b>{u.scenes[s.id]?.title}</b></span>
              <button
                type="button"
                className="fdm-round fdm-replay"
                aria-label={u.replay}
                title={u.replay}
                onClick={(e) => {
                  e.stopPropagation();
                  setCycle((c) => c + 1);
                }}
              >
                <Icon d={ICONS.replay} />
              </button>
              <span className="fdm-round fdm-expand" aria-hidden="true">
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
      <footer className="fdm-foot">{u.source}</footer>

      {scene && copy && open && (
        <div className="fdmm-backdrop" onPointerDown={(e) => e.target === e.currentTarget && setOpen(null)}>
          <div className="fdmm-panel" role="dialog" aria-modal="true" aria-label={copy.title}>
            <div className="fdmm-head">
              <div className="fdmm-title">
                <b>{copy.title}</b>
                <em>{idx + 1} / {SCENE_IDS.length}</em>
              </div>
              <div className="fdmm-nav">
                <button type="button" aria-label={u.prev} title={u.prev} onClick={() => step(-1)}><Icon d={ICONS.prev} /></button>
                <button type="button" aria-label={u.next} title={u.next} onClick={() => step(1)}><Icon d={ICONS.next} /></button>
                <button type="button" aria-label={u.replay} title={u.replay} onClick={() => setCycle((c) => c + 1)}><Icon d={ICONS.replay} /></button>
                <button type="button" aria-label={u.close} title={u.close} onClick={() => setOpen(null)}><Icon d={ICONS.close} /></button>
              </div>
            </div>
            <div className="fdmm-stage">
              <div className="fdm-phonebox" key={open + cycle}><Phone light={scene.light}>{scene.render(locale)}</Phone></div>
            </div>
            <p className="fdmm-desc">{MOTION[open][locale]}</p>
            <div className="fdmm-actions">
              <MotionPromptButton label={u.prompt} copiedLabel={u.copied} buildPrompt={() => buildPrompt(open, locale)} />
              <a className="fdmm-src" href={SOURCE_URL} target="_blank" rel="noreferrer">{u.source}</a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
