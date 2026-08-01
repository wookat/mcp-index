#!/usr/bin/env node
// Enrich entries with GitHub repo metadata. Rerunnable (weekly): GH_TOKEN=... node pipeline/enrich.mjs [--refresh]
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const DATA = join(ROOT, '..', 'data');
const TOKEN = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
if (!TOKEN) { console.error('GH_TOKEN required'); process.exit(1); }
const REFRESH = process.argv.includes('--refresh');

const entries = JSON.parse(readFileSync(join(DATA, 'entries-raw.json'), 'utf8'));
const cachePath = join(DATA, 'repo-meta.json');
const cache = !REFRESH && existsSync(cachePath) ? JSON.parse(readFileSync(cachePath, 'utf8')) : {};

const repos = [...new Set(entries.map((e) => e.repo))].filter((r) => !(r in cache));
console.log(`repos to fetch: ${repos.length} (cached: ${Object.keys(cache).length})`);

async function fetchRepo(repo) {
  const res = await fetch(`https://api.github.com/repos/${repo}`, {
    headers: { Authorization: `Bearer ${TOKEN}`, Accept: 'application/vnd.github+json', 'User-Agent': 'mcp-index-pipeline' },
  });
  if (res.status === 404 || res.status === 451) return { missing: true };
  if (res.status === 403 || res.status === 429) throw new Error('rate limited');
  if (!res.ok) return { missing: true, status: res.status };
  const j = await res.json();
  return {
    fullName: j.full_name,
    stars: j.stargazers_count,
    forks: j.forks_count,
    openIssues: j.open_issues_count,
    language: j.language,
    license: j.license?.spdx_id === 'NOASSERTION' ? 'Other' : j.license?.spdx_id || null,
    archived: j.archived,
    pushedAt: j.pushed_at,
    createdAt: j.created_at,
    description: j.description,
    topics: j.topics || [],
    homepage: j.homepage || null,
    defaultBranch: j.default_branch,
  };
}

let done = 0;
const queue = [...repos];
async function worker() {
  while (queue.length) {
    const repo = queue.shift();
    try {
      cache[repo] = await fetchRepo(repo);
    } catch (e) {
      queue.unshift(repo);
      console.log('pausing 60s:', e.message);
      await new Promise((r) => setTimeout(r, 60000));
      continue;
    }
    if (++done % 200 === 0) {
      console.log('fetched', done);
      writeFileSync(cachePath, JSON.stringify(cache));
    }
  }
}
await Promise.all(Array.from({ length: 20 }, worker));
writeFileSync(cachePath, JSON.stringify(cache));
console.log('done. total cached:', Object.keys(cache).length, 'missing:', Object.values(cache).filter((m) => m.missing).length);
