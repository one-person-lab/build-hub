"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { writeClipboard } from "./clipboard";
import type { Guide, GuideBlock } from "@/lib/playbook-types";
import "./PlaybookView.css";
import "./GuideView.css";

const UI = {
  kind: "实践指南",
  verified: "最后核对",
  back: "全部手册",
  copy: "复制全文",
  copied: "已复制",
  copyFail: "复制失败",
  next: "接下来",
} as const;

function useFigureHeight(ref: React.RefObject<HTMLIFrameElement | null>) {
  const [h, setH] = useState(0);
  const measure = useCallback(() => {
    const doc = ref.current?.contentDocument;
    if (!doc) return;
    const next = Math.ceil(doc.documentElement.getBoundingClientRect().height) + 2;
    if (next > 2) setH(next);
  }, [ref]);
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const d = e.data as { __expFigure?: boolean; height?: number } | null;
      if (!d?.__expFigure || typeof d.height !== "number") return;
      if (e.source !== ref.current?.contentWindow) return;
      setH(Math.ceil(d.height) + 2);
    };
    window.addEventListener("message", onMsg);
    const t = window.setTimeout(measure, 400);
    return () => {
      window.removeEventListener("message", onMsg);
      window.clearTimeout(t);
    };
  }, [measure, ref]);
  return { h, measure };
}

function Figure({ src, title }: { src: string; title: string }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const { h, measure } = useFigureHeight(ref);
  return (
    <div className="gd-figure" style={h ? { height: h } : undefined}>
      <iframe ref={ref} src={src} title={title} loading="lazy" onLoad={measure} />
    </div>
  );
}

function CopyBlock({ label, hint, text }: { label: string; hint: string; text: string }) {
  const [state, setState] = useState<"idle" | "ok" | "fail">("idle");
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function onCopy() {
    const ok = await writeClipboard(text);
    setState(ok ? "ok" : "fail");
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState("idle"), 1800);
  }

  return (
    <div className="gd-copyblock">
      <div className="gd-copyblock-head">
        <b>{label}</b>
        <p>{hint}</p>
      </div>
      <pre className="gd-pre">{text}</pre>
      <button
        type="button"
        className={
          "pb-copy" + (state === "ok" ? " is-copied" : "") + (state === "fail" ? " is-failed" : "")
        }
        onClick={onCopy}
      >
        {state === "fail" ? UI.copyFail : state === "ok" ? UI.copied : UI.copy}
      </button>
    </div>
  );
}

function Block({ block }: { block: GuideBlock }) {
  switch (block.t) {
    case "p":
      return <p className="gd-p">{block.text}</p>;
    case "h":
      return <h3 className="gd-h3">{block.text}</h3>;
    case "ul":
      return (
        <ul className="gd-ul">
          {block.items.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      );
    case "note":
      return (
        <p className="gd-note">
          <b>{block.label}</b>
          {block.text}
        </p>
      );
    case "table":
      return (
        <div className="gd-tablewrap">
          <table className="gd-table">
            <thead>
              <tr>
                {block.head.map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row) => (
                <tr key={row.join("|")}>
                  {row.map((cell) => (
                    <td key={cell}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "figure":
      return <Figure src={block.src} title={block.title} />;
    case "copy":
      return <CopyBlock label={block.label} hint={block.hint} text={block.text} />;
    case "links":
      return (
        <ul className="gd-links">
          {block.items.map((l) => (
            <li key={l.href}>
              <a href={l.href} target="_blank" rel="noreferrer">
                {l.label} <span aria-hidden>↗</span>
              </a>
              {l.note ? <p>{l.note}</p> : null}
            </li>
          ))}
        </ul>
      );
  }
}

export default function GuideView({ data }: { data: Guide }) {
  const ids = [
    ...data.sections.map((s) => `s-${s.n}`),
    ...(data.next?.length ? ["s-next"] : []),
  ];
  const [active, setActive] = useState("");
  useEffect(() => {
    function onScroll() {
      let cur = ids[0] ?? "";
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 160) cur = id;
      }
      setActive(cur);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(",")]);

  return (
    <main className="gd-main">
      <div className="gd-shell">
        <nav className="gd-rail" aria-label="目录">
          <p className="gd-rail-h">目录</p>
          <ol>
            {data.sections.map((s) => (
              <li key={s.n}>
                <a
                  href={`#s-${s.n}`}
                  className={active === `s-${s.n}` ? "is-active" : ""}
                >
                  <span className="gd-rail-n">{s.n}</span>
                  {s.title}
                </a>
              </li>
            ))}
            {data.next?.length ? (
              <li>
                <a href="#s-next" className={active === "s-next" ? "is-active" : ""}>
                  <span className="gd-rail-n">→</span>
                  {UI.next}
                </a>
              </li>
            ) : null}
          </ol>
        </nav>

        <div className="gd-col">
          <header className="gd-head">
            <div className="gd-head-top">
              <p className="gd-kicker">{UI.kind}</p>
              <Link className="gd-chip" href="/playbooks" title="返回手册列表">
                <svg className="ui-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M19 12H5m6-6-6 6 6 6" />
                </svg>
                {UI.back}
              </Link>
            </div>
            <h1>{data.title}</h1>
            <p className="pb-summary">{data.summary}</p>
            {data.lastVerified ? (
              <p className="pb-verified">
                {UI.verified} {data.lastVerified}
              </p>
            ) : null}
          </header>

          {data.sections.map((s) => (
            <section className="gd-sec" id={`s-${s.n}`} key={s.n} aria-label={s.title}>
              <h2>
                <span className="gd-sec-n">{s.n}</span>
                {s.title}
              </h2>
              {s.blocks.map((b, i) => (
                <Block block={b} key={`${s.n}-${i}`} />
              ))}
            </section>
          ))}

          {data.next?.length ? (
            <section className="pb-block gd-sec" id="s-next" aria-label={UI.next}>
              <h2>
                <span className="gd-sec-n">→</span>
                {UI.next}
              </h2>
              <ul className="pb-next">
                {data.next.map((n) => (
                  <li key={n.text}>
                    {n.text}
                    {n.link ? (
                      <a className="pb-link" href={n.link.href}>
                        {n.link.label} →
                      </a>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>
    </main>
  );
}
