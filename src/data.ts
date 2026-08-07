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

export function search(query: Query, perPage = 48): { results: Item[]; total: number; pages: number } {
  let list = ITEMS;
  if (query.type) list = list.filter((i) => i.type === query.type);
  if (query.category) list = list.filter((i) => catSlug(i.category) === query.category);
  if (query.lang) list = list.filter((i) => (i.language || '').toLowerCase() === query.lang!.toLowerCase());
  if (query.activity) list = list.filter((i) => i.activity === query.activity);
  if (query.install) list = list.filter((i) => i.install === query.install);
  if (query.official) list = list.filter((i) => i.official);
  if (query.q) {
    const q = query.q.toLowerCase().trim();
    const terms = q.split(/\s+/).filter(Boolean);
    list = list
      .map((i) => {
        const hay = `${i.name} ${i.repo} ${i.description} ${i.category} ${i.topics.join(' ')}`.toLowerCase();
        let score = 0;
        for (const t of terms) {
          if (!hay.includes(t)) return null;
          score += i.name.toLowerCase().includes(t) ? 3 : 1;
        }
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
