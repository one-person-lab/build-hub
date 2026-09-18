# BuildHub UI 全面铺开实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把已验收的 redesign/ui-v2 样张（深色图鉴风 + 图鉴式导航）全量铺到 BuildHub 主站：导航、首页、五个列表页、全部详情页、en 站，直接替换旧风格。

**Architecture:** A 路线——样张 `rd-*` 令牌升级为全站 CSS 变量（接现有 `data-color-mode` + `--theme-brand` 机制），再逐页改造现有组件；不新建并行组件树。样张代码从 worktree 按文件搬运合并，不重写。

**Tech Stack:** Next.js 16 App Router + Turbopack, React 19, TypeScript, 纯 CSS（vibehub.css 为压缩单行大文件，改动一律放 site-overrides.css）。

**Spec:** `docs/superpowers/specs/2026-09-18-redesign-full-rollout-design.md`

## Global Constraints

- 主站 dev server 固定 3000 端口（`npm run dev` 已带 `--port 3000`），样张 3001 只读不动。
- 基线标签 `redesign-baseline`（af485a7）；每个 Task 一个 commit，任何一步可单独 `git revert`。
- zh JSON：indent 2 + 文件尾换行；en-catalogs.json / en-terms.json：单行紧凑 `separators=(",",":")` 且**无**尾换行（末字节须为 `]`）。改数据必须 zh/en 成对。
- 不新增/批量修改词条、技能、产品内容——本计划纯 UI 改造。
- 深浅双态是验收硬标准：每个 Task 的验证必须跑 dark 和 light 两遍。
- 无单元测试框架；验证 = `npm run check`（lint+typecheck+build）+ curl 冒烟 + browser-use DOM 断言（evaluate_script）。每步先跑断言看 FAIL，再改动，再看 PASS。
- 样张源文件在 `/Users/ethan/workspace/code/one-person-hub/build-hub/.worktrees/redesign-ui-v2/`，以下简写为 `$WT`。

## 文件结构

| 文件 | 职责 | 动作 |
|---|---|---|
| `src/app/vibehub.css` | 全站设计令牌（:root 与 dark 两套色阶，第 6 行压缩块） | 改值 |
| `src/app/site-overrides.css` | 本站追加样式（所有新 CSS 都写这里） | 增块 |
| `src/components/SiteNav.tsx` | 顶部导航 | 重写为图鉴式导航 |
| `src/components/CommandPalette.tsx` | 命令面板（新建，源自 `$WT/src/components/redesign/RedesignNav.tsx` 的面板部分） | 新建 |
| `src/components/ProModal.tsx` | Go Pro 弹窗（源自样张，标「即将上线」） | 新建 |
| `src/components/CardDemoThumb.tsx` | 卡片 demo 缩略取景框（= `$WT/src/components/redesign/RdDemoThumb.tsx`） | 新建 |
| `src/components/CatalogView.tsx` | 术语列表（5 个 tab 共用） | 改造 |
| `src/components/SkillLibraryView.tsx` / `ProductLibraryView.tsx` / `PromptLibraryView.tsx` / `AssetLibraryView.tsx` | 其余列表 | 套同一骨架 |
| `src/components/TermDetail.tsx` 及各 DetailView | 详情页 | 换外壳（内容结构不动） |
| `src/app/page.tsx` + `src/components/HomeView.tsx`（新建） | 首页 | 替换为样张首页 |
| `src/app/en/page.tsx` 等 | en 镜像 | 同步 |

---

### Task 1: 主题令牌升级（只换色阶，不动结构）

**Files:**
- Modify: `src/app/vibehub.css`（:root 与 :root[data-color-mode=dark] 两个块内的变量值）
- Modify: `src/app/site-overrides.css`（默认主题色 + 新增 --ground 与 body 背景）

**Interfaces:**
- Produces: 全站可用的新色阶变量：`--ground`（页面底色）、`--bg`（卡面/面板）、`--bg-soft`、`--bg-hover`、`--border`、`--border-light`、`--text`、`--text-2`、`--text-3`、`--brand/--accent`（跟随 vh-theme-color）。后续所有 Task 只引用这些变量，不再出现样张里的 `--rd-*` 前缀。

- [ ] **Step 1: 写失败断言（浏览器）**

在 3000 的 `/` 执行 evaluate_script：

```js
() => JSON.stringify({
  darkBg: getComputedStyle(document.body).backgroundColor,
  card: getComputedStyle(document.querySelector('.card') || document.body).backgroundColor,
})
```

