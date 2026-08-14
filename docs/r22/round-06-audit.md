# R22 Round 06 — 信息架构与文案专题审查（审查员）

日期：2026-08-14 · 线上 https://mcp.zalize.com
方法：全站页面 title/description/H1/面包屑/分类体系/标签系统/About FAQ 逐页 curl 抽取与阅读；/categories 全量 121 分类清点。

## 正面确认（无需修）
- 各页 title/meta description 模式统一且含数量与关键词（首页/servers/skills/分类/详情），SEO 文案质量好。
- 质量等级徽章有 title + aria-label（"Quality grade A (100/100)"）。
- About 有 FAQ（含 FAQPage 结构化数据）；页脚有免责声明与隐私说明，文案诚实（"heuristic signals, not endorsements"）。
- 404/无结果/详情页文案上一轮已达标。

## 发现清单

### F1 [P1][信息架构] 分类体系被数据源污染：121 个分类中约 40 个是"作者向/来源向"伪分类
- 复现：/categories 共 121 个分类，其中 34 个 "Skills by X"（Skills by OpenAI / by Sentry team for their dev team / by falai Team…）+ 语言向（Python Skills / Java Skills / NET Skills / Rust Skills / TypeScript Skills）+ 微分类（CUDA-Q=1 条、Aerospace & Astrodynamics=2 条）。
- 影响：主题 taxonomy（Databases/Security…）与来源 section 名（awesome 列表的章节标题）混在同一维度，用户按主题找 skill 时无法用分类导航；facet 列表同样被污染。
- 思辨（是否有更好设计）：分类应回答"这个工具做什么"，而"谁写的"是另一维度（author/collection）。更好设计是二选一：
  a) 最小改动：/categories 页把 "Skills by X" 与语言集合分组到 "Skill collections" 区块，与主题分类分区展示，facet 侧栏只显示主题分类；
  b) 治本：pipeline 把来源 section 映射到主题分类（如 Skills by Cloudflare → Developer Tools），collection 信息另存为 `collection` 字段单独展示。b) 改动大，建议本轮做 a)，b) 留给数据管线周更时渐进迁移。
- 严重级 P1 理由：这是目录型产品的核心导航维度，影响所有分类入口的可用性。

### F2 [P2][信息架构] /categories 页为无分组平铺列表，121 项无排序逻辑说明、无 server/skill 区分
- 复现：/categories 单个 "All categories" H1 下平铺全部 121 项。
- 建议：与 F1 的 a) 合并处理：主题分类按条目数降序 + Skill collections 分组；每项已有计数，保持。

### F3 [P2][文案] 活跃度标签（Active/Maintained/Stale/Inactive/Archived）全站无定义
- 复现：卡片与详情页的 act-* 徽章无 title/aria-label；About FAQ 无一处解释判定标准（仅 CSS 类名匹配到 stale）。
- 影响：用户不知道 Stale 的阈值（多久没 push？），削弱质量信号的可信度。
- 建议：徽章加 title（如 "Last commit 6–12 months ago"），About FAQ 增补一问 "What do the activity badges mean?"。

### F4 [P2][文案] 首页 title "3,242+ MCP Servers & Agent Skills Directory" 数字语义含混
- 复现：3,242 是 server 数，skills 另有 967，但 title 读起来像"3,242 个（servers+skills）"。
- 建议：改为 "4,200+ MCP Servers & Agent Skills" 或 "3,242 MCP Servers · 967 Agent Skills"；页脚已用后一种精确写法，统一即可。

### F5 [P2][信息架构] 分类详情页无面包屑上级入口（Home › Categories › Databases）
- 复现：/category/databases 的 H1 直接是 "Databases"，crumbs 只有 Home › …（未含 Categories 中间层级）。
- 建议：面包屑补 Categories 一级，让用户能横跳其他分类；一行模板改动。

## 汇总
- P0：0 · P1：1（F1）· P2：4（F2–F5）
- F1+F2 建议合并为一次 /categories 与 facet 渲染层改动（方案 a），不动数据管线；F3/F4/F5 均为小改。

## verdict（等修改员 fix 后线上复验追加）
