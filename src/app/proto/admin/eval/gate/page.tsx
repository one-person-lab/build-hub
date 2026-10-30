"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ClipboardCheck, ShieldAlert, ShieldCheck } from "lucide-react";
import {
  Badge,
  Button,
  DataTable,
  Dialog,
  Select,
  Stats,
  Switch,
  TextInput,
  type Column,
} from "@/components/proto/ui";
import { useProto } from "@/lib/proto/store";
import { MONITOR_STATS, evaluateGate, summarize, type ReleaseRecord } from "@/lib/proto/eval-data";
import {
  EvalCrumb,
  EvalMockNote,
  EVAL_PRESET_EVENT,
  clearEvalPreset,
  consumeEvalPreset,
  type EvalPreset,
} from "@/components/proto/eval-ui";

const RELEASE_LABEL: Record<ReleaseRecord["status"], string> = {
  released: "已发布",
  blocked: "已阻止",
  rolled_back: "已回滚",
};

const RELEASE_TONE = {
  released: "ok",
  blocked: "danger",
  rolled_back: "muted",
} as const;

export default function GatePage() {
  const { state, recordRelease, rollbackRelease, updateGateRule } = useProto();
  const done = state.eval.experiments.filter((e) => e.status === "done");
  const [expId, setExpId] = useState(done[0]?.id ?? "");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [releaseOpen, setReleaseOpen] = useState(false);
  const [rollbackId, setRollbackId] = useState<string | null>(null);

  useEffect(() => {
    const apply = (preset: EvalPreset) => {
      if (preset.experimentId) setExpId(preset.experimentId);
    };
    apply(consumeEvalPreset());
    const onPreset = (e: Event) => {
      const detail = (e as CustomEvent<EvalPreset>).detail ?? {};
      clearEvalPreset();
      apply(detail);
    };
    window.addEventListener(EVAL_PRESET_EVENT, onPreset);
    return () => window.removeEventListener(EVAL_PRESET_EVENT, onPreset);
  }, []);

  const exp = done.find((e) => e.id === expId) ?? done[0];
  const dataset = exp ? state.eval.datasets.find((d) => d.id === exp.datasetId) : undefined;
  const summary = exp ? summarize(exp, dataset) : null;
  const gate = exp ? evaluateGate(exp, dataset, MONITOR_STATS.negRate, state.eval.gateRules) : null;
  const safetyCases = dataset?.cases.filter((c) => c.safety && exp?.caseIds.includes(c.id)) ?? [];
  const releases = state.eval.releases;

  const commit = (id: string) => {
    const raw = drafts[id];
    if (raw === undefined) return;
    const n = Number(raw);
    if (!Number.isFinite(n)) return;
    updateGateRule(id, { threshold: n });
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const releaseColumns: Column<ReleaseRecord>[] = [
    {
      key: "version",
      title: "版本",
      render: (r) => (
        <div>
          <b className="p-mono">{r.version}</b>
          <span className="p-cell-sub p-mono">{r.id} · {r.experimentId}</span>
        </div>
      ),
    },
    { key: "pass", title: "质量通过率", width: "150px", render: (r) => <span className="p-mono">{r.passRate}%</span> },
    {
      key: "safety",
      title: "安全用例",
      width: "110px",
      render: (r) => (
        <Badge tone={r.safetyRate === 100 ? "ok" : "danger"}>{r.safetyRate}%</Badge>
      ),
    },
    {
      key: "result",
      title: "结论",
      render: (r) =>
        r.blockedBy ? (
          <div>
            <Badge tone={RELEASE_TONE[r.status]}>{RELEASE_LABEL[r.status]}</Badge>
            <span className="p-cell-sub">{r.blockedBy}</span>
          </div>
        ) : (
          <Badge tone={RELEASE_TONE[r.status]}>{RELEASE_LABEL[r.status]}</Badge>
        ),
    },
    { key: "at", title: "时间", render: (r) => <span className="p-mono p-small">{r.at} · {r.operator}</span> },
    {
      key: "ops",
      title: "",
      width: "90px",
      render: (r) =>
        r.status === "released" ? (
          <button className="p-btn p-btn-text" onClick={() => setRollbackId(r.id)}>
            回滚
          </button>
        ) : (
          <Link href={`/proto/admin/eval/experiments/${r.experimentId}`} className="p-link p-small">
            实验
          </Link>
        ),
    },
  ];

  return (
    <div>
      <EvalCrumb label="回归与发布门禁" />

      <div className="p-page-head">
        <div>
          <h1>回归与发布门禁</h1>
          <p>必跑测试集 + 质量阈值 + 安全硬性规则；安全用例失败一票否决</p>
        </div>
        <div className="p-page-actions">
          <Link href="/proto/admin/eval/experiments" className="p-btn p-btn-secondary p-btn-md">
            去评测实验
          </Link>
          <Link href="/proto/admin/eval/compare" className="p-btn p-btn-secondary p-btn-md">
            去实验对比
          </Link>
        </div>
      </div>

      <div className="p-card p-card-pad" style={{ marginBottom: 12 }}>
        <div className="p-row-between" style={{ marginBottom: 10 }}>
          <h3 className="p-side-h">发布检查</h3>
          <div className="p-row-ops">
            <Select value={exp?.id ?? ""} onChange={(e) => setExpId(e.target.value)} style={{ width: 300 }}>
              {done.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.agentVersion} · {e.name} · {e.id}
                </option>
              ))}
            </Select>
            <Button
              variant={gate?.passed ? "primary" : "danger"}
              icon={gate?.passed ? <ShieldCheck size={13} /> : <ShieldAlert size={13} />}
              disabled={!gate || !exp}
              onClick={() => setReleaseOpen(true)}
            >
              {gate?.passed ? "通过并模拟发布" : "记录为阻止"}
            </Button>
          </div>
        </div>

        {exp && gate ? (
          <>
            <Stats
              items={[
                {
                  label: "质量通过率",
                  value: `${summary?.passRate ?? 0}%`,
                  tone: (summary?.passRate ?? 0) >= 90 ? "ok" : "warn",
                  hint: `${summary?.pass ?? 0}/${summary?.total ?? 0} 用例`,
                },
                {
                  label: "安全用例",
                  value: `${summary?.safetyPass ?? 0}/${summary?.safetyTotal ?? 0}`,
                  tone: summary?.safetyRate === 100 ? "ok" : "danger",
                  hint: "硬性规则，必须 100%",
                },
                { label: "平均耗时", value: `${summary?.avgMs ?? 0} ms`, hint: "逐条平均（模拟）" },
                { label: "线上负反馈率", value: `${MONITOR_STATS.negRate}%`, tone: "warn", hint: "近 7 天，模拟" },
              ]}
            />

            <div className={`p-gate-banner ${gate.passed ? "is-pass" : "is-blocked"}`}>
              <div className="p-row-between">
                <b>{gate.passed ? "门禁检查通过，允许发布" : "门禁检查未通过，禁止发布"}</b>
                <Badge tone={gate.passed ? "ok" : "danger"}>{gate.passed ? "PASS" : "BLOCKED"}</Badge>
              </div>
              <p>
                被测版本 <span className="p-mono">{exp.agentVersion}</span> · 安全用例 {summary?.safetyPass}/{summary?.safetyTotal} ·
                {gate.passed ? " 所有启用的规则均已满足。" : " 安全硬性规则优先于任何质量指标。"}
              </p>
              {!gate.passed && (
                <ul>
                  {gate.checks
                    .filter((c) => !c.passed)
                    .map((c) => (
                      <li key={c.rule.id}>
                        {c.rule.name}：实际 {c.value}
                        {c.rule.unit}，要求 {c.rule.op} {c.rule.threshold}
                        {c.rule.unit}
                      </li>
                    ))}
                  {gate.failedCases
                    .filter((c) => c.failType === "safety")
                    .map((c) => (
                      <li key={c.caseId}>
                        安全用例 {c.caseId} 失败：{c.failReason ?? "未记录原因"}
                      </li>
                    ))}
                </ul>
              )}
            </div>

            <DataTable
              columns={[
                {
                  key: "rule",
                  title: "门禁规则",
                  render: (c) => (
                    <div>
                      <b>{c.rule.name}</b>
                      <span className="p-cell-sub">{c.rule.hard ? "安全硬性 · 一票否决" : "质量阈值"}</span>
                    </div>
                  ),
                },
                { key: "metric", title: "指标", width: "130px", render: (c) => <span className="p-mono p-small">{c.rule.metric}</span> },
                { key: "value", title: "实际值", width: "120px", render: (c) => <b className="p-mono">{c.value}{c.rule.unit}</b> },
                { key: "req", title: "要求", width: "150px", render: (c) => <span className="p-mono p-small">{c.rule.op} {c.rule.threshold}{c.rule.unit}</span> },
                {
                  key: "result",
                  title: "结果",
                  width: "100px",
                  render: (c) => (
                    <Badge tone={c.passed ? "ok" : "danger"}>{c.passed ? "通过" : c.rule.hard ? "阻止" : "未达标"}</Badge>
                  ),
                },
              ]}
              rows={gate.checks}
              rowKey={(c) => c.rule.id}
              empty="门禁规则全部关闭"
            />
          </>
        ) : (
          <p className="p-muted">还没有已完成的实验，先跑一次回归实验再来检查。</p>
        )}
      </div>

      <div className="p-admin-split">
        <div className="p-stack">
          <div className="p-card p-card-pad">
            <div className="p-row-between" style={{ marginBottom: 8 }}>
              <h3 className="p-side-h">门禁规则</h3>
              <span className="p-muted p-small">安全硬性规则不可关闭，阈值固定</span>
            </div>
            <div className="p-lines">
              {state.eval.gateRules.map((r) => (
                <div key={r.id} className="p-gate-rule">
                  <div>
                    <b>{r.name}</b>
                    <span className="p-cell-sub">
                      {r.hard ? "安全硬性规则 · 一票否决" : "质量阈值 · 未达标时提示，不阻止演示发布"}
                    </span>
                  </div>
                  <div className="p-row-ops">
                    <span className="p-muted p-small p-mono">{r.op}</span>
                    <TextInput
                      type="number"
                      value={drafts[r.id] ?? String(r.threshold)}
                      disabled={r.hard}
                      onChange={(e) => setDrafts((prev) => ({ ...prev, [r.id]: e.target.value }))}
                      onBlur={() => commit(r.id)}
                      style={{ width: 92 }}
                    />
                    <span className="p-muted p-small">{r.unit}</span>
                    {r.hard ? (
                      <Badge tone="danger">强制开启</Badge>
                    ) : (
                      <Switch on={r.enabled} onChange={(v) => updateGateRule(r.id, { enabled: v })} />
                    )}
                    {drafts[r.id] !== undefined && (
                      <Button size="sm" variant="primary" onClick={() => commit(r.id)}>
                        保存
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <p className="p-muted p-small" style={{ margin: "10px 0 0" }}>
              安全规则失败时，无论质量通过率多高，版本都会被阻止发布。
            </p>
          </div>

          <div className="p-card">
            <div className="p-card-head">
              <div>
                <h3>发布记录</h3>
                <p>每次门禁检查都会留下记录，回滚不删除历史</p>
              </div>
              <span className="p-muted p-small">{releases.length} 条</span>
            </div>
            <DataTable
              columns={releaseColumns}
              rows={releases}
              rowKey={(r) => r.id}
              empty="还没有发布检查记录"
              emptyHint="运行一个实验后执行发布检查"
            />
          </div>
        </div>

        <div className="p-stack">
          <div className="p-card p-card-pad">
            <h3 className="p-side-h">必跑测试集</h3>
            <div className="p-lines">
              {state.eval.datasets.map((d) => {
                const safety = d.cases.filter((c) => c.safety).length;
                return (
                  <Link key={d.id} href={`/proto/admin/eval/datasets/${d.id}`} className="p-line p-line-link">
                    <div>
                      <b>{d.name}</b>
                      <span>
                        {d.version} · {d.cases.length} 条用例 · {safety} 条安全
                      </span>
                    </div>
                    <Badge tone={d.tags.includes("必跑") ? "danger" : "muted"}>
                      {d.tags.includes("必跑") ? "必跑" : "按需"}
                    </Badge>
                  </Link>
                );
              })}
            </div>
            <p className="p-muted p-small" style={{ margin: "10px 0 0" }}>
              任何模型、Prompt、工具或工作流变更，都必须先跑通必跑测试集。
            </p>
          </div>

          <div className="p-card p-card-pad">
            <h3 className="p-side-h">安全用例</h3>
            <div className="p-lines">
              {safetyCases.map((c) => {
                const r = exp?.results.find((x) => x.caseId === c.id);
                return (
                  <div key={c.id} className="p-line">
                    <div>
                      <b>{c.name}</b>
                      <span className="p-mono p-small">{c.id}</span>
                    </div>
                    {r ? (
                      <Badge tone={r.pass ? "ok" : "danger"}>{r.pass ? "通过" : "失败"}</Badge>
                    ) : (
                      <Badge tone="muted">未运行</Badge>
                    )}
                  </div>
                );
              })}
              {safetyCases.length === 0 && <p className="p-card-pad p-muted" style={{ margin: 0 }}>该数据集没有安全用例。</p>}
            </div>
          </div>

          <div className="p-card p-card-pad">
            <h3 className="p-side-h">发布约定</h3>
            <ul className="p-issue-list">
              <li className="is-ok-static">质量回归只提示，安全用例失败必须阻止发布</li>
              <li className="is-ok-static">发布前必须关联一次成功的回归实验</li>
              <li className="is-ok-static">发布后可随时回滚到上一版本，回滚记录保留</li>
            </ul>
            <Link href="/proto/admin/agents/AGENT-COPILOT-OPS" className="p-btn p-btn-secondary p-btn-sm" style={{ width: "100%", justifyContent: "center" }}>
              查看智能体版本
            </Link>
          </div>

          <div className="p-note">
            <ClipboardCheck size={12} /> 门禁检查、发布与回滚均为模拟操作，不会影响任何真实环境。
          </div>
        </div>
      </div>

      <EvalMockNote>门禁阈值与发布记录为演示配置，实际发布流程需接入真实 CI/CD 与审批系统。</EvalMockNote>

      <Dialog
        open={releaseOpen}
        title={gate?.passed ? "通过门禁并模拟发布？" : "记录为阻止发布？"}
        confirmText={gate?.passed ? "确认发布" : "记录阻止"}
        danger={!gate?.passed}
        onClose={() => setReleaseOpen(false)}
        onConfirm={() => {
          if (exp) recordRelease(exp.id);
          setReleaseOpen(false);
        }}
      >
        {gate?.passed ? (
          <>
            将把 <b>{exp?.agentVersion}</b> 标记为线上版本，原线上版本转为归档。此操作只更新演示状态，不会影响真实环境。
          </>
        ) : (
          <>
            当前版本未满足门禁规则，记录后仍保持草稿或归档状态，需要修复并重新跑回归实验。
          </>
        )}
      </Dialog>

      <Dialog
        open={!!rollbackId}
        title="模拟回滚到上一版本？"
        confirmText="确认回滚"
        danger
        onClose={() => setRollbackId(null)}
        onConfirm={() => {
          if (rollbackId) rollbackRelease(rollbackId);
          setRollbackId(null);
        }}
      >
        回滚会保留发布记录，并把当前发布记录标记为已回滚。演示环境不会执行真实版本切换。
      </Dialog>
    </div>
  );
}
