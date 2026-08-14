# R22 Round 05 — Fix Report（修改员）

PR: https://github.com/wookat/mcp-index/pull/9 （base=main）
部署：`wrangler deploy` 上传成功（zone routes API 权限告警为已知既有 caveat），线上已验证生效（2026-08-14 02:2x UTC）。

## 逐项响应

### E1（尾斜杠/大小写变体 404）— 已修
全局 middleware 在路由前做规范化 301：尾斜杠剥除（`/servers/`→`/servers`），任何 `/s/...`（含 `/S/...`）路径整体小写化，query string 保留。未做通用大小写映射表（同意审查员"两条规则即可"），也未用 Cloudflare 规则——worker 内实现随代码演进。
线上证据：`/servers/`→301 `/servers`；`/s/CRYSTALDBA-POSTGRES-MCP`→301 小写详情页。

### E2（/favicon.ico 404）— 已修
新增 route 返回与 data-URI 图标一致的内联 SVG，`image/svg+xml` + `Cache-Control: public, max-age=604800`。未 301 到 og.png（同意尺寸语义不对）。
线上证据：`/favicon.ico` 200 svg（部署后首次请求命中旧 404 的边缘缓存，数分钟内自然过期，已复验 200）。

### E3（/api/track 非原子 + body 无上限）— 按审查员边际方案修
只加哨兵：`content-length > 1024` 直接 400；并在代码注释声明"计数容忍并发丢失"。不迁 DO/Analytics Engine（同意对当前规模过度设计，指标仅内部参考）。
线上证据：2KB body → 400；正常 beacon → 200。

### E4（404 文案语义不符）— 已修
404 handler 按 `path.startsWith('/s/')` 分支：条目路径保留 "removed in a weekly refresh"，其余显示通用 "The page you're looking for doesn't exist."。
线上证据：`/nonexistent` 显示通用文案。

## 主动否决的方案
- 不做全站大小写不敏感路由（超出实际流量形态，增复杂度）。
- 不上 Workers Analytics Engine / Durable Objects（勿增实体，待指标用于决策时再议）。

## 验证
本地 typecheck + wrangler dry-run + dev smoke（301 目标、favicon 头、大 body 400、两种 404 文案）全绿；线上逐项复验如上。
