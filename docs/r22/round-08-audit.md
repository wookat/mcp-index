# R22 Round 08 — SEO/发现性专题审查（审查员）

日期：2026-08-14 · 线上 https://mcp.zalize.com
方法：canonical/robots/meta/JSON-LD/sitemap/og/IndexNow 逐项 curl 实测；对照 Google 现行文档（分页、内部搜索页、review 结构化数据政策）。

## 正面确认（无需修）
- sitemap.xml 4,335 URL / 443KB（远低于 50k/50MB 限制）、robots.txt 规范（Disallow /api/ + Sitemap 声明）、IndexNow key 文件 200。
- 详情页 canonical 自引用；筛选组合页（?lang= 等）canonical 收敛到干净路径——正确避免了 facet 无限爬取空间。
- og.png 200（54KB）、twitter:card、FAQPage/BreadcrumbList/ItemList JSON-LD 齐备；outbound GitHub 链接带 rel="noopener nofollow"。
- R5 的尾斜杠/大小写 301 与 R6 的 title 修正均直接利好 SEO。

## 发现清单

### H1 [P2][SEO] 分页页 canonical 指向第 1 页（/servers?page=2 → canonical /servers）
- 复现：`curl /servers?page=2` → `<link rel="canonical" href="…/servers">`。
- 影响：Google 现行指南要求分页页自引用 canonical（rel=prev/next 已废弃后更是唯一信号）；指向第 1 页会让深页不被收录、削弱深页条目的内链发现。当前有 sitemap 全量兜底，条目页收录不受致命影响，故 P2。
- 建议：layout 的 path 参数带上 page>1 时的 `?page=N`（仅 page，其他筛选参数继续收敛）。

### H2 [P2][SEO] 内部搜索结果页（/search?q=…）可被收录：robots 未禁、无 noindex
- 复现：/search?q=postgres 返回 canonical=/search，无 robots meta；robots.txt 只禁 /api/。
- 影响：内部搜索页是 Google 明确的低质量/薄内容来源；q 组合无限，浪费抓取预算。canonical 收敛到 /search 已缓解重复收录，但更规范是显式排除。
- 建议：robots.txt 加 `Disallow: /search`（一行）；WebSite SearchAction JSON-LD 可保留（sitelinks searchbox 虽已废弃但无害）。注意勿禁 /servers、/category/*（有真实着陆价值）。

### H3 [P2][SEO/合规] 详情页 aggregateRating 把 GitHub stars 当用户评分（ratingValue=score/20, ratingCount=stars）
- 复现：/s/:slug JSON-LD SoftwareApplication 含 aggregateRating（index.ts:392）。
- 影响：Google review snippet 政策要求评分来自真实用户评价；把 stars 映射成五星评分属违规使用，存在结构化数据人工处罚（全站富结果失效）的尾部风险。
- 建议：删除 aggregateRating 字段（保留 SoftwareApplication 主体），或改用不受 review 政策约束的 `interactionStatistic`（UserLikes=stars）表达同一信息。
- 思辨：富结果星星带来的 CTR 收益 vs 处罚风险——目录站长期靠搜索流量，合规优先，建议删。

### H4 [P2][SEO/小] sitemap 所有 URL 的 lastmod 一律=数据刷新日
- 复现：sitemap 中 4,335 条 lastmod 同一天，每周全量跳变。
- 影响：lastmod 失去分辨力，爬虫无法优先抓真正变化的条目；Google 会降低对不可信 lastmod 的信任。
- 建议：详情页 URL 用该条目 pushedAt（数据集已有字段）做 lastmod，列表页保留刷新日。

## 汇总
- P0：0 · P1：0 · P2：4（H1–H4）
- H2/H3 是政策合规向（防风险），H1/H4 是收录质量向；四项皆小改，可一个 PR 完成。

## verdict（等修改员 fix 后线上复验追加）

## Round 08 verdict（2026-08-14 线上复验）
- H1 PASS：/servers?page=2 canonical 自引用带 ?page=2；越界 ?page=99999 → canonical ?page=68（钳制治本）；筛选参数继续收敛（?lang=Python&page=2 → ?page=2）。
- H2 PASS：robots.txt 已含 `Disallow: /search`，/servers、/category/* 未受影响。
- H3 PASS：详情页 JSON-LD 已无 aggregateRating，含 interactionStatistic/InteractionCounter。
- H4 PASS：sitemap distinct lastmod 实测 474 个日期（原 1 个）。
4/4 PASS，无 FAIL 项进入下一轮。
