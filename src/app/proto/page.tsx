"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  Paperclip,
  Pencil,
  Plus,
  Search,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";
import { MapCanvas, type Layers } from "@/components/proto/MapCanvas";
import { Badge, Button, Dialog, Field, Select, TextInput, Drawer } from "@/components/proto/ui";
import { useProto } from "@/lib/proto/store";
import {
  AREAS,
  DEVICES,
  LEVEL_LABEL,
  TASK_STATUS_LABEL,
  TASK_STATUS_TONE,
  deviceById,
  routeById,
  type Area,
  type ChatMsg,
  type Pos,
  type Task,
} from "@/lib/proto/data";
import { RAG_PATH_LABEL } from "@/lib/proto/rag-data";
import {
  SKILL_STEP_LABEL,
  matchSkill,
  publishedVersion,
  toolById,
  toolSourceLabel,
} from "@/lib/proto/skill-data";
import { isWorkflowRequest, looksLikeWorkflowEdit } from "@/lib/proto/workflow-data";

const CHIPS = [
  "M350-01 为什么提示电池温度异常？",
  "消防通道多宽算占用？",
  "诊断 M350-01 的电池高温告警",
  "巡检这个区域的消防通道",
  "今天有哪些任务执行失败？",
];

const WF_CHIPS = [
  "每天早上 8 点巡检 A 区，完成后做异常分析并通知我",
  "再增加邮件通知",
  "改成每周一 9 点执行",
];

const KNOWLEDGE_RE = /手册|规程|规范|标准|多久|间隔|多宽|多少|保养|维护|申报|空域|权限|谁确认|依据|条款|流程|为什么|原因/;
const TASK_RE = /巡检|巡查|排查|执行|飞|规划|下发|取消这个/;

const LAYERS: Layers = { devices: true, areas: true, routes: false, events: false, docks: true };

function hashArea(points: Pos[]): Area {
  const cx = points.reduce((s, p) => s + p.x, 0) / points.length;
  const cy = points.reduce((s, p) => s + p.y, 0) / points.length;
  let best = AREAS[0];
  let bestD = Infinity;
  for (const a of AREAS) {
    const ax = a.polygon.reduce((s, p) => s + p.x, 0) / a.polygon.length;
    const ay = a.polygon.reduce((s, p) => s + p.y, 0) / a.polygon.length;
    const d = (ax - cx) ** 2 + (ay - cy) ** 2;
    if (d < bestD) {
      bestD = d;
      best = a;
    }
  }
  return best;
}

function polygonMu(points: Pos[]) {
  let s = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    s += a.x * b.y - b.x * a.y;
  }
  return Math.max(1, Math.round(Math.abs(s / 2) / 260));
}

