import { Hono } from 'hono';
import { ITEMS, BY_SLUG, CATEGORIES, STATS, GENERATED_AT, catSlug, search, Query, Item } from './data';
import { layout, esc, card, row, pager, starFmt, daysAgo, avatar, grade, ACTIVITY_LABEL, SITE } from './html';
import OG_IMAGE from './og.png';

const INDEXNOW_KEY = '8b38cfa490ebd06f8b4ec7290a002646';

type Env = { METRICS: KVNamespace };

const app = new Hono<{ Bindings: Env }>();

const INSTALL_LABEL: Record<string, string> = {
  npx: 'npm / npx', uvx: 'Python (uvx / pip)', docker: 'Docker', 'go-install': 'Go', cargo: 'Rust (cargo)',
  dotnet: '.NET', jar: 'Java', source: 'From source', 'skill-md': 'SKILL.md',
};

function parseQuery(c: { req: { query: (k: string) => string | undefined } }): Query {
  return {
    q: c.req.query('q') || undefined,
    type: c.req.query('type') || undefined,
    category: c.req.query('category') || undefined,
    lang: c.req.query('lang') || undefined,
    activity: c.req.query('activity') || undefined,
    install: c.req.query('install') || undefined,
    official: c.req.query('official') || undefined,
    sort: c.req.query('sort') || undefined,
    page: parseInt(c.req.query('page') || '1', 10) || 1,
  };
}

const LANGS = (() => {
  const m = new Map<string, number>();
  for (const i of ITEMS) if (i.language) m.set(i.language, (m.get(i.language) || 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([l]) => l);
})();

function matchesText(i: Item, q?: string): boolean {
  if (!q) return true;
  const terms = q.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const hay = `${i.name} ${i.repo} ${i.description} ${i.category} ${i.topics.join(' ')}`.toLowerCase();
  return terms.every((t) => hay.includes(t));
}

/** Items matching every dimension of q except the excluded one (for facet counts). */
function baseFor(q: Query, except: string): Item[] {
  return ITEMS.filter((i) =>
    matchesText(i, q.q) &&
    (except === 'type' || !q.type || i.type === q.type) &&
    (except === 'category' || !q.category || catSlug(i.category) === q.category) &&
    (except === 'lang' || !q.lang || (i.language || '').toLowerCase() === q.lang.toLowerCase()) &&
    (except === 'activity' || !q.activity || i.activity === q.activity) &&
    (except === 'install' || !q.install || i.install === q.install) &&
    (except === 'official' || !q.official || i.official));
}

function facetSidebar(q: Query, action: string): string {
  const link = (dim: keyof Query, value: string, label: string, count: number, on: boolean) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(q)) if (v && k !== 'page' && k !== dim && k !== 'type') qs.set(k, String(v));
    if (action === '/search' && q.type) qs.set('type', q.type);
    if (!on) qs.set(dim as string, value);
    if (dim === 'type') { qs.delete('type'); if (!on) qs.set('type', value); }
    const href = action + (qs.toString() ? '?' + qs.toString() : '');
    return `<a href="${esc(href)}"${on ? ' class="on"' : ''}>${esc(label)}<span>${count.toLocaleString()}</span></a>`;
  };
  const facet = (title: string, dim: keyof Query, opts: [string, string][], cur?: string) => {
    const base = baseFor(q, dim as string);
    const counts = new Map<string, number>();
    for (const i of base) {
      const key = dim === 'type' ? i.type : dim === 'category' ? catSlug(i.category) : dim === 'lang' ? (i.language || '') : dim === 'activity' ? i.activity : dim === 'official' ? (i.official ? 'yes' : '') : i.install;
      counts.set(key.toLowerCase(), (counts.get(key.toLowerCase()) || 0) + 1);
    }
    const rows = opts
      .map(([v, l]) => ({ v, l, n: counts.get(v.toLowerCase()) || 0 }))
      .filter((r) => r.n > 0 || r.v === cur);
    if (!rows.length) return '';
    return `<div class="facet"><div class="fh">${esc(title)}</div>${rows.map((r) => link(dim, r.v, r.l, r.n, r.v === cur)).join('')}</div>`;
  };
  const inner = `
${action === '/search' ? facet('Type', 'type', [['server', 'MCP Servers'], ['skill', 'Agent Skills']], q.type) : ''}
${facet('Status', 'official', [['yes', 'Official']], q.official)}
${facet('Category', 'category', CATEGORIES.slice(0, 24).map((c) => [c.slug, c.name] as [string, string]), q.category)}
${facet('Language', 'lang', LANGS.map((l) => [l, l] as [string, string]), q.lang)}
${facet('Activity', 'activity', Object.entries(ACTIVITY_LABEL).filter(([k]) => k !== 'unknown') as [string, string][], q.activity)}
${facet('Install method', 'install', Object.entries(INSTALL_LABEL) as [string, string][], q.install)}`;
  const nActive = [q.category, q.lang, q.activity, q.install, q.official].filter(Boolean).length;
  const clearHref = action + (q.q ? '?q=' + encodeURIComponent(q.q) : '');
  const clear = nActive ? `<div class="facet"><a href="${esc(clearHref)}" style="color:var(--accent)">✕ Clear all filters<span>${nActive}</span></a></div>` : '';
  return `<aside class="facets" aria-label="Filters">${clear}${inner}</aside>
<details class="mfacets"><summary>Filters${nActive ? ` (${nActive} active)` : ''}</summary>${clear}${inner}</details>`;
}

