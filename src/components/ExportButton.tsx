"use client";

import { useState } from "react";
import { track } from "@/lib/track";

export default function ExportButton({
  locale,
  kind = "favorites",
  id,
  pro,
  onNeedPro,
  className = "rd-btn-ghost",
  label,
}: {
  locale: "zh" | "en";
  kind?: "favorites" | "collection";
  id?: string;
  pro: boolean;
  onNeedPro: () => void;
  className?: string;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);

  async function download() {
    if (!pro) {
      onNeedPro();
      return;
    }
    setBusy(true);
    setErr(false);
    try {
      const params = new URLSearchParams({ kind, locale });
      if (id) params.set("id", id);
      const r = await fetch(`/api/export?${params}`);
      if (r.status === 403) {
        onNeedPro();
        return;
      }
      if (!r.ok) throw new Error();
      const blob = await r.blob();
      const name = /filename="([^"]+)"/.exec(r.headers.get("content-disposition") ?? "")?.[1];
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name ?? "buildhub-export.md";
      a.click();
      URL.revokeObjectURL(url);
      track("export", { kind });
    } catch {
      setErr(true);
    } finally {
      setBusy(false);
    }
  }

  const text = busy
    ? locale === "en"
      ? "Preparing…"
      : "正在导出…"
    : err
      ? locale === "en"
        ? "Export failed, retry"
        : "导出失败，重试"
      : label ?? (locale === "en" ? "Export as Markdown" : "导出为 Markdown");

  return (
    <button type="button" className={className} onClick={download} disabled={busy}>
      {text}
      {!pro && <span className="fav-pro-tag">PRO</span>}
    </button>
  );
}
