import { Item, STATS, GENERATED_AT, catSlug } from './data';

export const SITE = 'https://mcp.zalize.com';

export function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const CSS = `
:root{--bg:#0a0e17;--bg2:#111827;--card:#141c2e;--card2:#1a2440;--border:#243052;--text:#e5eaf5;--muted:#8b98b8;--accent:#6ea8fe;--accent2:#9d7bff;--green:#4ade80;--yellow:#facc15;--orange:#fb923c;--red:#f87171;--radius:14px}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--text);font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;line-height:1.55;-webkit-font-smoothing:antialiased}
a{color:var(--accent);text-decoration:none}
a:hover{text-decoration:underline}
.wrap{max-width:1180px;margin:0 auto;padding:0 16px}
header.site{position:sticky;top:0;z-index:20;background:rgba(10,14,23,.85);backdrop-filter:blur(10px);border-bottom:1px solid var(--border)}
header.site .wrap{display:flex;align-items:center;gap:14px;height:58px}
.logo{font-weight:800;font-size:17px;letter-spacing:-.02em;color:var(--text);display:flex;align-items:center;gap:8px;white-space:nowrap}
.logo:hover{text-decoration:none}
.logo .dot{width:10px;height:10px;border-radius:3px;background:linear-gradient(135deg,var(--accent),var(--accent2));display:inline-block}
nav.top{display:flex;gap:4px;margin-left:auto}
nav.top a{color:var(--muted);font-size:14px;font-weight:600;padding:7px 12px;border-radius:8px}
nav.top a:hover{color:var(--text);background:var(--card);text-decoration:none}
nav.top a.gh{color:var(--text)}
.hero{padding:56px 0 34px;text-align:center;background:radial-gradient(ellipse 70% 60% at 50% -10%,rgba(110,168,254,.14),transparent)}
.hero h1{font-size:clamp(28px,5.5vw,46px);font-weight:800;letter-spacing:-.03em;line-height:1.12}
.hero h1 .grad{background:linear-gradient(90deg,var(--accent),var(--accent2));-webkit-background-clip:text;background-clip:text;color:transparent}
.hero p.sub{color:var(--muted);font-size:clamp(15px,2.5vw,18px);max-width:620px;margin:14px auto 0}
.stats{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:22px}
.stat{background:var(--card);border:1px solid var(--border);border-radius:999px;padding:6px 16px;font-size:13px;color:var(--muted)}
.stat b{color:var(--text)}
.searchbar{max-width:640px;margin:26px auto 0;display:flex;gap:8px}
.searchbar input{flex:1;background:var(--card);border:1px solid var(--border);border-radius:12px;padding:13px 16px;color:var(--text);font-size:16px;outline:none}
.searchbar input:focus{border-color:var(--accent)}
.btn{background:linear-gradient(135deg,var(--accent),var(--accent2));color:#0b1020;font-weight:700;border:none;border-radius:12px;padding:13px 22px;font-size:15px;cursor:pointer;white-space:nowrap}
.btn:hover{opacity:.9}
.filters{display:flex;gap:8px;flex-wrap:wrap;margin:18px 0}
.filters select{background:var(--card);color:var(--text);border:1px solid var(--border);border-radius:9px;padding:8px 10px;font-size:13px}
.chip{display:inline-block;background:var(--card);border:1px solid var(--border);color:var(--muted);border-radius:999px;padding:5px 13px;font-size:13px;font-weight:600}
.chip:hover{color:var(--text);border-color:var(--accent);text-decoration:none}
.chip.on{background:linear-gradient(135deg,rgba(110,168,254,.2),rgba(157,123,255,.2));color:var(--text);border-color:var(--accent)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px;margin:18px 0}
.card{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:18px;display:flex;flex-direction:column;gap:8px;transition:border-color .15s}
.card:hover{border-color:var(--accent)}
.card h3{font-size:15.5px;font-weight:700;letter-spacing:-.01em;overflow-wrap:anywhere}
.card h3 a{color:var(--text)}
.card p.desc{color:var(--muted);font-size:13.5px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;flex:1}
.badges{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
.badge{font-size:11.5px;font-weight:700;border-radius:6px;padding:2px 8px;background:var(--bg2);color:var(--muted);border:1px solid var(--border)}
.badge.type-server{color:var(--accent);border-color:rgba(110,168,254,.4)}
.badge.type-skill{color:var(--accent2);border-color:rgba(157,123,255,.4)}
.badge.official{color:var(--green);border-color:rgba(74,222,128,.4)}
.badge.act-active{color:var(--green)}
.badge.act-maintained{color:var(--yellow)}
.badge.act-stale{color:var(--orange)}
.badge.act-inactive,.badge.act-archived{color:var(--red)}
.meta{display:flex;gap:12px;color:var(--muted);font-size:12.5px;flex-wrap:wrap}
.meta b{color:var(--text)}
.section{margin:36px 0}
.section h2{font-size:21px;font-weight:800;letter-spacing:-.02em;margin-bottom:4px}
.section p.sub{color:var(--muted);font-size:14px}
.catgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:10px;margin-top:16px}
.catgrid a{background:var(--card);border:1px solid var(--border);border-radius:10px;padding:12px 14px;color:var(--text);font-size:13.5px;font-weight:600;display:flex;justify-content:space-between;gap:8px}
.catgrid a:hover{border-color:var(--accent);text-decoration:none}
.catgrid a span{color:var(--muted);font-weight:400}
.pager{display:flex;gap:8px;justify-content:center;margin:26px 0;flex-wrap:wrap}
.pager a,.pager span{padding:8px 14px;border-radius:9px;border:1px solid var(--border);background:var(--card);color:var(--text);font-size:14px}
.pager span.cur{border-color:var(--accent);color:var(--accent);font-weight:700}
.detail-head{display:flex;flex-direction:column;gap:12px;padding:34px 0 8px}
.detail-head h1{font-size:clamp(22px,4.5vw,32px);font-weight:800;letter-spacing:-.02em;overflow-wrap:anywhere}
.scorebar{height:8px;background:var(--bg2);border-radius:999px;overflow:hidden;max-width:260px}
.scorebar i{display:block;height:100%;background:linear-gradient(90deg,var(--accent),var(--accent2))}
.kv{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:18px 0}
.kv .cell{background:var(--card);border:1px solid var(--border);border-radius:10px;padding:12px 14px}
.kv .cell .k{color:var(--muted);font-size:11.5px;text-transform:uppercase;letter-spacing:.06em}
.kv .cell .v{font-size:15px;font-weight:700;margin-top:3px;overflow-wrap:anywhere}
pre.code{background:#0d1322;border:1px solid var(--border);border-radius:12px;padding:16px;overflow-x:auto;font-size:13px;line-height:1.6;position:relative}
pre.code code{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;color:#c9d6f2;white-space:pre}
.copybtn{position:absolute;top:10px;right:10px;background:var(--card2);color:var(--muted);border:1px solid var(--border);border-radius:8px;padding:5px 12px;font-size:12px;cursor:pointer}
.copybtn:hover{color:var(--text)}
.topics{display:flex;gap:6px;flex-wrap:wrap}
.crumbs{color:var(--muted);font-size:13px;padding-top:18px}
footer.site{border-top:1px solid var(--border);margin-top:56px;padding:30px 0 40px;color:var(--muted);font-size:13px}
footer.site .cols{display:flex;gap:28px;flex-wrap:wrap;justify-content:space-between}
footer.site p{max-width:640px}
@media(max-width:640px){.searchbar{flex-direction:column}.btn{width:100%}.grid{grid-template-columns:1fr}nav.top a{padding:7px 8px;font-size:13px}}
`;

