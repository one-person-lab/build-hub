"use client";

import { useState } from "react";
import { Cable, Database, PlugZap, RotateCcw, Save, Send } from "lucide-react";
import { Badge, Button, Dialog, Field, KeyValue, Select, Switch, TextInput } from "@/components/proto/ui";
import { useProto } from "@/lib/proto/store";

export default function SettingsPage() {
  const { state, resetDemo, toast } = useProto();
  const [gateway, setGateway] = useState("https://gateway.mock.local/api/v1");
  const [protocol, setProtocol] = useState("mqtt");
  const [gwErr, setGwErr] = useState("");
  const [testing, setTesting] = useState(false);
  const [endpoint, setEndpoint] = useState("https://llm.mock.local/v1");
  const [model, setModel] = useState("deepseek-v4-pro");
  const [webhook, setWebhook] = useState("https://hooks.mock.local/ops-copilot");
  const [notify, setNotify] = useState({ failed: true, highRisk: true, report: false });
  const [resetOpen, setResetOpen] = useState(false);

  const testGateway = () => {
    setTesting(true);
    setTimeout(() => {
      setTesting(false);
      toast("连接测试通过（模拟网关，未接入真实设备）", "ok");
    }, 900);
  };

  return (
    <div>
      <div className="p-page-head">
        <div>
          <h1>系统设置</h1>
          <p>设备接入、模型服务、通知与演示数据管理</p>
        </div>
        <div className="p-page-actions">
          <Badge tone="warn">模拟环境 · 所有连接均未接入真实系统</Badge>
        </div>
      </div>

      <div className="p-admin-split">
        <div className="p-stack">
          <div className="p-card p-card-pad">
            <h3 className="p-side-h"><Cable size={12} /> 设备接入（模拟）</h3>
            <div className="p-form">
              <Field
                label="机巢网关地址"
                required
                error={gwErr}
                hint="仅用于展示配置项，原型不会发起真实连接"
              >
                <TextInput
                  value={gateway}
                  invalid={!!gwErr}
                  onChange={(e) => {
                    setGateway(e.target.value);
                    setGwErr("");
                  }}
                />
              </Field>
              <div className="p-grid-2">
                <Field label="接入协议">
                  <Select value={protocol} onChange={(e) => setProtocol(e.target.value)}>
                    <option value="mqtt">MQTT over TLS</option>
                    <option value="http">HTTPS 轮询</option>
                  </Select>
                </Field>
                <Field label="访问令牌" hint="已脱敏，不可在此查看明文">
                  <TextInput value="••••••••••••••••" readOnly />
                </Field>
              </div>
              <div className="p-inline-actions">
                <Button
                  icon={<PlugZap size={13} />}
                  disabled={testing}
                  onClick={() => {
                    if (!gateway.startsWith("https://")) {
                      setGwErr("网关地址必须以 https:// 开头");
                      return;
                    }
                    testGateway();
                  }}
                >
                  {testing ? "测试中…" : "测试连接"}
                </Button>
                <Button
                  variant="primary"
                  icon={<Save size={13} />}
                  onClick={() => {
                    if (!gateway.startsWith("https://")) {
                      setGwErr("网关地址必须以 https:// 开头");
                      return;
                    }
                    toast("设备接入配置已保存（模拟）", "ok");
                  }}
                >
                  保存
                </Button>
              </div>
            </div>
          </div>

          <div className="p-card p-card-pad">
            <h3 className="p-side-h"><Send size={12} /> 模型服务</h3>
            <div className="p-form">
              <Field label="服务地址" hint="模拟地址，不会发起请求">
                <TextInput value={endpoint} onChange={(e) => setEndpoint(e.target.value)} />
              </Field>
              <div className="p-grid-2">
                <Field label="默认模型">
                  <Select value={model} onChange={(e) => setModel(e.target.value)}>
                    {state.ai.models.map((m) => (
                      <option key={m.id} value={m.id}>{m.id}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="最大并发">
                  <TextInput type="number" defaultValue={8} />
                </Field>
              </div>
              <div className="p-switch-row">
                <div>
                  <b>失败自动重试</b>
                  <span>最多重试 2 次，间隔 1 秒</span>
                </div>
                <Switch on onChange={() => toast("该开关在原型中固定开启", "info")} />
              </div>
              <div className="p-inline-actions">
                <Button onClick={() => toast("模型服务连通性正常（模拟）", "ok")}>连通性检查</Button>
                <Button variant="primary" icon={<Save size={13} />} onClick={() => toast("模型配置已保存（模拟）", "ok")}>
                  保存
                </Button>
              </div>
            </div>
          </div>

          <div className="p-card p-card-pad">
            <h3 className="p-side-h">通知</h3>
            <div className="p-form">
              <Field label="Webhook 地址" hint="任务失败、高风险事件会推送到该地址">
                <TextInput value={webhook} onChange={(e) => setWebhook(e.target.value)} />
              </Field>
              <div className="p-switch-row">
                <div><b>任务失败通知</b><span>执行异常时立即推送</span></div>
                <Switch on={notify.failed} onChange={(v) => setNotify({ ...notify, failed: v })} />
              </div>
              <div className="p-switch-row">
                <div><b>高风险事件通知</b><span>事件等级为高时推送给值班长</span></div>
                <Switch on={notify.highRisk} onChange={(v) => setNotify({ ...notify, highRisk: v })} />
              </div>
              <div className="p-switch-row">
                <div><b>报告生成通知</b><span>报告可读后推送给操作人</span></div>
                <Switch on={notify.report} onChange={(v) => setNotify({ ...notify, report: v })} />
              </div>
              <div className="p-inline-actions">
                <Button icon={<Send size={13} />} onClick={() => toast("已发送测试通知（模拟）", "ok")}>发送测试</Button>
                <Button variant="primary" icon={<Save size={13} />} onClick={() => toast("通知配置已保存", "ok")}>保存</Button>
              </div>
            </div>
          </div>
        </div>

        <aside className="p-stack">
          <div className="p-card p-card-pad">
            <h3 className="p-side-h">环境信息</h3>
            <KeyValue
              cols={1}
              items={[
                { k: "环境", v: "演示 / mock" },
                { k: "版本", v: "prototype 0.9" },
                { k: "数据来源", v: "内置模拟数据" },
                { k: "真实设备", v: <Badge tone="muted">未连接</Badge> },
                { k: "模型调用", v: <Badge tone="muted">未接入</Badge> },
              ]}
            />
          </div>

          <div className="p-card p-card-pad">
            <h3 className="p-side-h"><Database size={12} /> 演示数据</h3>
            <p className="p-muted p-small">
              重置会恢复全部模拟任务、事件、航线、工作流与会话，便于重复演示。
            </p>
            <div className="p-inline-actions">
              <Button variant="danger" icon={<RotateCcw size={13} />} onClick={() => setResetOpen(true)}>重置演示数据</Button>
            </div>
          </div>

          <div className="p-card">
            <div className="p-card-head">
              <h3>配置变更日志</h3>
            </div>
            <div className="p-lines">
              {state.audits.slice(0, 3).map((a) => (
                <div key={a.id} className="p-line">
                  <div>
                    <b>{a.action}</b>
                    <span>{a.actor} · {a.at}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <Dialog
        open={resetOpen}
        title="重置全部演示数据？"
        confirmText="重置"
        danger
        onClose={() => setResetOpen(false)}
        onConfirm={() => {
          resetDemo();
          setResetOpen(false);
        }}
      >
        当前演示中的任务进度、事件处置结果、草稿配置都会恢复为初始状态。此操作只影响内存中的模拟数据。
      </Dialog>
    </div>
  );
}
