"use client";

import { useEffect, useMemo, useState } from "react";
import { useFlatTerms } from "@/components/CommandPalette";
import ProModal from "@/components/ProModal";
import zhAssets from "@/data/assets.json";
import enAssets from "@/data/en-assets.json";

type Entry = {
  slug: string;
  name: string;
  en: string;
  tagline: string;
  zone: string;
  href: string;
};

type Me = { user: { email: string } | null; pro: boolean };

const STAR_PATH =
  "M23.9986 5L17.8856 17.4776L4 19.4911L14.0589 29.3251L11.6544 43L23.9986 36.4192L36.3454 43L33.9586 29.3251L44 19.4911L30.1913 17.4776L23.9986 5Z";

const UI = {
  zh: {
    title: "我的收藏",
    iconZone: "设计",
    browse: "去概念库看看",
    empty: "还没有收藏",
    emptyHint: "在任意条目右上角点 ★，它就会出现在这里。",
    syncOn: "PRO 会员：换设备自动同步。",
    syncOff: "收藏只存在这台浏览器，换设备或清缓存就会丢。",
    goPro: "开通 PRO 同步",
    unfav: "取消收藏",
    count: "条",
  },
  en: {
    title: "My favorites",
    iconZone: "Design",
    browse: "Browse the index",
    empty: "Nothing saved yet",
    emptyHint: "Tap the ★ on any entry and it lands here.",
    syncOn: "PRO: syncs across your devices.",
    syncOff: "Saved in this browser only — a new device or a cache clear loses it.",
    goPro: "Go PRO to sync",
    unfav: "Remove from favorites",
    count: "saved",
  },
};

export default function FavoritesView({ locale }: { locale: "zh" | "en" }) {
  const U = UI[locale];
  const detailBase = locale === "en" ? "/en/" : "/";
  const flat = useFlatTerms(locale);
  const [slugs, setSlugs] = useState<string[] | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [showPro, setShowPro] = useState(false);

  const index = useMemo(() => {
    const m = new Map<string, Entry>();
    for (const t of flat) {
      if (m.has(t.slug)) continue;
      m.set(t.slug, {
        slug: t.slug,
        name: t.name,
        en: t.en,
        tagline: t.tagline,
        zone: t.zone,
        href: detailBase + t.slug,
      });
    }
    const assets = (locale === "en" ? enAssets : zhAssets) as unknown as {
      categories: { styles: { id: string; name: string; en: string; tagline: string }[] }[];
    };
    for (const c of assets.categories) {
      for (const s of c.styles) {
        if (m.has(s.id)) continue;
        m.set(s.id, {
          slug: s.id,
          name: s.name,
          en: s.en,
          tagline: s.tagline,
          zone: U.iconZone,
          href: `${detailBase}assets/${s.id}`,
        });
      }
    }
    return m;
  }, [flat, detailBase, locale, U.iconZone]);

  useEffect(() => {
    const read = () => {
      try {
        const saved = JSON.parse(localStorage.getItem("vh-favorites") || "[]");
        setSlugs(Array.isArray(saved) ? saved.filter((s) => typeof s === "string") : []);
      } catch {
        setSlugs([]);
      }
    };
    read();
    const onSynced = (e: Event) =>
      setSlugs((e as CustomEvent<string[]>).detail.filter((s) => typeof s === "string"));
    window.addEventListener("vh-favorites-synced", onSynced);
    window.addEventListener("vh-favorites-changed", read);
    return () => {
      window.removeEventListener("vh-favorites-synced", onSynced);
      window.removeEventListener("vh-favorites-changed", read);
    };
  }, []);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d: Me) => setMe(d))
      .catch(() => {});
  }, []);

  // 按收藏先后排，同一分区的挨在一起，长列表才扫得动
  const groups = useMemo(() => {
    if (slugs === null) return [];
    const out: { zone: string; items: Entry[] }[] = [];
    for (const slug of slugs) {
      const e = index.get(slug);
      if (!e) continue;
      const g = out.find((x) => x.zone === e.zone);
      if (g) g.items.push(e);
      else out.push({ zone: e.zone, items: [e] });
    }
    return out;
  }, [slugs, index]);

  const saved = groups.reduce((n, g) => n + g.items.length, 0);

  function remove(slug: string) {
    const next = (slugs ?? []).filter((s) => s !== slug);
    setSlugs(next);
    localStorage.setItem("vh-favorites", JSON.stringify(next));
    window.dispatchEvent(new Event("vh-favorites-changed"));
  }

  return (
    <main className="fav-page">
      <header className="fav-head">
        <h1>{U.title}</h1>
        {slugs !== null && saved > 0 && (
          <span className="fav-count">
            {saved} {U.count}
          </span>
        )}
      </header>

      <p className={`fav-sync${me?.pro ? " is-on" : ""}`}>
        {me?.pro ? U.syncOn : U.syncOff}
        {!me?.pro && (
          <button type="button" className="fav-sync-btn" onClick={() => setShowPro(true)}>
            {U.goPro}
          </button>
        )}
      </p>

      {slugs === null ? null : saved === 0 ? (
        <div className="fav-empty">
          <p className="fav-empty-title">{U.empty}</p>
          <p className="fav-empty-hint">{U.emptyHint}</p>
          <a className="fav-empty-cta" href={locale === "en" ? "/en/topics/frontend" : "/topics/frontend"}>
            {U.browse}
          </a>
        </div>
      ) : (
        groups.map((g) => (
          <section className="fav-section" key={g.zone}>
            <h2 className="fav-zone">{g.zone}</h2>
            <ul className="fav-list">
              {g.items.map((e) => (
                <li className="fav-row" key={e.slug}>
                  <a className="fav-row-main" href={e.href}>
                    <span className="fav-row-name">
                      {e.name}
                      {e.en ? <span className="fav-row-en">{e.en}</span> : null}
                    </span>
                    {e.tagline && <span className="fav-row-tagline">{e.tagline}</span>}
                  </a>
                  <button
                    type="button"
                    className="favorite-button is-saved"
                    aria-label={U.unfav}
                    aria-pressed
                    title={U.unfav}
                    onClick={() => remove(e.slug)}
                  >
                    <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
                      <path d={STAR_PATH} />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}

      {showPro && <ProModal locale={locale} onClose={() => setShowPro(false)} />}
    </main>
  );
}
