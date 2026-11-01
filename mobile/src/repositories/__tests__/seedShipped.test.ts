/**
 * @jest-environment node
 */
import { count, eq, isNull } from 'drizzle-orm';

import report from '../../db/seed/report.json';
import taxonomyJson from '../../db/seed/taxonomy.json';
import { positions, resourceLinks, resources, sessionTypes, subjects, techniques } from '../../db/schema';
import { createTestDb, installTestRuntime } from '../../db/testing/testDb';
import { ensureSeeded } from '../seed';
import { sessions } from '../sessions';
import { taxonomy } from '../taxonomy';
import { resetRuntime } from '../testing/helpers';

afterEach(resetRuntime);

const rows = (db: ReturnType<typeof createTestDb>['db'], table: typeof positions | typeof techniques | typeof resources) =>
  db.select({ n: count() }).from(table).where(isNull(table.deletedAt)).get()!.n;

describe('the shipped seed (mobile/src/db/seed, F-16)', () => {
  it('imports completely and a second ensureSeeded is a no-op', async () => {
    const { db } = createTestDb();
    const clock = installTestRuntime();
    const first = await ensureSeeded(db, { now: clock.now });
    expect(first.catalog).toBe('seeded');
    expect(first.settings).toBe(14);
    expect(first.params).toBe(10);
    expect(rows(db, positions)).toBe(report.positions.total);
    expect(rows(db, techniques)).toBe(report.techniques.total);
    expect(rows(db, resources)).toBe(report.resources.emitted);
    expect(db.select({ n: count() }).from(resourceLinks).get()!.n).toBe(report.resources.links);
    expect(db.select().from(sessionTypes).all().map((t) => t.name)).toEqual(['Gi class', 'No-gi class', 'Open mat', 'Private lesson', 'Competition', 'Drilling/study']);
    expect(db.select().from(subjects).all()).toHaveLength(6);
    expect(await ensureSeeded(db, { now: clock.now })).toEqual({ taxonomy: 'current', catalog: 'current', settings: 0, params: 0 });
  });

  it('the core library is searchable by canonical name and alias; the log path works on seeded rows', async () => {
    const { db } = createTestDb();
    const clock = installTestRuntime();
    await ensureSeeded(db, { now: clock.now });
    const core = await taxonomy.listPositions({ showExtended: false }, db);
    expect(core).toHaveLength(report.positions.core);
    expect((await taxonomy.searchFocuses({ query: 'cross side', showExtended: false }, db))[0]).toMatchObject({ name: 'Side control', matchedAlias: 'Cross side' });
    expect((await taxonomy.listTechniques({ query: 'rnc', showExtended: false }, db))[0]).toMatchObject({ name: 'Rear naked choke', matchedAlias: 'RNC' });
    const mount = core.find((p) => p.canonicalName === 'Mount')!;
    const detail = await taxonomy.getPosition(mount.id, db);
    expect(detail.techniquesFrom.length + detail.techniquesTo.length).toBeGreaterThan(3);
    const [gi] = (await sessions.home({ today: '2026-03-02' }, db)).recent;
    expect(gi).toBeUndefined();
    const types = db.select().from(sessionTypes).all();
    const logged = await sessions.log(
      { sessionTypeId: types[0]!.id, startsAt: '2026-03-02T18:00:00.000Z', timeZone: 'UTC', focuses: [{ kind: 'POSITION', refId: mount.id, isPlanned: false, isActual: true }] },
      db,
    );
    expect(logged.focusNames).toEqual(['Mount']);
  });

  it('a re-import of the same release changes nothing; user edits survive a newer release', async () => {
    const { db } = createTestDb();
    const clock = installTestRuntime();
    await ensureSeeded(db, { now: clock.now });
    const seed = JSON.parse(JSON.stringify(taxonomyJson)) as typeof taxonomyJson;
    const same = await taxonomy.importRelease(seed as never, { now: clock.now }, db);
    expect(same).toMatchObject({ added: 0, updated: 0 });
    const mount = db.select().from(positions).where(eq(positions.slug, 'mount')).get()!;
    db.update(positions).set({ canonicalName: 'Full mount (mine)', userEditedAt: clock.now() }).where(eq(positions.id, mount.id)).run();
    const next = { ...seed, release: '2026-12-01.1', positions: seed.positions.map((p) => ({ ...p, canonicalName: `${p.canonicalName} v2` })) };
    const r = await taxonomy.importRelease(next as never, { now: clock.now }, db);
    expect(r.updated).toBe(seed.positions.length - 1);
    expect(r.skippedUserEdited).toBe(1);
    expect(db.select().from(positions).where(eq(positions.id, mount.id)).get()!.canonicalName).toBe('Full mount (mine)');
  });
});
