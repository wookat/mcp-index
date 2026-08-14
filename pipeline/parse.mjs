#!/usr/bin/env node
// Parse source READMEs into raw entries. Rerunnable: node pipeline/parse.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const RAW = join(ROOT, 'raw');

const LANG_EMOJI = { '🐍': 'Python', '📇': 'TypeScript', '🏎️': 'Go', '🦀': 'Rust', '#️⃣': 'C#', '☕': 'Java', '🌊': 'C/C++', '💎': 'Ruby' };
const SCOPE_EMOJI = { '☁️': 'cloud', '🏠': 'local', '📟': 'embedded' };

function ghRepoFromUrl(url) {
  const m = url.match(/github\.com\/([\w.-]+)\/([\w.-]+)/);
  if (!m) return null;
  let name = m[2].replace(/\.git$/, '');
  return `${m[1]}/${name}`;
}

function cleanCat(s) {
  return s
    .replace(/<a name="[^"]*"><\/a>/g, '')
    .replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, '')
    .replace(/[\uD800-\uDFFF]/g, '')
    .replace(/[^A-Za-z0-9 &,\/-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

const entries = [];
const seen = new Set();

function add(e) {
  const key = e.type + ':' + (e.repo || e.url) + ':' + (e.subpath || '');
  if (seen.has(key)) return;
  seen.add(key);
  const slugBase = e.subpath ? `${e.repo.split('/')[0]}-${e.name}` : (e.repo || e.name);
  let slug = slugify(slugBase);
  let i = 2;
  while (entries.some((x) => x.slug === slug)) slug = slugify(slugBase) + '-' + i++;
  entries.push({ slug, ...e });
}

// --- Source 1: punkpeye/awesome-mcp-servers ---
{
  const md = readFileSync(join(RAW, 'punkpeye_awesome-mcp-servers.md'), 'utf8');
  const lines = md.split('\n');
  let cat = null;
  let inServers = false;
  for (const line of lines) {
    if (/^##\s+Server Implementations/.test(line)) { inServers = true; continue; }
    if (/^##\s+Frameworks/.test(line)) inServers = false;
    if (!inServers) continue;
    const h = line.match(/^###\s+(?:<a name="[^"]*"><\/a>)?(.+)$/);
    if (h) { cat = cleanCat(h[1]); continue; }
    const m = line.match(/^\s*[-*]\s+\[([^\]]+)\]\((https?:\/\/[^)]+)\)\s*(.*?)(?:\s*[-–—]\s+(.*))?$/);
    if (!m || !cat) continue;
    const [, name, url, badges = '', desc = ''] = m;
    const repo = ghRepoFromUrl(url);
    if (!repo) continue;
    const languages = Object.entries(LANG_EMOJI).filter(([e]) => badges.includes(e) || line.includes(e)).map(([, l]) => l);
    const scopes = Object.entries(SCOPE_EMOJI).filter(([e]) => line.includes(e)).map(([, s]) => s);
    add({
      type: 'server', name: name.replace(/^@/, ''), repo, url,
      subpath: url.includes('/tree/') ? url.split(/\/tree\/[^/]+\//)[1] || null : null,
      category: cat, description: desc.trim() || badges.trim(),
      official: line.includes('🎖️'), languagesHint: languages, scopes,
      source: 'punkpeye/awesome-mcp-servers',
    });
  }
}

// --- Source 2: modelcontextprotocol/servers reference list ---
{
  const md = readFileSync(join(RAW, 'modelcontextprotocol_servers.md'), 'utf8');
  const refSection = md.split(/##\s+🌟\s+Reference Servers/)[1]?.split(/###\s+Archived/)[0] || '';
  for (const m of refSection.matchAll(/-\s+\*\*\[([^\]]+)\]\((src\/[^)]+)\)\*\*\s*-\s*(.*)/g)) {
    add({
      type: 'server', name: m[1], repo: 'modelcontextprotocol/servers',
      url: `https://github.com/modelcontextprotocol/servers/tree/main/${m[2]}`,
      subpath: m[2], category: 'Reference Servers', description: m[3].trim(),
      official: true, languagesHint: [], scopes: [],
      source: 'modelcontextprotocol/servers',
    });
  }
}

// --- Source 3: VoltAgent/awesome-agent-skills ---
{
  const md = readFileSync(join(RAW, 'VoltAgent_awesome-agent-skills.md'), 'utf8');
  const lines = md.split('\n');
  let cat = 'Skills';
  for (const line of lines) {
    const h = line.match(/<summary><h3[^>]*>(.+?)<\/h3>/) || line.match(/^###\s+(.+)$/);
    if (h) { cat = cleanCat(h[1]); continue; }
    const m = line.match(/^\s*[-*]\s+\*\*\[([^\]]+)\]\((https?:\/\/[^)]+)\)\*\*\s*[-–—]\s*(.*)$/);
    if (!m) continue;
    const [, name, url, desc] = m;
    let repo = ghRepoFromUrl(url);
    let subpathOverride;
    if (!repo) {
      const os = url.match(/officialskills\.sh\/([\w.-]+)\/([\w.-]+)\/(.+)/);
      if (!os) continue;
      repo = `${os[1]}/${os[2]}`;
      subpathOverride = os[3].replace(/\/$/, '');
    }
    add({
      type: 'skill', name, repo, url,
      subpath: subpathOverride || (url.includes('/tree/') ? url.split(/\/tree\/[^/]+\//)[1] || null : null),
      category: cat, description: desc.trim(),
      official: /official/i.test(cat), languagesHint: [], scopes: [],
      source: 'VoltAgent/awesome-agent-skills',
    });
  }
}

// --- Source 4: curated vendor-official seed list (pipeline/seeds.json) ---
// Vendor first-party servers the awesome lists miss; add() dedupes against them.
{
  const seeds = JSON.parse(readFileSync(join(ROOT, 'seeds.json'), 'utf8'));
  for (const s of seeds) {
    add({
      type: s.type, name: s.name, repo: s.repo, url: `https://github.com/${s.repo}`,
      subpath: null, category: s.category, description: s.description,
      official: true, languagesHint: [], scopes: [],
      source: 'seeds',
    });
  }
}

mkdirSync(join(ROOT, '..', 'data'), { recursive: true });
writeFileSync(join(ROOT, '..', 'data', 'entries-raw.json'), JSON.stringify(entries, null, 1));
const byType = entries.reduce((a, e) => ((a[e.type] = (a[e.type] || 0) + 1), a), {});
console.log('parsed', entries.length, byType);
