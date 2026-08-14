# R22 Round 07 — Fix Report（修改员）

PR: https://github.com/wookat/mcp-index/pull/11 （base=main）
部署：`wrangler deploy` 上传成功（zone routes API 权限告警为已知既有 caveat），线上已回归验证（2026-08-14 UTC）。全部为行为不变的架构改动。

## 逐项响应

### G1（P2 六维过滤逻辑双实现）— 已修（表驱动）
data.ts 新增 `FILTER_DIMS`（六行表：key + get(i)）与 `matchesDims(i, q, except?)`，统一为唯一谓词来源：
- search() 的 6 行 filter 链 → `ITEMS.filter((i) => matchesDims(i, query))`；
- baseFor() 的手写合取式 → `matchesText && matchesDims(i, q, except)`；
- facetSidebar 的 key 提取三元链 → `FILTER_DIMS.find(d => d.key === dim)!.get`。
匹配语义统一为小写等值比较，逐维核对与原逻辑等价（lang 原本即忽略大小写；category slug、type、activity、install 双方本就同 case；official get 映射 'yes'/''）。同意审查员思辨：这是合并既有的重复知识，实体净减少。

### G2（P2 listPage(c: any)）— 已修
签名改为 `c: Context<{ Bindings: Env }>`（hono 导出 Context），typecheck 全绿。未采纳"返回 html 字符串"的备选——需要改 9 处调用点且收益仅是可测性，当前无测试消费方，如无必要勿增改动面。

### G3（P2 scoreBreakdown 手工镜像 qualityScore）— 已修（共享权重表）
新增 `src/scoring.json`（starsMax/starsLogFactor/activity 权重/license/official/notArchived/description(+MinLength)/topics(+Min)/cap），build.mjs 与 worker 各自 import 同一份。breakdown 的 reconcile 逻辑保留（数据集不含 GitHub description 分量）。按审查员思辨同样否决"pipeline 输出逐项 breakdown"（bundle 膨胀）。
验证：重跑 `node pipeline/build.mjs`，stats 与改前完全一致（4209/3242/967/121 类），仅 generatedAt 变化（已还原，不入库）。

### G4（P2 sitemap/llms 每请求重建）— 已修
sitemap.xml 改为 isolate 级 lazy 缓存（首次请求构建一次）；llms.txt 提升为模块常量（体积小，启动期一次求值）。

### G5（P2 catSlug 冲突静默合并）— 已修（管线侧校验）
build.mjs 在写出数据前对全部分类名做 slug 唯一性检查，冲突则 console.warn（与 15k 条告警同位置）；worker 零运行时开销。当前数据无冲突。

## 回归验证
本地：typecheck、wrangler dry-run、pipeline 重跑全绿；wrangler dev 冒烟——facet 计数=结果数（Official 242==242、Python 1,099==1,099）、search/category/多维过滤正常、301 规范化、404、sitemap 4,335 URL、llms.txt、评分 breakdown 完整。
线上：facet 计数=结果数（242==242）、sitemap 4,335、llms.txt、/search?q=postgres 200、详情页 breakdown 正常。
