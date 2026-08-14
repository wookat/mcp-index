# R22 Round 11 — Fix Report（修改员）

PR: https://github.com/wookat/mcp-index/pull/15 （base=main）
部署：`wrangler deploy` 上传成功（zone routes API 权限告警为既有 caveat），线上逐项复验通过（2026-08-14 UTC）。

## 逐项响应

### K1（P2 facet 顺序与上下文计数不同步）— 已修
根因认同：行序来自全局静态排序、数字来自上下文重算，两个事实源不同步。修法即审查员建议：`facet()` 在 filter 后按 n 降序排序，`activity` 显式排除（生命周期语序 active→archived 是有意语义）。同意否决"调用点传上下文计数"备选——排序知识留在 facet() 内部最内聚。
线上证据：`/servers` 语言 facet TypeScript 1,182 > Python 1,099；`/servers?lang=Python` 分类 facet 143→104→102→71… 严格降序。

### K2（P2 top-24 先截断后计数）— 已修，与 K1 同处治本
`TOPIC_CATEGORIES.slice(0,24)` 改为传全量 121 类，`facet()` 新增 `max` 参数在上下文计数+排序之后截断；选中项即使排名超出 24 也保留可见（避免"选中了却看不见自己"）。计数在既有 base 遍历内完成，无额外性能成本。
线上证据：`/servers?lang=Go` 侧栏出现 Version Control（6 条），此前不可发现。

### K3（P2 /categories 分组标题不对称）— 已修
主题组补 `<h2>Topic categories</h2>`，副标题下移至该 h2 下，与 Skill collections 结构对称，标题大纲完整。同意否决"削平 Skill collections h2"的反向方案。
线上证据：/categories 现有两个对称 h2。

## 第三节"已知可接受残留"
认同全部三项记录（per-colo 近似限流、KV 计数丢并发、CSP unsafe-inline），不新开修复项；zone 级 Rate Limiting 权限留待老板补 token 权限。

## 回归验证
- 本地 typecheck + wrangler dry-run 全绿。
- facet 选中态 aria-current、计数=结果数、搜索（q=postgres 62 结果）、/categories 两组渲染均正常。
- 桌面 aside 与移动 details 两份 facet 同源渲染，行为一致。
