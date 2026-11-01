"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import ProModal from "./ProModal";
import { registerCopyLimitModal } from "@/lib/copy-gate";

/** 挂在根布局里：免费复制额度用完，全站唯一的开通卡由这个实例接住 */
export function CopyLimitHost() {
  const pathname = usePathname();
  const locale: "zh" | "en" = pathname?.startsWith("/en") ? "en" : "zh";
  const [open, setOpen] = useState(false);

  useEffect(() => {
    registerCopyLimitModal(() => setOpen(true));
    return () => registerCopyLimitModal(null);
  }, []);

  if (!open) return null;
  return <ProModal locale={locale} onClose={() => setOpen(false)} />;
}