切到 dark（点导航月亮按钮）后期望 `darkBg` 为 `rgb(20, 21, 26)`（#14151a）、卡面 `rgb(32, 34, 40)`（#202228）。当前为 #1b1d21/#22252a → FAIL。

- [ ] **Step 2: 改 vibehub.css 浅色 :root 块**

在 `:root{--bg:#ffffff;...}` 内精确替换（其余键不动）：

```
--bg:#ffffff          （不变，卡面）
--bg-soft:#f7f7f8     （原 #fafafa）
--bg-hover:#efeff1    （原 #f4f4f5）
--text:#1a1b20        （原 #18181b）
--border-light:#ececef（原 #f0f0f2）
```

- [ ] **Step 3: 改 dark 块**

在 `:root[data-color-mode=dark]{...}` 内替换：

```
--bg:#202228          （卡面，原 #1b1d21）
--bg-soft:#1a1c22     （原 #22252a）
--bg-hover:#2c2f38    （原 #2c3036）
--text:#eceef2        （原 #d9dce2）
--text-2:#8b8e99      （原 #b3b9c4）
--text-3:#5c5f69      （原 #949da9）
--border:#2c2f38      （原 #3e444e）
--border-hover:#3a3e49（原 #525a66）
--border-light:#262933（原 #30353d）
--on-brand:#14151a    （原 #1b1d21）
```

- [ ] **Step 4: site-overrides.css 增加 ground 与金色默认主题**

```css
/* 图鉴风：页面底与卡面分离 */
:root { --ground: #f7f7f8; }
:root[data-color-mode="dark"] { --ground: #14151a; }
body { background: var(--ground); }

/* 默认主题色 = 图鉴金（用户仍可用 vh-theme-color 覆盖） */
:root { --theme-brand: #8a6a1f; --theme-brand-hover: #6f5518; }
:root[data-color-mode="dark"] { --theme-dark-brand: #e8c767; }
```

（替换 site-overrides.css 原有的 `--theme-brand:#0f766e` 与 `--theme-dark-brand:#7b93ea` 声明，不重复定义。）

- [ ] **Step 5: 跑断言看 PASS**

重跑 Step 1，深浅两态各验一次；再抽查 `/topics/design`、`/style-dark-catalog`、`/skills` 三页 body/卡面背景色。

- [ ] **Step 6: `npm run check` 通过后提交**

```bash
git add src/app/vibehub.css src/app/site-overrides.css
git commit -m "feat(theme): 全站色阶升级为深色图鉴风双态令牌，默认主题色改图鉴金"
```

---

### Task 2: SiteNav → 图鉴式导航（含命令面板 + Go Pro 弹窗）

**Files:**
- Rewrite: `src/components/SiteNav.tsx`
- Create: `src/components/CommandPalette.tsx`、`src/components/ProModal.tsx`
- Modify: `src/app/site-overrides.css`（导航样式，源自 `$WT/src/components/redesign/redesign.css` 的 `.rd-nav/.rd-pill/.rd-searchbtn/.rd-menu/.rd-overlay` 等块，变量名换成 Step Task1 的全站变量）
- Modify: `src/app/layout.tsx`（`--site-nav-height` 由 60px 改 56px；<1024px 的 108px 按新导航实测调整）

**Interfaces:**
- Consumes: Task 1 的变量；`catalogs.json` 拍平的词条列表（命令面板数据源，逻辑 = `$WT/src/components/redesign/RedesignNav.tsx` 的 `useFlatTerms`，改为导出到 CommandPalette 内部）。
- Produces: 固定高度 56px 的 sticky 顶栏，CSS 类名 `.nav`（沿用现有类，避免全站 `--site-nav-height` 引用点改动）。

- [ ] **Step 1: 搬运样张导航**

以 `$WT/src/components/redesign/RedesignNav.tsx` 为底重写 `SiteNav.tsx`：字标 ✦ + BuildHub（驼峰）、分区菜单（术语/技能/产品/提示词 → 现有路由）、素材库胶囊 → `/topics/assets`。命令面板拆到 `CommandPalette.tsx`、Go Pro 弹窗拆到 `ProModal.tsx`（价格 ¥18/月、¥148/年（省31%）、7 天免费试用 + 一行「付费功能即将上线，基础浏览永远免费」，按钮「暂不订阅」关闭）。

- [ ] **Step 2: 合并现站导航功能（一个都不能丢）**

