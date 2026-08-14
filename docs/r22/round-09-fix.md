# R22 Round 09 — Fix Report（修改员）

PR: https://github.com/wookat/mcp-index/pull/13 （base=main，已 rebase 到含 R8 的 main）
部署：`wrangler deploy` 上传成功（zone routes API 权限告警为已知既有 caveat），线上逐项复验通过（2026-08-14 UTC）。四项均为语义/键盘层补强，视觉与交互零回归。

## 逐项响应

### I1（P2 无 skip-to-content）— 已修
layout `<body>` 首位加 `<a class="skip" href="#main">Skip to content</a>`（视觉隐藏、:focus 时左上滑出），全部页面模板的 `<main>` 加 `id="main"`（含 404 页）。
线上证据：首页/列表页均含 skip 链接与 main#main。

### I2（P2 首页 hero 位于 landmark 之外）— 已修
`<div class="hero">` → `<section class="hero" aria-label="Introduction">`。采用审查员建议的 section 包装而非并入 main——CSS 以 .hero 类选择，section 化零样式影响；并入 main 则需改 main.home 相关选择器，改动面更大且无额外收益。
线上证据：首页含 `<section class="hero" aria-label="Introduction">`。

### I3（P2 Copy 状态变化无播报）— 已修
copy 按钮加 `aria-live="polite"`——状态文本（Copy→Copied!）本就在按钮内，最小改动即可被屏幕阅读器播报，未增设独立 live region。

### I4（P2 选中 facet 仅靠颜色）— 已修
选中 facet 链接在 class="on" 之外加 `aria-current="true"`，与分页既有 aria-current 模式同构。
线上证据：/servers?official=yes 中 Official 链接含 aria-current="true"。

## 验证
本地：typecheck、wrangler dry-run 全绿；wrangler dev 冒烟逐项确认 I1–I4（skip 链接、hero landmark、aria-live、aria-current）与列表/详情页正常渲染。
线上：如上逐项 curl 复验通过。
