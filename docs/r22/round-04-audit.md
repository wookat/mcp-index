# R22 Round 04 — 移动端专题审查（审查员）

日期：2026-08-14 · 线上 https://mcp.zalize.com · 数据 4,209 条（generatedAt 2026-08-14）
方法：Playwright 真浏览器 375×812 与 320×568（is_mobile+touch）走查 6 类页面 + 1440px 对照；实测 scrollWidth、tap target 尺寸、input 字号、复制按钮交互、分页器；截图见 docs/r22/screenshots/round-04/。

## 正面确认（无需修）
- 320px 与 375px 全部 6 类页面（home/servers/search/detail/categories/about）横向溢出 = 0px，无横向滚动。
- 移动端 Filters（details.mfacets）可展开、分类计数完整；详情页移动端已有全宽搜索框（R1-A7 修复持续有效）。
- 分页器结构精简（1 / 2 / … / 68 / Next），触达 40px 高，可用。
- 详情页 Copy 按钮点击后变为 "Copied!" 反馈正常。

## 发现清单

### D1 [P2][视觉/移动端] 多处 tap target 低于 44px 推荐值
- 复现：375px 下实测 — facet 链接高 28.9px、顶部导航链接高 30px（字号 12.5px）、详情页 Copy 按钮高 26px。
- 影响：移动端误触率升高，尤其 facet 列表是密集可点区域；WCAG 2.5.8 建议最小 24px（已达标）、Apple/Google 建议 44/48px。
- 建议：移动端媒体查询里给 `.facet a`、`nav.top a`、`.copy` 增加 padding 使命中区 ≥40px；桌面样式不动。
- 思辨：是否要全局改？不必——桌面鼠标精度高，现值合理；只在 `max-width:640px` 内加大 padding 是最小改动。

### D2 [P2][视觉/移动端] 搜索/列表页 Filters 折叠框与结果计数之间留白过大（约 90–100px）
- 复现：375px 打开 /search?q=postgres，Filters 框底与 "62 results" 之间有明显空白带（截图 search-375.png）。
- 原因：`.cols` grid 在移动端塌成单列后仍保留 28px gap + 隐藏 aside 的行占位/外边距叠加。
- 建议：移动端把 `.cols` 的 gap 收敛到 12–16px，或给 mfacets 之后的内容区去掉多余 margin-top。

### D3 [P2][功能/移动端] 搜索输入框字号 13.5px，iOS Safari 聚焦会强制放大页面
- 复现：实测 `.searchbar input` computed font-size = 13.5px；iOS 对 <16px 的 input 聚焦时自动 zoom，破坏 `initial-scale=1` 体验。
- 建议：移动端 input font-size 提到 16px（可仅在 `max-width:640px` 内），这是 iOS 兼容惯例，成本一行。

### D4 [P2][功能/移动端] Sort 下拉依赖 `onchange=this.form.submit()`，无 JS 时静默失效
- 复现：/servers Sort select 的 onchange 为 this.form.submit()；禁 JS 后改变排序无任何效果且无提交按钮。
- 影响：与站点"渐进增强、无 JS 可用"的整体架构（表单 GET、无框架）不一致，属于一致性缺口而非严重故障。
- 建议：在 `<noscript>` 中补一个小 Apply 按钮（与 R1 facet Apply 同模式），或接受现状但在代码注释声明例外。
- 思辨：更好设计是把 sort 直接做成 3 个链接（Quality/Stars/Updated），彻底去掉 JS 依赖与 select 控件——链接还可被爬虫发现，SEO 略优。供修改员权衡。

### D5 [P2][视觉/移动端] 顶部 sticky header 在 375px 高约 210px（Logo 行+导航行+搜索行），占屏近 26%
- 复现：375px 任意页滚动，header 常驻三行（截图 servers-pager-375.png 顶部）。
- 影响：小屏内容可视区被显著压缩；320px 下更明显。
- 建议：滚动后收起搜索行（纯 CSS 做不到，需少量 JS）或让搜索行不 sticky（只 sticky 第一行）；后者纯 CSS 可达，推荐。
- 思辨：是否值得为此加 JS？不值——把 sticky 限定在 logo+nav 行即可，搜索行随文档流滚走，符合"如无必要勿增实体"。

### D6 [P2][视觉/一致性] 首页移动端板块顺序：Top rated 之前无任何分类/搜索引导，浏览型用户需滚过 24 张卡才见 "Browse by category"
- 复现：375px 首页 full-page 截图（home-375.png / home-320.png），Browse by category 在页面最底部。
- 建议：移动端把分类导航（或一行分类 chips）提到 Top rated 之前；桌面保持现状。
- 思辨：首页信息架构对"找特定领域工具"的用户不友好；这与第 6 轮信息架构主题有重叠，本轮先记录，若修改员认为改动面大可留到 R6 一并处理。

### D7 [P2][视觉/移动端] 顶部导航字号 12.5px + muted 色，对比与可读性偏弱
- 复现：375px header 第二行导航 12.5px；与正文 15px+ 反差大。
- 建议：移动端 nav 字号提至 13.5–14px，与 D1 的 tap target 扩大合并处理。

## 汇总
- P0：0 · P1：0 · P2：7（D1–D7，均为移动端体验打磨项，可合并为一次 CSS 为主的小改动）
- 建议修改员将 D1/D3/D7 合并成一组 640px 媒体查询调整；D5 用"仅第一行 sticky"的纯 CSS 方案；D4/D6 可思辨后决定修或缓。

## verdict（等修改员 fix 后线上复验追加）

## Round 04 verdict（2026-08-14 线上复验，375px 真浏览器实测）
- D1 PASS：nav.top a 39.6px、facet a 39.6px（原 30/28.9）；Copy 按钮 34px（原 26，已达 WCAG 2.5.8 且明显改善，接受）。
- D2 PASS：.cols gap 实测 14px（原 28px），空白带消除。
- D3 PASS：搜索 input 字号实测 16px。
- D4 PASS：全站无 onchange；sort 改为 Quality/Stars/Updated 纯链接；?sort=stars&lang=Python 下 facet 链接均保留 sort+lang。采纳"链接替代 select"治本方案，好评。
- D5 PASS：header top:-59px；滚动后搜索行滚出（input top -50px），logo+nav 行保持 sticky，纯 CSS 实现。
- D6 PASS：移动端首页 h2 顺序实测 Browse by category(785) < Top rated(3049)，桌面不受影响。
- D7 PASS：nav 字号实测 13.5px。
- 回归：320/375 横向溢出仍为 0；Copy 交互正常。
7/7 PASS，无 FAIL 项进入下一轮。
