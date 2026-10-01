// 把 src/data/*.json 里直链第三方站点的 logo 镜像到 public/assets/logos/。
// 运行时直链远程域名会让每张卡片空等 400–900ms 跨域回源，本地化后是 20ms 内。
// 幂等：本地文件已存在则跳过下载；远程抓取失败时保留原 URL 并以非零码退出。
// 注意：/assets/* 带 7 天强缓存（见 next.config.ts），--force 覆盖同名文件后
// 访问者最长 7 天才看到新图，要立刻生效就换个文件名。
//
//   node scripts/fetch-logos.mjs [--force]

import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "src/data");
const OUT_DIR = path.join(ROOT, "public/assets/logos");
const FORCE = process.argv.includes("--force");

const IMAGE_URL = /"(https?:\/\/[^"]+?\.(?:png|jpe?g|webp|ico|svg|gif))"/gi;
const GENERIC_BASE = /^(icon|logo|favicon|apple-touch-icon|android-chrome|avatar|img|image|cover|banner)([-_.]|$)/i;

const GENERIC_TLD = new Set([
  "com", "net", "org", "io", "dev", "app", "co", "cc", "xyz", "tech", "ai", "me", "gg",
]);

function localName(url) {
  const u = new URL(url);
  const host = u.hostname.replace(/^www\./, "");
  const labels = host.split(".");
  const tld = labels[labels.length - 1];
  // are.na 这类「域名即品牌」的二级后缀要连 TLD 一起留名
  const keepTld = labels.length === 2 && !GENERIC_TLD.has(tld);
  const brand = (keepTld ? labels : labels.slice(0, -1))
    .filter((l) => !["static", "cdn", "assets", "images", "www"].includes(l))
    .join("-");
  const parts = u.pathname.split("/").filter(Boolean);
  const file = parts[parts.length - 1] || "index";
  const ext = (file.match(/\.[a-z0-9]+$/i)?.[0] || ".png").toLowerCase();
  const base = file.slice(0, -ext.length);
  const meaningful =
    !GENERIC_BASE.test(base) && base.length <= 24 && /^[a-z0-9._-]+$/i.test(base)
      ? `-${base.toLowerCase().replace(/[^a-z0-9._-]+/g, "-")}`
      : "";
  return `${brand}${meaningful}${ext}`;
}

function isImage(buf) {
  const head = buf.subarray(0, 12);
  return (
    (head[0] === 0x89 && head[1] === 0x50) || // png
    (head[0] === 0xff && head[1] === 0xd8) || // jpeg
    (head[0] === 0x47 && head[1] === 0x49) || // gif
    (head.toString("ascii", 0, 4) === "RIFF") || // webp
    (head[0] === 0x00 && head[1] === 0x00) // ico
  );
}

async function collect() {
  const files = (await readdir(DATA_DIR)).filter((f) => f.endsWith(".json"));
  const byUrl = new Map();
  for (const f of files) {
    const text = await readFile(path.join(DATA_DIR, f), "utf8");
    for (const m of text.matchAll(IMAGE_URL)) {
      if (!byUrl.has(m[1])) byUrl.set(m[1], new Set());
      byUrl.get(m[1]).add(f);
    }
  }
  return { files, byUrl };
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const { files, byUrl } = await collect();
  if (byUrl.size === 0) {
    console.log("没有远程 logo，全部已本地化。");
    return;
  }

  const failed = [];
  const mapping = new Map();

  for (const url of byUrl.keys()) {
    const name = localName(url);
    const dest = path.join(OUT_DIR, name);
    if (!existsSync(dest) || FORCE) {
      try {
        const res = await fetch(url, {
          redirect: "follow",
          headers: { "user-agent": "https://buildhub.site (logo mirror)" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length < 100 || !isImage(buf)) {
          throw new Error("响应不是图片");
        }
        await writeFile(dest, buf);
        console.log(`  ✓ ${name}  ${(buf.length / 1024).toFixed(1)}KB`);
      } catch (e) {
        failed.push(`${url} — ${e.message}`);
        console.warn(`  ✗ 保留远程 URL: ${url} — ${e.message}`);
        continue;
      }
    } else {
      console.log(`  · 已存在 ${name}`);
    }
    mapping.set(url, `/assets/logos/${name}`);
  }

  for (const f of files) {
    const p = path.join(DATA_DIR, f);
    const text = await readFile(p, "utf8");
    let next = text;
    for (const [url, local] of mapping) next = next.split(url).join(local);
    if (next !== text) {
      await writeFile(p, next);
      console.log(`  改写 ${path.relative(ROOT, p)}`);
    }
  }

  if (failed.length) {
    console.error(`\n${failed.length} 个远程 logo 抓取失败：\n  ` + failed.join("\n  "));
    process.exitCode = 1;
  }
}

await main();
