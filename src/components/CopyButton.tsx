"use client";

import { useState } from "react";
import { writeClipboard } from "./clipboard";

export default function CopyButton({
  text,
  label,
  copiedLabel,
  failLabel,
  className = "",
}: {
  text: string;
  label: string;
  copiedLabel: string;
  failLabel: string;
  className?: string;
}) {
  const [state, setState] = useState<"idle" | "ok" | "fail">("idle");

  async function onClick() {
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
