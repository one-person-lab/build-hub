# VibeHub 克隆站

[vibe-hub.org](https://vibe-hub.org/)（Vibe Coding 术语图鉴）的 Next.js 全站克隆，基于
[JCodesMore/ai-website-cloner-template](https://github.com/JCodesMore/ai-website-cloner-template)
的工作流产出（无 Claude Code 环境，由 WorkBuddy 按同一 skill 规范手工执行）。

## 运行

```bash
npm install        # Node 24+
npm run dev        # http://localhost:3000
npm run build && npm start
```

## 覆盖范围（358 个静态路由）

| 内容 | 路由 | 说明 |
|---|---|---|
| 术语详情 | `/[slug]` × 322 | 结构化数据渲染（你可能会说 / 定义 / 容易混淆 / Anatomy / Variants / 场景 / 延伸阅读） |
| 术语目录 | `/`（前端 137）+ `/topics/[key]` × 7 | 分类 tab、侧栏分组锚点、卡片 mini demo（320 个） |
| 功能页 | `/practice` `/courses` `/anti-ai-flavor` `/changelog` `/vibehub-skill` | 浏览器渲染后提取的整页内容 |
| 课程 | `/courses/product-website`（12 章）、`/courses/git-workflow`（6 章） | 同上 |

## 实现方式

- **样式**：直接复用原站 15 个 CSS chunk（合并为 `src/app/vibehub.css`），组件输出与原站一致的 class 结构，像素级还原；品牌色等 JS 注入变量在 `src/app/site-overrides.css` 静态声明
- **数据**：`src/data/` 下 4 个 JSON —— `terms.json`（322 术语）、`catalogs.json`（8 分类目录）、`pages.json`（18 个特殊页）、`chrome.json`（页脚）
- **提取**：SSR HTML 用 `/tmp` 下 extract.py（留档于 `docs/research/vibe-hub-org-e37cedf6/`）；客户端渲染的内容（卡片 mini demo、练习/课程页）用 ego-browser 渲染后提取
- **交互**：主题明暗切换（`data-color-mode`）、导航搜索下拉、tab/侧栏切换、收藏星标（UI 态）、英文发音（speechSynthesis）、复制为 Markdown

## 已知边界

- 练习页答题判定、课程进度、收藏持久化、语言切换（中文/EN）等纯客户端状态逻辑未复刻
- 原站部分术语详情的交互演示（如拖拽、悬停）依赖其运行时 JS，静态展示为主
- `/en` 英文站未克隆

## 研究留档

`docs/research/vibe-hub-org-e37cedf6/`：设计 token、提取器脚本、原站/克隆对比截图。
`docs/design-references/vibe-hub-org-e37cedf6/`：原站多视口截图基准。