function listPage(c: any, q: Query, opts: { path: string; title: string; h1: string; desc: string; action: string }) {
  const t0 = Date.now();
  const { results, total, pages } = search(q);
  const ms = Date.now() - t0;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) if (v && k !== 'page') qs.set(k, String(v));
  const base = opts.action + (qs.toString() ? '?' + qs.toString() : '');
  const sortSel = `<form method="get" action="${opts.action}">
${['q', 'type', 'category', 'lang', 'activity', 'install', 'official'].map((k) => (q as any)[k] && !(opts.action !== '/search' && k === 'type') ? `<input type="hidden" name="${k}" value="${esc(String((q as any)[k]))}">` : '').join('')}
<label style="color:var(--faint);font-size:12.5px" for="sort">Sort</label>
<select class="sel" id="sort" name="sort" onchange="this.form.submit()">
<option value="">Quality score</option>
<option value="stars"${q.sort === 'stars' ? ' selected' : ''}>Most stars</option>
<option value="updated"${q.sort === 'updated' ? ' selected' : ''}>Recently updated</option>
</select></form>`;
  const body = `<main class="wrap">
<div class="crumbs"><a href="/">Home</a> › ${esc(opts.h1)}</div>
<div style="margin-top:14px"><h1 class="page">${esc(opts.h1)}</h1>
<p class="sub" style="color:var(--muted);font-size:14px;margin-top:4px">${esc(opts.desc)}.</p></div>
<form method="get" action="${opts.action}" style="margin:16px 0 0"><div class="searchbar" style="margin:0;max-width:640px"><input type="search" name="q" placeholder="Search by name, description, topic…" value="${esc(q.q || '')}">${q.type && opts.action === '/search' ? `<input type="hidden" name="type" value="${esc(q.type)}">` : ''}<button class="btn" type="submit">Search</button></div></form>
<div class="cols" style="margin-top:18px">
${facetSidebar(q, opts.action)}
<div>
<div class="toolbar"><div class="results-line"><b>${total.toLocaleString()}</b> result${total === 1 ? '' : 's'} <span style="color:var(--faint)">(${ms || '<1'}ms) · data updated ${GENERATED_AT.slice(0, 10)}</span></div>${sortSel}</div>
<div class="rows">${results.map(row).join('')}</div>
${results.length === 0 ? '<p style="color:var(--muted);text-align:center;margin:40px 0">No results. Try a different search or clear filters.</p>' : ''}
${pager(base, q.page, pages)}
</div>
</div>
</main>`;
  const jsonld = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'ItemList',
    name: opts.h1, numberOfItems: total,
    itemListElement: results.slice(0, 10).map((i, n) => ({
      '@type': 'ListItem', position: (q.page - 1) * 48 + n + 1, name: i.name, url: `${SITE}/s/${i.slug}`,
    })),
  });
  return c.html(layout({ title: opts.title, desc: opts.desc, path: opts.path, body, jsonld }));
}

