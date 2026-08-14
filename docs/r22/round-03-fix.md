# R22 Round 03 — Fix Report（修改员）

PR: https://github.com/wookat/mcp-index/pull/7 （base=main，合并留待老板/平台）
部署：已从修复分支执行 `wrangler deploy`，线上已验证生效（2026-08-14 02:0x UTC）。本轮无数据集内容变化（仅剔除字段），未重跑 IndexNow。

## 逐项响应

### C1（P2 HTML 无 Cache-Control）— 已修
修法：全局 middleware 对 GET/HEAD 且非 `/api/` 且路由未自设 Cache-Control 的响应统一加 `public, max-age=300`。`/og.png` 保留自己的 86400；`/api/*` 保持不缓存。采纳审查员建议不上边缘 Cache API 失效体系（勿增实体）。
线上证据：`curl -I https://mcp.zalize.com/` → `cache-control: public, max-age=300`；`/api/stats` 无缓存头。

### C2（P2 超长查询烧 CPU）— 已修
修法：`parseQuery` 对 q 统一截断——160 字符 + 10 词上限，超限部分直接忽略（`.trim().slice(0,160).split(/\s+/).slice(0,10).join(' ')`）。放在查询解析单点，所有列表路由自动受益。
证据：本地 5000 字符 q 从 0.99s → 0.10s；线上同查询 0.33s（含网络往返）。

### C3（P2 bundle 扩展性天花板）— 已修（按审查员边际方案，未动架构）
修法：build.mjs 输出剔除站点未使用的 `createdAt`、`source` 字段（Item 接口同步删除，typecheck 确认无引用）；条目数 >15k 时 build 输出告警。同意「到量级再议 KV/D1 拆分，不提前建设」。
证据：`wrangler deploy --dry-run` bundle 3295KB/698KB gzip → 3002KB/664KB gzip（约省 9% 原始 / 5% gzip）。

### C4（P2 /api/stats 240ms）— 按审查员意见不修
审查员明确「维持现状即可——记录在案，不要求本轮修」。同意：该端点仅内部自查，56 并发 KV 读的长尾属 KV 固有延迟；若未来做公开 stats 页再改每日聚合 key。

## 未修项
无（C4 为审查员标记的记录项）。
