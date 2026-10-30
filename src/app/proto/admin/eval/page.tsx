"use client";

import Link from "next/link";
import { ArrowRight, Play, ShieldCheck } from "lucide-react";
import { Badge, DataTable, Stats, type Column } from "@/components/proto/ui";
import { useProto } from "@/lib/proto/store";
import {
  EVAL_DIMENSIONS,
  EVAL_KPIS,
  EVAL_MAIN_PATH,
  EVAL_PAGES,
  EVAL_PRIORITY_ISSUES,
  EVAL_PRIORITY_LABEL,
  EVAL_TREND_RUNS,
  summarize,
  type EvalExperiment,
} from "@/lib/proto/eval-data";
import { EvalMockNote, RunBadge, ScoreBar } from "@/components/proto/eval-ui";

const PRIORITY_TONE = { high: "danger", mid: "warn", low: "muted" } as const;

const CONFIG_LINKS = [
  { label: "Prompt 管理", href: "/proto/admin/agents/prompts" },
  { label: "上下文策略", href: "/proto/admin/agents/contexts" },
  { label: "结构化输出", href: "/proto/admin/tools/schemas" },
  { label: "模型路由", href: "/proto/admin/models/routing" },
];

function TrendChart() {
  const W = 640;
  const H = 196;
  const PAD = { l: 36, r: 54, t: 14, b: 26 };
  const iw = W - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;
  const yMin = 60;
  const yMax = 100;
  const rows = EVAL_TREND_RUNS;
  const x = (i: number) => PAD.l + (iw * i) / Math.max(1, rows.length - 1);
  const y = (v: number) => PAD.t + ih - ((v - yMin) / (yMax - yMin)) * ih;
  const path = (key: "task" | "cases") =>
    rows.map((r, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(r[key]).toFixed(1)}`).join(" ");
  const series = [
    { key: "task" as const, label: "任务成功率", color: "#2563EB" },
    { key: "cases" as const, label: "用例通过率", color: "#16A34A" },
  ];
  return (
    <div className="p-trend">
      <div className="p-chart-legend">
        {series.map((s) => (
          <span key={s.key}>
            <i style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="近五次评测趋势">
        {[60, 70, 80, 90, 100].map((v) => (
          <g key={v}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} className="p-trend-grid" />
            <text x={PAD.l - 8} y={y(v) + 3} textAnchor="end" className="p-trend-tick">
              {v}%
            </text>
          </g>
        ))}
        {rows.map((r, i) => (
          <text key={r.run} x={x(i)} y={H - 8} textAnchor="middle" className="p-trend-tick">
            {r.run}
          </text>
        ))}
        {series.map((s) => (
          <g key={s.key}>
            <path d={path(s.key)} fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            {rows.map((r, i) => (
              <circle key={i} cx={x(i)} cy={y(r[s.key])} r="3" fill="#fff" stroke={s.color} strokeWidth="2" />
            ))}
            <text
              x={x(rows.length - 1) + 8}
              y={y(rows[rows.length - 1][s.key]) + 3}
              className="p-trend-value"
              fill={s.color}
            >
              {rows[rows.length - 1][s.key]}%
            </text>
          </g>
        ))}
      </svg>
      <p className="p-muted p-small" style={{ margin: "4px 0 0" }}>
        演示用模拟数据，并非真实运行结果。
      </p>
    </div>
  );
}

export default function EvalDashboardPage() {
  const { state } = useProto();
  const datasets = state.eval.datasets;
  const experiments = [...state.eval.experiments].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const recent = experiments.filter((e) => e.status === "done").slice(0, 3);

  const columns: Column<EvalExperiment>[] = [
    {
      key: "name",
      title: "实验",
      render: (e) => (
        <div>
          <b>{e.name}</b>
          <span className="p-cell-sub p-mono">{e.id}</span>
        </div>
      ),
    },
    {
      key: "version",
      title: "被测版本",
      render: (e) => (
        <div>
          <b className="p-mono">{e.agentVersion}</b>
          <span className="p-cell-sub">{e.model}</span>
        </div>
      ),
    },
    {
      key: "rate",
      title: "用例通过率",
      width: "150px",
      render: (e) => <ScoreBar value={summarize(e, datasets.find((d) => d.id === e.datasetId)).passRate} />,
    },
    {
      key: "safety",
      title: "安全用例",
      width: "100px",
      render: (e) => {
        const s = summarize(e, datasets.find((d) => d.id === e.datasetId));
        return <Badge tone={s.safetyRate === 100 ? "ok" : "danger"}>{s.safetyPass}/{s.safetyTotal}</Badge>;
      },
    },
    { key: "status", title: "状态", width: "90px", render: (e) => <RunBadge status={e.status} /> },
    {
      key: "ops",
      title: "",
      width: "70px",
      render: (e) => (
        <Link href={`/proto/admin/eval/experiments/${e.id}`} className="p-link p-small">
          查看
        </Link>
      ),
    },
  ];

  const secondary = EVAL_PAGES.filter((p) => p.tier === "special");

  return (
    <div>
      <div className="p-page-head">
        <div>
          <h1>AI 评测与优化</h1>
          <p>了解效果、发现问题、验证优化、控制发布风险</p>
        </div>
        <div className="p-page-actions">
          <Badge tone="warn">示例数据</Badge>
          <Link href="/proto/admin/eval/run" className="p-btn p-btn-primary p-btn-md">
            <Play size={13} /> 开始评测
          </Link>
          <Link href="/proto/admin/eval/gate" className="p-btn p-btn-secondary p-btn-md">
            <ShieldCheck size={13} /> 发布门禁
          </Link>
        </div>
      </div>

      <Stats items={EVAL_KPIS.map((k) => ({ label: k.label, value: k.value, hint: k.hint, tone: k.tone }))} />

      <div className="p-eval-loop">
        {EVAL_MAIN_PATH.map((s) => (
          <Link key={s.n} href={s.href} className="p-loop-step">
            <em>{s.n}</em>
            <b>{s.title}</b>
            <span>{s.desc}</span>
            <ArrowRight size={12} />
          </Link>
        ))}
      </div>

      <div className="p-config-strip">
        <span>被测配置</span>
        {CONFIG_LINKS.map((c) => (
          <Link key={c.href} href={c.href} className="p-chip-link">
            {c.label}
          </Link>
        ))}
        <em>改完 Prompt / 模型 / 检索，回来跑同一批用例</em>
      </div>

      <div className="p-admin-split">
        <div className="p-stack">
          <div className="p-card p-card-pad">
            <div className="p-row-between" style={{ marginBottom: 8 }}>
              <h3 className="p-side-h">评测趋势</h3>
              <span className="p-muted p-small">最近 5 次评测 · 同一批用例</span>
            </div>
            <TrendChart />
          </div>

          <div className="p-card p-card-pad">
            <div className="p-row-between" style={{ marginBottom: 10 }}>
              <h3 className="p-side-h">优先处理的问题</h3>
              <span className="p-muted p-small">18 个失败中这 3 类占 15 个</span>
            </div>
            <div className="p-issues">
              {EVAL_PRIORITY_ISSUES.map((it) => (
                <Link key={it.id} href={it.href} className={`p-issue is-${it.priority}`}>
                  <div className="p-issue-top">
                    <b>{it.title}</b>
                    <Badge tone={PRIORITY_TONE[it.priority]}>{EVAL_PRIORITY_LABEL[it.priority]}</Badge>
                  </div>
                  <span>
                    {it.count} 个失败用例 · {it.detail}
                  </span>
                  <em>查看问题并分析 →</em>
                </Link>
              ))}
            </div>
          </div>

          <div className="p-card">
            <div className="p-card-head">
              <div>
                <h3>最近评测</h3>
                <p>同一份用例、同一套评估器，才能比较版本</p>
              </div>
              <Link href="/proto/admin/eval/experiments" className="p-link p-small">
                全部实验
              </Link>
            </div>
            <DataTable
              columns={columns}
              rows={recent}
              rowKey={(e) => e.id}
              empty="还没有完成的评测"
              emptyHint="点「开始评测」跑一次当前版本"
            />
          </div>
        </div>

        <div className="p-stack">
          <div className="p-card p-card-pad">
            <div className="p-row-between" style={{ marginBottom: 10 }}>
              <h3 className="p-side-h">按业务能力看指标</h3>
              <span className="p-muted p-small">不用一个笼统的「准确率」</span>
            </div>
            <div className="p-dims">
              {EVAL_DIMENSIONS.map((d) => (
                <div key={d.key} className={`p-dim${d.key === "safety" ? " is-safety" : ""}`}>
                  <div className="p-dim-head">
                    <b>{d.name}</b>
                    <strong>{d.value}</strong>
                  </div>
                  <span>{d.metrics}</span>
                  <em>{d.basis}</em>
                </div>
              ))}
            </div>
          </div>

          <div className="p-card p-card-pad">
            <h3 className="p-side-h">更多专业能力</h3>
            <p className="p-muted p-small" style={{ margin: "4px 0 8px" }}>
              不占主路径，需要时再从具体问题进入。
            </p>
            <div className="p-chip-grid">
              {secondary.map((p) => (
                <Link key={p.href} href={p.href} className="p-chip-link">
                  {p.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="p-note">
            <ShieldCheck size={12} /> 安全用例独立硬性判定，一票否决，平均分不能掩盖安全问题。
          </div>
        </div>
      </div>

      <EvalMockNote>看板 KPI、趋势与问题分布均为统一 Mock 数据源，可随演示重置。</EvalMockNote>
    </div>
  );
}
