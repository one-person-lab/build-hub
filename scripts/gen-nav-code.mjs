// Generates src/data/navCode.ts from the real NavDemo sources so the modal's
// Code tab shows genuine, copyable source that matches each rendered demo.
// Run: node scripts/gen-nav-code.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const tsx = readFileSync(join(root, "src/components/NavDemo.tsx"), "utf8");
const css = readFileSync(join(root, "src/components/NavDemo.css"), "utf8");

// ── 1. Slice every top-level `function Name(...) { ... }` by brace counting.
function sliceFunctions(src) {
  const fns = {};
  const re = /^function ([A-Z][A-Za-z0-9]*)\s*\(/gm;
  let m;
  while ((m = re.exec(src))) {
    const name = m[1];
    const start = m.index;
    // Walk past the parameter list so we anchor on the body's `{`, not a
    // destructured param brace like `function X({ className }) {`.
    let i = re.lastIndex; // just after the opening `(`
    let pd = 1;
    for (; i < src.length; i++) {
      const c = src[i];
      if (c === "(") pd++;
      else if (c === ")") {
        pd--;
        if (pd === 0) {
          i++;
          break;
        }
      }
    }
    const brace = src.indexOf("{", i);
    let depth = 0;
    let j = brace;
    for (; j < src.length; j++) {
      const c = src[j];
      if (c === "{") depth++;
      else if (c === "}") {
        depth--;
        if (depth === 0) break;
      }
    }
    fns[name] = src.slice(start, j + 1).replace(/\s+$/, "");
  }
  return fns;
}
const fns = sliceFunctions(tsx);

// ── 2. slug -> component name, from the DEMOS map.
const mapBlock = tsx.slice(tsx.indexOf("const DEMOS"), tsx.indexOf("};", tsx.indexOf("const DEMOS")));
const slugToFn = {};
for (const mm of mapBlock.matchAll(/"(nav-[a-z0-9-]+)":\s*([A-Z][A-Za-z0-9]*)/g)) {
  slugToFn[mm[1]] = mm[2];
}

const helperNames = Object.keys(fns).filter((n) => !Object.values(slugToFn).includes(n));

// ── 3. Parse CSS into top-level rules (selector blocks, @media, @keyframes).
function parseCss(src) {
  const rules = [];
  let i = 0;
  const n = src.length;
  while (i < n) {
    while (i < n && /\s/.test(src[i])) i++;
    if (i >= n) break;
    if (src[i] === "/" && src[i + 1] === "*") {
      const end = src.indexOf("*/", i + 2);
      i = end < 0 ? n : end + 2;
      continue;
    }
    const open = src.indexOf("{", i);
    if (open < 0) break;
    const head = src.slice(i, open).trim();
    let depth = 0;
    let j = open;
    for (; j < n; j++) {
      if (src[j] === "{") depth++;
      else if (src[j] === "}") {
        depth--;
        if (depth === 0) break;
      }
    }
    const body = src.slice(open + 1, j);
    rules.push({ head, body: body.replace(/\s+$/, ""), raw: src.slice(i, j + 1) });
    i = j + 1;
  }
  return rules;
}
const rules = parseCss(css);

const isBase = (r) => /^\.nd(\s|,|\*|\s?\{|$)/.test(r.head) && !/\bnd\d/.test(r.head);
const baseRules = rules.filter(isBase);
const compRules = rules.filter((r) => !isBase(r) && !r.head.startsWith("@"));
const atRules = rules.filter((r) => r.head.startsWith("@"));

// class tokens like nd15, nd15-bar, nd5-head
function tokensOf(text) {
  const set = new Set();
  for (const m of text.matchAll(/\bnd\d+[a-z0-9-]*/g)) set.add(m[0]);
  return set;
}

// ── 4. Build one self-contained source string per slug.
function buildCode(slug, fnName) {
  const body = fns[fnName];
  if (!body) throw new Error(`missing component ${fnName}`);
  const navTokens = tokensOf(body);
  const idx = (() => {
    for (const t of navTokens) {
      const m = /^nd(\d+)$/.exec(t);
      if (m) return m[1];
    }
    return "";
  })();

  const usedHelpers = helperNames.filter((h) => new RegExp(`\\b${h}\\b`).test(body));
  const helperSrc = usedHelpers.map((h) => fns[h]).join("\n\n");

  const matchedComp = compRules.filter((r) => {
    const rt = tokensOf(r.head);
    for (const t of rt) if (navTokens.has(t)) return true;
    return false;
  });
  const compCss = matchedComp.map((r) => r.raw.trim()).join("\n");

  const usedAnim = new Set();
  for (const m of compCss.matchAll(/animation(?:-name)?\s*:\s*[^;]*?\b([a-zA-Z][\w-]*)\b/g)) usedAnim.add(m[1]);
  const matchedAt = atRules.filter((r) => {
    if (r.head.startsWith("@keyframes")) {
      const name = r.head.replace(/@keyframes\s*/, "").trim();
      return usedAnim.has(name);
    }
    const rt = tokensOf(r.head + r.body);
    for (const t of rt) if (navTokens.has(t)) return true;
    return false;
  });

  const baseCss = baseRules.map((r) => r.raw.trim()).join("\n");
  const atCss = matchedAt.map((r) => r.raw.trim()).join("\n");
  const fullCss = [baseCss, compCss, atCss].filter(Boolean).join("\n\n");

  const hookImport = /\buseEffect\b|\buseRef\b|\buseState\b/.test(body)
    ? `import { ${["useEffect", "useRef", "useState"].filter((h) => new RegExp(`\\b${h}\\b`).test(body)).join(", ")} } from "react";`
    : "";

  const header =
    `// Navigation ${idx} · BuildHub replica of the ReactBits Pro block\n` +
    `// React 19 + plain CSS. Drop the component and the stylesheet into your project.\n\n`;

  const tsxPart =
    `"use client";\n\n` +
    (hookImport ? hookImport + "\n" : "") +
    `import "./navigation-${idx}.css";\n\n` +
    (helperSrc ? helperSrc + "\n\n" : "") +
    body.replace(new RegExp(`^function ${fnName}`), `export default function Navigation${idx}`) +
    "\n";

  const cssPart =
    `/* navigation-${idx}.css */\n\n` + fullCss + "\n";

  return header + tsxPart + "\n" + cssPart;
}

const out = {};
for (const [slug, fnName] of Object.entries(slugToFn)) {
  out[slug] = buildCode(slug, fnName);
}

const banner =
  "// AUTO-GENERATED by scripts/gen-nav-code.mjs — do not edit by hand.\n" +
  "// Regenerate after changing NavDemo.tsx / NavDemo.css.\n\n";
const decl =
  `export const NAV_CODE: Record<string, string> = ` +
  JSON.stringify(out, null, 2) +
  ";\n";
writeFileSync(join(root, "src/data/navCode.ts"), banner + decl);

const sizes = Object.entries(out).map(([k, v]) => `${k}:${v.length}`);
console.log("wrote src/data/navCode.ts\n" + sizes.join("  "));
