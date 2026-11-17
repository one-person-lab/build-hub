"use client";

import { useEffect } from "react";
import { registerCopyLimitModal } from "@/lib/copy-gate";
import { openProModal } from "@/lib/pro-modal";

/** 免费复制额度用完：交给全站唯一的开通弹窗 */
export function CopyLimitHost() {
  useEffect(() => {
    registerCopyLimitModal(() => openProModal({ reason: "copy" }));
    return () => registerCopyLimitModal(null);
  }, []);
  return null;
}