const CLIENT_JS = `
function track(ev,label){try{navigator.sendBeacon('/api/track',JSON.stringify({ev:ev,label:label||''}))}catch(e){}}
track('pageview',location.pathname);
document.addEventListener('click',function(e){
  var b=e.target.closest('.copybtn');
  if(b){var code=b.parentElement.querySelector('code');navigator.clipboard.writeText(code.innerText).then(function(){b.textContent='Copied!';setTimeout(function(){b.textContent='Copy'},1500)});track('copy_install',location.pathname);}
  var g=e.target.closest('a[data-track]');
  if(g){track(g.getAttribute('data-track'),location.pathname)}
});
`;

export function layout(opts: { title: string; desc: string; path: string; body: string; jsonld?: string }): string {
  const canonical = SITE + opts.path;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(opts.title)}</title>
<meta name="description" content="${esc(opts.desc)}">
<link rel="canonical" href="${canonical}">
<meta property="og:title" content="${esc(opts.title)}">
<meta property="og:description" content="${esc(opts.desc)}">
<meta property="og:url" content="${canonical}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="MCP Index">
<meta name="twitter:card" content="summary">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%236ea8fe'/><text x='50' y='68' font-size='52' text-anchor='middle' font-family='sans-serif' font-weight='bold' fill='%230a0e17'>M</text></svg>">
${opts.jsonld ? `<script type="application/ld+json">${opts.jsonld}</script>` : ''}
<style>${CSS}</style>
</head>
<body>
<header class="site"><div class="wrap">
<a class="logo" href="/"><span class="dot"></span>MCP Index</a>
<nav class="top">
<a href="/servers">Servers</a>
<a href="/skills">Skills</a>
<a href="/categories">Categories</a>
<a href="/about">About</a>
<a class="gh" href="https://github.com/wookat/mcp-index" data-track="github_click" rel="noopener">GitHub</a>
</nav>
</div></header>
${opts.body}
<footer class="site"><div class="wrap">
<div class="cols">
<div>
<b style="color:var(--text)">MCP Index</b> — a structured, quality-scored directory of ${STATS.servers.toLocaleString()} MCP servers and ${STATS.skills.toLocaleString()} agent skills.<br>
Data refreshed weekly from public sources. Last update: ${GENERATED_AT.slice(0, 10)}.
</div>
<div>
<a href="/servers">MCP Servers</a> · <a href="/skills">Agent Skills</a> · <a href="/categories">Categories</a> · <a href="/about">About &amp; FAQ</a> · <a href="https://github.com/wookat/mcp-index" rel="noopener">GitHub</a>
</div>
</div>
<p style="margin-top:16px">Disclaimer: MCP Index aggregates metadata from public sources (modelcontextprotocol/servers, awesome-mcp-servers, awesome-agent-skills, GitHub API). All listed projects belong to their respective authors under their own licenses. We are not affiliated with Anthropic or the Model Context Protocol project. Quality scores are heuristic signals, not endorsements — always review code before installing. No personal data is collected; anonymous page-view counters only.</p>
</div></footer>
<script>${CLIENT_JS}</script>
</body>
</html>`;
}

export function starFmt(n: number): string {
  return n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : String(n);
}

export function daysAgo(iso: string): string {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d <= 0) return 'today';
  if (d === 1) return 'yesterday';
  if (d < 30) return `${d}d ago`;
  if (d < 365) return `${Math.floor(d / 30)}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
}

