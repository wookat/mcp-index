# R22 Round 02 — 核心工作流专题审查（审查员）

- 日期：2026-08-14
- 方法：真浏览器全流程实走（首页搜索→结果→详情→复制安装片段→"/"快捷键→排序），facet 组合 curl 实测，数据集核对（node 读 data/index.json），截图 docs/r22/screenshots/round-02/。
- 通过项（实测正常）：搜索→详情→Copy 按钮（剪贴板内容正确、按钮变 Copied!）；"/" 聚焦搜索框；排序 select 生效（sort=stars 后首条 ★173.6k）；facet 组合过滤计数一致（lang+activity+install 交叉正常）；/category/nonexistent 正确 404；0 结果页有引导文案。

## 发现清单

### B1【P1 · 功能/逻辑】/category/:slug 页的 Category facet 是死链接：点击无任何效果
- 复现：/category/databases 侧栏 Category facet 链接形如 `/category/databases?category=security`（承诺 190 条），实际返回仍是 Databases 的 123 条——路由里 `q.category = slug` 无条件覆盖 URL 参数。
- 影响：核心浏览工作流（在分类间横跳）被破坏，且显示的计数与点击结果不符，用户会认为筛选坏了。
- 建议与思辨：在 /category/:slug 页，Category facet 链接应生成 `/category/<other-slug>`（保留其余 query 参数），或干脆该页不渲染 Category facet 而放「All categories」链接。同一份 facetSidebar 同时服务 /search（参数驱动）与 /category（路径驱动）两种语义，这是耦合点；传入「当前维度锁定」信息即可解耦，不必复制组件。

### B2【P1 · 逻辑/搜索质量】旗舰查询词的排序把边缘条目排在权威条目前面
- 复现：`/search?q=postgres`（首页占位符示例词）前 3 名是 microsoft/azure-resource-manager-postgresql-dotnet（azure 专用 skill）、azure-postgres-ts（同类）、sanjay3290/postgres（个人 demo 级）；crystaldba/postgres-mcp（★3.2k，社区旗舰 postgres server）排第 4，modelcontextprotocol 官方 server-postgres 排第 7。
- 根因：名称命中只有二值加权（+3/+1），同分后按 quality score 排序——azure skill 的 score 85 压过 postgres-mcp 的 63；且 server 与 skill 混排无类型权重。
- 建议与思辨：排序对目录站是核心竞争力，值得一次认真设计而非再打补丁：①名称整词精确命中 > 名称前缀/子串命中 > 描述/topic 命中，分层加权；②同层内再按 score；③单词查询（如 postgres）时 server 类型可轻微加权（用户十有八九找 server 而非 vendor skill）。不建议引入外部搜索服务（勿增实体，数据仅 4.2k 条内存可算）。

### B3【P2 · 数据覆盖】多家厂商官方 server 缺失（数据源只有 3 个 awesome 列表）
- 复现：数据集中搜不到 makenotion/notion-mcp-server（Notion 官方 server，GitHub 数千星）；q=notion 的结果全是社区实现。
- 建议：周更管线增加官方 MCP registry（modelcontextprotocol/registry）作为第 4 数据源，或至少人工补一份 vendor-official 种子清单。目录站的「查得到权威实现」是信任底线。

### B4【P2 · 渐进增强】排序 select 依赖 JS（onchange submit），无 JS 时无法排序
- form 内没有提交按钮。建议加 `<noscript><button>` 或常显小按钮。成本一行，收益是爬虫/无 JS 环境可用。

### B5【P2 · 逻辑】/servers、/skills 的 pager 与排序表单 URL 携带冗余 type 参数
- 复现：/servers?page=2 的 pager 链接是 `/servers?type=server&page=2`——type 由路由强制，参数纯冗余，制造同内容双 URL（canonical 目前统一指向裸路径掩盖了它，但 canonical 全剥 query 本身是否合适留第 8 轮 SEO 专题评估）。
- 建议：listPage 构造 qs 时跳过与路由隐含值相同的 type。

## verdict（等修改员 fix 后线上复验追加）

## Round 02 verdict（2026-08-14 线上复验，全部实测）
- B1 PASS：/category/databases?lang=Python 侧栏 Category 链接为 /category/developer-tools?lang=Python 等路径形式（参数保留），点击生效。
- B2 PASS：q=postgres 前 4 = crystaldba/postgres-mcp、javimaligno/postgres-mcp、postgres-aiops、官方 server-postgres；q=notion 第 1 = makenotion/notion-mcp-server。
- B3 PASS：数据集 total 4209（+8 vendor seeds），makenotion/notion-mcp-server 可检索；驳回 registry 全量接入的理由有实测数据支撑，采纳种子清单方案合理。
- B4 PASS：/servers 排序表单含 noscript Apply 按钮。
- B5 PASS：/servers?page=2 pager 链接无冗余 type 参数。
5/5 PASS，无 FAIL 项进入下一轮。
