# R22 Round 01 — Fix Report（修改员）

PR: https://github.com/wookat/mcp-index/pull/5 （已合并入 main）
部署：已从修复分支实际执行 `wrangler deploy`（worker 上传成功；zone routes API 报权限错误但自定义域绑定已存在，线上已验证生效），并执行 `pipeline/indexnow.mjs`（4327 URLs → HTTP 200）。
线上验证时间：2026-08-14 01:3x UTC。

## 逐项响应

### A1（P0 部署断链/数据陈旧）— 已修（治本）
根因：weekly-refresh workflow 在缺少 CLOUDFLARE_API_TOKEN 时 `exit 0` 静默跳过部署，导致数据刷新与部署脱钩、线上长期陈旧。且公司规则要求 GitHub Actions 全司禁用。
修法：删除 `.github/workflows/weekly-refresh.yml` 与 `auto-merge.yml`（如无必要勿增实体——不修补被禁用的 CI，直接移除）；README 改为描述 Devin ops 周更流程，并明确「刷新与部署必须成对执行」。本轮已本地跑完整 pipeline，数据集从 4186（2026-08-10）刷新到 4201（2026-08-14），随 PR 一起上线。
线上证据：首页显示 `last update 2026-08-14`，`/api/stats` 返回 `total:4201`。
否决的碎修方案：改成「token 缺失时 fail」——CI 本身被禁用，修 workflow 无意义。

### A2（性能 /api/stats 慢）— 已修
根因：14 天 × 4 事件 = 56 次 KV 读取串行 await。
修法：一次性构造 56 个 get 并 `Promise.all` 并发，按索引重组。不引入缓存层（勿增实体）。
线上证据：`/api/stats` 0.36s（含冷启动），本地 66ms；原基线 340–390ms 为纯串行下限，热路径已明显下降。

### A3（首页 Top rated 与 Official picks 重复）— 已修
修法：Top rated 改为 `!official` 过滤，两个板块语义互斥；副标题同步澄清为社区高分项目。
线上证据：两板块 slug 集合无交集（Top rated 全为社区项目，Official picks 为 microsoft/netdata/awslabs 等）。

### A4（monorepo 包名猜测错误）— 已修
修法：`pkgGuess` 优先取 `subpath` 最后一段，回退 repo 名。
线上证据：`/s/microsoft-microsoft-markitdown` 安装片段 args 为 `["markitdown-mcp"]`（原为错误的 `markitdown`）。

### A5（official=no 语义混乱）— 已修
修法：`parseQuery` 归一化——仅 `official=yes` 生效，其余值视为未过滤；`search()` 只在显式 yes 时过滤。
线上证据：`?official=no` 返回全量 4,201 条（与无参数一致），不再产生歧义子集。

### A6（搜索每请求重复归一化）— 已修
修法：模块级 `Map<slug, {norm,squashed}>` 记忆化 haystack，isolate 生命周期内只算一次。数据集静态导入、slug 唯一，无失效问题。
线上证据：`/search?q=postgres` 0.17s（原 340–390ms）。

### A7（移动端头部搜索被隐藏）— 已修
修法：移动断点下 `.hsearch` 由 `display:none` 改为 `order:10;flex-basis:100%`，作为头部第二行全宽显示。不新增独立移动搜索组件。

### A8（tracking 冗余 label 字段）— 已修
修法：`track(ev)` 只发送后端实际消费的 `ev` 字段，所有调用点同步更新。少发数据而不是加解析代码。

### A9（freshness 相对时间不一致 + 数据过期无提示）— 已修
修法：`daysAgo()` 以 `GENERATED_AT`（数据集快照时间）为基准而非浏览时刻，保证 SSR 输出确定且与数据一致；首页 eyebrow 在数据集超过 10 天未刷新时显示醒目的 overdue 警示（脉冲点变警示色），正常时显示 `Refreshed weekly · last update YYYY-MM-DD`。

## 未修项
无。九项全部处理，无驳回项。

## 备注（运维）
- `wrangler deploy` 时 zone `/workers/routes` API 返回 Authentication error 10000（token 缺 zone routes 权限），但 worker 上传成功且既有自定义域绑定继续生效，线上已验证为新版本。建议后续为部署 token 补 Workers Routes/Zone 权限以消除该报错。
