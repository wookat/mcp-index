# R14 比竞品更好的点（差异化清单）

对标 Smithery（smithery.ai）与 Glama（glama.ai/mcp）。

1. **评分完全透明**：每个详情页展示 0–100 分的逐项构成明细条（stars/活跃度/license/官方/未归档/描述/topics），与周更管道使用同一公式。Smithery 只给单一数字，Glama 只给 A–F 字母，均不展示计算过程。
2. **免登录、零商业耦合**：全部功能（搜索、筛选、安装命令复制）无需注册；Smithery 核心功能（Toolbox/Try now）需登录，且目录与其托管运行时商业绑定。
3. **更快**：纯 SSR、零客户端框架、单 Worker 边缘渲染，全页 HTML < 100KB；检索耗时直接展示在结果行（同 Smithery 的 "(331ms)" 口径，我们通常 <5ms）。
4. **facet 全维度带计数**：分类/语言/活跃度/安装方式四维 facet 全部实时计数并可组合（Glama 只有部分维度，Smithery 侧栏无计数）。
5. **新鲜度信号更直白**：Active/Maintained/Stale/Inactive/Archived 五级色点徽章在列表和详情统一展示，"上次提交 N 天前" 逐条可见；数据周更、死链自动剔除。
6. **一键复制安装配置**：详情页直接给出可粘贴的 MCP client JSON 配置（npx/uvx/docker/go/cargo 分渠道），并提示核实包名；Glama 无安装片段，Smithery 绑定自家 CLI。
7. **开放数据**：全量 `data/index.json`（MIT）+ 开源管道，任何人可复算评分。
8. **无跟踪**：无 cookie、无个人数据，仅匿名计数器；键盘 `/` 快捷聚焦搜索、全键盘可达、移动端 375px 完整适配。
