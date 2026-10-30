"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Bot,
  BookOpen,
  ChevronRight,
  ClipboardList,
  Cpu,
  FileText,
  FlaskConical,
  History,
  LayoutDashboard,
  Map,
  MessageSquare,
  RotateCcw,
  Route as RouteIcon,
  Search,
  Settings,
  ShieldCheck,
  Wrench,
  Workflow as WorkflowIcon,
  X,
} from "lucide-react";
import { ProtoProvider, useProto } from "@/lib/proto/store";
import { EVAL_PAGES } from "@/lib/proto/eval-data";
import type { ReactNode } from "react";

const FRONT = [
  { href: "/proto", label: "智能助手", icon: MessageSquare, desc: "对话 · 咨询 · 规划 · 结果" },
  { href: "/proto/map", label: "作业地图", icon: Map, desc: "地图 · 设备 · 区域圈选" },
  { href: "/proto/tasks", label: "任务中心", icon: ClipboardList, desc: "列表 · 详情 · 执行状态" },
  { href: "/proto/routes", label: "航线管理", icon: RouteIcon, desc: "航点 · 校验 · 版本" },
  { href: "/proto/workflows", label: "工作流", icon: WorkflowIcon, desc: "节点编排 · 运行记录" },
  { href: "/proto/events", label: "巡检事件", icon: AlertTriangle, desc: "证据 · 处置 · 关联任务" },
  { href: "/proto/reports", label: "作业报告", icon: FileText, desc: "统计 · 明细 · 导出" },
  { href: "/proto/history", label: "历史记录", icon: History, desc: "会话 · 指令 · 追溯" },
];

type NavChild = { label: string; href?: string };

const ADMIN: { href: string; label: string; icon: typeof Bot; children?: NavChild[] }[] = [
  { href: "/proto/admin", label: "工作概览", icon: LayoutDashboard },
  {
    href: "/proto/admin/agents",
    label: "智能体管理",
    icon: Bot,
    children: [
      { href: "/proto/admin/agents", label: "Agent 列表" },
      { href: "/proto/admin/agents/skills", label: "Skill 管理" },
      { href: "/proto/admin/agents/prompts", label: "Prompt 管理" },
      { href: "/proto/admin/agents/contexts", label: "上下文策略" },
    ],
  },
  {
    href: "/proto/admin/tools",
    label: "工具管理",
    icon: Wrench,
    children: [
      { href: "/proto/admin/tools", label: "工具列表" },
      { href: "/proto/admin/tools/mcp", label: "MCP 管理" },
      { href: "/proto/admin/tools/schemas", label: "结构化输出" },
    ],
  },
  {
    href: "/proto/admin/models",
    label: "模型管理",
    icon: Cpu,
    children: [
      { href: "/proto/admin/models", label: "模型注册" },
      { href: "/proto/admin/models/routing", label: "路由策略" },
    ],
  },
  { href: "/proto/admin/workflows", label: "工作流管理", icon: WorkflowIcon },
  { href: "/proto/admin/sessions", label: "会话与任务", icon: ClipboardList },
  { href: "/proto/admin/security", label: "安全与权限", icon: ShieldCheck },
  { href: "/proto/admin/traces", label: "运行追踪", icon: Activity },
  {
    href: "/proto/admin/eval",
    label: "AI 评测与优化",
    icon: FlaskConical,
    children: [
      ...EVAL_PAGES.filter((p) => p.tier === "main" && p.href !== "/proto/admin/eval").map((p) => ({ href: p.href, label: p.label })),
      { label: "专项与历史" },
      ...EVAL_PAGES.filter((p) => p.tier === "special").map((p) => ({ href: p.href, label: p.label })),
    ],
  },
  {
    href: "/proto/admin/kb",
    label: "知识库管理",
    icon: BookOpen,
    children: [
      { href: "/proto/admin/kb", label: "文档与索引" },
      { href: "/proto/admin/kb/retrieval", label: "检索测试" },
      { href: "/proto/admin/kb/config", label: "模型与检索配置" },
    ],
  },
  { href: "/proto/admin/settings", label: "系统设置", icon: Settings },
];