export const ACTIVITY_LABEL: Record<string, string> = {
  active: 'Active', maintained: 'Maintained', stale: 'Stale', inactive: 'Inactive', archived: 'Archived', unknown: 'Unknown',
};

export function card(i: Item): string {
  return `<div class="card">
<div class="badges">
<span class="badge type-${i.type}">${i.type === 'server' ? 'MCP Server' : 'Agent Skill'}</span>
${i.official ? '<span class="badge official">Official</span>' : ''}
<span class="badge act-${i.activity}">${ACTIVITY_LABEL[i.activity] || i.activity}</span>
</div>
<h3><a href="/s/${i.slug}">${esc(i.name)}</a></h3>
<p class="desc">${esc(i.description)}</p>
<div class="meta">
<span>★ <b>${starFmt(i.stars)}</b></span>
${i.language ? `<span>${esc(i.language)}</span>` : ''}
<span>Updated ${daysAgo(i.pushedAt)}</span>
<span>Score <b>${i.score}</b></span>
</div>
<div class="badges"><a class="chip" href="/category/${catSlug(i.category)}">${esc(i.category)}</a></div>
</div>`;
}

export function pager(base: string, page: number, pages: number): string {
  if (pages <= 1) return '';
  const link = (p: number, label?: string) => {
    const url = base + (base.includes('?') ? '&' : '?') + 'page=' + p;
    return p === page && !label ? `<span class="cur">${p}</span>` : `<a href="${esc(url)}">${label || p}</a>`;
  };
  const parts: string[] = [];
  if (page > 1) parts.push(link(page - 1, '‹ Prev'));
  const shown = new Set([1, page - 1, page, page + 1, pages].filter((p) => p >= 1 && p <= pages));
  let last = 0;
  for (const p of [...shown].sort((a, b) => a - b)) {
    if (p - last > 1) parts.push('<span>…</span>');
    parts.push(link(p));
    last = p;
  }
  if (page < pages) parts.push(link(page + 1, 'Next ›'));
  return `<div class="pager">${parts.join('')}</div>`;
}
