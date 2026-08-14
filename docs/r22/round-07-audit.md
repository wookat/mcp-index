# R22 Round 07 — 代码架构与耦合专题审查（审查员）

日期：2026-08-14 · 基于 origin/main e71691e（R6 修复已合并）
方法：通读 src/index.ts(520)、src/data.ts(172)、src/html.ts(381) 与 pipeline/build.mjs，梳理实体、重复逻辑与耦合点；结合线上延迟实测评估是否值得改。

## 正面确认（无需修）
- 总体架构克制：无框架 SSR、数据随部署内联、KV 只做匿名计数——实体数量与产品规模匹配，符合"如无必要勿增实体"。
- html.ts 视图函数（card/row/badges/pager/layout）职责清晰无重复；badges() 已被 card/row/detail 共享。
- 中间件统一处理规范化 301 与缓存头，无散落逻辑；daysAgo 锚定 GENERATED_AT 的设计有注释说明动机（诚实的相对时间）。
- 520 行的 index.ts 当前仍可读，不建议为拆而拆。

## 发现清单

### G1 [P2][架构/耦合] 维度过滤逻辑双实现：search() 与 baseFor() 各写一遍同样的六维谓词
- 位置：data.ts:128-135（search 的 filter 链）与 index.ts:54-63（baseFor 的合取式）。
- 影响：新增一个筛选维度要同步改 5 处（Query 接口、parseQuery、search、baseFor、facetSidebar 的 key 提取 + 选项表），漏一处就是 facet 计数与结果不一致的隐性 bug——这正是 R1-B1 类问题的温床。
- 建议：表驱动重构——定义一份 `DIMS: {key, get(i), match(i,v)}[]`，search 与 baseFor 均由它派生；facetSidebar 的 key 提取三元链（index.ts:87）也随之消失。
- 思辨：是否过度设计？不是——这不是加抽象层，是把已经存在两份的同一知识合并回一份，实体净减少。

### G2 [P2][架构/类型] listPage(c: any) 抹掉了 Hono Context 类型
- 位置：index.ts:110。
- 影响：c.html/c.req 全部失去类型检查，与项目其余部分的严格类型风格不一致。
- 建议：`c: Context<{ Bindings: Env }>`（hono 导出 Context），或让 listPage 返回 html 字符串由调用方 c.html()，后者还能让 listPage 变纯函数更易测。

### G3 [P2][耦合] scoreBreakdown() 手工镜像 pipeline/build.mjs 的 qualityScore()，靠注释约定同步
- 位置：index.ts:296-320（注释自述 "Mirrors pipeline/build.mjs qualityScore()"），且含 desc 分量反推、超 100 分回扣 stars 的 reconcile 逻辑。
- 影响：pipeline 改权重（如 stars 上限 40→35）而忘改 worker 时，详情页 breakdown 与真实得分无声漂移；reconcile 逻辑掩盖漂移使其更难被发现。
- 建议：把权重表提为单一来源共享：build.mjs 与 worker 共用一个 `scoring.(mjs|json)` 常量（worker 构建可直接 import JSON）；breakdown 计算保留在 worker 但读同一份权重。数据集无需加字段。
- 思辨：让 pipeline 直接输出每项 breakdown？会膨胀 4200×7 个数字进 bundle（R3 刚瘦身），不取；共享权重表是更小的实体。

### G4 [P2][性能/小] sitemap.xml 与 llms.txt 每请求全量重建（sitemap ≈4,300 个 URL 的字符串拼接）
- 位置：index.ts:472-481。
- 影响：内容仅随部署变化，却每次 miss 时重算；edge cache 300s 已缓解，属低优先。
- 建议：模块级 lazy 缓存一次（`let cached: string`），两行改动；与 C1 的"内容只随部署变"同一事实来源。

### G5 [P2][逻辑/数据] catSlug() 冲突静默合并：不同分类名映射到同一 slug 时 first-wins
- 位置：data.ts:43-52（Map 以 slug 为键，重名时 count 归并到第一个 name）。
- 影响：如上游出现 "Art & Culture" 与 "Art / Culture" 两个 section，将无声合并且页面标题只显示先到者；当前数据未触发，属防御缺口。
- 建议：build.mjs 在生成数据时校验 slug 唯一性，冲突则告警（与 R3 的 15k 条告警同一位置），worker 不加运行时开销。

## 汇总
- P0：0 · P1：0 · P2：5（G1–G5）
- G1 是本轮核心：把"同一知识写两遍"合并，其余为小改。均不改变线上行为，建议一个 PR 完成并以 R2/R5 的既有断言（facet 计数=结果数、301、404）做回归。

## verdict（等修改员 fix 后线上复验追加）
