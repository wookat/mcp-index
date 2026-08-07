# R16 竞品优点清单（≥10 站实测）

日期：2026-08-07 · 方式：真实浏览器逐站实测 + 截图（`docs/screenshots/r16/`）。
方法论：否定之否定——以竞品之长（反题）否定我站现状（正题），合题落地见 `r16-gap-backlog.md`。

## 实测竞品清单（14 站）

| # | 站点 | 类型 | 截图 | 状态 |
|---|---|---|---|---|
| 1 | smithery.ai | MCP 目录+运行时（头部） | smithery.png / smithery-servers.png / smithery-detail.png | ✅ 实测 |
| 2 | glama.ai/mcp/servers | 最大 MCP 目录（69,462） | glama.png / glama-detail.png | ✅ 实测 |
| 3 | lobehub.com/mcp | MCP 市场（85,372，社区口碑高） | lobehub.png / lobehub-detail.png | ✅ 实测 |
| 4 | mcp.so | MCP 市场 | mcpso.png | ✅ 实测（过 Cloudflare 挑战后） |
| 5 | mcpservers.org | Awesome MCP 目录 | mcpservers-org.png / mcpservers-org-remote.png | ✅ 实测 |
| 6 | registry.modelcontextprotocol.io | 官方 MCP Registry | official-registry.png | ✅ 实测 |
| 7 | opentools.com/registry | 官方集成注册表 | opentools.png | ✅ 实测 |
| 8 | mcp-get.com | MCP 包注册表（存档） | mcp-get.png | ✅ 实测 |
| 9 | himcp.ai | MCP 目录（74,788） | himcp.png | ✅ 实测 |
| 10 | pypi.org | 包目录标杆 | pypi.png / pypi-detail.png | ✅ 实测 |
| 11 | marketplace.visualstudio.com | 扩展目录标杆 | vscode-marketplace.png | ✅ 实测 |
| 12 | apify.com/store | Actor 目录标杆 | apify.png | ✅ 实测 |
| 13 | producthunt.com | 产品目录标杆 | producthunt.png | ✅ 实测 |
| 14 | chromewebstore.google.com | 扩展目录标杆 | chromewebstore.png | ✅ 实测 |

未能实测（企业级反爬，多次真实浏览器挑战循环不过）：pulsemcp.com、mcpmarket.com、npmjs.com、hub.docker.com/mcp、cursor.directory。已用同类型标杆（PyPI、VS Code Marketplace、Chrome Web Store）替补。

## 值得学的优点（≥10 条，逐条注明出处/页面/为什么好/适用到我们哪）

1. **字母评级徽章（A/B/C…）三维质量分级** — Glama 列表卡片（glama.png）：license / quality / maintenance 三个字母徽章。LobeHub 同样用 `A PREMIUM` / `B GOOD` 分级（lobehub.png）。为什么好：字母比 0-100 数字更快扫描、信任感强、可比较。适用：我们列表行卡片与详情页头部——由现有 score 推导 A–F 字母级。
2. **Agent-first 安装入口（"I'm an Agent"）** — LobeHub 首页右上安装卡（lobehub.png）：给 agent 一句 `Read https://lobehub.com/mcp/skill.md` 提示词即可接入。为什么好：MCP 目录的核心用户一半是 AI agent；给 agent 一个机器可读入口是新分发渠道。适用：新增 `/llms.txt`（llms.txt 标准），首页/页脚露出。
3. **官方(Official)信号前置成可筛选维度** — OpenTools 整站只收官方集成并大字标注 Official（opentools.png）；mcpservers.org 顶部第一排 chips 就有 Official 快捷筛选（mcpservers-org.png）。为什么好：官方=可信任，是选型第一过滤条件。适用：facet 侧栏新增 Official 维度 + 首页新增 Official picks 区块。
4. **下载/使用量等采用信号** — VS Code Marketplace 每卡显示安装量+星级评分（vscode-marketplace.png）；Apify 显示 users 数与 4.8 评分（apify.png）；Smithery 显示 uses 计数（smithery.png）。为什么好：社会证明直接驱动点击转化。适用：我们没有安装量数据，但可将 forks 作为第二采用信号在详情页展示；列表保持 stars。
5. **搜索快捷键提示直接印在搜索框内** — LobeHub 搜索框右侧 `Ctrl K` 角标（lobehub.png）；mcp.so 搜索框 `⌘K`（mcpso.png）。为什么好：可发现性——用户不用猜快捷键。适用：header 搜索与首页大搜索框加 `/` 或 `Ctrl K` kbd 角标，并支持 Ctrl/⌘+K 聚焦。
6. **分类彩色大磁贴导航** — mcp.so 首页 Top categories 五色大卡（mcpso.png）。为什么好：视觉锚点强、分类入口点击率高。适用：首页 catgrid 可给 top 分类加图标/色彩强调（P2）。
7. **Featured/精选区块 + 人工筛选口径** — mcp.so "Featured servers — Hand-picked, production-ready"（mcpso.png）；mcpservers.org Featured MCPs（mcpservers-org.png）。为什么好：目录太大时给新用户一个可信起点。适用：首页 Top rated 已类似；补充 Official picks 区块（口径=official+active）。
8. **新鲜度承诺显式到分钟/绿点** — Glama 头部 "69,462 servers. Last updated 2026-08-07 07:45 🟢"（glama.png）。为什么好：数据目录的生命线是新鲜度，显式承诺提升信任。适用：我们已有周更 eyebrow；在列表页 toolbar 也露出 last updated。
9. **面包屑 + 语义化 URL 层级** — Glama `Glama › MCP › Servers`（glama.png）；官方 registry 简洁列表（official-registry.png）。为什么好：SEO（BreadcrumbList 结构化数据）与用户定位。适用：我们已有面包屑 UI，但缺 BreadcrumbList JSON-LD——补上；/about FAQ 补 FAQPage JSON-LD；列表页补 ItemList JSON-LD。
10. **版本号/最近更新时间逐条可见** — 官方 registry 每卡右上 `v8.20.1` + Updated 日期（official-registry.png）；PyPI 每结果右侧日期（pypi.png）。为什么好：一眼判断活跃度。适用：我们已有 daysAgo；保持并在详情侧栏加 forks（采用信号）。
11. **筛选维度侧栏全计数** — HiMCP 左侧分类侧栏全部带 count（himcp.png）；Glama facet 带 count（glama.png）；PyPI classifier 树（pypi.png）。为什么好：预判结果规模，减少无效点击。适用：我们已全维度计数（R14 已做）——保持，是相对优势。
12. **社交分享卡（og:image）品牌化** — Product Hunt / LobeHub / Smithery 分享链接均出大图卡片。为什么好：MCP 目录传播主要靠 X/Reddit/微信分享，无 og:image 的链接 CTR 显著低。适用：全站加品牌 og:image + `twitter:card=summary_large_image`。
13. **深浅双主题** — Smithery 底部 Light/System/Dark 切换（R14 已记录）；mcp.so 右上主题切换（mcpso.png）。为什么好：开发者偏好分裂，默认单暗色流失浅色偏好用户。适用：P2（成本较高，本轮不做，登记 backlog）。
14. **同类推荐/相关条目** — Smithery 404 页都推荐 "These ones actually exist"（smithery-detail.png）。为什么好：把死路变成继续浏览。适用：我们 404 页只有回首页按钮——加热门条目推荐。
