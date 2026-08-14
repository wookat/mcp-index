# R22 Round 11 — 回归总审（审查员）

日期：2026-08-14 · 线上 https://mcp.zalize.com · 基于 origin/main（含 R1–R10 全部修复）
方法：① 逐轮回归断言线上重测（R1–R10 共 47 项 verdict）；② 9 页 × 1440/375px 真浏览器走查（截图 docs/r22/screenshots/round-11/）；③ 全站控制台与网络错误捕获；④ Lighthouse 四页；⑤ facet 一致性逻辑深挖。

## 一、回归矩阵（线上实测，全部保持修复态）
| 轮次 | 主题 | 关键断言复测 | 结论 |
|---|---|---|---|
| R1 | 全局体检 | 数据 generatedAt=2026-08-14（周更活着）、/api/stats 0.23s（原 7.3s）、official=no 不再清零（3,242）、首页无重复卡片 | 保持 |
| R2 | 核心工作流 | facet→/category/<slug> 正常、q=notion 头部为 makenotion/notion-mcp-server、pager 参数干净 | 保持 |
| R3 | 性能 | HTML cache-control 300s、query 截断至 10 词、页面 0.08–0.16s | 保持 |
| R4 | 移动端 | 375px 走查：点击区、筛选折叠、16px 输入、纯链接排序、导航字号均如修复后 | 保持 |
| R5 | 错误路径 | /S/大写 slug → 301 小写、/servers/ → 301、favicon 200、通用 404 文案「doesn't exist」 | 保持 |
| R6 | 信息架构 | /categories 主题组 85 类 + Skill collections 分组、分类页面包屑含 Categories、活动徽章 title 释义 | 保持 |
| R7 | 代码架构 | facet 计数=结果数（多维抽样）、breakdown 分量和=总分、sitemap/llms 缓存生效 | 保持 |
| R8 | SEO | 分页自引用 canonical（/skills?page=2）、robots Disallow /search、无 aggregateRating、sitemap 4,335 URL 多 lastmod | 保持 |
| R9 | 无障碍 | skip 链接 + main#main、hero 为 section、aria-live、选中 facet aria-current；axe 5 页零违规 | 保持 |
| R10 | 安全 | XSS payload 呈 \u003c 且浏览器不执行、`//example.com/` 不出站、四个安全头齐全、/api/track 并发即 429、/api/stats max-age=60 | 保持 |

补充证据：
- Lighthouse：/、/servers、/s/:slug 四项 100/100/100/100；/search?q=postgres 的 SEO 66 唯一失分项为 is-crawlable——R8 有意 Disallow /search，符合预期，不算回归。
- 控制台与网络：9 页零 JS 错误、零意外 4xx/5xx（仅故意访问的 /nope-404）。CSP 上线后样式/头像/内联脚本无误伤。

## 二、本轮新发现

### K1 [P2][逻辑/一致性] facet 列表顺序不按显示计数排序，筛选上下文下明显错乱
- 复现：
  - `/servers` 分类 facet：… Workplace & Productivity 95 → **Marketing 66 → Browser Automation 78** …（1 处逆序）
  - `/servers` 语言 facet：**Python 1,099 → TypeScript 1,182**（逆序）
  - `/servers?lang=Python` 分类 facet：21 行中 **7 处逆序**（如 Finance & Fintech 143 排在 104 之后）
  - `/servers?lang=Rust`：Knowledge & Memory 19 排在 Finance & Fintech 6 之后
- 根因（index.ts facet()）：行顺序来自全局 `TOPIC_CATEGORIES`/`LANGS` 的静态排序，而数字是按当前上下文 `baseFor()` 重算的——顺序与数字来自两个不同事实源，两者不同步。
- 影响：侧栏读起来像"按数量排序"（/categories 页文案也明说 sorted by size），逆序会让用户误判分布、错过上下文里最大的分类；这是 R6/R7 已建立的"计数=结果数"正确性之外仍存的一致性缺口。
- 建议：facet() 在 filter 之后按 `n` 降序排序（一行 `.sort((a,b)=>b.n-a.n)`），Activity 保持生命周期语序（active→archived，人为语义序，应显式排除在排序之外）。
- 思辨「是否有更好的方式」：备选是让 opts 传入时就带上下文计数——否决，那会把计数知识扩散到调用点，违背 R7 刚完成的"同一知识一处收口"；排序留在 facet() 内部最内聚。

