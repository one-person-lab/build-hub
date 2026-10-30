"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Badge, DataTable, Select, Stats, type Column } from "@/components/proto/ui";
import { useProto } from "@/lib/proto/store";
import { draftSchemaVersion, publishedSchemaVersion, type OutputSchema } from "@/lib/proto/ai-data";

const POLICY_LABEL: Record<OutputSchema["policy"]["onInvalid"], string> = {
  reject: "拒绝并报错",
  repair_once: "自动修复一次",
  regenerate: "重新生成",
};

export default function SchemasPage() {
  const { state } = useProto();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [direction, setDirection] = useState("all");

  const rows = useMemo(
    () =>
      state.ai.schemas.filter(
        (s) =>
          (direction === "all" || s.direction === direction) &&
          (!q || s.name.includes(q) || s.id.toLowerCase().includes(q.toLowerCase())),
      ),
    [state.ai.schemas, direction, q],
  );

  const columns: Column<OutputSchema>[] = [
    {
      key: "name",
      title: "Schema",
      render: (s) => (
        <div>
          <b>{s.name}</b>
          <span className="p-cell-sub p-mono">{s.id}</span>
        </div>
      ),
    },
    {
      key: "direction",
      title: "方向",
      width: "110px",
      render: (s) => (
        <Badge tone={s.direction === "tool-output" ? "info" : "brand"}>
          {s.direction === "tool-output" ? "工具输出" : "Agent 输出"}
        </Badge>
      ),
    },
    {
      key: "version",
      title: "版本",
      width: "150px",
      render: (s) => {
        const draft = draftSchemaVersion(s);
        return (
          <div>
            <b className="p-mono">{publishedSchemaVersion(s)?.version ?? "—"}</b>
            <span className="p-cell-sub">{draft ? `草稿 ${draft.version}` : "无草稿"}</span>
          </div>
        );
      },
    },
    {
      key: "policy",
      title: "失效策略",
      width: "140px",
      render: (s) => <span className="p-small">{POLICY_LABEL[s.policy.onInvalid]}{s.policy.maxRetry ? ` · ≤${s.policy.maxRetry} 次` : ""}</span>,
    },
    {
      key: "tools",
      title: "引用工具 / Prompt",
      width: "170px",
      render: (s) => (
        <span className="p-small p-mono">
          {[...s.impacts.tools, ...s.impacts.prompts].join(" · ") || "—"}
        </span>
      ),
    },
    { key: "cases", title: "评测用例", width: "110px", render: (s) => `${s.impacts.evalCases.length} 条` },
    { key: "fields", title: "字段", width: "80px", render: (s) => `${publishedSchemaVersion(s)?.fields.length ?? 0}` },
    {
      key: "ops",
      title: "",
      width: "80px",
      render: (s) => (
        <Link href={`/proto/admin/tools/schemas/${s.id}`} className="p-link p-small" onClick={(e) => e.stopPropagation()}>
          编辑
        </Link>
      ),
    },
  ];

  return (
    <div>
      <div className="p-page-head">
        <div>
          <h1>结构化输出 Schema</h1>
          <p>定义工具与 Agent 的业务输出结构、字段约束、版本与失效策略；校验通过只代表结构合法</p>
        </div>
        <div className="p-page-actions">
          <Link href="/proto/admin/tools" className="p-btn p-btn-secondary p-btn-md">工具目录</Link>
          <Link href="/proto/admin/eval/experiments" className="p-btn p-btn-secondary p-btn-md">用评测集验证</Link>
        </div>
      </div>

      <div className="p-warn-banner">
        <span>
          <b>Schema 校验通过不代表业务合法。</b>设备是否存在且在线的判断、操作人是否有权、空域与前置条件是否满足，
          都必须由服务端业务校验完成；Schema 只约束结构与取值范围。
        </span>
      </div>

      <Stats
        items={[
          { label: "Schema 总数", value: state.ai.schemas.length },
          {
            label: "有草稿",
            value: state.ai.schemas.filter((s) => draftSchemaVersion(s)).length,
            tone: "warn",
            hint: "草稿发布后才按新版本校验",
          },
          {
            label: "被工具引用",
            value: state.ai.schemas.filter((s) => s.impacts.tools.length).length,
            tone: "info",
          },
          {
            label: "含「结构合法、业务拒绝」样例",
            value: state.ai.schemas.filter((s) => s.mockCases.some((m) => m.schemaPass && !m.businessPass)).length,
            tone: "ok",
          },
        ]}
      />

      <div className="p-toolbar">
        <div className="p-toolbar-search">
          <Search size={13} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索 Schema 名称或 ID" />
        </div>
        <Select value={direction} onChange={(e) => setDirection(e.target.value)} style={{ width: 150 }}>
          <option value="all">全部方向</option>
          <option value="tool-output">工具输出</option>
          <option value="agent-output">Agent 输出</option>
        </Select>
        <span className="p-toolbar-count">{rows.length} 个</span>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(s) => s.id}
        onRowClick={(s) => router.push(`/proto/admin/tools/schemas/${s.id}`)}
        empty="没有符合条件的 Schema"
      />

      <div className="p-note" style={{ marginTop: 12 }}>
        入参 Schema 属于工具目录（参数是否齐全、类型是否正确）；这里管理的是业务输出结构。
        两者都要通过，仍不代替业务平台的状态与权限校验。
      </div>
    </div>
  );
}
