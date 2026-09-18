"use client";

import { useEffect, useMemo, useState } from "react";
import skillsData from "@/data/skills.json";
import enSkillsData from "@/data/en-skills.json";
import SkillAvatar from "./SkillAvatar";
import "./SkillLibraryView.css";

type Skill = {
  id: string;
  name: string;
  tagline: string;
  desc?: string;
  author?: string;
  repo?: string;
  official?: string;
  tags?: string[];
};

type Category = { key: string; label: string; skills: Skill[] };

type SkillLibrary = { title: string; subtitle: string; categories: Category[] };

const ZH = skillsData as unknown as SkillLibrary;
const EN = enSkillsData as unknown as SkillLibrary;

const UI_TEXT = {
  zh: {
    all: "全部",
    count: "个",
    repo: "仓库",
    official: "官网",
    detail: "查看详情",
    empty: "这个分类还在收集中，敬请期待。",
  },
  en: {
    all: "All",
    count: "",
    repo: "Repo",
    official: "Site",
    detail: "View details",
    empty: "Still collecting for this category — stay tuned.",
  },
} as const;

export default function SkillLibraryView({ locale = "zh" }: { locale?: "zh" | "en" }) {
  const lib = locale === "en" ? EN : ZH;
  const T = UI_TEXT[locale];
  const total = useMemo(
    () => lib.categories.reduce((n, c) => n + c.skills.length, 0),
    [lib]
  );
  const [active, setActive] = useState<string>("all");

  // 支持从详情页「相关分类」带 ?cat=KEY 进来时，自动选中对应分类
  useEffect(() => {
    const cat = new URLSearchParams(window.location.search).get("cat");
    if (cat && (cat === "all" || lib.categories.some((c) => c.key === cat))) {
      setActive(cat);
    }
  }, [lib]);

  const selectCat = (key: string) => {
    setActive(key);
    const url = new URL(window.location.href);
    if (key === "all") url.searchParams.delete("cat");
    else url.searchParams.set("cat", key);
    window.history.replaceState(null, "", url.pathname + url.search);
  };

  const visible =
    active === "all"
      ? lib.categories
      : lib.categories.filter((c) => c.key === active);

  const detailBase = locale === "en" ? "/en/skills/" : "/skills/";

  return (
    <main>
      <div className="catalog-page">
        <div className="grid-wrap">
          <header className="skill-lib-head">
            <h1>{lib.title}</h1>
            <p>{lib.subtitle}</p>
          </header>

          <section className="skill-lib-finder" aria-label="筛选分类">
            <div className="catalog-filter-list">
              <button
                type="button"
                className="catalog-filter-chip skill-lib-chip"
                aria-pressed={active === "all"}
                onClick={() => selectCat("all")}
              >
                {T.all}
                <span>{total}</span>
              </button>
              {lib.categories.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  className="catalog-filter-chip skill-lib-chip"
                  aria-pressed={active === c.key}
                  onClick={() => selectCat(c.key)}
                >
                  {c.label}
                  <span>{c.skills.length}</span>
                </button>
              ))}
            </div>
          </section>

          {visible.map((c) => (
            <section className="skill-lib-cat" key={c.key}>
              <div className="cat-title">
                {c.label}
                <span>
                  {c.skills.length} {T.count}
                </span>
              </div>
              {c.skills.length === 0 ? (
                <p className="skill-lib-empty">{T.empty}</p>
              ) : (
                <div className="grid">
                  {c.skills.map((s) => (
                    <article className="skill-card-wrap" key={s.id}>
                      <a
                        className="card skill-card"
                        href={`${detailBase}${s.id}`}
                        aria-label={s.name}
                      >
                        <div className="card-head">
                          <SkillAvatar
                            name={s.name}
                            official={s.official}
                            repo={s.repo}
                            className="skill-card-avatar"
                          />
                          <h3 className="skill-card-title">{s.name}</h3>
                          <span className="skill-card-arrow" aria-hidden="true">
                            →
                          </span>
                        </div>
                        <div className="card-tagline card-quote">{s.tagline}</div>
                        {s.tags && s.tags.length > 0 ? (
                          <ul className="skill-card-tags">
                            {s.tags.map((tg) => (
                              <li key={tg}>{tg}</li>
                            ))}
                          </ul>
                        ) : null}
                        <span className="skill-card-more">
                          {T.detail} →
                        </span>
                      </a>
                    </article>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
