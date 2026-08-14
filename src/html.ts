import { Item, STATS, GENERATED_AT, catSlug } from './data';

export const SITE = 'https://mcp.zalize.com';

export function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// JSON embedded in a <script> block: the HTML parser closes the block at the
// first "</script>" regardless of JSON string context, so <, > and & must be
// JSON-unicode-escaped (semantically identical for structured-data parsers).
function scriptSafe(json: string): string {
  return json.replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}

const CSS = `
:root{
--bg:#09090b;--bg2:#101014;--card:#121216;--card2:#18181d;--border:#26262c;--border2:#34343c;
--text:#f4f4f5;--text2:#d4d4d8;--muted:#9d9da8;--faint:#8b8b96;
--accent:#8b93ff;--accent-strong:#6a74f8;--accent-soft:rgba(139,147,255,.12);
--green:#4ade80;--yellow:#fbbf24;--orange:#fb923c;--red:#f87171;
--radius:12px;--radius-sm:8px;
--shadow:0 1px 2px rgba(0,0,0,.4),0 8px 24px -12px rgba(0,0,0,.5)}
*{box-sizing:border-box;margin:0;padding:0}
html{scrollbar-gutter:stable}
body{background:var(--bg);color:var(--text);font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;line-height:1.6;-webkit-font-smoothing:antialiased;font-size:15px}
a{color:var(--accent);text-decoration:none}
a:hover{text-decoration:underline}
code,pre{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
.wrap{max-width:1220px;margin:0 auto;padding:0 20px}
/* header */
header.site{position:sticky;top:0;z-index:30;background:rgba(9,9,11,.82);backdrop-filter:blur(12px);border-bottom:1px solid var(--border)}
header.site .wrap{display:flex;align-items:center;gap:16px;height:60px}
.logo{font-weight:800;font-size:16.5px;letter-spacing:-.02em;color:var(--text);display:flex;align-items:center;gap:9px;white-space:nowrap}
.logo:hover{text-decoration:none}
.logo .dot{width:22px;height:22px;border-radius:7px;background:linear-gradient(135deg,var(--accent),#b18cff);display:inline-flex;align-items:center;justify-content:center;color:#0b0b12;font-size:13px;font-weight:900}
.hsearch{flex:1;max-width:420px;display:flex}
.hsearch input{width:100%;background:var(--card);border:1px solid var(--border);border-radius:10px;padding:8px 14px;color:var(--text);font-size:13.5px;outline:none;transition:border-color .15s}
.hsearch input:focus{border-color:var(--accent)}
nav.top{display:flex;gap:2px;margin-left:auto;align-items:center}
nav.top a{color:var(--muted);font-size:13.5px;font-weight:600;padding:7px 11px;border-radius:8px}
nav.top a:hover{color:var(--text);background:var(--card2);text-decoration:none}
nav.top a[aria-current]{color:var(--text)}
/* hero */
.skip{position:absolute;left:-9999px;top:0;z-index:100;background:var(--accent);color:#0b0b12;padding:10px 18px;border-radius:0 0 10px 0;font-weight:600;text-decoration:none}
.skip:focus{left:0}
.hero{padding:72px 0 40px;text-align:center;background:radial-gradient(ellipse 60% 55% at 50% -12%,rgba(139,147,255,.16),transparent),radial-gradient(ellipse 40% 40% at 80% 0%,rgba(177,140,255,.07),transparent)}
.hero .eyebrow{display:inline-flex;align-items:center;gap:8px;font-size:12.5px;font-weight:600;color:var(--muted);background:var(--card);border:1px solid var(--border);border-radius:999px;padding:5px 14px;margin-bottom:22px}
.hero .eyebrow .pulse{width:7px;height:7px;border-radius:50%;background:var(--green);box-shadow:0 0 0 3px rgba(74,222,128,.18)}
.hero .eyebrow .pulse.warn{background:var(--orange);box-shadow:0 0 0 3px rgba(251,146,60,.18)}
.hero h1{font-size:clamp(30px,5.6vw,52px);font-weight:800;letter-spacing:-.035em;line-height:1.08}
.hero h1 .grad{background:linear-gradient(90deg,var(--accent),#c4a5ff);-webkit-background-clip:text;background-clip:text;color:transparent}
.hero p.sub{color:var(--muted);font-size:clamp(15px,2.4vw,17.5px);max-width:600px;margin:16px auto 0}
.stats{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:26px}
.stat{background:var(--card);border:1px solid var(--border);border-radius:999px;padding:6px 16px;font-size:13px;color:var(--muted)}
.stat b{color:var(--text)}
.searchbar{max-width:620px;margin:28px auto 0;display:flex;gap:8px;background:var(--card);border:1px solid var(--border);border-radius:14px;padding:6px;box-shadow:var(--shadow)}
.searchbar:focus-within{border-color:var(--accent)}
.searchbar input{flex:1;background:transparent;border:none;padding:10px 12px;color:var(--text);font-size:15.5px;outline:none}
.btn{background:linear-gradient(135deg,var(--accent),var(--accent-strong));color:#0b0b12;font-weight:700;border:none;border-radius:10px;padding:11px 22px;font-size:14.5px;cursor:pointer;white-space:nowrap;transition:filter .15s}
.btn:hover{filter:brightness(1.1)}
.btn.ghost{background:var(--card2);color:var(--text);border:1px solid var(--border2)}
/* layout with sidebar */
.cols{display:grid;grid-template-columns:230px 1fr;gap:28px;align-items:start;margin-top:8px}
.cols>*{min-width:0}
aside.facets{position:sticky;top:76px;display:flex;flex-direction:column;gap:20px;max-height:calc(100vh - 96px);overflow-y:auto;padding-bottom:20px;scrollbar-width:thin}
.facet .fh{font-size:11.5px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--faint);margin-bottom:8px}
.facet a{display:flex;justify-content:space-between;gap:8px;color:var(--muted);font-size:13.5px;font-weight:500;padding:5px 10px;border-radius:8px;line-height:1.4}
.facet a:hover{color:var(--text);background:var(--card2);text-decoration:none}
.facet a.on{color:var(--text);background:var(--accent-soft);font-weight:650}
.facet a span{color:var(--faint);font-size:12px;font-variant-numeric:tabular-nums}
details.mfacets{display:none}
/* result rows */
.results-line{color:var(--muted);font-size:13px;margin:14px 0 12px}
.results-line b{color:var(--text)}
.rows{display:flex;flex-direction:column;gap:10px}
.row{display:flex;gap:14px;background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:16px 18px;transition:border-color .15s,background .15s;position:relative}
.row:hover{border-color:var(--border2);background:var(--card2)}
.row .avatar{width:42px;height:42px;border-radius:10px;flex:none;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:17px;color:#0b0b12}
.row .body{min-width:0;flex:1;display:flex;flex-direction:column;gap:4px}
.row h3{font-size:15px;font-weight:700;letter-spacing:-.01em;display:flex;align-items:center;gap:8px;flex-wrap:wrap;overflow-wrap:anywhere}
.row h3 a{color:var(--text)}
.row h3 a::after{content:'';position:absolute;inset:0}
.row .repo{color:var(--faint);font-size:12.5px;font-family:ui-monospace,Menlo,monospace;overflow-wrap:anywhere}
.row p.desc{color:var(--muted);font-size:13.5px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.row .meta{display:flex;gap:14px;color:var(--faint);font-size:12.5px;flex-wrap:wrap;margin-top:2px;align-items:center}
.row .meta b{color:var(--text2);font-weight:650}
.row .meta .cat{position:relative;z-index:1}
/* badges */
.badges{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
.badge{font-size:11px;font-weight:700;border-radius:6px;padding:1.5px 8px;background:var(--bg2);color:var(--muted);border:1px solid var(--border);white-space:nowrap}
.badge.type-server{color:var(--accent);border-color:rgba(139,147,255,.35);background:rgba(139,147,255,.08)}
.badge.type-skill{color:#c4a5ff;border-color:rgba(196,165,255,.35);background:rgba(196,165,255,.08)}
.badge.official{color:var(--green);border-color:rgba(74,222,128,.35);background:rgba(74,222,128,.07)}
.badge.act-active{color:var(--green)}
.badge.act-maintained{color:var(--yellow)}
.badge.act-stale{color:var(--orange)}
.badge.act-inactive,.badge.act-archived{color:var(--red)}
.dotb{display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:5px;vertical-align:1px}
.act-active .dotb{background:var(--green)}.act-maintained .dotb{background:var(--yellow)}.act-stale .dotb{background:var(--orange)}.act-inactive .dotb,.act-archived .dotb{background:var(--red)}
.grade{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:6px;font-size:12px;font-weight:800;flex:none;line-height:1}
.grade-a{background:rgba(74,222,128,.14);color:var(--green);border:1px solid rgba(74,222,128,.4)}
.grade-b{background:rgba(139,147,255,.12);color:var(--accent);border:1px solid rgba(139,147,255,.4)}
.grade-c{background:rgba(251,191,36,.12);color:var(--yellow);border:1px solid rgba(251,191,36,.4)}
.grade-d{background:rgba(251,146,60,.12);color:var(--orange);border:1px solid rgba(251,146,60,.4)}
.grade-f{background:rgba(248,113,113,.12);color:var(--red);border:1px solid rgba(248,113,113,.4)}
kbd.hint{border:1px solid var(--border2);background:var(--bg2);color:var(--faint);border-radius:6px;padding:2px 7px;font-size:11.5px;font-family:ui-monospace,Menlo,monospace;align-self:center;margin-right:6px}
.chip{display:inline-block;background:var(--card);border:1px solid var(--border);color:var(--muted);border-radius:999px;padding:5px 13px;font-size:13px;font-weight:600}
.chip:hover{color:var(--text);border-color:var(--accent);text-decoration:none}
/* grid cards (home) */
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(310px,1fr));gap:14px;margin:18px 0}
.card{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:18px;display:flex;flex-direction:column;gap:9px;transition:border-color .15s,transform .15s;position:relative}
.card:hover{border-color:var(--border2);transform:translateY(-1px)}
.card .toprow{display:flex;gap:10px;align-items:center}
.card .avatar{width:36px;height:36px;border-radius:9px;flex:none;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:15px;color:#0b0b12}
.card h3{font-size:14.5px;font-weight:700;letter-spacing:-.01em;overflow-wrap:anywhere;line-height:1.35}
.card h3 a{color:var(--text)}
.card h3 a::after{content:'';position:absolute;inset:0}
.card .repo{color:var(--faint);font-size:12px;font-family:ui-monospace,Menlo,monospace;overflow-wrap:anywhere}
.card p.desc{color:var(--muted);font-size:13px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;flex:1}
.card .meta{display:flex;gap:12px;color:var(--faint);font-size:12.5px;flex-wrap:wrap}
.card .meta b{color:var(--text2)}
/* sections */
.section{margin:44px 0}
.section-head{display:flex;align-items:baseline;justify-content:space-between;gap:12px;flex-wrap:wrap}
.section h2{font-size:21px;font-weight:800;letter-spacing:-.02em}
.section p.sub{color:var(--muted);font-size:13.5px;margin-top:3px}
.section .more{font-size:13.5px;font-weight:600;white-space:nowrap}
h1.page{font-size:clamp(22px,4vw,30px);font-weight:800;letter-spacing:-.025em}
.catgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px;margin-top:16px}
.catgrid a{background:var(--card);border:1px solid var(--border);border-radius:10px;padding:12px 15px;color:var(--text2);font-size:13.5px;font-weight:600;display:flex;justify-content:space-between;gap:8px;transition:border-color .15s}
.catgrid a:hover{border-color:var(--accent);color:var(--text);text-decoration:none}
.catgrid a span{color:var(--faint);font-weight:500;font-variant-numeric:tabular-nums}
.pager{display:flex;gap:8px;justify-content:center;margin:28px 0;flex-wrap:wrap}
.pager a,.pager span{padding:8px 14px;border-radius:9px;border:1px solid var(--border);background:var(--card);color:var(--text2);font-size:13.5px}
.pager span.cur{border-color:var(--accent);color:var(--accent);font-weight:700}
.pager a:hover{border-color:var(--border2);text-decoration:none;color:var(--text)}
/* detail */
.crumbs{color:var(--faint);font-size:13px;padding-top:20px;overflow-wrap:anywhere}
.crumbs a{color:var(--muted);text-decoration:underline;text-decoration-color:var(--border2);text-underline-offset:3px}
.vh{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
.detail{display:grid;grid-template-columns:1fr 290px;gap:32px;align-items:start;margin-top:20px}
.detail-head{display:flex;gap:18px;align-items:flex-start}
.detail-head .avatar{width:60px;height:60px;border-radius:15px;flex:none;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:26px;color:#0b0b12}
.detail-head h1{font-size:clamp(21px,4vw,29px);font-weight:800;letter-spacing:-.025em;overflow-wrap:anywhere;line-height:1.2}
.detail-head .repo{color:var(--faint);font-size:13px;font-family:ui-monospace,Menlo,monospace;margin-top:2px;overflow-wrap:anywhere}
.statchips{display:flex;gap:8px;flex-wrap:wrap;margin:16px 0}
.statchip{background:var(--card);border:1px solid var(--border);border-radius:999px;padding:5px 14px;font-size:12.5px;color:var(--muted)}
.statchip b{color:var(--text)}
aside.detail-side{position:sticky;top:76px;display:flex;flex-direction:column;gap:0;background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:6px 18px}
.side-item{padding:13px 0;border-bottom:1px solid var(--border)}
.side-item:last-child{border-bottom:none}
.side-item .k{color:var(--faint);font-size:11.5px;text-transform:uppercase;letter-spacing:.07em;font-weight:700}
.side-item .v{font-size:14px;font-weight:600;margin-top:3px;overflow-wrap:anywhere;color:var(--text2)}
.scorebar{height:8px;background:var(--bg2);border-radius:999px;overflow:hidden}
.scorebar i{display:block;height:100%;background:linear-gradient(90deg,var(--accent),#c4a5ff)}
.breakdown{display:flex;flex-direction:column;gap:9px;margin-top:14px}
.breakdown .brow{display:grid;grid-template-columns:150px 1fr 52px;gap:12px;align-items:center;font-size:13px;color:var(--muted)}
.breakdown .brow .bbar{height:6px;background:var(--bg2);border-radius:999px;overflow:hidden}
.breakdown .brow .bbar i{display:block;height:100%;background:var(--accent);opacity:.85}
.breakdown .brow .bval{text-align:right;color:var(--text2);font-weight:650;font-variant-numeric:tabular-nums}
pre.code{background:#0c0c10;border:1px solid var(--border);border-radius:12px;padding:16px;overflow-x:auto;font-size:13px;line-height:1.65;position:relative;margin-top:12px}
pre.code code{color:#cdd3e8;white-space:pre}
.copybtn{position:absolute;top:10px;right:10px;background:var(--card2);color:var(--muted);border:1px solid var(--border2);border-radius:8px;padding:5px 12px;font-size:12px;cursor:pointer;font-weight:600}
.copybtn:hover{color:var(--text);border-color:var(--accent)}
.topics{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}
/* footer */
footer.site{border-top:1px solid var(--border);margin-top:64px;padding:36px 0 44px;color:var(--muted);font-size:13px}
footer.site .fcols{display:flex;gap:32px;flex-wrap:wrap;justify-content:space-between}
footer.site .fine{margin-top:18px;color:var(--faint);font-size:12px;max-width:880px;line-height:1.6}
footer.site a{color:var(--muted)}
footer.site a:hover{color:var(--text)}
main p a,footer.site .fine a{text-decoration:underline}
/* sort links */
.sortlinks{color:var(--faint);font-size:13px;display:flex;gap:2px;align-items:center;flex-wrap:wrap}
.sortlinks a,.sortlinks .son{padding:6px 8px;border-radius:8px;font-weight:600}
.sortlinks a{color:var(--muted)}
.sortlinks a:hover{color:var(--text);background:var(--card2);text-decoration:none}
.sortlinks .son{color:var(--accent);background:var(--accent-soft)}
.toolbar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;justify-content:space-between;margin:14px 0 12px}
/* responsive */
@media(max-width:900px){
.cols{grid-template-columns:1fr;gap:14px}
aside.facets{position:static;max-height:none;display:none}
details.mfacets{display:block;margin:12px 0;background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:12px 16px}
details.mfacets summary{cursor:pointer;font-weight:700;font-size:14px;color:var(--text2)}
details.mfacets .facet{margin-top:14px}
.detail{grid-template-columns:1fr}
aside.detail-side{position:static}
}
@media(max-width:640px){
body{overflow-x:hidden}
/* Search row first inside the header, and a negative sticky top exactly its
   height: it scrolls away while the logo+nav rows stay stuck. */
header.site{top:-59px}
header.site .wrap{gap:6px 10px;flex-wrap:wrap;height:auto;padding-top:9px;padding-bottom:9px}
.hsearch{order:-1;flex-basis:100%;max-width:none}
.hsearch input{font-size:16px;height:44px}
nav.top{margin-left:auto;flex-wrap:wrap;justify-content:flex-end}
nav.top a{padding:9px 8px;font-size:13.5px}
.facet a{padding:10px;font-size:14px}
.copybtn{padding:9px 14px}
.toolbar{justify-content:flex-start}
.searchbar{flex-direction:column}
.searchbar input{font-size:16px}
kbd.hint{display:none}
.searchbar .btn{width:100%}
.grid{grid-template-columns:1fr}
.row{padding:14px}
.row .avatar{width:36px;height:36px;font-size:15px;border-radius:9px}
.breakdown .brow{grid-template-columns:110px 1fr 44px;gap:8px;font-size:12px}
main.home{display:flex;flex-direction:column}
main.home .section{margin:26px 0}
main.home .cat-home{order:-1}
}
`;

