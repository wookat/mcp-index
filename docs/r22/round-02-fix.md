# R22 Round 02 — Fix Report（修改员）

PR: https://github.com/wookat/mcp-index/pull/6 （base=main，合并留待老板/平台）
部署：已从修复分支执行 `wrangler deploy` + IndexNow ping（4335 URLs → HTTP 200），线上已验证生效（2026-08-14 01:4x UTC，total 4209）。

## 逐项响应

### B1（P1 分类页 Category facet 死链）— 已修
根因确认：`/category/:slug` 路由无条件 `q.category = slug`，facet 却生成 `?category=` 参数，被路由覆盖 → 死链且计数与结果不符。
修法（解耦而非复制组件）：`facetSidebar` 感知「category 由路由锁定」——分类页上 Category facet 链接生成 `/category/<other-slug>`（保留其余 query 参数）；当前分类的取消链接指向 `/search?<其余参数>`；路由锁定的 category 不再计入「N active filters」。同一组件继续服务两种语义，只传入锁定信息，未新增组件。
线上证据：`/category/databases` 侧栏链接为 `/category/developer-tools` 等路径形式，点击生效；`?lang=Python` 等参数在横跳时保留。

### B2（P1 搜索排序质量）— 已修（一次治本的分层设计）
修法：`search()` 的名称命中由二值 +3/+1 改为分层加权——名称整词精确命中 +10 > 名称子串 +5 > 同义词整词命中名称 +4 > 描述/topic 命中 +1；同层内按 quality score；单词查询时 server 类型 +2（目录用户搜裸产品名十有八九找 server）。未引入外部搜索服务（勿增实体）。
线上证据：`/search?q=postgres` 前 4：crystaldba/postgres-mcp（#1）、javimaligno/postgres-mcp、postgres-aiops、官方 server-postgres（#4）；azure vendor skill 已被压到整词命中层之后。

### B3（P2 厂商官方 server 缺失）— 已修（采纳备选方案，驳回主方案并给出实测依据）
调查结论（实测 registry API 全量翻页）：modelcontextprotocol registry `version=latest` 共 21,526 条、216 页，其中带 GitHub repo 的 17,112 条被聚合器垃圾主导（ai.smithery×175、app.wishpool×125、com.mcparmory×76…）；且 `com.notion/mcp` 在 registry 里没有 repository URL——全量接入既引入 5 倍脏数据和 ~17k 次 GitHub API enrich，也仍搜不到 makenotion/notion-mcp-server。故驳回「registry 作第 4 数据源」的主方案。
采纳 audit 的备选：新增 `pipeline/seeds.json` 人工 vendor-official 种子清单（parse.mjs 第 4 数据源，add() 自动去重），首批 8 个逐一经 GitHub API 验证存在的缺失官方 server：Notion、Stripe（stripe/ai）、Elastic、MongoDB、JetBrains、Heroku、Twilio、PayPal。数据集 4201 → 4209。
线上证据：`/search?q=notion` 第 1 名即 makenotion/notion-mcp-server（Official 徽章）。

### B4（P2 排序依赖 JS）— 已修
排序 form 内加 `<noscript><button class="btn" type="submit">Apply</button></noscript>`，一行成本，无 JS 环境可排序。

### B5（P2 冗余 type 参数造成同内容双 URL）— 已修（同类问题一并治理）
`listPage` 的 pager qs 与排序表单 hidden input 统一跳过路由隐含值：`/servers`/`/skills` 跳过 type，`/category/:slug` 跳过 category（后者与 B1 同根因，一并治本）。
线上证据：`/servers?page=2` 的 pager 链接为 `/servers?page=1`、`/servers?page=3`，无 type 参数。
canonical 剥 query 是否合适：同意留第 8 轮 SEO 专题。

## 未修项
无。

## 备注
- 部署 token 仍缺 zone Workers Routes 权限（wrangler 报 Authentication error 10000），但 worker 上传成功、既有自定义域绑定继续生效，线上已实测为新版本。
