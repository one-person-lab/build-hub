"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Search, Wrench } from "lucide-react";
import { Badge, Button, DataTable, Dialog, Field, Select, Stats, Textarea, TextInput, type Column } from "@/components/proto/ui";
import { useProto } from "@/lib/proto/store";
import {
  FAIL_TYPE_LABEL,
  FAIL_TYPE_LAYER,
  caseById,
  type FailType,
  type FixRecord,
} from "@/lib/proto/eval-data";
import { EvalCrumb, EvalMockNote, FailTypeBadge, emitEvalPreset } from "@/components/proto/eval-ui";

const FAIL_ORDER: FailType[] = ["intent", "param", "tool", "business", "safety", "final"];

const FIX_STATUS_LABEL: Record<FixRecord["status"], string> = {
  open: "待修复",
  verifying: "验证中",
  closed: "已关闭",
};

const NEW_VERSION = "1.5.1-draft";

interface FailureRow {
  key: string;
  experimentId: string;
  agentVersion: string;
  datasetId: string;
  caseId: string;
  name: string;
  input: string;
  safety: boolean;
  failType: FailType;
  failReason: string;
  traceId?: string;
  fix?: FixRecord;
}

export default function FailuresPage() {
  const { state, createFix, updateFixStatus, createAgentVersion } = useProto();
  const router = useRouter();
  const [layer, setLayer] = useState("all");
  const [q, setQ] = useState("");
  const [fixRow, setFixRow] = useState<FailureRow | null>(null);
  const [title, setTitle] = useState("");
  const [cause, setCause] = useState("");
  const [action, setAction] = useState("");
  const [target, setTarget] = useState(NEW_VERSION);
  const [error, setError] = useState("");

  const versions = Array.from(new Set(state.agents.filter((a) => a.agentId === "AGENT-COPILOT-OPS").map((a) => a.version)));
  const targetOptions = versions.includes(NEW_VERSION) ? versions : [...versions, NEW_VERSION];

  const failures = useMemo<FailureRow[]>(() => {
    const list: FailureRow[] = [];
    for (const exp of state.eval.experiments) {
      if (exp.status !== "done") continue;
      const ds = state.eval.datasets.find((d) => d.id === exp.datasetId);
      for (const r of exp.results.filter((x) => !x.pass)) {
        const c = caseById(ds, r.caseId);
        const fix = state.eval.fixes.find((f) => f.caseIds.includes(r.caseId));
        list.push({
          key: `${exp.id}-${r.caseId}`,
          experimentId: exp.id,
          agentVersion: exp.agentVersion,
          datasetId: exp.datasetId,
          caseId: r.caseId,
          name: c?.name ?? r.caseId,
          input: c?.input ?? "",
          safety: c?.safety ?? false,
          failType: r.failType ?? "final",
          failReason: r.failReason ?? "未记录原因",
          traceId: r.traceId,
          fix,
        });
      }
    }
    return list.sort((a, b) => Number(!!a.fix) - Number(!!b.fix));
  }, [state.eval.experiments, state.eval.datasets, state.eval.fixes]);

  const rows = failures.filter(
    (f) =>
      (layer === "all" || f.failType === layer) &&
      (!q || `${f.name} ${f.caseId} ${f.failReason}`.toLowerCase().includes(q.toLowerCase())),
  );

  const fixes = state.eval.fixes;
  const open = fixes.filter((f) => f.status === "open").length;
  const verifying = fixes.filter((f) => f.status === "verifying").length;
  const closed = fixes.filter((f) => f.status === "closed").length;
  const unregisteredSafety = failures.filter((f) => f.safety && !f.fix).length;

  const openFix = (f: FailureRow) => {
    setFixRow(f);
    setTitle(`修复 ${f.name}`);
    setCause(f.failReason);
    setAction(
      f.failType === "safety"
        ? "补充角色校验与拦截规则，确保越权与危险动作在确认前被阻断。"
        : "补充对应规则、数据源或工具参数校验，并在同一数据集上回归验证。",
    );
    setTarget(versions.includes(NEW_VERSION) ? versions[0] : NEW_VERSION);
    setError("");
  };

  const submit = () => {
    if (!fixRow) return;
    if (!title.trim() || !action.trim()) {
      setError("请填写修复标题与修复措施");
      return;
    }
    if (!versions.includes(target)) {
      createAgentVersion("AGENT-COPILOT-OPS", target, `由修复记录创建：${title}`);
    }
    createFix({
      title: title.trim(),
      failType: fixRow.failType,
      caseIds: [fixRow.caseId],
      experimentId: fixRow.experimentId,
      cause,
      action,
      targetVersion: target,
    });
    setFixRow(null);
    setError("");
  };

  const runRegression = (f: FixRecord) => {
    const ds = state.eval.datasets.find((d) => d.cases.some((c) => f.caseIds.includes(c.id)));
    emitEvalPreset({ agentVersion: f.targetVersion, datasetId: ds?.id });
    router.push("/proto/admin/eval/experiments");
  };

  const columns: Column<FailureRow>[] = [
    {
      key: "case",
      title: "失败用例",
      render: (f) => (
        <div>
          <b>{f.name}</b>
          <span className="p-cell-sub p-mono">
            {f.caseId} · {f.agentVersion}
          </span>
        </div>
      ),
    },
    {
      key: "layer",
      title: "归因层级",
      width: "130px",
      render: (f) => (
        <div>
          <FailTypeBadge label={FAIL_TYPE_LABEL[f.failType]} safety={f.failType === "safety"} />
          <span className="p-cell-sub">{FAIL_TYPE_LAYER[f.failType]}</span>
        </div>
      ),
    },
    { key: "reason", title: "失败原因", render: (f) => <span className="p-small">{f.failReason}</span> },
    {
      key: "trace",
      title: "Trace",
      width: "150px",
      render: (f) =>
        f.traceId ? (
          <Link
            href={`/proto/admin/traces/${f.traceId}`}
            className="p-link p-mono p-small"
            onClick={(e) => e.stopPropagation()}
          >
            {f.traceId}
          </Link>
        ) : (
          <span className="p-muted">—</span>
        ),
    },
    {
      key: "fix",
      title: "修复状态",
      width: "110px",
      render: (f) =>
        f.fix ? (
          <Badge tone={f.fix.status === "closed" ? "ok" : f.fix.status === "verifying" ? "active" : "warn"}>
            {FIX_STATUS_LABEL[f.fix.status]}
          </Badge>
        ) : (
          <Badge tone="danger">未登记</Badge>
        ),
    },
    {
      key: "ops",
      title: "",
      width: "116px",
      render: (f) => (
        <div className="p-row-ops" style={{ whiteSpace: "nowrap" }} onClick={(e) => e.stopPropagation()}>
          <Link href={`/proto/admin/eval/experiments/${f.experimentId}`} className="p-link p-small">
            实验
          </Link>
          {!f.fix && (
            <button className="p-btn p-btn-text" onClick={() => openFix(f)}>
              登记修复
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <EvalCrumb label="失败分析" />

      <div className="p-page-head">
        <div>
          <h1>失败分析</h1>
          <p>按链路段归因失败用例，登记修复记录，并用同一数据集回归验证</p>
        </div>
        <div className="p-page-actions">
          <Link href="/proto/admin/eval/labeling" className="p-btn p-btn-secondary p-btn-md">
            先人工复核
          </Link>
          <Link href="/proto/admin/eval/experiments" className="p-btn p-btn-primary p-btn-md">
            去跑回归实验
          </Link>
        </div>
      </div>

      <Stats
        items={[
          { label: "失败用例", value: failures.length, tone: failures.length ? "danger" : "ok", hint: "来自已完成的实验" },
          { label: "待修复", value: open, tone: open ? "warn" : "ok", hint: "已登记，尚未修复" },
          { label: "验证中", value: verifying, tone: "active", hint: "目标版本已跑过实验" },
          { label: "已关闭", value: closed, tone: "ok", hint: "回归通过后关闭" },
        ]}
      />

      {unregisteredSafety > 0 && (
        <div className="p-warn-banner">
          有 {unregisteredSafety} 条安全用例失败还没有修复记录，发布门禁会直接阻止相关版本。安全用例必须独立复核并修复。
        </div>
      )}

      <div className="p-admin-split">
        <div className="p-stack">
          <div className="p-card">
            <div className="p-card-head">
              <div>
                <h3>失败用例与归因</h3>
                <p>归因层级依次是理解、规划编排、业务完成、安全与最终结果</p>
              </div>
            </div>
            <div className="p-toolbar" style={{ borderTop: 0 }}>
              <div className="p-toolbar-search">
                <Search size={13} />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索用例或失败原因" />
              </div>
              <Select value={layer} onChange={(e) => setLayer(e.target.value)} style={{ width: 150 }}>
                <option value="all">全部层级</option>
                {FAIL_ORDER.map((t) => (
                  <option key={t} value={t}>
                    {FAIL_TYPE_LABEL[t]} · {FAIL_TYPE_LAYER[t]}
                  </option>
                ))}
              </Select>
              <span className="p-toolbar-count">{rows.length} 条</span>
            </div>
            <DataTable
              columns={columns}
              rows={rows}
              rowKey={(f) => f.key}
              empty="没有符合条件的失败用例"
              emptyHint="去运行一个新的实验，失败项会自动汇总到这里"
            />
          </div>
        </div>

        <div className="p-stack">
          <div className="p-card p-card-pad">
            <h3 className="p-side-h">失败层级分布</h3>
            <div className="p-mini-stats">
              {FAIL_ORDER.map((t) => (
                <div key={t}>
                  <span>{FAIL_TYPE_LABEL[t]}</span>
                  <b>{failures.filter((f) => f.failType === t).length}</b>
                </div>
              ))}
            </div>
          </div>

          <div className="p-card">
            <div className="p-card-head">
              <h3>修复记录</h3>
              <span className="p-muted p-small">{fixes.length} 条</span>
            </div>
            <div className="p-lines">
              {fixes.map((f) => (
                <div key={f.id} className="p-fix-row">
                  <div className="p-row-between">
                    <div>
                      <b>{f.title}</b>
                      <span className="p-cell-sub">
                        {f.id} · 目标 {f.targetVersion} · {f.caseIds.join(" ")}
                      </span>
                    </div>
                    <Badge tone={f.status === "closed" ? "ok" : f.status === "verifying" ? "active" : "warn"}>
                      {FIX_STATUS_LABEL[f.status]}
                    </Badge>
                  </div>
                  <div className="p-row-ops">
                    {f.status !== "closed" && (
                      <Button size="sm" icon={<Wrench size={12} />} onClick={() => runRegression(f)}>
                        跑回归
                      </Button>
                    )}
                    {f.status === "open" && (
                      <Button size="sm" variant="ghost" onClick={() => updateFixStatus(f.id, "verifying")}>
                        标记验证中
                      </Button>
                    )}
                    {f.status === "verifying" && (
                      <Button size="sm" variant="ghost" onClick={() => updateFixStatus(f.id, "closed")}>
                        关闭修复
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {fixes.length === 0 && <p className="p-card-pad p-muted" style={{ margin: 0 }}>还没有修复记录。</p>}
            </div>
          </div>

          <div className="p-card p-card-pad">
            <h3 className="p-side-h">优化闭环</h3>
            <ul className="p-issue-list">
              <li className="is-ok-static">失败用例附带原始 Trace，可回放每一步输入输出</li>
              <li className="is-ok-static">修复记录绑定目标版本，回归实验会自动更新验证状态</li>
              <li className="is-ok-static">安全类修复必须单独复跑安全用例，不能只看总通过率</li>
            </ul>
          </div>

          <div className="p-note">失败归因与修复建议均为演示数据，不代表真实算法诊断结果。</div>
        </div>
      </div>

      <EvalMockNote>失败用例与归因来自预置模拟实验，修复状态仅保存在本次演示会话中。</EvalMockNote>

      <Dialog
        open={!!fixRow}
        title="登记修复记录"
        confirmText="创建修复记录"
        onClose={() => setFixRow(null)}
        onConfirm={submit}
      >
        {fixRow && (
          <div className="p-form">
            <p className="p-muted p-small" style={{ margin: 0 }}>
              {fixRow.caseId} · {FAIL_TYPE_LABEL[fixRow.failType]} · {fixRow.failReason}
            </p>
            <Field label="修复标题" required>
              <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例如：补充越权取消拦截规则" />
            </Field>
            <Field label="失败原因">
              <Textarea rows={2} value={cause} onChange={(e) => setCause(e.target.value)} />
            </Field>
            <Field label="修复措施" required hint="写清楚改了什么，便于回归时核对">
              <Textarea rows={3} value={action} onChange={(e) => setAction(e.target.value)} />
            </Field>
            <div className="p-grid-2">
              <Field label="目标版本" hint="目标版本不必先把草稿发布">
                <Select value={target} onChange={(e) => setTarget(e.target.value)}>
                  {targetOptions.map((v) => (
                    <option key={v} value={v}>
                      {v}
                      {versions.includes(v) ? "" : " · 新建草稿"}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="关联用例">
                <TextInput value={fixRow.caseId} disabled />
              </Field>
            </div>
            {error && <div className="p-warn-banner" style={{ marginBottom: 0 }}>{error}</div>}
          </div>
        )}
      </Dialog>
    </div>
  );
}
