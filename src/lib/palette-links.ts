export type QuickLink = {
  key: string;
  title: string;
  subtitle: string;
  type: string;
  href: string;
  kind: string;
};

/** 搜索弹窗的默认列表：前后端共用，打开即可渲染，不经过网络 */
export const QUICK_LINKS: Record<"zh" | "en", QuickLink[]> = {
  zh: [
    { key: "go:paths", title: "四条路径", subtitle: "做出官网 / 装好工作流 / 做出质感 / 做出 AI 应用", type: "入口", href: "/paths", kind: "path" },
    { key: "go:course", title: "从零做一个产品官网", subtitle: "9 章 · 从需求到上线", type: "课程", href: "/courses/product-website", kind: "course" },
    { key: "go:git", title: "Git 工作流与版本管理", subtitle: "6 章 · 从提交到协作", type: "课程", href: "/courses/git-workflow", kind: "course" },
    { key: "go:skills", title: "技能库", subtitle: "精选 Agent Skills，附安装命令", type: "入口", href: "/skills", kind: "skill" },
    { key: "go:prompts", title: "提示词库", subtitle: "可直接复制的全流程提示词", type: "入口", href: "/prompts", kind: "prompt" },
    { key: "go:playbooks", title: "手册", subtitle: "什么时候用、怎么做、做到什么程度算过", type: "入口", href: "/playbooks", kind: "playbook" },
    { key: "go:engineering", title: "工程实践", subtitle: "四个栏目 · 可展示的工程能力作品集", type: "入口", href: "/engineering", kind: "path" },
  ],
  en: [
    { key: "go:concepts", title: "Concepts", subtitle: "Plain-word explanations with live demos", type: "Go", href: "/en/topics/frontend", kind: "term" },
    { key: "go:skills", title: "Skills", subtitle: "Curated agent skills with install commands", type: "Go", href: "/en/skills", kind: "skill" },
    { key: "go:products", title: "Showcase", subtitle: "Tools we have actually used", type: "Go", href: "/en/products", kind: "product" },
    { key: "go:prompts", title: "Prompts", subtitle: "Copy-ready prompts for the whole build", type: "Go", href: "/en/prompts", kind: "prompt" },
    { key: "go:design", title: "Design", subtitle: "Interface styles you can open and compare", type: "Go", href: "/en/design", kind: "design" },
    { key: "go:motion", title: "Motion", subtitle: "161 carousels and motion components", type: "Go", href: "/en/distill", kind: "motion" },
  ],
};