app.get('/', (c) => {
  const top = ITEMS.slice(0, 12);
  const official = ITEMS.filter((i) => i.official).slice(0, 6);
  const recent = [...ITEMS].sort((a, b) => b.pushedAt.localeCompare(a.pushedAt)).slice(0, 6);
  const body = `
<div class="hero"><div class="wrap">
<div class="eyebrow"><span class="pulse"></span>Refreshed weekly · last update ${GENERATED_AT.slice(0, 10)}</div>
<h1>Find the right <span class="grad">MCP server</span><br>and <span class="grad">agent skill</span>, fast</h1>
<p class="sub">A structured, quality-scored directory of ${STATS.servers.toLocaleString()} Model Context Protocol servers and ${STATS.skills.toLocaleString()} agent skills — with maintenance signals, install methods and stars.</p>
<form method="get" action="/search"><div class="searchbar"><input type="search" name="q" placeholder="Try: postgres, browser automation, stripe…" autofocus><kbd class="hint" aria-hidden="true">/</kbd><button class="btn" type="submit">Search</button></div></form>
<div class="stats">
<span class="stat"><b>${STATS.servers.toLocaleString()}</b> servers</span>
<span class="stat"><b>${STATS.skills.toLocaleString()}</b> skills</span>
<span class="stat"><b>${STATS.categories}</b> categories</span>
<span class="stat"><b>${STATS.active.toLocaleString()}</b> active repos</span>
</div>
</div></div>
<main class="wrap">
<div class="section">
<div class="section-head"><div><h2>Top rated</h2>
<p class="sub">Highest quality score: stars × maintenance activity × license × docs signals.</p></div>
<span class="more"><a href="/servers">All servers →</a> · <a href="/skills">All skills →</a></span></div>
<div class="grid">${top.map(card).join('')}</div>
</div>
<div class="section">
<div class="section-head"><div><h2>Official picks</h2>
<p class="sub">Servers published by the vendor itself — first-party maintained.</p></div>
<span class="more"><a href="/search?official=yes">All official →</a></span></div>
<div class="grid">${official.map(card).join('')}</div>
</div>
<div class="section">
<div class="section-head"><h2>Recently updated</h2></div>
<div class="grid">${recent.map(card).join('')}</div>
</div>
<div class="section">
<div class="section-head"><div><h2>Browse by category</h2></div><span class="more"><a href="/categories">All ${STATS.categories} categories →</a></span></div>
<div class="catgrid">${CATEGORIES.slice(0, 36).map((cat) => `<a href="/category/${cat.slug}">${esc(cat.name)}<span>${cat.count}</span></a>`).join('')}</div>
</div>
</main>`;
  const jsonld = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'WebSite', name: 'MCP Index', url: SITE,
    potentialAction: { '@type': 'SearchAction', target: `${SITE}/search?q={search_term_string}`, 'query-input': 'required name=search_term_string' },
  });
  return c.html(layout({
    title: `MCP Index — ${STATS.servers.toLocaleString()}+ MCP Servers & Agent Skills Directory`,
    desc: `Searchable directory of ${STATS.servers.toLocaleString()} Model Context Protocol servers and ${STATS.skills.toLocaleString()} agent skills with quality scores, maintenance activity, stars and install methods. Updated weekly.`,
    path: '/', body, jsonld,
  }));
});

app.get('/search', (c) => {
  const q = parseQuery(c);
  return listPage(c, q, {
    path: '/search', action: '/search',
    title: q.q ? `${q.q} — Search MCP Index` : 'Search — MCP Index',
    h1: q.q ? `Search: ${q.q}` : 'Search',
    desc: 'Search MCP servers and agent skills by name, description, category or topic',
  });
});

