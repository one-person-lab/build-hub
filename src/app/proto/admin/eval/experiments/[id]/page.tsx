"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Play, ShieldCheck } from "lucide-react";
import { Badge, Button, DataTable, Dialog, Drawer, EmptyState, KeyValue, Select, Stats, type Column } from "@/components/proto/ui";
import { useProto } from "@/lib/proto/store";
import {
  FAIL_TYPE_LABEL,
  caseById,
  evaluatorById,
  summarize,
  type EvalCaseResult,
} from "@/lib/proto/eval-data";
import { EvalCrumb, EvalMockNote, FailTypeBadge, KindBadge, RunBadge, ScoreBar } from "@/components/proto/eval-ui";

export default function ExperimentDetailPage() {
  const params = useParams<{ id: string }>();
  const experimentId = decodeURIComponent(params.id);
  const { state, runExperiment } = useProto();
  const [tab, setTab] = useState<"all" | "fail" | "safety">("all");
  const [detail, setDetail] = useState<EvalCaseResult | null>(null);
  const [runOpen, setRunOpen] = useState(false);

  const exp = state.eval.experiments.find((e) => e.id === experimentId);
  const dataset = exp ? state.eval.datasets.find((d) => d.id === exp.datasetId) : undefined;
  const summary = exp ? summarize(exp, dataset) : null;

  const rows = useMemo(() => {
    if (!exp) return [];
    const safetyIds = new Set((dataset?.cases ?? []).filter((c) => c.safety).map((c) => c.id));
    return exp.results.filter((r) => {
      if (tab === "fail") return !r.pass;
      if (tab === "safety") return safetyIds.has(r.caseId);
      return true;
    });
  }, [exp, dataset, tab]);

  if (!exp) {
    return (
      <div className="p-card p-card-pad">
        <b>实验不存在</b>
        <Link href="/proto/admin/eval/experiments" className="p-btn p-btn-primary p-btn-md">返回实验列表</Link>
      </div>
    );
  }

  const progress = exp.caseIds.length ? Math.round((exp.results.length / exp.caseIds.length) * 100) : 0;
  const baseline = exp.baselineId ? state.eval.experiments.find((e) => e.id === exp.baselineId) : undefined;

  const columns: Column<EvalCaseResult>[] = [
    {
      key: "case",
      title: "用例",
      render: (r) => {
        const c = caseById(dataset, r.caseId);
        return (
          <div>
            <b>{c?.name ?? r.caseId}</b>
            <span className="p-cell-sub p-mono">{r.caseId}</span>
          </div>
        );
      },
    },
    {
      key: "expected",
      title: "期望",
      render: (r) => {
        const c = caseById(dataset, r.caseId);
        return (
          <div>
            <b className="p-mono p-small">{c?.expectedIntent}</b>
            <span className="p-cell-sub">{c?.expectedTools.length ? c.expectedTools.join(" → ") : "不调用工具"}</span>
          </div>
        );
      },
    },
    {
      key: "actual",
      title: "实际",
      render: (r) => (
        <div>
          <b className="p-mono p-small">{r.actualIntent}</b>
          <span className="p-cell-sub">{r.actualTools.length ? r.actualTools.join(" → ") : "未调用工具"}</span>
        </div>
      ),
    },
    {
      key: "rule",
      title: "规则",
      width: "110px",
      render: (r) => (
        <Badge tone={r.rulePass ? "ok" : "danger"}>{r.rulePass ? "通过" : r.failType ? FAIL_TYPE_LABEL[r.failType] : "失败"}</Badge>
      ),
    },
    {
      key: "llm",
      title: "LLM 评分（模拟）",
      width: "150px",
      render: (r) => <ScoreBar value={r.llmScore} suffix="" />,
    },
    {
      key: "human",
      title: "人工",
      width: "90px",
      render: (r) =>
        r.human === "none" ? (
          <span className="p-muted p-small">未抽检</span>
        ) : (
          <Badge tone={r.human === "pending" ? "warn" : r.human === "confirmed" ? "info" : "muted"}>
            {r.human === "pending" ? "待复核" : r.human === "confirmed" ? "已确认" : "已推翻"}
          </Badge>
        ),
    },
    {
      key: "ops",
      title: "",
      width: "70px",
      render: (r) => <button className="p-btn p-btn-text" onClick={(e) => { e.stopPropagation(); setDetail(r); }}>详情</button>,
    },
  ];

  const detailCase = detail ? caseById(dataset, detail.caseId) : undefined;

  return (
    <div>
      <EvalCrumb label={`实验 / ${exp.id}`} />

      <div className="p-page-head">
        <div>
          <h1>{exp.name}</h1>
          <p>
            <span className="p-mono">{exp.id}</span> · {dataset?.name ?? exp.datasetId} {exp.datasetVersion} · {exp.caseIds.length} 条用例
          </p>
        </div>
        <div className="p-page-actions">
          <RunBadge status={exp.status} />
          <Badge tone="info">{exp.agentVersion}</Badge>
          <Button icon={<Play size={13} />} onClick={() => setRunOpen(true)} disabled={exp.status === "running"}>
            {exp.status === "running" ? `运行中 ${exp.results.length}/${exp.caseIds.length}` : "重新运行"}
          </Button>
          <Link href="/proto/admin/eval/gate" className="p-btn p-btn-secondary p-btn-md">
            <ShieldCheck size={13} /> 送门禁
          </Link>
        </div>
      </div>

      <Stats
        items={[
          {
            label: "通过率",
            value: summary ? `${summary.passRate}%` : "—",
            tone: summary && summary.passRate >= 90 ? "ok" : "warn",
            hint: `${summary?.pass ?? 0}/${summary?.total ?? 0} 用例`,
          },
          {
            label: "安全用例",
            value: summary ? `${summary.safetyPass}/${summary.safetyTotal}` : "—",
            tone: summary && summary.safetyRate === 100 ? "ok" : "danger",
            hint: "硬性门禁",
          },
          { label: "平均耗时", value: summary ? `${summary.avgMs} ms` : "—", hint: "逐条结果平均（模拟）" },
          { label: "运行耗时", value: exp.ms ? `${(exp.ms / 1000).toFixed(1)}s` : "—", hint: exp.runAt ?? "未运行" },
        ]}
      />

      <div className="p-card p-card-pad" style={{ marginBottom: 12 }}>
        <div className="p-row-between" style={{ marginBottom: 8 }}>
          <h3 className="p-side-h">被测配置</h3>
          {baseline && (
            <Link href={`/proto/admin/eval/experiments/${baseline.id}`} className="p-link p-small">
              基线：{baseline.agentVersion}
            </Link>
          )}
        </div>
        <KeyValue
          cols={4}
          items={[
            { k: "Agent", v: <span className="p-mono">{exp.agentVersion}</span> },
            { k: "模型", v: <span className="p-mono">{exp.model}</span> },
            { k: "Prompt", v: <span className="p-mono">{exp.promptVersion}</span> },
            {
              k: "输出 Schema",
              v: exp.schemaVersion ? (
                <Link href={`/proto/admin/tools/schemas/${exp.schemaVersion.split("@")[0]}`} className="p-link p-mono">
                  {exp.schemaVersion}
                </Link>
              ) : (
                <span className="p-muted">未记录</span>
              ),
            },
            {
              k: "路由策略",
              v: <Link href="/proto/admin/models/routing" className="p-link p-mono">{exp.routingPolicy ?? "默认路由"}</Link>,
            },
            {
              k: "检索配置",
              v: exp.retrievalConfig ? (
                <Link href={`/proto/admin/kb/config?config=${exp.retrievalConfig}`} className="p-link p-mono">
                  {exp.retrievalConfig}
                </Link>
              ) : (
                <span className="p-muted">未记录</span>
              ),
            },
            { k: "工具配置", v: <span className="p-mono">{exp.toolsVersion}</span> },
            { k: "工作流", v: <span className="p-mono">{exp.workflowVersion}</span> },
            {
              k: "评估器",
              v: (
                <span className="p-tag-row">
                  {exp.evaluatorIds.map((id) => {
                    const ev = evaluatorById(id);
                    return ev ? <KindBadge key={id} kind={ev.kind} /> : null;
                  })}
                </span>
              ),
            },
          ]}
        />
      </div>

      {exp.status === "running" && (
        <div className="p-eval-progress" style={{ marginBottom: 12 }}>
          <div className="p-progress"><i style={{ width: `${progress}%` }} /></div>
          <span>正在逐条回填结果：{exp.results.length}/{exp.caseIds.length}（模拟运行）</span>
        </div>
      )}

      {exp.results.length === 0 && exp.status !== "running" ? (
        <EmptyState
          title="实验还未运行"
          hint="运行后会逐条展示期望、实际、规则判定、模型评分与失败归因"
          action={<Button variant="primary" onClick={() => setRunOpen(true)}>开始运行</Button>}
        />
      ) : (
        <>
          <div className="p-toolbar">
            <Select value={tab} onChange={(e) => setTab(e.target.value as typeof tab)} style={{ width: 150 }}>
              <option value="all">全部结果</option>
              <option value="fail">仅失败</option>
              <option value="safety">仅安全用例</option>
            </Select>
            <span className="p-toolbar-count">
              {rows.length} 条 · 失败 {exp.results.filter((r) => !r.pass).length} 条
            </span>
          </div>

          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(r) => r.caseId}
            onRowClick={(r) => setDetail(r)}
            empty="没有符合条件的结果"
          />
        </>
      )}

      <Drawer
        open={!!detail}
        title={detailCase?.name ?? detail?.caseId ?? ""}
        sub={detail ? `${detail.caseId} · ${detail.pass ? "通过" : "失败"}` : undefined}
        onClose={() => setDetail(null)}
        width={560}
        footer={
          <div className="p-inline-actions" style={{ margin: 0 }}>
            {detail?.traceId && (
              <Link href={`/proto/admin/traces/${detail.traceId}`} className="p-btn p-btn-secondary p-btn-sm">
                查看关联 Trace
              </Link>
            )}
            <Link href="/proto/admin/eval/failures" className="p-btn p-btn-secondary p-btn-sm">
              去失败分析
            </Link>
            <Link href="/proto/admin/eval/labeling" className="p-btn p-btn-primary p-btn-sm">
              去人工标注
            </Link>
          </div>
        }
      >
        {detail && detailCase && (
          <div className="p-stack">
            <Badge tone={detail.pass ? "ok" : "danger"}>{detail.pass ? "规则判定通过" : "规则判定失败"}</Badge>
            <KeyValue
              cols={1}
              items={[
                { k: "输入", v: `「${detailCase.input}」` },
                { k: "期望意图 / 工具", v: `${detailCase.expectedIntent} · ${detailCase.expectedTools.join(" → ") || "无"}` },
                { k: "实际意图 / 工具", v: `${detail.actualIntent} · ${detail.actualTools.join(" → ") || "无"}` },
                { k: "期望结果", v: detailCase.expectedResult },
                { k: "规则评估（确定性）", v: detail.ruleNote },
                { k: "LLM 评分（模拟）", v: `${detail.llmScore} 分 · ${detail.llmNote}` },
                { k: "耗时", v: `${detail.ms} ms` },
                { k: "关联 Trace", v: detail.traceId ? <Link href={`/proto/admin/traces/${detail.traceId}`} className="p-link p-mono">{detail.traceId}</Link> : "—" },
              ]}
            />
            {detail.failReason && (
              <div className="p-warn-banner" style={{ marginBottom: 0 }}>
                失败归因：{detail.failType ? FAIL_TYPE_LABEL[detail.failType] : "未归类"} · {detail.failReason}
              </div>
            )}
            <div className="p-note">
              规则判定为确定性结论；LLM 评分只用于质量与表述，且此处为模拟值，不参与安全门禁。
            </div>
          </div>
        )}
      </Drawer>

      <Dialog
        open={runOpen}
        title="重新运行实验？"
        confirmText="开始运行"
        onClose={() => setRunOpen(false)}
        onConfirm={() => {
          runExperiment(exp.id);
          setRunOpen(false);
        }}
      >
        将用当前数据集与被测配置重新生成全部结果，现有结果会被覆盖（模拟）。
      </Dialog>

      <EvalMockNote />
    </div>
  );
}
