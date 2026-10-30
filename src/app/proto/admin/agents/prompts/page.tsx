"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowRight, Search, ShieldCheck } from "lucide-react";
import { Badge, DataTable, Select, Stats, type Column } from "@/components/proto/ui";
import { useProto } from "@/lib/proto/store";
import { PROMPT_MODULES, PROMPT_PURPOSES, SYSTEM_PROMPT_ID, type PromptDef } from "@/lib/proto/ai-data";

export default function PromptsPage() {
  const { state } = useProto();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [purpose, setPurpose] = useState("all");

  const sys = state.ai.prompts.find((p) => p.id === SYSTEM_PROMPT_ID);
  const sysPublished = sys?.versions.find((v) => v.state === "published");
  const sysDraft = sys?.versions.find((v) => v.state === "draft");
  const gatePass = !!sysDraft?.gate && sysDraft.gate.checks.every((c) => c.pass);

  const rows = useMemo(
    () =>
      state.ai.prompts.filter(
        (p) =>
          p.id !== SYSTEM_PROMPT_ID &&
          (purpose === "all" || p.purpose === purpose) &&
          (!q || p.name.includes(q) || p.id.toLowerCase().includes(q.toLowerCase())),
      ),
    [state.ai.prompts, purpose, q],
  );

  const draftCount = state.ai.prompts.filter((p) => p.versions.some((v) => v.state === "draft")).length;

  const columns: Column<PromptDef>[] = [
    {
      key: "name",
      title: "Prompt",
      render: (p) => (
        <div>
          <b>{p.name}</b>
          <span className="p-cell-sub p-mono">{p.id}</span>
        </div>
      ),
    },
    { key: "purpose", title: "用途", width: "110px", render: (p) => <Badge tone="info">{p.purpose}</Badge> },
    {
      key: "version",
      title: "版本",
      width: "180px",
      render: (p) => {
        const draft = p.versions.find((v) => v.state === "draft");
        const published = p.versions.find((v) => v.state === "published");
        return (
          <div>
            <b className="p-mono">{published?.version ?? "—"}</b>
            <span className="p-cell-sub">
              {draft ? <span className="p-text-warn">草稿 {draft.version}</span> : "无草稿"}
            </span>
          </div>
        );
      },
    },
    {
      key: "schema",
      title: "输出 Schema",
      width: "160px",
      render: (p) => {
        const schema = state.ai.schemas.find((s) => s.impacts.prompts.includes(p.id));
        return schema ? (
          <Link href={`/proto/admin/tools/schemas/${schema.id}`} className="p-link p-mono p-small" onClick={(e) => e.stopPropagation()}>
            {schema.id}
          </Link>
        ) : (
          <span className="p-muted">—</span>
        );
      },
    },
    { key: "calls", title: "近 7 天调用", width: "110px", render: (p) => p.callCount.toLocaleString() },
    { key: "rate", title: "规则通过率", width: "110px", render: (p) => `${p.successRate}%` },
    { key: "ms", title: "平均耗时", width: "100px", render: (p) => <span className="p-mono">{p.avgMs} ms</span> },
    {
      key: "ops",
      title: "",
      width: "90px",
      render: (p) => (
        <Link href={`/proto/admin/agents/prompts/${p.id}`} className="p-link p-small" onClick={(e) => e.stopPropagation()}>
          编辑
        </Link>
      ),
    },
  ];

  return (
    <div>
      <div className="p-page-head">
        <div>
          <h1>Prompt 管理</h1>
          <p>系统提示词定义 Agent 的职责与边界；任务级 Prompt 负责各自的子任务，两者一起构成模型输入</p>
        </div>
        <div className="p-page-actions">
          <Link href="/proto/admin/agents/contexts" className="p-btn p-btn-secondary p-btn-md">上下文策略</Link>
          <Link href="/proto/admin/eval/experiments" className="p-btn p-btn-secondary p-btn-md">用评测集验证</Link>
        </div>
      </div>

      {sys && (
        <div className="p-prompt-hero">
          <div className="p-prompt-hero-main">
            <div className="p-row-ops" style={{ flexWrap: "wrap" }}>
              <Badge tone="brand">核心</Badge>
              <Badge tone="info">全会话共用</Badge>
              <span className="p-mono p-small p-muted">{sys.agentId}</span>
            </div>
            <h2>{sys.name}</h2>
            <p>{sys.desc}</p>
            <div className="p-row-ops" style={{ flexWrap: "wrap" }}>
              <span className="p-mono p-small">线上 {sysPublished?.version ?? "—"}</span>
              {sysDraft && <span className="p-mono p-small">草稿 {sysDraft.version}</span>}
              <Badge tone={gatePass ? "ok" : "danger"}>
                <ShieldCheck size={11} /> 发布门禁 {gatePass ? "通过" : "拦截"}
              </Badge>
              <span className="p-muted p-small">
                {sys.versions.length} 个版本 · {PROMPT_MODULES.length} 个模块 · {sysPublished?.vars.length ?? 0} 个变量
              </span>
            </div>
          </div>
          <div className="p-prompt-hero-ops">
            <Link href={`/proto/admin/agents/prompts/${sys.id}`} className="p-btn p-btn-primary p-btn-md">
              编辑系统提示词 <ArrowRight size={13} />
            </Link>
            <Link href="/proto/admin/traces/TR-20261029-0901" className="p-btn p-btn-secondary p-btn-md">
              查看调用 Trace
            </Link>
          </div>
        </div>
      )}

      <Stats
        items={[
          { label: "系统提示词", value: sysPublished?.version ?? "—", hint: sysDraft ? `草稿 ${sysDraft.version}` : "无草稿" },
          { label: "任务级 Prompt", value: state.ai.prompts.length - (sys ? 1 : 0), hint: `${PROMPT_PURPOSES.length - 1} 类用途` },
          { label: "有草稿的 Prompt", value: draftCount, tone: draftCount ? "warn" : "ok", hint: "草稿需回归后才可发布" },
          {
            label: "系统提示词门禁",
            value: gatePass ? "通过" : "拦截",
            tone: gatePass ? "ok" : "danger",
            hint: "安全用例未通过不得发布",
          },
        ]}
      />

      <div className="p-note" style={{ marginBottom: 12 }}>
        系统提示词只约束模型行为，不是安全机制本身。权限校验、危险操作拦截、参数验证与人工审批由服务端强制执行。
      </div>

      <div style={{ margin: "18px 0 10px" }}>
        <h3 className="p-side-h">任务级 Prompt</h3>
        <p className="p-muted p-small" style={{ margin: 0 }}>
          随 Skill 或子任务调用：意图识别、任务规划、航线生成、巡检分析与结果总结。
        </p>
      </div>

      <div className="p-toolbar">
        <div className="p-toolbar-search">
          <Search size={13} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索 Prompt 名称或 ID" />
        </div>
        <Select value={purpose} onChange={(e) => setPurpose(e.target.value)} style={{ width: 140 }}>
          <option value="all">全部用途</option>
          {PROMPT_PURPOSES.filter((p) => p !== "系统提示").map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </Select>
        <span className="p-toolbar-count">{rows.length} 个</span>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(p) => p.id}
        onRowClick={(p) => router.push(`/proto/admin/agents/prompts/${p.id}`)}
        empty="没有符合条件的 Prompt"
      />
    </div>
  );
}
