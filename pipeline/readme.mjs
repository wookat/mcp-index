#!/usr/bin/env node
// Generate DIRECTORY.md (GitHub-facing table directory). Rerunnable: node pipeline/readme.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const DATA = join(ROOT, '..', 'data');
const { items, generatedAt } = JSON.parse(readFileSync(join(DATA, 'index.json'), 'utf8'));

const SITE = 'https://mcp.zalize.com';
const PER_CAT = 15;

function md(s) {
  return (s || '').replace(/\|/g, '\\|').replace(/\n/g, ' ').slice(0, 140);
}

const ACT = { active: '🟢 Active', maintained: '🟡 Maintained', stale: '🟠 Stale', inactive: '🔴 Inactive', archived: '⚫ Archived' };

const cats = new Map();
for (const i of items) {
  if (!cats.has(i.category)) cats.set(i.category, []);
  cats.get(i.category).push(i);
}
const sorted = [...cats.entries()].sort((a, b) => b[1].length - a[1].length);

let out = `# MCP Index — Directory\n\n> **${items.filter((i) => i.type === 'server').length.toLocaleString()} MCP servers · ${items.filter((i) => i.type === 'skill').length.toLocaleString()} agent skills**, quality-scored and refreshed weekly.\n> Browse the full searchable directory at **[mcp.zalize.com](${SITE})** · full dataset: [\`data/index.json\`](data/index.json)\n>\n> Last updated: ${generatedAt.slice(0, 10)}. Top ${PER_CAT} per category by quality score (stars × activity × license × docs).\n\n## Categories\n\n${sorted.map(([c, l]) => `[${c} (${l.length})](#${c.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')})`).join(' · ')}\n\n`;

for (const [cat, list] of sorted) {
  const top = list.slice(0, PER_CAT);
  out += `### ${cat}\n\n| Name | Description | ⭐ | Updated | Activity | Lang | Score |\n|---|---|---|---|---|---|---|\n`;
  for (const i of top) {
    out += `| [${md(i.name)}](${SITE}/s/${i.slug}) ${i.official ? '🎖️' : ''} | ${md(i.description)} | ${i.stars} | ${i.pushedAt.slice(0, 10)} | ${ACT[i.activity] || i.activity} | ${i.language || '—'} | ${i.score} |\n`;
  }
  if (list.length > PER_CAT) out += `\n_+${list.length - PER_CAT} more in this category → [browse on the site](${SITE}/category/${cat.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')})_\n`;
  out += '\n';
}

out += `---\n\nData sources: [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers), [punkpeye/awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers), [VoltAgent/awesome-agent-skills](https://github.com/VoltAgent/awesome-agent-skills), enriched via the GitHub API. All projects belong to their respective authors. Quality scores are heuristic signals, not endorsements.\n`;

writeFileSync(join(ROOT, '..', 'DIRECTORY.md'), out);
console.log('DIRECTORY.md written:', out.length, 'bytes,', sorted.length, 'categories');