const CLIENT_JS = `
function track(ev){try{navigator.sendBeacon('/api/track',JSON.stringify({ev:ev}))}catch(e){}}
track('pageview');
document.addEventListener('click',function(e){
  var b=e.target.closest('.copybtn');
  if(b){var code=b.parentElement.querySelector('code');navigator.clipboard.writeText(code.innerText).then(function(){b.textContent='Copied!';setTimeout(function(){b.textContent='Copy'},1500)});track('copy_install');}
  var g=e.target.closest('a[data-track]');
  if(g){track(g.getAttribute('data-track'))}
});
document.addEventListener('keydown',function(e){
  var focusSearch=(e.key==='/'&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName))||((e.ctrlKey||e.metaKey)&&e.key==='k');
  if(focusSearch){
    var i=document.querySelector('.hsearch input,.searchbar input');
    if(i){e.preventDefault();i.focus()}
  }
});
`;

export function layout(opts: { title: string; desc: string; path: string; body: string; jsonld?: string | string[] }): string {
  const canonical = SITE + opts.path;
  const cur = (p: string) => (opts.path === p || (p !== '/' && opts.path.startsWith(p)) ? ' aria-current="page"' : '');
  const headerSearch = opts.path === '/' ? '' : `<form class="hsearch" method="get" action="/search"><input type="search" name="q" placeholder="Search ${STATS.total.toLocaleString()} servers &amp; skills…" aria-label="Search"><kbd class="hint" aria-hidden="true" style="margin-left:-34px">/</kbd></form>`;
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
<meta property="og:image" content="${SITE}/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${SITE}/og.png">
<meta name="theme-color" content="#09090b">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='24' fill='%238b93ff'/><text x='50' y='68' font-size='52' text-anchor='middle' font-family='sans-serif' font-weight='bold' fill='%230b0b12'>M</text></svg>">
${(Array.isArray(opts.jsonld) ? opts.jsonld : opts.jsonld ? [opts.jsonld] : []).map((j) => `<script type="application/ld+json">${scriptSafe(j)}</script>`).join('\n')}
<style>${CSS}</style>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="site"><div class="wrap">
<a class="logo" href="/"><span class="dot" aria-hidden="true">M</span>MCP Index</a>
${headerSearch}
<nav class="top">
<a href="/servers"${cur('/servers')}>Servers</a>
<a href="/skills"${cur('/skills')}>Skills</a>
<a href="/categories"${cur('/categories')}>Categories</a>
<a href="/about"${cur('/about')}>About</a>
<a href="https://github.com/wookat/mcp-index" data-track="github_click" rel="noopener">GitHub</a>
</nav>
</div></header>
${opts.body}
<footer class="site"><div class="wrap">
<div class="fcols">
<div>
<b style="color:var(--text)">MCP Index</b> — a structured, quality-scored directory of ${STATS.servers.toLocaleString()} MCP servers and ${STATS.skills.toLocaleString()} agent skills.<br>
Data refreshed weekly from public sources. Last update: ${GENERATED_AT.slice(0, 10)}.
</div>
<div>
<a href="/servers">MCP Servers</a> · <a href="/skills">Agent Skills</a> · <a href="/categories">Categories</a> · <a href="/about">About &amp; FAQ</a> · <a href="/llms.txt">llms.txt</a> · <a href="https://github.com/wookat/mcp-index" rel="noopener">GitHub</a>
</div>
</div>
<p class="fine">Disclaimer: MCP Index aggregates metadata from public sources (modelcontextprotocol/servers, awesome-mcp-servers, awesome-agent-skills, GitHub API). All listed projects belong to their respective authors under their own licenses. We are not affiliated with Anthropic or the Model Context Protocol project. Quality scores are heuristic signals, not endorsements — always review code before installing. No personal data is collected; anonymous page-view counters only.</p>
</div></footer>
<script>${CLIENT_JS}</script>
</body>
</html>`;
}

export function starFmt(n: number): string {
  return n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : String(n);
}

/** Relative to the dataset snapshot (GENERATED_AT), not the request time, so
 * "Updated Xd ago" stays truthful however long ago the data was refreshed. */
export function daysAgo(iso: string): string {
  const d = Math.floor((new Date(GENERATED_AT).getTime() - new Date(iso).getTime()) / 86400000);
  if (d <= 0) return 'today';
  if (d === 1) return 'yesterday';
  if (d < 30) return `${d}d ago`;
  if (d < 365) return `${Math.floor(d / 30)}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
}

