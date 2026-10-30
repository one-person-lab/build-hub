"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, UserCheck } from "lucide-react";
import { Badge, Button, DataTable, Drawer, KeyValue, Select, Stats, Textarea, type Column } from "@/components/proto/ui";
import { useProto } from "@/lib/proto/store";
import { caseById, type Annotation } from "@/lib/proto/eval-data";
import { EvalCrumb, EvalMockNote, ScoreBar } from "@/components/proto/eval-ui";

const STATUS_LABEL: Record<Annotation["status"], string> = {
  pending: "待标注",
  confirmed: "已确认",
  overturned: "已推翻",
};

const STATUS_TONE = {
  pending: "warn",
  confirmed: "info",
  overturned: "muted",
} as const;

export default function LabelingPage() {
  const { state, annotate } = useProto();
  const [status, setStatus] = useState("pending");
  const [source, setSource] = useState("all");
  const [q, setQ] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<"model_ok" | "model_error" | "">("");
  const [note, setNote] = useState("");

  const annotations = state.eval.annotations;

  const rows = useMemo(
    () =>
      annotations.filter((a) => {
        if (status !== "all" && a.status !== status) return false;
        if (source !== "all" && a.source !== source) return false;
        if (!q) return true;
        const c = caseById(state.eval.datasets.find((d) => d.id === state.eval.experiments.find((e) => e.id === a.experimentId)?.datasetId), a.caseId);
        const text = `${a.question} ${a.caseId} ${a.experimentId} ${c?.name ?? ""}`.toLowerCase();
        return text.includes(q.toLowerCase());
      }),
    [annotations, status, source, q, state.eval.datasets, state.eval.experiments],
  );

  const pending = annotations.filter((a) => a.status === "pending").length;
  const confirmed = annotations.filter((a) => a.status === "confirmed").length;
  const overturned = annotations.filter((a) => a.status === "overturned").length;

  const calib = (src: Annotation["source"]) => {
    const list = annotations.filter((a) => a.source === src && a.status !== "pending");
    const agree = list.filter((a) => a.status === "confirmed").length;
    return { agree, total: list.length, rate: list.length ? Math.round((agree / list.length) * 100) : 0 };
  };

  const selected = annotations.find((a) => a.id === activeId);
  const selectedExp = selected ? state.eval.experiments.find((e) => e.id === selected.experimentId) : undefined;
  const selectedDs = selectedExp ? state.eval.datasets.find((d) => d.id === selectedExp.datasetId) : undefined;
  const selectedCase = selected ? caseById(selectedDs, selected.caseId) : undefined;

  const open = (a: Annotation) => {
    setActiveId(a.id);
    setVerdict(a.verdict ?? "");
    setNote(a.note ?? "");
  };

  const columns: Column<Annotation>[] = [
    {
      key: "question",
      title: "待复核问题",
      render: (a) => {
        const exp = state.eval.experiments.find((e) => e.id === a.experimentId);
        const ds = state.eval.datasets.find((d) => d.id === exp?.datasetId);
        const c = caseById(ds, a.caseId);
        return (
          <div>
            <b>{a.question}</b>
            <span className="p-cell-sub">
              {a.caseId} · {c?.name ?? "用例"} · {a.id}
            </span>
          </div>
        );
      },
    },
    {
      key: "source",
      title: "来源",
      width: "130px",
      render: (a) =>
        a.source === "rule" ? <Badge tone="info">确定性规则</Badge> : <Badge tone="brand">LLM 评分（模拟）</Badge>,
    },
    {
      key: "auto",
      title: "自动判定",
      width: "150px",
      render: (a) => (
        <div>
          <Badge tone={a.autoVerdict === "fail" ? "danger" : "ok"}>{a.autoVerdict === "fail" ? "判定失败" : "判定通过"}</Badge>
          <span className="p-cell-sub">评分 {a.autoScore}</span>
        </div>
      ),
    },
    {
      key: "status",
      title: "状态",
      width: "100px",
      render: (a) => <Badge tone={STATUS_TONE[a.status]}>{STATUS_LABEL[a.status]}</Badge>,
    },
    {
      key: "by",
      title: "标注人",
      width: "120px",
      render: (a) =>
        a.by ? (
          <div>
            <b className="p-small">{a.by}</b>
            <span className="p-cell-sub p-mono">{a.at}</span>
          </div>
        ) : (
          <span className="p-muted">—</span>
        ),
    },
    {
      key: "ops",
      title: "",
      width: "80px",
      render: (a) => (
        <button
          className="p-btn p-btn-text"
          onClick={(e) => {
            e.stopPropagation();
            open(a);
          }}
        >
          {a.status === "pending" ? "标注" : "查看"}
        </button>
      ),
    },
  ];

  return (
    <div>
      <EvalCrumb label="人工标注" />

      <div className="p-page-head">
        <div>
          <h1>人工标注</h1>
          <p>抽样复核规则与模拟 LLM 评分，确认评分是否可信，并校准评估器</p>
        </div>
        <div className="p-page-actions">
          <Link href="/proto/admin/eval/datasets" className="p-btn p-btn-secondary p-btn-md">
            查看数据集
          </Link>
          <Link href="/proto/admin/eval/failures" className="p-btn p-btn-primary p-btn-md">
            去失败分析
          </Link>
        </div>
      </div>

      <Stats
        items={[
          { label: "待标注", value: pending, tone: "warn", hint: "规则与 LLM 评分结果" },
          { label: "已确认", value: confirmed, tone: "ok", hint: "自动判定成立" },
          { label: "已推翻", value: overturned, tone: "info", hint: "自动判定有误" },
          { label: "复核总数", value: annotations.length, hint: "抽样口径：争议与高风险用例" },
        ]}
      />

      <div className="p-admin-split">
        <div className="p-stack">
          <div className="p-card">
            <div className="p-card-head">
              <div>
                <h3>待复核队列</h3>
                <p>规则判定优先复核安全用例；LLM 评分只用于校准表述质量</p>
              </div>
            </div>
            <div className="p-toolbar" style={{ borderTop: 0 }}>
              <div className="p-toolbar-search">
                <Search size={13} />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索问题、用例或实验" />
              </div>
              <Select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: 130 }}>
                <option value="pending">待标注</option>
                <option value="confirmed">已确认</option>
                <option value="overturned">已推翻</option>
                <option value="all">全部状态</option>
              </Select>
              <Select value={source} onChange={(e) => setSource(e.target.value)} style={{ width: 150 }}>
                <option value="all">全部来源</option>
                <option value="rule">确定性规则</option>
                <option value="llm">LLM 评分（模拟）</option>
              </Select>
              <span className="p-toolbar-count">{rows.length} 条</span>
            </div>
            <DataTable
              columns={columns}
              rows={rows}
              rowKey={(a) => a.id}
              onRowClick={open}
              empty="没有符合条件的标注任务"
              emptyHint="从实验详情进入失败用例也可发起复核"
            />
          </div>
        </div>

        <div className="p-stack">
          <div className="p-card p-card-pad">
            <h3 className="p-side-h">评估器一致性</h3>
            <div className="p-stack" style={{ gap: 10 }}>
              {(["rule", "llm"] as const).map((src) => {
                const c = calib(src);
                return (
                  <div key={src}>
                    <div className="p-row-between" style={{ marginBottom: 4 }}>
                      <span className="p-small">{src === "rule" ? "确定性规则" : "LLM 评分（模拟）"}</span>
                      <span className="p-muted p-small">
                        {c.agree}/{c.total} 一致
                      </span>
                    </div>
                    <ScoreBar value={c.rate} />
                  </div>
                );
              })}
            </div>
            <p className="p-muted p-small" style={{ margin: "10px 0 0" }}>
              一致性 = 人工确认的自动判定数 / 已复核总数。被推翻的样本应回到数据集与评估器调整。
            </p>
          </div>

          <div className="p-card">
            <div className="p-card-head">
              <h3>评分偏差样本</h3>
              <span className="p-muted p-small">{overturned} 条</span>
            </div>
            <div className="p-lines">
              {annotations
                .filter((a) => a.status === "overturned")
                .map((a) => (
                  <div key={a.id} className="p-line">
                    <div>
                      <b>{a.question}</b>
                      <span>{a.note}</span>
                    </div>
                    <Badge tone="muted">{a.source === "llm" ? "LLM" : "规则"}</Badge>
                  </div>
                ))}
              {overturned === 0 && <p className="p-card-pad p-muted" style={{ margin: 0 }}>还没有被推翻的自动判定。</p>}
            </div>
          </div>

          <div className="p-card p-card-pad">
            <h3 className="p-side-h">标注约定</h3>
            <ul className="p-issue-list">
              <li className="is-ok-static">安全用例必须人工复核判定条件，不以模型评分为准</li>
              <li className="is-ok-static">确认真实失败后，进入失败分析登记修复记录</li>
              <li className="is-ok-static">推翻样本要写明理由，用于调整规则或评分提示词</li>
            </ul>
          </div>

          <div className="p-note">标注结果直接写回实验的使用人工复核状态，后续可用于计算评估器一致率。</div>
        </div>
      </div>

      <EvalMockNote>人工标注弹窗中的自动判定与评分为模拟数据，复核结论仅保存在本次演示会话中。</EvalMockNote>

      <Drawer
        open={!!selected}
        title={selected?.question ?? ""}
        sub={selected ? `${selected.id} · ${selected.experimentId} · ${selected.caseId}` : undefined}
        onClose={() => setActiveId(null)}
        width={580}
        footer={
          selected?.status === "pending" ? (
            <div className="p-inline-actions" style={{ margin: 0 }}>
              <Button onClick={() => setActiveId(null)}>稍后处理</Button>
              <Button
                variant={verdict === "model_ok" ? "primary" : "secondary"}
                onClick={() => setVerdict("model_ok")}
              >
                判定正确
              </Button>
              <Button
                variant={verdict === "model_error" ? "danger" : "secondary"}
                onClick={() => setVerdict("model_error")}
              >
                判定有误
              </Button>
              <Button
                variant="primary"
                icon={<UserCheck size={13} />}
                disabled={!verdict}
                onClick={() => {
                  if (!selected || !verdict) return;
                  annotate(selected.id, verdict, note);
                  setActiveId(null);
                }}
              >
                保存复核
              </Button>
            </div>
          ) : (
            <div className="p-inline-actions" style={{ margin: 0 }}>
              <Link href={`/proto/admin/eval/experiments/${selected?.experimentId}`} className="p-btn p-btn-secondary p-btn-sm">
                查看实验与用例结果
              </Link>
              <Button onClick={() => setActiveId(null)}>关闭</Button>
            </div>
          )
        }
      >
        {selected && (
          <div className="p-stack">
            <KeyValue
              cols={1}
              items={[
                { k: "用例输入", v: `「${selectedCase?.input ?? "—"}」` },
                { k: "期望结果", v: selectedCase?.expectedResult ?? "—" },
                { k: "自动判定", v: `${selected.autoVerdict === "fail" ? "失败" : "通过"} · 评分 ${selected.autoScore}` },
                { k: "自动判定说明", v: selected.autoNote },
                ...(selected.status === "pending"
                  ? []
                  : [
                      { k: "复核结论", v: selected.verdict === "model_ok" ? "自动判定正确" : "自动判定有误" },
                      { k: "复核说明", v: selected.note ?? "—" },
                      { k: "复核人 / 时间", v: `${selected.by ?? "—"} · ${selected.at ?? "—"}` },
                    ]),
              ]}
            />

            {selected.status === "pending" ? (
              <>
                <div className="p-verdict-banner">
                  <Badge tone={selected.autoVerdict === "fail" ? "danger" : "ok"}>
                    自动判定：{selected.autoVerdict === "fail" ? "失败" : "通过"}
                  </Badge>
                  <span>请确认这条自动判定是否成立。选择「判定有误」会记为评估器偏差样本。</span>
                </div>
                <label className="p-field">
                  <span className="p-field-label">复核说明（可选）</span>
                  <Textarea
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="例如：确认为真实业务失败；或说明自动评分标准过严"
                  />
                </label>
              </>
            ) : (
              <div className="p-note">
                {selected.status === "confirmed" ? "自动判定已被人工作业确认。" : "自动判定被人工作业推翻，已记为偏差样本。"}
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
