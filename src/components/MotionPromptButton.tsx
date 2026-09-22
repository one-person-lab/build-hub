"use client";

import { useState } from "react";
import "./MotionPromptButton.css";

export default function MotionPromptButton({
  label,
  copiedLabel,
  buildPrompt,
  className = "",
}: {
  label: string;
  copiedLabel: string;
  buildPrompt: () => string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const text = buildPrompt();
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
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
