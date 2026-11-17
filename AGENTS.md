# 协作规则

## 任务真身不在本仓

任务卡的真身在兄弟仓库 `../uni-workbench/workbench/`（`Now/` 是可领的活）。
被要求「领个任务」时，按 `../uni-workbench/workbench/README.md` 的**派活与认领协议**执行：
领卡先原子写回 `assignee` → 按卡上 `repo:` 在本仓干活 → 完工在卡片追加「验收证据」 → **不移卡**，等人验收。

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
