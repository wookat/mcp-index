#!/usr/bin/env node
// Push all site URLs to IndexNow (Bing/Seznam/Naver/Yandex). Rerunnable after each deploy.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = 'https://mcp.zalize.com';
const KEY = '8b38cfa490ebd06f8b4ec7290a002646';
const DATA = join(dirname(fileURLToPath(import.meta.url)), '..', 'data');
const { items } = JSON.parse(readFileSync(join(DATA, 'index.json'), 'utf8'));

const catSlug = (c) => c.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const urls = [
  '/', '/servers', '/skills', '/categories', '/about',
  ...[...new Set(items.map((i) => catSlug(i.category)))].map((c) => `/category/${c}`),
  ...items.map((i) => `/s/${i.slug}`),
].map((u) => SITE + u);

// IndexNow allows up to 10,000 URLs per request
for (let off = 0; off < urls.length; off += 10000) {
  const batch = urls.slice(off, off + 10000);
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: 'mcp.zalize.com', key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList: batch }),
  });
  console.log(`batch ${off / 10000 + 1}: ${batch.length} urls -> HTTP ${res.status}`);
}
