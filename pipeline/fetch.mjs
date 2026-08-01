#!/usr/bin/env node
// Download source READMEs. Rerunnable: node pipeline/fetch.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAW = join(dirname(fileURLToPath(import.meta.url)), 'raw');
mkdirSync(RAW, { recursive: true });

const SOURCES = [
  ['modelcontextprotocol/servers', 'main'],
  ['punkpeye/awesome-mcp-servers', 'main'],
  ['VoltAgent/awesome-agent-skills', 'main'],
];

for (const [repo, branch] of SOURCES) {
  const url = `https://raw.githubusercontent.com/${repo}/${branch}/README.md`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  const text = await res.text();
  writeFileSync(join(RAW, repo.replace('/', '_') + '.md'), text);
  console.log(repo, text.length, 'bytes');
}
