"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Plus, Route as RouteIcon, Search } from "lucide-react";
import { Badge, Button, DataTable, Dialog, Field, Select, TextInput, ToggleGroup, type Column } from "@/components/proto/ui";
import { useProto } from "@/lib/proto/store";
import { ROUTE_STATUS_LABEL, type RoutePlan, type RouteStatus } from "@/lib/proto/data";

const localStamp = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

export default function RoutesPage() {
  const { state, addRoute, toast } = useProto();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("滨江东路夜巡航线");
  const [areaId, setAreaId] = useState("A-01");
  const [alt, setAlt] = useState(55);
  const [nameError, setNameError] = useState("");

  const rows = useMemo(() => {
    const kw = q.trim();
    return state.routes.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (kw && !r.name.includes(kw) && !r.id.toLowerCase().includes(kw.toLowerCase())) return false;
      return true;
    });
  }, [state.routes, q, status]);

  const create = () => {
    if (!name.trim()) {
      setNameError("请填写航线名称");
      return;
    }
    const area = state.areas.find((a) => a.id === areaId)!;
    const cx = area.polygon.reduce((s, p) => s + p.x, 0) / area.polygon.length;
    const cy = area.polygon.reduce((s, p) => s + p.y, 0) / area.polygon.length;
    const waypoints = area.polygon.map((p) => ({
      x: Math.round(cx + (p.x - cx) * 0.86),
      y: Math.round(cy + (p.y - cy) * 0.86),
      alt,
      speed: 6,
    }));
    const route: RoutePlan = {
      id: `R-${String(state.routes.length + 1).padStart(3, "0")}`,
      name: name.trim(),
      areaId,
      version: "v1",
      status: "draft",
      updatedAt: localStamp(),
      versions: [{ v: "v1", note: "初始草稿 · 由区域边界生成", at: localStamp() }],
      waypoints,
    };
    addRoute(route);
    setCreating(false);
    toast("航线草稿已创建，可继续编辑航点", "ok");
    router.push(`/proto/routes/${route.id}`);
  };

  const columns: Column<RoutePlan>[] = [
    {
      key: "name",
      title: "航线",
      render: (r) => (
        <div>
          <b>{r.name}</b>
          <span className="p-cell-sub">{r.id} · {state.areas.find((a) => a.id === r.areaId)?.name}</span>
        </div>
      ),
    },
    { key: "wp", title: "航点", width: "80px", render: (r) => `${r.waypoints.length} 个` },
    { key: "version", title: "版本", width: "80px", render: (r) => <span className="p-mono">{r.version}</span> },
    {
      key: "status",
      title: "状态",
      width: "110px",
      render: (r) => (
        <Badge tone={r.status === "published" ? "ok" : r.status === "draft" ? "warn" : "danger"}>
          {ROUTE_STATUS_LABEL[r.status as RouteStatus]}
        </Badge>
      ),
    },
    { key: "updated", title: "更新时间", render: (r) => <span className="p-mono">{r.updatedAt}</span> },
    {
      key: "ops",
      title: "操作",
      width: "120px",
      render: (r) => (
        <div className="p-row-ops" onClick={(e) => e.stopPropagation()}>
          <Link href={`/proto/routes/${r.id}`} className="p-btn p-btn-text">编辑</Link>
          <Link href={`/proto/routes/${r.id}`} className="p-btn p-btn-text">版本</Link>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="p-page-head">
        <div>
          <h1>航线管理</h1>
          <p>航线草稿、参数校验与版本管理，发布后可被任务计划引用</p>
        </div>
        <div className="p-page-actions">
          <Button variant="primary" icon={<Plus size={13} />} onClick={() => setCreating(true)}>
            新建航线
          </Button>
        </div>
      </div>

      <div className="p-toolbar">
        <div className="p-toolbar-search">
          <Search size={13} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索航线名称或编号" />
        </div>
        <ToggleGroup
          value={status}
          onChange={setStatus}
          items={[
            { key: "all", label: "全部" },
            { key: "published", label: "已发布" },
            { key: "draft", label: "草稿" },
            { key: "invalid", label: "校验不通过" },
          ]}
        />
        <span className="p-toolbar-count">{rows.length} 条</span>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        onRowClick={(r) => router.push(`/proto/routes/${r.id}`)}
        empty="没有符合条件的航线"
        emptyHint="新建一条航线，或清除筛选条件"
      />

      <Dialog open={creating} title="新建航线" confirmText="创建草稿" onClose={() => setCreating(false)} onConfirm={create}>
        <div className="p-form">
          <Field label="航线名称" required error={nameError}>
            <TextInput
              value={name}
              invalid={!!nameError}
              onChange={(e) => {
                setName(e.target.value);
                setNameError("");
              }}
            />
          </Field>
          <Field label="作业区域" required>
            <Select value={areaId} onChange={(e) => setAreaId(e.target.value)}>
              {state.areas.map((a) => (
                <option key={a.id} value={a.id}>{a.name} · {a.mu} 亩</option>
              ))}
            </Select>
          </Field>
          <Field label="相对起飞点高度 (m)" required hint="范围 20–120，后续可逐点调整">
            <TextInput type="number" value={alt} onChange={(e) => setAlt(Number(e.target.value))} />
          </Field>
          <div className="p-note">
            <RouteIcon size={12} /> 系统会沿区域边界内缩生成初始航点；创建后可在地图上增删航点并调整高度、速度。
          </div>
        </div>
      </Dialog>
    </div>
  );
}
