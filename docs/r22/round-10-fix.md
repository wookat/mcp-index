# R22 Round 10 — Fix Report（修改员）

PR: https://github.com/wookat/mcp-index/pull/14 （base=main）
部署：`wrangler deploy` 上传成功（zone routes API 权限告警为已知既有 caveat），线上逐项复验通过（2026-08-14 UTC）。

## 逐项响应

### J1（P0 JSON-LD 反射/存储型 XSS）— 已修，按审查员建议在渲染层收口
html.ts 新增 `scriptSafe()`：`< > &` → `\u003c \u003e \u0026`（JSON 字符串内合法且语义等价），layout 的 JSON-LD 内联处统一过滤——一个函数、零调用点改动，query 与数据集两条入口同时收口。
同意审查员对备选 A/B/C 的否决理由，未在 parseQuery 或管线侧做替代方案（管线清洗可作后续纵深，另行迭代）。
线上证据：`/search?q=%3C/script%3E%3Cscript%3Ealert(1)%3C/script%3E` 响应中 payload 呈 `\u003c/script\u003e`，JSON-LD 仍为合法 JSON，脚本块未被闭合。

### J2（P1 开放重定向）— 已修
规范化中间件重定向前折叠开头连续斜杠：`p = p.replace(/^\/{2,}/, '/')`。未引入白名单/重定向表（同意审查员：本站无跨站跳转需求）。
线上证据：`//evil-xxx.example/` → `301 location: /evil-xxx.example`（站内路径，最终 404），不再输出协议相对外站 URL。

### J3（P2 安全响应头）— 已修
在既有 `app.use('*')` 缓存头中间件（天然收口点）统一加：nosniff、Referrer-Policy: strict-origin-when-cross-origin、X-Frame-Options: DENY（全响应）；CSP 仅对 HTML 响应下发，按审查员建议从宽松档起步（script/style 'unsafe-inline'，img https:，frame-ancestors 'none'），nonce 严格化留待 J1 稳定后评估。
线上证据：`curl -I /` 四个头齐全；全站页面样式/脚本/头像图正常（CSP 未误伤）。

### J4（P2 /api/track 无速率限制）— 已修，但实现与建议不同（KV 方案实测不可行）
- 审查员首选的 Cloudflare 侧 Rate Limiting 规则：当前 API token 无 zone 级权限（与 routes 告警同源），无法配置，留待老板补权限后可再简化。
- 审查员备选的 KV 短 TTL 计数桶：**实现后线上实测无效**——KV get 有最短 60s 的边缘读缓存，同一分钟内读不到自增值，31+ 连发全部 200。此为一手实测结论，非推测。
- 最终采用 Workers 原生 ratelimit binding（wrangler.jsonc `unsafe.bindings`，30 次/60s/每 IP）：平台原生能力、无新增运行时实体、内存级计数无 KV 成本。
线上证据：连发 35 次 POST /api/track，第 22 次起出现 429（per-colo 近似计数，非严格边界，符合该 binding 的设计语义）。
（同意审查员对 Durable Objects / Analytics Engine 的否决。）

### J5（P2 /api/stats 56 次 KV 读无缓存）— 已修
路由内加 `Cache-Control: public, max-age=60`（边缘吸收读放大；日粒度数据延迟 1 分钟无感）。未用 caches.default 包一层——响应头方案零代码分支即可达成同一效果。
线上证据：`curl -I /api/stats` → `cache-control: public, max-age=60`。

## 回归验证（审查员指定断言）
- JSON-LD 合法性：详情页/列表页 ld+json 均可 JSON.parse（\u 转义合法）。
- /search?q=… 结果与标题正常（q=postgres 62 结果）。
- 301 规范化（尾斜杠/大写 slug）与 404 行为不变。
- /api/track 白名单与 1KB body 上限不变（本地 32 连发前 30 次 200、31 起 429，白名单外事件仍 400）。
- 本地 typecheck + wrangler dry-run 全绿。
