# R22 Round 09 — 无障碍专题审查（审查员）

日期：2026-08-14 · 线上 https://mcp.zalize.com
方法：axe-core 4.10.2 真浏览器扫描 5 页（/、/servers、/search?q=postgres、/s/:slug、/categories）+ 手工键盘/语义走查（landmark、焦点、状态可达性）。

## 正面确认（无需修）
- axe 扫描 /servers、/search、详情页、/categories 全零违规；对比度全站通过（深色主题配色达标）。
- `html lang="en"`、每页唯一 h1、viewport 无缩放禁用、搜索输入有 aria-label、分页当前页有 aria-current="page" 且有配套样式。
- 输入框 outline:none 均配有 :focus 边框变色替代指示，链接保留浏览器默认焦点环；R4 已解决移动端点击目标尺寸。
- 筛选/排序均为真实链接（R4 改造），天然键盘可达，无 JS 依赖。

## 发现清单

### I1 [P2][无障碍] 全站无 skip-to-content 链接
- 复现：Tab 进入任意页，需依次穿过 logo、5 个导航项、搜索框才能到达内容；列表页还要再穿过整个 facet 侧栏（30+ 链接）才到结果。
- 影响：键盘与屏幕阅读器用户每页重复成本高（WCAG 2.4.1 Bypass Blocks）。
- 建议：header 首位加视觉隐藏、聚焦时显示的 `<a href="#main">Skip to content</a>`，main 加 id。一行 HTML + 几行 CSS。

### I2 [P2][无障碍] 首页 5 处内容位于任何 landmark 之外（axe region, moderate）
- 复现：axe 首页报 region 违规 5 节点（首个 .eyebrow，即 hero 区块在 main 之前/之外）。
- 影响：屏幕阅读器按 landmark 导航时会漏掉 hero 与统计区。
- 建议：将 hero 区块并入 `<main>`（或包一层 `<section aria-label>`），使全部内容都有归属 landmark。其余页面无此问题，说明只是首页模板拼装顺序问题。

### I3 [P2][无障碍] Copy 按钮状态变化（Copy→Copied!）仅视觉可见
- 复现：详情页复制安装命令，按钮 textContent 变 'Copied!' 1.5 秒；无 aria-live，屏幕阅读器不播报。
- 影响：非视觉用户无法确认复制成功（WCAG 4.1.3 Status Messages）。
- 建议：按钮加 `aria-live="polite"`（文本本身在按钮内，最小改动即可播报），或独立 visually-hidden live region。

### I4 [P2][无障碍] 选中的 facet 仅靠 class="on" 颜色表达，无语义状态
- 复现：/servers?official=yes 中被选中的 Official 链接仅 `class="on"`，无 aria-current。
- 影响：屏幕阅读器无法得知当前生效的筛选（WCAG 1.4.1 Use of Color / 4.1.2）。
- 建议：选中 facet 链接加 `aria-current="true"`，复用分页已有的 [aria-current] 样式思路，与现有实现同构。

## 汇总
- P0：0 · P1：0 · P2：4（I1–I4）
- 全站无障碍基线已相当好（axe 近零违规），本轮四项均为语义/键盘层小补强，合计改动 <30 行，可一个 PR 完成。

## verdict（等修改员 fix 后线上复验追加）

## Round 09 verdict（2026-08-14 线上复验）
- I1 PASS：全页含 `<a class="skip" href="#main">` 与 `<main id="main">`（含 404 页实测）。
- I2 PASS：首页 hero 已为 `<section aria-label="Introduction">`；axe 复扫 5 页全部零违规（region 违规消失）。
- I3 PASS：copy 按钮已带 aria-live="polite"。
- I4 PASS：选中 facet 实测含 aria-current="true"（/servers?official=yes 的 Official）。
4/4 PASS，无 FAIL 项进入下一轮。
