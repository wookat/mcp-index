#!/usr/bin/env node
// Merge parsed entries with GitHub metadata into the final dataset. Rerunnable: node pipeline/build.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const DATA = join(ROOT, '..', 'data');

// Shared with the worker's score-breakdown UI (src/index.ts) — single source of truth for weights.
const SCORING = JSON.parse(readFileSync(join(ROOT, '..', 'src', 'scoring.json'), 'utf8'));

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
  s += Math.min(SCORING.starsMax, Math.round(Math.log10((m.stars || 0) + 1) * SCORING.starsLogFactor));
  s += SCORING.activity[activity(m)] ?? 0;
  if (m.license) s += SCORING.license;
  if (!m.archived) s += SCORING.notArchived;
  if (e.official) s += SCORING.official;
  if ((m.description || e.description || '').length > SCORING.descriptionMinLength) s += SCORING.description;
  if ((m.topics || []).length >= SCORING.topicsMin) s += SCORING.topics;
  return Math.min(SCORING.cap, s);
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
    topics: (m.topics || []).slice(0, 8),
    install: installMethod(e, m),
    activity: activity(m),
    score: qualityScore(e, m),
  });
}
out.sort((a, b) => b.score - a.score || b.stars - a.stars);
// The dataset is inlined into the worker bundle (free-plan gzip limit 3MB);
// warn well before the entry count pushes the bundle toward that ceiling.
if (out.length > 15000) console.warn(`WARNING: ${out.length} entries — bundle size approaching worker limits, consider splitting dataset out of the bundle`);
// Distinct category names must slugify uniquely: the worker keys categories by
// slug and would silently merge colliding names under the first one seen.
const slugOf = new Map();
for (const name of new Set(out.map((x) => x.category))) {
  const s = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  if (slugOf.has(s)) console.warn(`WARNING: category slug conflict — "${slugOf.get(s)}" and "${name}" both map to "${s}"`);
  else slugOf.set(s, name);
}
writeFileSync(join(DATA, 'index.json'), JSON.stringify({ generatedAt: new Date().toISOString(), count: out.length, items: out }));
const stats = {
  total: out.length,
  servers: out.filter((x) => x.type === 'server').length,
  skills: out.filter((x) => x.type === 'skill').length,
  active: out.filter((x) => x.activity === 'active').length,
  categories: new Set(out.map((x) => x.category)).size,
};
console.log(stats);
