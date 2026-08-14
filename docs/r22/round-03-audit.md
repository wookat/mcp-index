# R22 Round 03 — 性能专题审查（审查员）

- 日期：2026-08-14
- 方法：Lighthouse（移动模拟）×4 页、TTFB 多次采样、brotli 传输体积、`wrangler deploy --dry-run` 实测 bundle、恶意/超长查询压测。
- 基线实测（全部一手数据）：
  - Lighthouse：/、/servers、/s/:slug、/search?q=postgres 四页 performance/a11y/best-practices/SEO 全部 100；LCP 1.0–1.3s；CLS 0。
  - TTFB（三次采样中值）：/ 80ms、/servers 85ms、/s/:slug 79ms、/search?q=postgres 135ms、/api/stats 240ms。
  - 传输体积（br）：首页 10.3KB、/servers 13.3KB、详情 7.9KB——零客户端框架的收益明显。
  - Worker bundle：3295KB / gzip 698KB（3MB 数据集全量内联）。
- 结论：上一轮 A2/A6 修复后，站点性能已处于同类目录站第一梯队，本轮无 P0/P1。以下为高价值的边际改进与前瞻项。

## 发现清单

### C1【P2 · 性能/成本】全站 HTML 无任何 Cache-Control，所有请求都进 worker 渲染
- 复现：`curl -I` 各页面均无 cache-control/cf-cache-status 头。
- 思辨：站点内容仅在部署时变化（数据集静态内联），本质是「伪静态」站。当前 TTFB 已达标，边际收益主要是 worker CPU 成本与突发流量韧性。建议对 HTML 加 `Cache-Control: public, max-age=300`（短 TTL，避免部署后 5 分钟以上的陈旧），/og.png 已有 86400 可不动；不建议上边缘 Cache API 整套失效体系（勿增实体）。

### C2【P2 · 性能/防滥用】超长查询可烧 ~1s worker CPU
- 复现：5000 字符 q → 0.99s（正常查询 0.13s）；60 词 q → 0.19s。normalize+termMatches 对每条目每词执行，成本随词数×字符数放大。
- 建议：parseQuery 处 q 截断（如 160 字符）+ 词数上限（如 10 词），超限部分忽略。两行代码消除 CPU 放大面（第 10 轮安全专题会再从滥用角度复查）。

### C3【P2 · 架构/前瞻】数据集全量内联 bundle 的扩展性天花板
- 现状：gzip 698KB（限额 10MB，free 计划 3MB），4.2k 条时安全；若目录扩到 ~20k 条（周更管线持续吸入）将逼近 free 上限，isolate 冷启动解析 3MB JSON 的成本也线性增长。
- 建议：暂不动架构（当前方案是 4k 量级下最优：零往返、内存检索最快）；但 build.mjs 可先剔除站点未使用字段 `createdAt`、`source`（src/ 全文无引用，实测约省 0.35MB 原始/~10% gzip），并在 pipeline 输出条目数超阈值（如 15k）时告警。到量级再议 KV/D1 拆分，不提前建设。

### C4【P2 · 一致性】/api/stats 仍为 240ms（56 个 KV get 并发后的长尾）
- 上轮已从 7.3s 修到 240ms，达标。若后续做公开 stats 页可改为每日聚合 key（1 次读），当前仅内部自查用途，维持现状即可——记录在案，不要求本轮修。

## 说明
本轮聚焦性能，实测未发现新的 P0/P1；C1–C3 均为「值得做但不紧急」的边际项，修改员可按成本自行合并处理或说明不修理由。

## verdict（等修改员 fix 后线上复验追加）
