# R16 自审差距 backlog（按主要矛盾排序）

日期：2026-08-07 · 自审方式：线上逐页实测（1440px+375px 截图见 `docs/screenshots/r16/before-*.png`）+ Lighthouse + 对照 `r16-competitor-advantages.md` 逐条打分。

## 站点清单

**页面模板 8 个**：`/`（首页）、`/servers`、`/skills`、`/search`、`/categories`、`/category/:slug`（37 分类）、`/s/:slug`（4,100+ 详情页）、`/about`；另有 404 页、`/robots.txt`、`/sitemap.xml`、`/api/track`、`/api/stats`。
**组件 21 个**：sticky header、header 搜索框、hero、大搜索框、stats 胶囊、card 网格卡、行卡片 row、facet 侧栏、移动端 mfacets、toolbar/排序、结果计数行、分页器、面包屑、catgrid、详情头（头像/徽章）、statchips、安装代码块+copy、评分构成明细、topics chips、详情侧栏、footer。

## 技术审计（实测数据）

| 项 | 首页 | /servers | 结论 |
|---|---|---|---|
| Lighthouse Performance | 100 | 100 | ✅ 保持 |
| Accessibility | 93 | 89 | ❌ color-contrast（--faint #6e6e78 3.7:1）、heading-order（facet h4 跳级）、link-in-text-block |
| Best practices | 100 | — | ✅ |
| SEO | 100 | 100 | 分数满但缺 og:image / BreadcrumbList / FAQPage / ItemList 结构化数据 |
| 全路由状态 | 全部 200，404 正常 | | ✅ |
| 移动端 375px | 无横向溢出（R14 已修） | | ✅ 保持 |
| 全页 HTML | 37.6KB（首页） | | ✅ 远优于竞品 |

## 对照优点清单打分（1=完全缺失 5=达标或更优）

| 优点（出处见 advantages 文档） | 我站现状 | 分 | 伤害面 |
|---|---|---|---|
| 12. og:image 社交分享卡 | 无 og:image，twitter=summary | 1 | **分发/CTR（主要矛盾）** |
| 1. 字母评级徽章 | 仅 0-100 数字 | 2 | 转化（扫描性/信任） |
| 3. Official 可筛选/前置 | 仅详情徽章，不可筛 | 2 | 转化（选型第一条件） |
| 9. 结构化数据（Breadcrumb/FAQ/ItemList） | 仅 WebSite+SoftwareApplication | 2 | 收录/富摘要 |
| a11y 对比度/标题层级 | 3 处 Lighthouse fail | 2 | 留存+SEO 信号 |
| 2. Agent-first 入口（llms.txt） | 无 | 1 | 新分发渠道 |
| 5. 搜索快捷键提示 | placeholder 内小字 "( / )" | 3 | 留存（小） |
| 14. 404 推荐条目 | 仅回首页按钮 | 2 | 留存（小） |
| 8. 新鲜度显式承诺 | 首页 eyebrow 有，列表页无 | 3 | 信任（小） |
| 4. 采用信号（forks） | 详情不显示 forks | 3 | 信任（小） |
| 11. facet 全计数 | 全维度计数 | 5 | ✅ 相对优势 |
| 7. Featured 区块 | Top rated 已有 | 4 | — |
| 13. 深浅双主题 | 单暗色 | 2 | P2 登记 |
| 6. 分类彩色磁贴 | 单色 catgrid | 3 | P2 登记 |

## Backlog（矛盾论排序：最伤分发→转化→留存）

### P0（本轮必做并上线）
1. **og:image + twitter summary_large_image**（伤分发 CTR 最重）：品牌 1200×630 分享图，全站 meta 注入。
2. **质量字母评级 A–F**：由 score 推导，列表行卡片 + 首页卡片 + 详情页统一展示（对标 Glama/LobeHub）。
3. **Official facet + 首页 Official picks 区块**：官方条目可筛可发现（对标 OpenTools/mcpservers.org）。
4. **a11y 修复**：--faint 对比度提到 ≥4.6:1；facet h4→正确层级；link-in-text-block 下划线。目标 a11y ≥97。
5. **SEO 结构化数据**：详情页 BreadcrumbList、/about FAQPage、列表页 ItemList。

### P1（本轮做）
6. **/llms.txt** agent 入口 + footer 露出（对标 LobeHub agent-first）。
7. **搜索快捷键 kbd 角标**（`/`）+ 支持 Ctrl/⌘+K 聚焦。
8. **404 页热门条目推荐**（对标 Smithery 404）。
9. **列表页 toolbar 露出数据更新时间**（对标 Glama 新鲜度承诺）。
10. **详情侧栏加 forks 采用信号**。

### P2（登记，下轮否定之否定再检验）
11. 深浅双主题切换（Smithery）。
12. 分类彩色磁贴/图标（mcp.so）。
13. 详情页 tab 分区 + 工具列表抓取（需扩数据管道抓 tools 清单，Glama/Smithery 有）。
14. 安装量/真实使用量信号（需自建代理或接第三方，暂无数据源）。

## 本轮否定了上一版（R14）的什么

- R14 认为「单一 0-100 透明评分优于 Glama 字母评级」——实测多站后否定：数字精确但扫描性差，合题=保留透明构成明细、外层加 A–F 字母徽章（两者兼得）。
- R14 认为「meta 完整=SEO 达标」（Lighthouse SEO 100）——否定：满分≠富摘要，缺 og:image/Breadcrumb/FAQ 结构化数据，分享卡与富摘要是分发主要矛盾。
- R14 认为「暗色 zinc token 对比度足够」——Lighthouse 实测否定：--faint 3.7:1 未达 WCAG AA。
- R14 认为目录用户=人类开发者——LobeHub 实测否定：agent 也是一等用户，需机器可读入口（llms.txt）。
