"use client";

import { useEffect, useMemo, useState } from "react";
import { useFlatTerms } from "@/components/CommandPalette";
import ExportButton from "@/components/ExportButton";
import ProModal from "@/components/ProModal";
import { requireLogin } from "@/lib/auth-modal";
import {
  FREE_FAVORITE_LIMIT,
  useFavoriteSlugs,
  useMe,
  writeFavorites,
} from "@/lib/favorites";
import zhAssets from "@/data/assets.json";
import enAssets from "@/data/en-assets.json";
import zhSkills from "@/data/skills.json";
import enSkills from "@/data/en-skills.json";
import zhPrompts from "@/data/prompts.json";
import enPrompts from "@/data/en-prompts.json";

type Entry = {
  slug: string;
  name: string;
  en: string;
  tagline: string;
  zone: string;
  href: string;
};

type Collection = { id: string; name: string; slugs: string[] };

export type PlanCard = { key: string; name: string; money: string; days: number | "lifetime" };

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
    goPro: "开通 PRO",
    unfav: "取消收藏",
    count: "条",
    convTitle: "把要用的东西，收进自己的库",
    convBody: "收藏要先登录。登录后收进来的东西存进你的账号，换设备打开还在。",
    convCta: "登录开始收藏",
    freeName: "免费",
    proName: "PRO",
    perSave: "收藏上限 20 条",
    perRead: "全部条目正文免费看",
    noLocal: "只存这台浏览器",
    noSync: "换设备不同步",
    proUnlimited: "无限收藏",
    proSync: "跨设备自动同步",
    proCollections: "多个收藏夹",
    proNotes: "给条目写备注",
    proExport: "一键导出 Markdown",
    usage: "收藏",
    usageUnit: "条",
    usageCta: "PRO 无限收藏",
    capNote: "免费收藏已到 20 条上限，开通 PRO 可以继续加。",
    freeHook: "PRO 还能：多个收藏夹、给条目写备注、一键导出 Markdown。",
    newCollection: "新建收藏夹",
    collectionName: "收藏夹名字",
    create: "创建",
    cancel: "取消",
    all: "全部收藏",
    emptyCollection: "这个收藏夹还是空的",
    emptyCollectionHint: "回到「全部收藏」，点条目右侧的文件夹图标，把它加进来。",
    backAll: "回到全部收藏",
    deleteCollection: "删除这个收藏夹",
    confirmDelete: "确认删除",
    exportAll: "导出为 Markdown",
    exportPack: "导出完整资产包",
    exportCollection: "导出这个收藏夹",
    note: "写备注",
    addTo: "加入收藏夹",
    save: "保存",
    saving: "保存中…",
    notePh: "写给自己看的：为什么存它、准备怎么用。",
    noteFail: "保存失败，重试",
    createFail: "创建失败，再试一次",
    noCollections: "还没有收藏夹，先在上面建一个。",
  },
  en: {
    title: "My favorites",
    iconZone: "Design",
    browse: "Browse the index",
    empty: "Nothing saved yet",
    emptyHint: "Tap the ★ on any entry and it lands here.",
    syncOn: "PRO: syncs across your devices.",
    goPro: "Go PRO",
    unfav: "Remove from favorites",
    count: "saved",
    convTitle: "Keep what you need in your own library",
    convBody: "Sign in before you save. Anything you collect lives on your account and is there when you open another device.",
    convCta: "Sign in to start saving",
    freeName: "Free",
    proName: "PRO",
    perSave: "Up to 20 saves",
    perRead: "Every entry free to read",
    noLocal: "This browser only",
    noSync: "No sync across devices",
    proUnlimited: "Unlimited saves",
    proSync: "Syncs across devices",
    proCollections: "Multiple collections",
    proNotes: "Notes on any entry",
    proExport: "One-click Markdown export",
    usage: "Saves",
    usageUnit: "",
    usageCta: "Unlimited with PRO",
    capNote: "You have used all 20 free saves — go PRO to keep adding.",
    freeHook: "PRO also adds collections, notes and one-click Markdown export.",
    newCollection: "New collection",
    collectionName: "Collection name",
    create: "Create",
    cancel: "Cancel",
    all: "All favorites",
    emptyCollection: "This collection is empty",
    emptyCollectionHint: "Go back to All favorites and tap the folder icon on an entry to add it.",
    backAll: "Back to all favorites",
    deleteCollection: "Delete this collection",
    confirmDelete: "Confirm delete",
    exportAll: "Export as Markdown",
    exportPack: "Export full asset pack",
    exportCollection: "Export this collection",
    note: "Add a note",
    addTo: "Add to collection",
    save: "Save",
    saving: "Saving…",
    notePh: "Notes to yourself: why you saved it, how you plan to use it.",
    noteFail: "Save failed, retry",
    createFail: "Could not create, try again",
    noCollections: "No collections yet. Create one above.",
  },
};

