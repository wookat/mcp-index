# R22 Round 04 — Fix Report（修改员）

PR: https://github.com/wookat/mcp-index/pull/8 （base=main）
部署：已执行 `wrangler deploy`，worker 上传成功（zone routes API 权限告警为已知既有 caveat，自定义域路由不受影响），线上已验证生效（2026-08-14 02:0x UTC）。改动全部为 CSS/模板层，核心搜索与数据逻辑零改动。

## 逐项响应

### D1（tap target < 44px）— 已修
640px 媒体查询内：`nav.top a` padding 9px 8px、`.facet a` padding 10px（配合 14px 字号，命中区 ≥40px）、`.copybtn` padding 9px 14px。桌面样式不动（同意审查员"只改移动端"的最小方案）。

### D2（Filters 与结果间留白 ~90px）— 已修
900px 断点下 `.cols` gap 28px → 14px。未额外去 margin——单点收敛 gap 已消除空白带主体。

### D3（input 13.5px 触发 iOS 聚焦放大）— 已修
640px 内 `.hsearch input` 与 `.searchbar input` 字号统一 16px（iOS 兼容惯例）。

### D4（Sort select 依赖 JS）— 已修（采纳审查员"更好设计"）
彻底删掉 `<select onchange=submit>` + 隐藏字段 + noscript 按钮，改为三个纯链接 Quality / Stars / Updated（`sortLink()` 基于当前 querystring 重建、剔除 sort/page、保留全部筛选）。零 JS 依赖、可被爬虫发现、实体更少。已验证 `/servers?sort=stars&lang=Python` 下当前项高亮且切换链接保留 lang。

### D5（sticky header 占屏 26%）— 已修（纯 CSS，未加 JS）
搜索行移到 header 第一行（`.hsearch{order:-1}`，input 固定 44px 高），`header.site{top:-59px}`：滚动时搜索行随文档滚走，logo+nav 行保持 sticky。符合审查员"只 sticky 第一行"的推荐与"勿增实体"。

### D6（首页移动端分类导航在最底部）— 已修（未留到 R6）
首页 `main.wrap.home` 在 640px 内变 flex column，Browse by category（`.cat-home{order:-1}`）提到 Top rated 之前；桌面顺序不变。改动一行 CSS + 两个 class，成本远低于 R6 整体信息架构重排，先行落地。

### D7（导航 12.5px 可读性弱）— 已修
与 D1 合并：移动端 nav 字号 13.5px。

## 主动否决的方案
- D4 不用 noscript Apply 按钮补丁（保留 select + JS 的双轨），直接换链接治本。
- D5 不加滚动监听 JS 收起搜索行，用负 sticky top 纯 CSS 实现。

## 验证
- 本地：typecheck 通过、`wrangler deploy --dry-run` 通过、dev smoke（sortlinks 渲染/筛选保留/cat-home 存在）。
- 线上：`/servers` 出现 sortlinks、`?sort=stars&lang=Python` 高亮 Stars、首页含 cat-home 与 `top:-59px`、全站已无 `onchange`。