app.get('/servers', (c) => {
  const q = parseQuery(c); q.type = 'server';
  return listPage(c, q, {
    path: '/servers', action: '/servers',
    title: `All ${STATS.servers.toLocaleString()} MCP Servers — MCP Index`,
    h1: 'MCP Servers',
    desc: 'Browse all Model Context Protocol servers with quality scores, stars, languages and maintenance activity',
  });
});

app.get('/skills', (c) => {
  const q = parseQuery(c); q.type = 'skill';
  return listPage(c, q, {
    path: '/skills', action: '/skills',
    title: `All ${STATS.skills.toLocaleString()} Agent Skills — MCP Index`,
    h1: 'Agent Skills',
    desc: 'Browse SKILL.md-based agent skills for Claude Code, Codex, Cursor, Gemini CLI and more',
  });
});

app.get('/categories', (c) => {
  const body = `<main class="wrap">
<div class="crumbs"><a href="/">Home</a> › Categories</div>
<div class="section" style="margin-top:14px"><h1 class="page">All categories</h1>
<p class="sub" style="margin-top:4px">${STATS.categories} categories across ${STATS.total.toLocaleString()} entries.</p>
<div class="catgrid">${CATEGORIES.map((cat) => `<a href="/category/${cat.slug}">${esc(cat.name)}<span>${cat.count}</span></a>`).join('')}</div>
</div></main>`;
  return c.html(layout({ title: 'All Categories — MCP Index', desc: `Browse ${STATS.categories} categories of MCP servers and agent skills.`, path: '/categories', body }));
});

app.get('/category/:slug', (c) => {
  const slug = c.req.param('slug');
  const cat = CATEGORIES.find((x) => x.slug === slug);
  if (!cat) return c.notFound();
  const q = parseQuery(c); q.category = slug;
  return listPage(c, q, {
    path: `/category/${slug}`, action: `/category/${slug}`,
    title: `${cat.name} — ${cat.count} MCP Servers & Skills — MCP Index`,
    h1: cat.name,
    desc: `${cat.count} MCP servers and agent skills in the ${cat.name} category, ranked by quality score`,
  });
});

function installSnippet(i: Item): { label: string; code: string } | null {
  const pkgGuess = i.repo.split('/')[1];
  if (i.type === 'skill') {
    return {
      label: 'Install this skill (Claude Code)',
      code: `# Clone and copy the skill into your project\ngit clone https://github.com/${i.repo}.git\nmkdir -p .claude/skills\ncp -r ${i.repo.split('/')[1]}/${i.subpath || ''} .claude/skills/\n# Or for personal use: ~/.claude/skills/`,
    };
  }
  if (i.install === 'npx') {
    return {
      label: 'Example client config (verify package name in the repo README)',
      code: `{\n  "mcpServers": {\n    "${pkgGuess}": {\n      "command": "npx",\n      "args": ["-y", "${pkgGuess}"]\n    }\n  }\n}`,
    };
  }
  if (i.install === 'uvx') {
    return {
      label: 'Example client config (verify package name in the repo README)',
      code: `{\n  "mcpServers": {\n    "${pkgGuess}": {\n      "command": "uvx",\n      "args": ["${pkgGuess}"]\n    }\n  }\n}`,
    };
  }
  if (i.install === 'docker') {
    return { label: 'Run with Docker (see repo README for the image name)', code: `docker run -i --rm <image-for-${pkgGuess}>` };
  }
  if (i.install === 'go-install') {
    return { label: 'Install with Go', code: `go install github.com/${i.repo}@latest` };
  }
  if (i.install === 'cargo') {
    return { label: 'Build from source (Rust)', code: `git clone https://github.com/${i.repo}.git\ncd ${pkgGuess}\ncargo build --release` };
  }
  return { label: 'Install from source', code: `git clone https://github.com/${i.repo}.git\n# See the repository README for setup instructions` };
}

/** Mirrors pipeline/build.mjs qualityScore(); components the dataset doesn't expose
 * (description source, 100-point cap) are reconciled against the published score so
 * the breakdown always sums to exactly i.score. */