从旧 `SiteNav.tsx` 迁移进新导航右侧/头像菜单：深浅切换（保留现有 `vh-color-mode` 读写与太阳/月亮图标类 `.color-mode-sun/.color-mode-moon`）、主题色选择器（`vh-theme-color`，若旧版有）、语言切换（zh/en，保留现有 pathname 映射逻辑）、收藏入口、交流群 dialog、更新日志/练习/课程入口（进头像菜单）。

- [ ] **Step 3: 样式并入 site-overrides.css**

从 `$WT/src/components/redesign/redesign.css` 抄导航相关块，`--rd-ground→var(--ground)`、`--rd-card→var(--bg)`、`--rd-border→var(--border)`、`--rd-accent→var(--brand)`、`--rd-text→var(--text)`、`--rd-muted→var(--text-2)`、`--rd-faint→var(--text-3)`；`@media (max-width:900px)` 降级规则照抄。

- [ ] **Step 4: 断言（FAIL→PASS）**

```js
() => { const n = document.querySelector('.nav'); const r = n.getBoundingClientRect();
  return JSON.stringify({ h: r.height, sticky: getComputedStyle(n).position,
    hasWordmark: n.textContent.includes('BuildHub'),
    hasGoPro: n.textContent.includes('Go Pro'),
    overflow: n.scrollWidth > n.clientWidth }); }
```

期望 `{h:56, sticky:"sticky", hasWordmark:true, hasGoPro:true, overflow:false}`；另断言：滚动 1200px 后 `.nav` top 仍为 0；按 `/` 键弹命令面板、输入「button」出结果、回车跳转；390px 窄屏 `overflow:false`。

- [ ] **Step 5: `npm run check` + 提交**

```bash
git add src/components/SiteNav.tsx src/components/CommandPalette.tsx src/components/ProModal.tsx src/app/site-overrides.css src/app/layout.tsx
git commit -m "feat(nav): 顶部导航图鉴化——命令面板、Go Pro 即将上线弹窗，现站入口全部并入"
```

---

### Task 3: 列表页图鉴化（术语先行，其余四个跟进）

**Files:**
- Create: `src/components/CardDemoThumb.tsx`（= `$WT/src/components/redesign/RdDemoThumb.tsx`，类名 `rd-thumb→card-thumb`）
- Modify: `src/components/CatalogView.tsx`、`SkillLibraryView.tsx`、`ProductLibraryView.tsx`、`PromptLibraryView.tsx`、`AssetLibraryView.tsx`
- Modify: `src/app/site-overrides.css`（`.card-thumb`、吸顶筛选条、`.rd-toc` 改名 `.cat-live-toc` 的安静目录样式，全部从 `$WT/src/components/redesign/redesign.css` 对应块搬运并换变量）

**Interfaces:**
- Consumes: Task 1 变量、Task 2 的 56px 导航高度。
- Produces: `<CardDemoThumb demoHtml demoClass />`（无 demoHtml 返回 null，不占位）；`.cat-live-toc` 组件模式（sticky、IntersectionObserver rootMargin `-150px 0px -55% 0px`、点击 `scrollIntoView`、`scroll-margin-top:112px`）。

- [ ] **Step 1: 术语列表卡片加缩略取景框**

`CatalogView.tsx` 卡片头部插 `<CardDemoThumb .../>`（数据字段 `demoHtml/demoClass` 已在 catalogs 拍平的 terms 上）。断言：`/topics/design` 上 `document.querySelectorAll('.card-thumb').length === 卡片数`、统一高度 152、`.card-thumb > .card-demo` 计算 `borderRadius === "0px"`、无 demo 词条卡片数 = 无 `.card-thumb`。

- [ ] **Step 2: 筛选条吸顶两层**

现 `.catalog-finder` 已有 is-stuck 机制：把其 sticky top 从 `--site-nav-height` 语义保持不变（56px），补毛玻璃底同 Task 2。断言：滚动后 `.catalog-finder` rect.top === 56。

- [ ] **Step 3: 左侧目录换安静版实时目录**

把现有 chip 侧栏改成 `.cat-live-toc` 文字列（结构 = 样张 RedesignTerms 的 aside；高亮逻辑已有，rootMargin 改 `-150px 0px -55% 0px`）。断言：无背景无边框（computed backgroundColor `rgba(0, 0, 0, 0)`、borderLeftWidth `0px`）、当前项含 `.is-active`、点击第 3 项后对应 section rect.top ≈ 112、无 mask-image。

- [ ] **Step 4: 功能回归断言（每个 tab 都跑）**

收藏点击后 `vh-favorites` 长度 +1；平台筛选（design tab 的全部/Web/iOS）生效；视图切换（卡片/列表）生效；中英文切换不 404。

