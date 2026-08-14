# R22 Round 01 — 全局体检审查（审查员）

- 日期：2026-08-14
- 对象：https://mcp.zalize.com （wookat/mcp-index，live worker）
- 方法：375px/1440px 真浏览器截图走查（docs/r22/screenshots/round-01/）、核心工作流实走（首页→搜索→筛选→详情→安装复制）、API curl 实测、Lighthouse、读 src/ 与 pipeline/ 代码、GitHub Actions 运行日志核查。
- 基线：Lighthouse（移动模拟，首页）performance 100 / a11y 100 / best-practices 100 / SEO 100；LCP 1.1s，CLS 0。主要页面 TTFB 80–160ms，/search?q= 340–390ms。

## 发现清单

### A1【P0 · 功能/架构】周更管线的部署步骤被静默跳过，线上数据永久落后 main
- 复现：`curl https://mcp.zalize.com/api/stats` → `generatedAt: 2026-08-08`；而 main 分支 data/index.json 已是 2026-08-10（commit 83c7435，由 weekly-refresh 定时任务提交）。
- 根因（一手证据）：Actions run 31355416451 日志明确输出 `CLOUDFLARE_API_TOKEN secret not set — skipping deploy`。workflow 里 `if [ -z "$CLOUDFLARE_API_TOKEN" ]; then ... exit 0` 把缺密钥当成功处理，刷新提交了数据但从不部署 → 站点将永远停在最后一次人工部署的数据。
- 影响：核心卖点「周更、活跃度信号」失真；详情页「Updated Xd ago」按请求时刻现算而底层 pushedAt 冻结，数据越陈旧，误导越大。
- 建议：①给仓库配置 CLOUDFLARE_API_TOKEN secret（或改为每周由 Devin 会话跑 pipeline+deploy，符合「CI 禁用、部署只从 main」的公司规则——注意：本仓库 Actions 目前是启用状态，与全公司「Actions 全部禁用」规则冲突，请修改员与父会话确认口径后统一处理）；②无论走哪条路，缺密钥必须 fail loudly（exit 1），不允许静默跳过。
- 思辨：数据刷新（commit 到 main）与站点部署是两个动作却耦合在一个 workflow 且后者可静默失败，这不是最适合的设计。更好方式：部署失败=整个 run 失败，或部署由「从 main 部署」的独立、有告警的步骤承担。

### A2【P1 · 性能】/api/stats 响应 7.3s
- 复现：`curl -w %{time_total} https://mcp.zalize.com/api/stats` → 7.28s。
- 根因：src/index.ts 中对 14 天 × 4 事件 = 56 次 KV get 串行 await。
- 建议：`Promise.all` 并行化（最小改动，预计 <500ms）；或每日聚合为单 key。无必要勿增实体——并行化即可，不必上 D1/Analytics Engine。

### A3【P1 · 逻辑/信息架构】首页「Top rated」与「Official picks」前 6 条 100% 重复
- 复现：1440px 首页截图（home-1440.png）：两个板块的 6 个条目完全相同（markitdown、netdata、screenpipe、awslabs/mcp、firecrawl、exa）。
- 根因：quality score 里 official 加 10 分，Top rated 天然被 official 霸榜，第二板块失去存在意义。
- 思辨：这样设计不是最适合。更好方式：Top rated 板块排除 official（或 Official picks 从 top 里去重后取后续条目），让首页首屏信息密度真正增加；也可把第二板块换成「本周上升最快」等差异化视角。

### A4【P1 · 功能】详情页安装片段的包名猜测在头部条目上就是错的
- 复现：/s/microsoft-microsoft-markitdown 的片段是 `"command":"uvx","args":["markitdown"]`，但该条目 subpath=packages/markitdown-mcp，真实包是 `markitdown-mcp`。pkgGuess=repo.split('/')[1] 完全忽略 subpath。
- 影响：这是全站唯一的「可复制交付物」，第一名条目就复制即错，伤信任；虽有「verify package name」免责文案，但对 monorepo（subpath 非空）可以做得更准。
- 建议：subpath 非空时用 subpath 最后一段作为包名猜测；或对 npx/uvx 猜测置信度低时退化为「见 README」型片段。

