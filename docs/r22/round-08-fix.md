# R22 Round 08 — Fix Report（修改员）

PR: https://github.com/wookat/mcp-index/pull/12 （base=main）
部署：`wrangler deploy` 上传成功（zone routes API 权限告警为已知既有 caveat），线上逐项复验通过（2026-08-14 UTC）。

## 逐项响应

### H1（P2 分页页 canonical 指向第 1 页）— 已修
listPage 计算钳制后的 `page`（Math.min(Math.max(1,q.page), pages)），layout path 在 page>1 时带 `?page=N`；筛选参数继续收敛到干净路径（保持 facet 空间不可爬）。顺带治本：越界页（?page=99999）canonical 现指向真实末页（?page=68）而非不存在的页码；pager 与 ItemList position 也改用钳制页。
线上证据：/servers?page=2 → canonical …/servers?page=2。

### H2（P2 /search 可被收录）— 已修
robots.txt 加一行 `Disallow: /search`；未动 /servers、/category/*（真实着陆价值）。首页 WebSite SearchAction JSON-LD 按建议保留。

### H3（P2 aggregateRating 违反 review 政策）— 已修（采纳 interactionStatistic 方案）
删除 aggregateRating，改为 `interactionStatistic: { InteractionCounter, LikeAction, userInteractionCount: stars }`——合规表达同一热度信号而非丢弃。同意审查员思辨：目录站长期依赖搜索流量，富结果星星的 CTR 收益不值结构化数据处罚的尾部风险。
线上证据：详情页 JSON-LD 已无 aggregateRating、含 interactionStatistic。

### H4（P2 sitemap lastmod 全量同一天）— 已修
/s/* URL 的 lastmod 改用该条目 pushedAt（数据集既有字段，零新增实体）；列表/分类页保留刷新日。
线上证据：sitemap 中 distinct lastmod 由 1 个日期变为 474 个。

## 验证
本地：typecheck、wrangler dry-run 全绿；wrangler dev 冒烟逐项确认 H1–H4。
线上：如上逐项 curl 复验通过。
