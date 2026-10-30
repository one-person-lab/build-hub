"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CircleAlert, Save, Send, ShieldCheck } from "lucide-react";
import { Badge, Button, Field, KeyValue, Select, TextInput } from "@/components/proto/ui";
import { useProto } from "@/lib/proto/store";
import { MODELS, modelById } from "@/lib/proto/ai-data";
import { KB_QA_PROMPT_VERSION, type RetrievalConfig } from "@/lib/proto/rag-data";

const CONFIDENCE_LABEL: Record<RetrievalConfig["onLowConfidence"], string> = {
  refuse: "直接拒答",
  handoff: "转人工处理",
  caveat: "回答并附加提示",
};

const FORM_FIELDS: (keyof RetrievalConfig)[] = [
  "chatModel",
  "embeddingModel",
  "rerankModel",
  "indexId",
  "topK",
  "scoreThreshold",
  "hybrid",
  "hybridAlpha",
  "rerank",
  "rerankTopN",
  "finalContexts",
  "maxContextTokens",
  "onLowConfidence",
];

export default function RetrievalConfigPage() {
  const { state, saveRetrievalConfig, publishRetrievalConfig } = useProto();
  const configs = state.rag.configs;
  const [configId, setConfigId] = useState(configs[0]?.id ?? "");
  const [form, setForm] = useState<RetrievalConfig>(() => configs[0]);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get("config");
    if (c && configs.some((x) => x.id === c)) setConfigId(c);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const c = configs.find((x) => x.id === configId) ?? configs[0];
    if (c) {
      setForm(c);
      setDirty(false);
    }
  }, [configId]); // eslint-disable-line react-hooks/exhaustive-deps

  const patch = (p: Partial<RetrievalConfig>) => {
    setForm((f) => ({ ...f, ...p }));
    setDirty(true);
  };

  const embedding = state.rag.embeddingModels.find((m) => `${m.id}@${m.version}` === form.embeddingModel);
  const rerank = state.rag.rerankModels.find((m) => `${m.id}@${m.version}` === form.rerankModel);
  const index = state.rag.indexes.find((x) => x.id === form.indexId);
  const chat = modelById(form.chatModel);
  const other = configs.find((c) => c.id !== configId);

  const issues = useMemo(() => {
    const list: { level: "danger" | "warn"; text: string }[] = [];
    if (chat?.availability === "offline") list.push({ level: "danger", text: `Chat 模型 ${chat.name} 当前离线，不能作为线上生成模型` });
    if (chat?.availability === "degraded") list.push({ level: "warn", text: `Chat 模型 ${chat.name} 处于降级状态，低置信度请求必须拒答或转人工` });
    if (embedding?.status === "degraded") list.push({ level: "warn", text: `向量模型 ${embedding.id} 处于降级状态，召回可能不稳定` });
    if (embedding && index && embedding.dim !== index.dim)
      list.push({ level: "danger", text: `向量模型维度 ${embedding.dim} 与索引 ${index.dim} 不一致，需要重建索引` });
    if (form.rerank && !form.rerankModel) list.push({ level: "danger", text: "已开启重排但未选择重排模型" });
    if (form.rerank && form.finalContexts > form.rerankTopN)
      list.push({ level: "danger", text: `最终上下文数 ${form.finalContexts} 大于重排保留数 ${form.rerankTopN}，超出部分不会进入上下文` });
    if (form.scoreThreshold > 0.85) list.push({ level: "warn", text: "相似度阈值偏高，容易出现检索为空并触发拒答" });
    if (form.maxContextTokens < form.finalContexts * 500)
      list.push({ level: "warn", text: "上下文 token 预算偏小，可能压缩或丢弃最后一个片段" });
    return list;
  }, [chat, embedding, index, form]);

  const blocking = issues.some((i) => i.level === "danger");

  const save = () => {
    const p: Partial<RetrievalConfig> = {};
    for (const k of FORM_FIELDS) (p as Record<string, unknown>)[k] = form[k];
    saveRetrievalConfig(form.id, p);
    setDirty(false);
  };

  return (
    <div>
      <div className="p-crumb">
        <Link href="/proto/admin/kb">知识库管理</Link>
        <span>/</span>
        <span>模型与检索配置</span>
      </div>

      <div className="p-page-head">
        <div>
          <h1>模型与检索配置</h1>
          <p>Chat、Embedding、Rerank、索引与召回参数同屏配置；保存为草稿后才能发布，发布只影响之后的新会话</p>
        </div>
        <div className="p-page-actions">
          <Link href={`/proto/admin/kb/retrieval?config=${configId}`} className="p-btn p-btn-secondary p-btn-md">
            用此配置测试
          </Link>
          <Button icon={<Save size={13} />} onClick={save} disabled={!dirty}>
            保存为草稿
          </Button>
          <Button
            variant="primary"
            icon={<Send size={13} />}
            disabled={dirty || blocking || form.state === "published"}
            onClick={() => publishRetrievalConfig(form.id)}
          >
            {form.state === "published" ? "已发布" : "发布配置"}
          </Button>
        </div>
      </div>

      <div className="p-card p-card-pad" style={{ marginBottom: 12 }}>
        <div className="p-grid-2">
          <Field label="配置" hint="演示环境保留两版配置，用于对比重排收益">
            <Select value={configId} onChange={(e) => setConfigId(e.target.value)}>
              {configs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.id} · v{c.version} · {c.state === "published" ? "已发布" : "草稿"}
                </option>
              ))}
            </Select>
          </Field>
          <KeyValue
            cols={2}
            items={[
              { k: "版本", v: <span className="p-mono">{form.id} · v{form.version}</span> },
              { k: "状态", v: <Badge tone={form.state === "published" ? "ok" : "warn"}>{form.state === "published" ? "已发布" : "草稿"}</Badge> },
              { k: "更新人", v: form.updatedBy },
              { k: "更新时间", v: <span className="p-mono">{form.updatedAt}</span> },
            ]}
          />
        </div>
        <p className="p-muted p-small" style={{ margin: "8px 0 0" }}>
          {form.note}
          {dirty && " · 有未保存的修改"}
        </p>
      </div>

      <div className="p-admin-split">
        <div className="p-stack">
          <div className="p-card p-card-pad">
            <h3 className="p-side-h">生成模型（Chat）</h3>
            <div className="p-grid-2">
              <Field label="Chat 模型" hint="生成回答与引用校验">
                <Select value={form.chatModel} onChange={(e) => patch({ chatModel: e.target.value })}>
                  {MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} · {m.vendor} · {m.availability === "online" ? "可用" : m.availability === "degraded" ? "降级" : "离线"}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Prompt 版本" hint="RAG 问答固定使用该提示词版本">
                <TextInput value={KB_QA_PROMPT_VERSION} readOnly />
              </Field>
            </div>
            {chat && (
              <div className="p-model-note">
                <div className="p-row-ops">
                  <Badge tone={chat.availability === "online" ? "ok" : chat.availability === "degraded" ? "warn" : "danger"}>
                    {chat.availability === "online" ? "可用" : chat.availability === "degraded" ? "降级" : "离线"}
                  </Badge>
                  <span className="p-muted p-small">{chat.contextWindow} · P50 {chat.p50} · 工具 {chat.toolCalling} · 结构化 {chat.structured}</span>
                </div>
                <p>{chat.notes}</p>
                <span className="p-muted p-small">模型均为模拟配置，未接入真实推理服务；未选中的模型不会出现在调用链中。</span>
              </div>
            )}
          </div>

          <div className="p-card p-card-pad">
            <h3 className="p-side-h">向量化（Embedding）</h3>
            <div className="p-grid-2">
              <Field label="向量模型" hint="决定片段如何写入索引">
                <Select value={form.embeddingModel} onChange={(e) => patch({ embeddingModel: e.target.value })}>
                  {state.rag.embeddingModels.map((m) => (
                    <option key={m.id} value={`${m.id}@${m.version}`}>
                      {m.id}@{m.version} · {m.name} · {m.dim} 维
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="向量索引" hint="只检索已索引成功的文档">
                <Select value={form.indexId} onChange={(e) => patch({ indexId: e.target.value })}>
                  {state.rag.indexes.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.id} · {x.dim} 维 · {x.vectors} 向量 · {x.state === "ready" ? "就绪" : x.state === "rebuilding" ? "重建中" : "失败"}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            {embedding && (
              <div className="p-model-note">
                <div className="p-row-ops">
                  <Badge tone={embedding.status === "online" ? "ok" : embedding.status === "degraded" ? "warn" : "danger"}>
                    {embedding.status === "online" ? "可用" : embedding.status === "degraded" ? "降级" : "离线"}
                  </Badge>
                  <span className="p-muted p-small">
                    {embedding.dim} 维 · {embedding.maxTokens} tok · P50 {embedding.p50} ms · ¥{embedding.pricePerKTok}/K tok
                  </span>
                </div>
                <p>{embedding.note}</p>
              </div>
            )}
            {index && (
              <p className="p-muted p-small" style={{ margin: 0 }}>
                索引 {index.id}：{index.engine} · {index.metric} · {index.vectors} 个向量 · 更新于 {index.updatedAt}
              </p>
            )}
          </div>

          <div className="p-card p-card-pad">
            <h3 className="p-side-h">重排（Rerank）</h3>
            <label className={`p-check${form.rerank ? " is-on" : ""}`} style={{ marginBottom: 8 }}>
              <input
                type="checkbox"
                checked={form.rerank}
                onChange={(e) => patch({ rerank: e.target.checked })}
              />
              <span>
                <b>启用重排</b>
                <em>先召回 TopK，再用交叉模型重新排序，只保留最终上下文数</em>
              </span>
            </label>
            <div className="p-grid-2">
              <Field label="重排模型" hint="关闭重排时不参与调用">
                <Select
                  value={form.rerankModel ?? ""}
                  onChange={(e) => patch({ rerankModel: e.target.value || null })}
                  disabled={!form.rerank}
                >
                  <option value="">不启用</option>
                  {state.rag.rerankModels.map((m) => (
                    <option key={m.id} value={`${m.id}@${m.version}`}>
                      {m.id}@{m.version} · {m.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="重排保留数" hint="进入最终上下文之前的候选上限">
                <TextInput
                  type="number"
                  value={form.rerankTopN}
                  disabled={!form.rerank}
                  onChange={(e) => patch({ rerankTopN: Number(e.target.value) })}
                />
              </Field>
            </div>
            {form.rerank && rerank && (
              <div className="p-model-note">
                <div className="p-row-ops">
                  <Badge tone={rerank.status === "online" ? "ok" : "warn"}>
                    {rerank.status === "online" ? "可用" : "降级"}
                  </Badge>
                  <span className="p-muted p-small">
                    最多 {rerank.maxDocs} 条 · P50 {rerank.p50} ms · ¥{rerank.pricePerKDoc}/K 次
                  </span>
                </div>
                <p>{rerank.note}</p>
              </div>
            )}
          </div>

          <div className="p-card p-card-pad">
            <h3 className="p-side-h">召回与上下文</h3>
            <div className="p-grid-2">
              <Field label="召回数量 Top-K" hint="向量召回上限">
                <TextInput type="number" value={form.topK} onChange={(e) => patch({ topK: Number(e.target.value) })} />
              </Field>
              <Field label="相似度阈值" hint="低于阈值的候选不进入重排">
                <TextInput
                  type="number"
                  step="0.01"
                  value={form.scoreThreshold}
                  onChange={(e) => patch({ scoreThreshold: Number(e.target.value) })}
                />
              </Field>
            </div>
            <label className={`p-check${form.hybrid ? " is-on" : ""}`} style={{ marginBottom: 8 }}>
              <input type="checkbox" checked={form.hybrid} onChange={(e) => patch({ hybrid: e.target.checked })} />
              <span>
                <b>混合检索</b>
                <em>向量分与关键词分加权融合；开启时才会做问题改写</em>
              </span>
            </label>
            {form.hybrid && (
              <Field label={`混合权重 α = ${form.hybridAlpha.toFixed(1)}`} hint="α 为向量权重，1-α 为关键词权重">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={form.hybridAlpha}
                  onChange={(e) => patch({ hybridAlpha: Number(e.target.value) })}
                  style={{ width: "100%" }}
                />
              </Field>
            )}
            <div className="p-grid-2">
              <Field label="最终上下文条数" hint="真正进入 Prompt 的片段数">
                <TextInput type="number" value={form.finalContexts} onChange={(e) => patch({ finalContexts: Number(e.target.value) })} />
              </Field>
              <Field label="上下文 token 预算">
                <TextInput type="number" value={form.maxContextTokens} onChange={(e) => patch({ maxContextTokens: Number(e.target.value) })} />
              </Field>
            </div>
            <Field label="低置信度处理" hint="检索为空或低于阈值时的兜底">
              <Select
                value={form.onLowConfidence}
                onChange={(e) => patch({ onLowConfidence: e.target.value as RetrievalConfig["onLowConfidence"] })}
              >
                {(Object.keys(CONFIDENCE_LABEL) as RetrievalConfig["onLowConfidence"][]).map((k) => (
                  <option key={k} value={k}>
                    {CONFIDENCE_LABEL[k]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </div>

        <div className="p-stack">
          <div className="p-card p-card-pad">
            <h3 className="p-side-h">链路预览</h3>
            <ol className="p-pipe is-chain">
              <li className="is-done"><i><ShieldCheck size={13} /></i><b>问题</b><span>知识类问题进入 RAG</span></li>
              <li className={form.hybrid ? "is-done" : "is-pending"}><i /> <b>问题改写</b><span>{form.hybrid ? "规则扩展同义词" : "未开启（混合检索关闭）"}</span></li>
              <li className="is-done"><i /><b>向量化</b><span className="p-mono">{form.embeddingModel}</span></li>
              <li className="is-done"><i /><b>召回</b><span>top {form.topK} · ≥ {form.scoreThreshold.toFixed(2)}</span></li>
              <li className={form.rerank ? "is-done" : "is-pending"}><i /><b>重排</b><span>{form.rerank ? `${form.rerankModel} → 前 ${form.rerankTopN}` : "未启用"}</span></li>
              <li className="is-done"><i /><b>上下文</b><span>{form.finalContexts} 条 · ≤ {form.maxContextTokens} tok</span></li>
              <li className="is-done"><i /><b>生成</b><span>{chat?.name ?? form.chatModel} · {KB_QA_PROMPT_VERSION}</span></li>
              <li className="is-done"><i /><b>引用校验</b><span>{form.onLowConfidence === "refuse" ? "低置信度拒答" : CONFIDENCE_LABEL[form.onLowConfidence]}</span></li>
            </ol>
          </div>

          <div className="p-card p-card-pad">
            <h3 className="p-side-h">配置自检</h3>
            {issues.length === 0 ? (
              <div className="p-note">没有发现配置冲突。</div>
            ) : (
              <ul className="p-issue-list">
                {issues.map((i, k) => (
                  <li key={k} className={i.level === "danger" ? "is-error" : "is-warn"}>
                    {i.text}
                  </li>
                ))}
              </ul>
            )}
            {blocking && (
              <div className="p-warn-banner" style={{ marginBottom: 0 }}>
                <CircleAlert size={14} /> 存在阻断项，修复后才能发布（仍可保存为草稿）。
              </div>
            )}
          </div>

          {other && (
            <div className="p-card">
              <div className="p-card-head">
                <div>
                  <h3>与 v{other.version} 的差异</h3>
                  <p>{other.name} · {other.state === "published" ? "已发布" : "草稿"}</p>
                </div>
                <Link href={`/proto/admin/kb/retrieval?config=${other.id}`} className="p-btn p-btn-ghost p-btn-sm">
                  测试对照配置
                </Link>
              </div>
              <div className="p-table-wrap">
                <table className="p-table">
                  <thead>
                    <tr>
                      <th>参数</th>
                      <th>当前 v{form.version}</th>
                      <th>v{other.version}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(["topK", "scoreThreshold", "rerank", "rerankModel", "finalContexts", "maxContextTokens", "onLowConfidence"] as const).map((k) => {
                      const a = String(form[k]);
                      const b = String(other[k]);
                      return (
                        <tr key={k} className={a !== b ? "is-clickable" : undefined}>
                          <td>{k}</td>
                          <td><span className="p-mono">{a}</span>{a !== b && <Badge tone="brand">当前</Badge>}</td>
                          <td><span className="p-mono">{b}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="p-note">
            演示环境不调用真实模型、向量数据库或 Rerank 服务；页面展示的模型名与指标均为模拟配置，未选中的模型不会被标记为已部署。
          </div>
        </div>
      </div>
    </div>
  );
}
