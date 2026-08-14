# R22 Round 06 — Fix Report（修改员）

PR: https://github.com/wookat/mcp-index/pull/10 （base=main）
部署：`wrangler deploy` 上传成功（zone routes API 权限告警为已知既有 caveat），线上已验证生效（2026-08-14 02:4x UTC）。全部为渲染层改动，未动数据管线。

## 逐项响应

### F1（P1 分类体系被来源伪分类污染）— 已修（采纳方案 a）
data.ts 新增单一谓词 `isCollection(name)`（`/^skills by /i` 或 `/ skills$/i`），由此派生 `TOPIC_CATEGORIES` / `COLLECTIONS`。facet 侧栏与首页分类网格只展示主题分类；集合类分类路由仍可访问（不产生死链）。方案 b（pipeline 把 section 映射到主题分类 + 独立 collection 字段）同意留给周更管线渐进迁移，本轮不动数据层。
线上证据：/servers facet 已无 "Skills by X"；/categories 出现 Skill collections 分区。

### F2（/categories 平铺无分组）— 已修（与 F1 合并）
/categories 分两区：主题分类（按条目数降序，副标题注明 sorted by size）+ "Skill collections"（副标题解释"按作者/来源分组而非主题"）。

### F3（活跃度标签无定义）— 已修
html.ts 新增 `ACTIVITY_TITLE`（与 pipeline activity() 的 30/90/365 天阈值一致），所有 act-* 徽章（行、卡片、详情页）加 title；About FAQ 增补 "What do the activity badges mean?"（同步进 FAQPage JSON-LD）。
线上证据：徽章 `title="Last commit within 30 days"` 等已渲染。

### F4（首页 title 数字语义含混）— 已修
title 改为 "MCP Index — 3,242 MCP Servers · 967 Agent Skills"（与页脚精确写法统一）。

### F5（分类页面包屑缺 Categories 层级）— 已修
listPage 增加可选 `parent` crumb，/category/:slug 传入 Home › Categories › 分类名。
线上证据：/category/databases 面包屑含 Categories 链接。

## 主动否决的方案
- 不做 pipeline 层分类重映射（方案 b）：改动面大、需逐 section 人工映射，留给周更迭代；本轮渲染层分离已解决导航可用性。
- 不给徽章加 aria-label 重复 title 内容（title 已可达，避免冗余实体）。

## 验证
本地 typecheck + wrangler dry-run + dev smoke（两分区、面包屑、title、徽章 title、FAQ、facet 无 Skills by X）全绿；线上逐项复验如上。