### K2 [P2][逻辑] 分类 facet 的 top-24 截断发生在全局排名上，先截断后计数
- 复现：`TOPIC_CATEGORIES.slice(0, 24)` 取全局前 24，再按上下文计数过滤 n>0。因此上下文里不小但全局排名靠后的分类永远不出现，例如 `lang=Go` 下 Version Control 有 6 条却无法在侧栏出现（用 `/servers?lang=Go&category=version-control` 可直接访问到，仅侧栏不可发现）。
- 影响：属"发现性"缺口而非错误计数，量级有限（P2），但会让长尾语言/分类组合的浏览路径断掉。
- 建议：改为先算全部分类的上下文计数、再取前 24（与 K1 的排序同一处改动即可顺带解决）；121 个分类的计数在同一次 base 遍历内完成，无额外性能成本（现状已遍历 base）。

### K3 [P2][视觉/信息架构小] /categories 首个分组无标题，层级不对称
- 复现：/categories 只有一个 `<h2>Skill collections`；主题分组靠 h1「All categories」+ 副标题承载，两组视觉权重不对等。
- 建议：给主题组补 `<h2>Topic categories</h2>`（副标题下移到该 h2 下），使两组对称，也让屏幕阅读器的标题大纲完整。
- 思辨：也可反向把 Skill collections 的 h2 降级为纯文本——否决，分组标题是正确的语义，应补齐而非削平。

## 三、已知可接受残留（记录，不新开修复项）
- /api/track 慢速灌注（~1 req/s 跨 colo）仍可通过：Workers ratelimit binding 为 per-colo 近似计数，R10 已判可接受；如需彻底治，需 zone 级 Rate Limiting 权限（待老板补 API token 权限）。
- KV 计数 read-modify-write 在并发下丢计数：指标为 nice-to-have，R5/R7 均判不值得引入 Durable Objects。
- CSP 仍含 script-src 'unsafe-inline'（内联 JSON-LD/脚本所需）；J1 转义已收口注入面，nonce 严格化留作后续可选项。

## 四、总结（11 轮）
- 累计 verdict：R1 9/9、R2 5/5、R3 4/4、R4 7/7、R5 4/4、R6 5/5、R7 5/5、R8 4/4、R9 4/4、R10 5/5 = **52 项全 PASS，零 FAIL 跨轮**。
- 严重级分布：P0 2 项（R1 部署静默跳过、R10 JSON-LD XSS）均已治本；P1 2 项（R6 分类污染、R10 开放重定向）已修。
- 系统观评价：11 轮里架构实体数几乎未增（净减少：过滤谓词合并、评分权重共享、sitemap 缓存），改动集中在"同一知识一处收口"与"语义/合规补齐"，未出现为改而改的框架化冲动——符合老板"高内聚低耦合、如无必要勿增实体"的要求。
- 本轮 K1–K3 为最后一批小一致性项（P0/P1 已清零）。

## verdict（等修改员 fix 后线上复验追加）

## Round 11 verdict（2026-08-14 线上复验）
- K1 PASS：6 个上下文（/servers、/skills、?lang=Python、?lang=Rust、/search?q=mcp、/category/databases）的 Category 与 Language facet 全部严格降序，逆序数 0（此前 /servers?lang=Python 有 7 处）；Activity 仍为生命周期语序（active→maintained→stale→…），符合 K1 指定的显式例外，不计为违规。视觉复核：docs/r22/screenshots/round-11/desk-servers-after.png 侧栏 422→374→…→78→70→68→66 连续降序。
- K2 PASS：/servers?lang=Go 侧栏出现 Version Control（6），此前不可发现；且选中全局排名外的分类时仍可见（/servers?category=version-control 中该项 aria-current="true" 保留）。截断改为上下文计数排序之后（/servers 显示 24 行、lang=Rust 上下文仅 22 行）。
- K3 PASS：/categories 现有两个对称 h2（Topic categories / Skill collections）。
- 回归：Official facet 计数=结果数（242==242）、q=postgres 62 结果、skip 链接与 facets landmark 保留、页面渲染无异常。
3/3 PASS。

## 11 轮总账（最终）
R1 9/9 · R2 5/5 · R3 4/4 · R4 7/7 · R5 4/4 · R6 5/5 · R7 5/5 · R8 4/4 · R9 4/4 · R10 5/5 · R11 3/3 = **55 项全 PASS，零 FAIL 跨轮**；P0 2 项、P1 2 项均已治本。R22 循环收束。
