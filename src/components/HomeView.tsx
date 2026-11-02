"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Code2,
  MousePointer2,
  Layers,
  Plus,
  Terminal,
} from "lucide-react";
import CardDemoThumb from "./CardDemoThumb";
import DotField from "./DotField";
import HomeNav from "./HomeNav";
import { getHomeData } from "@/lib/home-reactbits-data";
import "./home-reactbits.css";

type Locale = "zh" | "en";

type Plan = {
  name: string;
  tagline: string;
  price: string;
  priceNote: string;
  features: string[];
  cta: string;
  href: string;
  featured?: boolean;
};

function buildCopy(locale: Locale, counts: ReturnType<typeof getHomeData>["counts"]) {
  const zh = locale === "zh";
  const base = zh ? "" : "/en";
  return {
    badgeNew: zh ? "新" : "New",
    badgeText: zh
      ? `${counts.concepts} 个概念，每个都能上手`
      : `${counts.concepts} concepts, every one playable`,
    h1a: zh ? "把会的东西，变成" : "Ship a product with AI —",
    h1b: zh ? "可用的资产。" : "no code required.",
    lead: zh ? "给非工程师的 AI 编程入门。" : "The AI-coding concepts you keep running into, in plain words.",
    ctaMain: zh ? "从零做出第一个官网" : "Start your first site",
    ctaBrowse: zh ? "先逛概念" : "Browse concepts",
    domain: "buildhub.cn",
    domainNote: zh ? "免费内容 · 无需登录" : "Free · no account",
    tickerLabel: zh ? `${counts.concepts + counts.styles + counts.stack + counts.prompts + counts.skills} 项内容已在站内` : `${counts.concepts + counts.styles + counts.stack + counts.prompts + counts.skills} assets inside`,
    ticker: [
      { label: zh ? "概念" : "Concepts", count: counts.concepts },
      { label: zh ? "界面样张" : "UI samples", count: counts.styles },
      { label: zh ? "技术栈" : "Stack", count: counts.stack },
      { label: zh ? "提示词" : "Prompts", count: counts.prompts },
      { label: zh ? "技能" : "Skills", count: counts.skills },
      { label: zh ? "实测产品" : "Products", count: counts.products },
    ],
    overviewTitle: zh ? "为真正想做出东西的人准备。" : "Built for people who actually ship.",
    overviewSub: zh
      ? "高质量的内容，给会被记住的作品。"
      : "Production-grade explanations for the work that gets remembered.",
    overviewCta: zh ? "逛逛概念库" : "Browse concepts",
    chipNames: zh
      ? ["概念", "设计风格", "动效", "技术栈"]
      : ["Concepts", "Design styles", "Motion", "Stack"],
    pill: zh ? `${counts.concepts} 个概念` : `${counts.concepts} concepts`,
    bentoTitle: zh ? "一个下午，看懂一周的量。" : "Learn a week's worth in an afternoon.",
    bentoSub: zh
      ? "概念、样张、技术栈和提示词，全在一个站点里。"
      : "Concepts, samples, stack picks and prompts. The whole library in one place.",
    flowTitle: zh ? "结构清晰，不用翻教程。" : "Structured, not scattered.",
    flowSub: zh
      ? "每条都标了分区、难度和能直接抄的示例。"
      : "Every entry tagged by zone, level and a copyable example.",
    flowNodes: zh
      ? ["400+ 个概念", "每个都能玩", "实测筛过", "0 元", "随时能查"]
      : ["400+ concepts", "Playable demos", "Tested picks", "Free", "Always there"],
    mini1Title: zh ? "按主题分区" : "Tuned to your subject",
    mini1Sub: zh
      ? "前端、后端、AI、Git、设计、选型——一栏一个入口。"
      : "Frontend, backend, AI, Git, design and stack — one lane per subject.",
    mini2Title: zh ? "320px 到 4K" : "320px to 4K",
    mini2Sub: zh ? "手机和桌面都标过样张，照着做不会错。" : "Samples built for phones and desktops alike.",
    mini3Title: zh ? "立即可用" : "Ready to use",
    mini3Sub: zh
      ? "每个概念都配示例，贴进 AI 工具就能开始。"
      : "Every concept ships with an example your agent can use.",
    insideTitle: zh ? "一个页面需要的，这里都有。" : "Everything a page needs.",
    insideSub: zh
      ? "概念、样张、技术栈、提示词和技能，一次配齐。"
      : "Concepts, samples, stack, prompts and skills. The site, the docs and the agent.",
    insideCta: zh ? "打开内容总览" : "Explore the library",
    insideCells: [
      {
        count: `${counts.concepts}`,
        label: zh ? "概念词条" : "Concepts",
        desc: zh
          ? "从 HTTP 到 React，每个词条都用大白话讲清，并配可视化示例。"
          : "From HTTP to React, every term explained in plain words with a live demo.",
        href: `${base}/topics/frontend`,
      },
      {
        count: `${counts.styles}`,
        label: zh ? "界面样张" : "UI samples",
        desc: zh
          ? "深色官网、目录导航、杂志卡片、付费墙——照着挑一个方向。"
          : "Dark sites, directory navs, journal cards, paywalls — pick a direction.",
        href: `${base}/design`,
      },
      {
        count: `${counts.stack}`,
        label: zh ? "技术栈选型" : "Stack picks",
        desc: zh
          ? "建站、AI、数据库、部署，每一项都说清适合谁。"
          : "Sites, AI, databases, deploys. Each pick says who it's for.",
        href: `${base}/stack`,
      },
      {
        count: `${counts.prompts}`,
        label: zh ? "可抄提示词" : "Prompts",
        desc: zh
          ? "贴进 Cursor、Copilot 或 v0 就能用的完整提示词。"
          : "Complete prompts you can paste into Cursor, Copilot or v0.",
        href: `${base}/prompts`,
      },
      {
        count: `${counts.skills}`,
        label: zh ? "技能" : "Skills",
        desc: zh
          ? "让 AI 学会一套做法，从写文案到验收都有对应技能。"
          : "Teach your agent a workflow, from copy to acceptance checks.",
        href: `${base}/skills`,
      },
      {
        count: "0",
        label: zh ? "元" : "paywalls",
        desc: zh
          ? "没有付费墙，没有试用期。所有内容现在和以后都免费。"
          : "No paywall, no trial. Everything is free now and later.",
        href: `${base}/topics/frontend`,
      },
    ],
    templatesTitle: zh ? "先从好看的界面开始。" : "Start from something beautiful.",
    templatesSub: zh
      ? `${counts.styles} 个界面样张，点开就是完整说明。`
      : `${counts.styles} UI samples. Open one and it's all there.`,
    templatesCta: zh ? "全部样张" : "View all samples",
    showcaseTitle: zh ? "每一屏，都有现成参考。" : "Skip the blank canvas.",
    showcaseSub: zh
      ? "8 个分区，每个都有能玩的示例，先看再抄。"
      : "Eight zones with playable examples. Look first, then build.",
    showcaseCta: zh ? "全部分区" : "Browse all zones",
    showcaseBadge: zh ? "可以玩的示例" : "A playable example",
    showcaseOpen: zh ? "打开这个示例" : "Open this sample",
    showcaseZone: zh ? "看整个分区" : "View the zone",
    showcaseFoot: (n: number) => (zh ? `${n} 个词条 · 一个入口` : `${n} entries · one place`),
    showcaseCaption: (name: string) => (zh ? `${name} · 实时示例` : `${name} · live sample`),
    agentTitle: zh ? "给 AI 装上一套好用的工具。" : "Give your agent good taste.",
    agentSub: zh
      ? "把 BuildHub 的技能和提示词，装进 Claude Code、Cursor。"
      : "Curated skills and clear guidance, built for your agent.",
    agentCta: zh ? "看看 Agent Kit" : "Explore the Agent Kit",
    agentCards: [
      {
        title: zh ? `${counts.skills} 个技能` : `${counts.skills} skills`,
        desc: zh
          ? "从写首屏、改文案到验收，每个技能对应一件具体的事。"
          : "From hero copy to acceptance checks, one skill per real job.",
      },
      {
        title: zh ? "一条命令安装" : "One-command install",
        desc: zh
          ? "复制一条命令，装进 Claude Code 或 Cursor，不用来回粘贴。"
          : "One command drops the source into your repo. No copy-paste loop.",
      },
      {
        title: zh ? "源码可读" : "Code you own",
        desc: zh
          ? "全部是普通文件，能读能改，没有黑盒和锁定。"
          : "Plain readable files. No runtime, no lock-in, no black box.",
      },
    ],
    agentTry: zh ? "免费开始" : "Try for free",
    quotesTitle: zh ? "这些问题，你是不是也问过？" : "Don't take our word for it.",
    quotesSub: zh
      ? `从 ${counts.concepts} 个概念里挑的答案，点开就是完整解释。`
      : `Answers pulled from ${counts.concepts} entries. Open one for the full explanation.`,
    quotesCta: zh ? "全部概念" : "Follow the concepts",
    stepsTitle: zh ? "三步，从看懂到做出来。" : "Three steps from reading to shipping.",
    steps: [
      {
        title: zh ? "先找一个起点。" : "Find your starting point.",
        desc: zh
          ? "从概念、样张或路径里挑一个方向，先看别人怎么做，再决定自己做什么。"
          : "Pick a concept, a sample or a path. See how it's done before you decide what to build.",
      },
      {
        title: zh ? "改成你自己的。" : "Make it unmistakably yours.",
        desc: zh
          ? "把示例换掉，把提示词贴进 AI 工具，改到它真的像你的东西。"
          : "Swap the copy, paste the prompt into your agent, and tune it until it's yours.",
      },
      {
        title: zh ? "然后做下一个。" : "Reach for it again.",
        desc: zh
          ? "第一个页面只是开始。把路径走完，你会有一套自己的做法。"
          : "The first page is just the start. Finish the path and you'll have a process.",
      },
    ],
    bannerTitle: zh ? "看一遍，不如做一遍。" : "Read once. Then build.",
    bannerSub: zh
      ? "所有内容免费。从第一个官网开始，走完一条路径。"
      : "Everything is free. Start with your first site and finish a whole path.",
    bannerCta: zh ? "从第一个官网开始" : "Start your first site",
    bannerAlt: zh ? "先逛概念" : "Browse concepts first",
    pricingTitleA: zh ? "一直" : "Pay once. Ship",
    pricingGrad: zh ? "免费" : "forever",
    pricingTitleB: zh ? "。随便看。" : ".",
    pricingSub: zh
      ? "没有付费墙，没有试用期。想做点什么，任选一个入口。"
      : "No paywall, no trial. Pick whichever entry fits what you're doing.",
    pricingToggle: zh ? ["按目标", "按身份"] : ["By goal", "By role"],
    plansGoal: [
      {
        name: zh ? "做出第一个官网" : "Your first website",
        tagline: zh ? "五页骨架，首屏文案，部署清单。" : "A five-page skeleton, hero copy and a deploy list.",
        price: zh ? "¥0" : "Free",
        priceNote: zh ? "一直免费" : "forever",
        features: zh
          ? ["5 页骨架 + 首屏文案", "每一步都配提示词", `${counts.styles} 个界面样张可选`, "部署上线检查清单"]
          : ["Five-page skeleton + hero copy", "A prompt for every step", `${counts.styles} UI samples to pick from`, "Pre-launch checklist"],
        cta: zh ? "开始这条路" : "Start this path",
        href: `${base}/paths/first-website`,
      },
      {
        name: zh ? "看懂 AI 黑话" : "Speak AI",
        tagline: zh ? "把最常撞见的概念，一次讲明白。" : "The concepts you keep hitting, explained once.",
        price: zh ? "¥0" : "Free",
        priceNote: zh ? "一直免费" : "forever",
        features: zh
          ? [`${counts.concepts} 个概念词条`, "每个都能上手玩", "按前端 / 后端 / AI / Git 分区", "顶部搜索，⌘K 直达"]
          : [`${counts.concepts} concept entries`, "A playable demo for each", "Zoned by frontend, backend, AI, Git", "Search with ⌘K"],
        cta: zh ? "打开概念库" : "Open the library",
        href: `${base}/topics/frontend`,
      },
      {
        name: zh ? "装进 AI 工具" : "Install the kit",
        tagline: zh ? "让 Claude Code、Cursor 会用你的做法。" : "Let Claude Code and Cursor follow your process.",
        price: zh ? "¥0" : "Free",
        priceNote: zh ? "一直免费" : "forever",
        features: zh
          ? [`${counts.skills} 个 BuildHub 技能`, "一条命令安装", "Claude Code / Cursor 通用", "源码可读，随便改"]
          : [`${counts.skills} BuildHub skills`, "One-command install", "Works with Claude Code and Cursor", "Readable source, fork it"],
        cta: zh ? "看看 Skill" : "See the Skill",
        href: `${base}/buildhub-skill`,
      },
    ],
    plansRole: [
      {
        name: zh ? "非工程师" : "Non-engineers",
        tagline: zh ? "不碰命令行，从概念和样张开始。" : "No terminal required. Start from concepts and samples.",
        price: zh ? "¥0" : "Free",
        priceNote: zh ? "一直免费" : "forever",
        features: zh
          ? ["大白话概念", "可视化示例", "界面样张", "提示词直接抄"]
          : ["Plain-word concepts", "Visual demos", "UI samples", "Copyable prompts"],
        cta: zh ? "从概念开始" : "Start with concepts",
        href: `${base}/topics/frontend`,
      },
      {
        name: zh ? "独立开发者" : "Solo builders",
        tagline: zh ? "先找参考，再动手，省掉试错。" : "Find the reference first, then build.",
        price: zh ? "¥0" : "Free",
        priceNote: zh ? "一直免费" : "forever",
        features: zh
          ? ["技术栈选型", "实测产品", "完整路径", "可安装技能"]
          : ["Stack picks", "Tested products", "Full paths", "Installable skills"],
        cta: zh ? "看技术栈" : "Browse the stack",
        href: `${base}/stack`,
      },
      {
        name: zh ? "产品经理" : "Product teams",
        tagline: zh ? "用同一套词条，对齐设计和开发。" : "One shared vocabulary for design and dev.",
        price: zh ? "¥0" : "Free",
        priceNote: zh ? "一直免费" : "forever",
        features: zh
          ? ["产品概念词条", "界面方向样张", "验收清单", "团队可用"]
          : ["Product concepts", "Design directions", "Acceptance checklists", "Free for teams"],
        cta: zh ? "看产品概念" : "Product concepts",
        href: `${base}/topics/product`,
      },
    ],
    pricingNote: zh
      ? "所有内容现在和以后都免费。没有隐藏收费，也不用绑定账号。"
      : "Everything is free, now and later. No hidden charges, no account required.",
    faqTitle: zh ? "常见问题。" : "Common questions.",
    faqSub: zh ? "没覆盖到的，直接问我们。" : "Not covered here? Reach out and we'll help.",
    faqContacts: [
      { title: zh ? "发邮件给我们" : "Email us", sub: zh ? "内容建议和问题反馈" : "Content requests and feedback", href: "mailto:hello@buildhub.cn", icon: "mail" as const },
      { title: zh ? "查看更新日志" : "See the changelog", sub: zh ? "我们最近在补什么" : "What we're shipping next", href: `${base}/changelog`, icon: "log" as const },
    ],
    faq: zh
      ? [
          { q: "需要会写代码吗？", a: "不需要。概念用大白话讲，每个词条都配能直接跑的可视化示例；要动手时，提示词可以贴进任何 AI 工具。" },
          { q: "BuildHub 和普通教程有什么区别？", a: "不堆课程。每个概念一页，讲清是什么、什么时候用、怎么验证；能玩的示例就在页面上，不用跳到别处。" },
          { q: "内容会更新吗？", a: "会。网站、技术栈和产品评测按周更新，每次改动都会记在更新日志里。" },
          { q: "真的全部免费吗？", a: "是。所有词条、样张、提示词和产品评测都能直接看，没有付费墙，也没有试用期。" },
          { q: "英文内容一样多吗？", a: `英文站目前有 ${counts.dictEn} 个词条，覆盖同样的核心主题；中文站有 ${counts.dictZh} 个，更深一些。` },
          { q: "可以把内容用在自己的项目里吗？", a: "可以。示例代码和提示词随便抄，能注明来源就更好了。" },
          { q: "怎么把 BuildHub 装进 AI 工具？", a: "打开 BuildHub Skill 页面，复制那句话说给你的 Agent，Claude Code、Cursor 都能用。" },
          { q: "找不到想要的概念怎么办？", a: "用顶部搜索（⌘K）直接搜；没有的话发邮件告诉我们，会补上。" },
        ]
      : [
          { q: "Do I need to know how to code?", a: "No. Concepts are written in plain words and every entry ships with a visual demo. When you want to build, paste the prompt into any AI tool." },
          { q: "How is this different from a tutorial site?", a: "No course pile-up. One page per concept: what it is, when to use it, how to check it. The playable example is right there." },
          { q: "Does the content get updated?", a: "Yes. Sites, stack picks and product reviews are updated weekly, and every change lands in the changelog." },
          { q: "Is all of it really free?", a: "Yes. Every entry, sample, prompt and review is readable right now. No paywall, no trial." },
          { q: "Is the English site as complete?", a: `English currently has ${counts.dictEn} entries covering the same core topics. The Chinese site has ${counts.dictZh}, and goes deeper.` },
          { q: "Can I use the examples in my own project?", a: "Yes. Copy the code and prompts freely. A credit is nice but not required." },
          { q: "How do I install BuildHub into my agent?", a: "Open the BuildHub Skill page and paste the install sentence to your agent. It works with Claude Code and Cursor." },
          { q: "What if I can't find a concept?", a: "Search with ⌘K first. If it's missing, email us and we'll add it." },
        ],
    finalTitleA: zh ? "你的下一个产品，" : "Your next launch",
    finalGrad: zh ? "值得现在动手。" : "deserves to ship now.",
    finalSub: zh
      ? "所有内容免费。挑一个入口，今天就做出第一屏。"
      : "Every concept, sample, prompt and skill. Free. Pick one and build the first screen today.",
    finalCta: zh ? "从第一个官网开始" : "Start your first site",
    finalAlt: zh ? "浏览全部概念" : "Browse all concepts",
    switchLabel: zh ? "定价方式" : "Pricing mode",
    faqAria: zh ? "常见问题" : "Frequently asked questions",
  };
}