function scoreBreakdown(i: Item): { label: string; got: number; max: number }[] {
  let stars = Math.min(40, Math.round(Math.log10(i.stars + 1) * 10));
  const act = ({ active: 25, maintained: 18, stale: 8, inactive: 0, archived: 0 } as Record<string, number>)[i.activity] ?? 0;
  const license = i.license ? 10 : 0;
  const official = i.official ? 10 : 0;
  const notArchived = i.archived ? 0 : 5;
  const topics = i.topics.length >= 3 ? 5 : 0;
  const known = stars + act + license + official + notArchived + topics;
  // Pipeline scored the description bonus on the GitHub description, which isn't in the dataset.
  const desc = Math.max(0, Math.min(5, i.score - known));
  const over = known + desc - i.score; // >0 only when the pipeline capped the score at 100
  if (over > 0) stars = Math.max(0, stars - over);
  return [
    { label: 'GitHub stars (log scale)', got: stars, max: 40 },
    { label: 'Maintenance activity', got: act, max: 25 },
    { label: 'License present', got: license, max: 10 },
    { label: 'Official project', got: official, max: 10 },
    { label: 'Not archived', got: notArchived, max: 5 },
    { label: 'Meaningful description', got: desc, max: 5 },
    { label: 'Repo topics set', got: topics, max: 5 },
  ];
}

