"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Bot,
  Boxes,
  Check,
  ChevronDown,
  Download,
  FileText,
  Layers,
  Palette,
  RefreshCw,
  Route,
  ShieldCheck,
  Sparkles,
  Terminal,
  Wand2,
} from "lucide-react";
import ProModal from "./ProModal";
import { PLANS } from "@/lib/plans";
import { packStats } from "@/lib/export-content";
import { track } from "@/lib/track";
import "./ProPageView.css";

type Locale = "zh" | "en";

const SZH = packStats("zh");
const SEN = packStats("en");

type Me = {
  user: { email: string; proUntil: string | null } | null;
  pro: boolean;
};

const COPY = {
  zh: {
    eyebrow: "BuildHub PRO · 离线包 + 给 AI 的入口文件",
    h1a: "把站里的内容，",
    h1b: "变成能用的资产。",
    lead: `${SZH.concepts} 条概念、${SZH.prompts} 条提示词、${SZH.skills} 个技能、${SZH.designRefs} 条设计参考、${SZH.paths} 条路径和 ${SZH.playbooks} 本手册，整理成一份 Markdown 离线包，外加一份给 AI 读的 SKILL.md。`,
    ctaPlans: "查看套餐",
    ctaSample: "下载免费样例",
    ctaDownload: "下载完整离线包",
    ctaKit: "下载 SKILL.md",
    trusted: "站内阅读不要钱 · 下载与同步属于 PRO",
    stats: [
      { n: `${SZH.concepts}`, l: "概念词条" },
      { n: `${SZH.prompts + SZH.skills}`, l: "提示词与技能" },
      { n: `${SZH.designRefs}`, l: "设计参考" },
      { n: `${SZH.paths + SZH.playbooks}`, l: "路径与手册" },
    ],
    windowFile: "buildhub-library-日期.md",
    windowTree: [
      "# BuildHub PRO 离线包",
      "├─ SKILL.md        给 AI 的入口",
      `├─ 一、提示词      ${SZH.prompts}`,
      `├─ 二、技能        ${SZH.skills}`,
      `├─ 三、设计参考    ${SZH.designRefs}`,
      `├─ 四、路径        ${SZH.paths}`,
      `├─ 五、手册        ${SZH.playbooks}`,
      `├─ 六、专题        ${SZH.explainers}`,
      `└─ 七、概念索引    ${SZH.concepts}`,
    ],
    windowCode: [
      "---",
      "name: buildhub",
      "description: 把想法做成可上线产品的内容索引",
      "---",
      "",
      "# BuildHub",
      "",
      "## 先读这里",
      "- 做官网    → 四、路径 · 做出第一个产品官网",
      "- 装工作流  → 四、路径 · 给 AI 装一套工作流",
      "- 调界面    → 四、路径 · 把界面做出质感",
      "- 做 AI 应用 → 四、路径 · 做出第一个 AI 应用",
      "",
      "## 约定",
      "- 每条提示词都是完整正文，不截断",
      "- 每条设计参考都带可点开的界面参考",
      "- 每一步都写清「完成标志」",
    ],
    valueKicker: "为什么值得买",
    valueTitle: "不是链接合集，是一套能开工的底稿。",
    valueSub: "你花钱买的不是「知道去哪看」，而是已经整理好、可以直接交给 AI 的正文。",
    values: [
      {
        icon: "bot",
        title: "一份给 AI 的说明书",
        body: "SKILL.md 让 Cursor、Claude Code、Codex 先读懂你的项目，再动手。你少解释一遍，它少猜一轮。",
      },
      {
        icon: "file",
        title: "不是链接合集",
        body: "提示词全文、技能说明、设计案例、完成标志，全部是正文，不是一句「详见原文」。",
      },
      {
        icon: "book",
        title: "中文优先",
        body: "写给非工程师看的解释，不搬运英文文档。看得懂，才用得上。",
      },
      {
        icon: "layers",
        title: "按任务组织",
        body: "做官网、装工作流、调界面、做 AI 应用，四条路径各有入口，不用从目录里自己拼。",
      },
      {
        icon: "terminal",
        title: "纯 Markdown",
        body: "放进 Obsidian、Notion 或代码仓库都能读。想改规则、加模板，直接编辑。",
      },
      {
        icon: "refresh",
        title: "持续更新",
        body: "站里新增的概念、提示词和手册会同步进离线包，不用重新买。",
      },
    ],
    insideKicker: "离线包里有什么",
    insideTitle: "六个部分，拼成一套完整的工作底稿。",
    insideSub:
      "下载后是一个 Markdown 文件，按提示词、技能、设计参考、路径、手册、专题、概念索引分章节；开头那份 SKILL.md 是给 AI 读的入口。",
    inside: [
      {
        icon: "book",
        n: `${SZH.concepts}`,
        unit: "条",
        title: "概念图鉴",
        body: "前端、后端、AI、Git、测试、产品。每条带定义、例子、常见误区和延伸阅读。",
      },
      {
        icon: "wand",
        n: `${SZH.prompts}`,
        unit: "条 / 7 类",
        title: "提示词包",
        body: "说清需求、生成代码、调试报错、优化重构、加功能、部署上线，全文可复制。",
      },
      {
        icon: "boxes",
        n: `${SZH.skills}`,
        unit: "个 / 8 类",
        title: "技能包",
        body: "元技能、工程工作流、设计与前端、图像生成、移动开发、文档处理、浏览器自动化。",
      },
      {
        icon: "palette",
        n: `${SZH.designRefs}`,
        unit: "条 / 3 类",
        title: "设计参考",
        body: "网页风格、App 图标风格、图标库；每个风格都配可点开的界面参考，图标风格另附 AI 生图提示词。",
      },
      {
        icon: "route",
        n: `${SZH.paths} + ${SZH.playbooks} + ${SZH.explainers}`,
        unit: "条路径 / 本手册 / 篇专题",
        title: "路径、手册与专题",
        body: "从第一个官网到第一个 AI 应用，每一步都写清为什么做、做完是什么样。",
      },
      {
        icon: "sparkles",
        n: "1",
        unit: "份",
        title: "SKILL.md",
        body: "给 AI 的入口文件：哪里有什么、按任务先读哪一节、有哪些约定。装进去，它按你的方式找资料。",
      },
    ],
    kitKicker: "给 AI 的入口文件",
    kitTitle: "让 AI 先读懂，再动手。",
    kitLead:
      "装一份 SKILL.md，AI 就知道去哪里找提示词、技能、设计参考和路径。它先把目标问清楚再写代码，返工少一半。",
    kitPoints: [
      { title: "一份入口", body: "SKILL.md 写清哪里有什么、怎么用，AI 不用你每次重复背景。" },
      { title: "按任务路由", body: "做官网、装工作流、调界面、做 AI 应用，各有对应章节和步骤。" },
      { title: "可改可扩", body: "纯 Markdown，规则、模板、项目约定都能自己加。" },
    ],
    kitTools: ["Cursor", "Claude Code", "Codex CLI", "Gemini CLI", "Obsidian"],
    kitCtaPro: "下载 SKILL.md",
    kitCtaFree: "开通后下载",
    previewKicker: "包里长什么样",
    previewTitle: "不是目录，是能用的正文。",
    previewSub: "下面都是从离线包里直接抽出来的原文。",
    previews: [
      {
        file: "离线包 · 一、提示词",
        tag: "提示词",
        title: "把模糊想法变成需求文档",
        body: "你是我的产品搭档。我要做一个东西，但现在只有一个模糊的想法。请不要直接给方案，先帮我把它变成一份能开工的需求文档……",
        meta: "含「这一版不做什么」的固定提问",
      },
      {
        file: "离线包 · 二、技能",
        tag: "技能",
        title: "find-skills",
        body: "告诉 AI「我想做 X」，它会去技能目录里搜出对应的 Skill，给出安装命令、等你确认后再装进当前项目。",
        meta: "含安装命令与适用场景",
      },
      {
        file: "离线包 · 三、设计参考",
        tag: "设计",
        title: "纯色底中心符号",
        body: "整体只有一种底色和一个高对比符号，没有渐变、没有文字。在 App Store 一屏几十个图标中间，0.1 秒就能被读完。",
        meta: "附完整 AI 生图提示词与真实案例",
      },
      {
        file: "离线包 · 四、路径",
        tag: "路径",
        title: "做出第一个产品官网",
        body: "第 1 步：把想法说清楚，再动手。大部分返工不是 AI 不会写，是开工前没人定「给谁、解决什么、这一版不做什么」。",
        meta: "9 步，每一步都有完成标志",
      },
    ],
    useKicker: "适合谁",
    useTitle: "从第一个官网，到第一个 AI 应用。",
    useSub: `四条路径对应四种常见起点，离线包把每条路径要用的材料都放在一起。`,
    cases: [
      { id: "first-website", name: "做出第一个产品官网", desc: "从一句模糊想法，到有域名、能留联系方式、别人点开就能看懂的网站。", steps: "9 步" },
      { id: "agent-workflow", name: "给 AI 装一套工作流", desc: "让 AI 从一问一答，变成先想清楚、再计划、动手、自检的固定流程。", steps: "7 步" },
      { id: "ui-quality", name: "把界面做出质感", desc: "不靠换模板，从参考、规则、状态到验收，把页面推到像正经产品。", steps: "7 步" },
      { id: "first-ai-app", name: "做出第一个 AI 应用", desc: "接上模型，让它能回答、能查你的资料，最后变成别人打开链接就能用的小工具。", steps: "8 步" },
    ],
    pricingKicker: "定价",
    pricingTitle: "一次开通，整套拿走。",
    pricingSub: "站内阅读永远免费。PRO 管的是下载、跨设备同步和持续更新。",
    perMonth: "/ 月",
    perYear: "/ 年",
    once: "一次买断",
    planNotes: {
      monthly: "先试一个月",
      yearly: "平均 ¥4.8 / 月",
      lifetime: "不再续费",
    },
    planNames: { monthly: "月卡", yearly: "年卡", lifetime: "终身买断" },
    planFeatures: {
      monthly: ["完整离线包下载", "给 AI 的 SKILL.md", "收藏同步与导出", "一个月内的更新"],
      yearly: ["完整离线包下载", "给 AI 的 SKILL.md", "收藏同步与导出", "一年内的更新", "平均 ¥4.8 / 月"],
      lifetime: ["完整离线包下载", "给 AI 的 SKILL.md", "收藏同步与导出", "永久更新", "后续新增内容不要钱"],
    },
    planCta: { monthly: "开通月卡", yearly: "开通年卡", lifetime: "买断终身" },
    recommended: "买断",
    freeNote: "不要钱：站内全部内容随便看 · PRO：下载离线包、同步收藏、持续更新",
    activeKicker: "已开通",
    activeHeading: "整套东西，现在归你。",
    activeTitle: "你已经是 PRO 会员",
    activeSub: "离线包和 SKILL.md 可以直接下载；站内新增内容会同步进包。",
    faqKicker: "常见问题",
    faqTitle: "买之前，先把这些说清楚。",
    faqs: [
      {
        q: "离线包里到底有什么？",
        a: `一个 Markdown 文件，分七章：${SZH.concepts} 条概念、${SZH.prompts} 条提示词、${SZH.skills} 个技能、${SZH.designRefs} 条设计参考、${SZH.paths} 条路径、${SZH.playbooks} 本手册、${SZH.explainers} 篇专题，开头另有一份给 AI 读的 SKILL.md。每条都是正文，不是链接合集。`,
      },
      {
        q: "下载是什么格式？",
        a: "Markdown（.md）。用 Obsidian、Notion、VS Code 或任何编辑器都能打开；那份 SKILL.md 可以直接放进项目或 AI 工具的技能目录。",
      },
      {
        q: "能商用吗？",
        a: "可以。离线包用于自己的产品、客户项目和个人学习都没问题；不要把整包重新分发、转卖，或做成同类的公开资料库。",
      },
      {
        q: "是订阅还是一次买断？",
        a: "月卡和年卡是按期开通，到期后不再扣费；终身买断付一次，后续更新一直包含。三种都可以随时停止续费，站内阅读不要钱。",
      },
      {
        q: "开通后在哪里下载？",
        a: "开通成功后，这个页面和账号页都会出现下载入口；微信支付到账后自动开通，不用回来刷新。",
      },
      {
        q: "后续更新怎么拿到？",
        a: "直接重新下载最新版离线包即可，文件名带日期。新增的概念、提示词、技能和手册都会同步进去。",
      },
      {
        q: "那份 SKILL.md 支持哪些工具？",
        a: "它是标准 Markdown 技能文件，Cursor、Claude Code、Codex CLI、Gemini CLI 以及 Obsidian 都能读；不同工具的安装位置略有差异，包里附了说明。",
      },
      {
        q: "可以退款吗？",
        a: "数字内容下载后不支持无理由退款；如果是重复支付、支付成功但未开通，或内容与描述明显不符，看退款与售后说明联系我们处理。",
      },
    ],
    faqRefund: "退款与售后",
    finalTitle: "下一版，不用从空白开始。",
    finalLead: "把已经整理好的概念、提示词、技能、设计和路径交给 AI，先站到起跑线前面。",
    finalCta: "查看套餐",
    loadError: "登录状态读取失败，价格与下载入口仍然可用。",
  },
  en: {
    eyebrow: "BuildHub PRO · the pack + a SKILL.md for your agent",
    h1a: "Everything you learn here,",
    h1b: "yours to keep.",
    lead: `${SEN.concepts} concepts, ${SEN.prompts} prompts, ${SEN.skills} skills, ${SEN.designRefs} design references, ${SEN.paths} paths and ${SEN.playbooks} playbooks — one Markdown file you can hand straight to an AI, with a SKILL.md entry at the top.`,
    ctaPlans: "See plans",
    ctaSample: "Download free sample",
    ctaDownload: "Download the pack",
    ctaKit: "Download SKILL.md",
    trusted: "Reading stays free · downloads and sync are PRO",
    stats: [
      { n: `${SEN.concepts}`, l: "concepts" },
      { n: `${SEN.prompts + SEN.skills}`, l: "prompts & skills" },
      { n: `${SEN.designRefs}`, l: "design refs" },
      { n: `${SEN.paths + SEN.playbooks}`, l: "paths & playbooks" },
    ],
    windowFile: "buildhub-library-<date>.md",
    windowTree: [
      "# BuildHub PRO pack",
      "├─ SKILL.md        agent entry",
      `├─ 1. Prompts      ${SEN.prompts}`,
      `├─ 2. Skills       ${SEN.skills}`,
      `├─ 3. Design refs  ${SEN.designRefs}`,
      `├─ 4. Paths        ${SEN.paths}`,
      `├─ 5. Playbooks    ${SEN.playbooks}`,
      `├─ 6. Stories      ${SEN.explainers}`,
      `└─ 7. Concepts     ${SEN.concepts}`,
    ],
    windowCode: [
      "---",
      "name: buildhub",
      "description: Content index for shipping a real product",
      "---",
      "",
      "# BuildHub",
      "",
      "## Start here",
      "- First website  → 4. Paths · first website",
      "- Agent workflow → 4. Paths · agent workflow",
      "- Better UI      → 4. Paths · UI quality",
      "- First AI app   → 4. Paths · first AI app",
      "",
      "## Conventions",
      "- Every prompt is the full text, never truncated",
      "- Every design ref links to a live sample",
      "- Every step states its definition of done",
    ],
    valueKicker: "Why buy",
    valueTitle: "Not a link dump. A set of drafts you can start from.",
    valueSub: "You are not paying for pointers. You are paying for the finished text, ready to hand to an AI.",
    values: [
      {
        icon: "bot",
        title: "An instruction manual for your agent",
        body: "SKILL.md teaches Cursor, Claude Code and Codex what your project is before they touch it. Less explaining, fewer wrong turns.",
      },
      {
        icon: "file",
        title: "Full text, not links",
        body: "Complete prompts, skill write-ups, design cases and definitions of done. No 'see the original' dead ends.",
      },
      {
        icon: "book",
        title: "Written in plain language",
        body: "Explained for people who do not write code all day. Understandable first, useful second.",
      },
      {
        icon: "layers",
        title: "Organised by task",
        body: "Website, workflow, UI quality, AI app — four entry points instead of one giant folder.",
      },
      {
        icon: "terminal",
        title: "Plain Markdown",
        body: "Reads anywhere: Obsidian, Notion, or your repo. Edit the rules and templates directly.",
      },
      {
        icon: "refresh",
        title: "Kept up to date",
        body: "New concepts, prompts and playbooks are added to the pack. No re-purchase.",
      },
    ],
    insideKicker: "What is inside",
    insideTitle: "Six parts that make one working draft.",
    insideSub: "The download is one Markdown file with seven sections. SKILL.md sits at the top for your agent.",
    inside: [
      {
        icon: "book",
        n: `${SEN.concepts}`,
        unit: "entries",
        title: "Concept library",
        body: "Frontend, backend, AI, Git, testing, product. Definitions, examples, common traps and further reading.",
      },
      {
        icon: "wand",
        n: `${SEN.prompts}`,
        unit: "prompts / 7 groups",
        title: "Prompt pack",
        body: "Clarify a request, generate code, debug, refactor, add features, deploy. Copy-ready.",
      },
      {
        icon: "boxes",
        n: `${SEN.skills}`,
        unit: "skills / 8 groups",
        title: "Skill pack",
        body: "Meta skills, engineering workflows, design and frontend, image generation, mobile, docs, browser automation.",
      },
      {
        icon: "palette",
        n: `${SEN.designRefs}`,
        unit: "refs / 3 groups",
        title: "Design references",
        body: "Web styles, app icon styles and icon libraries; every style has a live sample, and icon styles ship an AI image prompt.",
      },
      {
        icon: "route",
        n: `${SEN.paths} + ${SEN.playbooks} + ${SEN.explainers}`,
        unit: "paths / playbooks / stories",
        title: "Paths, playbooks & stories",
        body: "From the first website to the first AI app, with the reason and the finish line for every step.",
      },
      {
        icon: "sparkles",
        n: "1",
        unit: "file",
        title: "SKILL.md",
        body: "The entry file for your agent: what is where, what to read per task, which rules to follow.",
      },
    ],
    kitKicker: "The SKILL.md entry file",
    kitTitle: "Let the agent understand first.",
    kitLead:
      "Install one SKILL.md and your agent knows where the prompts, skills, design references and paths live. It asks what you mean before it writes, so you rewrite less.",
    kitPoints: [
      { title: "One entry point", body: "SKILL.md says what is in the pack and how to use it. No repeated briefing." },
      { title: "Routed by task", body: "Website, workflow, UI, AI app — each has its own section and steps." },
      { title: "Editable by design", body: "Plain Markdown. Add your own rules, templates and project conventions." },
    ],
    kitTools: ["Cursor", "Claude Code", "Codex CLI", "Gemini CLI", "Obsidian"],
    kitCtaPro: "Download SKILL.md",
    kitCtaFree: "Included with PRO",
    previewKicker: "What it looks like",
    previewTitle: "Finished text, not a table of contents.",
    previewSub: "These excerpts are pulled straight from the pack.",
    previews: [
      {
        file: "pack · 1. Prompts",
        tag: "Prompt",
        title: "Turn a fuzzy idea into a spec",
        body: "You are my product partner. I want to build something, but right now it is only a fuzzy idea. Do not give me a solution yet; turn it into a spec I can start from…",
        meta: "Includes the fixed 'what this version will not do' question",
      },
      {
        file: "pack · 2. Skills",
        tag: "Skill",
        title: "find-skills",
        body: "Tell the agent what you want to build and it searches the skill directory, shows the install command, waits for your confirmation, then installs it.",
        meta: "Ships with install command and use cases",
      },
      {
        file: "pack · 3. Design references",
        tag: "Design",
        title: "Solid glyph",
        body: "One flat background and one high-contrast symbol. No gradients, no text. In a home screen full of icons, it reads in a tenth of a second.",
        meta: "Full AI image prompt and real cases included",
      },
      {
        file: "pack · 4. Paths",
        tag: "Path",
        title: "Ship your first product site",
        body: "Step 1: define the idea before you build. Most rework is not the AI failing; it is nobody deciding who it is for and what this version will not do.",
        meta: "9 steps, each with a definition of done",
      },
    ],
    useKicker: "Who it is for",
    useTitle: "From the first site to the first AI app.",
    useSub: "Four paths for four common starting points. The pack keeps every path's material together.",
    cases: [
      { id: "first-website", name: "Ship your first product site", desc: "From a fuzzy idea to a site with a domain, a contact form and a clear message.", steps: "9 steps" },
      { id: "agent-workflow", name: "Give your AI a workflow", desc: "Move from one-shot answers to a loop of thinking, planning, acting and checking.", steps: "7 steps" },
      { id: "ui-quality", name: "Make the UI feel real", desc: "Not another template: references, rules, states and review, until it feels shipped.", steps: "7 steps" },
      { id: "first-ai-app", name: "Ship your first AI app", desc: "Connect a model, let it answer from your own material, and turn it into a shareable tool.", steps: "8 steps" },
    ],
    pricingKicker: "Pricing",
    pricingTitle: "Pay once. Take the whole thing.",
    pricingSub: "Reading stays free. PRO covers downloads, cross-device sync and updates.",
    perMonth: "/ mo",
    perYear: "/ yr",
    once: "one-time",
    planNotes: {
      monthly: "Try it for a month",
      yearly: "About ¥4.8 / mo",
      lifetime: "No renewals",
    },
    planNames: { monthly: "Monthly", yearly: "Yearly", lifetime: "Lifetime" },
    planFeatures: {
      monthly: ["Full pack download", "SKILL.md for your agent", "Favorites sync & export", "One month of updates"],
      yearly: ["Full pack download", "SKILL.md for your agent", "Favorites sync & export", "One year of updates", "About ¥4.8 / mo"],
      lifetime: ["Full pack download", "SKILL.md for your agent", "Favorites sync & export", "Lifetime updates", "Every future addition included"],
    },
    planCta: { monthly: "Get monthly", yearly: "Get yearly", lifetime: "Buy lifetime" },
    recommended: "Lifetime",
    freeNote: "Free: read everything on the site · PRO: download the pack, sync favorites, keep updates",
    activeKicker: "Active",
    activeHeading: "The whole pack is yours.",
    activeTitle: "You are already PRO",
    activeSub: "Download the pack and SKILL.md right here. New site content is added to the pack.",
    faqKicker: "FAQ",
    faqTitle: "The details, before you buy.",
    faqs: [
      {
        q: "What exactly is in the pack?",
        a: `One Markdown file, seven sections: ${SEN.concepts} concepts, ${SEN.prompts} prompts, ${SEN.skills} skills, ${SEN.designRefs} design references, ${SEN.paths} paths, ${SEN.playbooks} playbooks and ${SEN.explainers} stories, opened by a SKILL.md entry for your agent. Full text, not a link list.`,
      },
      {
        q: "What format is the download?",
        a: "Markdown (.md), readable in Obsidian, Notion, VS Code or any editor. The SKILL.md entry can go straight into your project or your agent's skills directory.",
      },
      {
        q: "Can I use it commercially?",
        a: "Yes — in your own products, client work and personal learning. Please do not redistribute or resell the pack as a whole, or republish it as a competing library.",
      },
      {
        q: "Is this a subscription or a one-time purchase?",
        a: "Monthly and yearly are time-limited and do not auto-renew; lifetime is paid once and includes future updates. All three can be stopped at any time, and reading stays free.",
      },
      {
        q: "Where do I download after paying?",
        a: "Once payment settles, download links appear on this page and in your account. WeChat Pay activates the account automatically — no refresh needed.",
      },
      {
        q: "How do I get updates?",
        a: "Download the latest pack again; the filename carries the date. New concepts, prompts, skills and playbooks are folded in.",
      },
      {
        q: "Which tools does SKILL.md work with?",
        a: "It is a standard Markdown skill file, readable by Cursor, Claude Code, Codex CLI, Gemini CLI and Obsidian. Install locations differ slightly; the pack includes notes.",
      },
      {
        q: "Can I get a refund?",
        a: "Digital downloads are non-refundable once received. For duplicate payments, paid-but-not-activated issues, or content that clearly differs from the description, see the refunds page and contact us.",
      },
    ],
    faqRefund: "Refunds",
    finalTitle: "The next version does not start blank.",
    finalLead: "Hand the agent the concepts, prompts, skills, design references and paths that are already organised. Start ahead.",
    finalCta: "See plans",
    loadError: "Could not read your account state; pricing and downloads still work.",
  },
} as const;

