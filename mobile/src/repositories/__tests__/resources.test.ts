/**
 * @jest-environment node
 */
import { eq } from 'drizzle-orm';

import type { Db } from '../../db/client';
import { resourceLinks, resources as resourcesTable } from '../../db/schema';
import attribution from '../../db/seed/attribution.json';
import { about } from '../about';
import { setAppMeta } from '../appMeta';
import { resources, resourceTypes } from '../resources';
import { taxonomy } from '../taxonomy';
import { FX } from '../testing/fixtures';
import { resetRuntime, seededDb } from '../testing/helpers';

let db: Db;
let now: () => string;
beforeEach(async () => {
  const t = await seededDb('2026-11-01T12:00:00.000Z');
  db = t.db;
  now = t.clock.now;
});
afterEach(resetRuntime);

const T = { kind: 'TECHNIQUE' as const, id: FX.sweepToMount };
const raw = (id: string) => db.select().from(resourcesTable).where(eq(resourcesTable.id, id)).get()!;

describe('resources (plan §5.6, §8.1)', () => {
  it('create links in one transaction; listFor orders TO_WATCH first then title, joins the type name', async () => {
    const r = await resources.create({ title: ' Ankle picks ', url: ' https://example.org/video?id=1 ', author: 'Coach Z', resourceTypeId: FX.rtBook, status: 'WATCHED' }, T, db);
    expect(r).toEqual({ id: r.id, title: 'Ankle picks', url: 'https://example.org/video?id=1', author: 'Coach Z', resourceTypeId: FX.rtBook, resourceTypeName: 'Book', status: 'WATCHED', origin: 'user' });
    const b = await resources.create({ title: 'Basics', resourceTypeId: FX.rtInstructional, url: '  ' }, T, db);
    expect(b).not.toHaveProperty('url');
    expect((await resources.listFor(T, db)).map((x) => x.title)).toEqual(['Basics', 'Guard basics', 'Ankle picks']);
  });

  it.each<[string, object, object]>([
    ['RESOURCE_TITLE_REQUIRED', { title: '  ' }, T],
    ['RESOURCE_URL_INVALID', { url: 'ftp://example.org' }, T],
    ['RESOURCE_URL_INVALID', { url: 'not a url' }, T],
    ['RESOURCE_URL_INVALID', { url: 'https://' }, T],
    ['RESOURCE_TYPE_NOT_FOUND', { resourceTypeId: 'nope' }, T],
    ['RESOURCE_LINK_TARGET_NOT_FOUND', {}, { kind: 'TECHNIQUE', id: 'nope' }],
    ['RESOURCE_LINK_TARGET_NOT_FOUND', {}, { kind: 'CYCLE', id: 'nope' }],
  ])('create rejects with %s and writes nothing', async (code, over, target) => {
    const n = db.select().from(resourcesTable).all().length;
    await expect(resources.create({ title: 'X', resourceTypeId: FX.rtBook, ...over }, target as never, db)).rejects.toThrow(code);
    expect(db.select().from(resourcesTable).all()).toHaveLength(n);
  });

  it('update: imported fields set user_edited_at on seed rows; notes and status never do', async () => {
    await resources.update(FX.resource, { notes: 'p. 14' }, db);
    await resources.setStatus(FX.resource, 'WATCHED', db);
    expect(raw(FX.resource)).toMatchObject({ notes: 'p. 14', status: 'WATCHED', userEditedAt: null });
    expect((await resources.update(FX.resource, { author: 'B. Coach', url: 'http://example.org' }, db)).author).toBe('B. Coach');
    expect(raw(FX.resource).userEditedAt).not.toBeNull();
    await expect(resources.update(FX.resource, { url: 'mailto:x@example.org' }, db)).rejects.toThrow('RESOURCE_URL_INVALID');
    await expect(resources.update(FX.resource, { resourceTypeId: 'nope' }, db)).rejects.toThrow('RESOURCE_TYPE_NOT_FOUND');
    await expect(resources.update('nope', { notes: 'x' }, db)).rejects.toThrow('RESOURCE_NOT_FOUND');
    await expect(resources.setStatus('nope', 'WATCHED', db)).rejects.toThrow('RESOURCE_NOT_FOUND');
  });

  it('softDelete hides the resource and all its links; undoDelete restores exactly those', async () => {
    await resources.link(FX.resource, { kind: 'POSITION', id: FX.mount }, db);
    await resources.unlink(FX.resource, { kind: 'POSITION', id: FX.mount }, db);
    await resources.link(FX.resource, { kind: 'SUBJECT', id: FX.grips }, db);
    await resources.softDelete(FX.resource, db);
    expect(await resources.listFor(T, db)).toEqual([]);
    expect(await resources.listFor({ kind: 'SUBJECT', id: FX.grips }, db)).toEqual([]);
    await expect(resources.softDelete(FX.resource, db)).rejects.toThrow('RESOURCE_NOT_FOUND');
    expect((await resources.undoDelete(FX.resource, db)).title).toBe('Guard basics');
    expect((await resources.listFor(T, db)).map((r) => r.id)).toEqual([FX.resource]);
    expect((await resources.listFor({ kind: 'SUBJECT', id: FX.grips }, db)).map((r) => r.id)).toEqual([FX.resource]);
    // The link unlinked earlier stays unlinked.
    expect(await resources.listFor({ kind: 'POSITION', id: FX.mount }, db)).toEqual([]);
    expect((await resources.undoDelete(FX.resource, db)).id).toBe(FX.resource);
    await expect(resources.undoDelete('nope', db)).rejects.toThrow('RESOURCE_NOT_FOUND');
  });

  it('link is idempotent and needs a live target; unlink soft-deletes', async () => {
    await resources.link(FX.resource, T, db);
    expect(db.select().from(resourceLinks).all().filter((l) => !l.deletedAt)).toHaveLength(1);
    await taxonomy.softDelete('POSITION', FX.sideControl, db);
    await expect(resources.link(FX.resource, { kind: 'POSITION', id: FX.sideControl }, db)).rejects.toThrow('RESOURCE_LINK_TARGET_NOT_FOUND');
    await resources.unlink(FX.resource, T, db);
    expect(db.select().from(resourceLinks).all().every((l) => l.deletedAt !== null)).toBe(true);
    await expect(resources.link('nope', T, db)).rejects.toThrow('RESOURCE_NOT_FOUND');
  });

  it('resourceTypes.list: live types by sort order', async () => {
    expect(await resourceTypes.list(db)).toEqual([
      { id: FX.rtInstructional, name: 'Instructional', sortOrder: 1 },
      { id: FX.rtBook, name: 'Book', sortOrder: 2 },
    ]);
  });
});

describe('about.get (PS-19, plan §5.7)', () => {
  it('algorithm version, taxonomy release, backup status (default not_applicable) and the full attribution', async () => {
    expect(await about.get(db)).toEqual({ algorithmVersion: 'v1', taxonomyRelease: '2026-11-01.1', backup: 'not_applicable', attribution });
    await setAppMeta('backup_exclusion', 'excluded', now, db);
    expect((await about.get(db)).backup).toBe('excluded');
    await setAppMeta('backup_exclusion', 'garbage', now, db);
    expect((await about.get(db)).backup).toBe('not_applicable');
  });
});