app.get('/s/:slug', (c) => {
  const i = BY_SLUG.get(c.req.param('slug'));
  if (!i) return c.notFound();
  const snip = installSnippet(i);
  const related = ITEMS.filter((x) => x.category === i.category && x.slug !== i.slug).slice(0, 6);
  const breakdown = scoreBreakdown(i);
  const body = `<main class="wrap">
<div class="crumbs"><a href="/">Home</a> › <a href="/${i.type === 'server' ? 'servers' : 'skills'}">${i.type === 'server' ? 'Servers' : 'Skills'}</a> › <a href="/category/${catSlug(i.category)}">${esc(i.category)}</a> › ${esc(i.name)}</div>
<div class="detail">
<div>
<div class="detail-head">
${avatar(i.name)}
<div style="min-width:0">
<h1>${esc(i.name)}</h1>
<div class="repo">${esc(i.repo)}${i.subpath ? '/' + esc(i.subpath) : ''}</div>
<div class="badges" style="margin-top:8px">
<span class="badge type-${i.type}">${i.type === 'server' ? 'MCP Server' : 'Agent Skill'}</span>
${i.official ? '<span class="badge official">Official</span>' : ''}
<span class="badge act-${i.activity}"><span class="dotb"></span>${ACTIVITY_LABEL[i.activity]}</span>
${i.license ? `<span class="badge">${esc(i.license)}</span>` : ''}
${i.scopes.map((s) => `<span class="badge">${esc(s)}</span>`).join('')}
</div>
</div>
</div>
<p style="color:var(--muted);max-width:720px;margin-top:16px">${esc(i.description)}</p>
<div class="statchips">
<span class="statchip" style="display:inline-flex;align-items:center;gap:7px">${grade(i.score)} Quality <b>${i.score}/100</b></span>
<span class="statchip">★ <b>${starFmt(i.stars)}</b> stars</span>
<span class="statchip">Updated <b>${daysAgo(i.pushedAt)}</b></span>
${i.language ? `<span class="statchip"><b>${esc(i.language)}</b></span>` : ''}
</div>
<div><a class="btn" style="display:inline-block;text-decoration:none" href="${esc(i.url)}" data-track="repo_click" rel="noopener nofollow">View on GitHub →</a></div>
${snip ? `<div class="section" style="margin:34px 0"><h2>Installation</h2><p class="sub">${esc(snip.label)}</p><pre class="code"><button class="copybtn" type="button">Copy</button><code>${esc(snip.code)}</code></pre></div>` : ''}
<div class="section" style="margin:34px 0">
<h2>Quality score breakdown</h2>
<p class="sub">Transparent heuristic — same formula for every entry. Total <b style="color:var(--text)">${i.score}/100</b>.</p>
<div class="breakdown">
${breakdown.map((b) => `<div class="brow"><span>${esc(b.label)}</span><span class="bbar"><i style="width:${b.max ? Math.round((b.got / b.max) * 100) : 0}%"></i></span><span class="bval">${b.got}/${b.max}</span></div>`).join('')}
</div>
</div>
${i.topics.length ? `<div class="section" style="margin:34px 0"><h2>Topics</h2><div class="topics">${i.topics.map((t) => `<a class="chip" href="/search?q=${encodeURIComponent(t)}">${esc(t)}</a>`).join('')}</div></div>` : ''}
</div>
<aside class="detail-side">
<div class="side-item"><div class="k">Quality score</div><div class="v" style="display:flex;align-items:center;gap:10px"><span>${i.score}/100</span><span class="scorebar" style="flex:1"><i style="width:${i.score}%"></i></span></div></div>
<div class="side-item"><div class="k">Stars</div><div class="v">★ ${starFmt(i.stars)}</div></div>
<div class="side-item"><div class="k">Forks</div><div class="v">${starFmt(i.forks)}</div></div>
<div class="side-item"><div class="k">Last commit</div><div class="v">${daysAgo(i.pushedAt)}</div></div>
<div class="side-item"><div class="k">Language</div><div class="v">${esc(i.language || '—')}</div></div>
<div class="side-item"><div class="k">Install</div><div class="v">${esc(INSTALL_LABEL[i.install] || i.install)}</div></div>
<div class="side-item"><div class="k">License</div><div class="v">${esc(i.license || '—')}</div></div>
<div class="side-item"><div class="k">Category</div><div class="v"><a href="/category/${catSlug(i.category)}">${esc(i.category)}</a></div></div>
<div class="side-item"><div class="k">Repository</div><div class="v"><a href="https://github.com/${esc(i.repo)}" rel="noopener nofollow">${esc(i.repo)}</a></div></div>
</aside>
</div>
${related.length ? `<div class="section"><h2>Related in ${esc(i.category)}</h2><div class="grid">${related.map(card).join('')}</div></div>` : ''}
</main>`;
  const breadcrumbLd = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
      { '@type': 'ListItem', position: 2, name: i.type === 'server' ? 'Servers' : 'Skills', item: `${SITE}/${i.type === 'server' ? 'servers' : 'skills'}` },
      { '@type': 'ListItem', position: 3, name: i.category, item: `${SITE}/category/${catSlug(i.category)}` },
      { '@type': 'ListItem', position: 4, name: i.name, item: `${SITE}/s/${i.slug}` },
    ],
  });
  const jsonld = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'SoftwareApplication',
    name: i.name, description: i.description, url: `${SITE}/s/${i.slug}`,
    applicationCategory: 'DeveloperApplication', operatingSystem: 'Cross-platform',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    aggregateRating: i.stars > 5 ? { '@type': 'AggregateRating', ratingValue: Math.max(1, Math.min(5, i.score / 20)).toFixed(1), ratingCount: i.stars } : undefined,
    sameAs: [`https://github.com/${i.repo}`],
  });
  return c.html(layout({
    title: `${i.name} — ${i.type === 'server' ? 'MCP Server' : 'Agent Skill'} — MCP Index`,
    desc: `${i.description.slice(0, 150)} | ★${starFmt(i.stars)}, ${ACTIVITY_LABEL[i.activity]}, ${i.language || 'n/a'}. Install method, quality score and maintenance signals.`,
    path: `/s/${i.slug}`, body, jsonld: [jsonld, breadcrumbLd],
  }));
});

