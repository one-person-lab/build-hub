import Link from "next/link";
import CopyBlock from "./CopyBlock";
import zhTerms from "@/data/terms.json";
import enTerms from "@/data/en-terms.json";
import "./BuildHubSkillView.css";

type Entry = {
  slug: string;
  name: string;
  en?: string;
  summaryLead?: string;
  demoHtml?: string;
};

const LISTS: Record<"zh" | "en", Entry[]> = {
  zh: zhTerms as unknown as Entry[],
  en: enTerms as unknown as Entry[],
};

const REPO = "https://github.com/one-person-lab/build-hub";
const CLI = `npx skills add ${REPO} --skill buildhub`;

/** 一句话里的片段：纯文本，或者一个指向站内词条的术语 */
type Part = { text?: string; term?: string; show?: string };

type Copy = {
  label: string;
  title: string;
  sub: string;
  facts: { n: "terms" | "demos"; label: string }[];
  factInstall: string;
  installHint: string;
  installTitle: string;
  installNote: string;
  installPrompt: string;
  copy: string;
  copied: string;
  fail: string;
  orCli: string;
  oneKicker: string;
  oneTitle: string;
  oneDesc: string;
  beforeLabel: string;
  beforeText: string;
  afterLabel: string;
  copyAction: string;
  oneParts: Part[];
  twoKicker: string;
  twoTitle: string;
  twoDesc: string;
  youLabel: string;
  twoPartsYou: Part[];
  agentLabel: string;
  twoPartsAgent: Part[];
  rules: string[];
  demoYou: string;
  demoAgentLead: string;
  demoAgentTail: string;
  demoHint: string;
  demoOpen: string;
  howTitle: string;
  howItems: { h: string; p: string }[];
  howLinks: { href: string; label: string }[];
  howLinksLead: string;
};

