"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Badge, Button, DataTable, Drawer, EmptyState, KeyValue, Select, Stats, type Column } from "@/components/proto/ui";
import { useProto } from "@/lib/proto/store";
import { FAIL_TYPE_LABEL, caseById, summarize, type EvalCaseResult, type EvalExperiment } from "@/lib/proto/eval-data";
import { DeltaText, EvalCrumb, EvalMockNote, ScoreBar, emitEvalPreset } from "@/components/proto/eval-ui";

const DIMENSIONS = [
  { key: "理解", tags: ["意图", "参数", "追问"] },
  { key: "规划与编排", tags: ["工具", "容错"] },
  { key: "业务完成", tags: ["业务结果", "空域", "人工确认", "权限", "边界"] },
  { key: "安全", tags: ["安全"] },
  { key: "表述质量", tags: ["质量", "表述", "置信度", "业务规则"] },
];

type DiffState = "regressed" | "fixed" | "same_fail" | "same_pass" | "missing";

const DIFF_LABEL: Record<DiffState, string> = {
  regressed: "回归",
  fixed: "已修复",
  same_fail: "仍失败",
  same_pass: "持平通过",
  missing: "口径缺失",
};

interface DiffRow {
  caseId: string;
  name: string;
  input: string;
  safety: boolean;
  base?: EvalCaseResult;
  cand?: EvalCaseResult;
  diff: DiffState;
}

interface DimRow {
  key: string;
  basePass: number;
  baseTotal: number;
  baseRate: number;
  candPass: number;
  candTotal: number;
  candRate: number;
}

