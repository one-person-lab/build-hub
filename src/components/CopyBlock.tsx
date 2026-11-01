"use client";

import { useState } from "react";
import { writeClipboard } from "./clipboard";

/**
 * 复制块：装进 Agent 的那句话、那条命令、规范后的表达都用它。
 * inline 时只出一个按钮，跟在标题行右边。
 */
export default function CopyBlock({
  text,
  label,
  copiedLabel,
  failLabel,
  hint,
  pre,
  inline,
}: {
  text: string;
  label: string;
  copiedLabel: string;
  failLabel: string;
  hint?: string;
  /** 显示出来的内容可以比 text 短，比如只给那句话，复制时带上仓库地址 */
  pre?: string;
  inline?: boolean;
}) {
  const [state, setState] = useState<"idle" | "done" | "fail">("idle");
  const shown = state === "done" ? copiedLabel : state === "fail" ? failLabel : label;

  async function copy() {
    setState((await writeClipboard(text)) ? "done" : "fail");
    window.setTimeout(() => setState("idle"), 2000);
  }

  if (inline) {
    return (
      <button type="button" className="bs-copy-btn bs-copy-inline" onClick={copy}>
        {shown}
      </button>
    );
  }

  return (
    <div className="bs-copy-block">
      {hint ? <p className="bs-copy-hint">{hint}</p> : null}
      <pre className="bs-copy-text">{pre ?? text}</pre>
      <button type="button" className="bs-copy-btn" onClick={copy}>
        {shown}
      </button>
    </div>
  );
}
