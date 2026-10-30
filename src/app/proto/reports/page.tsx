"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowUpDown, Download, FileText, Search } from "lucide-react";
import { Badge, BarChart, Button, DataTable, Stats, type Column } from "@/components/proto/ui";
import { useProto } from "@/lib/proto/store";
import { METRIC_SERIES, areaById, type Report } from "@/lib/proto/data";

export default function ReportsPage() {
  const { state, toast } = useProto();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [sortDesc, setSortDesc] = useState(true);

  const rows = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return state.reports
      .filter((r) => !kw || r.name.includes(kw) || r.id.toLowerCase().includes(kw) || r.taskId.toLowerCase().includes(kw))
      .sort((a, b) => (sortDesc ? b.at.localeCompare(a.at) : a.at.localeCompare(b.at)));
  }, [state.reports, q, sortDesc]);

  const columns: Column<Report>[] = [
    {
      key: "name",
      title: "报告",
      render: (r) => (
        <div>
          <b>{r.name}</b>
          <span className="p-cell-sub">{r.id} · {r.taskId}</span>
        </div>
      ),
    },
    { key: "area", title: "作业区域", render: (r) => areaById(state.tasks.find((t) => t.id === r.taskId)?.areaId ?? "")?.name ?? "—" },
    { key: "at", title: "生成时间", render: (r) => <span className="p-mono">{r.at}</span> },
    {
      key: "status",
      title: "状态",
      width: "110px",
      render: (r) =>
        r.status === "ready" ? (
          <Badge tone="ok">已生成</Badge>
        ) : (
          <Badge tone="active">生成中</Badge>
        ),
    },
    {
      key: "ops",
      title: "操作",
      width: "150px",
      render: (r) => (
        <div className="p-row-ops" onClick={(e) => e.stopPropagation()}>
          <button className="p-btn p-btn-text" onClick={() => router.push(`/proto/reports/${r.id}`)}>
            查看
          </button>
          <button
            className="p-btn p-btn-text"
            onClick={() => toast("已导出 PDF（模拟）", "ok")}
          >
            导出
          </button>
        </div>
      ),
    },
  ];


  return (
    <div className="p-page-stack">
      <div className="p-page-head">
        <div>
          <h1>作业报告</h1>
          <p>任务完成后自动生成结构化报告，可查看、导出与归档</p>
        </div>
        <div className="p-page-actions">
          <Button icon={<Download size={13} />} onClick={() => toast("已导出报告清单（模拟 CSV）", "ok")}>
            导出清单
          </Button>
        </div>
      </div>

      <Stats
        items={[
          { label: "报告总数", value: state.reports.length, hint: "全部来自模拟任务" },
          { label: "本周生成", value: METRIC_SERIES.reduce((s, d) => s + d.done, 0), tone: "brand" },
          { label: "含异常报告", value: 4, tone: "warn", hint: "需人工复核" },
          { label: "平均生成耗时", value: "38 s", hint: "任务结束到报告可读" },
        ]}
      />

      <div className="p-card">
        <div className="p-card-head">
          <div>
            <h3>生成与异常趋势</h3>
            <p>近 7 天按日汇总</p>
          </div>
          <span className="p-muted p-small">单位：份 / 件</span>
        </div>
        <div className="p-chart-pad">
          <BarChart
            data={METRIC_SERIES}
            series={[
              { key: "done", label: "生成报告", color: "#2563EB" },
              { key: "events", label: "包含异常", color: "#F59E0B" },
            ]}
            height={176}
          />
        </div>
      </div>

      <div>
        <div className="p-toolbar">
          <div className="p-toolbar-search">
            <Search size={13} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索报告名称、编号或任务号" />
          </div>
          <Button size="sm" icon={<ArrowUpDown size={12} />} onClick={() => setSortDesc((v) => !v)}>
            {sortDesc ? "最新在前" : "最早在前"}
          </Button>
          <span className="p-toolbar-count">{rows.length} 份</span>
        </div>

        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(r) => r.id}
          onRowClick={(r) => router.push(`/proto/reports/${r.id}`)}
          empty="没有符合条件的报告"
          emptyHint="执行一个巡检任务后，报告会自动生成"
        />

        <p className="p-muted p-footnote" style={{ marginTop: 14 }}>
          <FileText size={12} /> 报告中的覆盖面积、异常数量等均为演示数据，用于展示报告结构。
        </p>
      </div>
    </div>
  );
}
