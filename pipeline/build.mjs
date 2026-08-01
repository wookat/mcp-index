#!/usr/bin/env node
// Merge parsed entries with GitHub metadata into the final dataset. Rerunnable: node pipeline/build.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const DATA = join(ROOT, '..', 'data');

const entries = JSON.parse(readFileSync(join(DATA, 'entries-raw.json'), 'utf8'));
const meta = JSON.parse(readFileSync(join(DATA, 'repo-meta.json'), 'utf8'));
const NOW = Date.now();

function installMethod(e, m) {
  if (e.type === 'skill') return 'skill-md';
  const text = `${e.description} ${m?.description || ''}`.toLowerCase();
  const lang = m?.language || e.languagesHint[0] || '';
  if (/\bnpx\b|\bnpm i\b|\bnpm install\b/.test(text)) return 'npx';
  if (/\buvx?\b|\bpip install\b|\bpipx\b/.test(text)) return 'uvx';
  if (/\bdocker\b/.test(text)) return 'docker';
  if (/typescript|javascript/i.test(lang)) return 'npx';
  if (/python/i.test(lang)) return 'uvx';
  if (/^go$/i.test(lang)) return 'go-install';
  if (/rust/i.test(lang)) return 'cargo';
  if (/c#/i.test(lang)) return 'dotnet';
  if (/java|kotlin/i.test(lang)) return 'jar';
  return 'source';
}

function activity(m) {
  if (!m || m.missing) return 'unknown';
  if (m.archived) return 'archived';
  const days = (NOW - new Date(m.pushedAt).getTime()) / 86400000;
  if (days <= 30) return 'active';
  if (days <= 90) return 'maintained';
  if (days <= 365) return 'stale';
  return 'inactive';
}

function qualityScore(e, m) {
  if (!m || m.missing) return 0;
  let s = 0;
  s += Math.min(40, Math.round(Math.log10((m.stars || 0) + 1) * 10)); // 0-40
  const act = activity(m);
  s += { active: 25, maintained: 18, stale: 8, inactive: 0, archived: 0 }[act] ?? 0;
  if (m.license) s += 10;
  if (!m.archived) s += 5;
  if (e.official) s += 10;
  if ((m.description || e.description || '').length > 30) s += 5;
  if ((m.topics || []).length >= 3) s += 5;
  return Math.min(100, s);
}

const out = [];
for (const e of entries) {
  const m = meta[e.repo];
  if (!m || m.missing) continue; // drop dead repos
  out.push({
    slug: e.slug,
    type: e.type,
    name: e.name.split('#')[0],
    repo: e.repo,
    url: e.url,
    subpath: e.subpath,
    category: e.category,
    description: (e.description || m.description || '')
      .replace(/<[^>]+>/g, '')
      .replace(/^[^\p{L}\p{N}"'`\[(]+/u, '')
      .slice(0, 400),
    official: e.official,
    language: m.language || e.languagesHint[0] || null,
    scopes: e.scopes,
    stars: m.stars,
    forks: m.forks,
    license: m.license,
    archived: m.archived,
    pushedAt: m.pushedAt,
    createdAt: m.createdAt,
    topics: (m.topics || []).slice(0, 8),
    install: installMethod(e, m),
    activity: activity(m),
    score: qualityScore(e, m),
    source: e.source,
  });
}
out.sort((a, b) => b.score - a.score || b.stars - a.stars);
writeFileSync(join(DATA, 'index.json'), JSON.stringify({ generatedAt: new Date().toISOString(), count: out.length, items: out }));
const stats = {
  total: out.length,
  servers: out.filter((x) => x.type === 'server').length,
  skills: out.filter((x) => x.type === 'skill').length,
  active: out.filter((x) => x.activity === 'active').length,
  categories: new Set(out.map((x) => x.category)).size,
};
console.log(stats);
