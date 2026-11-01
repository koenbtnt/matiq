export type Searchable = { name: string; aliases: readonly string[]; tier?: 'CORE' | 'EXTENDED' };
export type Ranked<T> = T & { matchedAlias?: string };

/** Case- and diacritic-insensitive, whitespace-collapsed form used for matching. */
export function normalizeQuery(s: string): string {
  return s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Match class, lower is better: 0 name prefix, 1 alias prefix, 2 name substring, 3 alias substring. */
type Match = { cls: number; alias?: string };

function prefixOrWordStart(hay: string, q: string): boolean {
  return hay.startsWith(q) || hay.includes(` ${q}`);
}

function matchOf(row: Searchable, q: string): Match | undefined {
  const name = normalizeQuery(row.name);
  if (prefixOrWordStart(name, q)) return { cls: 0 };
  const aliases = row.aliases.map((a) => [a, normalizeQuery(a)] as const);
  const aliasPrefix = aliases.find(([, n]) => prefixOrWordStart(n, q));
  if (aliasPrefix) return { cls: 1, alias: aliasPrefix[0] };
  if (name.includes(q)) return { cls: 2 };
  const aliasSub = aliases.find(([, n]) => n.includes(q));
  if (aliasSub) return { cls: 3, alias: aliasSub[0] };
  return undefined;
}

const tierRank = (t?: 'CORE' | 'EXTENDED') => (t === 'EXTENDED' ? 1 : 0);

/** Rows matching `query` (all rows for an empty query) in input order, with `matchedAlias`. */
export function matchRows<T extends Searchable>(rows: readonly T[], query: string): Ranked<T>[] {
  const q = normalizeQuery(query);
  const out: Ranked<T>[] = [];
  for (const row of rows) {
    const m = q === '' ? { cls: 0 } : matchOf(row, q);
    if (m) out.push(m.alias ? { ...row, matchedAlias: m.alias } : { ...row });
  }
  return out;
}

/**
 * Ranks rows for a picker/search (plan §4): prefix (or word-start) beats substring, a name hit beats
 * an alias hit, CORE beats EXTENDED, then name. An empty query returns every row in tier/name order.
 * `matchedAlias` is set when the hit came from an alias.
 */
export function rankRows<T extends Searchable>(rows: readonly T[], query: string, limit = 30): Ranked<T>[] {
  const q = normalizeQuery(query);
  const scored: { row: T; m: Match }[] = [];
  for (const row of rows) {
    const m = q === '' ? { cls: 0 } : matchOf(row, q);
    if (m) scored.push({ row, m });
  }
  scored.sort(
    (a, b) =>
      a.m.cls - b.m.cls ||
      tierRank(a.row.tier) - tierRank(b.row.tier) ||
      a.row.name.localeCompare(b.row.name, 'en') ||
      0,
  );
  return scored.slice(0, limit).map(({ row, m }) => (m.alias ? { ...row, matchedAlias: m.alias } : { ...row }));
}
