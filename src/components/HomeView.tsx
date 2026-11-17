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
import { PLANS } from "@/lib/plans";
import { openProModal } from "@/lib/pro-modal";
import { track } from "@/lib/track";
import { COLOR_MODE_KEY } from "@/lib/theme";
import "./home-reactbits.css";

type Locale = "zh" | "en";

type Plan = {
  name: string;
  tagline: string;
  price: string;
  priceUnit?: string;
  priceNote?: string;
  features: string[];
  cta: string;
  href: string;
  featured?: boolean;
  openPro?: boolean;
};

const YEARLY = PLANS.find((p) => p.key === "yearly")!;
const MONTHLY = PLANS.find((p) => p.key === "monthly")!;
const LIFETIME = PLANS.find((p) => p.key === "lifetime")!;

function buildCopy(locale: Locale, counts: ReturnType<typeof getHomeData>["counts"]) {
  const zh = locale === "zh";
  const base = zh ? "" : "/en";
  return {
    badgeNew: zh ? "新" : "New",
    badgeText: zh
      ? `${counts.concepts} 个词条，每个都能上手`
      : `${counts.concepts} entries, every one playable`,
    h1a: zh ? "把会的东西，变成" : "Build what you know.",
    h1b: zh ? "可用的材料。" : "Use what you build.",
    lead: zh
      ? "概念、界面参考、提示词和路径——完整正文，人和 AI 都能直接用。"
      : "Concepts, UI references, prompts and paths — full text, ready for you and your AI.",
    ctaMain: zh ? "从零做出第一个官网" : "Start your first site",
    ctaBrowse: zh ? "先逛概念" : "Browse concepts",
    domain: "buildhub.cn",
    domainNote: zh ? "阅读免费 · 无需登录" : "Free to read · no account",
    tickerLabel: zh
      ? `${counts.concepts + counts.prompts + counts.skills} 项内容已在站内`
      : `${counts.concepts + counts.prompts + counts.skills} entries inside`,
    ticker: [
      { label: zh ? "词条" : "Entries", count: counts.concepts },
      { label: zh ? "界面参考" : "UI references", count: counts.styles },
      { label: zh ? "技术栈" : "Stack", count: counts.stack },
      { label: zh ? "提示词" : "Prompts", count: counts.prompts },
      { label: zh ? "技能" : "Skills", count: counts.skills },
      { label: zh ? "跑过的产品" : "Products run", count: counts.products },
    ],
    overviewTitle: zh
      ? "想做出一个网站，缺的是材料，不是教程。"
      : "What's missing isn't a tutorial. It's the material.",
    overviewSub: zh
      ? "概念、界面参考、技术栈、提示词和技能都在站里，每条都是完整正文，人和 AI 都能直接拿去用。"
      : "Concepts, UI references, stack picks, prompts and skills — each one the full text, usable by you and by your agent.",
    overviewCta: zh ? "逛逛概念库" : "Browse concepts",
    chipNames: zh
      ? ["概念", "设计风格", "动效", "技术栈"]
      : ["Concepts", "Design styles", "Motion", "Stack"],
    pill: zh ? `${counts.concepts} 个词条` : `${counts.concepts} entries`,
    bentoTitle: zh
      ? `${counts.concepts} 个词条，每个都能点开玩。`
      : `${counts.concepts} entries, each with a demo you can run.`,
    bentoSub: zh
      ? "分区别类、标好难度，示例就嵌在页面上，不用跳到别的站。"
      : "Tagged by zone and level, with the example living on the page itself.",
    flowTitle: zh ? "结构清晰，不用翻教程。" : "Structured, not scattered.",
    flowSub: zh
      ? "每条都标了分区、难度和能直接抄的示例。"
      : "Every entry tagged by zone, level and a copyable example.",
    flowNodes: zh
      ? [`${counts.concepts} 个词条`, "每条配示例", "分类好找", "搜索直达", "随时能查"]
      : [`${counts.concepts} entries`, "With demos", "Well sorted", "Searchable", "Always there"],
    mini1Title: zh ? "按主题分区" : "Tuned to your subject",
    mini1Sub: zh
      ? "前端、后端、AI、Git、设计、选型——一栏一个入口。"
      : "Frontend, backend, AI, Git, design and stack — one lane per subject.",
    mini2Title: zh ? "320px 到 4K" : "320px to 4K",
    mini2Sub: zh ? "手机和桌面都配了界面参考，照着做不会错。" : "References built for phones and desktops alike.",
    mini3Title: zh ? "立即可用" : "Ready to use",
    mini3Sub: zh
      ? "每个概念都配示例，贴进 AI 工具就能开始。"
      : "Every concept ships with an example your agent can use.",
    insideTitle: zh ? "一个页面需要的，这里都有。" : "Everything a page needs.",
    insideSub: zh
      ? "概念、界面参考、技术栈、提示词和技能，一次配齐。"
      : "Concepts, UI references, stack, prompts and skills. The site, the docs and the agent.",
    insideCta: zh ? "打开内容总览" : "Explore the library",
    insideCells: [
      {
        count: `${counts.concepts}`,
        label: zh ? "个词条" : "entries",
        desc: zh
          ? "从 HTTP 到 React，每个词条讲清含义，并配可运行的示例。"
          : "From HTTP to React — clear explanations with a live demo on each page.",
        href: `${base}/topics/frontend`,
      },
      {
        count: `${counts.styles}`,
        label: zh ? "界面参考" : "UI references",
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
        label: zh ? "提示词" : "Prompts",
        desc: zh
          ? "可直接粘贴到 Cursor、Copilot 或 v0 的完整提示词。"
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
        count: `${counts.paths}`,
        label: zh ? "条路径" : "Paths",
        desc: zh
          ? "从想法到上线，每一步写清做什么、怎么算做完。"
          : "Idea to live site. Every step says what to do and when it's done.",
        href: `${base}/paths`,
      },
    ],
    templatesTitle: zh ? "先从好看的界面开始。" : "Start from something beautiful.",
    templatesSub: zh
      ? `${counts.styles} 个界面参考，点开就是完整说明。`
      : `${counts.styles} UI references. Open one and it's all there.`,
    templatesCta: zh ? "全部界面参考" : "View all references",
    showcaseTitle: zh ? "每一屏，都有现成参考。" : "Skip the blank canvas.",
    showcaseSub: zh
      ? "8 个分区，每个都有可运行示例，先看再动手。"
      : "Eight zones with playable examples. Look first, then build.",
    showcaseCta: zh ? "全部分区" : "Browse all zones",
    showcaseBadge: zh ? "可以玩的示例" : "A playable example",
    showcaseOpen: zh ? "打开这个示例" : "Open this sample",
    showcaseZone: zh ? "看整个分区" : "View the zone",
    showcaseFoot: (n: number) => (zh ? `${n} 个词条 · 一个入口` : `${n} entries · one place`),
    showcaseCaption: (name: string) => (zh ? `${name} · 实时示例` : `${name} · live sample`),
    agentTitle: zh ? "免费术语 Skill，安装到你的 Agent。" : "A free terminology skill for your agent.",
    agentSub: zh
      ? "安装后，Agent 会把模糊描述改写成规范术语，并链到站内词条。这和 PRO 的整库离线包不是同一份文件。"
      : "It rewrites vague descriptions into precise terms and links to BuildHub entries. Separate from the PRO offline pack.",
    agentCta: zh ? "查看安装说明" : "See how to install",
    agentCards: [
      {
        title: zh ? "术语补全" : "Term completion",
        desc: zh
          ? "把口语需求改写成带准确术语的说明，不替你选技术栈。"
          : "Rewrites casual requests into precise language without picking your stack.",
      },
      {
        title: zh ? "一条指令安装" : "One prompt to install",
        desc: zh
          ? "复制安装指令发给 Claude Code 或 Cursor 即可。"
          : "Paste the install prompt into Claude Code or Cursor.",
      },
      {
        title: zh ? "普通 Markdown 文件" : "Plain Markdown",
        desc: zh
          ? "仓库里的可读文件，可检查、可修改。"
          : "Readable files in the repo — inspect and edit freely.",
      },
    ],
    agentTry: zh ? "安装说明" : "Install guide",
    quotesTitle: zh ? "这些问题，你是不是也问过？" : "Questions people actually ask.",
    quotesSub: zh
      ? `从 ${counts.concepts} 个词条里挑的答案，点开就是完整解释。`
      : `Answers pulled from ${counts.concepts} entries. Open one for the full explanation.`,
    quotesCta: zh ? "全部概念" : "Follow the concepts",
    stepsTitle: zh ? "三步，从看懂到做出来。" : "Three steps from reading to shipping.",
    steps: [
      {
        title: zh ? "先找一个起点。" : "Find your starting point.",
        desc: zh
          ? "从概念、界面参考或路径里挑一个方向，先看别人怎么做，再决定自己做什么。"
          : "Pick a concept, a reference or a path. See how it's done before you decide what to build.",
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
    bannerTitle: zh ? "第一条路径：做出一个能上线的官网。" : "Path one: a website that goes live.",
    bannerSub: zh
      ? "从想法到域名上线，每一步写清做什么、怎么算做完。"
      : "Idea to live domain, with a done-check on every step.",
    bannerCta: zh ? "从第一个官网开始" : "Start your first site",
    bannerAlt: zh ? "先逛概念" : "Browse concepts first",
    pricingTitleA: zh ? "定价" : "Pricing",
    pricingGrad: "",
    pricingTitleB: "",
    pricingSub: zh
      ? "给个人用的简单定价。站内阅读免费；需要带走整理好的材料时再开通 PRO。"
      : "Simple pricing for individuals. Reading is free; get PRO when you want the packed materials offline.",
    plans: [
      {
        name: zh ? "免费" : "Free",
        tagline: zh ? "先读、先用，不花一分。" : "Read and use first. No charge.",
        price: zh ? "¥0" : "$0",
        features: zh
          ? [
              "词条、提示词、路径全文可读",
              "无需登录即可浏览",
              "免费术语 Skill 可安装",
              "收藏 20 条 · 提示词复制 10 次",
            ]
          : [
              "Full text for entries, prompts and paths",
              "No account needed to browse",
              "Free terminology skill to install",
              "20 favorites · 10 prompt copies",
            ],
        cta: zh ? "开始阅读" : "Start reading",
        href: `${base}/topics/frontend`,
      },
      {
        name: "PRO",
        tagline: zh
          ? "一份离线包 + Agent 入口，约 ¥4.8 / 月。"
          : "One offline pack + agent entry — about ¥4.8 / month.",
        price: `¥${YEARLY.money}`,
        priceUnit: zh ? "/ 年" : "/ year",
        priceNote: zh
          ? `月卡 ¥${MONTHLY.money} · 终身 ¥${LIFETIME.money}`
          : `¥${MONTHLY.money}/mo · ¥${LIFETIME.money} lifetime`,
        features: zh
          ? [
              "完整 Markdown 离线包",
              "整库 Agent 入口 SKILL.md",
              "无限收藏与跨设备同步",
              "提示词不限次复制与导出",
            ]
          : [
              "Full Markdown offline pack",
              "Library SKILL.md for your agent",
              "Unlimited favorites and sync",
              "Unlimited prompt copies and export",
            ],
        cta: zh ? "开通 PRO" : "Get PRO",
        href: `${base}/pro`,
        openPro: true,
        featured: true,
      },
    ] satisfies Plan[],
    pricingNote: zh
      ? "微信支付即时开通，到期不自动扣费。免费术语 Skill 与 PRO 整库包是两份不同文件。"
      : "WeChat Pay activates instantly; no auto-renew. The free terminology skill and the PRO library pack are different files.",
    pricingFeatured: zh ? "推荐" : "Popular",
    faqTitle: zh ? "常见问题" : "FAQ",
    faqSub: zh ? "还有问题，直接发邮件。" : "Still stuck? Email us.",
    faqContacts: [
      { title: zh ? "发邮件" : "Email", sub: zh ? "内容建议与问题反馈" : "Content requests and feedback", href: "mailto:hello@buildhub.cn", icon: "mail" as const },
      { title: zh ? "更新日志" : "Changelog", sub: zh ? "最近更新了什么" : "What shipped recently", href: `${base}/changelog`, icon: "log" as const },
    ],
    faq: zh
      ? [
          {
            q: "BuildHub 是什么？",
            a: "软件构建用的知识库：概念、界面参考、技术栈、提示词、技能和动手路径。每条都是完整正文，人和 Agent 都能直接用。",
          },
          {
            q: "需要会写代码吗？",
            a: "不需要。概念写清楚，并配可运行示例；动手时把提示词粘贴到 AI 工具即可。",
          },
          {
            q: "和普通教程站有什么区别？",
            a: "不是课程合集。一个概念一页：是什么、何时用、怎么验证；示例嵌在页面上。",
          },
          {
            q: "看内容要花钱吗？",
            a: "不用。站内阅读免费、无需登录。PRO 付的是离线包下载，以及整库 Agent 入口 SKILL.md；另含无限收藏、同步与导出。",
          },
          {
            q: "免费 Skill 和 PRO 的 SKILL.md 有什么区别？",
            a: "免费 Skill（/buildhub-skill）只做术语补全。PRO 的 SKILL.md 是整库离线包的入口，指向概念、提示词、技能、路径等全部材料。",
          },
          {
            q: "内容会更新吗？",
            a: "会。新内容记在更新日志里；PRO 用户重新下载离线包即可拿到最新版。",
          },
          {
            q: "英文内容一样多吗？",
            a: `英文站目前有 ${counts.dictEn} 个词条；中文站有 ${counts.dictZh} 个，覆盖更深。`,
          },
          {
            q: "可以把内容用在自己的项目里吗？",
            a: "可以。示例和提示词可自由用于个人与商用项目；注明来源更好。不要整站转载或转售离线包。",
          },
          {
            q: "找不到想要的概念怎么办？",
            a: "用顶部搜索（⌘K）；没有的话发邮件告诉我们。",
          },
        ]
      : [
          {
            q: "What is BuildHub?",
            a: "A library for building software: concepts, UI references, stack picks, prompts, skills and paths. Full text, ready for you and your agent.",
          },
          {
            q: "Do I need to know how to code?",
            a: "No. Concepts are clear and each page has a runnable demo. When you build, paste a prompt into any AI tool.",
          },
          {
            q: "How is this different from a tutorial site?",
            a: "Not a course pile. One page per concept: what it is, when to use it, how to check it. The demo stays on the page.",
          },
          {
            q: "Do I have to pay to read?",
            a: "No. Reading is free without an account. PRO is the offline pack plus the library SKILL.md for your agent, with unlimited favorites, sync and export.",
          },
          {
            q: "Free skill vs PRO SKILL.md?",
            a: "The free skill (/buildhub-skill) only helps with terminology. The PRO SKILL.md is the entry to the full offline library — concepts, prompts, skills and paths.",
          },
          {
            q: "Does the content get updated?",
            a: "Yes. Changes land in the changelog; PRO users re-download the pack for the latest version.",
          },
          {
            q: "Is the English site as complete?",
            a: `English has ${counts.dictEn} entries; Chinese has ${counts.dictZh} and goes deeper.`,
          },
          {
            q: "Can I use the content in my projects?",
            a: "Yes, for personal and commercial work. Crediting BuildHub is appreciated. Do not republish the site or resell the pack.",
          },
          {
            q: "What if I can't find a concept?",
            a: "Search with ⌘K. If it's missing, email us.",
          },
        ],
    finalTitleA: zh ? "下一版产品，" : "Your next launch",
    finalGrad: zh ? "不必从空白页开始。" : "doesn't need a blank page.",
    finalSub: zh
      ? "概念、界面参考、提示词和技能都在站里。选一个入口开始。"
      : "Concepts, UI references, prompts and skills are here. Pick an entry and start.",
    finalCta: zh ? "从第一个官网开始" : "Start your first site",
    finalAlt: zh ? "浏览全部概念" : "Browse all concepts",
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
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const rootRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  const zones = zoneChips.slice(0, showcase.length);
  const activeZone = zones[activeBlock] ?? zones[0];
  const block = showcase[activeBlock] ?? showcase[0];
  const plans = C.plans;

  useEffect(() => {
    try {
      if (window.localStorage.getItem(COLOR_MODE_KEY) === "light") setIsLight(true);
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
    const next = !isLight;
    setIsLight(next);
    document.documentElement.dataset.colorMode = next ? "light" : "dark";
    try {
      window.localStorage.setItem(COLOR_MODE_KEY, next ? "light" : "dark");
    } catch {
      /* storage may be unavailable */
    }
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

        {/* ============ PRICING ============ */}
        <section className="rb-section rb-pricing-section">
          <div className="rb-container">
            <div className="rb-pricing-head rb-reveal">
              <div>
                <h2>{C.pricingTitleA}</h2>
                <p>{C.pricingSub}</p>
              </div>
            </div>

            <div className="rb-plans rb-plans-2 rb-reveal">
              {plans.map((plan) => (
                <div
                  className={`rb-plan${plan.featured ? " is-featured" : ""}`}
                  key={plan.name}
                >
                  <div className="rb-plan-top">
                    <h3>{plan.name}</h3>
                    {plan.featured ? (
                      <span className="rb-plan-tag">{C.pricingFeatured}</span>
                    ) : null}
                  </div>
                  <p className="rb-plan-tagline">{plan.tagline}</p>
                  <div className="rb-plan-price">
                    <b>{plan.price}</b>
                    {plan.priceUnit ? (
                      <span className="rb-plan-price-unit">{plan.priceUnit}</span>
                    ) : null}
                    {plan.priceNote ? <span className="rb-plan-price-note">{plan.priceNote}</span> : null}
                  </div>
                  <ul>
                    {plan.features.map((feature) => (
                      <li key={feature}>
                        <Check size={14} strokeWidth={2} aria-hidden />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  {plan.openPro ? (
                    <button
                      type="button"
                      className={`rb-btn rb-btn-plan${plan.featured ? " rb-btn-solid" : " rb-btn-ghost"}`}
                      onClick={() => {
                        track("go_pro_click", { from: "home" });
                        openProModal();
                      }}
                    >
                      {plan.cta}
                      <ArrowRight size={14} strokeWidth={1.9} aria-hidden />
                    </button>
                  ) : (
                    <Link
                      className={`rb-btn rb-btn-plan${plan.featured ? " rb-btn-solid" : " rb-btn-ghost"}`}
                      href={plan.href}
                    >
                      {plan.cta}
                      <ArrowRight size={14} strokeWidth={1.9} aria-hidden />
                    </Link>
                  )}
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
