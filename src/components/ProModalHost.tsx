"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { registerProModal, type ProOpenOpts } from "@/lib/pro-modal";

const ProModal = dynamic(() => import("./ProModal"), { ssr: false });

/** 全站只有这一处挂开通弹窗。旧的 /pro 地址会带到 ?pro=1，在这里打开后抹掉参数。 */
export function ProModalHost() {
  const pathname = usePathname();
  const locale: "zh" | "en" = pathname?.startsWith("/en") ? "en" : "zh";
  const [opts, setOpts] = useState<ProOpenOpts | null>(null);

  useEffect(() => {
    registerProModal((next) => setOpts(next ?? {}));
    return () => registerProModal(null);
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("pro") !== "1") return;
    setOpts({});
    url.searchParams.delete("pro");
    const q = url.searchParams.toString();
    window.history.replaceState(null, "", url.pathname + (q ? `?${q}` : "") + url.hash);
  }, [pathname]);

  if (!opts) return null;
  return (
    <ProModal
      locale={locale}
      entry={opts.entry}
      initialPlan={opts.initialPlan}
      reason={opts.reason === "pro" ? undefined : opts.reason}
      onClose={() => setOpts(null)}
    />
  );
}
