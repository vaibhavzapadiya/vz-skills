export type SearchEntry = {
  slug: string;
  page: string;
  heading: string;
  anchor: string;
  text: string;
  to: string;
};

let cache: Promise<SearchEntry[]> | null = null;

/** The index is generated at build time (scripts/build-search-index.mjs) and loaded on first search. */
export function loadIndex(): Promise<SearchEntry[]> {
  cache ??= import('./search-index.json').then((m) => m.default as SearchEntry[]);
  return cache;
}

export type Hit = { entry: SearchEntry; score: number; snippet: string };

export function search(index: SearchEntry[], query: string, limit = 12): Hit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/).filter(Boolean);
  const hits: Hit[] = [];
  for (const entry of index) {
    const h = entry.heading.toLowerCase();
    const pg = entry.page.toLowerCase();
    const t = entry.text.toLowerCase();
    let score = 0;
    let ok = true;
    for (const term of terms) {
      let s = 0;
      if (h === term) s += 40;
      else if (h.includes(term)) s += 24;
      if (pg.includes(term)) s += 8;
      if (t.includes(term)) s += 6 + Math.min(4, t.split(term).length - 1);
      if (s === 0) {
        ok = false;
        break;
      }
      score += s;
    }
    if (!ok) continue;
    const first = t.indexOf(terms[0] ?? '');
    const start = Math.max(0, first - 50);
    const snippet = (start > 0 ? '…' : '') + entry.text.slice(start, start + 140) + (start + 140 < entry.text.length ? '…' : '');
    hits.push({ entry, score, snippet });
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, limit);
}