export default function HomeView({ locale = "zh" }: { locale?: Locale }) {
  const data = getHomeData(locale);
  const C = buildCopy(locale, data.counts);
  const { counts, showcase, styles, heroShots, quotes, zoneChips, labels, base } = data;

  const isZh = locale === "zh";
  const [isLight, setIsLight] = useState(false);
  const [activeBlock, setActiveBlock] = useState(0);
  const [pricingMode, setPricingMode] = useState<"goal" | "role">("goal");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const rootRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  const zones = zoneChips.slice(0, showcase.length);
  const activeZone = zones[activeBlock] ?? zones[0];
  const block = showcase[activeBlock] ?? showcase[0];
  const plans = pricingMode === "goal" ? C.plansGoal : C.plansRole;

  useEffect(() => {
    try {
      if (window.localStorage.getItem("bh-home-mode") === "light") setIsLight(true);
    } catch {
      /* storage may be unavailable */
    }
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    root.classList.add("rb-ready");
    const els = Array.from(root.querySelectorAll<HTMLElement>(".rb-reveal"));
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -6% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    let down = false;
    let moved = false;
    let startX = 0;
    let startLeft = 0;

    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      down = true;
      moved = false;
      startX = e.clientX;
      startLeft = el.scrollLeft;
      el.classList.add("is-dragging");
    };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      el.scrollLeft = startLeft - dx;
    };
    const onUp = () => {
      down = false;
      el.classList.remove("is-dragging");
    };
    const onClick = (e: MouseEvent) => {
      if (moved) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    el.addEventListener("click", onClick, true);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      el.removeEventListener("click", onClick, true);
    };
  }, []);

  const toggleMode = () => {
    setIsLight((cur) => {
      const next = !cur;
      try {
        window.localStorage.setItem("bh-home-mode", next ? "light" : "dark");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const stepIcons = [
    <MousePointer2 key="i1" size={20} strokeWidth={1.6} />,
    <Code2 key="i2" size={20} strokeWidth={1.6} />,
    <Layers key="i3" size={20} strokeWidth={1.6} />,
  ];
  const agentIcons = [
    <Terminal key="a1" size={20} strokeWidth={1.6} />,
    <Check key="a2" size={20} strokeWidth={1.6} />,
    <Code2 key="a3" size={20} strokeWidth={1.6} />,
  ];

  return (
    <div ref={rootRef} className={`rb-home${isLight ? " is-light" : ""}`}>
      {/* 点阵光带当整页背景：钉在视口上不跟着滚，鼠标推着走、滚动时窜一下，没人碰也自己慢慢游。
          滚过一屏多就淡到只剩质感底：正文在下面读，光带不该跟着滚一路窜。 */}
      <div className="rb-field-bg" aria-hidden>
        <DotField
          baseColor={isLight ? "#cfc9da" : "#3a3446"}
          activeColor={isLight ? "#5227ff" : "#ffffff"}
          fade={0.5}
          opacity={isLight ? 0.6 : 0.9}
          ambient={isLight ? 0.3 : 0.42}
          scrollSway={0.5}
          scrollDim={1.15}
          dimFloor={isLight ? 0.45 : 0.38}
        />
      </div>

      <HomeNav locale={locale} isLight={isLight} onToggleMode={toggleMode} counts={counts} />

      <main className="rb-main">
        {/* ============ HERO ============ */}
        <section className="rb-hero">
          <div className="rb-hero-bg" aria-hidden>
            <span className="rb-hero-glow rb-hero-glow-a" />
            <span className="rb-hero-glow rb-hero-glow-b" />
          </div>

          <div className="rb-container rb-hero-inner">
            <Link className="rb-badge" href={`${base}/topics/frontend`}>
              <span>{C.badgeNew}</span>
              {C.badgeText}
              <ArrowRight size={13} strokeWidth={2} aria-hidden />
            </Link>

            <div className="rb-hero-head">
              <h1 className="rb-hero-title">
                {C.h1a}<span className="rb-grad">{C.h1b}</span>
              </h1>

              <p className="rb-hero-lead">{C.lead}</p>
            </div>

            <div className="rb-hero-actions">
              <Link
                className="rb-btn rb-btn-solid"
                href={isZh ? "/paths/first-website" : `${base}/topics/frontend`}
              >
                {C.ctaMain}
              </Link>
              <Link
                className="rb-btn rb-btn-ghost"
                href={`${base}/topics/frontend`}
              >
                {C.ctaBrowse}
                <ArrowRight size={15} strokeWidth={1.9} aria-hidden />
              </Link>
            </div>
          </div>

          <div className="rb-browser-wrap rb-reveal">
            <div className="rb-browser">
              <div className="rb-browser-bar">
                <span className="rb-dots" aria-hidden>
                  <i />
                  <i />
                  <i />
                </span>
                <span className="rb-domain">{C.domain}</span>
                <span className="rb-browser-note">{C.domainNote}</span>
              </div>

              <div className="rb-showcase">
                <span className="rb-showcase-glow" aria-hidden />
                <div className="rb-shot-row row-a">
                  {[...heroShots, ...heroShots].map((shot, i) => (
                    <span className="rb-shot" key={`a-${shot.slug}-${i}`}>
                      <CardDemoThumb demoHtml={shot.demoHtml} demoClass={shot.demoClass} />
                    </span>
                  ))}
                </div>
                <div className="rb-shot-row row-b">
                  {[...heroShots].reverse().concat(heroShots).map((shot, i) => (
                    <span className="rb-shot" key={`b-${shot.slug}-${i}`}>
                      <CardDemoThumb demoHtml={shot.demoHtml} demoClass={shot.demoClass} />
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="rb-assets" aria-label={C.tickerLabel}>
              <div className="rb-assets-track">
                {[0, 1].map((copy) => (
                  <div className="rb-assets-group" key={copy} aria-hidden={copy === 1}>
                    <span className="rb-assets-title">
                      <Layers size={13} strokeWidth={1.8} aria-hidden />
                      {C.tickerLabel}
                    </span>
                    {C.ticker.map((t) => (
                      <span className="rb-assets-item" key={`${copy}-${t.label}`}>
                        {t.label}
                        <b>{t.count}</b>
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ============ OVERVIEW / BENTO ============ */}
        <section className="rb-section">
          <div className="rb-container">
            <div className="rb-section-head rb-reveal">
              <div>
                <h2>{C.overviewTitle}</h2>
                <p>{C.overviewSub}</p>
              </div>
              <Link className="rb-btn rb-btn-ghost rb-btn-sm" href={`${base}/topics/frontend`}>
                {C.overviewCta}
                <ArrowRight size={14} strokeWidth={1.9} aria-hidden />
              </Link>
            </div>

            <div className="rb-bento rb-reveal">
              <div className="rb-bento-main">
                <div className="rb-bento-visual">
                  <span className="rb-chip chip-1">
                    <Layers size={13} strokeWidth={1.7} aria-hidden />
                    {C.chipNames[0]}
                  </span>
                  <span className="rb-chip chip-2">
                    <MousePointer2 size={13} strokeWidth={1.7} aria-hidden />
                    {C.chipNames[1]}
                  </span>
                  <span className="rb-chip chip-3">
                    <Terminal size={13} strokeWidth={1.7} aria-hidden />
                    {C.chipNames[2]}
                  </span>
                  <span className="rb-chip chip-4">
                    <Code2 size={13} strokeWidth={1.7} aria-hidden />
                    {C.chipNames[3]}
                  </span>
                  <span className="rb-tile" aria-hidden>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14.5 3.5 10 9.5l-4 1 7 2 2 7 1-4 6-4.5z" />
                    </svg>
                  </span>
                  <span className="rb-pill">{C.pill}</span>
                </div>
                <div className="rb-bento-copy">
                  <h3>{C.bentoTitle}</h3>
                  <p className="rb-bento-sub">{C.bentoSub}</p>
                </div>
              </div>

              <div className="rb-bento-side">
                <div className="rb-flow" aria-hidden>
                  <span className="rb-flow-line" />
                  {C.flowNodes.map((node, i) => (
                    <span key={node} className={`rb-flow-node node-${i + 1}`}>
                      <i />
                      {node}
                    </span>
                  ))}
                </div>
                <div className="rb-bento-copy">
                  <h3>{C.flowTitle}</h3>
                  <p className="rb-bento-sub">{C.flowSub}</p>
                </div>
              </div>

              <div className="rb-bento-row">
                <div className="rb-mini-cell">
                  <div className="rb-mini" aria-hidden>
                    <div className="rb-mini-ui">
                      <span className="rb-mini-slider">
                        <b />
                      </span>
                      <span className="rb-mini-tone">
                        <i />
                        <i />
                        <i />
                      </span>
                    </div>
                  </div>
                  <h4>{C.mini1Title}</h4>
                  <p>{C.mini1Sub}</p>
                </div>
                <div className="rb-mini-cell">
                  <div className="rb-mini" aria-hidden>
                    <div className="rb-mini-screen">
                      <i />
                      <i />
                      <i />
                    </div>
                  </div>
                  <h4>{C.mini2Title}</h4>
                  <p>{C.mini2Sub}</p>
                </div>
                <div className="rb-mini-cell">
                  <div className="rb-mini" aria-hidden>
                    <div className="rb-mini-flow">
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                  <h4>{C.mini3Title}</h4>
                  <p>{C.mini3Sub}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ SIX CELLS ============ */}
        <section className="rb-section">
          <div className="rb-container">
            <div className="rb-section-head rb-reveal">
              <div>
                <h2>{C.insideTitle}</h2>
                <p>{C.insideSub}</p>
              </div>
              <Link className="rb-btn rb-btn-ghost rb-btn-sm" href={`${base}/topics/frontend`}>
                {C.insideCta}
                <ArrowRight size={14} strokeWidth={1.9} aria-hidden />
              </Link>
            </div>

            <div className="rb-cells rb-reveal">
              {C.insideCells.map((cell) => (
                <Link key={cell.label} className="rb-cell" href={cell.href}>
                  <div className="rb-cell-top">
                    <span>
                      <b>{cell.count}</b>
                      {cell.label}
                    </span>
                    <ArrowUpRight size={15} strokeWidth={1.8} aria-hidden />
                  </div>
                  <p className="rb-cell-copy">{cell.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ============ TEMPLATE CAROUSEL ============ */}
        <section className="rb-section">
          <div className="rb-container">
            <div className="rb-section-head rb-reveal">
              <div>
                <h2>{C.templatesTitle}</h2>
                <p>{C.templatesSub}</p>
              </div>
              <Link className="rb-btn rb-btn-ghost rb-btn-sm" href={`${base}/design`}>
                {C.templatesCta}
                <ArrowRight size={14} strokeWidth={1.9} aria-hidden />
              </Link>
            </div>

            <div className="rb-carousel rb-reveal" ref={carouselRef}>
              {styles.map((style) => (
                <Link className="rb-tpl" key={style.slug} href={style.href}>
                  <span className="rb-tpl-preview">
                    <CardDemoThumb demoHtml={style.demoHtml} demoClass={style.demoClass} />
                  </span>
                  <span className="rb-tpl-meta">
                    <span className="rb-tpl-text">
                      <b>{style.name}</b>
                      <small>{style.tagline}</small>
                    </span>
                    <ArrowRight className="rb-tpl-link" size={16} strokeWidth={1.9} aria-hidden />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ============ TABBED SHOWCASE ============ */}
        <section className="rb-section">
          <div className="rb-container">
            <div className="rb-section-head rb-reveal">
              <div>
                <h2>{C.showcaseTitle}</h2>
                <p>{C.showcaseSub}</p>
              </div>
              <Link className="rb-btn rb-btn-ghost rb-btn-sm" href={`${base}/topics/frontend`}>
                {C.showcaseCta}
                <ArrowRight size={14} strokeWidth={1.9} aria-hidden />
              </Link>
            </div>

            <div className="rb-tabs" role="tablist" aria-label={C.showcaseCta}>
              {zones.map((zone, i) => (
                <button
                  key={zone.key}
                  type="button"
                  role="tab"
                  aria-selected={activeBlock === i}
                  className={`rb-tab${activeBlock === i ? " is-active" : ""}`}
                  onClick={() => setActiveBlock(i)}
                >
                  {zone.label}
                </button>
              ))}
              <span className="rb-tabs-count">
                {String(activeBlock + 1).padStart(2, "0")} / {String(zones.length).padStart(2, "0")}
              </span>
            </div>

            <div className="rb-tabs-page rb-reveal">
              <div className="rb-block">
                <div className="rb-block-copy">
                  <span className="rb-block-badge">
                    <b>New</b>
                    {C.showcaseBadge}
                  </span>
                  <h3>
                    {block?.name}
                    <span>{block?.en}</span>
                  </h3>
                  <p>{block?.tagline}</p>
                  <div className="rb-block-actions">
                    <Link className="rb-btn rb-btn-solid rb-btn-sm" href={block?.href ?? `${base}/topics/frontend`}>
                      {C.showcaseOpen}
                      <ArrowRight size={14} strokeWidth={1.9} aria-hidden />
                    </Link>
                    <Link className="rb-btn rb-btn-ghost rb-btn-sm" href={`${base}/topics/${activeZone?.key ?? "frontend"}`}>
                      {C.showcaseZone}
                    </Link>
                  </div>
                  <div className="rb-block-foot">
                    <span className="rb-avatars" aria-hidden>
                      {showcase.slice(0, 4).map((s) => (
                        <i key={s.slug}>{(s.zoneLabel || "B").slice(0, 1)}</i>
                      ))}
                    </span>
                    <span>{C.showcaseFoot(activeZone?.count ?? 0)}</span>
                  </div>
                </div>
                <div className="rb-block-preview">
                  {block ? (
                    <CardDemoThumb demoHtml={block.demoHtml} demoClass={block.demoClass} />
                  ) : null}
                  <span className="rb-block-caption">
                    {C.showcaseCaption(block?.name ?? activeZone?.label ?? "")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ AGENT KIT ============ */}
        <section className="rb-section">
          <div className="rb-container">
            <div className="rb-section-head rb-reveal">
              <div>
                <h2>{C.agentTitle}</h2>
                <p>{C.agentSub}</p>
              </div>
              <Link className="rb-btn rb-btn-ghost rb-btn-sm" href={`${base}/buildhub-skill`}>
                {C.agentCta}
                <ArrowRight size={14} strokeWidth={1.9} aria-hidden />
              </Link>
            </div>

            <div className="rb-agent rb-reveal">
              {C.agentCards.map((card, i) => (
                <div className="rb-agent-card" key={card.title}>
                  <span className="rb-agent-icon">{agentIcons[i]}</span>
                  <h4>{card.title}</h4>
                  <p>{card.desc}</p>
                </div>
              ))}
            </div>

            <Link className="rb-arrow-link" href={`${base}/buildhub-skill`}>
              {C.agentTry}
              <ArrowRight size={14} strokeWidth={1.9} aria-hidden />
            </Link>
          </div>
        </section>

        {/* ============ QUOTES ============ */}
        <section className="rb-section">
          <div className="rb-container">
            <div className="rb-section-head rb-reveal">
              <div>
                <h2>{C.quotesTitle}</h2>
                <p>{C.quotesSub}</p>
              </div>
              <Link className="rb-btn rb-btn-ghost rb-btn-sm" href={`${base}/topics/frontend`}>
                {C.quotesCta}
                <ArrowRight size={14} strokeWidth={1.9} aria-hidden />
              </Link>
            </div>

            <div className="rb-quotes rb-reveal">
              {quotes.map((quote) => (
                <Link className="rb-quote" key={quote.name} href={quote.href}>
                  <p>“{quote.quote}”</p>
                  <span className="rb-quote-foot">
                    <i className="rb-quote-avatar">{quote.initial}</i>
                    <span>
                      <b>{quote.name}</b>
                      <small>
                        {quote.zoneLabel}
                        {quote.en ? ` · ${quote.en}` : ""}
                      </small>
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ============ STEPS + BANNER ============ */}
        <section className="rb-section">
          <div className="rb-container">
            <div className="rb-section-head rb-reveal">
              <div>
                <h2>{C.stepsTitle}</h2>
              </div>
            </div>

            <div className="rb-steps rb-reveal">
              {C.steps.map((step, i) => (
                <div className="rb-step" key={step.title}>
                  <span className="rb-step-icon">{stepIcons[i]}</span>
                  <h4>{step.title}</h4>
                  <p>{step.desc}</p>
                </div>
              ))}
              <div className="rb-steps-banner">
                <div>
                  <h3>{C.bannerTitle}</h3>
                  <p>{C.bannerSub}</p>
                </div>
                <div className="rb-steps-actions">
                  <Link
                    className="rb-btn rb-btn-solid rb-btn-sm"
                    href={isZh ? "/paths/first-website" : `${base}/topics/frontend`}
                  >
                    {C.bannerCta}
                    <ArrowRight size={14} strokeWidth={1.9} aria-hidden />
                  </Link>
                  <Link className="rb-arrow-link" href={`${base}/topics/frontend`}>
                    {C.bannerAlt}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ PRICING (free) ============ */}
        <section className="rb-section rb-pricing-section">
          <div className="rb-container">
            <div className="rb-pricing-head rb-reveal">
              <div>
                <h2>
                  {C.pricingTitleA}
                  <span className="rb-grad">{C.pricingGrad}</span>
                  {C.pricingTitleB}
                </h2>
                <p>{C.pricingSub}</p>
              </div>
              <div className="rb-switch" role="group" aria-label={C.switchLabel}>
                <button
                  type="button"
                  className={pricingMode === "goal" ? "is-active" : ""}
                  aria-pressed={pricingMode === "goal"}
                  onClick={() => setPricingMode("goal")}
                >
                  {C.pricingToggle[0]}
                </button>
                <button
                  type="button"
                  className={pricingMode === "role" ? "is-active" : ""}
                  aria-pressed={pricingMode === "role"}
                  onClick={() => setPricingMode("role")}
                >
                  {C.pricingToggle[1]}
                </button>
              </div>
            </div>

            <div className="rb-plans rb-reveal">
              {plans.map((plan, i) => (
                <div
                  className={`rb-plan${i === plans.length - 1 ? " is-featured" : ""}`}
                  key={`${pricingMode}-${plan.name}`}
                >
                  <div className="rb-plan-top">
                    <h3>{plan.name}</h3>
                    {i === plans.length - 1 ? (
                      <span className="rb-plan-tag">{isZh ? "推荐" : "Most popular"}</span>
                    ) : null}
                  </div>
                  <p className="rb-plan-tagline">{plan.tagline}</p>
                  <div className="rb-plan-price">
                    <b>{plan.price}</b>
                    <small>{plan.priceNote}</small>
                  </div>
                  <ul>
                    {plan.features.map((feature) => (
                      <li key={feature}>
                        <Check size={14} strokeWidth={2} aria-hidden />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link
                    className={`rb-btn rb-btn-plan${i === plans.length - 1 ? " rb-btn-solid" : " rb-btn-ghost"}`}
                    href={plan.href}
                  >
                    {plan.cta}
                    <ArrowRight size={14} strokeWidth={1.9} aria-hidden />
                  </Link>
                </div>
              ))}
            </div>

            <p className="rb-pricing-note">{C.pricingNote}</p>
          </div>
        </section>

        {/* ============ FAQ ============ */}
        <section className="rb-section rb-faq">
          <div className="rb-container">
            <div className="rb-faq-left rb-reveal">
              <h2>{C.faqTitle}</h2>
              <p>{C.faqSub}</p>
              <div className="rb-faq-links">
                {C.faqContacts.map((contact) => (
                  <a
                    key={contact.title}
                    href={contact.href}
                    className="rb-faq-link"
                    target={contact.href.startsWith("mailto:") ? undefined : "_self"}
                  >
                    <span className="rb-faq-link-icon" aria-hidden>
                      {contact.icon === "mail" ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                          <rect x="3" y="5" width="18" height="14" rx="2" />
                          <path d="m4 7 8 6 8-6" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                          <circle cx="6" cy="7" r="2" />
                          <circle cx="6" cy="17" r="2" />
                          <circle cx="18" cy="7" r="2" />
                          <path d="M6 9v6M18 9v3a3 3 0 0 1-3 3H8" />
                        </svg>
                      )}
                    </span>
                    <span className="rb-faq-link-text">
                      <b>{contact.title}</b>
                      <small>{contact.sub}</small>
                    </span>
                    <ArrowUpRight size={15} strokeWidth={1.8} aria-hidden />
                  </a>
                ))}
              </div>
            </div>

            <div className="rb-accordion rb-reveal" aria-label={C.faqAria}>
              {C.faq.map((item, i) => {
                const open = openFaq === i;
                return (
                  <div className={`rb-acc${open ? " is-open" : ""}`} key={item.q}>
                    <button
                      type="button"
                      className="rb-acc-head"
                      aria-expanded={open}
                      onClick={() => setOpenFaq(open ? null : i)}
                    >
                      <span>{item.q}</span>
                      <Plus size={18} strokeWidth={1.7} aria-hidden />
                    </button>
                    <div className="rb-acc-body">
                      <div>
                        <p>{item.a}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ============ FINAL CTA ============ */}
        <section className="rb-final">
          <div className="rb-container rb-final-inner">
            <h2>
              {C.finalTitleA}
              <br />
              <span className="rb-grad">{C.finalGrad}</span>
            </h2>
            <div className="rb-final-actions">
              <p>{C.finalSub}</p>
              <div>
                <Link
                  className="rb-btn rb-btn-solid"
                  href={isZh ? "/paths/first-website" : `${base}/topics/frontend`}
                >
                  {C.finalCta}
                  <ArrowRight size={15} strokeWidth={1.9} aria-hidden />
                </Link>
                <Link className="rb-btn rb-btn-ghost" href={`${base}/topics/frontend`}>
                  {C.finalAlt}
                  <ArrowRight size={15} strokeWidth={1.9} aria-hidden />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
