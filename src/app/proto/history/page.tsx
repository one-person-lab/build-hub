"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Download, History, MessageSquare, Search, Wrench } from "lucide-react";
import { Badge, Button, DataTable, EmptyState, Select, type Column } from "@/components/proto/ui";
import { useProto } from "@/lib/proto/store";
import { TASK_STATUS_LABEL, TASK_STATUS_TONE, type Session, type Task } from "@/lib/proto/data";

export default function HistoryPage() {
  const { state, toast } = useProto();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [mode, setMode] = useState("all");
  const [active, setActive] = useState<string>(state.sessions[0]?.id ?? "");

  const modes = useMemo(() => Array.from(new Set(state.sessions.map((s) => s.mode))), [state.sessions]);
  const sessions = useMemo(() => {
    const kw = q.trim();
    return state.sessions.filter((s) => (mode === "all" || s.mode === mode) && (!kw || s.title.includes(kw)));
  }, [state.sessions, q, mode]);

  const session: Session | undefined = state.sessions.find((s) => s.id === active) ?? sessions[0];

  const linkedTaskIds = useMemo(() => {
    const ids = new Set<string>();
    for (const m of session?.msgs ?? []) {
      const c = m.card;
      if (!c) continue;
      if (c.kind === "device" || c.kind === "askArea" || c.kind === "citations" || c.kind === "skill" || c.kind === "skillRun" || c.kind === "workflow") continue;
      if (c.kind === "taskList") c.taskIds.forEach((id) => ids.add(id));
      else ids.add(c.taskId);
    }
    return [...ids];
  }, [session]);

  const tasks = state.tasks.filter((t) => linkedTaskIds.includes(t.id));
  const traces = state.traces.filter((tr) => tr.taskId && linkedTaskIds.includes(tr.taskId));
  const failed = state.tasks.filter((t) => t.status === "failed");

  const taskCols: Column<Task>[] = [
    {
      key: "name",
      title: "任务",
      render: (t) => (
        <div>
          <b>{t.name}</b>
          <span className="p-cell-sub">{t.id}</span>
        </div>
      ),
    },
    {
      key: "status",
      title: "状态",
      width: "110px",
      render: (t) => <Badge tone={TASK_STATUS_TONE[t.status] as "warn"}>{TASK_STATUS_LABEL[t.status]}</Badge>,
    },
    { key: "at", title: "创建时间", render: (t) => <span className="p-mono">{t.createdAt}</span> },
    {
      key: "ops",
      title: "",
      width: "70px",
      render: (t) => <Link href={`/proto/tasks/${t.id}`} className="p-link">详情</Link>,
    },
  ];

  return (
    <div>
      <div className="p-page-head">
        <div>
          <h1>历史记录</h1>
          <p>对话会话、关联任务与工具调用的完整留痕，可回放与继续</p>
        </div>
        <div className="p-page-actions">
          <Button icon={<Download size={13} />} onClick={() => toast("已导出会话记录（模拟 JSON）", "ok")}>
            导出记录
          </Button>
        </div>
      </div>

      <div className="p-history">
        <div className="p-card p-history-side">
          <div className="p-chat-side-head">
            <div className="p-chat-search">
              <Search size={13} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索会话标题" />
            </div>
            <Select value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="all">全部类型</option>
              {modes.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </Select>
          </div>
          <div className="p-history-list">
            {sessions.map((s) => (
              <div key={s.id} className={`p-session${session?.id === s.id ? " is-active" : ""}`}>
                <button className="p-session-main" onClick={() => setActive(s.id)}>
                  <b>{s.title}</b>
                  <span>{s.at} · {s.mode} · {s.msgs.length} 条</span>
                </button>
              </div>
            ))}
            {sessions.length === 0 && <EmptyState title="没有匹配的会话" hint="换一个关键词或类型" />}
          </div>
        </div>

        <div className="p-stack">
          {session ? (
            <>
              <div className="p-card">
                <div className="p-card-head">
                  <div>
                    <h3>{session.title}</h3>
                    <p>{session.id} · {session.mode} · {session.at}</p>
                  </div>
                  <div className="p-page-actions">
                    <Badge tone="muted">{session.msgs.length} 条消息</Badge>
                    <Button
                      size="sm"
                      variant="primary"
                      icon={<MessageSquare size={12} />}
                      onClick={() => router.push(`/proto?session=${session.id}`)}
                    >
                      继续该会话
                    </Button>
                  </div>
                </div>
                <div className="p-transcript">
                  {session.msgs.map((m) => (
                    <div key={m.id} className={`p-transcript-item is-${m.role}`}>
                      <div className="p-transcript-role">
                        {m.role === "user" ? "用户" : m.role === "assistant" ? "Copilot" : "系统"}
                        <time>{m.at}</time>
                      </div>
                      <p>{m.text}</p>
                      {m.card && (
                        <div className="p-transcript-chip">
                          <History size={11} />
                          {m.card.kind === "device" && (
                            <Link href="/proto/map">设备卡片 · {m.card.deviceId}</Link>
                          )}
                          {m.card.kind === "askArea" && <Link href="/proto/map">区域圈选卡片</Link>}
                          {m.card.kind === "taskList" &&
                            m.card.taskIds.map((id) => (
                              <Link key={id} href={`/proto/tasks/${id}`}>{id}</Link>
                            ))}
                          {m.card.kind === "citations" && (
                            <Link href={`/proto/admin/traces/${m.traceId ?? ""}`}>引用卡片 · {m.card.runId}</Link>
                          )}
                          {m.card.kind === "skill" && (
                            <Link href={`/proto/admin/agents/skills/${m.card.skillId}`}>Skill 选择 · {m.card.skillId}</Link>
                          )}
                          {m.card.kind === "skillRun" && (
                            <Link href={`/proto/admin/traces/${m.traceId ?? ""}`}>Skill 执行 · {m.card.runId}</Link>
                          )}
                          {(m.card.kind === "plan" || m.card.kind === "confirm" || m.card.kind === "progress" || m.card.kind === "result") && (
                            <Link href={`/proto/tasks/${m.card.taskId}`}>
                              {m.card.kind === "plan" ? "计划卡片" : m.card.kind === "confirm" ? "确认卡片" : m.card.kind === "progress" ? "进度卡片" : "结果卡片"} · {m.card.taskId}
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-card p-card-pad">
                <div className="p-row-between">
                  <h3 className="p-side-h"><Wrench size={12} /> 工具调用</h3>
                  <span className="p-muted p-small">来自 Trace 记录</span>
                </div>
                {traces.length === 0 ? (
                  <p className="p-muted p-small">该会话没有产生工具调用记录。</p>
                ) : (
                  <div className="p-lines">
                    {traces.flatMap((tr) =>
                      tr.steps
                        .filter((s) => s.kind === "tool" || s.kind === "guard")
                        .map((s) => (
                          <div key={`${tr.id}-${s.key}`} className="p-line">
                            <div>
                              <b className="p-mono">{s.label}</b>
                              <span>{s.input}</span>
                            </div>
                            <Badge tone={s.state === "error" ? "danger" : "muted"}>{s.kind === "guard" ? "校验" : "工具"}</Badge>
                            <em className="p-mono">{s.ms} ms</em>
                          </div>
                        ))
                    )}
                  </div>
                )}
              </div>

              <div className="p-card">
                <div className="p-card-head">
                  <h3>关联任务</h3>
                  <Link href={`/proto/tasks`} className="p-link p-small">全部任务</Link>
                </div>
                <DataTable columns={taskCols} rows={tasks} rowKey={(t) => t.id} empty="该会话没有关联任务" />
              </div>
            </>
          ) : (
            <div className="p-card p-card-pad">
              <EmptyState title="选择左侧会话" hint="查看消息回放、关联任务与工具调用" />
            </div>
          )}

          <div className="p-card">
            <div className="p-card-head">
              <h3>近期失败任务</h3>
              <Link href="/proto/tasks" className="p-link p-small">去任务中心</Link>
            </div>
            <DataTable
              columns={[
                ...taskCols.slice(0, 3),
                {
                  key: "reason",
                  title: "失败原因",
                  render: (t) => <span className="p-muted">{t.note ?? "—"}</span>,
                },
                {
                  key: "ops",
                  title: "",
                  width: "70px",
                  render: (t) => <Link href={`/proto/admin/traces/${t.traceId}`} className="p-link">Trace</Link>,
                },
              ]}
              rows={failed}
              rowKey={(t) => t.id}
              empty="近 7 天没有失败任务"
            />
          </div>
        </div>
      </div>

      <p className="p-muted p-footnote">
        历史记录只读；需要重新执行请在任务中心基于原计划创建新任务。
      </p>
    </div>
  );
}

