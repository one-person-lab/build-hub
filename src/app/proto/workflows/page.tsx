"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Badge, Button, DataTable, Dialog, Field, Select, TextInput, ToggleGroup, type Column } from "@/components/proto/ui";
import { useProto } from "@/lib/proto/store";
import type { Workflow } from "@/lib/proto/data";

export default function WorkflowsPage() {
  const { state, addWorkflow } = useProto();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("异常事件自动派单");
  const [trigger, setTrigger] = useState("事件创建");
  const [error, setError] = useState("");

  const rows = useMemo(
    () =>
      state.workflows.filter((w) => {
        if (status !== "all" && w.status !== status) return false;
        if (q && !w.name.includes(q) && !w.id.toLowerCase().includes(q.toLowerCase())) return false;
        return true;
      }),
    [state.workflows, q, status]
  );

  const columns: Column<Workflow>[] = [
    {
      key: "name",
      title: "工作流",
      render: (w) => (
        <div>
          <b>{w.name}</b>
          <span className="p-cell-sub">{w.id} · {w.nodes.length} 个节点 · {w.version ?? "draft r1"}</span>
        </div>
      ),
    },
    {
      key: "source",
      title: "来源",
      width: "110px",
      render: (w) => <Badge tone={w.source === "copilot" ? "brand" : "muted"}>{w.source === "copilot" ? "对话生成" : "手动"}</Badge>,
    },
    { key: "trigger", title: "触发方式", render: (w) => w.trigger },
    {
      key: "status",
      title: "状态",
      width: "110px",
      render: (w) => (
        <div className="p-ver-cell">
          <Badge tone={w.status === "published" ? "ok" : "warn"}>{w.status === "published" ? "已发布" : "草稿"}</Badge>
          <Badge tone={w.enabled ? "ok" : "muted"}>{w.enabled ? "已启用" : "未启用"}</Badge>
        </div>
      ),
    },
    {
      key: "missing",
      title: "资源",
      width: "100px",
      render: (w) =>
        w.missing?.length ? <Badge tone="danger">{w.missing.length} 项待补</Badge> : <Badge tone="ok">已齐</Badge>,
    },
    { key: "last", title: "最近运行", render: (w) => <span className="p-mono">{w.lastRun}</span> },
    {
      key: "rate",
      title: "成功率",
      width: "110px",
      render: (w) => (w.runs.length ? <span className={w.successRate >= 90 ? "t-ok" : "t-warn"}>{w.successRate}%</span> : <span className="p-muted">—</span>),
    },
    {
      key: "ops",
      title: "操作",
      width: "130px",
      render: (w) => (
        <div className="p-row-ops" onClick={(e) => e.stopPropagation()}>
          <Link href={`/proto/workflows/${w.id}`} className="p-btn p-btn-text">画布</Link>
          <Link href={`/proto/workflows/${w.id}`} className="p-btn p-btn-text">运行记录</Link>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="p-page-head">
        <div>
          <h1>工作流</h1>
          <p>对话生成草稿 → 画布调参 → 校验 → 发布启用 → 运行记录；生成与运行全部为模拟，不接真实调度</p>
        </div>
        <div className="p-page-actions">
          <Button onClick={() => router.push("/proto")}>用对话创建</Button>
          <Button variant="primary" icon={<Plus size={13} />} onClick={() => setCreating(true)}>
            新建工作流
          </Button>
        </div>
      </div>

      <div className="p-toolbar">
        <div className="p-toolbar-search">
          <Search size={13} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索工作流" />
        </div>
        <ToggleGroup
          value={status}
          onChange={setStatus}
          items={[
            { key: "all", label: "全部" },
            { key: "published", label: "已发布" },
            { key: "draft", label: "草稿" },
          ]}
        />
        <span className="p-toolbar-count">{rows.length} 条</span>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(w) => w.id}
        onRowClick={(w) => router.push(`/proto/workflows/${w.id}`)}
        empty="没有匹配的工作流"
        emptyHint="新建工作流，或调整筛选"
      />

      <Dialog
        open={creating}
        title="新建工作流"
        confirmText="创建草稿"
        onClose={() => setCreating(false)}
        onConfirm={() => {
          if (!name.trim()) {
            setError("请填写工作流名称");
            return;
          }
          const wf = addWorkflow(name.trim(), trigger);
          setCreating(false);
          router.push(`/proto/workflows/${wf.id}`);
        }}
      >
        <div className="p-form">
          <Field label="工作流名称" required error={error}>
            <TextInput
              value={name}
              invalid={!!error}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
            />
          </Field>
          <Field label="触发方式" required>
            <Select value={trigger} onChange={(e) => setTrigger(e.target.value)}>
              <option>事件创建</option>
              <option>定时任务</option>
              <option>任务状态变化</option>
              <option>设备遥测阈值</option>
            </Select>
          </Field>
          <div className="p-note">原型以模拟流程为主，不会运行真正的流程引擎，也不会触发真实业务动作。</div>
        </div>
      </Dialog>
    </div>
  );
}
