"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ARCHITECTURE_PLATFORMS, DIAGRAM_CATEGORIES } from "@/data/architecture-diagrams";
import type { ArchitecturePlatform } from "@/lib/architecture-types";
import IcePanelDiagram, { DiagramStatic } from "./IcePanelDiagram";
import "./ArchitectureView.css";

/** 与图鉴同款 scroll-spy：哪个分区进入视口，左侧目录高亮哪条 */
function useSectionSpy(ids: string[]) {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (sections.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const tops = entries.filter((e) => e.isIntersecting);
        if (tops.length === 0) return;
        const topmost = tops.reduce((a, b) =>
          a.boundingClientRect.top < b.boundingClientRect.top ? a : b
        );
        setActive(topmost.target.id);
      },
      { rootMargin: "-150px 0px -55% 0px", threshold: 0 }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [ids]);
  return active;
}

const INDEX_SECTION_IDS = ["cat-arc-platforms"];

/** 平台列表页：外壳与动效图鉴一致（筛选条 + 左侧目录 + 卡片网格） */
export function ArchitectureIndex() {
  const active = useSectionSpy(INDEX_SECTION_IDS);

  // 与图鉴同款：筛选条贴上导航栏时加毛玻璃底
  useEffect(() => {
    const finder = document.querySelector<HTMLElement>(".catalog-finder");
    if (!finder) return;
    const navHeight = () => {
      const v = parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue("--site-nav-height")
      );
      return Number.isFinite(v) && v > 0 ? v : 56;
    };
    let raf = 0;
    const update = () => {
      raf = 0;
      finder.classList.toggle("is-stuck", finder.getBoundingClientRect().top <= navHeight() + 1);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      finder.classList.remove("is-stuck");
    };
  }, []);

  return (
    <main>
      <div className="catalog-page catalog-directory-page">
        <div className="catalog-layout catalog-directory-layout">
          <span className="catalog-finder-sentinel" aria-hidden="true" />
          <section className="catalog-finder" aria-label="筛选平台">
            <div className="catalog-finder-row">
              <div className="catalog-filter-list">
                <button type="button" className="catalog-filter-chip" aria-pressed="true">
                  全部<span>{ARCHITECTURE_PLATFORMS.length}</span>
                </button>
              </div>
            </div>
          </section>
          <aside className="cat-live-toc" aria-label="平台目录">
            <nav className="cat-live-toc-nav">
              <button
                type="button"
                className={
                  "cat-live-toc-item" + (active === "cat-arc-platforms" ? " is-active" : "")
                }
                onClick={() =>
                  document
                    .getElementById("cat-arc-platforms")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
              >
                <span>平台架构</span>
                <em>{ARCHITECTURE_PLATFORMS.length}</em>
              </button>
            </nav>
          </aside>
          <div className="grid-wrap">
            <section className="cat-section" id="cat-arc-platforms">
              <h2 className="cat-title">
                平台架构
                <span>{ARCHITECTURE_PLATFORMS.length} 个平台</span>
              </h2>
              <div className="grid">
                {ARCHITECTURE_PLATFORMS.map((p) => {
                  const cover =
                    p.diagrams.find((d) => d.id === "system") ?? p.diagrams[0];
                  return (
                    <Link
                      key={p.id}
                      href={`/architecture/${p.id}`}
                      className="card arc-card-link"
                      data-id={p.id}
                    >
                      <div className="card-thumb arc-thumb">
                        <DiagramStatic spec={cover} />
                      </div>
                      <div className="card-head">
                        <span className="card-title-group">
                          <h3>
                            {p.name}
                            <span>{p.en}</span>
                          </h3>
                        </span>
                      </div>
                      <div className="card-tagline card-quote">{p.tagline}</div>
                    </Link>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

/** 架构图页：一个平台的整套图按序展示，左侧目录定位，无筛选条 */
export function PlatformDetail({ platform }: { platform: ArchitecturePlatform }) {
  const ids = useMemo(
    () => platform.diagrams.map((d) => `dia-${d.id}`),
    [platform]
  );
  const active = useSectionSpy(ids);

  return (
    <main>
      <div className="catalog-page catalog-directory-page">
        <div className="catalog-layout catalog-directory-layout">
          <aside className="cat-live-toc" aria-label="图目录">
            <nav className="cat-live-toc-nav">
              {DIAGRAM_CATEGORIES.map((c) => {
                const group = platform.diagrams.filter((d) => d.category === c.key);
                if (group.length === 0) return null;
                return (
                  <div className="arc-toc-group" key={c.key}>
                    <p className="arc-toc-cat">{c.label}</p>
                    {group.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        className={
                          "cat-live-toc-item" + (active === `dia-${d.id}` ? " is-active" : "")
                        }
                        onClick={() =>
                          document
                            .getElementById(`dia-${d.id}`)
                            ?.scrollIntoView({ behavior: "smooth", block: "start" })
                        }
                      >
                        <span>{d.title}</span>
                      </button>
                    ))}
                  </div>
                );
              })}
            </nav>
          </aside>
          <div className="grid-wrap arc-grid-wrap">
            <header className="catalog-heading arc-heading">
              <p className="arc-crumb">
                <Link
                  href="/architecture"
                  className="detail-back-button"
                  aria-label="返回平台列表"
                  title="返回平台列表"
                >
                  <svg className="ui-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M19 12H5m6-6-6 6 6 6" />
                  </svg>
                </Link>
                <Link href="/architecture">架构</Link>
                <span aria-hidden> / </span>
                {platform.name}
              </p>
              <h1>{platform.name}</h1>
              <p className="cat-page-intro">{platform.tagline}</p>
            </header>
            {platform.diagrams.map((d) => (
              <section className="cat-section arc-diagram-section" id={`dia-${d.id}`} key={d.id}>
                <header className="arc-diagram-head">
                  <h2 className="cat-title">
                    {d.title}
                    <span>{d.en}</span>
                  </h2>
                  <p className="cat-intro">{d.desc}</p>
                </header>
                <IcePanelDiagram spec={d} />
              </section>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}