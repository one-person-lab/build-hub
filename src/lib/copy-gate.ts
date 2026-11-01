"use client";

import { requireLogin } from "@/lib/auth-modal";
import { writeClipboard } from "@/components/clipboard";

export type PromptCopyOutcome = "copied" | "failed" | "blocked" | "login";

type OpenLimit = () => void;

let openLimitModal: OpenLimit | null = null;

/** 由布局里的 CopyLimitHost 注册，全站共用一张开通卡 */
export function registerCopyLimitModal(fn: OpenLimit | null) {
  openLimitModal = fn;
}

/**
 * 「复制提示词」的统一闸门：服务端按账号记账，未登录 401、超出免费额度 403。
 * 安装命令和正文 Markdown 不走这里，保持随手可复制。
 * onCopied 在登录补完后的那条路上也会触发，按钮的「已复制」不会丢。
 */
export async function copyPromptWithGate(
  text: string,
  source: string,
  onCopied?: () => void
): Promise<PromptCopyOutcome> {
  const run = async (): Promise<PromptCopyOutcome> => {
    const res = await fetch("/api/copies", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ source }),
    }).catch(() => null);
    if (res?.status === 401) {
      requireLogin({ reason: "copy", onDone: () => void run() });
      return "login";
    }
    if (res?.status === 403) {
      openLimitModal?.();
      return "blocked";
    }
    if (!(await writeClipboard(text))) return "failed";
    onCopied?.();
    return "copied";
  };
  return run();
}
