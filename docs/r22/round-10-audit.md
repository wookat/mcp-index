# R22 Round 10 — 安全与滥用专题审查（审查员）

日期：2026-08-14 · 线上 https://mcp.zalize.com · 基于 origin/main ca5466a
方法：反射/存储 XSS 探测（含真浏览器执行验证）、注入点上下文审计（HTML vs JSON-LD vs URL）、开放重定向、响应头基线、/api/* 滥用与成本面、HTTP 方法与超大 body。

## 正面确认（无需修）
- HTML 正文注入面已系统性转义：facet 链接、面包屑、h1、搜索框 value 全走 `esc()`，`<img src=x onerror=…>` 反射为 `&lt;img …&gt;`（不执行）。
- /api/track 有 1KB body 上限且 `Transfer-Encoding: chunked` 绕过尝试同样 400；`ev` 白名单生效；KV key 有 400 天 TTL。
- /api/stats 只暴露聚合匿名计数与数据集统计，无 PII、无 IP/UA 采集，符合 CHARTER 不碰 PII。
- 未定义方法/路径正确 404（DELETE /servers、OPTIONS /api/track），无 CORS 头（默认同源，正确）。

## 发现清单

### J1 [P0][安全] JSON-LD 反射型 XSS：`</script>` 可闭合脚本块并执行任意 JS
- 复现（已在真浏览器确认执行，非理论）：
  `https://mcp.zalize.com/search?q=%3C/script%3E%3Cscript%3Ewindow.__x%3D1%3Balert(1)%3C/script%3E`
  → 弹窗 `1`，`window.__x === 1`。截图：docs/r22/screenshots/round-10/xss-jsonld.png
- 根因：html.ts:237 把 `JSON.stringify()` 结果直接内联进 `<script type="application/ld+json">`。JSON 转义不转义 `<`/`>`，HTML 解析器先于 JSON 解析看到 `</script>` 即结束脚本块。ItemList 的 `name: "Search: " + q` 把用户输入送入该上下文（index.ts:137/192）。
- 影响面（比单个反射链接更严重）：同一注入点还消费**数据集字段**（条目 name/description/category、breadcrumb、FAQ）。周更管线从 GitHub 抓取 description，任何仓库把 `</script><script>…` 写进 description 或 topics，就会变成**全站存储型 XSS**，命中所有访客且无需诱导点击。当前数据集恰好无 `<` 危险载荷（已核 index.json/entries-raw.json），属运气而非防御。
- 攻击价值：可挂载钓鱼（伪造安装命令劝诱用户 `curl | sh`）、篡改复制到剪贴板的安装命令——对"开发者复制命令执行"这一核心工作流是直接的供应链型危害。
- 修复建议（治本，一处收口）：在 html.ts 的 JSON-LD 内联处统一做脚本上下文转义，例如
  `String(j).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026')`（`\u003c` 在 JSON 字符串中合法且语义等价，结构化数据解析不受影响）。
- 思辨「是否有更好的方式」：
  - 备选 A：在 parseQuery 里剥离 `<>` —— 否决。只堵住 query 一个入口，数据集入口仍敞开；且属"想一点改一点"。
  - 备选 B：管线侧清洗 description —— 否决为**单独**方案。清洗有价值但属第二层，Worker 渲染层仍必须自防（数据可来自任何未来源）。
  - 备选 C：加 CSP 兜底 —— 见 J3，属纵深防御，不能替代转义（内联 JSON-LD 本身需 script 白名单）。
  - 结论：唯一正确的收口点是 html.ts 序列化处（一个函数、零调用点改动），与 R7「同一知识只写一遍」一致。

### J2 [P1][安全] 开放重定向：协议相对路径被 301 到外站
- 复现：`curl -I "https://mcp.zalize.com//example.com/"` → `301 location: //example.com`；`curl -L` 最终落地 `https://example.com/`。
- 根因：规范化中间件把 `//example.com/` 去尾斜杠得到 `//example.com`，`c.redirect()` 原样输出，浏览器按协议相对 URL 解析为外站。
- 影响：本站域名可被用作钓鱼跳板（邮件里 `mcp.zalize.com//attacker.tld/` 看起来是可信域），也污染 SEO 与品牌信任。
- 建议：中间件在重定向前把开头连续斜杠折叠为一个（`p = p.replace(/^\/{2,}/, '/')`），或对含 `//` 前缀的路径直接 404。
- 思辨：不建议引入白名单/重定向表——本站没有任何合法的跨站跳转需求，折叠斜杠即彻底消除该类，如无必要勿增实体。

### J3 [P2][安全/纵深] 全站缺安全响应头（CSP / X-Content-Type-Options / Referrer-Policy / X-Frame-Options）
- 复现：`curl -I /` 仅有 cache-control，无上述任一头。
- 影响：J1 这类注入无兜底；MIME 嗅探与 referrer 泄漏（搜索词随 referrer 带到外部 GitHub 链接）无约束；页面可被任意站点 iframe 包装做钓鱼。
- 建议：在现有 `app.use('*')` 中间件（已负责缓存头，天然的收口点）统一加：`X-Content-Type-Options: nosniff`、`Referrer-Policy: strict-origin-when-cross-origin`、`X-Frame-Options: DENY`，CSP 从报告模式起步（`default-src 'self'; script-src 'self' 'unsafe-inline'; img-src 'self' data: https:`，站内有内联 JSON-LD 与内联脚本，先别一步到严格 nonce）。
- 思辨：CSP 严格化（nonce/hash）会牵动内联脚本与 JSON-LD 的产出方式，收益/改动比在当前阶段不划算；先上三个零风险头 + 宽松 CSP，等 J1 修好后再评估收紧。

### J4 [P2][滥用/成本] /api/track 无速率限制，匿名计数可被任意灌注
- 复现：连续 3 次 `POST /api/track {"ev":"pageview"}` 全部 200，无节流；线上 /api/stats 今日 pageview 已含本审查产生的计数。
- 影响：单脚本即可把 KV 写满噪声（指标失真、决策被污染）并放大 KV 写成本；同时 read-modify-write 在并发下丢计数（R5 已知残留）。
- 建议（克制方案）：Cloudflare 侧对 `/api/track` 配一条 Rate Limiting 规则（每 IP 每分钟 N 次）——零代码、不引入新实体；若必须在代码内，则用 `cf-connecting-ip` 做 KV 短 TTL 计数桶。
- 思辨：不建议为此上 Durable Objects 或 Analytics Engine——指标是 nice-to-have，不值得为它增加运行时实体与状态复杂度（与 R7 结论一致）。

### J5 [P2][滥用/成本] /api/stats 无缓存头，每次请求触发 56 次 KV 读
- 复现：`curl -I /api/stats` 无 cache-control（中间件明确跳过 /api/），页面每次加载都可打；数据本质是按天聚合、分钟级新鲜度足够。
- 影响：可被低成本刷成 KV 读放大（56×QPS），是成本面最便宜的攻击点。
- 建议：给 /api/stats 加 `Cache-Control: public, max-age=60`（Cloudflare 边缘即可吸收绝大部分），或用 `caches.default` 包一层。当日计数延迟 1 分钟对该页毫无影响。

## 汇总
- P0：1（J1）· P1：1（J2）· P2：3（J3–J5）
- 优先级：J1 必须最先修且必须在渲染层收口（存储型风险面已敞开）；J2 一行折叠；J3–J5 为纵深与成本面，可同 PR。
- 回归断言（修复后必须仍成立）：JSON-LD 仍是合法 JSON（Rich Results 可解析）、`/search?q=…` 结果与标题正常、301 规范化与 404 行为不变、/api/track 白名单与 1KB 上限不变。

## verdict（等修改员 fix 后线上复验追加）

## Round 10 verdict（2026-08-14 线上复验）
- J1 PASS（P0 已闭合）：真浏览器复测 `/search?q=</script><script>window.__x=1;alert(1)</script>` 无弹窗、`window.__x` 为 undefined；响应中 payload 呈 `\u003c/script\u003e`；首页/列表/详情/搜索页共 5 个 ld+json 块全部 JSON.parse 通过（Rich Results 解析不受影响）。数据集入口同处收口，存储型风险面一并关闭。
- J2 PASS：`//example.com/` → `301 location: /example.com`（站内相对），跟随后落地 mcp.zalize.com 自身 404，不再出站。
- J3 PASS：`/` 四个头齐全（CSP default-src 'self' + frame-ancestors 'none'、nosniff、Referrer-Policy、X-Frame-Options DENY）；真浏览器复扫页面样式/头像/内联脚本均正常，CSP 无误伤。
- J4 PASS：并发 60 连发第 1 次即出现 429、后段几乎全 429；随后顺序 40 连发同样大量 429。注意（非 FAIL）：低速顺序请求（~1 req/s、跨 colo）可全部 200 通过——per-colo 近似计数的固有语义，足以阻断脚本化灌注，慢速灌注仍可行，记为可接受残留。
- J5 PASS：`/api/stats` 返回 `cache-control: public, max-age=60`。
- 回归断言全部成立：track 白名单（ev=evil → 400）与 1KB 上限（400）不变、`/servers/` → 301 `/servers`、未知路径 404、`/search?q=postgres` 62 结果正常。
5/5 PASS（含 1 项 P0），无 FAIL 项进入下一轮。
