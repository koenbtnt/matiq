/**
 * @jest-environment node
 */
import { decideImport, mayRetire, seedSlug } from '../taxonomy/importRelease';
import { matchRows, normalizeQuery, rankRows } from '../taxonomy/search';
import { assertTaxonomySeed, compareReleases } from '../taxonomy/seed';
import { slugify, uniqueSlug } from '../taxonomy/slug';

describe('slug rules', () => {
  it('kebab-cases ASCII and strips diacritics', () => {
    expect(slugify('De La Riva guard')).toBe('de-la-riva-guard');
    expect(slugify('  Kimura w/ grip!  ')).toBe('kimura-w-grip');
    expect(slugify('Ômoplata')).toBe('omoplata');
  });
  it('suffixes collisions -2, -3 in order (A-32)', () => {
    expect(uniqueSlug('mount', new Set())).toBe('mount');
    expect(uniqueSlug('mount', new Set(['mount', 'mount-2']))).toBe('mount-3');
  });
});

describe('search ranking', () => {
  const rows = [
    { name: 'Side control', aliases: ['Cross side', 'Side mount'], tier: 'CORE' as const },
    { name: 'Mount', aliases: ['Full mount'], tier: 'CORE' as const },
    { name: 'Mounted triangle', aliases: [], tier: 'EXTENDED' as const },
    { name: 'S-mount', aliases: [], tier: 'EXTENDED' as const },
    { name: 'Technical mount', aliases: [], tier: 'CORE' as const },
  ];
  it('prefix > word-start > alias prefix > substring; CORE before EXTENDED within a class', () => {
    expect(rankRows(rows, 'mount').map((r) => [r.name, r.matchedAlias])).toEqual([
      ['Mount', undefined],
      ['Mounted triangle', undefined],
      ['Technical mount', undefined],
      ['Side control', 'Side mount'],
      ['S-mount', undefined],
    ]);
  });
  it('sets matchedAlias on an alias hit only', () => {
    expect(rankRows(rows, 'cross')).toEqual([expect.objectContaining({ name: 'Side control', matchedAlias: 'Cross side' })]);
  });
  it('is case- and diacritic-insensitive; empty query returns all in tier/name order; limit applies', () => {
    expect(rankRows(rows, 'MÔUNT').length).toBe(5);
    expect(rankRows(rows, '').map((r) => r.name)).toEqual(['Mount', 'Side control', 'Technical mount', 'Mounted triangle', 'S-mount']);
    expect(rankRows(rows, '', 2)).toHaveLength(2);
    expect(normalizeQuery('  Half   GUARD ')).toBe('half guard');
    expect(matchRows(rows, 'zzz')).toEqual([]);
  });
});

describe('import decisions (D-07, R-23)', () => {
  const seedRow = { origin: 'seed' as const, userEditedAt: null, deletedAt: null };
  it('adds, updates, keeps and skips', () => {
    expect(decideImport(undefined, false)).toBe('add');
    expect(decideImport(seedRow, true)).toBe('update');
    expect(decideImport(seedRow, false)).toBe('unchanged');
    expect(decideImport({ ...seedRow, userEditedAt: 'x' }, true)).toBe('skipUserEdited');
    expect(decideImport({ ...seedRow, deletedAt: 'x' }, true)).toBe('skipDeleted');
    expect(decideImport({ ...seedRow, origin: 'user' }, true)).toBe('skipUserOwned');
  });
  it('retires only untouched live seed rows', () => {
    expect(mayRetire(seedRow)).toBe(true);
    expect(mayRetire({ ...seedRow, userEditedAt: 'x' })).toBe(false);
    expect(mayRetire(undefined)).toBe(false);
  });
  it('de-clashes a new seed slug with -gm', () => {
    expect(seedSlug('mount', new Set())).toBe('mount');
    expect(seedSlug('mount', new Set(['mount']))).toBe('mount-gm');
    expect(seedSlug('mount', new Set(['mount', 'mount-gm']))).toBe('mount-gm-2');
  });
});

describe('seed format', () => {
  it('orders releases YYYY-MM-DD.N', () => {
    expect(compareReleases('2026-11-01.1', '2026-11-01.2')).toBeLessThan(0);
    expect(compareReleases('2026-12-01.1', '2026-11-30.9')).toBeGreaterThan(0);
    expect(compareReleases('2026-11-01.10', '2026-11-01.9')).toBeGreaterThan(0);
    expect(compareReleases('2026-11-01.1', '2026-11-01.1')).toBe(0);
    expect(() => compareReleases('v1', '2026-11-01.1')).toThrow('SEED_FORMAT_UNSUPPORTED');
  });
  it('rejects a seed of another shape', () => {
    expect(() => assertTaxonomySeed({ release: '2026-11-01.1' })).toThrow('SEED_FORMAT_UNSUPPORTED');
    expect(() =>
      assertTaxonomySeed({ release: '2026-11-01.1', grapplemapSnapshot: 'x', positions: [], techniques: [], aliases: [], resources: [], resourceLinks: [] }),
    ).not.toThrow();
  });
});
