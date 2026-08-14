import raw from '../data/index.json';

export interface Item {
  slug: string;
  type: 'server' | 'skill';
  name: string;
  repo: string;
  url: string;
  subpath: string | null;
  category: string;
  description: string;
  official: boolean;
  language: string | null;
  scopes: string[];
  stars: number;
  forks: number;
  license: string | null;
  archived: boolean;
  pushedAt: string;
  createdAt: string;
  topics: string[];
  install: string;
  activity: string;
  score: number;
  source: string;
}

interface Dataset {
  generatedAt: string;
  count: number;
  items: Item[];
}

const data = raw as unknown as Dataset;

export const ITEMS: Item[] = data.items;
export const GENERATED_AT: string = data.generatedAt;

export const BY_SLUG = new Map<string, Item>(ITEMS.map((i) => [i.slug, i]));

export function catSlug(cat: string): string {
  return cat.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export const CATEGORIES: { name: string; slug: string; count: number; type: string }[] = (() => {
  const m = new Map<string, { name: string; slug: string; count: number; type: string }>();
  for (const i of ITEMS) {
    const s = catSlug(i.category);
    const e = m.get(s);
    if (e) e.count++;
    else m.set(s, { name: i.category, slug: s, count: 1, type: i.type });
  }
  return [...m.values()].sort((a, b) => b.count - a.count);
})();

export const STATS = {
  total: ITEMS.length,
  servers: ITEMS.filter((i) => i.type === 'server').length,
  skills: ITEMS.filter((i) => i.type === 'skill').length,
  active: ITEMS.filter((i) => i.activity === 'active').length,
  categories: CATEGORIES.length,
};

export interface Query {
  q?: string;
  type?: string;
  category?: string;
  lang?: string;
  activity?: string;
  install?: string;
  official?: string;
  sort?: string;
  page: number;
}

const SYNONYMS: Record<string, string[]> = {
  k8s: ['kubernetes'], kubernetes: ['k8s'],
  postgres: ['postgresql'], postgresql: ['postgres'],
  db: ['database'], database: ['db'],
  js: ['javascript'], javascript: ['js'],
  ts: ['typescript'], typescript: ['ts'],
  gcal: ['google calendar'],
  s3: ['aws s3'],
  scraping: ['scraper', 'crawler'], scraper: ['scraping'], crawler: ['crawling', 'scraping'],
};

/** Lowercase, treat -/_/. as spaces, and drop a trailing plural "s" from each word. */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[-_./]+/g, ' ')
    .replace(/\b([a-z]{4,})s\b/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

const HAYSTACKS = new Map<string, { norm: string; squashed: string }>();

export function itemHaystack(i: Item): { norm: string; squashed: string } {
  let h = HAYSTACKS.get(i.slug);
  if (!h) {
    const norm = normalize(`${i.name} ${i.repo} ${i.description} ${i.category} ${i.topics.join(' ')}`);
    h = { norm, squashed: norm.replace(/ /g, '') };
    HAYSTACKS.set(i.slug, h);
  }
  return h;
}

function termMatches(hay: { norm: string; squashed: string }, term: string): boolean {
  const t = normalize(term);
  if (!t) return true;
  if (hay.norm.includes(t) || hay.squashed.includes(t.replace(/ /g, ''))) return true;
  return (SYNONYMS[t] || []).map(normalize).some((syn) => hay.norm.includes(syn) || hay.squashed.includes(syn.replace(/ /g, '')));
}

export function matchesText(i: Item, q?: string): boolean {
  if (!q) return true;
  const hay = itemHaystack(i);
  return q.toLowerCase().trim().split(/\s+/).filter(Boolean).every((t) => termMatches(hay, t));
}

export function search(query: Query, perPage = 48): { results: Item[]; total: number; pages: number } {
  let list = ITEMS;
  if (query.type) list = list.filter((i) => i.type === query.type);
  if (query.category) list = list.filter((i) => catSlug(i.category) === query.category);
  if (query.lang) list = list.filter((i) => (i.language || '').toLowerCase() === query.lang!.toLowerCase());
  if (query.activity) list = list.filter((i) => i.activity === query.activity);
  if (query.install) list = list.filter((i) => i.install === query.install);
  if (query.official === 'yes') list = list.filter((i) => i.official);
  if (query.q) {
    const q = query.q.toLowerCase().trim();
    const terms = q.split(/\s+/).filter(Boolean);
    // Layered relevance per term: exact word in name > name substring > synonym
    // word in name > description/topic match. Ties break by item quality score,
    // with a slight server preference on single-word queries (directory users
    // searching a bare product name almost always want a server, not a vendor skill).
    const serverBias = terms.length === 1;
    list = list
      .map((i) => {
        const hay = itemHaystack(i);
        const name = normalize(i.name);
        const nameWords = new Set(name.split(' '));
        let score = 0;
        for (const t of terms) {
          if (!termMatches(hay, t)) return null;
          const tn = normalize(t);
          if (nameWords.has(tn)) score += 10;
          else if (name.includes(tn)) score += 5;
          else if ((SYNONYMS[tn] || []).map(normalize).some((syn) => syn.split(' ').every((w) => nameWords.has(w)))) score += 4;
          else score += 1;
        }
        if (serverBias && i.type === 'server') score += 2;
        return { i, score };
      })
      .filter((x): x is { i: Item; score: number } => x !== null)
      .sort((a, b) => b.score - a.score || b.i.score - a.i.score)
      .map((x) => x.i);
  }
  if (query.sort === 'stars') list = [...list].sort((a, b) => b.stars - a.stars);
  else if (query.sort === 'updated') list = [...list].sort((a, b) => b.pushedAt.localeCompare(a.pushedAt));
  else if (!query.q) list = [...list].sort((a, b) => b.score - a.score || b.stars - a.stars);
  const total = list.length;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const page = Math.min(Math.max(1, query.page), pages);
  return { results: list.slice((page - 1) * perPage, page * perPage), total, pages };
}
