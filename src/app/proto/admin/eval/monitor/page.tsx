"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Radio, Search } from "lucide-react";
import { Badge, Button, DataTable, Drawer, KeyValue, Select, Stats, Textarea, type Column } from "@/components/proto/ui";
import { useProto } from "@/lib/proto/store";
import { MONITOR_STATS, type MonitorSample } from "@/lib/proto/eval-data";
import { EvalCrumb, EvalMockNote, ScoreBar } from "@/components/proto/eval-ui";

const FEEDBACK_LABEL = { none: "未反馈", up: "正向", down: "负向" } as const;
const FEEDBACK_TONE = { none: "muted", up: "ok", down: "danger" } as const;

export default function MonitorPage() {
  const { state, reviewSample, addSampleToDataset } = useProto();
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [dsId, setDsId] = useState("");

  const samples = state.eval.samples;
  const datasets = state.eval.datasets;
  const pending = samples.filter((m) => m.needReview).length;
  const reviewed = samples.filter((m) => m.reviewed).length;

  const rows = useMemo(
    () =>
      samples.filter((m) => {
        if (filter === "pending" && !m.needReview) return false;
        if (filter === "reviewed" && !m.reviewed) return false;
        if (filter === "negative" && m.feedback !== "down") return false;
        if (!q) return true;
        return `${m.title} ${m.sessionId} ${m.intent} ${m.issue ?? ""}`.toLowerCase().includes(q.toLowerCase());
      }),
    [samples, filter, q],
  );

  const active = samples.find((m) => m.id === activeId);

  const open = (m: MonitorSample) => {
    setActiveId(m.id);
    setNote("");
    setDsId(datasets[0]?.id ?? "");
  };

  const columns: Column<MonitorSample>[] = [
    {
      key: "title",
      title: "线上样本",
      render: (m) => (
        <div>
          <b>{m.title}</b>
          <span className="p-cell-sub p-mono">
            {m.id} · {m.sessionId} · {m.intent}
          </span>
        </div>
      ),
    },
    { key: "at", title: "时间", width: "150px", render: (m) => <span className="p-mono p-small">{m.at}</span> },
    { key: "score", title: "模拟评分", width: "150px", render: (m) => <ScoreBar value={m.score} suffix="" /> },
    {
      key: "feedback",
      title: "用户反馈",
      width: "100px",
      render: (m) => <Badge tone={FEEDBACK_TONE[m.feedback]}>{FEEDBACK_LABEL[m.feedback]}</Badge>,
    },
    {
      key: "issue",
      title: "问题线索",
      render: (m) =>
        m.issue ? (
          <span className="p-small">{m.issue}</span>
        ) : (
          <span className="p-muted p-small">未命中复核规则</span>
        ),
    },
    {
      key: "review",
      title: "复核",
      width: "130px",
      render: (m) =>
        m.datasetId ? (
          <Badge tone="info">已入数据集</Badge>
        ) : m.reviewed ? (
          <Badge tone="ok">已复核</Badge>
        ) : m.needReview ? (
          <Badge tone="warn">待复核</Badge>
        ) : (
          <span className="p-muted p-small">—</span>
        ),
    },
    {
      key: "ops",
      title: "",
      width: "80px",
      render: (m) => (
        <button
          className="p-btn p-btn-text"
          onClick={(e) => {
            e.stopPropagation();
            open(m);
          }}
        >
          查看
        </button>
      ),
    },
  ];

  return (
    <div>
      <EvalCrumb label="线上质量监控" />

      <div className="p-page-head">
        <div>
          <h1>线上质量监控</h1>
          <p>对线上会话抽样评分，收集负反馈，把可疑样本转成可复现的数据集用例</p>
        </div>
        <div className="p-page-actions">
          <Link href="/proto/admin/traces" className="p-btn p-btn-secondary p-btn-md">
            查看运行追踪
          </Link>
          <Link href="/proto/admin/eval/datasets" className="p-btn p-btn-primary p-btn-md">
            去评测数据集
          </Link>
        </div>
      </div>

      <Stats
        items={[
          { label: "本周会话", value: MONITOR_STATS.sessions, hint: "统计范围：全部作业端会话" },
          { label: "抽样评分", value: MONITOR_STATS.sampled, hint: `覆盖率 ${Math.round((MONITOR_STATS.sampled / MONITOR_STATS.sessions) * 100)}%` },
          { label: "平均评分", value: MONITOR_STATS.avgScore, tone: "ok", hint: "模拟 LLM 评分，仅看趋势" },
          { label: "负反馈率", value: `${MONITOR_STATS.negRate}%`, tone: MONITOR_STATS.negRate > 5 ? "danger" : "warn", hint: "负反馈会话 / 有反馈会话" },
        ]}
      />

      <div className="p-admin-split">
        <div className="p-stack">
          <div className="p-card">
            <div className="p-card-head">
              <div>
                <h3>线上样本</h3>
                <p>低分、负反馈或命中安全关键词的样本会进入复核队列</p>
              </div>
              <Badge tone={pending ? "warn" : "ok"}>{pending} 条待复核</Badge>
            </div>
            <div className="p-toolbar" style={{ borderTop: 0 }}>
              <div className="p-toolbar-search">
                <Search size={13} />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索输入、会话或问题线索" />
              </div>
              <Select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ width: 140 }}>
                <option value="all">全部样本</option>
                <option value="pending">仅待复核</option>
                <option value="negative">仅负反馈</option>
                <option value="reviewed">已复核</option>
              </Select>
              <span className="p-toolbar-count">{rows.length} 条</span>
            </div>
            <DataTable
              columns={columns}
              rows={rows}
              rowKey={(m) => m.id}
              onRowClick={open}
              empty="没有符合条件的线上样本"
            />
          </div>

          <div className="p-card p-card-pad">
            <div className="p-row-between" style={{ marginBottom: 8 }}>
              <h3 className="p-side-h">样本回流闭环</h3>
              <span className="p-muted p-small">线上问题 → 数据集 → 回归 → 门禁</span>
            </div>
            <div className="p-eval-loop">
              <Link href="/proto/admin/eval/monitor" className="p-loop-step">
                <em>01</em>
                <b>线上样本</b>
                <span>评分、反馈与 Trace</span>
              </Link>
              <Link href="/proto/admin/eval/labeling" className="p-loop-step">
                <em>02</em>
                <b>人工复核</b>
                <span>确认问题或标记误报</span>
              </Link>
              <Link href="/proto/admin/eval/datasets" className="p-loop-step">
                <em>03</em>
                <b>写入数据集</b>
                <span>补期望结果并保存版本</span>
              </Link>
              <Link href="/proto/admin/eval/experiments" className="p-loop-step">
                <em>04</em>
                <b>回归实验</b>
                <span>同数据集重跑对比</span>
              </Link>
              <Link href="/proto/admin/eval/gate" className="p-loop-step">
                <em>05</em>
                <b>发布门禁</b>
                <span>质量与安全都达标</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="p-stack">
          <div className="p-card p-card-pad">
            <h3 className="p-side-h">线上指标口径</h3>
            <KeyValue
              cols={1}
              items={[
                { k: "抽样覆盖率", v: `${MONITOR_STATS.sampled}/${MONITOR_STATS.sessions} 会话 · 按会话随机抽样` },
                { k: "平均评分", v: "36 条抽样回答的模拟评分均值，满分 100" },
                { k: "负反馈率", v: "点踩会话 / 有明确反馈的会话（105 条）" },
                { k: "待复核样本", v: `命中「低分 / 负反馈 / 安全关键词」的样本，共 ${pending} 条` },
                { k: "统计范围", v: "本周作业端线上会话，不含管理端操作" },
              ]}
            />
            <p className="p-muted p-small" style={{ margin: "8px 0 0" }}>
              线上指标只反映趋势，不能替代有标准答案的评测集。
            </p>
          </div>

          <div className="p-card p-card-pad">
            <h3 className="p-side-h">监控提示</h3>
            <ul className="p-issue-list">
              <li className="is-warn">南湖公园周界巡查未提示临时作业窗口，已转失败分析</li>
              <li className="is-warn">设备电池温度问答缺少依据，建议加入知识库用例</li>
              <li className="is-ok-static">任务查询类回答评分稳定，无需抽样复核</li>
            </ul>
            <Link href="/proto/admin/eval/failures" className="p-btn p-btn-secondary p-btn-sm" style={{ width: "100%", justifyContent: "center" }}>
              去失败分析
            </Link>
          </div>

          <div className="p-note">
            <Radio size={12} /> 线上样本与评分为模拟数据；复核结论只保存在本次演示会话中。
          </div>
        </div>
      </div>

      <EvalMockNote>线上评分、反馈与样本内容均为模拟数据，未采集真实用户会话。</EvalMockNote>

      <Drawer
        open={!!active}
        title={active?.title ?? ""}
        sub={active ? `${active.id} · ${active.sessionId} · ${active.at}` : undefined}
        onClose={() => setActiveId(null)}
        width={600}
        footer={
          <div className="p-inline-actions" style={{ margin: 0 }}>
            {active?.traceId && (
              <Link href={`/proto/admin/traces/${active.traceId}`} className="p-btn p-btn-secondary p-btn-sm">
                查看 Trace
              </Link>
            )}
            <Button onClick={() => setActiveId(null)}>关闭</Button>
          </div>
        }
      >
        {active && (
          <div className="p-stack">
            <KeyValue
              cols={1}
              items={[
                { k: "意图", v: <span className="p-mono">{active.intent}</span> },
                { k: "模拟评分", v: `${active.score} 分` },
                { k: "用户反馈", v: FEEDBACK_LABEL[active.feedback] },
                { k: "问题线索", v: active.issue ?? "未命中复核规则" },
                { k: "关联 Trace", v: active.traceId ? <Link href={`/proto/admin/traces/${active.traceId}`} className="p-link p-mono">{active.traceId}</Link> : "—" },
                ...(active.datasetId
                  ? [{ k: "已写入数据集", v: <Link href={`/proto/admin/eval/datasets/${active.datasetId}`} className="p-link">{active.datasetId}</Link> }]
                  : []),
              ]}
            />

            {active.needReview && (
              <>
                <label className="p-field">
                  <span className="p-field-label">复核说明</span>
                  <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="说明问题是否成立，或为什么是误报" />
                </label>
                <div className="p-inline-actions" style={{ margin: 0 }}>
                  <Button
                    variant="danger"
                    onClick={() => {
                      reviewSample(active.id, "issue", note);
                    }}
                  >
                    确认问题
                  </Button>
                  <Button
                    onClick={() => {
                      reviewSample(active.id, "false_positive", note);
                    }}
                  >
                    标记为误报
                  </Button>
                </div>
              </>
            )}

            <div className="p-card p-card-pad" style={{ background: "var(--p-soft, #f8fafc)" }}>
              <h3 className="p-side-h">加入数据集</h3>
              {active.datasetId ? (
                <p className="p-muted p-small" style={{ margin: 0 }}>
                  这条样本已经写入 {active.datasetId}，保存数据集版本后可参与回归实验。
                </p>
              ) : (
                <>
                  <div className="p-row-between" style={{ gap: 8 }}>
                    <Select value={dsId} onChange={(e) => setDsId(e.target.value)} style={{ flex: 1 }}>
                      {datasets.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} · {d.version}
                        </option>
                      ))}
                    </Select>
                    <Button
                      variant="primary"
                      disabled={!dsId}
                      onClick={() => {
                        if (!dsId) return;
                        addSampleToDataset(active.id, dsId);
                      }}
                    >
                      写入为用例
                    </Button>
                  </div>
                  <p className="p-muted p-small" style={{ margin: "8px 0 0" }}>
                    写入后数据集进入草稿状态，需要补全期望结果并保存版本。
                  </p>
                </>
              )}
            </div>

            <div className="p-note">复核结论会影响样本状态，但不会修改线上会话；所有数据均为模拟演示。</div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
