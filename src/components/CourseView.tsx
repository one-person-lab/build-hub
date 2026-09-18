"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import coursesData from "@/data/courses.json";
import termsData from "@/data/terms.json";
import TermBody, { type Term } from "./TermBody";

type ListPage = { title: string; kind: "list"; mainHtml: string };
type ReaderChapter = { title: string; kind: "reader"; readerHtml: string };
type CoursesData = {
  index: ListPage;
  "product-website": ListPage;
  "git-workflow": ListPage;
  chapters: Record<string, ReaderChapter>;
};

const COURSES = coursesData as unknown as CoursesData;
const TERMS = termsData as unknown as Term[];
const TERM_BY_SLUG = new Map(TERMS.map((t) => [t.slug, t]));

const MIN_SHARE = 29;
const MAX_SHARE = 77;

/** /courses 与 /courses/{course} 这类纯目录页：整段 HTML 直出 */
export function CourseListMain({ pageKey }: { pageKey: string }) {
  useEffect(() => {
    const shell = document.querySelector(".site-shell");
    if (!shell) return;
    shell.classList.add("is-course-route");
    return () => shell.classList.remove("is-course-route");
  }, []);
  const page = (COURSES as Record<string, unknown>)[pageKey] as ListPage | undefined;
  if (!page) return null;
  return (
    <main
      className="course-shell-main"
      dangerouslySetInnerHTML={{ __html: page.mainHtml }}
    />
  );
}

/** /courses/{course}/{chapter}：正文 + 可展开的术语面板 + 可拖拽分隔条 */
export default function CourseReaderView({ chapterKey }: { chapterKey: string }) {
  const chapter = COURSES.chapters[chapterKey];
  const [termId, setTermId] = useState<string | null>(null);
  const [share, setShare] = useState(50);
  const [resizing, setResizing] = useState(false);
  const paneRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const shell = document.querySelector(".site-shell");
    if (!shell) return;
    shell.classList.add("is-course-route", "is-course-reader");
    return () => shell.classList.remove("is-course-route", "is-course-reader");
  }, []);

  // 正文里的术语引用是静态 HTML，用事件委托接管点击
  const chapterHtml = chapter?.readerHtml;
  useEffect(() => {
    const el = paneRef.current;
    if (!el) return;
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const btn = target.closest("button.course-term-ref");
      if (!btn) return;
      const id = btn.getAttribute("data-term-id");
      if (!id) return;
      e.preventDefault();
      setTermId(id);
    }
    el.addEventListener("click", onClick);
    return () => el.removeEventListener("click", onClick);
  }, [chapterHtml]);

  // aria-expanded 与实际面板状态同步
  useEffect(() => {
    const el = paneRef.current;
    if (!el) return;
    el.querySelectorAll<HTMLButtonElement>("button.course-term-ref").forEach((b) => {
      b.setAttribute(
        "aria-expanded",
        String(b.getAttribute("data-term-id") === termId)
      );
    });
  }, [termId, chapterHtml]);

  // 拖拽调整正文 / 面板宽度
  useEffect(() => {
    if (!resizing) return;
    function onMove(e: MouseEvent) {
      const ws = workspaceRef.current;
      if (!ws) return;
      const rect = ws.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setShare(Math.min(MAX_SHARE, Math.max(MIN_SHARE, pct)));
    }
    function onUp() {
      setResizing(false);
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [resizing]);

  const term = useMemo(
    () => (termId ? TERM_BY_SLUG.get(termId) ?? null : null),
    [termId]
  );

  const nudge = useCallback((delta: number) => {
    setShare((s) => Math.min(MAX_SHARE, Math.max(MIN_SHARE, s + delta)));
  }, []);

  if (!chapter) return null;

  return (
    <main className="course-shell-main">
      <div className="course-app course-reader-app">
        <div
          className={
            "course-workspace" +
            (term ? " has-term" : "") +
            (resizing ? " is-resizing" : "")
          }
          ref={workspaceRef}
          style={{ ["--course-reader-main-share" as string]: share + "%" }}
        >
          <div
            className="course-reader-pane"
            ref={paneRef}
            dangerouslySetInnerHTML={{ __html: chapter.readerHtml }}
          />
          {term ? (
            <>
              <div
                className="course-pane-splitter"
                role="separator"
                aria-orientation="vertical"
                aria-controls="course-term-panel"
                aria-label="调整正文和概念面板宽度"
                aria-valuemin={MIN_SHARE}
                aria-valuemax={MAX_SHARE}
                aria-valuenow={Math.round(share)}
                aria-valuetext={`正文宽度 ${Math.round(share)}%`}
                tabIndex={0}
                title="拖动调整左右宽度；方向键可微调"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setResizing(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowLeft") {
                    e.preventDefault();
                    nudge(-2);
                  } else if (e.key === "ArrowRight") {
                    e.preventDefault();
                    nudge(2);
                  }
                }}
              />
              <div id="course-term-panel">
                <aside
                  className="course-term-panel"
                  aria-label={`${term.name}概念详情`}
                  role="complementary"
                >
                  <div className="course-term-toolbar">
                    <div>
                      <strong>{term.name}</strong>
                    </div>
                    <div className="course-term-actions">
                      <a href={"/" + term.slug}>完整概念页 ↗</a>
                      <button
                        type="button"
                        aria-label="关闭概念详情"
                        onClick={() => setTermId(null)}
                      >
                        <i className="ti ti-x" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  <div className="course-term-scroll">
                    <div className="course-embedded-term">
                      <div className="detail is-embedded">
                        <TermBody term={term} withDemo={false} />
                      </div>
                    </div>
                  </div>
                </aside>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </main>
  );
}