const COPY: Record<"zh" | "en", Copy> = {
  zh: {
    label: "BuildHub Skill",
    title: "为 Agent 补全准确的前端术语",
    sub: "安装到 Claude Code、Cursor 等 Agent 后，自动把模糊描述补全为规范术语，主动提示当前任务相关的术语，并链接到带可玩示例的词条页。",
    facts: [
      { n: "terms", label: "个术语词条" },
      { n: "demos", label: "个带可玩示例" },
    ],
    factInstall: "条指令安装",
    installHint: "约一分钟完成安装",
    installTitle: "方式一：复制指令发给 Agent",
    installNote: "Agent 会自动读取仓库并安装 skills/buildhub，无需手动执行命令。",
    installPrompt: "帮我安装这个仓库里的 skills/buildhub Skill。",
    copy: "复制安装指令",
    copied: "已复制",
    fail: "复制失败，请手动选择文本",
    orCli: "方式二：CLI 安装",
    oneKicker: "功能一 · 需求规范化",
    oneTitle: "口语描述改写为可发送的规范需求",
    oneDesc: "只补充必要术语，保留原意；不代替用户选择框架、组件库或参数。",
    beforeLabel: "原始描述",
    beforeText: "这个按钮鼠标放上去变个色，点下去也要有一下反馈。",
    afterLabel: "规范化后",
    copyAction: "复制改写结果",
    oneParts: [
      { text: "为按钮补充 " },
      { term: "hover", show: "Hover" },
      { text: " 状态和 " },
      { term: "active", show: "Active" },
      { text: " 状态，并使用 " },
      { term: "transition", show: "Transition" },
      { text: " 让状态变化更自然。" },
    ],
    twoKicker: "功能二 · 术语主动提示",
    twoTitle: "描述有歧义时，主动提示相关术语",
    twoDesc: "描述存在歧义或缺少准确名词时，选取当前对话中最相关的 1–3 个术语，结合任务给出一句话解释。",
    youLabel: "用户",
    twoPartsYou: [{ text: "这个设置我想改了就马上生效，不想再点一次保存。" }],
    agentLabel: "Agent",
    twoPartsAgent: [
      { text: "这种场景适合 " },
      { term: "switch" },
      { text: "：只有开和关两种状态，修改立即生效。若需要先调整多项再统一确认，则不适用该模式。" },
    ],
    rules: [
      "术语首次出现时链接到 BuildHub 词条",
      "解释结合当前任务，不复述百科定义",
      "单次最多提示 3 个相关术语",
    ],
    demoYou: "鼠标放到这个按钮上时，显示一个小提示，告诉用户它是做什么的。",
    demoAgentLead: "已完成：鼠标悬停或键盘聚焦时显示「下载」。这类短提示称为 ",
    demoAgentTail: "。",
    demoHint: "悬停或按 Tab 聚焦术语，查看词条摘要",
    demoOpen: "打开词条",
    howTitle: "准确性保障",
    howItems: [
      { h: "先推断，再验证", p: "不直接检索原句，先从上下文推断候选术语，再批量匹配站内词条。" },
      { h: "未命中不虚构", p: "只链接 BuildHub 真实存在的词条页；未命中的候选词直接舍弃。" },
      { h: "纯文件，无黑盒", p: "Skill 正文与脚本都是仓库中的普通文件，可读可改，无运行时依赖。" },
    ],
    howLinks: [
      { href: "/skills", label: "技能" },
      { href: "/prompts", label: "提示词" },
      { href: "/design", label: "设计" },
    ],
    howLinksLead: "需要参考实现时：",
  },
  en: {
    label: "BuildHub Skill",
    title: "Accurate frontend terminology for your agent",
    sub: "Install it in Claude Code, Cursor or any agent. It rewrites vague descriptions into precise terms, surfaces task-relevant terminology, and links to entries with live demos.",
    facts: [
      { n: "terms", label: " term entries" },
      { n: "demos", label: " with a live demo" },
    ],
    factInstall: " prompt to install",
    installHint: "About a minute",
    installTitle: "Option 1: send this to your agent",
    installNote: "The agent reads the repository and installs skills/buildhub. No manual commands.",
    installPrompt: "Install the skills/buildhub Skill from this repository.",
    copy: "Copy install prompt",
    copied: "Copied",
    fail: "Copy failed. Select the text manually.",
    orCli: "Option 2: install via CLI",
    oneKicker: "Feature 1 · Request normalization",
    oneTitle: "Rewrite casual descriptions into send-ready requirements",
    oneDesc: "Adds only the terms that matter and keeps your intent. It never picks frameworks, component libraries or parameters for you.",
    beforeLabel: "Original",
    beforeText: "Make this button change colour on hover, and give it some feedback when I press it.",
    afterLabel: "Normalized",
    copyAction: "Copy rewrite",
    oneParts: [
      { text: "Add " },
      { term: "hover", show: "Hover" },
      { text: " and " },
      { term: "active", show: "Active" },
      { text: " states to the button, and use a " },
      { term: "transition", show: "Transition" },
      { text: " so the change feels smooth." },
    ],
    twoKicker: "Feature 2 · Proactive term hints",
    twoTitle: "Surfaces relevant terms when wording is ambiguous",
    twoDesc: "When a description is ambiguous or lacks a precise noun, it picks the 1–3 most relevant terms from the current turn and explains each in one line, in task context.",
    youLabel: "User",
    twoPartsYou: [
      { text: "I want this setting to apply as soon as I change it, without a second click on Save." },
    ],
    agentLabel: "Agent",
    twoPartsAgent: [
      { text: "This calls for a " },
      { term: "switch", show: "Switch" },
      { text: ": two states, on and off, applied immediately. If several fields must be adjusted and confirmed together, this pattern does not apply." },
    ],
    rules: [
      "First mention of a term links to its BuildHub entry",
      "Explanations stay in task context, not dictionary definitions",
      "At most 3 terms per reply",
    ],
    demoYou: "When I hover this button, show a small hint explaining what it does.",
    demoAgentLead: "Done: hovering or keyboard focus now shows Download. This kind of hint is called a ",
    demoAgentTail: ".",
    demoHint: "Hover or Tab to the term to see its entry summary",
    demoOpen: "Open entry",
    howTitle: "Accuracy safeguards",
    howItems: [
      { h: "Infer, then verify", p: "Instead of searching the raw sentence, it infers candidate terms from context and matches them against the site in one pass." },
      { h: "No invented links", p: "Only links to entry pages that exist on BuildHub; unmatched candidates are dropped." },
      { h: "Plain files, no black box", p: "The skill and its script are ordinary repository files. Readable, editable, no runtime dependency." },
    ],
    howLinks: [
      { href: "/en/skills", label: "Skills" },
      { href: "/en/prompts", label: "Prompts" },
      { href: "/en/design", label: "Design" },
    ],
    howLinksLead: "When you need reference implementations:",
  },
};

