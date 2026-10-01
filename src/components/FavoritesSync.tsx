"use client";

import { useEffect } from "react";

/** PRO 用户：进页面时本地收藏与云端并集合并（追加式），变更后即时推送回云端 */
export default function FavoritesSync() {
  useEffect(() => {
    let cancelled = false;
    let pro = false;

    async function merge() {
      const me = await fetch("/api/me").then((r) => r.json()).catch(() => null);
      if (cancelled || !me?.user || !me.pro) return;
      pro = true;

      const cloud: string[] = await fetch("/api/favorites")
        .then((r) => (r.ok ? r.json() : { favorites: [] }))
        .then((d) => d.favorites ?? [])
        .catch(() => []);
      if (cancelled) return;

      let local: string[] = [];
      try {
        const saved = JSON.parse(localStorage.getItem("vh-favorites") || "[]");
        if (Array.isArray(saved))
          local = saved.filter((s) => typeof s === "string");
      } catch {
        local = [];
      }

      const merged = Array.from(new Set([...local, ...cloud]));
      if (merged.length === 0) return;
      localStorage.setItem("vh-favorites", JSON.stringify(merged));
      window.dispatchEvent(
        new CustomEvent("vh-favorites-synced", { detail: merged })
      );
      if (merged.length !== cloud.length) await push();
    }

    async function push() {
      if (!pro) return;
      let local: string[] = [];
      try {
        const saved = JSON.parse(localStorage.getItem("vh-favorites") || "[]");
        if (Array.isArray(saved)) local = saved.filter((s) => typeof s === "string");
      } catch {
        return;
      }
      await fetch("/api/favorites", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ favorites: local }),
      }).catch(() => {});
    }

    merge();
    window.addEventListener("vh-favorites-changed", push);
    return () => {
      cancelled = true;
      window.removeEventListener("vh-favorites-changed", push);
    };
  }, []);
  return null;
}
