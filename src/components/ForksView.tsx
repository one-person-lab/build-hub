"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Playbook } from "@/lib/playbook-types";
import { useMe } from "@/lib/favorites";
import { track } from "@/lib/track";
import "./ForksView.css";

type ForkItem = {
  id: string;
  playbookId: string;
  title: string;
  summary: string;
  deliverable: string;
  stepsLabel: string;
  total: number;
  done: number;
  nextStep: string;
  blockedOn: { index: number; name: string; blocker: string }[];
};

const UI = {
  title: "我的复刻",
  lead: "复刻下来的档案都在这儿。接着上次那一步往下走，不用从头再读一遍。",
  loading: "载入中…",
  empty: "还没有复刻任何档案。",
  emptyLogin: "还没有复刻任何档案。登录后在手册页点复刻，就会存到这里。",
  emptyCta: "能直接复刻的档案在下面，挑一个。",
  go: "去复刻 →",
  catalog: "能复刻的档案",
  progress: (d: number, t: number) => `${d}/${t}`,
  nextLabel: "下次从这一步接上",
  nextAllDone: "这一套你全走完了。",
  blockedLabel: "卡住的是",
  open: "继续 →",
  remove: "删掉这份",
  quota: (used: number, limit: number) => `免费可复刻 ${limit} 份，已用 ${used} 份 · PRO 不限`,
  goPro: "开通 PRO",
} as const;

export default function ForksView({ catalog }: { catalog: (Playbook & { id: string })[] }) {
  const me = useMe();
  const [fetched, setFetched] = useState<{ forks: ForkItem[]; quota: { used: number; limit: number | null } } | null>(null);

  useEffect(() => {
    if (!me?.user) return;
    let live = true;
    fetch("/api/forks")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { forks?: ForkItem[]; quota?: { used: number; limit: number | null } } | null) => {
        if (live && d) setFetched({ forks: d.forks ?? [], quota: d.quota ?? { used: 0, limit: null } });
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [me?.user]);

  function remove(id: string) {
    fetch(`/api/forks/${id}`, { method: "DELETE" })
      .then((r) => {
        if (!r.ok) return;
        setFetched((prev) =>
          prev ? { ...prev, forks: prev.forks.filter((f) => f.id !== id) } : prev
        );
        track("fork_removed", { fork: id });
      })
      .catch(() => {});
  }

  const loggedIn = !!me?.user;
  const list = fetched?.forks ?? [];
  const quota = fetched?.quota ?? null;
  const forked = new Set(list.map((f) => f.playbookId));
  const loading = loggedIn && fetched === null;

  return (
    <main className="fk-main">
      <div className="fk-wrap">
        <header className="fk-head">
          <h1>{UI.title}</h1>
          <p>{UI.lead}</p>
          {loggedIn && quota?.limit ? (
            <p className="fk-quota">
              {UI.quota(quota.used, quota.limit)}{" "}
              <Link href="/account" className="fk-quota-pro">
                {UI.goPro} →
              </Link>
            </p>
          ) : null}
        </header>

        {loading ? (
          <p className="fk-loading">{UI.loading}</p>
        ) : list.length > 0 ? (
          <section className="fk-list" aria-label={UI.title}>
            {list.map((f) => {
              const pct = f.total ? Math.round((f.done / f.total) * 100) : 0;
              const next = f.nextStep;
              return (
                <article className="fk-card" key={f.id}>
                  <div className="fk-card-top">
                    <h2>{f.title}</h2>
                    <span className="fk-num">
                      {UI.progress(f.done, f.total)}
                    </span>
                  </div>
                  {f.deliverable ? <p className="fk-deliverable">{f.deliverable}</p> : null}
                  <div className="fk-bar" aria-hidden="true">
                    <i style={{ width: `${pct}%` }} />
                  </div>
                  <p className="fk-next">
                    <b>{next ? UI.nextLabel : UI.nextAllDone}</b>
                    {next ? <span>{next}</span> : null}
                  </p>
                  {f.blockedOn.length > 0 ? (
                    <ul className="fk-blocked">
                      {f.blockedOn.map((b) => (
                        <li key={b.index}>
                          <b>{UI.blockedLabel}</b>
                          <span>{b.name}</span>
                          {b.blocker}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <div className="fk-card-foot">
                    <Link className="fk-open" href={`/playbooks/${f.playbookId}`}>
                      {UI.open}
                    </Link>
                    <button type="button" className="fk-remove" onClick={() => remove(f.id)}>
                      {UI.remove}
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        ) : (
          <p className="fk-empty">{loggedIn ? UI.empty : UI.emptyLogin}</p>
        )}

        <section className="fk-catalog" aria-label={UI.catalog}>
          <h2 className="fk-catalog-title">{list.length === 0 ? UI.emptyCta : UI.catalog}</h2>
          <div className="fk-grid">
            {catalog.map((p) =>
              forked.has(p.id) ? null : (
                <a className="fk-item" key={p.id} href={`/playbooks/${p.id}`}>
                  <h3>{p.title}</h3>
                  <p>{p.summary}</p>
                  {p.deliverable ? <p className="fk-item-deliver">{p.deliverable}</p> : null}
                  <div className="fk-item-meta">
                    <span>{p.steps.length} {p.stepsLabel ?? "步"}</span>
                    {p.lastVerified ? <span>最后核对 {p.lastVerified}</span> : null}
                  </div>
                  <span className="fk-item-cta">{UI.go}</span>
                </a>
              )
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
