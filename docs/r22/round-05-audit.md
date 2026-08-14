# R22 Round 05 — 错误路径与边界专题审查（审查员）

日期：2026-08-14 · 线上 https://mcp.zalize.com
方法：18 条异常 URL curl 状态/延迟矩阵、/api/track 与 /api/stats 方法与畸形载荷测试、超长/注入/emoji/NUL 查询、404 与无结果页 375/1440 截图（docs/r22/screenshots/round-05/）、对照 src/index.ts 代码。

## 正面确认（无需修）
- 404 覆盖正确：/s/不存在、/category/不存在、未知路径均 404，且 404 页有解释文案 +"Back to home"+ 6 张替代推荐卡（体验好）。
- 无结果页有明确文案与建议；排序行仍可用。
- page=0/-5/abc/99999 全部安全 clamp（200，无异常）；q 注入 `"><script>` 被转义；emoji/%%%/NUL 参数不炸。
- q 词数截断线上生效：30 词查询回显 term0–term9（10 词上限，R3-C2 修复持续有效）。
- /api/track：bogus 事件 400、GET 404、畸形 JSON 被 catch 后 no-op（不污染计数）；/api/stats 非 GET 404。
- robots.txt / sitemap.xml / llms.txt / og.png 均 200。

## 发现清单

### E1 [P2][功能/SEO] URL 规范化缺口：尾斜杠与大小写变体返回 404 而非重定向
- 复现：`/servers/` → 404；`/s/CRYSTALDBA-POSTGRES-MCP`、`/S/...` → 404（小写原路径 200）。
- 影响：外部链接常被追加尾斜杠或大小写改写（邮件客户端、社交平台、手输），这些流量直接落 404；也产生潜在重复索引信号。
- 建议：Hono 中加一个兜底：尾斜杠 301 到无斜杠；`/s/:slug` 未命中时尝试 lowercase 后 301。两条规则即可，勿做通用大小写映射表。
- 思辨：是否用 Cloudflare 规则做？在 worker 内做更可控且随代码演进，无需额外实体。

### E2 [P2][功能] /favicon.ico 404
- 复现：`curl -s -o /dev/null -w '%{http_code}' https://mcp.zalize.com/favicon.ico` → 404。
- 影响：HTML 内是 data:SVG 图标，浏览器正常；但书签服务、RSS 阅读器、爬虫、旧客户端会直接请求 /favicon.ico，全部 404（日志噪音+个别场景无图标）。
- 建议：worker 加一条 route 返回 301 到 /og.png 不合适（尺寸语义不对）；更好的是内联一个极小 SVG/ICO 响应（Cache-Control 长缓存），一个 route 十几行。

### E3 [P2][逻辑/架构] /api/track 计数为 KV read-modify-write，非原子；并发丢计数；body 无上限
- 复现：src/index.ts:447-448 `get → parseInt → put(cur+1)`；实测 100KB JSON body 也被解析并 200。
- 影响：并发 beacon 下 last-write-wins 丢增量（匿名指标可接受但应知情）；超大 body 浪费 CPU（Workers 有平台上限兜底，非安全漏洞）。
- 建议：本轮不要求改架构（DO/Analytics Engine 对当前规模是过度设计）；只建议加 `content-length > 1KB 直接 400` 的哨兵一行，并在代码注释明确"计数容忍丢失"。
- 思辨：更好设计是 Workers Analytics Engine（免费、原子、专为此场景），若未来指标要用于决策再迁移；现阶段勿增实体。

### E4 [P2][文案] 404 文案对非条目路径语义不符
- 复现：`/nonexistent-page` 与 `/s/不存在` 显示同一句 "This entry may have been removed in a weekly refresh."——对前者（根本不是条目页）解释错误。
- 建议：404 handler 区分两类：`/s/*` 用现文案；其余用通用 "Page not found"。一处 if 即可。

## 汇总
- P0：0 · P1：0 · P2：4（E1–E4）
- 错误路径整体质量高于常见水平（404 推荐卡、无结果引导、参数防御完备），本轮均为收尾级打磨。

## verdict（等修改员 fix 后线上复验追加）
