# R14 竞品对标拆解 — MCP 目录站设计规范

日期：2026-08-04 · 调研方式：真实浏览器逐页实测截图（smithery.ai、glama.ai）。
pulsemcp.com 与 mcpmarket.com 均有 Cloudflare 反爬拦截（403），未纳入实测。

选定对标：**Smithery（smithery.ai）** — MCP 目录/运行时头部，4,100+ servers，社区口碑最高；
**Glama（glama.ai/mcp/servers）** — 68,000+ servers 的最大规模目录，facet 筛选体验最完整。

## 1. Smithery 设计规范拆解

### 信息架构
- 顶级导航：MCPs / Skills / Docs / Pricing / Publish / Toolbox / Login，**搜索框常驻 header**（列表页）
- 路由：`/servers`（列表+侧栏筛选）→ `/servers/:slug`（详情，tab 分区 Overview / Performance / Usage / Integrate）
- 列表页三栏：左侧 Filters/Categories 侧栏（~200px）· 中间结果列表 · 右侧 Featured 栏

### 布局栅格与排版
- 内容宽 ~1200px 居中；列表为**行卡片**（非网格）：图标(40px) + 标题行(名称+认证徽章) + slug·uses 计数 + 2 行描述截断
- 标题衬线感强（Georgia 系），正文 system sans；H1 ~36px/800，卡片标题 15–16px/700，辅助文字 13px
- 结果计数行："4,104 servers found (331ms)" — **展示检索耗时**，传达性能感

### 配色（浅色暖调）
- 背景 #f5f1ea（米白）、卡片 #fbf9f5、边框 #e5dfd3
- 强调色橙 #e35c26（logo、认证徽章、主按钮）、文字 #1a1a1a / 次级 #6b6b6b
- 底部有 Light/System/Dark 主题切换器

### 组件样式
- 卡片：1px 边框 + 8–10px 圆角，hover 轻微加深边框；"Add to toolbox" 幽灵按钮右置
- 徽章：官方=橙色小盾牌图标（图形而非文字），Verified=蓝勾
- 详情页统计 chips：`90/100`、`11.5k calls`、`100% uptime` 圆角胶囊
- 代码块：浅底 + Copy 按钮；分步安装指令（1. Install CLI → 2. … → 3. …）
- 右侧元数据栏：Repository / Homepage / Published / License / Tool Calls（含 sparkline 折线）

### 交互细节
- 侧栏分类点击即筛选（语义搜索 query）；分页 Previous 1 2 3 … 24 Next
- 详情 tab 锚点滚动；工具列表可展开（accordion）
- 移动端：侧栏收起，列表单列

### SEO 结构
- 每 server 独立 URL、`<h1>` 唯一、meta 完整；面包屑（Glama 更明显）

## 2. Glama 设计规范拆解

- **深色主题**：#0d1117 系背景、卡片 #161b27、精细 1px 边框
- 左侧 **facet 侧栏带计数**：Remote 29,310 · Python 28,692 · TypeScript 24,435 · Local · Tools · 分类 …（点击即筛）
- 卡片内 **质量评级徽章**：license Ⓐ / quality Ⓐ / maintenance Ⓒ 三维字母评级 — 质量透明化
- 头部数据行："68,303 servers. Last updated 2026-08-04 20:00 🟢" — **新鲜度承诺**
- 面包屑 Glama › MCP › Servers；排序下拉（Search Relevance ↓）；Deep Search 入口
- 卡片 footer：license 名称、平台图标、last updated、下载/星/fork 计数图标组

## 3. 对我站（改造前）的差距诊断

| 维度 | 竞品水准 | 我站现状 | 差距 |
|---|---|---|---|
| 列表布局 | 侧栏 facet 筛选 + 行卡片 | 顶部 select 下拉 + 3 列网格 | 筛选可发现性差、select 原生丑 |
| 筛选计数 | facet 全部带 count | 仅分类有 count | 无法预判结果规模 |
| 结果反馈 | "4,104 found (331ms)" | 仅 total | 缺性能感与信任感 |
| 项目图标 | 40px 品牌图标 | 无图标 | 列表识别度低 |
| 详情页 | tab 分区+右侧元数据栏+sparkline | 单列平铺 | 信息层次弱 |
| 评分透明 | Glama 三维字母评级 | 单一 0-100 数字 | 无法解释分数构成 |
| 排版 | 精细字阶+衬线标题（Smithery） | 单一字阶 | 质感差 |
| 主题 | 主题切换 / 精细暗色 | 单一暗色（偏蓝紫） | 可保留暗色但 token 需现代化 |
| 移动端 | 侧栏收起、单列、搜索常驻 | 基本可用 | 筛选在移动端体验差 |

## 4. 复刻要点（本轮落地清单）

1. shadcn/zinc 风格设计 token 重写（背景/卡片/边框/前景四级灰阶 + 单一 accent）
2. 列表页改**左侧 facet 侧栏**（类型/分类/语言/活跃度/安装方式全部带计数，当前项高亮，移动端 `<details>` 收起）
3. 行卡片布局：字母头像 + 名称 + repo + 徽章 + 描述 2 行 + meta（★/语言/更新/评分）
4. 结果行："N results (X ms)" 检索耗时
5. 详情页：头部大头像 + 统计 chips（score/stars/last commit/license）+ 右侧元数据栏 + **评分构成明细条**（透明方法论，超越点）+ 分步安装代码块 copy
6. header 常驻搜索框（非首页）；移动端汉堡导航
7. 排版字阶系统、衬线式 hero 标题、更细腻的间距

## 5. 比竞品更好的点（差异化，见 R14-better-than.md）
