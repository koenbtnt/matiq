/**
 * @jest-environment node
 */
import { eq } from 'drizzle-orm';

import { aliases, appMeta, positions, resourceLinks, techniques } from '../../db/schema';
import { createTestDb, installTestRuntime } from '../../db/testing/testDb';
import { ensureSeeded } from '../seed';
import { taxonomy } from '../taxonomy';
import { catalogFixture, FX, taxonomyFixture } from '../testing/fixtures';
import { resetRuntime, seededDb } from '../testing/helpers';

afterEach(resetRuntime);

const bundle = () => ({ catalog: catalogFixture(), taxonomy: taxonomyFixture() });

describe('seed.ensureSeeded (F-16)', () => {
  it('seeds catalog, taxonomy, settings and params once; the second run is a no-op', async () => {
    const { db } = createTestDb();
    const clock = installTestRuntime();
    const first = await ensureSeeded(db, { now: clock.now }, bundle());
    expect(first).toEqual({
      catalog: 'seeded',
      taxonomy: { release: '2026-11-01.1', added: 5 + 4 + 3 + 1 + 1, updated: 0, skippedUserEdited: 0, skippedDeleted: 0, retired: 0 },
      settings: 14,
      params: 10,
    });
    const second = await ensureSeeded(db, { now: clock.now }, bundle());
    expect(second).toEqual({ catalog: 'current', taxonomy: 'current', settings: 0, params: 0 });
    const meta = db.select().from(appMeta).all().map((r) => [r.key, r.value]);
    expect(meta).toEqual(expect.arrayContaining([['catalog_release', '2026-11-01.1'], ['taxonomy_release', '2026-11-01.1']]));
  });

  it('writes provenance on every seeded row', async () => {
    const { db } = await seededDb();
    const mount = db.select().from(positions).where(eq(positions.id, FX.mount)).get()!;
    expect(mount).toMatchObject({ origin: 'seed', source: 'grapplemap', sourceId: 'gm:11', sourceVersion: '2023-02-06', userEditedAt: null });
    const alias = db.select().from(aliases).where(eq(aliases.id, FX.aliasCrossSide)).get()!;
    expect(alias).toMatchObject({ source: 'grapple-flows', sourceId: 'cross-side', targetId: FX.sideControl });
    expect(db.select().from(resourceLinks).all()).toEqual([expect.objectContaining({ resourceId: FX.resource, targetId: FX.sweepToMount })]);
    expect(db.select().from(positions).where(eq(positions.id, FX.closedGuard)).get()!.parentPositionId).toBe(FX.guard);
  });
});

describe('taxonomy.importRelease — user edits win (R-23)', () => {
  it('updates untouched seed rows, skips user-edited and deleted ones, never touches user rows', async () => {
    const { db, clock } = await seededDb();
    // The user renames Mount, deletes Side control, and owns a row with the slug the new release wants.
    db.update(positions).set({ canonicalName: 'Mount (mine)', userEditedAt: clock.now() }).where(eq(positions.id, FX.mount)).run();
    db.update(positions).set({ deletedAt: clock.now() }).where(eq(positions.id, FX.sideControl)).run();
    db.insert(positions)
      .values({ id: 'u-1', origin: 'user', slug: 'back-control', canonicalName: 'My back', tier: 'CORE', createdAt: clock.now(), updatedAt: clock.now() })
      .run();

    const next = taxonomyFixture('2026-12-01.1');
    next.positions = next.positions.map((p) => ({ ...p, canonicalName: `${p.canonicalName}!` }));
    next.positions.push({ id: 'n-1', source: 'grapplemap', sourceId: 'gm:14', sourceVersion: '2023-02-06', slug: 'back-control', canonicalName: 'Back control', tier: 'CORE' });
    next.techniques = next.techniques.map((t) => (t.sourceId === 'gm:22' ? { ...t, name: 'Scissor sweep (gi)' } : t));
    next.retired = [{ source: 'grapplemap', sourceId: 'gm:23' }];

    const report = await taxonomy.importRelease(next, { now: clock.now }, db);
    expect(report).toEqual({ release: '2026-12-01.1', added: 1, updated: 3 + 1, skippedUserEdited: 1, skippedDeleted: 1, retired: 1 });

    const byId = (id: string) => db.select().from(positions).where(eq(positions.id, id)).get()!;
    expect(byId(FX.mount).canonicalName).toBe('Mount (mine)');
    expect(byId(FX.sideControl)).toMatchObject({ canonicalName: 'Side control', deletedAt: expect.any(String) });
    expect(byId(FX.guard).canonicalName).toBe('Guard!');
    expect(byId('u-1')).toMatchObject({ canonicalName: 'My back', slug: 'back-control' });
    expect(byId('n-1').slug).toBe('back-control-gm');
    expect(db.select().from(techniques).where(eq(techniques.id, FX.escapeToGuard)).get()!.deletedAt).not.toBeNull();
    expect(db.select().from(techniques).where(eq(techniques.id, FX.sweepToMount)).get()!.name).toBe('Scissor sweep (gi)');
  });

  it('refuses an older release and writes nothing', async () => {
    const { db, clock } = await seededDb();
    const older = taxonomyFixture('2026-10-01.1');
    older.positions[0]!.canonicalName = 'Changed';
    await expect(taxonomy.importRelease(older, { now: clock.now }, db)).rejects.toThrow('SEED_RELEASE_OLDER');
    expect(db.select().from(positions).where(eq(positions.id, FX.guard)).get()!.canonicalName).toBe('Guard');
  });

  it('rejects a seed of another format, and a dangling endpoint, in one transaction', async () => {
    const { db, clock } = await seededDb();
    await expect(taxonomy.importRelease({ release: 'x' } as never, { now: clock.now }, db)).rejects.toThrow('SEED_FORMAT_UNSUPPORTED');
    const broken = taxonomyFixture('2026-12-01.1');
    broken.positions.push({ id: 'n-2', source: 'grapplemap', sourceId: 'gm:99', sourceVersion: '2023-02-06', slug: 'x', canonicalName: 'X', tier: 'CORE' });
    broken.techniques.push({ ...broken.techniques[1]!, id: 'n-3', sourceId: 'gm:98', slug: 'y', fromSourceId: 'gm:404' });
    await expect(taxonomy.importRelease(broken, { now: clock.now }, db)).rejects.toThrow('SEED_FORMAT_UNSUPPORTED');
    expect(db.select().from(positions).where(eq(positions.id, 'n-2')).get()).toBeUndefined();
  });
});