### A5【P2 · 逻辑】`?official=no` 表现为 official=yes
- 复现：`curl 'https://mcp.zalize.com/search?official=no'` → 251 条（全部 official）。search() 只判断 `query.official` truthy。
- 影响：UI 不会产生该 URL，属边界；但作为可分享/可被搜索引擎收录的 URL 语义错误。
- 建议：`query.official === 'yes'` 才过滤，其余忽略。

### A6【P1 · 性能】/search 每次请求对 4186 条全量重算 haystack（340–390ms TTFB）
- 复现：/servers 90ms vs /search?q=postgres 390ms。data.ts itemHaystack() 每请求每条目重新 normalize 五个字段拼接。
- 建议：module init 时预计算 haystack（isolate 内存驻留，一次成本），/search TTFB 应可降到 ~100ms。属于低风险高收益的最小改动。

### A7【P2 · 视觉/移动端】≤640px 时 header 搜索框隐藏，详情页在移动端没有任何搜索入口
- 复现：detail-markitdown-375.png——从详情页想再搜索必须先回列表页。移动端是目录类站点的主要流量来源之一。
- 建议：≤640px 保留一个紧凑搜索入口（icon 展开或收窄的输入框）。

### A8【P2 · 架构/如无必要勿增实体】前端 track() 发送 label 字段但服务端完全忽略
- src/html.ts CLIENT_JS 里 `JSON.stringify({ev,label})`，/api/track 只读 ev。要么用起来（按 path 聚合 top pages），要么删掉 label，不留半吊子实体。

### A9【P2 · 逻辑/文案】数据新鲜度表述不一致
- 首页 eyebrow「Refreshed weekly · last update 2026-08-08」（已 6 天）与「Recently updated · 5d ago」并存；A1 修复前该口径会持续恶化。建议统一：所有「Xd ago」以 generatedAt 为参照或直接显示日期，并在 generatedAt 超过 10 天时降级显示警示（防止再次静默陈旧）。

## 亮点（无需改动）
- Lighthouse 四项满分、CLS 0；HTML 语义/JSON-LD（ItemList/BreadcrumbList/FAQPage/SoftwareApplication）完备；`<script>` 注入搜索词被正确转义；404 页有兜底推荐；robots/sitemap/llms.txt 齐全。
- page=9999/负数被安全 clamp；/api/track 白名单校验正确（bogus 事件 400）。

## verdict（等修改员 fix 后线上复验追加）

## Round 01 verdict（2026-08-14 线上复验，全部实测）
- A1 PASS：/api/stats generatedAt=2026-08-14T01:25、total=4201；首页「last update 2026-08-14」；origin/main 已无 .github/workflows。
- A2 PASS：/api/stats 0.24s（原 7.28s）。
- A3 PASS：首页 Top rated 与 Official picks slug 无交集（前 24 链接无重复）。
- A4 PASS：/s/microsoft-microsoft-markitdown 安装片段 args=["markitdown-mcp"]。
- A5 PASS：?official=no → 4,201 条（=全量），?official=yes → 251 条。
- A6 PASS：/search?q=postgres 0.14s、q=browser+automation 0.23s（原 340–390ms）。
- A7 PASS：375px 头部第二行出现全宽搜索框（verify-detail-375-fix.png）。
- A8 PASS（随 A2/A6 部署上线，客户端 JS 只发 ev 字段）。
- A9 PASS：eyebrow 显示当日日期；daysAgo 以 GENERATED_AT 为基准（详情页 Updated 15d ago 与数据一致）。
9/9 PASS，无 FAIL 项进入下一轮。
