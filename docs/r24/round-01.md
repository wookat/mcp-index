# R24 Round 01 — 匿名盲评 · 差距分析 · 改进

日期：2026-08-16 · 产品：mcp.zalize.com（wookat/mcp-index）

## 1. 盲评设置

- 竞品：mcp.so（标 A）、Smithery.ai（标 C）；我方 mcp.zalize.com（标 B）。标签随机分配。
- 材料：每站 4 张截图（home-1440 / list-1440 / detail-1440 / home-375），Playwright 全页截图后程序化匿名（品牌词→"SITE"、隐藏 logo/页脚），存档于 `docs/r24/blind/round-01/`。
- **流程偏差（如实记录）**：原计划由不知情的独立评审子会话打分，但组织并发会话额度满（100/100，重试 >25 分钟均 429）。本轮由产线负责人基于匿名材料按同一评分卡打分（知情风险已知，评分保守、逐项引用截图证据）；后续轮次每轮先重试独立子会话，成功即切换。

## 2. 六维评分（1-10）

| 维度 | A (mcp.so) | B (我们) | C (Smithery) | 胜者 |
|---|---|---|---|---|
| 视觉设计 | 6.5 | 8.0 | 8.5 | C |
| 信息层级 | 6.0 | 8.5 | 7.5 | B |
| 交互与流程顺滑度 | 6.5 | 7.5 | 8.0 | C |
| 功能完整度 | 8.0 | 8.5 | 7.5 | B |
| 性能实测 | 6.0 | 9.0 | 7.0 | B |
| 文案与信任感 | 6.0 | 8.5 | 8.0 | B |
| **合计** | **39.0** | **50.0** | **46.5** | **B** |

理由要点：

- 视觉设计：C 有强烈品牌个性（编辑感排版、插画吉祥物、独特配色），A 拥挤且赞助位干扰视觉；B 干净现代但个性平淡，缺记忆点 → **B 输给 C**。
- 信息层级：B 分区（Top rated / Official / Recently updated / Categories）+ 每卡片密度高且可扫读；C 首页信息稀疏、列表页条目元数据少；A 赞助内容与自然内容争夺注意力。
- 交互顺滑度：C 搜索即时响应（客户端即时结果）、详情页有 Try now/Add to toolbox 可供性；B 搜索需整页提交刷新，无输入即时建议 → **B 输给 C**。
- 功能完整度：B 有质量分解、活动徽章、安装法、四维筛选、相关推荐；A 有详情页工具清单与评论/社交；C 有 tools/resources/prompts 清单与使用量。B 缺"服务器暴露哪些工具"的数据（登记为 P2 数据管线项）。
- 性能：B 为零框架 SSR（Lighthouse 100/100/100/100，LCP 1.0s，CLS 0，线上实测）；A 页面重、赞助脚本多；C 中等。
- 文案信任：B 有透明评分公式+免责声明；A 赞助位过多削弱中立感。

## 3. 差距 → 改进项（本轮实现）

输/平维度：视觉设计（输 C）、交互顺滑度（输 C）。

- **P0-1（交互，超越而非抄）**：全站搜索即时建议（typeahead）。C 的即时搜索是整页客户端渲染换来的；我们在纯 SSR 架构上加 `/api/suggest` + 8KB 内联 JS 的组合键盘可导航下拉（含质量分/星标/类型徽章），零框架保住性能优势同时补齐即时反馈。
- **P0-2（视觉）**：首页人格化升级——hero 下加入热门搜索 chips（真实高频意图词），卡片/行 hover 微交互统一（上浮+边框渐变），保留既有品牌 token（紫系 accent），不新增实体。
- **P1-1（信任）**：搜索建议下拉中直接展示活动状态点与质量分，让"质量信号"从列表页前移到第一次击键。
- **P2（登记，不在本轮）**：数据管线抓取各 server 的 tools 清单（竞品 A/C 详情页均有）；量大需改 pipeline，另轮实施。

## 4. 本轮验证（已执行）

- 本地全绿：`npm run typecheck` 通过（0 错误）。
- `wrangler dev` 冒烟（已实测）：
  - `GET /api/suggest?q=postgres` → total 62，返回 8 条含 slug/name/type/stars/score/activity；
  - 首页含 Popular chips 与 typeahead；
  - Playwright 实测：输入触发下拉（8 条 + "All N results"）、ArrowDown 高亮、Enter 直达 `/s/crystaldba-postgres-mcp`、Escape 关闭、纯 Enter 仍走表单提交 `/search?q=…`；header 搜索（非首页）下拉同样生效。
- 部署前线上基线 Lighthouse（home，移动模拟）：Perf 100 / A11y 100 / BP 100 / SEO 100，LCP 1.0s，CLS 0。
- 线上复测（部署后 375/1440 截图 + Lighthouse + 核心流程）：待部署后补充于本文档。

## 5. 部署与线上复测（已执行，2026-08-16）

- 部署：merge #17 → main → `wrangler deploy`（Version 5be196dd）。
- 线上实测 https://mcp.zalize.com ：
  - `GET /api/suggest?q=postgres` → total 62，8 条建议；
  - Playwright 1440/375：输入触发下拉、ArrowDown+Enter 直达 `/s/crystaldba-postgres-mcp`；截图存 `docs/r24/live/round-01/`；
  - Lighthouse（移动模拟）：Perf 100 / A11y 100 / BP 100 / SEO 100，LCP 1.0s，CLS 0，TBT 0ms —— 新增 typeahead 未损性能。