export default function ComparePage() {
  const { state } = useProto();
  const router = useRouter();
  const done = state.eval.experiments.filter((e) => e.status === "done");
  const initial = done.find((e) => e.baselineId) ?? done[0];
  const [candId, setCandId] = useState(initial?.id ?? "");
  const [baseId, setBaseId] = useState(initial?.baselineId ?? done.find((e) => e.id !== initial?.id)?.id ?? "");
  const [filter, setFilter] = useState<"all" | DiffState>("all");
  const [detail, setDetail] = useState<DiffRow | null>(null);

  const cand = done.find((e) => e.id === candId);
  const base = done.find((e) => e.id === baseId);
  const candDataset = cand ? state.eval.datasets.find((d) => d.id === cand.datasetId) : undefined;
  const baseDataset = base ? state.eval.datasets.find((d) => d.id === base.datasetId) : undefined;
  const candSummary = cand ? summarize(cand, candDataset) : null;
  const baseSummary = base ? summarize(base, baseDataset) : null;

  const diffRows = useMemo<DiffRow[]>(() => {
    if (!base || !cand) return [];
    const ids = Array.from(new Set([...cand.results.map((r) => r.caseId), ...base.results.map((r) => r.caseId)]));
    const list = ids.map((id) => {
      const b = base.results.find((r) => r.caseId === id);
      const c = cand.results.find((r) => r.caseId === id);
      const cse = caseById(candDataset, id) ?? caseById(baseDataset, id);
      const diff: DiffState = !b || !c
        ? "missing"
        : b.pass && !c.pass
          ? "regressed"
          : !b.pass && c.pass
            ? "fixed"
            : c.pass
              ? "same_pass"
              : "same_fail";
      return { caseId: id, name: cse?.name ?? id, input: cse?.input ?? "", safety: cse?.safety ?? false, base: b, cand: c, diff };
    });
    const order: Record<DiffState, number> = { regressed: 0, fixed: 1, same_fail: 2, missing: 3, same_pass: 4 };
    return list.sort((x, y) => order[x.diff] - order[y.diff]);
  }, [base, cand, baseDataset, candDataset]);

  const rows = filter === "all" ? diffRows : diffRows.filter((r) => r.diff === filter);
  const fixed = diffRows.filter((r) => r.diff === "fixed").length;
  const regressed = diffRows.filter((r) => r.diff === "regressed").length;

  const dimRows = useMemo<DimRow[]>(() => {
    if (!base || !cand || !candDataset) return [];
    return DIMENSIONS.map((d) => {
      const cases = candDataset.cases.filter((c) => c.tags.some((t) => d.tags.includes(t)) && cand.caseIds.includes(c.id));
      const score = (exp: EvalExperiment) => {
        const rs = exp.results.filter((r) => cases.some((c) => c.id === r.caseId));
        const pass = rs.filter((r) => r.pass).length;
        return { pass, total: rs.length, rate: rs.length ? Math.round((pass / rs.length) * 100) : 0 };
      };
      const b = score(base);
      const c = score(cand);
      return { key: d.key, basePass: b.pass, baseTotal: b.total, baseRate: b.rate, candPass: c.pass, candTotal: c.total, candRate: c.rate };
    }).filter((d) => d.candTotal > 0);
  }, [base, cand, candDataset]);

  const configRows =
    base && cand
      ? [
          { k: "Agent 版本", a: base.agentVersion, b: cand.agentVersion },
          { k: "模型", a: base.model, b: cand.model },
          { k: "Prompt 版本", a: base.promptVersion, b: cand.promptVersion },
          { k: "输出 Schema", a: base.schemaVersion ?? "未记录", b: cand.schemaVersion ?? "未记录" },
          { k: "路由策略", a: base.routingPolicy ?? "默认路由", b: cand.routingPolicy ?? "默认路由" },
          { k: "检索配置", a: base.retrievalConfig ?? "未记录", b: cand.retrievalConfig ?? "未记录" },
          { k: "工具配置", a: base.toolsVersion, b: cand.toolsVersion },
          { k: "工作流", a: base.workflowVersion, b: cand.workflowVersion },
          { k: "数据集", a: `${base.datasetVersion} · ${base.caseIds.length} 条`, b: `${cand.datasetVersion} · ${cand.caseIds.length} 条` },
        ]
      : [];

  const caseColumns: Column<DiffRow>[] = [
    {
      key: "case",
      title: "用例",
      render: (r) => (
        <div>
          <b>{r.name}</b>
          <span className="p-cell-sub p-mono">
            {r.caseId}
            {r.safety ? " · 安全用例" : ""}
          </span>
        </div>
      ),
    },
    {
      key: "base",
      title: `基线 ${base?.agentVersion ?? ""}`,
      width: "140px",
      render: (r) =>
        r.base ? (
          <Badge tone={r.base.pass ? "ok" : "danger"}>
            {r.base.pass ? "通过" : r.base.failType ? FAIL_TYPE_LABEL[r.base.failType] : "失败"}
          </Badge>
        ) : (
          <span className="p-muted">—</span>
        ),
    },
    {
      key: "cand",
      title: `候选 ${cand?.agentVersion ?? ""}`,
      width: "140px",
      render: (r) =>
        r.cand ? (
          <Badge tone={r.cand.pass ? "ok" : "danger"}>
            {r.cand.pass ? "通过" : r.cand.failType ? FAIL_TYPE_LABEL[r.cand.failType] : "失败"}
          </Badge>
        ) : (
          <span className="p-muted">—</span>
        ),
    },
    {
      key: "diff",
      title: "变化",
      width: "100px",
      render: (r) => (
        <Badge tone={r.diff === "regressed" ? "danger" : r.diff === "fixed" ? "ok" : r.diff === "same_fail" ? "warn" : "muted"}>
          {DIFF_LABEL[r.diff]}
        </Badge>
      ),
    },
    {
      key: "why",
      title: "差异原因",
      render: (r) =>
        r.cand && !r.cand.pass ? (
          <span className="p-small">
            {r.cand.failType ? FAIL_TYPE_LABEL[r.cand.failType] : "失败"} · {r.cand.failReason ?? "未记录原因"}
          </span>
        ) : r.base && !r.base.pass ? (
          <span className="p-small p-muted">基线失败项在候选版本中通过</span>
        ) : (
          <span className="p-muted">—</span>
        ),
    },
  ];

  const dimColumns: Column<DimRow>[] = [
    { key: "dim", title: "能力维度", render: (d) => <b>{d.key}</b> },
    {
      key: "base",
      title: "基线得分",
      width: "210px",
      render: (d) => (
        <div>
          <ScoreBar value={d.baseRate} />
          <span className="p-cell-sub">{d.basePass}/{d.baseTotal} 用例</span>
        </div>
      ),
    },
    {
      key: "cand",
      title: "候选得分",
      width: "210px",
      render: (d) => (
        <div>
          <ScoreBar value={d.candRate} />
          <span className="p-cell-sub">{d.candPass}/{d.candTotal} 用例</span>
        </div>
      ),
    },
    { key: "delta", title: "变化", width: "90px", render: (d) => <DeltaText from={d.baseRate} to={d.candRate} /> },
  ];

  const detailCase = detail ? caseById(candDataset, detail.caseId) ?? caseById(baseDataset, detail.caseId) : undefined;

  if (!cand || !base) {
    return (
      <div>
        <EvalCrumb label="实验对比" />
        <EmptyState
          title="至少需要两个已完成的实验"
          hint="先运行基线与候选实验，再回来比较分项得分与回归差异"
          action={
            <Link href="/proto/admin/eval/experiments" className="p-btn p-btn-primary p-btn-md">
              去评测实验
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <EvalCrumb label="实验对比" />

      <div className="p-page-head">
        <div>
          <h1>实验对比</h1>
          <p>同一份数据集的口径下，比较模型、Prompt、Schema、路由、工具配置与工作流版本的差异</p>
        </div>
        <div className="p-page-actions">
          <Button
            icon={<ShieldCheck size={13} />}
            onClick={() => {
              emitEvalPreset({ experimentId: cand.id });
              router.push("/proto/admin/eval/gate");
            }}
          >
            送发布门禁
          </Button>
          <Link href={`/proto/admin/eval/experiments/${cand.id}`} className="p-btn p-btn-secondary p-btn-md">
            查看候选实验 <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      <div className="p-toolbar">
        <span className="p-muted p-small">基线</span>
        <Select
          value={baseId}
          onChange={(e) => setBaseId(e.target.value)}
          style={{ width: 260 }}
        >
          {done
            .filter((e) => e.id !== candId)
            .map((e) => (
              <option key={e.id} value={e.id}>
                {e.agentVersion} · {e.id}
              </option>
            ))}
        </Select>
        <span className="p-muted p-small">候选</span>
        <Select
          value={candId}
          onChange={(e) => {
            const next = done.find((x) => x.id === e.target.value);
            setCandId(e.target.value);
            if (next?.baselineId) setBaseId(next.baselineId);
          }}
          style={{ width: 260 }}
        >
          {done.map((e) => (
            <option key={e.id} value={e.id}>
              {e.agentVersion} · {e.id}
            </option>
          ))}
        </Select>
        <span className="p-toolbar-count">
          {base.datasetVersion === cand.datasetVersion ? "数据集口径一致" : "数据集版本不同，差异仅供演示"}
        </span>
      </div>

      <Stats
        items={[
          {
            label: "候选通过率",
            value: `${candSummary?.passRate ?? 0}%`,
            tone: (candSummary?.passRate ?? 0) >= 90 ? "ok" : "warn",
            hint: `基线 ${baseSummary?.passRate ?? 0}% → 候选 ${candSummary?.passRate ?? 0}%`,
          },
          {
            label: "安全用例",
            value: `${candSummary?.safetyPass ?? 0}/${candSummary?.safetyTotal ?? 0}`,
            tone: candSummary?.safetyRate === 100 ? "ok" : "danger",
            hint: "与基线独立判定，一票否决",
          },
          { label: "修复用例", value: fixed, tone: fixed ? "ok" : "muted", hint: "基线失败 → 候选通过" },
          { label: "回归用例", value: regressed, tone: regressed ? "danger" : "ok", hint: "基线通过 → 候选失败" },
        ]}
      />

      {candSummary && candSummary.safetyRate < 100 && (
        <div className="p-warn-banner">
          候选版本存在安全用例失败：{candSummary.safetyPass}/{candSummary.safetyTotal} 通过。即使其他指标更好，发布门禁也会阻止该版本。
        </div>
      )}

      <div className="p-admin-split">
        <div className="p-stack">
          <div className="p-card p-card-pad">
            <div className="p-row-between" style={{ marginBottom: 4 }}>
              <h3 className="p-side-h">分项得分</h3>
              <span className="p-muted p-small">按用例标签归集，分母为该维度命中的用例数</span>
            </div>
            <DataTable columns={dimColumns} rows={dimRows} rowKey={(d) => d.key} empty="没有可对比的分项" />
          </div>

          <div className="p-card">
            <div className="p-card-head">
              <div>
                <h3>逐条差异</h3>
                <p>优先展示回归项，其次修复项与仍失败项</p>
              </div>
              <Select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} style={{ width: 140 }}>
                <option value="all">全部用例</option>
                <option value="regressed">仅回归</option>
                <option value="fixed">仅修复</option>
                <option value="same_fail">仍失败</option>
                <option value="same_pass">持平通过</option>
              </Select>
            </div>
            <DataTable
              columns={caseColumns}
              rows={rows}
              rowKey={(r) => r.caseId}
              onRowClick={(r) => setDetail(r)}
              empty="没有符合筛选条件的用例"
            />
          </div>
        </div>

        <div className="p-stack">
          <div className="p-card">
            <div className="p-card-head">
              <h3>版本配置差异</h3>
              <span className="p-muted p-small">基线 → 候选</span>
            </div>
            <div className="p-lines">
              {configRows.map((c) => (
                <div key={c.k} className="p-line">
                  <div>
                    <b>{c.k}</b>
                    <span className="p-mono p-small">
                      {c.a} → {c.b}
                    </span>
                  </div>
                  <Badge tone={c.a === c.b ? "muted" : "info"}>{c.a === c.b ? "相同" : "变更"}</Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="p-card p-card-pad">
            <h3 className="p-side-h">对比结论</h3>
            <ul className="p-issue-list">
              <li className={fixed ? "is-ok-static" : ""}>修复 {fixed} 条，回归 {regressed} 条</li>
              <li className={candSummary?.safetyRate === 100 ? "is-ok-static" : "is-error"}>
                安全用例 {candSummary?.safetyPass}/{candSummary?.safetyTotal} 通过
                {candSummary?.safetyRate === 100 ? "，满足硬性要求" : "，未满足硬性要求"}
              </li>
              <li className={regressed ? "is-warn" : "is-ok-static"}>
                {regressed ? "存在回归项，需要修复后再送门禁" : "没有发现质量回归"}
              </li>
            </ul>
            <Link href="/proto/admin/eval/failures" className="p-btn p-btn-secondary p-btn-sm" style={{ width: "100%", justifyContent: "center" }}>
              去失败分析登记修复
            </Link>
          </div>

          <div className="p-note">对比使用同一数据集版本与同一套评估器；模型、Prompt 或工具配置不同都会影响结果。</div>
        </div>
      </div>

      <EvalMockNote>实验对比基于预置模拟结果生成，仅用于演示评测与门禁流程。</EvalMockNote>

      <Drawer
        open={!!detail}
        title={detail?.name ?? ""}
        sub={detail ? `${detail.caseId} · ${DIFF_LABEL[detail.diff]}` : undefined}
        onClose={() => setDetail(null)}
        width={580}
        footer={
          <div className="p-inline-actions" style={{ margin: 0 }}>
            {detail?.cand?.traceId && (
              <Link href={`/proto/admin/traces/${detail.cand.traceId}`} className="p-btn p-btn-secondary p-btn-sm">
                候选 Trace
              </Link>
            )}
            <Link href={`/proto/admin/eval/experiments/${cand.id}`} className="p-btn p-btn-secondary p-btn-sm">
              候选实验
            </Link>
            <Link href={`/proto/admin/eval/experiments/${base.id}`} className="p-btn p-btn-secondary p-btn-sm">
              基线实验
            </Link>
          </div>
        }
      >
        {detail && (
          <div className="p-stack">
            <KeyValue
              cols={1}
              items={[
                { k: "输入", v: `「${detail.input}」` },
                { k: "期望结果", v: detailCase?.expectedResult ?? "—" },
                {
                  k: `基线 ${base.agentVersion}`,
                  v: detail.base
                    ? `${detail.base.actualIntent} · ${detail.base.actualTools.join(" → ") || "无工具"} · ${detail.base.ruleNote}`
                    : "基线未运行该用例",
                },
                {
                  k: `候选 ${cand.agentVersion}`,
                  v: detail.cand
                    ? `${detail.cand.actualIntent} · ${detail.cand.actualTools.join(" → ") || "无工具"} · ${detail.cand.ruleNote}`
                    : "候选未运行该用例",
                },
                ...(detail.cand?.failReason ? [{ k: "候选失败归因", v: detail.cand.failReason }] : []),
                ...(detail.base?.failReason ? [{ k: "基线失败归因", v: detail.base.failReason }] : []),
              ]}
            />
            <div className="p-note">
              规则判定为确定性结论；LLM 评分（模拟）只用于表述质量，不参与安全判定。
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
