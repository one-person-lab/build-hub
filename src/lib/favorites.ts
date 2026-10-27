"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";

/** 非 PRO 用户的收藏上限；已超出这条线之前收藏的不删，只是再加要开通 */
export const FREE_FAVORITE_LIMIT = 20;

export const FAVORITES_KEY = "vh-favorites";

function parse(raw: string | null): string[] {
  try {
    const saved = JSON.parse(raw || "[]");
    return Array.isArray(saved) ? saved.filter((s) => typeof s === "string") : [];
  } catch {
    return [];
  }
}

/** 本地存储没有版本号，只能比对序列化结果；每次快照都给新数组会把 React 逼进重渲染循环 */
let cache: { raw: string | null; list: string[] } = { raw: null, list: [] };
const EMPTY: string[] = [];

function subscribe(cb: () => void) {
  window.addEventListener("vh-favorites-changed", cb);
  window.addEventListener("vh-favorites-synced", cb);
  return () => {
    window.removeEventListener("vh-favorites-changed", cb);
    window.removeEventListener("vh-favorites-synced", cb);
  };
}

function getSnapshot(): string[] {
  const raw = localStorage.getItem(FAVORITES_KEY);
  if (raw !== cache.raw) cache = { raw, list: parse(raw) };
  return cache.list;
}

export function readFavorites(): string[] {
  return parse(localStorage.getItem(FAVORITES_KEY));
}

export function writeFavorites(next: string[]) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("vh-favorites-changed"));
}

export type Me = {
  user: { email: string; proUntil: string | null } | null;
  pro: boolean;
  payTest?: { key: string } | null;
};

export function useFavoriteSlugs() {
  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
}

export function useMe() {
  const [me, setMe] = useState<Me | null>(null);
  useEffect(() => {
    const load = () =>
      fetch("/api/me")
        .then((r) => r.json())
        .then((d: Me) => setMe(d))
        .catch(() => {});
    load();
    window.addEventListener("vh-me-changed", load);
    return () => window.removeEventListener("vh-me-changed", load);
  }, []);
  return me;
}

/** 到线时要弹的就是开通卡，所以钩子把开关交给调用方去渲染 */
export function useFavorites() {
  const slugs = useFavoriteSlugs();
  const me = useMe();
  const [limitHit, setLimitHit] = useState(false);

  const favorites = useMemo(() => new Set(slugs), [slugs]);
  const pro = !!me?.pro;

  const toggle = useCallback(
    (slug: string) => {
      const has = slugs.includes(slug);
      if (!has && !pro && slugs.length >= FREE_FAVORITE_LIMIT) {
        setLimitHit(true);
        return;
      }
      writeFavorites(has ? slugs.filter((s) => s !== slug) : [...slugs, slug]);
    },
    [pro, slugs],
  );

  return { favorites, slugs, pro, toggle, limitHit, dismissLimit: () => setLimitHit(false) };
}
