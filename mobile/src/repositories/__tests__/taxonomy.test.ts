/**
 * @jest-environment node
 */
import { eq } from 'drizzle-orm';

import type { Db } from '../../db/client';
import { aliases, positions, techniques } from '../../db/schema';
import { settings } from '../settings';
import { taxonomy } from '../taxonomy';
import { FX } from '../testing/fixtures';
import { resetRuntime, seededDb } from '../testing/helpers';

let db: Db;
let now: () => string;
beforeEach(async () => {
  const t = await seededDb();
  db = t.db;
  now = t.clock.now;
});
afterEach(resetRuntime);

describe('taxonomy.searchFocuses', () => {
  it('matches canonical names and aliases; matchedAlias on alias hits; subjects included', async () => {
    const rows = await taxonomy.searchFocuses({ query: 'cross', showExtended: false }, db);
    expect(rows).toEqual([{ kind: 'POSITION', refId: FX.sideControl, name: 'Side control', aliases: ['Cross side'], tier: 'CORE', matchedAlias: 'Cross side' }]);
    const grip = await taxonomy.searchFocuses({ query: 'grip', showExtended: false }, db);
    expect(grip).toEqual([{ kind: 'SUBJECT', refId: FX.grips, name: 'Grip fighting', aliases: [] }]);
  });

  it('hides EXTENDED positions unless showExtended; ranks prefix first', async () => {
    expect((await taxonomy.searchFocuses({ query: 'deep', showExtended: false }, db))).toEqual([]);
    expect((await taxonomy.searchFocuses({ query: 'deep', showExtended: true }, db)).map((r) => r.tier)).toEqual(['EXTENDED']);
    const guard = await taxonomy.searchFocuses({ query: 'guard', showExtended: false }, db);
    expect(guard.map((r) => r.name)).toEqual(['Guard', 'Guard retention', 'Closed guard']);
  });

  it('filters soft-deleted positions and aliases; respects limit; LIKE wildcards are literal', async () => {
    db.update(aliases).set({ deletedAt: now() }).where(eq(aliases.id, FX.aliasCrossSide)).run();
    expect(await taxonomy.searchFocuses({ query: 'cross', showExtended: false }, db)).toEqual([]);
    db.update(positions).set({ deletedAt: now() }).where(eq(positions.id, FX.mount)).run();
    expect((await taxonomy.searchFocuses({ query: 'mount', showExtended: true }, db)).map((r) => r.name)).toEqual([]);
    expect(await taxonomy.searchFocuses({ query: '%', showExtended: true }, db)).toEqual([]);
    expect(await taxonomy.searchFocuses({ query: '', showExtended: true, limit: 2 }, db)).toHaveLength(2);
  });
});

describe('taxonomy.listPositions / getPosition / listSubjects', () => {
  it('lists CORE first then name, with aliases and matchedAlias', async () => {
    expect((await taxonomy.listPositions({ showExtended: true }, db)).map((p) => [p.canonicalName, p.tier])).toEqual([
      ['Closed guard', 'CORE'], ['Guard', 'CORE'], ['Mount', 'CORE'], ['Side control', 'CORE'], ['Deep half variant', 'EXTENDED'],
    ]);
    expect(await taxonomy.listPositions({ showExtended: false, query: 'full' }, db)).toEqual([
      { id: FX.mount, slug: 'mount', canonicalName: 'Mount', tier: 'CORE', aliases: ['Full mount'], matchedAlias: 'Full mount' },
    ]);
    expect((await taxonomy.listPositions({ showExtended: false }, db)).find((p) => p.id === FX.closedGuard)?.parentId).toBe(FX.guard);
  });

  it('getPosition returns parent, children, techniques from/into by type then name', async () => {
    const guard = await taxonomy.getPosition(FX.guard, db);
    expect(guard).toMatchObject({ canonicalName: 'Guard', children: [{ id: FX.closedGuard, canonicalName: 'Closed guard', tier: 'CORE' }], techniquesFrom: [], techniquesTo: [] });
    expect(guard).not.toHaveProperty('parent');
    const cg = await taxonomy.getPosition(FX.closedGuard, db);
    expect(cg.parent).toEqual({ id: FX.guard, canonicalName: 'Guard' });
    expect(cg.techniquesFrom.map((t) => [t.type, t.name, t.toName])).toEqual([['GUARD_PASS', 'Knee slice', 'Side control'], ['SWEEP', 'Scissor sweep', 'Mount']]);
    const mount = await taxonomy.getPosition(FX.mount, db);
    expect(mount).toMatchObject({ description: 'Top, astride the torso', aliases: ['Full mount'] });
    expect(mount.techniquesFrom.map((t) => t.name)).toEqual(['Armbar from mount']); // escape is EXTENDED
    expect(mount.techniquesTo.map((t) => t.name)).toEqual(['Scissor sweep']);
    await settings.set('library.showExtended', true, db);
    expect((await taxonomy.getPosition(FX.mount, db)).techniquesFrom.map((t) => t.type)).toEqual(['ESCAPE', 'SUBMISSION']);
    await expect(taxonomy.getPosition('nope', db)).rejects.toThrow('TAXONOMY_ROW_NOT_FOUND');
  });

  it('lists live subjects by name', async () => {
    expect(await taxonomy.listSubjects(db)).toEqual([
      { id: FX.grips, name: 'Grip fighting', description: 'Winning the grip exchange' },
      { id: FX.retention, name: 'Guard retention' },
    ]);
  });
});

describe('taxonomy.listTechniques', () => {
  it('searches names and aliases, filters by type in SQL, SUBMISSION has no target', async () => {
    expect((await taxonomy.listTechniques({ query: 'tesoura', showExtended: false }, db))).toEqual([
      expect.objectContaining({ id: FX.sweepToMount, matchedAlias: 'Tesoura', appliesTo: 'GI', perspective: 'BOTTOM', fromName: 'Closed guard', toName: 'Mount' }),
    ]);
    const subs = await taxonomy.listTechniques({ query: '', showExtended: true, type: 'SUBMISSION' }, db);
    expect(subs.map((t) => t.name)).toEqual(['Armbar from mount']);
    expect(subs[0]).not.toHaveProperty('toPositionId');
    expect((await taxonomy.listTechniques({ query: 'escape', showExtended: false }, db))).toEqual([]);
  });

  it('hides techniques that are soft-deleted or start from a removed position', async () => {
    db.update(techniques).set({ deletedAt: now() }).where(eq(techniques.id, FX.passToSide)).run();
    db.update(positions).set({ deletedAt: now() }).where(eq(positions.id, FX.mount)).run();
    expect((await taxonomy.listTechniques({ query: '', showExtended: true }, db)).map((t) => t.name)).toEqual(['Scissor sweep']);
  });
});
