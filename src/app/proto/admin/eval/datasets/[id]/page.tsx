"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { FlaskConical, Link2, Plus, Save, Search, ShieldCheck } from "lucide-react";
import { Badge, Button, DataTable, Dialog, Field, Select, Stats, Switch, TextInput, Textarea, type Column } from "@/components/proto/ui";
import { useProto } from "@/lib/proto/store";
import type { EvalCase } from "@/lib/proto/eval-data";
import { EvalCrumb, EvalMockNote, emitEvalPreset } from "@/components/proto/eval-ui";

type SourceFilter = "all" | "safety" | "manual" | "trace" | "online";

export default function DatasetDetailPage() {
  const params = useParams<{ id: string }>();
  const datasetId = decodeURIComponent(params.id);
  const router = useRouter();
  const { state, addCase, saveDatasetVersion, toast } = useProto();
  const ds = state.eval.datasets.find((d) => d.id === datasetId);

  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<SourceFilter>("all");
  const [open, setOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [note, setNote] = useState("");

  const [name, setName] = useState("");
  const [input, setInput] = useState("");
  const [intent, setIntent] = useState("patrol_task");
  const [tools, setTools] = useState("route.generate, route.validate, task.create");
  const [expected, setExpected] = useState("");
  const [tags, setTags] = useState("意图,参数");
  const [safety, setSafety] = useState(false);
  const [source, setSource] = useState<EvalCase["source"]>("内置");
  const [traceId, setTraceId] = useState("");
  const [error, setError] = useState("");
  const prefilled = useRef(false);

  useEffect(() => {
    if (prefilled.current) return;
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("add") !== "trace") return;
    const id = sp.get("trace");
    if (!id) return;
    prefilled.current = true;
    const tr = state.traces.find((t) => t.id === id);
    const first = tr?.steps[0];
    setSource("Trace 导入");
    setTraceId(id);
    setName(`失败复现 · ${id}`);
    if (first) setInput(first.input.replace(/[「」]/g, ""));
    if (tr?.skillId) setIntent(`skill:${tr.skillId}`);
    const toolIds = [
      ...new Set(
        (tr?.steps ?? [])
          .filter((s) => s.kind === "tool")
          .map((s) => s.input.match(/^([a-z_]+\.[a-z_]+)/)?.[1])
          .filter((x): x is string => !!x),
      ),
    ];
    if (toolIds.length) setTools(toolIds.join(", "));
    setOpen(true);
    toast("已从 Trace 带入第一条消息，补充期望行为后加入草稿", "info");
  }, [state.traces, toast]);

  const rows = useMemo(
    () =>
      (ds?.cases ?? []).filter((c) => {
        if (filter === "safety" && !c.safety) return false;
        if (filter === "manual" && c.source !== "内置") return false;
        if (filter === "trace" && c.source !== "Trace 导入") return false;
        if (filter === "online" && c.source !== "线上样本") return false;
        return !q || c.name.toLowerCase().includes(q.toLowerCase()) || c.input.toLowerCase().includes(q.toLowerCase());
      }),
    [ds, filter, q],
  );

  if (!ds) {
    return (
      <div className="p-card p-card-pad">
        <b>数据集不存在</b>
        <p className="p-muted">可能已被重置，返回列表重新选择。</p>
        <Link href="/proto/admin/eval/datasets" className="p-btn p-btn-primary p-btn-md">
          返回数据集列表
        </Link>
      </div>
    );
  }

  const reset = () => {
    setName("");
    setInput("");
    setExpected("");
    setTraceId("");
    setSafety(false);
    setSource("内置");
    setError("");
  };

  const submit = () => {
    if (!name.trim() || !input.trim() || !expected.trim()) {
      setError("名称、输入与期望行为都必须填写");
      return;
    }
    addCase(ds.id, {
      name: name.trim(),
      input: input.trim(),
      expectedIntent: intent,
      expectedTools: tools
        .split(/[,，]/)
        .map((t) => t.trim())
        .filter(Boolean),
      expectedResult: expected.trim(),
      tags: tags
        .split(/[,，]/)
        .map((t) => t.trim())
        .filter(Boolean),
      safety,
      source,
      traceId: traceId || undefined,
    });
    setOpen(false);
    reset();
  };

  const createExperiment = () => {
    if (ds.draft) {
      toast("请先保存数据集版本，再基于它创建实验", "warn");
      return;
    }
    emitEvalPreset({ datasetId: ds.id });
    router.push("/proto/admin/eval/experiments");
  };

  const columns: Column<EvalCase>[] = [
    {
      key: "name",
      title: "用例",
      render: (c) => (
        <div>
          <b>{c.name}</b>
          <span className="p-cell-sub p-mono">{c.id}</span>
        </div>
      ),
    },
    { key: "input", title: "输入", render: (c) => <span className="p-small">「{c.input}」</span> },
    {
      key: "expect",
      title: "期望行为",
      render: (c) => (
        <div>
          <b className="p-mono p-small">{c.expectedIntent}</b>
          <span className="p-cell-sub">{c.expectedTools.length ? c.expectedTools.join(" → ") : "不调用工具"}</span>
          <span className="p-cell-sub">{c.expectedResult}</span>
        </div>
      ),
    },
    {
      key: "tags",
      title: "标签",
      render: (c) => (
        <div className="p-tag-row">
          {c.safety && <span className="p-tag is-safety">安全</span>}
          {c.tags.map((t) => (
            <span key={t} className="p-tag">{t}</span>
          ))}
        </div>
      ),
    },
    { key: "source", title: "来源", width: "110px", render: (c) => <span className="p-small">{c.source}</span> },
    {
      key: "trace",
      title: "Trace",
      width: "110px",
      render: (c) =>
        c.traceId ? (
          <Link href={`/proto/admin/traces/${c.traceId}`} className="p-link p-mono p-small">
            {c.traceId.slice(-6)}
          </Link>
        ) : (
          <span className="p-muted">—</span>
        ),
    },
  ];

  return (
    <div>
      <EvalCrumb label={`数据集 / ${ds.id}`} />

      <div className="p-page-head">
        <div>
          <h1>{ds.name}</h1>
          <p>{ds.desc}</p>
        </div>
        <div className="p-page-actions">
          <Badge tone="info">{ds.version}</Badge>
          {ds.draft && <Badge tone="warn">有未保存变更</Badge>}
          <Button icon={<Plus size={13} />} onClick={() => setOpen(true)}>
            添加用例
          </Button>
          <Button icon={<Save size={13} />} onClick={() => setSaveOpen(true)} disabled={!ds.draft}>
            保存版本
          </Button>
          <Button variant="primary" icon={<FlaskConical size={13} />} onClick={createExperiment}>
            用此数据集创建实验
          </Button>
        </div>
      </div>

      <Stats
        items={[
          { label: "用例", value: ds.cases.length },
          { label: "安全用例", value: ds.cases.filter((c) => c.safety).length, tone: "danger", hint: "硬性门禁" },
          { label: "版本", value: ds.versions.length, hint: `当前 ${ds.version}` },
          {
            label: "未保存变更",
            value: ds.draft ? "是" : "否",
            tone: ds.draft ? "warn" : "ok",
            hint: ds.draft ? "保存版本后才可创建实验" : "可直接创建实验",
          },
        ]}
      />

      <div className="p-admin-split">
        <div className="p-stack">
          <div className="p-toolbar" style={{ margin: 0 }}>
            <div className="p-toolbar-search">
              <Search size={13} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索用例名称或输入" />
            </div>
            <Select value={filter} onChange={(e) => setFilter(e.target.value as SourceFilter)} style={{ width: 150 }}>
              <option value="all">全部用例</option>
              <option value="safety">仅安全用例</option>
              <option value="manual">手工编写</option>
              <option value="trace">Trace 导入</option>
              <option value="online">线上样本</option>
            </Select>
            <span className="p-toolbar-count">{rows.length} 条</span>
          </div>

          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(c) => c.id}
            empty="没有符合条件的用例"
            emptyHint="添加用例后保存版本"
          />
        </div>

        <aside className="p-stack">
          <div className="p-card">
            <div className="p-card-head">
              <h3>版本记录</h3>
              <span className="p-muted">{ds.versions.length} 个</span>
            </div>
            <div className="p-lines">
              {ds.versions.map((v) => (
                <div key={v.v} className="p-line">
                  <div>
                    <b className="p-mono">{v.v} · {v.cases} 条</b>
                    <span>{v.note}</span>
                    <span>{v.author} · {v.at}</span>
                  </div>
                  {v.v === ds.version && <Badge tone="ok">当前</Badge>}
                </div>
              ))}
            </div>
          </div>

          <div className="p-card p-card-pad">
            <h3 className="p-side-h">编写约定</h3>
            <ul className="p-issue-list">
              <li className="is-ok-static"><ShieldCheck size={13} /> 安全用例必须写明「应被拦截」的判定条件</li>
              <li className="is-ok-static"><Link2 size={13} /> 历史失败用例关联原 Trace，便于回溯</li>
              <li className="is-ok-static"><FlaskConical size={13} /> 期望行为写成可判定的事实，不写「回答得好」</li>
            </ul>
          </div>

          <div className="p-note">数据集版本不可变：新增用例进入草稿，保存版本后生成新版本号。</div>
        </aside>
      </div>

      <Dialog
        open={open}
        title="添加测试用例"
        confirmText="加入草稿"
        onClose={() => { setOpen(false); reset(); }}
        onConfirm={submit}
      >
        <div className="p-form">
          <Field label="名称" required error={error}>
            <TextInput value={name} onChange={(e) => { setName(e.target.value); setError(""); }} placeholder="例如：夜间返航高度缺失" />
          </Field>
          <Field label="输入" required hint="用户原话，保留口语与省略">
            <Textarea rows={2} value={input} onChange={(e) => setInput(e.target.value)} placeholder="把高度改到 60 就行" />
          </Field>
          <div className="p-grid-2">
            <Field label="期望意图">
              <Select value={intent} onChange={(e) => setIntent(e.target.value)}>
                <option value="patrol_task">patrol_task · 生成巡检任务</option>
                <option value="patrol_plan">patrol_plan · 查询计划</option>
                <option value="clarify">clarify · 追问</option>
                <option value="clarify_param">clarify_param · 追问参数</option>
                <option value="cancel_task">cancel_task · 取消任务</option>
                <option value="query_event">query_event · 查询事件</option>
                <option value="report_generate">report_generate · 生成报告</option>
                <option value="guard">guard · 安全拦截</option>
                {state.skills.items.map((s) => (
                  <option key={s.id} value={`skill:${s.id}`}>
                    skill:{s.id} · {s.name}
                  </option>
                ))}
                <option value="refuse">refuse · 拒绝执行</option>
                <option value="degrade">degrade · 显式降级</option>
              </Select>
            </Field>
            <Field label="期望工具" hint="按调用顺序，用逗号分隔">
              <TextInput value={tools} onChange={(e) => setTools(e.target.value)} />
            </Field>
          </div>
          <Field label="期望结果" required hint="可判定的事实，写明错误码或边界值">
            <Textarea rows={2} value={expected} onChange={(e) => setExpected(e.target.value)} placeholder="拒绝下发并返回 41001 高度超出范围" />
          </Field>
          <div className="p-grid-2">
            <Field label="标签">
              <TextInput value={tags} onChange={(e) => setTags(e.target.value)} />
            </Field>
            <Field label="来源">
              <Select value={source} onChange={(e) => setSource(e.target.value as EvalCase["source"])}>
                <option value="内置">手工编写</option>
                <option value="Trace 导入">从 Trace 导入</option>
                <option value="线上样本">线上样本</option>
              </Select>
            </Field>
          </div>
          {source === "Trace 导入" && (
            <Field label="关联 Trace" hint="选择后自动带入第一条消息，可继续修改">
              <Select
                value={traceId}
                onChange={(e) => {
                  const id = e.target.value;
                  setTraceId(id);
                  const tr = state.traces.find((t) => t.id === id);
                  const first = tr?.steps[0];
                  if (first) setInput(first.input.replace(/[「」]/g, ""));
                }}
              >
                <option value="">请选择 Trace</option>
                {state.traces.slice(0, 12).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.id} · {t.taskId ?? "无任务"} · {t.status === "error" ? "失败" : t.status === "running" ? "进行中" : "成功"}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <div className="p-switch-row">
            <div>
              <b>安全用例</b>
              <span>标记后纳入发布门禁硬性判定，未通过则阻止发布</span>
            </div>
            <Switch on={safety} onChange={setSafety} />
          </div>
        </div>
      </Dialog>

      <Dialog
        open={saveOpen}
        title={`保存 ${ds.version} → 新版本？`}
        confirmText="保存版本"
        onClose={() => setSaveOpen(false)}
        onConfirm={() => {
          saveDatasetVersion(ds.id, note.trim());
          setSaveOpen(false);
          setNote("");
        }}
      >
        <div className="p-form">
          <Field label="版本说明" hint="写清这次新增或修正了什么">
            <TextInput value={note} onChange={(e) => setNote(e.target.value)} placeholder={`${ds.version} 基础上新增 ${ds.cases.length} 条用例`} />
          </Field>
          <p className="p-muted p-small" style={{ margin: 0 }}>
            保存后版本号自增，旧版本保留在版本记录中，已有实验不受影响。
          </p>
        </div>
      </Dialog>

      <EvalMockNote>用例由演示数据构成；导入的 Trace 同样为模拟运行记录。</EvalMockNote>
    </div>
  );
}
