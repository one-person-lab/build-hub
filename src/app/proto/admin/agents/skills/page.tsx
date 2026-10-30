"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Search, Plus } from "lucide-react";
import { Badge, Button, DataTable, Dialog, Field, Select, Stats, Switch, Textarea, TextInput, type Column } from "@/components/proto/ui";
import { useProto } from "@/lib/proto/store";
import { publishedVersion, type AgentSkill } from "@/lib/proto/skill-data";

export default function SkillsPage() {
  const { state, toggleSkill, createSkill } = useProto();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [state_, setState] = useState("all");
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [scenarios, setScenarios] = useState("");

  const rows = useMemo(
    () =>
      state.skills.items.filter((s) => {
        const draft = s.versions.some((v) => v.state === "draft");
        if (state_ === "draft" && !draft) return false;
        if (state_ === "published" && draft) return false;
        if (state_ === "disabled" && s.enabled) return false;
        return !q || s.name.includes(q) || s.id.toLowerCase().includes(q.toLowerCase());
      }),
    [state.skills.items, q, state_],
  );

  const columns: Column<AgentSkill>[] = [
    {
      key: "name",
      title: "Skill",
      render: (s) => (
        <div>
          <b>{s.name}</b>
          <span className="p-cell-sub p-mono">{s.id}</span>
        </div>
      ),
    },
    {
      key: "scenarios",
      title: "适用场景",
      width: "220px",
      render: (s) => <span className="p-cell-sub">{s.scenarios.slice(0, 2).join(" · ")}</span>,
    },
    {
      key: "version",
      title: "版本",
      width: "150px",
      render: (s) => {
        const published = publishedVersion(s);
        const draft = s.versions.find((v) => v.state === "draft");
        return (
          <div>
            <span className="p-mono">{published.version}</span>
            {draft && <span className="p-cell-sub">草稿 {draft.version}</span>}
          </div>
        );
      },
    },
    {
      key: "steps",
      title: "步骤",
      width: "70px",
      render: (s) => publishedVersion(s).steps.length,
    },
    {
      key: "tools",
      title: "依赖工具",
      width: "90px",
      render: (s) => `${new Set(publishedVersion(s).steps.filter((x) => x.toolId).map((x) => x.toolId)).size} 个`,
    },
    { key: "calls", title: "调用量", width: "90px", render: (s) => s.callCount.toLocaleString() },
    {
      key: "success",
      title: "成功率",
      width: "90px",
      render: (s) => (s.callCount ? <span className="p-mono">{s.successRate}%</span> : <span className="p-muted">—</span>),
    },
    {
      key: "enabled",
      title: "启用",
      width: "80px",
      render: (s) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Switch on={s.enabled} onChange={() => toggleSkill(s.id)} />
        </div>
      ),
    },
    {
      key: "ops",
      title: "",
      width: "80px",
      render: (s) => (
        <div className="p-row-ops" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" onClick={() => router.push(`/proto/admin/agents/skills/${s.id}`)}>
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
          <h1>Skill 管理</h1>
          <p>Skill 是可复用的任务方法：定义步骤、依赖工具、前置条件、失败处理与安全约束</p>
        </div>
        <div className="p-page-actions">
          <Link href="/proto/admin/tools" className="p-btn p-btn-ghost p-btn-md">
            工具管理
          </Link>
          <Link href="/proto/admin/tools/mcp" className="p-btn p-btn-ghost p-btn-md">
            MCP 管理
          </Link>
          <Button variant="primary" icon={<Plus size={13} />} onClick={() => setCreating(true)}>
            新建 Skill
          </Button>
        </div>
      </div>

      <Stats
        items={[
          { label: "Skill 总数", value: state.skills.items.length },
          { label: "已启用", value: state.skills.items.filter((s) => s.enabled).length, tone: "ok" },
          {
            label: "有草稿待发布",
            value: state.skills.items.filter((s) => s.versions.some((v) => v.state === "draft")).length,
            tone: "warn",
          },
          { label: "运行记录", value: state.skills.runs.length, tone: "info" },
        ]}
      />

      <div className="p-toolbar">
        <div className="p-toolbar-search">
          <Search size={13} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索 Skill 名称或 ID" />
        </div>
        <Select value={state_} onChange={(e) => setState(e.target.value)} style={{ width: 150 }}>
          <option value="all">全部状态</option>
          <option value="draft">有草稿</option>
          <option value="published">无草稿</option>
          <option value="disabled">已停用</option>
        </Select>
        <span className="p-toolbar-count">{rows.length} 个</span>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(s) => s.id}
        onRowClick={(s) => router.push(`/proto/admin/agents/skills/${s.id}`)}
        empty="没有符合条件的 Skill"
      />

      <div className="p-note">
        Skill 只编排步骤，不直接执行设备动作；所有工具调用仍需经过业务服务的权限、参数与安全校验。停用 Skill 后 Agent
        不会再选中它。
      </div>

      <Dialog
        open={creating}
        title="新建 Skill"
        confirmText="创建草稿"
        onClose={() => setCreating(false)}
        onConfirm={() => {
          if (!name.trim()) return;
          const skill = createSkill({
            name: name.trim(),
            desc: desc.trim() || "待补充说明",
            scenarios: scenarios
              .split(/[，,]/)
              .map((x) => x.trim())
              .filter(Boolean),
          });
          setCreating(false);
          setName("");
          setDesc("");
          setScenarios("");
          router.push(`/proto/admin/agents/skills/${skill.id}`);
        }}
      >
        <div className="p-form">
          <Field label="名称" required>
            <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="例如：夜间巡视复核" />
          </Field>
          <Field label="说明">
            <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} placeholder="这个 Skill 解决什么问题、边界是什么" />
          </Field>
          <Field label="适用场景" hint="用逗号分隔">
            <TextInput value={scenarios} onChange={(e) => setScenarios(e.target.value)} placeholder="夜间巡检, 重点区域复核" />
          </Field>
          <div className="p-note">新建的 Skill 默认停用，需要补全步骤、测试通过并发布后，Agent 才会使用。</div>
        </div>
        {!name.trim() && <Badge tone="warn">名称必填</Badge>}
      </Dialog>
    </div>
  );
}
