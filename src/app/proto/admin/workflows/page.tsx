"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { History, Play, Plus, Power, Search } from "lucide-react";
import { Badge, Button, DataTable, Dialog, Drawer, Field, Select, TextInput, type Column } from "@/components/proto/ui";
import { useProto } from "@/lib/proto/store";
import type { Workflow } from "@/lib/proto/data";

const SRC_LABEL = { copilot: "对话生成", manual: "手动" } as const;

export default function AdminWorkflowsPage() {
  const { state, addWorkflow, publishWorkflow, runWorkflow, toggleWorkflowEnabled } = useProto();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState("事件创建");
  const [err, setErr] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);

  const rows = useMemo(
    () => state.workflows.filter((w) => !q || w.name.includes(q) || w.id.toLowerCase().includes(q.toLowerCase())),
    [state.workflows, q],
  );
  const detail = state.workflows.find((w) => w.id === detailId) ?? null;

  const columns: Column<Workflow>[] = [
    {
      key: "name",
      title: "工作流",
      render: (w) => (
        <div>
          <b>{w.name}</b>
          <span className="p-cell-sub">{w.id} · {w.version ?? "draft r1"} · {w.trigger}</span>
        </div>
      ),
    },
    {
      key: "source",
      title: "来源",
      width: "90px",
      render: (w) => <Badge tone={w.source === "copilot" ? "brand" : "muted"}>{SRC_LABEL[w.source ?? "manual"]}</Badge>,
    },
    { key: "nodes", title: "节点", width: "70px", render: (w) => `${w.nodes.length} 个` },
    {
      key: "status",
      title: "状态",
      width: "120px",
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
      render: (w) => (w.missing?.length ? <Badge tone="danger">{w.missing.length} 项待补</Badge> : <Badge tone="ok">已齐</Badge>),
    },
    { key: "rate", title: "成功率", width: "90px", render: (w) => (w.runs.length ? `${w.successRate}%` : "—") },
    { key: "last", title: "最近运行", width: "150px", render: (w) => <span className="p-mono">{w.lastRun}</span> },
    {
      key: "ops",
      title: "操作",
      width: "240px",
      render: (w) => (
        <div className="p-row-ops" onClick={(e) => e.stopPropagation()}>
          <button className="p-btn p-btn-text" onClick={() => router.push(`/proto/workflows/${w.id}`)}>画布</button>
          <button className="p-btn p-btn-text" onClick={() => setDetailId(w.id)}>日志</button>
          <button className="p-btn p-btn-text" onClick={() => toggleWorkflowEnabled(w.id)}>{w.enabled ? "停用" : "启用"}</button>
          <button className="p-btn p-btn-text" onClick={() => runWorkflow(w.id)}>运行</button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="p-page-head">
        <div>
          <h1>工作流管理</h1>
          <p>对话生成的草稿和手动流程在这里统一启停、运行与追溯；执行全部为模拟，不调用真实飞控</p>
        </div>
        <div className="p-page-actions">
          <Link href="/proto/admin/eval/workflows" className="p-btn p-btn-secondary p-btn-md">
            工作流评测
          </Link>
          <Button variant="primary" icon={<Plus size={13} />} onClick={() => setCreating(true)}>新建工作流</Button>
        </div>
      </div>

      <div className="p-toolbar">
        <div className="p-toolbar-search">
          <Search size={13} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索工作流名称或编号" />
        </div>
        <Button
          size="sm"
          icon={<Play size={12} />}
          onClick={() => {
            const first = state.workflows.find((w) => w.enabled) ?? state.workflows[0];
            if (first) runWorkflow(first.id);
          }}
        >
          试运行一个流程
        </Button>
        <span className="p-toolbar-count">{rows.length} 个</span>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(w) => w.id}
        onRowClick={(w) => setDetailId(w.id)}
        empty="没有符合条件的工作流"
      />

      <p className="p-muted p-footnote">
        发布只切换线上版本，不会自动启用；启用与运行都会先过流程校验。已在运行的实例不受影响。
        <Link href="/proto/workflows" className="p-link"> 去前台工作流</Link>
      </p>

      <Drawer open={!!detail} title={detail ? `${detail.name}` : ""} sub={detail ? `${detail.id} · ${detail.version ?? "draft r1"} · ${SRC_LABEL[detail.source ?? "manual"]}` : undefined} onClose={() => setDetailId(null)}>
        {detail && (
          <div className="p-stack">
            <div className="p-wf-drawer-meta">
              <Badge tone={detail.status === "published" ? "ok" : "warn"}>{detail.status === "published" ? "已发布" : "草稿"}</Badge>
              <Badge tone={detail.enabled ? "ok" : "muted"}>{detail.enabled ? "已启用" : "未启用"}</Badge>
              <Badge tone="muted">{detail.trigger}</Badge>
              {detail.missing?.length ? <Badge tone="danger">{detail.missing.length} 项资源待补</Badge> : null}
            </div>

            <div className="p-card p-card-pad">
              <div className="p-row-between" style={{ marginBottom: 8 }}>
                <h3 className="p-side-h">运行历史</h3>
                <Button size="sm" icon={<Play size={12} />} onClick={() => runWorkflow(detail.id)}>模拟运行</Button>
              </div>
              {detail.runs.length === 0 ? (
                <p className="p-muted p-small" style={{ margin: 0 }}>还没有运行记录。启用后可以模拟运行一次。</p>
              ) : (
                <div className="p-lines">
                  {detail.runs.map((r) => (
                    <div key={r.id} className="p-line">
                      <div>
                        <b className="p-mono">{r.id}</b>
                        <span>{r.at}{r.failedNode ? ` · 失败于 ${r.failedNode}` : ""}</span>
                      </div>
                      <Badge tone={r.state === "ok" ? "ok" : r.state === "running" ? "active" : "danger"}>
                        {r.state === "ok" ? "成功" : r.state === "running" ? "运行中" : "失败"}
                      </Badge>
                      <em className="p-mono">{r.ms ? `${r.ms} ms` : "—"}</em>
                    </div>
                  ))}
                </div>
              )}
              {detail.runs[0]?.logs?.length ? (
                <div className="p-wf-logs">
                  <span className="p-cell-sub">执行日志 · {detail.runs[0].id}（模拟）</span>
                  {detail.runs[0].logs.map((l, i) => (
                    <div key={`${l.nodeId}-${i}`} className={`is-${l.level}`}>
                      <b>{l.nodeLabel}</b>
                      <span>{l.text}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="p-card p-card-pad">
              <h3 className="p-side-h"><History size={12} /> 操作记录</h3>
              {(detail.history ?? []).length === 0 ? (
                <p className="p-muted p-small" style={{ margin: 0 }}>还没有操作记录。</p>
              ) : (
                <div className="p-wf-history">
                  {(detail.history ?? []).slice(0, 8).map((h, i) => (
                    <div key={`${h.at}-${i}`}>
                      <span className={`p-wf-src is-${h.source}`}>{h.source === "copilot" ? "对话" : h.source === "canvas" ? "画布" : "系统"}</span>
                      <div>
                        <b>{h.text}</b>
                        <span className="p-cell-sub">{h.at} · {h.by} · r{h.rev}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-card p-card-pad">
              <h3 className="p-side-h">启停与执行</h3>
              <div className="p-inspector-actions">
                <Button size="sm" icon={<Power size={12} />} onClick={() => toggleWorkflowEnabled(detail.id)}>
                  {detail.enabled ? "停用流程" : "启用流程"}
                </Button>
                <Button size="sm" onClick={() => router.push(`/proto/workflows/${detail.id}`)}>打开画布</Button>
                {detail.status === "draft" && (
                  <Button size="sm" variant="primary" onClick={() => publishWorkflow(detail.id)}>发布</Button>
                )}
              </div>
              <p className="p-muted p-small" style={{ marginBottom: 0 }}>
                启用要求已发布且资源齐全；运行只写入模拟日志，不向真实设备下发命令。
              </p>
            </div>
          </div>
        )}
      </Drawer>

      <Dialog
        open={creating}
        title="新建工作流"
        confirmText="创建"
        onClose={() => setCreating(false)}
        onConfirm={() => {
          if (name.trim().length < 2) {
            setErr("名称至少 2 个字");
            return;
          }
          const wf = addWorkflow(name.trim(), trigger);
          setCreating(false);
          setName("");
          setErr("");
          router.push(`/proto/workflows/${wf.id}`);
        }}
      >
        <div className="p-form">
          <Field label="工作流名称" required error={err}>
            <TextInput value={name} onChange={(e) => { setName(e.target.value); setErr(""); }} placeholder="例如：任务完成后自动归档报告" />
          </Field>
          <Field label="触发方式" required>
            <Select value={trigger} onChange={(e) => setTrigger(e.target.value)}>
              <option value="事件创建">事件创建</option>
              <option value="任务完成">任务完成</option>
              <option value="人工触发">人工触发</option>
              <option value="定时调度">定时调度</option>
            </Select>
          </Field>
          <div className="p-note">更推荐在智能助手里用一句话生成草稿，再进画布细化。</div>
        </div>
      </Dialog>
    </div>
  );
}
