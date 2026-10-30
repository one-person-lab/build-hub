import type { ReactNode } from "react";
import Link from "next/link";

type Block =
  | { t: "p"; text: string }
  | { t: "h"; level: 3 | 4; text: string }
  | { t: "ul"; items: string[] }
  | { t: "ol"; items: string[] }
  | { t: "code"; lang: string; text: string }
  | { t: "flow"; items: { k: string; v: string }[] }
  | { t: "table"; head: string[]; rows: string[][] }
  | { t: "quote"; text: string }
  | { t: "hr" };

const FENCE = /^```/;
const H3 = /^###\s+/;
const H4 = /^####\s+/;
const UL = /^[-*]\s+/;
const OL = /^\d+[.)]\s+/;
const QUOTE = /^>\s?/;
const TABLE = /^\|/;

function isTableSeparator(line: string): boolean {
  const cells = splitRow(line);
  return cells.length > 0 && cells.every((c) => /^:?-{2,}:?$/.test(c.trim()));
}

function splitRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());
}

function parseFlow(body: string): { k: string; v: string }[] {
  return body
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && line !== "→" && line !== "↓")
    .map((line) => {
      const clean = line.replace(/^[-*]\s+/, "").replace(/^\d+[.)]\s+/, "");
      const i = clean.indexOf("|");
      if (i === -1) return { k: clean, v: "" };
      return { k: clean.slice(0, i).trim(), v: clean.slice(i + 1).trim() };
    });
}

function inferLang(lang: string, text: string): string {
  if (lang && !["text", "plain", "markdown"].includes(lang)) return lang;
  if (/(?:public|private|protected)\s+(?:class|interface|record|enum)\b|^\s*(?:var|final)\s/m.test(text)) return "java";
  if (/\b(?:SELECT|INSERT INTO|CREATE TABLE|ALTER TABLE)\b/i.test(text)) return "sql";
  if (/^\s*[{[][\s\S]*[}\]]\s*$/.test(text)) return "json";
  if (/^(?:\$ |curl |mvn |gradle |docker )/m.test(text)) return "bash";
  return lang || "text";
}

export function parseMarkdown(md: string): Block[] {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }

    if (FENCE.test(line.trim())) {
      const lang = line.trim().slice(3).trim().split(/\s+/)[0] || "text";
      const body: string[] = [];
      i++;
      while (i < lines.length && !FENCE.test(lines[i].trim())) {
        body.push(lines[i]);
        i++;
      }
      i++;
      const text = body.join("\n").replace(/\s+$/, "");
      const contentLines = text
        .split("\n")
        .filter((l) => l.trim() && !/^[↓→]$/.test(l.trim()));
      const pipeLines = contentLines.filter((l) => l.includes("|")).length;
      const looksLikeFlow =
        (lang === "text" || lang === "" || lang === "markdown") &&
        contentLines.length >= 3 &&
        pipeLines / contentLines.length >= 0.6;
      blocks.push(
        lang === "flow" || looksLikeFlow
          ? { t: "flow", items: parseFlow(text) }
          : { t: "code", lang: inferLang(lang, text), text },
      );
      continue;
    }

    if (H4.test(line)) {
      blocks.push({ t: "h", level: 4, text: line.replace(H4, "").trim() });
      i++;
      continue;
    }

    if (H3.test(line)) {
      blocks.push({ t: "h", level: 3, text: line.replace(H3, "").trim() });
      i++;
      continue;
    }

    if (TABLE.test(line)) {
      const raw: string[] = [];
      while (i < lines.length && TABLE.test(lines[i])) {
        raw.push(lines[i]);
        i++;
      }
      const rows = raw.filter((r) => !isTableSeparator(r)).map(splitRow);
      if (rows.length) blocks.push({ t: "table", head: rows[0], rows: rows.slice(1) });
      continue;
    }

    if (QUOTE.test(line)) {
      const body: string[] = [];
      while (i < lines.length && QUOTE.test(lines[i])) {
        body.push(lines[i].replace(QUOTE, ""));
        i++;
      }
      blocks.push({ t: "quote", text: body.join("").trim() });
      continue;
    }

    if (UL.test(line)) {
      const items: string[] = [];
      while (i < lines.length && UL.test(lines[i])) {
        items.push(lines[i].replace(UL, "").trim());
        i++;
      }
      blocks.push({ t: "ul", items });
      continue;
    }

    if (OL.test(line)) {
      const items: string[] = [];
      while (i < lines.length && OL.test(lines[i])) {
        items.push(lines[i].replace(OL, "").trim());
        i++;
      }
      blocks.push({ t: "ol", items });
      continue;
    }

    if (/^---+$/.test(line.trim())) {
      blocks.push({ t: "hr" });
      i++;
      continue;
    }

    const body: string[] = [line];
    i++;
    while (i < lines.length) {
      const next = lines[i];
      if (
        !next.trim() ||
        FENCE.test(next.trim()) ||
        H3.test(next) ||
        H4.test(next) ||
        TABLE.test(next) ||
        QUOTE.test(next) ||
        UL.test(next) ||
        OL.test(next) ||
        /^---+$/.test(next.trim())
      ) {
        break;
      }
      body.push(next);
      i++;
    }
    blocks.push({ t: "p", text: body.join("").trim() });
  }

  return blocks;
}

function inline(text: string, keyPrefix: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g);
  return parts.filter(Boolean).map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={key}>{part.slice(1, -1)}</code>;
    }
    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
    if (link) {
      const [, label, href] = link;
      if (href.startsWith("/")) {
        return (
          <Link key={key} href={href}>
            {label}
          </Link>
        );
      }
      return (
        <a key={key} href={href} target="_blank" rel="noreferrer">
          {label}
        </a>
      );
    }
    return <span key={key}>{part}</span>;
  });
}

function renderBlock(block: Block, index: number): ReactNode {
  const key = `b-${index}`;
  switch (block.t) {
    case "p":
      return <p key={key}>{inline(block.text, key)}</p>;
    case "h":
      return block.level === 3 ? (
        <h3 key={key}>{inline(block.text, key)}</h3>
      ) : (
        <h4 key={key}>{inline(block.text, key)}</h4>
      );
    case "ul":
      return (
        <ul key={key}>
          {block.items.map((item, i) => (
            <li key={`${key}-${i}`}>{inline(item, `${key}-${i}`)}</li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol key={key}>
          {block.items.map((item, i) => (
            <li key={`${key}-${i}`}>{inline(item, `${key}-${i}`)}</li>
          ))}
        </ol>
      );
    case "code":
      return (
        <div className="book-code" key={key}>
          <span className="book-code-lang">{block.lang}</span>
          <pre>
            <code>{block.text}</code>
          </pre>
        </div>
      );
    case "flow":
      return (
        <ol className="book-flow" key={key}>
          {block.items.map((item, i) => (
            <li key={`${key}-${i}`}>
              <span className="book-flow-k">{item.k}</span>
              {item.v ? <span className="book-flow-v">{inline(item.v, `${key}-${i}`)}</span> : null}
            </li>
          ))}
        </ol>
      );
    case "table":
      return (
        <div className="book-table-wrap" key={key}>
          <table>
            <thead>
              <tr>
                {block.head.map((cell, i) => (
                  <th key={`${key}-h-${i}`}>{inline(cell, `${key}-h-${i}`)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, r) => (
                <tr key={`${key}-r-${r}`}>
                  {row.map((cell, c) => (
                    <td key={`${key}-r-${r}-${c}`} data-label={block.head[c] ?? ""}>
                      {inline(cell, `${key}-r-${r}-${c}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "quote":
      return (
        <blockquote key={key} className="book-quote">
          {inline(block.text, key)}
        </blockquote>
      );
    case "hr":
      return <hr key={key} className="book-hr" />;
    default:
      return null;
  }
}

export default function BookProse({ markdown }: { markdown: string }) {
  if (!markdown.trim()) return null;
  return <div className="book-prose">{parseMarkdown(markdown).map(renderBlock)}</div>;
}