- [ ] **Step 5: 其余四个列表套同一骨架**

`SkillLibraryView`（技能卡无 demoHtml 的用封面图字段，两者皆无则不加图）、`ProductLibraryView`（logo 有则显、无则不硬加）、`PromptLibraryView`、`AssetLibraryView`。断言各列表页 200 + 卡片高度统一 + `overflow:false`（grid 不撑破）。

- [ ] **Step 6: `npm run check` + 提交**

```bash
git add src/components/ src/app/site-overrides.css
git commit -m "feat(list): 五个列表页图鉴化——缩略取景框、两层吸顶、安静版实时目录"
```

---

### Task 4: 详情页图鉴外壳

**Files:**
- Modify: `src/components/TermDetail.tsx`、`SkillDetailView.tsx`、`ProductDetailView.tsx`、`PromptDetailView.tsx`、`AssetDetailView.tsx` 及对应 4 个 css
- Modify: `src/app/site-overrides.css`

**Interfaces:**
- Consumes: Task 1 变量（大部分效果由令牌自动带来）；`.scaled-preview` 取景机制不动。
- Produces: 详情页 kicker 统一金色小标 + 内容卡面 `--bg`；侧边「本页目录」若存在则复用 `.cat-live-toc` 样式。

- [ ] **Step 1: 断言基线**：`/style-dark-catalog`、`/button`、`/skills` 任一详情、`/products` 任一详情、`/assets/logo-minimal-wordmark` 深浅两态各截一次 DOM 断言：body 背景 = ground、正文卡面 = `--bg`、demo 区仍强制浅色（`.card-demo.site-preview` computed `color-scheme: light` 不变）。
- [ ] **Step 2: kicker/标题金色化**：详情页 h1 上方分类小标改 `var(--brand)` + 字距（抄样张 `.rd-kicker`），各 DetailView 的头部区块统一。
- [ ] **Step 3: 场景图取景框**：`scene-shot` 外框颜色走 `--border`，确认深色态下 demo 白底取景不违和（样张已验证的机制，仅核对）。
- [ ] **Step 4: 回归**：上一条/下一条、收藏、复制按钮、练习入口在深色态可见可点。
- [ ] **Step 5: `npm run check` + 提交**

```bash
git commit -m "feat(detail): 详情页图鉴外壳——金色 kicker、卡面令牌、取景核对"
```

---

### Task 5: 首页替换 + en 全站同步

**Files:**
- Create: `src/components/HomeView.tsx`（= `$WT/src/components/redesign/RedesignHome.tsx` 改造：数据源换成真实统计与真实列表，路由回主站路径）
- Modify: `src/app/page.tsx`、`src/app/en/page.tsx`、en 侧各列表/详情路由（Task 1–4 的组件是共用的，en 主要是文案与数据源切换）
- Delete: 旧首页区块（不用的组件文件一并删）

**Interfaces:**
- Consumes: Task 1–4 全部。
- Produces: 首页 hero 统计数字在渲染时从 `catalogs.json`/`products.json`/`skills.json` 实算（词条数、风格数等），不写死。

- [ ] **Step 1: 搬运样张首页**，FEATURED 行、产品格、候选风格行全部走真实数据与真实路由（`/topics/...`、`/[slug]`）。
- [ ] **Step 2: en 首页**：同骨架，文案用 en 数据；en JSON 格式约束（单行紧凑、无尾换行）如触发数据改动必须复核末字节。
- [ ] **Step 3: 断言**：`/` 与 `/en` 200；hero 数字 = 数据实算值；卡片缩略图正常；深浅两态；390px 无横向溢出。
- [ ] **Step 4: 全站冒烟**：curl 遍历主要路由（zh+en 各 8 条）全 200；`npm run check` 全绿。
- [ ] **Step 5: 提交 + 删除样张分支服务器**

```bash
git commit -m "feat(home): 首页图鉴化 + en 全站同步，UI 全铺完成"
```

停 3001 样张 dev server；`redesign/ui-v2` 分支保留归档，不合并（内容已按文件搬入 main）。

---

## Self-Review 结论

- Spec 覆盖：spec §1→Task1，§2→Task2，§3→Task3，§4→Task4，§5→Task5，§6 回滚=Global Constraints 每任务一 commit，§7 不做项未出现在任何任务。✅
- Go Pro「即将上线」文案在 Task 2 Step 1 落实。✅
- 类型一致性：`CardDemoThumb(demoHtml?, demoClass?)` 与样张 `RdDemoThumb` 同签名；`.cat-live-toc` 在 Task 3 定义、Task 4 复用。✅