export default function BuildHubSkillView({ locale = "zh" }: { locale?: "zh" | "en" }) {
  const entries = LISTS[locale];
  const bySlug = new Map(entries.map((e) => [e.slug, e]));
  const base = locale === "en" ? "/en" : "";
  const C = COPY[locale];

  const demoCount = entries.filter((e) => e.demoHtml).length;
  const counts: Record<"terms" | "demos", number> = { terms: entries.length, demos: demoCount };

  /** 词条名：中文站写「文字提示（Tooltip）」，英文站直接写页面标题 */
  function termLabel(slug: string, show?: string) {
    const entry = bySlug.get(slug);
    if (!entry) return show ?? slug;
    if (show) return show;
    return locale === "en" ? entry.name : `${entry.name}（${entry.en ?? entry.name}）`;
  }

  function renderParts(parts: readonly Part[]) {
    return parts.map((part, i) =>
      part.term ? (
        <Link
          key={`${part.term}-${i}`}
          className="bs-term"
          href={`${base}/${part.term}`}
          title={bySlug.get(part.term)?.summaryLead}
        >
          {termLabel(part.term, part.show)}
        </Link>
      ) : (
        <span key={`t${i}`}>{part.text}</span>
      ),
    );
  }

  /** 可复制的纯文本版：术语只留英文名，不带链接 */
  function plain(parts: readonly Part[]) {
    return parts.map((p) => p.text ?? (p.show ?? termLabel(p.term ?? ""))).join("");
  }

  const tooltip = bySlug.get("tooltip");
  const installText = `${REPO}\n\n${C.installPrompt}`;

  return (
    <main className="bs-main">
      <div className="bs-wrap">
        <section className="bs-hero">
          <div className="bs-hero-copy">
            <p className="bs-label">{C.label}</p>
            <h1>{C.title}</h1>
            <p className="bs-sub">{C.sub}</p>
            <ul className="bs-facts">
              {C.facts.map((f) => (
                <li key={f.n}>
                  <b>{counts[f.n]}</b>
                  <span>{f.label}</span>
                </li>
              ))}
              <li>
                <b>1</b>
                <span>{C.factInstall}</span>
              </li>
            </ul>
          </div>

          {tooltip ? (
            <div className="bs-demo" aria-label="BuildHub Skill demo">
              <p className="bs-demo-you">{C.demoYou}</p>
              <div className="bs-demo-agent">
                <p>
                  {C.demoAgentLead}
                  <span className="bs-tip" tabIndex={0}>
                    <Link className="bs-term" href={`${base}/tooltip`}>
                      {termLabel("tooltip")}
                    </Link>
                    <span className="bs-tip-pop" role="tooltip">
                      <b>{tooltip.name}</b>
                      <span>{tooltip.summaryLead}</span>
                      <Link href={`${base}/tooltip`}>{C.demoOpen}</Link>
                    </span>
                  </span>
                  {C.demoAgentTail}
                </p>
              </div>
              <p className="bs-demo-hint">{C.demoHint}</p>
            </div>
          ) : null}
        </section>

        <section className="bs-install">
          <p className="bs-kicker">{C.installHint}</p>
          <h2>{C.installTitle}</h2>
          <p className="bs-desc">{C.installNote}</p>
          <CopyBlock
            text={installText}
            pre={C.installPrompt}
            hint={REPO}
            label={C.copy}
            copiedLabel={C.copied}
            failLabel={C.fail}
          />
          <p className="bs-cli-lead">{C.orCli}</p>
          <CopyBlock
            text={CLI}
            label={C.copy}
            copiedLabel={C.copied}
            failLabel={C.fail}
          />
        </section>

        <section className="bs-block">
          <p className="bs-kicker">{C.oneKicker}</p>
          <h2>{C.oneTitle}</h2>
          <p className="bs-desc">{C.oneDesc}</p>
          <div className="bs-rewrite">
            <div className="bs-before">
              <span>{C.beforeLabel}</span>
              <p>{C.beforeText}</p>
            </div>
            <div className="bs-after">
              <div className="bs-after-head">
                <span>{C.afterLabel}</span>
                <CopyBlock
                  text={plain(C.oneParts)}
                  label={C.copyAction}
                  copiedLabel={C.copied}
                  failLabel={C.fail}
                  inline
                />
              </div>
              <p>{renderParts(C.oneParts)}</p>
            </div>
          </div>
        </section>

        <section className="bs-block">
          <p className="bs-kicker">{C.twoKicker}</p>
          <h2>{C.twoTitle}</h2>
          <p className="bs-desc">{C.twoDesc}</p>
          <div className="bs-dialogue">
            <div className="bs-say">
              <small>{C.youLabel}</small>
              <p>{renderParts(C.twoPartsYou)}</p>
            </div>
            <div className="bs-answer">
              <small>{C.agentLabel}</small>
              <p>{renderParts(C.twoPartsAgent)}</p>
            </div>
          </div>
          <ul className="bs-rules">
            {C.rules.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </section>

        <section className="bs-block">
          <h2>{C.howTitle}</h2>
          <div className="bs-how-grid">
            {C.howItems.map((item) => (
              <div key={item.h}>
                <h3>{item.h}</h3>
                <p>{item.p}</p>
              </div>
            ))}
          </div>
          <p className="bs-links">
            <span className="bs-links-lead">{C.howLinksLead}</span>
            {C.howLinks.map((l) => (
              <Link key={l.href} href={l.href}>
                {l.label}
              </Link>
            ))}
          </p>
        </section>
      </div>
    </main>
  );
}
