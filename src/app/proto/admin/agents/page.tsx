"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Bot, Search, Settings2 } from "lucide-react";
import { Badge, Button, DataTable, Stats, type Column } from "@/components/proto/ui";
import { useProto } from "@/lib/proto/store";

const AGENT_META = [
  {
    id: "AGENT-COPILOT-OPS",
    name: "作业 Copilot",
    desc: "对话下单、任务理解、航线与安全校验",
    model: "deepseek-v4-pro",
    owner: "陈默",
    tools: 4,
  },
  {
    id: "AGENT-REPORT",
    name: "报告助手",
    desc: "报告摘要、异常归类与处置建议草稿",
    model: "qwen3.8-flash",
    owner: "周航",
    tools: 2,
  },
];

type Row = (typeof AGENT_META)[number] & { published?: string; draft?: string; updated: string };

export default function AgentsPage() {
  const { state } = useProto();
  const router = useRouter();
  const [q, setQ] = useState("");

  const rows: Row[] = useMemo(
    () =>
      AGENT_META.map((a) => {
        const versions = state.agents.filter((v) => v.agentId === a.id);
        const published = versions.find((v) => v.state === "published");
        const draft = versions.find((v) => v.state === "draft");
        return {
          ...a,
          published: published?.version,
          draft: draft?.version,
          updated: versions[0]?.at ?? "—",
        };
      }).filter((a) => !q || a.name.includes(q) || a.id.toLowerCase().includes(q.toLowerCase())),
    [state.agents, q],
  );

  const columns: Column<Row>[] = [
    {
      key: "name",
      title: "智能体",
      render: (a) => (
        <div className="p-agent-cell">
          <i className="p-agent-mark"><Bot size={14} /></i>
          <div>
            <b>{a.name}</b>
            <span className="p-cell-sub">{a.id} · {a.desc}</span>
          </div>
        </div>
      ),
    },
    { key: "model", title: "推理模型", width: "150px", render: (a) => <span className="p-mono">{a.model}</span> },
    { key: "tools", title: "工具数", width: "80px", render: (a) => `${a.tools} 个` },
    {
      key: "ver",
      title: "版本",
      width: "180px",
      render: (a) => (
        <div className="p-ver-cell">
          {a.published ? <Badge tone="ok">{a.published} 线上</Badge> : <Badge tone="muted">未发布</Badge>}
          {a.draft && <Badge tone="warn">{a.draft} 草稿</Badge>}
        </div>
      ),
    },
    { key: "updated", title: "最近更新", render: (a) => <span className="p-mono">{a.updated}</span> },
    {
      key: "ops",
      title: "操作",
      width: "110px",
      render: (a) => (
        <div className="p-row-ops" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" icon={<Settings2 size={12} />} onClick={() => router.push(`/proto/admin/agents/${a.id}`)}>
            配置
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="p-page-head">
        <div>
          <h1>智能体管理</h1>
          <p>管理 Agent 的模型、提示词、上下文策略与版本发布</p>
        </div>
      </div>

      <Stats
        items={[
          { label: "智能体", value: AGENT_META.length, hint: "生产中 2 个" },
          { label: "线上版本", value: "2", tone: "ok" },
          { label: "待发布草稿", value: state.agents.filter((a) => a.state === "draft").length, tone: "warn" },
          { label: "已启用工具", value: state.tools.filter((t) => t.status === "enabled").length, hint: "全局工具目录" },
        ]}
      />

      <div className="p-toolbar">
        <div className="p-toolbar-search">
          <Search size={13} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索智能体名称或编号" />
        </div>
        <span className="p-toolbar-count">{rows.length} 个</span>
      </div>

      <DataTable columns={columns} rows={rows} rowKey={(a) => a.id} onRowClick={(a) => router.push(`/proto/admin/agents/${a.id}`)} />
    </div>
  );
}
