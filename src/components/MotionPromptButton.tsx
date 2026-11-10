"use client";

import { useState } from "react";
import { copyPromptWithGate } from "@/lib/copy-gate";
import { writeClipboard } from "./clipboard";
import "./MotionPromptButton.css";

export default function MotionPromptButton({
  label,
  copiedLabel,
  buildPrompt,
  source,
  className = "",
  gate = true,
}: {
  label: string;
  copiedLabel: string;
  buildPrompt: () => string;
  /** 记账用的条目标识，服务端按账号累计复制次数 */
  source: string;
  className?: string;
  /** 收录条目的复刻提示词不拦登录，点了就直接拿走 */
  gate?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const flash = () => {
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const copy = async () => {
    if (!gate) {
      if (await writeClipboard(buildPrompt())) flash();
      return;
    }
    copyPromptWithGate(buildPrompt(), source, flash);
  };

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
