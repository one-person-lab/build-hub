"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Database, Plus, Search } from "lucide-react";
import { Badge, Button, DataTable, Dialog, Field, Select, Stats, TextInput, type Column } from "@/components/proto/ui";
import { useProto } from "@/lib/proto/store";
import type { EvalDataset } from "@/lib/proto/eval-data";
import { EvalCrumb, EvalMockNote } from "@/components/proto/eval-ui";

const TAGS = ["全部", "必跑", "安全", "意图", "参数", "业务规则", "LLM 评分"];

export default function DatasetsPage() {
  const { state, createDataset } = useProto();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("全部");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [tags, setTags] = useState("意图,安全");
  const [error, setError] = useState("");

  const datasets = state.eval.datasets;
  const rows = useMemo(
    () =>
      datasets.filter(
        (d) =>
          (tag === "全部" || d.tags.includes(tag)) &&
          (!q || d.name.toLowerCase().includes(q.toLowerCase()) || d.id.toLowerCase().includes(q.toLowerCase())),
      ),
    [datasets, q, tag],
  );

  const totalCases = datasets.reduce((s, d) => s + d.cases.length, 0);
  const safetyCases = datasets.reduce((s, d) => s + d.cases.filter((c) => c.safety).length, 0);
  const drafts = datasets.filter((d) => d.draft).length;

  const submit = () => {
    if (!name.trim()) {
      setError("请填写数据集名称");
      return;
    }
    const ds = createDataset({
      name: name.trim(),
      desc: desc.trim() || "未填写说明",
      tags: tags
        .split(/[,，]/)
        .map((t) => t.trim())
        .filter(Boolean),
    });
    setOpen(false);
    setName("");
    setDesc("");
    setError("");
    router.push(`/proto/admin/eval/datasets/${ds.id}`);
  };

  const columns: Column<EvalDataset>[] = [
    {
      key: "name",
      title: "数据集",
      render: (d) => (
        <div>
          <b>{d.name}</b>
          <span className="p-cell-sub p-mono">{d.id}</span>
        </div>
      ),
    },
    { key: "version", title: "版本", width: "80px", render: (d) => <b className="p-mono">{d.version}</b> },
    {
      key: "cases",
      title: "用例",
      width: "120px",
      render: (d) => (
        <div>
          <b>{d.cases.length}</b>
          <span className="p-cell-sub">安全 {d.cases.filter((c) => c.safety).length} 条</span>
        </div>
      ),
    },
    {
      key: "tags",
      title: "标签",
      render: (d) => (
        <div className="p-tag-row">
          {d.tags.map((t) => (
            <span key={t} className={`p-tag${t === "安全" ? " is-safety" : ""}`}>
              {t}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: "state",
      title: "状态",
      width: "110px",
      render: (d) => (d.draft ? <Badge tone="warn">有未保存变更</Badge> : <Badge tone="ok">版本已保存</Badge>),
    },
    { key: "at", title: "最近更新", render: (d) => <span className="p-mono p-small">{d.updatedAt}</span> },
    {
      key: "ops",
      title: "",
      width: "80px",
      render: (d) => (
        <Link href={`/proto/admin/eval/datasets/${d.id}`} className="p-link p-small">
          查看
        </Link>
      ),
    },
  ];

  return (
    <div>
      <EvalCrumb label="评测数据集" />

      <div className="p-page-head">
        <div>
          <h1>评测数据集</h1>
          <p>标准用例、历史失败与安全边界用例；版本化后不可变，新用例先进草稿</p>
        </div>
        <div className="p-page-actions">
          <Button variant="primary" icon={<Plus size={13} />} onClick={() => setOpen(true)}>
            新建数据集
          </Button>
        </div>
      </div>

      <Stats
        items={[
          { label: "数据集", value: datasets.length },
          { label: "用例总数", value: totalCases },
          { label: "安全用例", value: safetyCases, tone: "danger", hint: "硬性门禁依据" },
          { label: "未保存变更", value: drafts, tone: drafts ? "warn" : "ok", hint: "保存版本后才用于新实验" },
        ]}
      />

      <div className="p-toolbar">
        <div className="p-toolbar-search">
          <Search size={13} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索数据集名称或编号" />
        </div>
        <Select value={tag} onChange={(e) => setTag(e.target.value)} style={{ width: 140 }}>
          {TAGS.map((t) => (
            <option key={t} value={t}>
              {t === "全部" ? "全部标签" : t}
            </option>
          ))}
        </Select>
        <span className="p-toolbar-count">{rows.length} 个数据集</span>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(d) => d.id}
        onRowClick={(d) => router.push(`/proto/admin/eval/datasets/${d.id}`)}
        empty="没有符合条件的数据集"
        emptyHint="新建数据集后可以添加用例"
      />

      <Dialog
        open={open}
        title="新建评测数据集"
        confirmText="创建并添加用例"
        onClose={() => setOpen(false)}
        onConfirm={submit}
      >
        <div className="p-form">
          <Field label="名称" required error={error}>
            <TextInput value={name} onChange={(e) => { setName(e.target.value); setError(""); }} placeholder="例如：夜间作业指令回归" />
          </Field>
          <Field label="说明" hint="写清覆盖范围与使用场景">
            <TextInput value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="这组用例用来守住什么能力" />
          </Field>
          <Field label="标签" hint="用逗号分隔，可在列表筛选">
            <TextInput value={tags} onChange={(e) => setTags(e.target.value)} />
          </Field>
          <div className="p-note">
            <Database size={12} /> 新数据集从 v1 开始，添加用例后需要「保存版本」才会被新实验引用。
          </div>
        </div>
      </Dialog>

      <EvalMockNote>数据集用例为演示内容，未接入真实业务平台。</EvalMockNote>
    </div>
  );
}
