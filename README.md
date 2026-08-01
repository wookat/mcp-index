# MCP Index

**[mcp.zalize.com](https://mcp.zalize.com)** — a structured, quality-scored directory of **3,200+ MCP servers** and **900+ agent skills**.

- 📖 **Browse the directory on GitHub** → [DIRECTORY.md](DIRECTORY.md) (top entries per category)
- 🔎 **Searchable site with filters** → [mcp.zalize.com](https://mcp.zalize.com)
- 📦 **Full dataset** → [`data/index.json`](data/index.json) (all fields, MIT-licensed metadata)

## What each entry includes

| Field | Meaning |
|---|---|
| Category | Functional category (Databases, Browser Automation, …) or skill vendor |
| Install method | npx / uvx / Docker / go install / cargo / SKILL.md / source |
| Stars, forks | Live GitHub metrics |
| Last commit | Repo `pushed_at` recency |
| Activity | 🟢 Active (≤30d) · 🟡 Maintained (≤90d) · 🟠 Stale (≤1y) · 🔴 Inactive · ⚫ Archived |
| Quality score | 0–100 heuristic: log-scaled stars (40) + activity (25) + license (10) + official (10) + not-archived (5) + description (5) + topics (5) |

## Data pipeline (rerunnable, weekly)

```bash
npm ci
node pipeline/fetch.mjs               # download source READMEs
node pipeline/parse.mjs               # parse -> data/entries-raw.json
GH_TOKEN=... node pipeline/enrich.mjs --refresh   # GitHub API metadata -> data/repo-meta.json
node pipeline/build.mjs               # merge + score -> data/index.json
node pipeline/readme.mjs              # regenerate DIRECTORY.md
```

A GitHub Actions workflow ([weekly-refresh.yml](.github/workflows/weekly-refresh.yml)) reruns the pipeline every Monday, commits the refreshed data, redeploys the site and pings IndexNow.

Sources: [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) · [punkpeye/awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers) · [VoltAgent/awesome-agent-skills](https://github.com/VoltAgent/awesome-agent-skills). Dead/renamed repos are dropped automatically on each refresh.

## Site

Cloudflare Worker (Hono, SSR, zero client framework). Dev / deploy:

```bash
npx wrangler dev
CLOUDFLARE_API_TOKEN=... npx wrangler deploy
node pipeline/indexnow.mjs   # push all URLs to IndexNow after deploy
```

Anonymous KV counters track pageviews / install-copy / repo clicks (`/api/stats`). No cookies, no personal data.

## Disclaimer

All listed projects belong to their respective authors under their own licenses. MCP Index aggregates public metadata only and is not affiliated with Anthropic or the Model Context Protocol project. Quality scores are heuristic signals, not endorsements — always review code before installing.

## License

MIT
