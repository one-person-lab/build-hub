"use client";

import Link from "next/link";
import { Badge, Stats } from "@/components/proto/ui";
import { useProto } from "@/lib/proto/store";
import { TASK_TYPE_EFFECTS, type EffectStat, type ModelDef } from "@/lib/proto/ai-data";

const AVAILABILITY: Record<ModelDef["availability"], { label: string; tone: "ok" | "warn" | "danger" }> = {
  online: { label: "在线", tone: "ok" },
  degraded: { label: "降级", tone: "warn" },
  offline: { label: "不可用", tone: "danger" },
};

const CAPABILITY_LABEL: Record<ModelDef["toolCalling"], string> = {
  full: "完整",
  partial: "部分",
  none: "不支持",
};

export default function ModelsPage() {
  const { state, toggleModelAvailability, toast } = useProto();
  const models = state.ai.models;
  const rules = state.ai.routingRules.filter((r) => r.enabled);
  const effects = rules
    .map((r) => ({ rule: r, stat: TASK_TYPE_EFFECTS[r.taskType] }))
    .filter((e): e is { rule: (typeof rules)[number]; stat: EffectStat } => Boolean(e.stat));

  return (
    <div>
      <div className="p-page-head">
        <div>
          <h1>模型管理</h1>
          <p>登记模型能力、价格与可用状态，按任务类型配置路由与回退边界，并观察每次调用选择了谁、为什么</p>
        </div>
        <div className="p-page-actions">
          <Link href="/proto/admin/models/routing" className="p-btn p-btn-primary p-btn-md">路由策略</Link>
          <Link href="/proto/admin/traces" className="p-btn p-btn-secondary p-btn-md">查看调用记录</Link>
        </div>
      </div>

      <Stats
        items={[
          { label: "已登记模型", value: models.length },
          { label: "在线", value: models.filter((m) => m.availability === "online").length, tone: "ok" },
          { label: "降级 / 不可用", value: models.filter((m) => m.availability !== "online").length, tone: "warn" },
          { label: "启用路由规则", value: rules.length, hint: `覆盖 ${rules.length} 类任务` },
        ]}
      />

      <div className="p-card">
        <div className="p-card-head">
          <div>
            <h3>模型注册表</h3>
            <p>点击「可用状态」可在 在线 → 降级 → 不可用 之间切换，用于演示路由回退</p>
          </div>
          <span className="p-muted p-small">价格单位：¥ / 千 tokens（模拟）· 简单问答走最低档，写操作走 V4-Pro</span>
        </div>
        <table className="p-table">
          <thead>
            <tr>
              <th>模型</th>
              <th>供应商</th>
              <th>能力标签</th>
              <th>上下文</th>
              <th>价格（入 / 出）</th>
              <th>P50</th>
              <th>工具调用</th>
              <th>结构化</th>
              <th>可用状态</th>
            </tr>
          </thead>
          <tbody>
            {models.map((m) => (
              <tr key={m.id}>
                <td>
                  <b className="p-mono">{m.name}</b>
                  <span className="p-cell-sub">{m.notes}</span>
                </td>
                <td>{m.vendor}</td>
                <td>
                  <div className="p-ver-cell">
                    {m.tags.map((t) => (
                      <span key={t} className="p-tag">{t}</span>
                    ))}
                  </div>
                </td>
                <td className="p-mono">{m.contextWindow}</td>
                <td className="p-mono p-small">
                  {m.priceIn} / {m.priceOut}
                </td>
                <td className="p-mono">{m.p50}</td>
                <td>
                  <Badge tone={m.toolCalling === "full" ? "ok" : m.toolCalling === "partial" ? "warn" : "danger"}>
                    {CAPABILITY_LABEL[m.toolCalling]}
                  </Badge>
                </td>
                <td>
                  <Badge tone={m.structured === "full" ? "ok" : m.structured === "partial" ? "warn" : "danger"}>
                    {CAPABILITY_LABEL[m.structured]}
                  </Badge>
                </td>
                <td>
                  <button
                    className={`p-badge p-badge-${AVAILABILITY[m.availability].tone}`}
                    onClick={() => {
                      toggleModelAvailability(m.id);
                      toast(`已切换 ${m.id} 的可用状态（模拟）`, "info");
                    }}
                  >
                    {AVAILABILITY[m.availability].label}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-card" style={{ marginTop: 16 }}>
        <div className="p-card-head">
          <div>
            <h3>按任务类型的效果对比</h3>
            <p>主模型与回退模型的成功率、成本与延迟，模型口径直接取上方的路由规则；样本量来自模拟统计</p>
          </div>
          <span className="p-muted p-small">成功率 = 规则与业务校验均通过</span>
        </div>
        <table className="p-table">
          <thead>
            <tr>
              <th>任务类型</th>
              <th>主模型</th>
              <th>成功率</th>
              <th>单次成本</th>
              <th>P50</th>
              <th>备用模型</th>
              <th>成功率</th>
              <th>单次成本</th>
              <th>P50</th>
              <th>样本</th>
              <th>说明</th>
            </tr>
          </thead>
          <tbody>
            {effects.map(({ rule, stat }) => (
              <tr key={rule.id}>
                <td><b>{rule.taskType}</b></td>
                <td className="p-mono p-small">{rule.primaryModel}</td>
                <td>{stat.primarySuccess}%</td>
                <td className="p-mono p-small">¥{stat.primaryCost.toFixed(3)}</td>
                <td className="p-mono p-small">{stat.primaryP50}</td>
                <td className="p-mono p-small">{rule.fallbackModel}</td>
                <td>
                  {stat.fallbackSuccess === 0 ? <Badge tone="danger">不可用</Badge> : `${stat.fallbackSuccess}%`}
                </td>
                <td className="p-mono p-small">{stat.fallbackCost ? `¥${stat.fallbackCost.toFixed(3)}` : "—"}</td>
                <td className="p-mono p-small">{stat.fallbackP50}</td>
                <td className="p-mono p-small">{stat.samples}</td>
                <td className="p-small p-muted">{stat.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-note" style={{ marginTop: 12 }}>
        模型服务与价格均为模拟配置，未接入任何真实供应商；页面不展示真实密钥，供应商凭证只用脱敏占位表示。
      </div>
    </div>
  );
}
