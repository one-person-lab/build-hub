import type {
  DiagramEdge,
  DiagramFlow,
  DiagramNode,
  DiagramSpec,
  DiagramKind,
} from "./architecture-types";

/**
 * 工程实践的流程图形状生成器。
 * 与 /architecture 共用 DiagramSpec + IcePanelDiagram，所以这里的图同样支持
 * 全景 / 链路聚焦、缩放、全屏；区别只是数据更紧凑，适合一篇作品一张工作流图。
 */

export type FlowStep = {
  label: string;
  desc: string;
  tech: string;
  kind?: DiagramKind;
  /** 从上一节点进入本节点的动作，写在连线上 */
  edge?: string;
};

export type FlowView = { id: string; label: string; note: string; focus: number[] };

const EDGE_WORDS = ["输入", "拆解", "执行", "校验", "产出", "反馈", "闭环", "归档"];

/** 蛇形工作流：第一行从左到右，第二行折返，跨行处做一条竖直连线 */
export function chainFlow(opts: {
  id: string;
  title: string;
  en: string;
  desc: string;
  caption: string;
  steps: FlowStep[];
  flows: FlowView[];
}): DiagramSpec {
  const { id, steps, flows } = opts;
  const n = steps.length;
  const cols = Math.ceil(n / 2);
  const vb = { w: 1400, h: 620 };
  const NODE_W = 200;
  const gap = (vb.w - 120 - cols * NODE_W) / Math.max(1, cols - 1);
  const xAt = (col: number) => Math.round(60 + col * (NODE_W + gap));

  const nodes: DiagramNode[] = steps.map((s, i) => {
    const row = i < cols ? 0 : 1;
    const col = row === 0 ? i : cols - 1 - (i - cols);
    return {
      id: `${id}-n${i}`,
      label: s.label,
      desc: s.desc,
      tech: s.tech,
      kind: s.kind ?? "component",
      x: xAt(col),
      y: row === 0 ? 150 : 390,
      w: NODE_W,
    };
  });

  const edges: DiagramEdge[] = [];
  for (let i = 0; i < n - 1; i++) {
    const sameRow = (i < cols) === (i + 1 < cols);
    const label = steps[i + 1].edge ?? EDGE_WORDS[i % EDGE_WORDS.length];
    edges.push({
      from: nodes[i].id,
      to: nodes[i + 1].id,
      label,
      fromSide: sameRow ? (i + 1 < cols ? "right" : "left") : "bottom",
      toSide: sameRow ? (i + 1 < cols ? "left" : "right") : "top",
      dashed: !sameRow,
    });
  }

  return {
    id,
    title: opts.title,
    en: opts.en,
    category: "system",
    required: true,
    desc: opts.desc,
    vb,
    caption: opts.caption,
    nodes,
    edges,
    flows: flows.map((f) => ({
      id: f.id,
      label: f.label,
      note: f.note,
      focus: f.focus.map((i) => nodes[i].id),
    })) as DiagramFlow[],
  };
}
