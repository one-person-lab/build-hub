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
    title: "你说不出名字的那个效果，它替你叫出来。",
    sub: "装进你的 Agent 之后，它做完事会顺手告诉你这个叫 Tooltip、那个叫骨架屏，点开就是带示例的解释页。不用你先去问「这叫什么」。",
    facts: [
      { n: "terms", label: "个术语词条" },
      { n: "demos", label: "个带可玩示例" },
    ],
    factInstall: "句话就能装",
    installHint: "一分钟装好",
    installTitle: "复制这段话，发给你的 Agent",
    installNote: "Agent 自己打开仓库、找到 skills/buildhub 装好，你不用碰命令行。",
    installPrompt: "帮我安装这个仓库里的 skills/buildhub Skill。",
    copy: "复制安装指令",
    copied: "已复制",
    fail: "复制失败，手动选上吧",
    orCli: "想用命令行就复制这条：",
    oneKicker: "功能一 · 把需求说准",
    oneTitle: "模糊描述进来，可以直接发送的需求出去",
    oneDesc: "它只补真正有用的术语，不改你的原意，也不会替你决定用哪个框架、哪个组件库、哪些参数。",
    beforeLabel: "你的原话",
    beforeText: "这个按钮鼠标放上去变个色，点下去也要有一下反馈。",
    afterLabel: "可以直接对 Agent 说",
    copyAction: "复制规范后的表达",
    oneParts: [
      { text: "为按钮补充 " },
      { term: "hover", show: "Hover" },
      { text: " 状态和 " },
      { term: "active", show: "Active" },
      { text: " 状态，并使用 " },
      { term: "transition", show: "Transition" },
      { text: " 让状态变化更自然。" },
    ],
    twoKicker: "功能二 · 主动提示",
    twoTitle: "不用你先问「这叫什么」",
    twoDesc: "你的描述有歧义、或者缺一个准确名词，它就从这一轮里挑出最相关的 1 到 3 个术语，解释跟着当前任务讲一句。",
    youLabel: "你说",
    twoPartsYou: [{ text: "这个设置我想改了就马上生效，不想再点一次保存。" }],
    agentLabel: "Agent 提示",
    twoPartsAgent: [
      { text: "这种场景适合 " },
      { term: "switch" },
      { text: "：它只有开和关两种状态，改完立即生效。如果用户需要先调几项再一起确认，就不该这么设计。" },
    ],
    rules: [
      "术语第一次出现时链接到 BuildHub 的词条",
      "解释紧跟当前任务，不讲百科定义",
      "一次最多提示 3 个真正相关的术语",
    ],
    demoYou: "鼠标放到这个按钮上时，显示一个小提示，告诉用户它是做什么的。",
    demoAgentLead: "已经加好了：鼠标悬停或键盘聚焦时，会显示「下载」。这种短提示通常叫 ",
    demoAgentTail: "。",
    demoHint: "把鼠标放到术语上，或者用键盘 Tab 聚焦它",
    demoOpen: "打开词条",
    howTitle: "它凭什么敢报名字",
    howItems: [
      { h: "先推断，再验证", p: "它不会把你的原话整句丢进搜索。先从语境里推出几个候选名词，再一次性拿去查站里的词条。" },
      { h: "查不到就不编", p: "只给 BuildHub 上真实存在的词条页。没命中的候选词，宁可不提，也不会凑一个链接。" },
      { h: "全程是普通文件", p: "Skill 正文和脚本都在仓库里，能读能改，没有运行时、黑盒和锁定。" },
    ],
    howLinks: [
      { href: "/skills", label: "技能库" },
      { href: "/prompts", label: "可抄提示词" },
      { href: "/design", label: "界面参考" },
    ],
    howLinksLead: "缺的不是名词，而是别人怎么做的时候：",
  },
  en: {
    label: "BuildHub Skill",
    title: "It names the effect you can only describe.",
    sub: "Put it in your agent. As the agent works, it tells you the term: this is a Tooltip, that is a skeleton screen, and each one opens a page you can play with. You never have to ask what it is called.",
    facts: [
      { n: "terms", label: " term entries" },
      { n: "demos", label: " with a live demo" },
    ],
    factInstall: " line to install",
    installHint: "About a minute",
    installTitle: "Paste this to your agent",
    installNote: "The agent opens the repository, finds skills/buildhub and installs it. No commands required.",
    installPrompt: "Install the skills/buildhub Skill from this repository.",
    copy: "Copy install prompt",
    copied: "Copied",
    fail: "Copy failed, select it by hand",
    orCli: "Prefer a command? Copy this:",
    oneKicker: "Function 1 · Say it precisely",
    oneTitle: "Vague words in, a request you can send straight out",
    oneDesc: "It only adds the terms that matter. It keeps your intent and never picks a framework, a component library or parameters for you.",
    beforeLabel: "What you said",
    beforeText: "Make this button change colour on hover, and give it some feedback when I press it.",
    afterLabel: "What you can send",
    copyAction: "Copy the rewrite",
    oneParts: [
      { text: "Add " },
      { term: "hover", show: "Hover" },
      { text: " and " },
      { term: "active", show: "Active" },
      { text: " states to the button, and use a " },
      { term: "transition", show: "Transition" },
      { text: " so the change feels smooth." },
    ],
    twoKicker: "Function 2 · It brings it up",
    twoTitle: "You do not have to ask what it is called",
    twoDesc: "When your wording is ambiguous or missing a precise noun, it picks the 1 to 3 terms that matter from this turn and explains each in one line, inside the task you are on.",
    youLabel: "You",
    twoPartsYou: [
      { text: "I want this setting to apply as soon as I change it, without a second click on Save." },
    ],
    agentLabel: "Agent",
    twoPartsAgent: [
      { text: "This wants a " },
      { term: "switch", show: "Switch" },
      { text: ": two states, on and off, applied immediately. If the user has to adjust several fields and confirm once, this is the wrong pattern." },
    ],
    rules: [
      "The first mention of a term links to its BuildHub entry",
      "Explanations stay with the task, no dictionary definitions",
      "At most 3 terms in one reply",
    ],
    demoYou: "When I hover this button, show a small hint explaining what it does.",
    demoAgentLead: "Done: hovering or keyboard focus now shows Download. That short hint is usually a ",
    demoAgentTail: ".",
    demoHint: "Hover the term, or Tab to it with the keyboard",
    demoOpen: "Open entry",
    howTitle: "Why it can name things",
    howItems: [
      { h: "Guess first, then verify", p: "It does not throw your sentence at a search box. It infers candidate terms, then checks them against the site in one pass." },
      { h: "Unverified stays out", p: "It only links to entry pages that really exist on BuildHub. A candidate that misses is left out rather than invented." },
      { h: "Plain files all the way", p: "The skill and its script live in the repository. Read them, change them. No runtime, no black box, no lock-in." },
    ],
    howLinks: [
      { href: "/en/skills", label: "Skills" },
      { href: "/en/prompts", label: "Prompts" },
      { href: "/en/design", label: "UI references" },
    ],
    howLinksLead: "When what you need is a reference rather than a noun:",
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