function priceLabel(plans: PlanCard[], locale: "zh" | "en"): string {
  const fmt = (n: number) => (Number.isInteger(n) ? `${n}` : n.toFixed(1));
  const m = plans.find((p) => p.key === "monthly");
  const y = plans.find((p) => p.key === "yearly");
  const l = plans.find((p) => p.key === "lifetime");
  const parts: string[] = [];
  if (m) parts.push(locale === "en" ? `${fmt(+m.money)}/mo` : `月卡 ¥${fmt(+m.money)}`);
  if (y) parts.push(locale === "en" ? `${fmt(+y.money)}/yr` : `年卡 ¥${fmt(+y.money)}`);
  if (l) parts.push(locale === "en" ? `${fmt(+l.money)} once` : `终身 ¥${fmt(+l.money)}`);
  return parts.join(" / ");
}

/** slug → 条目；收藏列表和账号页预览共用同一份解析，两边显示的名字才不会分叉 */
export function useFavoriteIndex(locale: "zh" | "en") {
  const detailBase = locale === "en" ? "/en/" : "/";
  const flat = useFlatTerms(locale);
  return useMemo(() => {
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
          zone: UI[locale].iconZone,
          href: `${detailBase}assets/${s.id}`,
        });
      }
    }
    const skills = (locale === "en" ? enSkills : zhSkills) as unknown as {
      categories: { label: string; skills: { id: string; name: string; tagline?: string }[] }[];
    };
    for (const c of skills.categories) {
      for (const s of c.skills) {
        if (m.has(s.id)) continue;
        m.set(s.id, {
          slug: s.id,
          name: s.name,
          en: "",
          tagline: s.tagline ?? "",
          zone: c.label,
          href: `${detailBase}skills/${s.id}`,
        });
      }
    }
    const prompts = (locale === "en" ? enPrompts : zhPrompts) as unknown as {
      categories: { label: string; prompts: { id: string; name: string; tagline?: string }[] }[];
    };
    for (const c of prompts.categories) {
      for (const p of c.prompts) {
        if (m.has(p.id)) continue;
        m.set(p.id, {
          slug: p.id,
          name: p.name,
          en: "",
          tagline: p.tagline ?? "",
          zone: c.label,
          href: `${detailBase}prompts/${p.id}`,
        });
      }
    }
    return m;
  }, [flat, detailBase, locale]);
}

function NoteIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 20h4l10-10a2.4 2.4 0 0 0-3.4-3.4L4.6 16.6 4 20Z" />
      <path d="m13.5 7.5 3 3" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3.5 7.5V18a1.5 1.5 0 0 0 1.5 1.5h14A1.5 1.5 0 0 0 20.5 18V8.8a1.5 1.5 0 0 0-1.5-1.5h-6L11 5H5A1.5 1.5 0 0 0 3.5 6.5Z" />
      <path d="M12 11.5v4M10 13.5h4" />
    </svg>
  );
}