app.get('/about', (c) => {
  const body = `<main class="wrap"><div class="section" style="max-width:760px">
<div class="crumbs" style="margin-bottom:14px"><a href="/">Home</a> › About</div>
<h1 class="page">About MCP Index</h1>
<p style="margin:12px 0;color:var(--muted)">MCP Index is a structured directory of Model Context Protocol (MCP) servers and SKILL.md-based agent skills. Every entry is enriched with live GitHub metadata — stars, last-commit recency, language, license — and given a transparent heuristic quality score so you can quickly judge whether a project is production-ready or abandoned.</p>
<h2 style="margin-top:28px;font-size:20px">FAQ</h2>
<h3 style="margin:16px 0 6px;font-size:15.5px">What is an MCP server?</h3>
<p style="color:var(--muted)">MCP (Model Context Protocol) is an open protocol that lets AI models securely use external tools and data sources. An MCP server exposes tools (APIs, databases, browsers, file systems…) to any MCP-compatible client such as Claude Desktop, Claude Code, Cursor, VS Code or Windsurf.</p>
<h3 style="margin:16px 0 6px;font-size:15.5px">What is an agent skill?</h3>
<p style="color:var(--muted)">An agent skill is a folder with a SKILL.md file (instructions plus optional scripts) that AI coding agents like Claude Code, Codex CLI or Gemini CLI load on demand to perform a specialized task.</p>
<h3 style="margin:16px 0 6px;font-size:15.5px">How is the quality score computed?</h3>
<p style="color:var(--muted)">0–100, from: log-scaled GitHub stars (max 40), maintenance activity based on last commit (max 25), license present (10), official status (10), not archived (5), meaningful description (5), topics (5). Every entry's detail page shows its full per-component breakdown. It is a heuristic signal, not an endorsement.</p>
<h3 style="margin:16px 0 6px;font-size:15.5px">Where does the data come from?</h3>
<p style="color:var(--muted)">Public curated lists — <a href="https://github.com/modelcontextprotocol/servers" rel="noopener">modelcontextprotocol/servers</a>, <a href="https://github.com/punkpeye/awesome-mcp-servers" rel="noopener">punkpeye/awesome-mcp-servers</a>, <a href="https://github.com/VoltAgent/awesome-agent-skills" rel="noopener">VoltAgent/awesome-agent-skills</a> — enriched via the GitHub API. The pipeline reruns weekly; dead repos are dropped automatically. The dataset and pipeline are open source on <a href="https://github.com/wookat/mcp-index" rel="noopener">GitHub</a>.</p>
<h3 style="margin:16px 0 6px;font-size:15.5px">How do I add or remove a listing?</h3>
<p style="color:var(--muted)">Get your project added to one of the upstream curated lists, or open an issue on our GitHub repository.</p>
</div></main>`;
  const faqLd = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: [
      { '@type': 'Question', name: 'What is an MCP server?', acceptedAnswer: { '@type': 'Answer', text: 'MCP (Model Context Protocol) is an open protocol that lets AI models securely use external tools and data sources. An MCP server exposes tools (APIs, databases, browsers, file systems…) to any MCP-compatible client such as Claude Desktop, Claude Code, Cursor, VS Code or Windsurf.' } },
      { '@type': 'Question', name: 'What is an agent skill?', acceptedAnswer: { '@type': 'Answer', text: 'An agent skill is a folder with a SKILL.md file (instructions plus optional scripts) that AI coding agents like Claude Code, Codex CLI or Gemini CLI load on demand to perform a specialized task.' } },
      { '@type': 'Question', name: 'How is the quality score computed?', acceptedAnswer: { '@type': 'Answer', text: '0–100, from: log-scaled GitHub stars (max 40), maintenance activity based on last commit (max 25), license present (10), official status (10), not archived (5), meaningful description (5), topics (5). Every entry\'s detail page shows its full per-component breakdown.' } },
      { '@type': 'Question', name: 'Where does the data come from?', acceptedAnswer: { '@type': 'Answer', text: 'Public curated lists — modelcontextprotocol/servers, punkpeye/awesome-mcp-servers, VoltAgent/awesome-agent-skills — enriched via the GitHub API. The pipeline reruns weekly; dead repos are dropped automatically.' } },
    ],
  });
  return c.html(layout({ title: 'About & FAQ — MCP Index', desc: 'What MCP Index is, how the quality score works, and where the data comes from.', path: '/about', body, jsonld: faqLd }));
});

app.get('/og.png', (c) => c.body(OG_IMAGE, 200, {
  'Content-Type': 'image/png',
  'Cache-Control': 'public, max-age=86400',
}));