export const ACTIVITY_LABEL: Record<string, string> = {
  active: 'Active', maintained: 'Maintained', stale: 'Stale', inactive: 'Inactive', archived: 'Archived', unknown: 'Unknown',
};

export const ACTIVITY_TITLE: Record<string, string> = {
  active: 'Last commit within 30 days',
  maintained: 'Last commit 1\u20133 months ago',
  stale: 'Last commit 3\u201312 months ago',
  inactive: 'No commits for over a year',
  archived: 'Repository archived by its owner',
  unknown: 'Repository metadata unavailable',
};

const AVATAR_HUES = [232, 262, 200, 160, 24, 340, 48, 288, 184, 8];
export function avatar(name: string, cls = 'avatar'): string {
  let h = 0;
  for (let k = 0; k < name.length; k++) h = (h * 31 + name.charCodeAt(k)) >>> 0;
  const hue = AVATAR_HUES[h % AVATAR_HUES.length];
  const ch = (name.replace(/^.*\//, '')[0] || 'm').toUpperCase();
  return `<span class="${cls}" style="background:linear-gradient(135deg,hsl(${hue},70%,74%),hsl(${(hue + 40) % 360},65%,62%))" aria-hidden="true">${esc(ch)}</span>`;
}

export function grade(score: number): string {
  const g = score >= 80 ? 'A' : score >= 65 ? 'B' : score >= 50 ? 'C' : score >= 35 ? 'D' : 'F';
  return `<span class="grade grade-${g.toLowerCase()}" title="Quality ${score}/100" aria-label="Quality grade ${g} (${score}/100)">${g}</span>`;
}

function badges(i: Item): string {
  return `<span class="badge type-${i.type}">${i.type === 'server' ? 'MCP Server' : 'Agent Skill'}</span>
${i.official ? '<span class="badge official">Official</span>' : ''}
<span class="badge act-${i.activity}" title="${ACTIVITY_TITLE[i.activity] || ''}"><span class="dotb"></span>${ACTIVITY_LABEL[i.activity] || i.activity}</span>`;
}

export function row(i: Item): string {
  return `<article class="row">
${avatar(i.name)}
<div class="body">
<h3><a href="/s/${i.slug}">${esc(i.name)}</a> ${grade(i.score)} ${badges(i)}</h3>
<div class="repo">${esc(i.repo)}${i.subpath ? '/' + esc(i.subpath) : ''}</div>
<p class="desc">${esc(i.description)}</p>
<div class="meta">
<span>★ <b>${starFmt(i.stars)}</b></span>
${i.language ? `<span>${esc(i.language)}</span>` : ''}
<span>Updated ${daysAgo(i.pushedAt)}</span>
<span>Score <b>${i.score}</b></span>
<a class="chip cat" style="padding:2px 10px;font-size:12px" href="/category/${catSlug(i.category)}">${esc(i.category)}</a>
</div>
</div>
</article>`;
}

export function card(i: Item): string {
  return `<article class="card">
<div class="toprow">${avatar(i.name)}<div style="min-width:0"><h3><a href="/s/${i.slug}">${esc(i.name)}</a> ${grade(i.score)}</h3><div class="repo">${esc(i.repo)}</div></div></div>
<div class="badges">${badges(i)}</div>
<p class="desc">${esc(i.description)}</p>
<div class="meta">
<span>★ <b>${starFmt(i.stars)}</b></span>
${i.language ? `<span>${esc(i.language)}</span>` : ''}
<span>${daysAgo(i.pushedAt)}</span>
<span>Score <b>${i.score}</b></span>
</div>
</article>`;
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
  return `<nav class="pager" aria-label="Pagination">${parts.join('')}</nav>`;
}
