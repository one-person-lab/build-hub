"use client";

import { useSyncExternalStore } from "react";
import type { StarSnapshot } from "@/lib/github-repo";

/**
 * 浏览器侧的星数订阅。
 * 一页里几十张卡片也只发一次请求；页面可见时每小时再问一次服务端
 * （让长时间开着的页面跨天也能更新），服务端每天才真正向 GitHub 拉一次。
 */

export type StarsState = StarSnapshot & { loading: boolean };

const REFRESH_MS = 60 * 60 * 1000;
const MIN_INTERVAL_MS = 30 * 1000;

const INITIAL: StarsState = {
  stars: {},
  updatedAt: null,
  stale: false,
  loading: true,
};

let state: StarsState = INITIAL;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;
let inFlight: Promise<void> | null = null;
let lastAttempt = 0;

function emit(patch: Partial<StarsState>): void {
  state = { ...state, ...patch };
  listeners.forEach((fn) => fn());
}

function load(force = false): Promise<void> {
  if (inFlight) return inFlight;
  const now = Date.now();
  if (!force && now - lastAttempt < MIN_INTERVAL_MS) return Promise.resolve();
  lastAttempt = now;
  inFlight = (async () => {
    try {
      const res = await fetch(`/api/github-stars${force ? "?refresh=1" : ""}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`github-stars ${res.status}`);
      const data = (await res.json()) as StarSnapshot;
      emit({ ...data, loading: false });
    } catch {
      // 拉不到就保留上一次成功的数据，页面不空白也不报错
      emit({ loading: false });
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  void load();
  if (timer === null) {
    timer = setInterval(() => {
      if (typeof document === "undefined" || document.visibilityState === "visible") {
        void load();
      }
    }, REFRESH_MS);
  }
  return () => {
    listeners.delete(fn);
    if (listeners.size === 0 && timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  };
}

export function useGitHubStars(): StarsState {
  return useSyncExternalStore(subscribe, () => state, () => INITIAL);
}
