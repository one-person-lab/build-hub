"use client";

import { useState } from "react";
import { writeClipboard } from "./clipboard";
import { copyPromptWithGate } from "@/lib/copy-gate";

export default function CopyButton({
  text,
  label,
  copiedLabel,
  failLabel,
  className = "",
  source,
}: {
  text: string;
  label: string;
  copiedLabel: string;
  failLabel: string;
  className?: string;
  /** 传了就走提示词闸门（要登录、按账号计次数）；安装命令这类不传，随手可复制 */
  source?: string;
}) {
  const [state, setState] = useState<"idle" | "ok" | "fail">("idle");

  function flash() {
    setState("ok");
    window.setTimeout(() => setState("idle"), 1600);
  }

  async function onClick() {
    if (source) {
      await copyPromptWithGate(text, source, flash);
      return;
    }
    const ok = await writeClipboard(text);
    setState(ok ? "ok" : "fail");
    window.setTimeout(() => setState("idle"), 1600);
  }

  const text_ =
    state === "ok" ? copiedLabel : state === "fail" ? failLabel : label;

  return (
    <button
      type="button"
      className={
        "copy-btn " +
        className +
        (state === "ok" ? " is-copied" : "") +
        (state === "fail" ? " is-failed" : "")
      }
      onClick={onClick}
      aria-live="polite"
    >
      <span className="copy-btn-icon" aria-hidden="true">
        {state === "ok" ? "✓" : "⧉"}
      </span>
      {text_}
    </button>
  );
}