function isActive(pathname: string, href: string) {
  if (href === "/proto" || href === "/proto/admin") return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

function ToastHost() {
  const { toasts, dismissToast } = useProto();
  return (
    <div className="p-toasts">
      {toasts.map((t) => (
        <div key={t.id} className={`p-toast is-${t.tone}`}>
          <span>{t.text}</span>
          <button onClick={() => dismissToast(t.id)} aria-label="关闭">
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}

function GlobalSearch() {
  const { state } = useProto();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        box.current?.querySelector("input")?.focus();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    const nav = [
      ...FRONT.map((n) => ({ label: n.label, href: n.href })),
      ...ADMIN.flatMap((n) => [
        { label: n.label, href: n.href },
        ...(n.children ?? []).flatMap((c) => (c.href ? [{ label: c.label, href: c.href }] : [])),
      ]),
    ]
      .filter((n) => n.label.toLowerCase().includes(s) || n.href.includes(s))
      .slice(0, 5)
      .map((n) => ({ kind: "页面", label: n.label, sub: n.href, href: n.href }));
    const tasks = state.tasks
      .filter((t) => t.id.toLowerCase().includes(s) || t.name.toLowerCase().includes(s))
      .slice(0, 4)
      .map((t) => ({ kind: "任务", label: `${t.name}`, sub: t.id, href: `/proto/tasks/${t.id}` }));
    const events = state.events
      .filter((e) => e.id.toLowerCase().includes(s) || e.title.toLowerCase().includes(s))
      .slice(0, 3)
      .map((e) => ({ kind: "事件", label: e.title, sub: e.id, href: `/proto/events?focus=${e.id}` }));
    return [...nav, ...tasks, ...events];
  }, [q, state.tasks, state.events]);

  return (
    <div className="p-search" ref={box}>
      <Search size={14} />
      <input
        value={q}
        placeholder="搜索页面 / 任务 / 事件 ⌘K"
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
      />
      {open && q.trim() && (
        <div className="p-search-pop">
          {results.length === 0 && <p className="p-search-empty">没有匹配结果</p>}
          {results.map((r) => (
            <button
              key={r.kind + r.sub}
              onClick={() => {
                router.push(r.href);
                setOpen(false);
                setQ("");
              }}
            >
              <em>{r.kind}</em>
              <span>{r.label}</span>
              <code>{r.sub}</code>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DemoGuide({ open, onClose }: { open: boolean; onClose: () => void }) {
  const steps = [
    ["01", "对话下单", "/proto", "在智能助手说「巡检这个区域的消防通道」，在卡片里圈选区域"],
    ["02", "生成计划", "/proto", "候选设备、航线草稿、参数与风险一起出现"],
    ["03", "改参数复核", "/proto", "点「修改参数」调整高度，计划版本自动加一"],
    ["04", "确认下发", "/proto", "确认后任务进入待执行 → 执行中，进度实时变化"],
    ["05", "发现异常", "/proto/events", "执行到中途生成占道事件，带证据与置信度"],
    ["06", "事件处置", "/proto/events", "确认异常 / 转交处理 / 标记误报，状态会流转"],
    ["07", "任务结果", "/proto/tasks", "任务详情可看时间线、事件、报告入口"],
    ["08", "报告导出", "/proto/reports", "打开报告，打印或导出"],
    ["09", "后台追溯", "/proto/admin/traces", "Trace 五个视图：链路、模型调用、工具调用、上下文快照、错误分析"],
    ["10", "Prompt 版本", "/proto/admin/agents/prompts", "调试台模拟输入，再用同一数据集对比 Prompt 版本"],
    ["11", "上下文与状态", "/proto/admin/agents/contexts", "看模型这轮拿到什么、丢了什么；TR-20261023-1110 的任务状态冲突"],
    ["12", "结构化输出", "/proto/admin/tools/schemas", "Schema 通过 ≠ 业务合法：看「结构合法、业务拒绝」样例"],
    ["13", "模型路由", "/proto/admin/models/routing", "把备用模型切到不可用，再模拟「航线生成」→ 拒绝降级"],
    ["14", "评测与优化", "/proto/admin/eval", "配置层 → Trace → 失败分析 → 实验对比 → 发布门禁"],
    ["15", "知识问答与引用", "/proto", "问「电池温度异常要间隔多久」，看路径徽章、引用卡片与检索 Trace"],
    ["16", "知识库链路", "/proto/admin/kb", "上传文档看解析阶段与分块；在「检索测试」复现召回与重排"],
    ["17", "RAG 专项评测", "/proto/admin/eval/rag", "对比新旧检索配置：召回、排序、引用与拒答合理性"],
    ["18", "巡检 Skill", "/proto", "说「巡检这个区域的消防通道」，看 Skill 选择、步骤与工具来源"],
    ["19", "Skill 与 MCP", "/proto/admin/agents/skills", "Skill 版本与步骤编排；MCP 连接、能力发现与失败降级"],
    ["20", "Skill 专项评测", "/proto/admin/eval/skills", "同一组用例对比 Skill 版本与 MCP 配置，从 Trace 补失败用例"],
    ["21", "系统提示词与门禁", "/proto/admin/agents/prompts/PR-COPILOT-SYS", "编辑草稿 → 调试 → 重跑回归 → 门禁拦截/放行 → 发布或回滚"],
    ["22", "工作流搭建", "/proto", "说「每天早上 8 点巡检 A 区，完成后做异常分析并通知我」生成草稿；再说「再增加邮件通知」，画布同步"],
    ["23", "校验与运行", "/proto/workflows", "画布校验 → 保存草稿 → 发布并启用 → 模拟运行看执行日志"],
    ["24", "工作流专项评测", "/proto/admin/eval/workflows", "同一组用例对比 Agent 与模型版本，安全节点不允许被跳过"],
  ];
  if (!open) return null;
  return (
    <div className="p-overlay" onMouseDown={onClose}>
      <aside className="p-drawer" style={{ width: 520 }} onMouseDown={(e) => e.stopPropagation()}>
        <header className="p-drawer-head">
          <div>
            <h3>演示指引</h3>
            <p>按顺序走一遍，就是完整的产品故事</p>
          </div>
          <button className="p-icon-btn" onClick={onClose} aria-label="关闭">
            <X size={16} />
          </button>
        </header>
        <div className="p-drawer-body">
          <ol className="p-demo-list">
            {steps.map(([n, title, href, desc]) => (
              <li key={n}>
                <em>{n}</em>
                <div>
                  <Link href={href} onClick={onClose}>
                    {title}
                  </Link>
                  <p>{desc}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="p-note">
            所有设备、飞行与业务数据均为模拟数据；原型不连接真实无人机，也不会向任何真实设备下发指令。
          </p>
        </div>
      </aside>
    </div>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { state, resetDemo } = useProto();
  const [guide, setGuide] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setOpenGroups({});
  }, [pathname]);
  const running = state.tasks.filter((t) => t.status === "running" || t.status === "queued").length;
  const pending = state.events.filter((e) => e.status === "pending").length;

  return (
    <div className="p-app">
      <aside className="p-side">
        <Link href="/proto" className="p-brand">
          <span className="p-brand-mark" aria-hidden>
            <svg viewBox="0 0 32 32" fill="none">
              <path
                d="M10.2 10.2 13.4 13.4M21.8 10.2 18.6 13.4M10.2 21.8 13.4 18.6M21.8 21.8 18.6 18.6"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              <circle cx="7.4" cy="7.4" r="2.9" stroke="currentColor" strokeWidth="1.6" />
              <circle cx="24.6" cy="7.4" r="2.9" stroke="currentColor" strokeWidth="1.6" />
              <circle cx="7.4" cy="24.6" r="2.9" stroke="currentColor" strokeWidth="1.6" />
              <circle cx="24.6" cy="24.6" r="2.9" stroke="currentColor" strokeWidth="1.6" />
              <circle cx="16" cy="16" r="2.8" fill="currentColor" />
            </svg>
          </span>
          <span>
            <b>无人机 Copilot</b>
            <em>作业端 · 管理控制台</em>
          </span>
        </Link>

        <div className="p-side-scroll">
          <div className="p-side-label">作业端</div>
          <nav className="p-nav">
            {FRONT.map((n) => {
              const Icon = n.icon;
              const active = isActive(pathname, n.href);
              const count =
                n.href === "/proto/tasks" ? running : n.href === "/proto/events" ? pending : 0;
              return (
                <Link key={n.href} href={n.href} className={`p-nav-item${active ? " is-active" : ""}`}>
                  <Icon size={16} />
                  <span>{n.label}</span>
                  {count > 0 && <i className="p-nav-count">{count}</i>}
                </Link>
              );
            })}
          </nav>

          <div className="p-side-label">管理控制台</div>
          <nav className="p-nav">
            {ADMIN.map((n) => {
              const Icon = n.icon;
              const hasChildren = !!n.children?.length;
              const inSection = isActive(pathname, n.href);
              const active = hasChildren ? pathname === n.href : inSection;
              const expanded = hasChildren && (openGroups[n.href] ?? inSection);
              return (
                <Fragment key={n.href}>
                  {hasChildren ? (
                    <button
                      type="button"
                      className={`p-nav-item p-nav-group${inSection ? " is-current" : ""}`}
                      onClick={() => setOpenGroups((o) => ({ ...o, [n.href]: !expanded }))}
                      aria-expanded={expanded}
                    >
                      <Icon size={16} />
                      <span>{n.label}</span>
                      <ChevronRight size={12} className={`p-nav-chev${expanded ? " is-open" : ""}`} />
                    </button>
                  ) : (
                    <Link href={n.href} className={`p-nav-item${active ? " is-active" : ""}`}>
                      <Icon size={16} />
                      <span>{n.label}</span>
                    </Link>
                  )}
                  {expanded && (
                    <div className="p-nav-children">
                      {n.children!.map((c) =>
                        c.href ? (
                          <Link
                            key={c.href}
                            href={c.href}
                            className={`p-nav-child${pathname === c.href || (c.href !== n.href && pathname.startsWith(c.href + "/")) ? " is-active" : ""}`}
                          >
                            {c.label}
                          </Link>
                        ) : (
                          <div key={`label-${c.label}`} className="p-nav-label">
                            {c.label}
                          </div>
                        ),
                      )}
                    </div>
                  )}
                </Fragment>
              );
            })}
          </nav>
        </div>

        <div className="p-side-foot">
          <div className="p-safe">
            <ShieldCheck size={13} />
            <span>模拟环境 · 不接真实设备</span>
          </div>
          <div className="p-side-actions">
            <button onClick={resetDemo}>
              <RotateCcw size={13} /> 重置演示
            </button>
            <button onClick={() => setGuide(true)}>
              <ChevronRight size={13} /> 演示指引
            </button>
          </div>
        </div>
      </aside>

      <div className="p-main">
        <header className="p-topbar">
          <GlobalSearch />
          <div className="p-topbar-right">
            <Link href="/" className="p-exit">
              返回 BuildHub
            </Link>
            <span className="p-env">DEV · 模拟数据</span>
            <span className="p-avatar">陈</span>
          </div>
        </header>
        <main className="p-content">{children}</main>
      </div>

      <ToastHost />
      <DemoGuide open={guide} onClose={() => setGuide(false)} />
    </div>
  );
}

export default function ProtoRoot({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.documentElement.dataset.proto = "1";
    return () => {
      delete document.documentElement.dataset.proto;
    };
  }, []);
  return (
    <ProtoProvider>
      <Shell>{children}</Shell>
    </ProtoProvider>
  );
}