export default function FavoritesView({
  locale,
  plans = [],
}: {
  locale: "zh" | "en";
  plans?: PlanCard[];
}) {
  const U = UI[locale];
  const index = useFavoriteIndex(locale);
  const slugs = useFavoriteSlugs();
  const me = useMe();
  const pro = !!me?.pro;

  const [showPro, setShowPro] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [active, setActive] = useState("all");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [createFail, setCreateFail] = useState(false);
  const [confirmDel, setConfirmDel] = useState("");
  const [noteOpen, setNoteOpen] = useState("");
  const [draft, setDraft] = useState("");
  const [savingNote, setSavingNote] = useState("");
  const [noteFail, setNoteFail] = useState(false);
  const [collectOpen, setCollectOpen] = useState("");

  useEffect(() => {
    if (!pro) {
      setCollections([]);
      setNotes({});
      setActive("all");
      return;
    }
    let cancelled = false;
    Promise.all([
      fetch("/api/collections")
        .then((r) => (r.ok ? r.json() : { collections: [] }))
        .catch(() => ({ collections: [] })),
      fetch("/api/notes")
        .then((r) => (r.ok ? r.json() : { notes: {} }))
        .catch(() => ({ notes: {} })),
    ]).then(([c, n]) => {
      if (cancelled) return;
      setCollections(Array.isArray(c?.collections) ? c.collections : []);
      setNotes(n?.notes && typeof n.notes === "object" ? n.notes : {});
    });
    return () => {
      cancelled = true;
    };
  }, [pro]);

  const visibleSlugs = useMemo(() => {
    if (active === "all") return slugs;
    return collections.find((c) => c.id === active)?.slugs ?? [];
  }, [active, collections, slugs]);

  // 按收藏先后排，同一分区的挨在一起，长列表才扫得动
  const groups = useMemo(() => {
    const out: { zone: string; items: Entry[] }[] = [];
    for (const slug of visibleSlugs) {
      const e = index.get(slug);
      if (!e) continue;
      const g = out.find((x) => x.zone === e.zone);
      if (g) g.items.push(e);
      else out.push({ zone: e.zone, items: [e] });
    }
    return out;
  }, [visibleSlugs, index]);

  const saved = groups.reduce((n, g) => n + g.items.length, 0);
  const totalSaved = slugs.length;
  const activeCollection = collections.find((c) => c.id === active) ?? null;

  function remove(slug: string) {
    writeFavorites(slugs.filter((s) => s !== slug));
    if (noteOpen === slug) setNoteOpen("");
    if (collectOpen === slug) setCollectOpen("");
    // 取消收藏同时退出所有收藏夹，避免「全部收藏」里没有、收藏夹里还挂着
    const affected = collections.filter((c) => c.slugs.includes(slug));
    if (!affected.length) return;
    setCollections((prev) =>
      prev.map((c) =>
        c.slugs.includes(slug) ? { ...c, slugs: c.slugs.filter((s) => s !== slug) } : c
      )
    );
    for (const c of affected) {
      fetch("/api/collections", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: c.id,
          name: c.name,
          slugs: c.slugs.filter((s) => s !== slug),
        }),
      }).catch(() => {});
    }
  }

  async function createCollection() {
    const name = newName.trim();
    if (!name) return;
    setCreateFail(false);
    const r = await fetch("/api/collections", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name }),
    }).catch(() => null);
    if (!r || !r.ok) {
      setCreateFail(true);
      return;
    }
    const c = await r.json();
    setCollections((prev) => [...prev, { id: c.id, name: c.name, slugs: [] }]);
    setNewName("");
    setCreating(false);
    setActive(c.id);
  }

  async function deleteCollection(id: string) {
    const r = await fetch(`/api/collections?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    }).catch(() => null);
    if (!r || !r.ok) return;
    setCollections((prev) => prev.filter((c) => c.id !== id));
    setActive("all");
    setConfirmDel("");
  }

  async function toggleInCollection(c: Collection, slug: string) {
    const next = c.slugs.includes(slug)
      ? c.slugs.filter((s) => s !== slug)
      : [...c.slugs, slug];
    setCollections((prev) => prev.map((x) => (x.id === c.id ? { ...x, slugs: next } : x)));
    await fetch("/api/collections", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: c.id, slugs: next }),
    }).catch(() => {});
  }

  function openNote(slug: string) {
    setNoteOpen(slug);
    setDraft(notes[slug] ?? "");
    setNoteFail(false);
    setCollectOpen("");
  }

  async function saveNote(slug: string) {
    const body = draft.trim();
    setSavingNote(slug);
    setNoteFail(false);
    const r = await fetch("/api/notes", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug, body }),
    }).catch(() => null);
    setSavingNote("");
    if (!r || !r.ok) {
      setNoteFail(true);
      return;
    }
    setNotes((prev) => {
      const next = { ...prev };
      if (body) next[slug] = body;
      else delete next[slug];
      return next;
    });
    setNoteOpen("");
  }

  /** 收藏是登录后的动作：未登录一律先看登录引导，本地遗留的收藏等登录后再显示 */
  const signedOut = me !== null && !me.user;
  const atCap = !pro && totalSaved >= FREE_FAVORITE_LIMIT;

  return (
    <main className="fav-page">
      <header className="fav-head">
        <h1>{U.title}</h1>
        {!signedOut && totalSaved > 0 && (
          <span className="fav-count">
            {saved} {U.count}
          </span>
        )}
        <div className="fav-head-actions">
          {pro && (
            <button
              type="button"
              className="rd-btn-ghost fav-head-btn"
              onClick={() => {
                setCreating((v) => !v);
                setCreateFail(false);
              }}
            >
              {U.newCollection}
            </button>
          )}
          {!signedOut && totalSaved > 0 && (
            <ExportButton
              locale={locale}
              kind={active === "all" ? "favorites" : "collection"}
              id={active === "all" ? undefined : active}
              pro={pro}
              onNeedPro={() => setShowPro(true)}
              className="rd-btn-ghost fav-head-btn"
              label={active === "all" ? U.exportAll : U.exportCollection}
            />
          )}
          {!!me?.user && (
            <ExportButton
              locale={locale}
              kind="pack"
              pro={pro}
              onNeedPro={() => setShowPro(true)}
              className="rd-btn-ghost fav-head-btn"
              label={U.exportPack}
            />
          )}
        </div>
      </header>

      {signedOut ? (
        <div className="fav-conv">
          <span className="fav-conv-glyph" aria-hidden>
            <svg viewBox="0 0 48 48">
              <path d={STAR_PATH} />
            </svg>
          </span>
          <h2>{U.convTitle}</h2>
          <p>{U.convBody}</p>
          <button type="button" className="fav-conv-cta" onClick={() => requireLogin({ reason: "favorite" })}>
            {U.convCta}
          </button>
          <div className="fav-plans">
            <div className="fav-plan">
              <h3>{U.freeName}</h3>
              <p className="fav-plan-price">¥0</p>
              <ul>
                <li>✓ {U.perSave}</li>
                <li>✓ {U.perRead}</li>
                <li className="is-no">✗ {U.noLocal}</li>
                <li className="is-no">✗ {U.noSync}</li>
              </ul>
            </div>
            <div className="fav-plan is-pro">
              <h3>
                {U.proName}
                <button type="button" onClick={() => setShowPro(true)}>
                  {U.goPro}
                </button>
              </h3>
              <p className="fav-plan-price">{priceLabel(plans, locale)}</p>
              <ul>
                <li>✓ {U.proUnlimited}</li>
                <li>✓ {U.proSync}</li>
                <li>✓ {U.proCollections}</li>
                <li>✓ {U.proNotes}</li>
                <li>✓ {U.proExport}</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <>
          {me && !pro && (
            <>
              <div className="fav-usage">
                <span className="fav-usage-label">
                  {U.usage}
                  <b>{totalSaved}</b>
                  {U.usageUnit && <span> {U.usageUnit}</span>}
                  <span className="fav-usage-cap"> / {FREE_FAVORITE_LIMIT}</span>
                </span>
                <button type="button" className="fav-usage-cta" onClick={() => setShowPro(true)}>
                  {U.usageCta} →
                </button>
                <span className="fav-usage-bar" aria-hidden>
                  <i style={{ width: `${Math.min(100, (totalSaved / FREE_FAVORITE_LIMIT) * 100)}%` }} />
                </span>
              </div>
              <p className="fav-pro-hint">
                {U.freeHook}
                <button type="button" onClick={() => setShowPro(true)}>
                  {U.goPro}
                </button>
              </p>
            </>
          )}
          {pro && <p className="fav-sync is-on">{U.syncOn}</p>}
          {atCap && <p className="fav-cap-note">{U.capNote}</p>}

          {pro && (
            <nav className="fav-tabs" aria-label={U.all}>
              <button
                type="button"
                className={`fav-tab${active === "all" ? " is-active" : ""}`}
                onClick={() => setActive("all")}
              >
                {U.all}
                <span>{totalSaved}</span>
              </button>
              {collections.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`fav-tab${active === c.id ? " is-active" : ""}`}
                  onClick={() => setActive(c.id)}
                >
                  {c.name}
                  <span>{c.slugs.length}</span>
                </button>
              ))}
            </nav>
          )}

          {creating && (
            <form
              className="fav-create"
              onSubmit={(e) => {
                e.preventDefault();
                createCollection();
              }}
            >
              <input
                autoFocus
                value={newName}
                maxLength={40}
                placeholder={U.collectionName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <button type="submit" className="rd-btn" disabled={!newName.trim()}>
                {U.create}
              </button>
              <button
                type="button"
                className="rd-btn-ghost"
                onClick={() => {
                  setCreating(false);
                  setNewName("");
                  setCreateFail(false);
                }}
              >
                {U.cancel}
              </button>
              {createFail && <span className="fav-form-err">{U.createFail}</span>}
            </form>
          )}

          {activeCollection && active !== "all" && (
            <p className="fav-col-actions">
              {confirmDel === active ? (
                <button type="button" className="is-danger" onClick={() => deleteCollection(active)}>
                  {U.confirmDelete}
                </button>
              ) : (
                <button type="button" onClick={() => setConfirmDel(active)}>
                  {U.deleteCollection}
                </button>
              )}
            </p>
          )}

          {totalSaved === 0 ? (
            <div className="fav-empty">
              <p className="fav-empty-title">{U.empty}</p>
              <p className="fav-empty-hint">{U.emptyHint}</p>
              <a
                className="fav-empty-cta"
                href={locale === "en" ? "/en/topics/frontend" : "/topics/frontend"}
              >
                {U.browse}
              </a>
            </div>
          ) : saved === 0 ? (
            <div className="fav-empty">
              <p className="fav-empty-title">{U.emptyCollection}</p>
              <p className="fav-empty-hint">{U.emptyCollectionHint}</p>
              <button type="button" className="fav-empty-cta" onClick={() => setActive("all")}>
                {U.backAll}
              </button>
            </div>
          ) : (
            groups.map((g) => (
              <section className="fav-section" key={g.zone}>
                <h2 className="fav-zone">{g.zone}</h2>
                <ul className="fav-list">
                  {g.items.map((e) => (
                    <li className="fav-item" key={e.slug}>
                      <div className="fav-row">
                        <a className="fav-row-main" href={e.href}>
                          <span className="fav-row-name">
                            {e.name}
                            {e.en ? <span className="fav-row-en">{e.en}</span> : null}
                          </span>
                          {e.tagline && <span className="fav-row-tagline">{e.tagline}</span>}
                        </a>
                        <div className="fav-row-actions">
                          {pro && (
                            <button
                              type="button"
                              className={`fav-icon-btn${notes[e.slug] ? " is-on" : ""}`}
                              title={U.note}
                              aria-label={U.note}
                              onClick={() =>
                                noteOpen === e.slug ? setNoteOpen("") : openNote(e.slug)
                              }
                            >
                              <NoteIcon />
                            </button>
                          )}
                          {pro && (
                            <button
                              type="button"
                              className="fav-icon-btn"
                              title={U.addTo}
                              aria-label={U.addTo}
                              aria-expanded={collectOpen === e.slug}
                              onClick={() => setCollectOpen((v) => (v === e.slug ? "" : e.slug))}
                            >
                              <FolderIcon />
                            </button>
                          )}
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
                        </div>
                      </div>

                      {notes[e.slug] && noteOpen !== e.slug && (
                        <p className="fav-note">{notes[e.slug]}</p>
                      )}

                      {noteOpen === e.slug && (
                        <div className="fav-note-edit">
                          <textarea
                            autoFocus
                            rows={3}
                            maxLength={2000}
                            value={draft}
                            placeholder={U.notePh}
                            onChange={(ev) => setDraft(ev.target.value)}
                          />
                          <div className="fav-note-actions">
                            <span>{draft.length}/2000</span>
                            {noteFail && <em>{U.noteFail}</em>}
                            <button
                              type="button"
                              className="rd-btn"
                              disabled={savingNote === e.slug}
                              onClick={() => saveNote(e.slug)}
                            >
                              {savingNote === e.slug ? U.saving : U.save}
                            </button>
                            <button
                              type="button"
                              className="rd-btn-ghost"
                              onClick={() => setNoteOpen("")}
                            >
                              {U.cancel}
                            </button>
                          </div>
                        </div>
                      )}

                      {collectOpen === e.slug && (
                        <div className="fav-pop">
                          {collections.length === 0 ? (
                            <p className="fav-pop-empty">{U.noCollections}</p>
                          ) : (
                            collections.map((c) => {
                              const inIt = c.slugs.includes(e.slug);
                              return (
                                <button
                                  key={c.id}
                                  type="button"
                                  className="fav-pop-item"
                                  onClick={() => toggleInCollection(c, e.slug)}
                                >
                                  <span className="check">{inIt ? "✓" : ""}</span>
                                  {c.name}
                                </button>
                              );
                            })
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </>
      )}

      {showPro && <ProModal locale={locale} onClose={() => setShowPro(false)} />}
    </main>
  );
}
