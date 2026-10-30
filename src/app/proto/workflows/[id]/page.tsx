"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bot, CheckCircle2, CircleAlert, GitBranch, History, MessageSquare, Play, Power, Save, Send, Trash2, Zap } from "lucide-react";
import { Badge, Button, Dialog, Field, Select, TextInput } from "@/components/proto/ui";
import { useProto } from "@/lib/proto/store";
import type { NodeType, Workflow, WorkflowNode } from "@/lib/proto/data";
import { workflowIssues } from "@/lib/proto/workflow-data";

const NODE_META: Record<NodeType, { label: string; tone: string }> = {
  trigger: { label: "触发器", tone: "violet" },
  query: { label: "查询", tone: "sky" },
  branch: { label: "判断", tone: "amber" },
  guard: { label: "安全校验", tone: "rose" },
  ai: { label: "AI 分析", tone: "cyan" },
  action: { label: "业务动作", tone: "emerald" },
  approve: { label: "人工审批", tone: "rose" },
  end: { label: "结束", tone: "slate" },
};

const CHANNELS = ["属地-滨江群", "管理群", "安全科邮件组", "值班长短信"];

export default function WorkflowDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { state, saveWorkflowGraph, saveWorkflowDraft, saveWorkflowNode, publishWorkflow, runWorkflow, validateWorkflow, toggleWorkflowEnabled, bindWorkflowResource, toast } = useProto();
  const wf = state.workflows.find((w) => w.id === decodeURIComponent(params.id));

  const [nodes, setNodes] = useState<WorkflowNode[]>(wf?.nodes ?? []);
  const [edges, setEdges] = useState<Workflow["edges"]>(wf?.edges ?? []);
  const [selected, setSelected] = useState<string | null>(wf?.nodes[0]?.id ?? null);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [connectOpen, setConnectOpen] = useState(false);
  const [target, setTarget] = useState("");
  const [publishOpen, setPublishOpen] = useState(false);
  const [validateOpen, setValidateOpen] = useState(false);
  const dragRef = useRef<{ id: string; dx: number; dy: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const syncedRev = useRef<number | undefined>(wf?.rev);

  useEffect(() => {
    if (!wf) return;
    if (syncedRev.current === wf.rev) return;
    syncedRev.current = wf.rev;
    setNodes(wf.nodes);
    setEdges(wf.edges);
    setSelected((cur) => (wf.nodes.some((n) => n.id === cur) ? cur : wf.nodes[0]?.id ?? null));
  }, [wf]);

  if (!wf) {
    return (
      <div className="p-card p-card-pad">
        <b>工作流不存在</b>
        <p className="p-muted">演示数据可能已被重置。</p>
        <Button onClick={() => router.push("/proto/workflows")}>返回工作流列表</Button>
      </div>
    );
  }

  const node = nodes.find((n) => n.id === selected) ?? null;
  const issues = workflowIssues({ ...wf, nodes, edges }).filter((i) => !(i.text === "流程未启用，模拟运行会被拦截" && wf.enabled));

  const updateNode = (id: string, patch: Partial<WorkflowNode>) => {
    setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, ...patch } : n)));
  };

  const onMouseMove = (e: React.MouseEvent) => {
    const d = dragRef.current;
    const box = canvasRef.current;
    if (!d || !box) return;
    const rect = box.getBoundingClientRect();
    const x = Math.max(8, Math.min(rect.width - 170, e.clientX - rect.left - d.dx));
    const y = Math.max(8, Math.min(rect.height - 70, e.clientY - rect.top - d.dy));
    updateNode(d.id, { x: Math.round(x), y: Math.round(y) });
  };

  const addNode = (type: NodeType) => {
    const id = `n${nodes.length + 1}-${Date.now().toString(36).slice(-3)}`;
    const n: WorkflowNode = {
      id,
      type,
      label: NODE_META[type].label,
      x: 40 + (nodes.length % 3) * 190,
      y: 200 + Math.floor(nodes.length / 3) * 84,
      config: "",
    };
    setNodes([...nodes, n]);
    setSelected(id);
    toast(`已添加${NODE_META[type].label}节点`, "ok");
  };

  const saveGraph = () => {
    saveWorkflowDraft(wf.id, nodes, edges);
    toast("画布已保存到草稿", "ok");
  };

  const runValidation = () => {
    setValidateOpen(true);
    validateWorkflow(wf.id, { nodes, edges });
  };

  const publish = () => {
    if (issues.some((i) => i.level === "error")) {
      toast("存在校验错误，无法发布", "danger");
      setPublishOpen(false);
      setValidateOpen(true);
      return;
    }
    saveWorkflowGraph(wf.id, nodes, edges);
    publishWorkflow(wf.id);
    setPublishOpen(false);
  };

  const errorCount = issues.filter((i) => i.level === "error").length;
  const missing = wf.missing ?? [];

  return (
    <div>
      <div className="p-crumb">
        <Link href="/proto/workflows">工作流</Link>
        <span>/</span>
        <span>{wf.id}</span>
      </div>

      <div className="p-page-head">
        <div>
          <h1>{wf.name}</h1>
          <p>
            {wf.id} · 触发：{wf.trigger} · {nodes.length} 个节点 · {wf.version ?? "draft r1"}
          </p>
        </div>
        <div className="p-page-actions">
          <Badge tone={wf.source === "copilot" ? "brand" : "muted"}>{wf.source === "copilot" ? "Copilot 生成" : "手动创建"}</Badge>
          <Badge tone={wf.status === "published" ? "ok" : "warn"}>{wf.status === "published" ? "已发布" : "草稿"}</Badge>
          <Badge tone={wf.enabled ? "ok" : "muted"}>{wf.enabled ? "已启用" : "未启用"}</Badge>
          {missing.length > 0 && <Badge tone="danger">{missing.length} 项资源待补</Badge>}
          {wf.originSession && (
            <Link href={`/proto?session=${wf.originSession}`} className="p-btn p-btn-ghost p-btn-md">
              <MessageSquare size={13} /> 回到对话
            </Link>
          )}
          <Button icon={<CircleAlert size={13} />} onClick={runValidation}>校验</Button>
          <Button icon={<Save size={13} />} onClick={saveGraph}>保存草稿</Button>
          <Button icon={<Play size={13} />} onClick={() => runWorkflow(wf.id)}>模拟运行</Button>
          {wf.status === "published" ? (
            <Button
              icon={<Power size={13} />}
              onClick={() => toggleWorkflowEnabled(wf.id)}
            >
              {wf.enabled ? "停用" : "启用"}
            </Button>
          ) : (
            <Button variant="primary" icon={<Send size={13} />} onClick={() => setPublishOpen(true)}>发布</Button>
          )}
        </div>
      </div>

      {wf.source === "copilot" && (
        <div className="p-wf-banner">
          <Bot size={14} />
          <span>
            由 Copilot 从对话生成：对话和画布共享同一份草稿（{wf.version ?? "draft r1"} · 更新于 {wf.updatedAt ?? "—"}）。生成不会自动启用或执行。
          </span>
          {wf.originSession && (
            <Link href={`/proto?session=${wf.originSession}`} className="p-link p-small">
              继续用对话修改
            </Link>
          )}
        </div>
      )}

      <div className="p-flow-wrap">
        <div className="p-card p-flow-card">
          <div className="p-card-head">
            <div>
              <h3>流程画布</h3>
              <p>拖动节点调整位置 · 单击节点编辑配置</p>
            </div>
            <div className="p-node-types">
              {(["trigger", "query", "branch", "ai", "action", "guard", "approve", "end"] as NodeType[]).map((t) => (
                <button key={t} onClick={() => addNode(t)}>
                  <i className={`p-nt p-nt-${NODE_META[t].tone}`} />
                  {NODE_META[t].label}
                </button>
              ))}
            </div>
          </div>
          <div
            className="p-flow-canvas"
            ref={canvasRef}
            onMouseMove={onMouseMove}
            onMouseUp={() => {
              dragRef.current = null;
            }}
            onMouseLeave={() => {
              dragRef.current = null;
            }}
          >
            <svg className="p-flow-edges">
              {edges.map((e, i) => {
                const a = nodes.find((n) => n.id === e.from);
                const b = nodes.find((n) => n.id === e.to);
                if (!a || !b) return null;
                const drop = b.y - a.y > 90;
                const x1 = drop ? a.x + 75 : a.x + 150;
                const y1 = drop ? a.y + 66 : a.y + 27;
                const x2 = drop ? b.x + 75 : b.x;
                const y2 = drop ? b.y : b.y + 27;
                const mid = (x1 + x2) / 2;
                const midY = (y1 + y2) / 2;
                const path = drop
                  ? `M${x1} ${y1} C${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`
                  : `M${x1} ${y1} C${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`;
                return (
                  <g key={i}>
                    <path d={path} fill="none" stroke="#b7c3d5" strokeWidth="1.6" />
                    <circle cx={x2} cy={y2} r="2.6" fill="#b7c3d5" />
                    {e.label && (
                      <text x={mid} y={midY - 4} textAnchor="middle" className="p-flow-edge-label">
                        {e.label}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
            {nodes.map((n) => (
              <div
                key={n.id}
                className={`p-flow-node${selected === n.id ? " is-selected" : ""}`}
                style={{ left: n.x, top: n.y }}
                onMouseDown={(e) => {
                  setSelected(n.id);
                  dragRef.current = { id: n.id, dx: e.clientX - n.x - (canvasRef.current?.getBoundingClientRect().left ?? 0), dy: e.clientY - n.y - (canvasRef.current?.getBoundingClientRect().top ?? 0) };
                }}
                onClick={() => setSelected(n.id)}
              >
                <div className="p-flow-node-head">
                  <i className={`p-nt p-nt-${NODE_META[n.type].tone}`} />
                  <em>{NODE_META[n.type].label}</em>
                </div>
                <b>{n.label}</b>
                <span>{n.config || "未配置"}</span>
              </div>
            ))}
          </div>
        </div>

        <aside className="p-stack">
          {node ? (
            <div className="p-card p-card-pad">
              <div className="p-inspector-head">
                <h3 className="p-side-h">{NODE_META[node.type].label}配置</h3>
                <Badge tone="muted">{node.id}</Badge>
              </div>
              <div className="p-form">
                <Field label="节点名称">
                  <TextInput value={node.label} onChange={(e) => updateNode(node.id, { label: e.target.value })} />
                </Field>
                <Field label="参数 / 配置" hint="模拟配置，保存时写入草稿">
                  <TextInput
                    value={node.config}
                    placeholder="例如 tool = device.get_status"
                    onChange={(e) => updateNode(node.id, { config: e.target.value })}
                  />
                </Field>
                {node.type === "action" && /通知/.test(node.label) && (
                  <Field label="通知渠道（绑定业务资源）" hint="绑定后该资源不再显示待补充">
                    <Select
                      value={CHANNELS.find((c) => node.config.includes(c)) ?? ""}
                      onChange={(e) => {
                        if (e.target.value) bindWorkflowResource(wf.id, node.id, e.target.value);
                      }}
                    >
                      <option value="">选择通知渠道</option>
                      {CHANNELS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </Select>
                  </Field>
                )}
                <div className="p-inspector-actions">
                  <Button size="sm" icon={<GitBranch size={12} />} onClick={() => { setConnectFrom(node.id); setTarget(""); setConnectOpen(true); }}>
                    连线到…
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<Trash2 size={12} />}
                    onClick={() => {
                      setNodes(nodes.filter((n) => n.id !== node.id));
                      setEdges(edges.filter((e) => e.from !== node.id && e.to !== node.id));
                      setSelected(null);
                    }}
                  >
                    删除
                  </Button>
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    saveWorkflowNode(wf.id, node.id, node.label, node.config);
                    saveWorkflowGraph(wf.id, nodes, edges);
                  }}
                >
                  保存节点
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-card p-card-pad p-muted">选择画布上的节点开始配置</div>
          )}

          <div className="p-card p-card-pad">
            <div className="p-row-between" style={{ marginBottom: 8 }}>
              <h3 className="p-side-h">校验</h3>
              {issues.length > 0 && (
                <Badge tone={errorCount ? "danger" : "warn"}>{errorCount ? `${errorCount} 个错误` : `${issues.length} 条提示`}</Badge>
              )}
            </div>
            {issues.length === 0 ? (
              <div className="p-ok-line">
                <CheckCircle2 size={14} /> 可以发布
              </div>
            ) : (
              <ul className="p-issue-list">
                {issues.map((it, i) => (
                  <li key={i} className={`is-${it.level}`}>
                    <CircleAlert size={13} /> {it.text}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="p-card p-card-pad">
            <h3 className="p-side-h">业务资源引用</h3>
            {(wf.resources ?? []).length === 0 ? (
              <p className="p-muted p-small" style={{ margin: 0 }}>这个流程还没有引用业务资源。</p>
            ) : (
              <ul className="p-wf-resources">
                {(wf.resources ?? []).map((r, i) => (
                  <li key={`${r.label}-${i}`}>
                    <span className={`p-wf-resource-dot is-${r.state}`} />
                    <div>
                      <b>{r.label}</b>
                      <span className="p-cell-sub">{r.note ?? (r.state === "linked" ? "已绑定（模拟）" : "待补充")}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="p-card p-card-pad">
            <div className="p-row-between" style={{ marginBottom: 8 }}>
              <h3 className="p-side-h"><History size={12} /> 变更记录</h3>
              <span className="p-muted p-small">{wf.history?.length ?? 0} 条</span>
            </div>
            {(wf.history ?? []).length === 0 ? (
              <p className="p-muted p-small" style={{ margin: 0 }}>还没有变更记录。</p>
            ) : (
              <div className="p-wf-history">
                {(wf.history ?? []).slice(0, 6).map((h, i) => (
                  <div key={`${h.at}-${i}`}>
                    <span className={`p-wf-src is-${h.source}`}>{h.source === "copilot" ? "对话" : h.source === "canvas" ? "画布" : "系统"}</span>
                    <div>
                      <b>{h.text}</b>
                      <span className="p-cell-sub">
                        {h.at} · {h.by} · r{h.rev}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-card">
            <div className="p-card-head">
              <h3>运行记录</h3>
              <span className="p-muted">{wf.runs.length} 次</span>
            </div>
            {wf.runs.length === 0 ? (
              <p className="p-card-pad p-muted" style={{ margin: 0 }}>还没有运行记录</p>
            ) : (
              <div className="p-lines">
                {wf.runs.map((r) => (
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
            {wf.runs.length > 0 && wf.runs[0].logs?.length ? (
              <div className="p-wf-logs">
                <span className="p-cell-sub">最近一次执行日志（模拟）</span>
                {wf.runs[0].logs.map((l, i) => (
                  <div key={`${l.nodeId}-${i}`} className={`is-${l.level}`}>
                    <b>{l.nodeLabel}</b>
                    <span>{l.text}</span>
                  </div>
                ))}
              </div>
            ) : null}
            <div className="p-card-pad p-tight">
              <Button size="sm" icon={<Zap size={12} />} onClick={() => runWorkflow(wf.id)}>模拟运行一次</Button>
            </div>
          </div>
        </aside>
      </div>

      <Dialog
        open={connectOpen}
        title="连线"
        confirmText="添加连线"
        onClose={() => setConnectOpen(false)}
        onConfirm={() => {
          if (!connectFrom || !target) return;
          setEdges([...edges, { from: connectFrom, to: target }]);
          setConnectOpen(false);
          toast("连线已添加", "ok");
        }}
      >
        <Field label="目标节点" required>
          <Select value={target} onChange={(e) => setTarget(e.target.value)}>
            <option value="">请选择</option>
            {nodes.filter((n) => n.id !== connectFrom).map((n) => (
              <option key={n.id} value={n.id}>{NODE_META[n.type].label} · {n.label}</option>
            ))}
          </Select>
        </Field>
      </Dialog>

      <Dialog
        open={validateOpen}
        title="流程校验"
        confirmText="知道了"
        onClose={() => setValidateOpen(false)}
        onConfirm={() => setValidateOpen(false)}
      >
        {issues.length === 0 ? (
          <div className="p-ok-line"><CheckCircle2 size={14} /> 触发器、节点、连线与结束节点均正常</div>
        ) : (
          <ul className="p-issue-list">
            {issues.map((it, i) => (
              <li key={i} className={`is-${it.level}`}><CircleAlert size={13} /> {it.text}</li>
            ))}
          </ul>
        )}
      </Dialog>

      <Dialog open={publishOpen} title="发布工作流？" confirmText="发布" onClose={() => setPublishOpen(false)} onConfirm={publish}>
        发布会把当前画布保存为新版本，并替换线上运行的版本。已在运行的实例不受影响。
      </Dialog>
    </div>
  );
}