function timeNow() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function AssistantPage() {
  const proto = useProto();
  const { state } = proto;
  const [sid, setSid] = useState<string>("S-101");
  const [input, setInput] = useState("");
  const [q, setQ] = useState("");
  const [rename, setRename] = useState<string | null>(null);
  const [renameText, setRenameText] = useState("");
  const [removing, setRemoving] = useState<string | null>(null);
  const [paramTask, setParamTask] = useState<string | null>(null);
  const [cancelTask, setCancelTask] = useState<string | null>(null);
  const [thinking, setThinking] = useState(false);
  const [wfMode, setWfMode] = useState(false);
  const [pendingSkill, setPendingSkill] = useState<{ skillId: string; versionId: string } | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const session = state.sessions.find((s) => s.id === sid) ?? null;
  const sessions = state.sessions.filter((s) => !q || s.title.includes(q) || s.mode.includes(q));

  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get("session");
    if (wanted && proto.state.sessions.some((x) => x.id === wanted)) setSid(wanted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [session?.msgs.length, thinking]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const respond = (sessionId: string, text: string) => {
    setThinking(true);
    const knowledge = KNOWLEDGE_RE.test(text) && !TASK_RE.test(text);
    const withDevice = knowledge && /M350|UAV|设备|无人机/.test(text);
    const activeWorkflowId = state.sessions.find((s) => s.id === sessionId)?.workflowId;
    const editLead = /^(再|把|将|改|加|删|去|补|换|调)/.test(text.trim());
    const workflowEdit = !!activeWorkflowId && looksLikeWorkflowEdit(text) && (!isWorkflowRequest(text) || editLead);
    const workflowCreate = !workflowEdit && isWorkflowRequest(text);
    const t = setTimeout(() => {
      setThinking(false);
      if (workflowCreate) {
        const res = proto.createWorkflowFromPrompt(text, { sessionId });
        if (!res) return;
        proto.addMsg(sessionId, {
          role: "assistant",
          text: res.reply,
          at: timeNow(),
          path: "agent",
          traceId: res.traceId,
          card: { kind: "workflow", workflowId: res.workflow.id, created: true },
        });
        return;
      }
      if (workflowEdit && activeWorkflowId) {
        const res = proto.modifyWorkflowFromPrompt(activeWorkflowId, text);
        if (!res) return;
        proto.addMsg(sessionId, {
          role: "assistant",
          text: res.reply,
          at: timeNow(),
          path: "agent",
          traceId: res.traceId || undefined,
          card: { kind: "workflow", workflowId: res.workflow.id },
        });
        return;
      }
      if (looksLikeWorkflowEdit(text) && !activeWorkflowId) {
        proto.addMsg(sessionId, {
          role: "assistant",
          text: "这个会话里还没有工作流草稿。先描述一条周期性或触发式需求，例如「每天早上 8 点巡检 A 区，完成后做异常分析并通知我」，我再基于草稿继续修改。",
          at: timeNow(),
          path: "agent",
        });
        return;
      }
      if (wfMode && !workflowCreate) {
        proto.addMsg(sessionId, {
          role: "assistant",
          text: "我可以把周期性或触发式需求变成工作流草稿，再和你在画布里继续调整。试着说「每天早上 8 点巡检 A 区，完成后分析异常并通知我」。草稿只保存，不会自动启用或执行。",
          at: timeNow(),
          path: "agent",
        });
        return;
      }
      if (knowledge) {
        const run = proto.runRetrieval(text, {
          sessionId,
          path: withDevice ? "rag+tool" : "rag",
          toolCall: withDevice
            ? { toolId: "device.get_status", summary: "M350-01 · 在线 · 电池温度 48.6℃ · 告警阈值 45℃" }
            : undefined,
        });
        proto.addMsg(sessionId, {
          role: "assistant",
          text: run.answer,
          at: timeNow(),
          path: run.path,
          traceId: run.traceId,
          card: { kind: "citations", runId: run.id },
        });
        return;
      }
      const match = matchSkill(text);
      if (match) {
        const version = publishedVersion(match.skill);
        proto.addMsg(sessionId, {
          role: "assistant",
          text: `这类诉求对应 Skill「${match.skill.name}」${version.version}（置信度 ${match.confidence}）。它会按固定步骤编排工具，并在高风险动作前停下来等人确认；工具本身仍然经过业务服务的权限与安全校验。`,
          at: timeNow(),
          path: "agent",
          card: { kind: "skill", skillId: match.skill.id, confidence: match.confidence },
        });
        if (match.skill.id === "SK-FIRE-LANE") {
          setPendingSkill({ skillId: match.skill.id, versionId: version.id });
          const t2 = setTimeout(() => {
            proto.addMsg(sessionId, {
              role: "assistant",
              text: "先确认作业范围：在下方地图圈出要巡检的区域（至少 3 个点），或直接选择已登记区域。",
              at: timeNow(),
              path: "agent",
              card: { kind: "askArea" },
            });
          }, 420);
          timers.current.push(t2);
          return;
        }
        const run = proto.runSkill(match.skill.id, text, { sessionId });
        if (!run) return;
        const t3 = setTimeout(() => {
          proto.addMsg(sessionId, {
            role: "assistant",
            text: run.answer,
            at: timeNow(),
            path: "agent",
            traceId: run.traceId,
            card: { kind: "skillRun", runId: run.id },
          });
        }, 620);
        timers.current.push(t3);
        return;
      }
      if (/告警|温度|电池|为什么|怎么/.test(text)) {
        proto.addMsg(sessionId, {
          role: "assistant",
          text: "M350-01 电池温度 48.6℃，已超过建议上限 45℃，因此平台会持续提示「电池温度异常」。常见原因是连续架次间隔不足 10 分钟。建议停机冷却 15 分钟，并检查机臂散热孔是否被遮挡。",
          at: timeNow(),
          path: "tool",
          card: { kind: "device", deviceId: "UAV-03", alert: "电池温度 48.6℃ · 阈值 45℃" },
        });
      } else if (/失败|哪些任务|今天|状态/.test(text)) {
        const failed = state.tasks.filter((t) => t.status === "failed");
        proto.addMsg(sessionId, {
          role: "assistant",
          text: `今天一共 ${state.tasks.filter((t) => t.createdAt.startsWith("2026-10-28") || t.status === "failed").length} 个相关任务，其中 ${failed.length} 个失败：T-20261028-05（设备离线 51002）、T-20261026-09（工具调用超时 42003）。点开可查看失败步骤。`,
          at: timeNow(),
          path: "tool",
          card: { kind: "taskList", taskIds: failed.map((t) => t.id) },
        });
      } else if (/调整|修改|高度|参数/.test(text)) {
        const target = [...state.tasks].reverse().find((t) => t.status === "pending_confirm");
        if (!target) {
          proto.addMsg(sessionId, {
            role: "assistant",
            text: "当前没有可修改的待确认计划。你可以先描述一次巡检，例如「巡检滨江东路消防通道」，我会生成计划后再调整参数。",
            at: timeNow(),
            path: "agent",
          });
        } else {
          const m = text.match(/(\d{2,3})\s*(米|m)/i);
          if (!m) {
            proto.addMsg(sessionId, {
              role: "assistant",
              text: "请告诉我具体高度，范围 20–120 米。例如「把高度调整到 65 米」。",
              at: timeNow(),
              path: "agent",
            });
          } else {
            const alt = Number(m[1]);
            if (alt < 20 || alt > 120) {
              proto.addMsg(sessionId, {
                role: "assistant",
                text: `高度 ${alt} 米超出允许范围（20–120 米），请重新指定。`,
                at: timeNow(),
                path: "agent",
              });
            } else {
              proto.updatePlan(target.id, { alt });
              proto.addMsg(sessionId, {
                role: "assistant",
                text: `已把计划高度调整为 ${alt} 米，并重新完成安全校验。请再次确认后下发。`,
                at: timeNow(),
                path: "agent",
                card: { kind: "plan", taskId: target.id },
              });
            }
          }
        }
      } else if (/巡检|巡查|排查|检查|飞/.test(text)) {
        proto.addMsg(sessionId, {
          role: "assistant",
          text: "明白。先确认作业范围：你可以在下方地图里圈出要巡检的区域（至少 3 个点），也可以直接选择已登记区域。",
          at: timeNow(),
          path: "agent",
          card: { kind: "askArea" },
        });
      } else {
        proto.addMsg(sessionId, {
          role: "assistant",
          text: "我可以帮你：① 规划并执行巡检任务；② 查询任务与设备状态；③ 解释告警；④ 查找历史作业记录。你可以直接说想做什么。",
          at: timeNow(),
        });
      }
    }, 520);
    timers.current.push(t);
  };

  const send = (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text) return;
    let sessionId = sid;
    if (!session) {
      const s = proto.createSession(text.slice(0, 14), wfMode ? "工作流搭建" : "新会话");
      sessionId = s.id;
      setSid(s.id);
    }
    proto.addMsg(sessionId, { role: "user", text, at: timeNow() });
    setInput("");
    respond(sessionId, text);
  };

  const pickArea = (area: Area, drawn: Pos[]) => {
    if (!session) return;
    const device = DEVICES.find((d) => d.status === "online" && d.battery >= 40) ?? DEVICES[1];
    proto.addMsg(session.id, {
      role: "system",
      text: `已圈选区域「${area.name}」，面积 ${polygonMu(drawn)} 亩（登记面积 ${area.mu} 亩）`,
      at: timeNow(),
    });
    const skillPick = pendingSkill;
    setPendingSkill(null);
    if (skillPick?.skillId === "SK-ROUTE-PLAN") {
      const run = proto.runSkill(skillPick.skillId, `为「${area.name}」规划航线`, {
        versionId: skillPick.versionId,
        sessionId: session.id,
      });
      if (!run) return;
      const tr = setTimeout(() => {
        proto.addMsg(session.id, {
          role: "assistant",
          text: run.answer,
          at: timeNow(),
          path: "agent",
          traceId: run.traceId,
          card: { kind: "skillRun", runId: run.id },
        });
      }, 620);
      timers.current.push(tr);
      return;
    }
    const task = proto.createPlan({
      area,
      deviceId: device.id,
      alt: 55,
      speed: 6,
      lens: "双光",
      sessionId: session.id,
      skillId: skillPick?.skillId,
      skillVersionId: skillPick?.versionId,
    });
    const skill = skillPick ? state.skills.items.find((x) => x.id === skillPick.skillId) : undefined;
    const skillVersion = skill && skillPick ? skill.versions.find((v) => v.id === skillPick.versionId) : undefined;
    const t = setTimeout(() => {
      proto.addMsg(session.id, {
        role: "assistant",
        text: `已按 Skill「${skill?.name ?? "巡检"}」${skillVersion?.version ?? ""} 生成任务计划 ${task.planVersion}：区域「${area.name}」，执行设备 ${device.name}（电量 ${device.battery}%），航线 ${routeById(task.routeId)?.id} ${routeById(task.routeId)?.version}，共 ${routeById(task.routeId)?.waypoints.length} 个航点。前置校验已完成，下一步是人工确认——下发动作不会自己发生。`,
        at: timeNow(),
        card: { kind: "plan", taskId: task.id },
      });
    }, 650);
    timers.current.push(t);
  };

  const paramTaskObj = state.tasks.find((t) => t.id === paramTask) ?? null;

  return (
    <div className="p-assistant">
      <aside className="p-chat-side">
        <div className="p-chat-side-head">
          <Button variant="primary" icon={<Plus size={14} />} onClick={() => setSid("")}>
            新建会话
          </Button>
          <div className="p-chat-search">
            <Search size={13} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索会话" />
          </div>
        </div>
        <div className="p-chat-sessions">
          {sessions.map((s) => (
            <div key={s.id} className={`p-session${s.id === sid ? " is-active" : ""}`}>
              <button className="p-session-main" onClick={() => setSid(s.id)}>
                <b>{s.title}</b>
                <span>
                  <em>{s.mode}</em>
                  {s.at.slice(5, 16)}
                </span>
              </button>
              <div className="p-session-actions">
                <button
                  aria-label="重命名"
                  onClick={() => {
                    setRename(s.id);
                    setRenameText(s.title);
                  }}
                >
                  <Pencil size={12} />
                </button>
                <button aria-label="删除" onClick={() => setRemoving(s.id)}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
          {sessions.length === 0 && <p className="p-chat-empty">没有匹配的会话</p>}
        </div>
        <div className="p-chat-side-foot">
          <Sparkles size={12} />
          <span>Agent 1.4.2 · 模拟环境</span>
        </div>
      </aside>

      <section className="p-chat">
        <header className="p-chat-head">
          <div>
            <h1>{session?.title ?? "新会话"}</h1>
            <p>
              {session ? `${session.mode} · ${session.msgs.length} 条消息` : "描述你要做的事，由 Copilot 理解、规划并跟踪执行"}
            </p>
          </div>
          {session && (
            <div className="p-chat-head-right">
              <Badge tone="brand">统一入口</Badge>
              <Link href="/proto/history" className="p-btn p-btn-ghost p-btn-sm">
                历史记录
              </Link>
            </div>
          )}
        </header>

        <div className="p-chat-list" ref={listRef}>
          {!session && (
            <div className="p-chat-welcome">
              <div className="p-chat-welcome-mark">
                <Sparkles size={20} />
              </div>
              <h2>有什么可以帮你？</h2>
              <p>
                描述任务、查设备状态，或问制度与操作规范。知识问题会检索知识库并标注引用，设备状态走业务平台，
                未确认的飞行动作一定先给确认卡。
              </p>
            </div>
          )}
          {session?.msgs.map((m) => (
            <Message key={m.id} msg={m} onPickArea={pickArea} onEdit={setParamTask} onCancelPlan={setCancelTask} />
          ))}
          {thinking && (
            <div className="p-msg is-assistant">
              <div className="p-msg-avatar">
                <Sparkles size={13} />
              </div>
              <div className="p-typing">
                <i />
                <i />
                <i />
              </div>
            </div>
          )}
        </div>

        <div className="p-composer">
          <div className="p-composer-modes">
            <button className={!wfMode ? "is-active" : ""} onClick={() => setWfMode(false)}>
              即时任务
            </button>
            <button className={wfMode ? "is-active" : ""} onClick={() => setWfMode(true)}>
              搭建工作流
            </button>
            {session?.workflowId && (
              <Link href={`/proto/workflows/${session.workflowId}`} className="p-link p-small">
                当前草稿 {session.workflowId}
              </Link>
            )}
            <span className="p-composer-note">{wfMode ? "草稿只保存，不自动执行" : ""}</span>
          </div>
          <div className="p-chips">
            {(wfMode ? WF_CHIPS : CHIPS).map((c) => (
              <button key={c} onClick={() => send(c)}>
                {c}
              </button>
            ))}
          </div>
          <div className="p-composer-box">
            <textarea
              value={input}
              placeholder={
                wfMode
                  ? "例如：每天早上 8 点巡检 A 区，完成后分析异常并通知我"
                  : "例如：巡检这个区域的消防通道（Enter 发送，Shift + Enter 换行）"
              }
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <div className="p-composer-tools">
              <button
                className="p-composer-icon"
                onClick={() => proto.toast("原型未接入文件上传，可演示附件入口", "info")}
                aria-label="附件"
              >
                <Paperclip size={15} />
              </button>
              <span className="p-composer-note">所有飞行操作需人工确认</span>
              <Button variant="primary" size="sm" icon={<Send size={13} />} disabled={!input.trim()} onClick={() => send()}>
                发送
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Drawer
        open={!!paramTaskObj}
        title="修改任务参数"
        sub={paramTaskObj ? `${paramTaskObj.name} · 当前 ${paramTaskObj.planVersion}` : undefined}
        onClose={() => setParamTask(null)}
      >
        {paramTaskObj && <PlanForm task={paramTaskObj} onSave={(patch) => { proto.updatePlan(paramTaskObj.id, patch); setParamTask(null); }} />}
      </Drawer>

      <Dialog
        open={!!cancelTask}
        title="取消这个计划？"
        confirmText="取消计划"
        cancelText="保留"
        danger
        onClose={() => setCancelTask(null)}
        onConfirm={() => {
          if (cancelTask) proto.cancelPlan(cancelTask);
          setCancelTask(null);
        }}
      >
        计划还未下发，取消不会影响任何设备。取消后任务会以「已取消」状态保留在任务中心，可以重新发起。
      </Dialog>

      <Dialog
        open={!!rename}
        title="重命名会话"
        confirmText="保存"
        onClose={() => setRename(null)}
        onConfirm={() => {
          proto.renameSession(rename!, renameText.trim() || "未命名会话");
          setRename(null);
        }}
      >
        <TextInput value={renameText} onChange={(e) => setRenameText(e.target.value)} placeholder="会话名称" />
      </Dialog>

      <Dialog
        open={!!removing}
        title="删除会话？"
        confirmText="删除"
        danger
        onClose={() => setRemoving(null)}
        onConfirm={() => {
          if (removing === sid) setSid("");
          proto.deleteSession(removing!);
          setRemoving(null);
        }}
      >
        会话记录会被删除，已下发的任务与报告不受影响。
      </Dialog>
    </div>
  );
}

/* ---------------- 消息与卡片 ---------------- */

function Message({
  msg,
  onPickArea,
  onEdit,
  onCancelPlan,
}: {
  msg: ChatMsg;
  onPickArea: (a: Area, drawn: Pos[]) => void;
  onEdit: (taskId: string) => void;
  onCancelPlan: (taskId: string) => void;
}) {
  const { state, confirmTask, requestCancel, resolveCancel } = useProto();

  if (msg.role === "system") {
    if (!msg.text) return null;
    return <div className="p-msg-system">{msg.text}</div>;
  }

  const isUser = msg.role === "user";
  return (
    <div className={`p-msg${isUser ? " is-user" : " is-assistant"}`}>
      {!isUser && (
        <div className="p-msg-avatar">
          <Sparkles size={13} />
        </div>
      )}
      <div className="p-msg-body">
        {!isUser && msg.path && (
          <div className="p-msg-path">
            <Badge tone={msg.path === "rag" ? "ok" : msg.path === "rag+tool" ? "brand" : "muted"}>
              {RAG_PATH_LABEL[msg.path]}
            </Badge>
            {msg.traceId && (
              <Link href={`/proto/admin/traces/${msg.traceId}`} className="p-link p-small">
                Trace {msg.traceId}
              </Link>
            )}
          </div>
        )}
        <div className="p-bubble">{msg.text}</div>
        {msg.card && <ChatCard msg={msg} state={state} onPickArea={onPickArea} onEdit={onEdit} onCancelPlan={onCancelPlan} confirmTask={confirmTask} requestCancel={requestCancel} resolveCancel={resolveCancel} />}
        <time>{msg.at}</time>
      </div>
    </div>
  );
}

function CardShell({ title, tag, children, tone }: { title: string; tag?: string; children: React.ReactNode; tone?: "brand" | "ok" | "warn" | "danger" }) {
  return (
    <div className={`p-chat-card${tone ? ` is-${tone}` : ""}`}>
      <header>
        <b>{title}</b>
        {tag && <Badge tone={tone ?? "muted"}>{tag}</Badge>}
      </header>
      {children}
    </div>
  );
}

function PlanForm({
  task,
  onSave,
}: {
  task: Task;
  onSave: (patch: { alt?: number; speed?: number; deviceId?: string }) => void;
}) {
  const [alt, setAlt] = useState(() => {
    const m = task.checks.find((c) => c.text.startsWith("航线参数"))?.text.match(/高度 (\d+)m/);
    return m ? Number(m[1]) : 55;
  });
  const [speed, setSpeed] = useState(6);
  const [deviceId, setDeviceId] = useState(task.deviceId);
  const altError = alt < 20 || alt > 120 ? "高度需在 20–120 米之间" : "";
  return (
    <div className="p-form">
      <div className="p-grid-2">
        <Field label="相对起飞点高度" required hint="范围 20–120 米" error={altError}>
          <TextInput type="number" value={alt} invalid={!!altError} onChange={(e) => setAlt(Number(e.target.value))} />
        </Field>
        <Field label="巡航速度" hint="范围 2–15 m/s">
          <TextInput type="number" value={speed} onChange={(e) => setSpeed(Number(e.target.value))} />
        </Field>
      </div>
      <Field label="执行设备" hint="仅显示可用设备">
        <Select value={deviceId} onChange={(e) => setDeviceId(e.target.value)}>
          {DEVICES.map((d) => (
            <option key={d.id} value={d.id} disabled={d.status === "offline"}>
              {d.name} · {d.battery}% · {d.status === "offline" ? "离线" : d.status === "busy" ? "任务中" : "空闲"}
            </option>
          ))}
        </Select>
      </Field>
      <div className="p-form-actions">
        <Button variant="primary" disabled={!!altError} onClick={() => onSave({ alt, speed, deviceId })}>
          保存并重新校验
        </Button>
      </div>
    </div>
  );
}

function ChatCard({
  msg,
  state,
  onPickArea,
  onEdit,
  onCancelPlan,
  confirmTask,
  requestCancel,
  resolveCancel,
}: {
  msg: ChatMsg;
  state: ReturnType<typeof useProto>["state"];
  onPickArea: (a: Area, drawn: Pos[]) => void;
  onEdit: (taskId: string) => void;
  onCancelPlan: (taskId: string) => void;
  confirmTask: (id: string) => void;
  requestCancel: (id: string) => void;
  resolveCancel: (id: string, accept: boolean) => void;
}) {
  const card = msg.card!;
  const [draft, setDraft] = useState<Pos[]>([]);
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (card.kind === "device") {
    const d = deviceById(card.deviceId)!;
    return (
      <CardShell title="设备状态" tag="只读查询">
        <div className="p-card-row">
          <div>
            <b>{d.name}</b>
            <span className="p-cell-sub">{d.model} · {d.dockId}</span>
          </div>
          <Badge tone={d.status === "offline" ? "muted" : "ok"}>{d.status === "offline" ? "离线" : d.status === "busy" ? "任务中" : "在线"}</Badge>
        </div>
        {card.alert && (
          <div className="p-alert-line">
            <CircleAlert size={13} />
            {card.alert}
          </div>
        )}
        <div className="p-card-grid">
          <div>
            <span>电量</span>
            <b>{d.battery}%</b>
          </div>
          <div>
            <span>载荷</span>
            <b>{d.payload}</b>
          </div>
          <div>
            <span>当前任务</span>
            <b>{d.taskId ?? "无"}</b>
          </div>
        </div>
        <div className="p-card-actions">
          <Link href="/proto/map" className="p-btn p-btn-secondary p-btn-sm">
            在地图查看
          </Link>
        </div>
      </CardShell>
    );
  }

  if (card.kind === "taskList") {
    return (
      <CardShell title="任务查询结果" tag={`${card.taskIds.length} 条`}>
        {card.taskIds.map((id) => {
          const t = state.tasks.find((x) => x.id === id);
          if (!t) return null;
          return (
            <Link key={id} href={`/proto/tasks/${id}`} className="p-task-line">
              <div>
                <b>{t.name}</b>
                <span>{t.id} · {deviceById(t.deviceId)?.name}</span>
              </div>
              <Badge tone={TASK_STATUS_TONE[t.status] as "danger"}>{TASK_STATUS_LABEL[t.status]}</Badge>
              <ChevronRight size={13} />
            </Link>
          );
        })}
      </CardShell>
    );
  }

  if (card.kind === "citations") {
    const run = state.rag.runs.find((r) => r.id === card.runId);
    if (!run) return <div className="p-note">检索记录 {card.runId} 不存在</div>;
    const doc = (id: string) => state.kbDocs.find((d) => d.id === id);
    return (
      <CardShell
        title={run.refused ? "知识库无足够依据" : "知识库依据"}
        tag={run.refused ? "已拒答" : `${run.citations.length} 条引用`}
        tone={run.refused ? "danger" : run.lowConfidence ? "warn" : "ok"}
      >
        {run.refused ? (
          <div className="p-alert-line">
            <CircleAlert size={13} />
            {run.lowReason ?? "未检索到高于阈值的内容"}
          </div>
        ) : (
          <div className="p-cite-list">
            {run.citations.map((c, i) => (
              <div key={c.chunkId} className="p-cite">
                <div className="p-cite-head">
                  <b>
                    [{i + 1}] {c.docName}
                  </b>
                  <span className="p-mono p-small">{c.section}</span>
                  <Badge tone="muted">{c.score.toFixed(2)}</Badge>
                </div>
                <p>{c.quote}</p>
                <div className="p-cite-foot">
                  <span className="p-mono p-small">
                    {c.docId} · {doc(c.docId)?.version ?? "v?"} · {c.chunkId}
                  </span>
                  <Link href={`/proto/admin/kb?doc=${c.docId}&chunk=${c.chunkId}`} className="p-link p-small">
                    查看片段
                  </Link>
                </div>
              </div>
            ))}
            {run.lowConfidence && (
              <div className="p-alert-line">
                <CircleAlert size={13} />
                置信度偏低，已附加提示；建议补充文档或调整检索配置
              </div>
            )}
          </div>
        )}
        <div className="p-cite-meta">
          <span>
            检索配置 <b className="p-mono">{run.configId}</b> v{run.configVersion}
          </span>
          <span>
            向量 <b className="p-mono">{run.embeddingModel}</b>
          </span>
          <span>
            重排 <b className="p-mono">{run.rerankModel ?? "未启用"}</b>
          </span>
          <span>
            最终上下文 <b>{run.selected.length}</b> / 召回 {run.candidates.length}
          </span>
        </div>
        <div className="p-card-actions">
          <Link href={`/proto/admin/traces/${run.traceId}`} className="p-btn p-btn-secondary p-btn-sm">
            查看检索 Trace
          </Link>
          <Link
            href={`/proto/admin/kb/retrieval?q=${encodeURIComponent(run.question)}&config=${run.configId}`}
            className="p-btn p-btn-ghost p-btn-sm"
          >
            在检索测试中复现
          </Link>
        </div>
      </CardShell>
    );
  }

  if (card.kind === "askArea") {
    const area = draft.length >= 3 ? hashArea(draft) : null;
    return (
      <CardShell title="圈选作业区域" tag="需要你的输入" tone="warn">
        <MapCanvas
          areas={AREAS}
          routes={[]}
          devices={DEVICES}
          events={[]}
          layers={LAYERS}
          height={250}
          draft={draft}
          drawMode
          onDraftChange={setDraft}
          selectedAreaId={area?.id}
        />
        <div className="p-draw-foot">
          <span>
            {draft.length === 0 ? "在地图上单击开始圈选" : draft.length < 3 ? `已点 ${draft.length} 个点，至少需要 3 个` : `已识别：${area?.name} · 约 ${polygonMu(draft)} 亩`}
          </span>
          <div>
            <Button size="sm" onClick={() => setDraft([])} disabled={!draft.length}>
              清空
            </Button>
            <Button
              size="sm"
              variant="primary"
              disabled={draft.length < 3}
              onClick={() => {
                if (!area) return;
                onPickArea(area, draft);
                setDraft([]);
              }}
            >
              确认区域
            </Button>
          </div>
        </div>
      </CardShell>
    );
  }

  if (card.kind === "skill") {
    const skill = state.skills.items.find((k) => k.id === card.skillId);
    if (!skill) return <div className="p-note">Skill {card.skillId} 不存在</div>;
    const version = publishedVersion(skill);
    return (
      <CardShell title="Skill 选择" tag={`${skill.name} · ${version.version}`} tone="brand">
        <div className="p-skill-head">
          <b>{skill.name}</b>
          <span className="p-cell-sub">
            Agent AGENT-COPILOT-OPS · 置信度 {(card.confidence * 100).toFixed(0)}% · {version.steps.length} 个步骤
          </span>
        </div>
        <ol className="p-skill-steps">
          {version.steps.map((st) => {
            const tool = st.toolId ? toolById(st.toolId) : undefined;
            const src = toolSourceLabel(st.toolId);
            return (
              <li key={st.key}>
                <span className={`p-step-kind is-${st.kind}`}>{SKILL_STEP_LABEL[st.kind]}</span>
                <div>
                  <b>{st.title}</b>
                  <span className="p-cell-sub">
                    {tool ? tool.name : st.kind === "confirm" ? "等待值班员确认" : st.service ?? "模型推理"}
                    {tool ? ` · ${src.text === "MCP" ? `MCP (${src.detail})` : "内部 API"}` : ""}
                    {st.kind === "confirm" ? " · 必须人工确认" : ""}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
        <div className="p-note">
          Skill 只负责编排与顺序。参数校验、权限与安全校验由业务服务执行，MCP Server 不能绕过。
        </div>
        <div className="p-card-actions">
          <Link href={`/proto/admin/agents/skills/${skill.id}`} className="p-btn p-btn-ghost p-btn-sm">
            查看 Skill 定义
          </Link>
        </div>
      </CardShell>
    );
  }

  if (card.kind === "skillRun") {
    const run = state.skills.runs.find((r) => r.id === card.runId);
    if (!run) return <div className="p-note">Skill 运行记录 {card.runId} 不存在</div>;
    return (
      <CardShell
        title={`Skill 执行 · ${run.skillName}`}
        tag={`${run.skillVersion} · ${run.status === "waiting_confirm" ? "待人工确认" : "已完成"}`}
        tone={run.status === "waiting_confirm" ? "warn" : "ok"}
      >
        <ol className="p-run-steps">
          {run.steps.map((st) => (
            <li key={st.key} className={`is-${st.status}`}>
              <span className={`p-step-kind is-${st.kind}`}>{SKILL_STEP_LABEL[st.kind]}</span>
              <div>
                <b>{st.title}</b>
                <span className="p-cell-sub">
                  {st.source === "mcp"
                    ? `MCP · ${st.serverName}`
                    : st.source === "internal"
                      ? "内部 API · 业务服务"
                      : st.source === "service"
                        ? "业务服务"
                        : "模型推理"}
                  {st.ms ? ` · ${st.ms}ms` : ""}
                  {st.status === "waiting" ? " · 等待确认" : ""}
                </span>
                {st.result && <span className="p-run-result">{st.result}</span>}
                {st.note && <span className="p-cell-sub">{st.note}</span>}
              </div>
            </li>
          ))}
        </ol>
        <div className="p-card-actions">
          <Link href={`/proto/admin/traces/${run.traceId}`} className="p-btn p-btn-secondary p-btn-sm">
            查看调用 Trace
          </Link>
          <Link href={`/proto/admin/agents/skills/${run.skillId}`} className="p-btn p-btn-ghost p-btn-sm">
            Skill 定义
          </Link>
        </div>
      </CardShell>
    );
  }

  if (card.kind === "workflow") {
    const wf = state.workflows.find((w) => w.id === card.workflowId);
    if (!wf) return <div className="p-note">工作流 {card.workflowId} 不存在</div>;
    const triggerText =
      wf.triggerKind === "schedule"
        ? `定时 · ${wf.schedule ?? wf.trigger.replace(/^定时\s*/, "")}`
        : wf.triggerKind === "telemetry"
          ? "遥测触发"
          : wf.triggerKind === "event"
            ? "事件触发"
            : "人工触发";
    const missing = wf.missing ?? [];
    return (
      <CardShell
        title={card.created ? "工作流草稿已生成" : "工作流草稿已同步"}
        tag={`${wf.id} · ${wf.version ?? "draft r1"}`}
        tone={missing.length ? "warn" : "brand"}
      >
        <div className="p-card-row">
          <div>
            <b>{wf.name}</b>
            <span className="p-cell-sub">
              {triggerText} · {wf.nodes.length} 个节点 · 来源 Copilot
            </span>
          </div>
          <Badge tone={wf.status === "published" ? "ok" : "warn"}>{wf.status === "published" ? "已发布" : "草稿"}</Badge>
        </div>
        <div className="p-wf-chain">
          {wf.nodes.map((n, i) => (
            <span key={n.id}>
              {i > 0 && <em>→</em>}
              <span className={`p-wf-chip is-${n.type}`}>{n.label}</span>
            </span>
          ))}
        </div>
        {missing.length > 0 ? (
          <div className="p-note is-danger-static">
            {missing.length} 项资源待补充：{missing.join("、")}。补齐后才能启用。
          </div>
        ) : (
          <div className="p-note">
            草稿只保存，不自动启用也不自动执行。涉及下发/处置的动作仍需人工确认与服务端校验。
          </div>
        )}
        <div className="p-card-actions">
          <Link href={`/proto/workflows/${wf.id}`} className="p-btn p-btn-primary p-btn-sm">
            打开画布
          </Link>
          <span className="p-muted p-small">继续在本会话说「再增加邮件通知」即可修改同一份草稿</span>
        </div>
      </CardShell>
    );
  }

  const task = state.tasks.find((t) => t.id === card.taskId);
  if (!task) return <div className="p-note">任务 {card.taskId} 不存在</div>;
  const device = deviceById(task.deviceId)!;
  const route = routeById(task.routeId);
  const area = AREAS.find((a) => a.id === task.areaId)!;

  if (card.kind === "plan") {
    const skill = task.skillId ? state.skills.items.find((k) => k.id === task.skillId) : undefined;
    const skillVersion = skill?.versions.find((v) => v.id === task.skillVersionId);
    return (
      <CardShell title="任务计划" tag={task.planVersion} tone="warn">
        <div className="p-plan-head">
          <div>
            <b>{task.name}</b>
            <span className="p-cell-sub">{task.id} · {task.type}</span>
          </div>
          <Badge tone={TASK_STATUS_TONE[task.status] as "warn"}>{TASK_STATUS_LABEL[task.status]}</Badge>
        </div>
        {skill && (
          <div className="p-skill-strip">
            <Badge tone="brand">{skill.name} {skillVersion?.version}</Badge>
            <span>{skillVersion?.steps.length ?? 0} 个步骤 · 下发前人工确认 · 工具经业务服务校验</span>
            <Link href={`/proto/admin/agents/skills/${skill.id}`} className="p-link p-small">
              定义
            </Link>
          </div>
        )}
        <div className="p-card-grid">
          <div>
            <span>作业区域</span>
            <b>{area.name}</b>
            <em>{area.mu} 亩</em>
          </div>
          <div>
            <span>执行设备</span>
            <b>{device.name}</b>
            <em>电量 {device.battery}% · {device.payload}</em>
          </div>
          <div>
            <span>航线</span>
            <b>{route?.id} {route?.version}</b>
            <em>{route?.waypoints.length} 个航点 · {task.alt ?? route?.waypoints[0]?.alt ?? 55}m</em>
          </div>
        </div>
        <ul className="p-checks">
          {task.checks.map((c, i) => (
            <li key={i} className={`is-${c.level}`}>
              {c.level === "ok" ? <CheckCircle2 size={13} /> : <CircleAlert size={13} />}
              {c.text}
            </li>
          ))}
        </ul>
        <div className="p-card-actions">
          {task.status === "pending_confirm" ? (
            <>
              <Button size="sm" variant="primary" onClick={() => confirmTask(task.id)}>
                确认执行
              </Button>
              <Button size="sm" icon={<Pencil size={12} />} onClick={() => onEdit(task.id)}>
                修改参数
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onCancelPlan(task.id)}>
                取消
              </Button>
            </>
          ) : (
            <Link href={`/proto/tasks/${task.id}`} className="p-btn p-btn-secondary p-btn-sm">
              查看任务详情
            </Link>
          )}
        </div>
      </CardShell>
    );
  }

  if (card.kind === "progress") {
    const canCancel = task.status === "running" || task.status === "queued";
    return (
      <CardShell title="执行状态" tag={TASK_STATUS_LABEL[task.status]} tone={task.cancelState ? "warn" : "brand"}>
        <div className="p-progress is-ok">
          <i style={{ width: `${task.progress}%` }} />
        </div>
        <div className="p-progress-meta">
          <span>{task.progress}%</span>
          <span>{task.steps.find((s) => s.state === "active")?.note ?? task.steps.find((s) => s.state === "active")?.label ?? "已完成"}</span>
        </div>
        {task.cancelState === "requesting" && (
          <div className="p-alert-line">
            <Clock3 size={13} />
            取消申请已提交，等待值班长确认
            <button className="p-inline-link" onClick={() => resolveCancel(task.id, true)}>
              模拟确认
            </button>
            <button className="p-inline-link" onClick={() => resolveCancel(task.id, false)}>
              模拟驳回
            </button>
          </div>
        )}
        <div className="p-card-actions">
          <Link href={`/proto/tasks/${task.id}`} className="p-btn p-btn-secondary p-btn-sm">
            查看执行详情
          </Link>
          {canCancel && !task.cancelState && (
            <Button size="sm" variant="ghost" onClick={() => setConfirmCancel(true)}>
              申请取消
            </Button>
          )}
        </div>
        <Dialog
          open={confirmCancel}
          title="申请取消任务？"
          confirmText="提交申请"
          danger
          onClose={() => setConfirmCancel(false)}
          onConfirm={() => {
            requestCancel(task.id);
            setConfirmCancel(false);
          }}
        >
          任务已经开始执行。提交后会进入「取消申请」状态，由值班长确认后业务平台才停止飞行，不会立即中断。
        </Dialog>
      </CardShell>
    );
  }

  // result
  const events = task.eventIds.map((id) => state.events.find((e) => e.id === id)).filter(Boolean);
  return (
    <CardShell title={task.status === "failed" ? "任务异常" : "任务结果"} tag={TASK_STATUS_LABEL[task.status]} tone={task.status === "failed" ? "danger" : "ok"}>
      <div className="p-card-grid">
        <div>
          <span>航点</span>
          <b>{task.status === "done" ? `${route?.waypoints.length}/${route?.waypoints.length}` : `进行中`}</b>
        </div>
        <div>
          <span>异常</span>
          <b className={events.length ? "t-danger" : undefined}>{events.length} 处</b>
        </div>
        <div>
          <span>报告</span>
          <b>{task.reportId ? "已生成" : "生成中"}</b>
        </div>
      </div>
      {events.map((e) => (
        <Link key={e!.id} href={`/proto/events?focus=${e!.id}`} className="p-event-line">
          <i className={`p-dot p-dot-${e!.level === "high" ? "danger" : e!.level === "mid" ? "warn" : "info"}`} />
          <div>
            <b>{e!.title}</b>
            <span>{LEVEL_LABEL[e!.level]}风险 · 置信度 {(e!.confidence * 100).toFixed(0)}%</span>
          </div>
          <ChevronRight size={13} />
        </Link>
      ))}
      <div className="p-card-actions">
        <Link href={`/proto/tasks/${task.id}`} className="p-btn p-btn-secondary p-btn-sm">
          任务详情
        </Link>
        {task.reportId && (
          <Link href={`/proto/reports/${task.reportId}`} className="p-btn p-btn-primary p-btn-sm">
            打开报告
          </Link>
        )}
        <Link href={`/proto/admin/traces/${task.traceId}`} className="p-btn p-btn-ghost p-btn-sm">
          查看 Trace <ArrowRight size={12} />
        </Link>
      </div>
    </CardShell>
  );
}
