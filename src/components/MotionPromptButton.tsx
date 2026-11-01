"use client";

import { useState } from "react";
import { copyPromptWithGate } from "@/lib/copy-gate";
import "./MotionPromptButton.css";

export default function MotionPromptButton({
  label,
  copiedLabel,
  buildPrompt,
  source,
  className = "",
}: {
  label: string;
  copiedLabel: string;
  buildPrompt: () => string;
  /** 记账用的条目标识，服务端按账号累计复制次数 */
  source: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = () =>
    copyPromptWithGate(buildPrompt(), source, () => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    });

  return (
    <button type="button" className={"mpb" + (copied ? " is-copied" : "") + (className ? " " + className : "")} onClick={copy}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="9" y="9" width="11" height="11" rx="2.5" />
        <path d="M5 15V5.5A1.5 1.5 0 0 1 6.5 4H15" />
      </svg>
      {copied ? copiedLabel : label}
    </button>
  );
}
