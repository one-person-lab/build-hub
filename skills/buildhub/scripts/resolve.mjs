#!/usr/bin/env node
/*
 * 候选术语验证：拿推断出的术语名查 buildhub.cn 的搜索接口，
 * 返回站点里真实存在的术语页链接与一句话解释。查不到就报未命中，不猜。
 */

const DEFAULT_SITE = process.env.BUILDHUB_SITE_URL || "https://buildhub.cn";
const DEFAULT_LIMIT = 1;
const DEFAULT_TIMEOUT = 10000;
const MAX_QUERY = 3;
const MAX_BLURB = 220;

// 这些是站点分区，不是术语页；命中它们说明候选词根本不是术语
const SECTIONS = new Set([
  "assets", "changelog", "courses", "design", "distill", "explains", "favorites",
  "forks", "paths", "playbooks", "practice", "principles", "privacy", "pro",
  "products", "prompts", "proto", "refunds", "skills", "stack", "terms", "topics",
]);

const HELP = `BuildHub 术语解析

用法:
  node scripts/resolve.mjs resolve --query "Tooltip" [--query "Hover"] [options]

参数:
  --query <术语>     候选术语名，最多 ${MAX_QUERY} 个
  --locale <zh|en>   查询哪种语言的词条，默认 zh
  --limit <1-3>      每个候选最多返回几条，默认 ${DEFAULT_LIMIT}
  --site-url <url>   站点地址，默认 ${DEFAULT_SITE}（可用 BUILDHUB_SITE_URL 覆盖）
  --timeout <ms>     单次请求超时，默认 ${DEFAULT_TIMEOUT}
  --help             看这个说明
`;

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const options = { command, query: [], locale: "zh", limit: DEFAULT_LIMIT };

  if (command === "--help" || rest.includes("--help")) {
    process.stdout.write(HELP);
    process.exit(0);
  }

  for (let i = 0; i < rest.length; i += 1) {
    const token = rest[i];
    if (!token.startsWith("--")) die(`无法识别的参数: ${token}`);
    const key = token.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    const value = rest[i + 1];
    if (value === undefined || value.startsWith("--")) die(`${token} 缺少取值`);
    i += 1;

    if (key === "query") {
      options.query.push(value.trim());
    } else if (key === "locale") {
      if (!["zh", "en"].includes(value)) die("--locale 只能是 zh 或 en");
      options.locale = value;
    } else if (key === "limit") {
      const n = Number(value);
      if (!Number.isInteger(n) || n < 1 || n > 3) die("--limit 取 1 到 3");
      options.limit = n;
    } else if (key === "timeout") {
      const n = Number(value);
      if (!Number.isInteger(n) || n < 500 || n > 60000) die("--timeout 取 500 到 60000 毫秒");
      options.timeout = n;
    } else if (key === "siteUrl") {
      options.siteUrl = value;
    } else {
      die(`无法识别的参数: ${token}`);
    }
  }

  options.query = options.query.filter(Boolean).slice(0, MAX_QUERY);
  return options;
}

function die(message) {
  process.stderr.write(`${message}\n\n${HELP}`);
  process.exit(1);
}

function siteOrigin(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    die(`站点地址无效: ${value}`);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") die("站点地址必须用 http 或 https");
  if (url.hostname !== "localhost" && url.hostname !== "127.0.0.1" && url.protocol !== "https:") {
    die("非本机地址必须用 https");
  }
  return url.origin;
}

/** 接口返回的正文来自远端，只留一行可见文本，防止把标签和指令带进上下文 */
function cleanText(value) {
  const text = String(value ?? "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > MAX_BLURB ? `${text.slice(0, MAX_BLURB)}…` : text;
}

/** 术语页是单段路径 /{slug}（英文站 /en/{slug}），分区路径不算 */
function isTermHref(href, locale) {
  const parts = href.split("/").filter(Boolean);
  const slug = locale === "en" ? parts[1] : parts[0];
  if (locale === "en" && parts[0] !== "en") return false;
  if (!slug || SECTIONS.has(slug)) return false;
  return /^[a-z0-9][a-z0-9-]*$/.test(slug);
}

async function searchTerm(site, query, options) {
  const url = new URL("/api/search", site);
  url.searchParams.set("q", query);
  url.searchParams.set("locale", options.locale);

  const response = await fetch(url, {
    redirect: "manual",
    signal: AbortSignal.timeout(options.timeout ?? DEFAULT_TIMEOUT),
    headers: { accept: "application/json", "user-agent": "buildhub-skill/1" },
  });
  if (!response.ok) throw new Error(`接口返回 ${response.status}`);

  const body = await response.json();
  const hits = (body.items ?? [])
    .filter((item) => isTermHref(item.href ?? "", options.locale))
    .slice(0, options.limit)
    .map((item) => ({
      name: cleanText(item.title),
      url: `${site}${item.href}`,
      blurb: cleanText(item.subtitle),
      zone: cleanText(item.type),
    }));

  return { query, matched: hits.length > 0, terms: hits };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.command !== "resolve") die(`未知命令: ${options.command ?? "(未给出)"}`);
  if (options.query.length === 0) die("至少给一个 --query");
  if (typeof fetch !== "function") die("这个 Node 版本没有 fetch，需要 Node 18 以上");

  const site = siteOrigin(options.siteUrl || DEFAULT_SITE);

  // 一次请求验证一批候选，避免来回打接口
  const results = await Promise.all(
    options.query.map((query) =>
      searchTerm(site, query, options).catch((error) => ({
        query,
        matched: false,
        terms: [],
        error: cleanText(error.message),
      })),
    ),
  );

  process.stdout.write(`${JSON.stringify({ site, locale: options.locale, results }, null, 2)}\n`);
  if (!results.some((r) => r.matched)) process.exit(2);
}

main();