const ICONS = {
  bot: Bot,
  file: FileText,
  book: BookOpen,
  layers: Layers,
  terminal: Terminal,
  refresh: RefreshCw,
  wand: Wand2,
  boxes: Boxes,
  palette: Palette,
  route: Route,
  sparkles: Sparkles,
} as const;

function money(m: string): string {
  return m.replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
}

const PLAN_UNIT: Record<string, "perMonth" | "perYear" | "once"> = {
  monthly: "perMonth",
  yearly: "perYear",
  lifetime: "once",
};

export default function ProPageView({ locale }: { locale: Locale }) {
  const C = COPY[locale];
  const base = locale === "en" ? "/en" : "";
  const [me, setMe] = useState<Me | null>(null);
  const [plan, setPlan] = useState<string | null>(null);

  useEffect(() => {
    const load = () =>
      fetch("/api/me")
        .then((r) => r.json())
        .then((d: Me) => setMe(d))
        .catch(() => {});
    load();
    window.addEventListener("vh-me-changed", load);
    return () => window.removeEventListener("vh-me-changed", load);
  }, []);

  const isPro = !!me?.pro;

  function openCheckout(key: string) {
    track("pro_page_checkout", { plan: key });
    setPlan(key);
  }

  const sampleHref = `/api/export?kind=sample&locale=${locale}`;
  const packHref = `/api/export?kind=library&locale=${locale}`;
  const kitHref = `/api/export?kind=agent-kit&locale=${locale}`;

  return (
    <main className="pro-page">
      <section className="pp-hero">
        <div className="pp-hero-bg" aria-hidden>
          <span className="pp-glow pp-glow-a" />
          <span className="pp-glow pp-glow-b" />
          <span className="pp-grid" />
        </div>
        <div className="pp-wrap">
          <span className="pp-eyebrow">
            <Sparkles size={14} aria-hidden /> {C.eyebrow}
          </span>
          <h1 className="pp-h1">
            {C.h1a}
            <span className="pp-grad">{C.h1b}</span>
          </h1>
          <p className="pp-lead">{C.lead}</p>
          <div className="pp-ctas">
            {isPro ? (
              <a className="pp-btn pp-btn-solid" href={packHref}>
                <Download size={16} aria-hidden /> {C.ctaDownload}
              </a>
            ) : (
              <a className="pp-btn pp-btn-solid" href="#pricing">
                {C.ctaPlans} <ArrowRight size={16} aria-hidden />
              </a>
            )}
            <a className="pp-btn pp-btn-ghost" href={sampleHref}>
              <FileText size={16} aria-hidden /> {C.ctaSample}
            </a>
          </div>
          <p className="pp-trust">{C.trusted}</p>
          <div className="pp-stats">
            {C.stats.map((s) => (
              <div key={s.l} className="pp-stat">
                <b>{s.n}</b>
                <span>{s.l}</span>
              </div>
            ))}
          </div>

          <div className="pp-window">
            <div className="pp-window-bar">
              <span className="pp-dot pp-dot-r" />
              <span className="pp-dot pp-dot-y" />
              <span className="pp-dot pp-dot-g" />
              <span className="pp-window-name">{C.windowFile}</span>
            </div>
            <div className="pp-window-body">
              <pre className="pp-tree">{C.windowTree.join("\n")}</pre>
              <pre className="pp-code">{C.windowCode.join("\n")}</pre>
            </div>
          </div>
        </div>
      </section>

      <section className="pp-section">
        <div className="pp-wrap">
          <div className="pp-head">
            <span className="pp-kicker">{C.valueKicker}</span>
            <h2>{C.valueTitle}</h2>
            <p>{C.valueSub}</p>
          </div>
          <div className="pp-value-grid">
            {C.values.map((v) => {
              const Icon = ICONS[v.icon as keyof typeof ICONS];
              return (
                <article key={v.title} className="pp-card pp-value">
                  <span className="pp-icon">
                    <Icon size={18} aria-hidden />
                  </span>
                  <h3>{v.title}</h3>
                  <p>{v.body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="pp-section pp-section-alt">
        <div className="pp-wrap">
          <div className="pp-head">
            <span className="pp-kicker">{C.insideKicker}</span>
            <h2>{C.insideTitle}</h2>
            <p>{C.insideSub}</p>
          </div>
          <div className="pp-inside-grid">
            {C.inside.map((it) => {
              const Icon = ICONS[it.icon as keyof typeof ICONS];
              return (
                <article key={it.title} className="pp-card pp-inside">
                  <div className="pp-inside-top">
                    <span className="pp-icon">
                      <Icon size={18} aria-hidden />
                    </span>
                    <span className="pp-count">
                      <b>{it.n}</b> {it.unit}
                    </span>
                  </div>
                  <h3>{it.title}</h3>
                  <p>{it.body}</p>
                  <Check size={15} className="pp-check" aria-hidden />
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="pp-section">
        <div className="pp-wrap pp-kit">
          <div className="pp-kit-copy">
            <span className="pp-kicker">{C.kitKicker}</span>
            <h2>{C.kitTitle}</h2>
            <p className="pp-kit-lead">{C.kitLead}</p>
            <ul className="pp-kit-points">
              {C.kitPoints.map((p) => (
                <li key={p.title}>
                  <Check size={15} aria-hidden />
                  <div>
                    <b>{p.title}</b>
                    <span>{p.body}</span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="pp-tools">
              {C.kitTools.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
            {isPro ? (
              <a className="pp-btn pp-btn-solid" href={kitHref}>
                <Download size={16} aria-hidden /> {C.kitCtaPro}
              </a>
            ) : (
              <button className="pp-btn pp-btn-ghost" onClick={() => openCheckout("yearly")}>
                <Sparkles size={16} aria-hidden /> {C.kitCtaFree}
              </button>
            )}
          </div>
          <div className="pp-window pp-kit-window">
            <div className="pp-window-bar">
              <span className="pp-dot pp-dot-r" />
              <span className="pp-dot pp-dot-y" />
              <span className="pp-dot pp-dot-g" />
              <span className="pp-window-name">SKILL.md</span>
            </div>
            <pre className="pp-code pp-kit-code">{C.windowCode.join("\n")}</pre>
          </div>
        </div>
      </section>

      <section className="pp-section pp-section-alt">
        <div className="pp-wrap">
          <div className="pp-head">
            <span className="pp-kicker">{C.previewKicker}</span>
            <h2>{C.previewTitle}</h2>
            <p>{C.previewSub}</p>
          </div>
          <div className="pp-preview-grid">
            {C.previews.map((p) => (
              <article key={p.file} className="pp-file">
                <div className="pp-file-bar">
                  <FileText size={14} aria-hidden />
                  <code>{p.file}</code>
                  <span className="pp-file-tag">{p.tag}</span>
                </div>
                <div className="pp-file-body">
                  <h3>{p.title}</h3>
                  <p>{p.body}</p>
                  <span className="pp-file-meta">{p.meta}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="pp-section">
        <div className="pp-wrap">
          <div className="pp-head">
            <span className="pp-kicker">{C.useKicker}</span>
            <h2>{C.useTitle}</h2>
            <p>{C.useSub}</p>
          </div>
          <div className="pp-case-grid">
            {C.cases.map((c) => (
              <Link key={c.id} href={`${base}/paths/${c.id}`} className="pp-card pp-case">
                <span className="pp-case-steps">{c.steps}</span>
                <h3>{c.name}</h3>
                <p>{c.desc}</p>
                <span className="pp-case-link">
                  {locale === "en" ? "Open path" : "打开路径"} <ArrowRight size={14} aria-hidden />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="pp-section pp-pricing-section" id="pricing">
        <div className="pp-wrap">
          <div className="pp-head pp-head-center">
            <span className="pp-kicker">{isPro ? C.activeKicker : C.pricingKicker}</span>
            <h2>{isPro ? C.activeHeading : C.pricingTitle}</h2>
            <p>{isPro ? C.activeSub : C.pricingSub}</p>
          </div>

          {isPro ? (
            <div className="pp-active">
              <BadgeCheck size={26} aria-hidden />
              <h3>{C.activeTitle}</h3>
              <div className="pp-active-actions">
                <a className="pp-btn pp-btn-solid" href={packHref}>
                  <Download size={16} aria-hidden /> {C.ctaDownload}
                </a>
                <a className="pp-btn pp-btn-ghost" href={kitHref}>
                  <FileText size={16} aria-hidden /> {C.ctaKit}
                </a>
              </div>
            </div>
          ) : (
            <>
              <div className="pp-plans">
                {PLANS.map((p) => {
                  const hot = p.key === "lifetime";
                  return (
                    <article key={p.key} className={`pp-plan${hot ? " is-hot" : ""}`}>
                      {hot && <span className="pp-plan-badge">{C.recommended}</span>}
                      <h3>{C.planNames[p.key as keyof typeof C.planNames]}</h3>
                      <p className="pp-plan-price">
                        <b>¥{money(p.money)}</b>
                        <span>{C[PLAN_UNIT[p.key]]}</span>
                      </p>
                      <p className="pp-plan-note">
                        {C.planNotes[p.key as keyof typeof C.planNotes]}
                      </p>
                      <ul>
                        {C.planFeatures[p.key as keyof typeof C.planFeatures].map((f) => (
                          <li key={f}>
                            <Check size={14} aria-hidden /> {f}
                          </li>
                        ))}
                      </ul>
                      <button
                        className={`pp-btn ${hot ? "pp-btn-solid" : "pp-btn-ghost"} pp-btn-block`}
                        onClick={() => openCheckout(p.key)}
                      >
                        {C.planCta[p.key as keyof typeof C.planCta]}
                      </button>
                    </article>
                  );
                })}
              </div>
              <p className="pp-free-note">
                <ShieldCheck size={15} aria-hidden /> {C.freeNote}
              </p>
            </>
          )}
        </div>
      </section>

      <section className="pp-section pp-section-alt">
        <div className="pp-wrap pp-faq">
          <div className="pp-faq-head">
            <span className="pp-kicker">{C.faqKicker}</span>
            <h2>{C.faqTitle}</h2>
            <a className="pp-faq-link" href={`${base}/refunds`}>
              {C.faqRefund} <ArrowRight size={14} aria-hidden />
            </a>
          </div>
          <div className="pp-faq-list">
            {C.faqs.map((f) => (
              <details key={f.q} className="pp-faq-item">
                <summary>
                  {f.q}
                  <ChevronDown size={18} aria-hidden />
                </summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="pp-final">
        <div className="pp-wrap pp-final-inner">
          <h2>{C.finalTitle}</h2>
          <p>{C.finalLead}</p>
          <div className="pp-ctas pp-ctas-center">
            {isPro ? (
              <a className="pp-btn pp-btn-solid" href={packHref}>
                <Download size={16} aria-hidden /> {C.ctaDownload}
              </a>
            ) : (
              <a className="pp-btn pp-btn-solid" href="#pricing">
                {C.finalCta} <ArrowRight size={16} aria-hidden />
              </a>
            )}
            <a className="pp-btn pp-btn-ghost" href={sampleHref}>
              <FileText size={16} aria-hidden /> {C.ctaSample}
            </a>
          </div>
        </div>
      </section>

      {plan && (
        <ProModal
          locale={locale}
          initialPlan={plan}
          onClose={() => setPlan(null)}
        />
      )}
    </main>
  );
}
