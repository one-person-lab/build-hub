"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, CircleAlert, FileUp, Loader2, RefreshCw, Search, ArrowRight } from "lucide-react";
import { Badge, Button, DataTable, Dialog, Drawer, Field, KeyValue, Select, Stats, TextInput, type Column } from "@/components/proto/ui";
import { useProto } from "@/lib/proto/store";
import type { KbDoc } from "@/lib/proto/data";
import { DOC_TYPE_LABEL, KB_PARSE_STAGES, type KnowledgeDocType } from "@/lib/proto/rag-data";

const STATE_LABEL = { indexed: "已索引", indexing: "索引中", failed: "失败" } as const;
const STATE_TONE = { indexed: "ok", indexing: "active", failed: "danger" } as const;

const UPLOAD_TYPES: { value: KnowledgeDocType; label: string }[] = (
  ["manual", "regulation", "sop", "faq", "case"] as KnowledgeDocType[]
).map((t) => ({ value: t, label: DOC_TYPE_LABEL[t] }));

export default function KbPage() {
  const { state, addKbDoc, retryKbDoc, rebuildKbIndex, toast } = useProto();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState("");
  const [docType, setDocType] = useState<KnowledgeDocType>("manual");
  const [err, setErr] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [focusChunk, setFocusChunk] = useState<string | null>(null);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const doc = sp.get("doc");
    if (doc) {
      setDetailId(doc);
      setFocusChunk(sp.get("chunk"));
    }
  }, []);

  const detail = state.kbDocs.find((d) => d.id === detailId) ?? null;
  const rows = useMemo(
    () =>
      state.kbDocs.filter(
        (d) => (filter === "all" || d.state === filter) && (!q || d.name.includes(q) || d.source.includes(q) || d.id.includes(q)),
      ),
    [state.kbDocs, q, filter],
  );
  const indexed = state.kbDocs.filter((d) => d.state === "indexed").length;
  const indexing = state.kbDocs.filter((d) => d.state === "indexing").length;
  const failed = state.kbDocs.filter((d) => d.state === "failed").length;
  const index = state.rag.indexes[0];
  const published = state.rag.configs.find((c) => c.state === "published") ?? state.rag.configs[0];
  const chunksOf = (id: string) => state.rag.chunks.filter((c) => c.docId === id);
  const runsOf = (id: string) => state.rag.runs.filter((r) => r.citations.some((c) => c.docId === id)).slice(0, 3);

  const columns: Column<KbDoc>[] = [
    {
      key: "name",
      title: "文档",
      render: (d) => (
        <div>
          <b>{d.name}</b>
          <span className="p-cell-sub">
            {d.id} · {d.type ? DOC_TYPE_LABEL[d.type] : "未分类"} · {d.source}
          </span>
        </div>
      ),
    },
    {
      key: "meta",
      title: "版本 / 负责人",
      width: "150px",
      render: (d) => (
        <div>
          <b className="p-small p-mono">{d.version ?? "—"}</b>
          <span className="p-cell-sub">{d.owner ?? "未指定"}</span>
        </div>
      ),
    },
    { key: "chunks", title: "片段", width: "80px", render: (d) => (d.chunks ? d.chunks : "—") },
    {
      key: "stage",
      title: "解析 / 索引",
      width: "190px",
      render: (d) =>
        d.state === "indexed" ? (
          <div>
            <Badge tone="ok">已写入索引</Badge>
            <span className="p-cell-sub p-mono">{index?.id}</span>
          </div>
        ) : d.state === "indexing" ? (
          <div>
            <div className="p-progress is-ok">
              <i style={{ width: `${d.stageProgress ?? 10}%` }} />
            </div>
            <span className="p-cell-sub">
              {d.stageLabel ?? "解析文档"} · {d.stageProgress ?? 10}%
            </span>
          </div>
        ) : (
          <div>
            <Badge tone="danger">解析失败</Badge>
            <span className="p-cell-sub">{d.error?.slice(0, 18) ?? "未知错误"}…</span>
          </div>
        ),
    },
    {
      key: "state",
      title: "状态",
      width: "96px",
      render: (d) => <Badge tone={STATE_TONE[d.state]}>{STATE_LABEL[d.state]}</Badge>,
    },
    { key: "at", title: "更新时间", width: "150px", render: (d) => <span className="p-mono p-small">{d.indexedAt}</span> },
    {
      key: "ops",
      title: "",
      width: "120px",
      render: (d) => (
        <div className="p-row-ops" onClick={(e) => e.stopPropagation()}>
          <button className="p-btn p-btn-text" onClick={() => setDetailId(d.id)}>
            详情
          </button>
          {d.state === "failed" && (
            <button className="p-btn p-btn-text" onClick={() => retryKbDoc(d.id)}>
              重试
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="p-page-head">
        <div>
          <h1>知识库管理</h1>
          <p>文档入库、解析切分、向量索引与引用溯源；检索测试见「知识库 → 检索测试」</p>
        </div>
        <div className="p-page-actions">
          <Button icon={<RefreshCw size={13} />} onClick={rebuildKbIndex} disabled={index?.state === "rebuilding"}>
            {index?.state === "rebuilding" ? "重建中…" : "重建索引"}
          </Button>
          <Button variant="primary" icon={<FileUp size={13} />} onClick={() => setUploading(true)}>
            上传文档
          </Button>
        </div>
      </div>

      <Stats
        items={[
          { label: "文档", value: state.kbDocs.length, hint: `${indexed} 已索引` },
          { label: "解析中", value: indexing, tone: indexing ? "active" : "muted" },
          { label: "索引失败", value: failed, tone: failed ? "danger" : "muted" },
          { label: "知识片段", value: state.rag.chunks.length },
          {
            label: "向量索引",
            value: index ? `${index.vectors}` : "—",
            hint: index ? `${index.id} · ${index.dim} 维 · ${index.state === "ready" ? "就绪" : index.state === "rebuilding" ? "重建中" : "失败"}` : undefined,
            tone: index?.state === "ready" ? "ok" : "warn",
          },
        ]}
      />

      <div className="p-toolbar">
        <div className="p-toolbar-search">
          <Search size={13} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索文档名称、编号或来源" />
        </div>
        <Select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ width: 130 }}>
          <option value="all">全部状态</option>
          <option value="indexed">已索引</option>
          <option value="indexing">索引中</option>
          <option value="failed">失败</option>
        </Select>
        <span className="p-toolbar-count">{rows.length} 份</span>
        <Link href="/proto/admin/kb/retrieval" className="p-btn p-btn-secondary p-btn-sm">
          检索测试 <ArrowRight size={12} />
        </Link>
        <Link href="/proto/admin/kb/config" className="p-btn p-btn-ghost p-btn-sm">
          模型与检索配置
        </Link>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(d) => d.id}
        onRowClick={(d) => setDetailId(d.id)}
        empty="没有符合条件的文档"
        emptyHint="上传一份 PDF 或 Markdown 试试"
      />

      <p className="p-muted p-footnote">
        演示环境：文档内容为模拟片段，文件不会真实上传；索引状态与向量数用于展示工程链路。
      </p>

      <Dialog
        open={uploading}
        title="上传文档"
        confirmText="上传并解析"
        onClose={() => setUploading(false)}
        onConfirm={() => {
          if (name.trim().length < 3) {
            setErr("文件名至少 3 个字符");
            return;
          }
          addKbDoc(name.trim().endsWith(".pdf") ? name.trim() : `${name.trim()}.pdf`, docType);
          setUploading(false);
          setName("");
          setErr("");
          setFilter("all");
        }}
      >
        <div className="p-form">
          <Field label="文件名" required error={err} hint="支持 PDF / Markdown / Word（模拟上传）">
            <TextInput value={name} onChange={(e) => { setName(e.target.value); setErr(""); }} placeholder="例如：值班交接规范" />
          </Field>
          <Field label="文档类型" hint="类型会影响检索重排时的先验权重">
            <Select value={docType} onChange={(e) => setDocType(e.target.value as KnowledgeDocType)}>
              {UPLOAD_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </Select>
          </Field>
          <div className="p-note">
            上传后依次执行「解析 → 清洗 → 切分 → 生成向量 → 写入索引」，约 3 秒完成（模拟）。
          </div>
        </div>
      </Dialog>

      <Drawer
        open={!!detail}
        title={detail?.name ?? ""}
        sub={detail ? `${detail.id} · ${detail.type ? DOC_TYPE_LABEL[detail.type] : "未分类"} · ${detail.source}` : undefined}
        onClose={() => { setDetailId(null); setFocusChunk(null); }}
        width={640}
        footer={
          detail && (
            <div className="p-row-ops">
              <Button
                onClick={() => retryKbDoc(detail.id)}
                disabled={detail.state === "indexing"}
                icon={<RefreshCw size={12} />}
              >
                {detail.state === "failed" ? "重试解析" : "重新解析"}
              </Button>
              <Link
                href={`/proto/admin/kb/retrieval?q=${encodeURIComponent(detail.name.replace(/\.[a-z]+$/i, ""))}&config=${published?.id ?? ""}`}
                className="p-btn p-btn-primary p-btn-md"
              >
                到检索测试验证
              </Link>
            </div>
          )
        }
      >
        {detail && (
          <div className="p-stack">
            <div className="p-row-ops">
              <Badge tone={STATE_TONE[detail.state]}>{STATE_LABEL[detail.state]}</Badge>
              {detail.state === "indexing" && <span className="p-muted p-small">当前阶段：{detail.stageLabel ?? "解析文档"}</span>}
              {detail.state === "indexed" && <span className="p-muted p-small">已写入 {index?.id}</span>}
            </div>

            <KeyValue
              cols={2}
              items={[
                { k: "版本", v: detail.version ?? "—" },
                { k: "负责人", v: detail.owner ?? "—" },
                { k: "页数", v: detail.pages ? `${detail.pages} 页` : "—" },
                { k: "大小", v: detail.size },
                { k: "片段数", v: detail.chunks || "—" },
                { k: "被引用", v: `${detail.citations} 次` },
                { k: "更新时间", v: <span className="p-mono">{detail.indexedAt}</span> },
                { k: "向量模型", v: <span className="p-mono">{published?.embeddingModel ?? "—"}</span> },
              ]}
            />

            <div>
              <h4 className="p-side-h">解析流水线</h4>
              <ul className="p-pipe">
                {KB_PARSE_STAGES.map((stage, i) => {
                  const done = detail.state === "indexed" || (detail.stage ?? 0) > i;
                  const active = detail.state === "indexing" && (detail.stage ?? 0) === i;
                  const broken = detail.state === "failed" && (detail.stage ?? 0) === i;
                  return (
                    <li key={stage} className={done ? "is-done" : broken ? "is-error" : active ? "is-active" : "is-pending"}>
                      <i>
                        {done ? <CheckCircle2 size={13} /> : broken ? <CircleAlert size={13} /> : active ? <Loader2 size={13} className="p-spin" /> : null}
                      </i>
                      <b>{stage}</b>
                      <span>
                        {done
                          ? i === 2
                            ? `${detail.chunks || "—"} 个片段`
                            : i === 3
                              ? published?.embeddingModel ?? "向量化"
                              : i === 4
                                ? index?.id ?? "写入索引"
                                : "完成"
                          : broken
                            ? "中断"
                            : active
                              ? `${detail.stageProgress ?? 0}%`
                              : "等待"}
                      </span>
                    </li>
                  );
                })}
              </ul>
              {detail.state === "failed" && (
                <div className="p-warn-banner">
                  <CircleAlert size={14} />
                  <span>
                    <b>解析失败：</b>
                    {detail.error ?? "未知错误"}
                  </span>
                </div>
              )}
              {detail.state === "indexing" && (
                <div className="p-progress is-ok" style={{ marginTop: 8 }}>
                  <i style={{ width: `${detail.stageProgress ?? 10}%` }} />
                </div>
              )}
            </div>

            <div>
              <div className="p-row-between" style={{ marginBottom: 6 }}>
                <h4 className="p-side-h">分块预览</h4>
                <span className="p-muted p-small">{chunksOf(detail.id).length} 条片段进入索引</span>
              </div>
              {chunksOf(detail.id).length === 0 ? (
                <div className="p-note">该文档尚未产出片段；完成切分后会在这里展示。</div>
              ) : (
                <ul className="p-chunk-list">
                  {chunksOf(detail.id).map((c) => (
                    <li key={c.id} className={focusChunk === c.id ? "is-focus" : ""}>
                      <div className="p-chunk-head">
                        <b className="p-mono">{c.id}</b>
                        <span>{c.section}</span>
                        <span className="p-muted p-small">第 {c.page} 页 · {c.tokens} tok</span>
                        <Link
                          href={`/proto/admin/kb/retrieval?q=${encodeURIComponent(c.section)}&config=${published?.id ?? ""}`}
                          className="p-link p-small"
                        >
                          检索验证
                        </Link>
                      </div>
                      <p>{c.text}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h4 className="p-side-h">引用溯源</h4>
              {runsOf(detail.id).length === 0 ? (
                <div className="p-note">近期的问答尚未引用该文档。</div>
              ) : (
                <div className="p-lines">
                  {runsOf(detail.id).map((r) => (
                    <div key={r.id} className="p-line">
                      <div>
                        <b>{r.question}</b>
                        <span>
                          <span className="p-mono">{r.id}</span> · {r.createdAt.slice(11, 16)} · 配置 v{r.configVersion} ·{" "}
                          {r.citations.filter((c) => c.docId === detail.id).length} 条引用
                        </span>
                      </div>
                      <Link href={`/proto/admin/traces/${r.traceId}`} className="p-link p-small">
                        查看 Trace
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-note">
              演示环境中知识库为本地模拟索引；未部署真实向量数据库、Embedding 或 Rerank 服务，也不会读取真实文件内容。
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