app.get('/llms.txt', (c) => c.text(`# MCP Index

> A structured, quality-scored directory of ${STATS.servers.toLocaleString()} Model Context Protocol (MCP) servers and ${STATS.skills.toLocaleString()} SKILL.md-based agent skills. Every entry carries live GitHub metadata (stars, forks, license, last commit), an install method, a maintenance-activity level and a transparent 0–100 quality score. Data refreshes weekly; last update ${GENERATED_AT.slice(0, 10)}.

## Browse

- [All MCP servers](${SITE}/servers): filterable list (category, language, activity, install method, official)
- [All agent skills](${SITE}/skills): SKILL.md skills for Claude Code, Codex CLI, Gemini CLI and more
- [Categories](${SITE}/categories): ${STATS.categories} functional categories
- [Search](${SITE}/search?q=QUERY): full-text search over names, descriptions and topics
- [About & FAQ](${SITE}/about): scoring methodology and data sources

## Data

- [Full dataset (JSON, MIT-licensed metadata)](https://github.com/wookat/mcp-index/blob/main/data/index.json): all fields for every entry
- [Entry pages](${SITE}/sitemap.xml): every server/skill has a detail page at ${SITE}/s/SLUG with install snippet, score breakdown and repo links

## Notes

- Quality scores are heuristic signals, not endorsements. Always review code before installing.
- MCP Index is not affiliated with Anthropic or the Model Context Protocol project.
`));

app.get('/robots.txt', (c) => c.text(`User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${SITE}/sitemap.xml\n`));

app.get(`/${INDEXNOW_KEY}.txt`, (c) => c.text(INDEXNOW_KEY));

app.get('/sitemap.xml', (c) => {
  const urls: string[] = ['/', '/servers', '/skills', '/categories', '/about',
    ...CATEGORIES.map((cat) => `/category/${cat.slug}`),
    ...ITEMS.map((i) => `/s/${i.slug}`)];
  const lastmod = GENERATED_AT.slice(0, 10);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `<url><loc>${SITE}${u}</loc><lastmod>${lastmod}</lastmod></url>`)
    .join('\n')}\n</urlset>`;
  return c.body(xml, 200, { 'Content-Type': 'application/xml' });
});

app.post('/api/track', async (c) => {
  try {
    const { ev } = await c.req.json<{ ev: string }>();
    const allowed = ['pageview', 'copy_install', 'repo_click', 'github_click'];
    if (!allowed.includes(ev)) return c.json({ ok: false }, 400);
    const day = new Date().toISOString().slice(0, 10);
    const key = `m:${day}:${ev}`;
    const cur = parseInt((await c.env.METRICS.get(key)) || '0', 10);
    await c.env.METRICS.put(key, String(cur + 1), { expirationTtl: 60 * 60 * 24 * 400 });
  } catch { /* ignore malformed beacons */ }
  return c.json({ ok: true });
});

app.get('/api/stats', async (c) => {
  const out: Record<string, Record<string, number>> = {};
  for (let d = 0; d < 14; d++) {
    const day = new Date(Date.now() - d * 86400000).toISOString().slice(0, 10);
    out[day] = {};
    for (const ev of ['pageview', 'copy_install', 'repo_click', 'github_click']) {
      const v = await c.env.METRICS.get(`m:${day}:${ev}`);
      if (v) out[day][ev] = parseInt(v, 10);
    }
  }
  return c.json({ dataset: { generatedAt: GENERATED_AT, ...STATS }, metrics: out });
});

app.notFound((c) => c.html(layout({
  title: 'Not found — MCP Index', desc: 'Page not found', path: '/404',
  body: `<main class="wrap"><div class="section" style="text-align:center;padding:40px 0 0"><h1 class="page">404 — Not found</h1><p style="color:var(--muted);margin:10px 0 20px">This entry may have been removed in a weekly refresh.</p><a class="btn" style="text-decoration:none" href="/">Back to home</a></div>
<div class="section"><div class="section-head"><h2>These ones exist</h2></div><div class="grid">${ITEMS.slice(0, 6).map(card).join('')}</div></div></main>`,
}), 404));

export default app;
