/**
 * @jest-environment node
 */
import { eq } from 'drizzle-orm';

import type { Db } from '../../db/client';
import { aliases, positions, subjects, techniques } from '../../db/schema';
import { resources } from '../resources';
import { sessions } from '../sessions';
import { settings } from '../settings';
import { taxonomy } from '../taxonomy';
import { FX } from '../testing/fixtures';
import { resetRuntime, seededDb } from '../testing/helpers';

let db: Db;
beforeEach(async () => {
  ({ db } = await seededDb('2026-11-01T12:00:00.000Z'));
});
afterEach(resetRuntime);

const posRow = (id: string) => db.select().from(positions).where(eq(positions.id, id)).get()!;
const techRow = (id: string) => db.select().from(techniques).where(eq(techniques.id, id)).get()!;

describe('taxonomy.createPosition / updatePosition (plan §7.1, PS-12, PS-24)', () => {
  it('creates a user CORE position with a minted slug (-2 on clash with live or deleted rows)', async () => {
    const p = await taxonomy.createPosition({ canonicalName: '  Zeta guard ', parentId: FX.guard, description: 'Fictional' }, db);
    expect(p).toMatchObject({ canonicalName: 'Zeta guard', slug: 'zeta-guard', tier: 'CORE', parentId: FX.guard, aliases: [] });
    expect(posRow(p.id)).toMatchObject({ origin: 'user', source: null, description: 'Fictional', userEditedAt: null });
    await taxonomy.softDelete('POSITION', p.id, db);
    expect((await taxonomy.createPosition({ canonicalName: 'Zeta Guard' }, db)).slug).toBe('zeta-guard-2');
    expect((await taxonomy.createPosition({ canonicalName: '!!!' }, db)).slug).toBe('position');
  });

  it('TAXONOMY_NAME_REQUIRED; TAXONOMY_NAME_DUPLICATE against live names and live POSITION aliases; parent must be live', async () => {
    await expect(taxonomy.createPosition({ canonicalName: '   ' }, db)).rejects.toThrow('TAXONOMY_NAME_REQUIRED');
    await expect(taxonomy.createPosition({ canonicalName: 'MOUNT' }, db)).rejects.toThrow('TAXONOMY_NAME_DUPLICATE');
    await expect(taxonomy.createPosition({ canonicalName: 'full mount' }, db)).rejects.toThrow('TAXONOMY_NAME_DUPLICATE');
    await expect(taxonomy.createPosition({ canonicalName: 'Zeta', parentId: 'nope' }, db)).rejects.toThrow('TAXONOMY_ROW_NOT_FOUND');
    db.update(positions).set({ deletedAt: '2026-11-01T00:00:00.000Z' }).where(eq(positions.id, FX.sideControl)).run();
    // A deleted position's name and aliases are free again.
    expect((await taxonomy.createPosition({ canonicalName: 'Side control' }, db)).canonicalName).toBe('Side control');
    expect((await taxonomy.createPosition({ canonicalName: 'Cross side' }, db)).canonicalName).toBe('Cross side');
  });

  it('rename keeps the old name as a user alias by default, sets user_edited_at on seed rows; search finds the alias', async () => {
    const p = await taxonomy.updatePosition(FX.mount, { canonicalName: 'High mount' }, db);
    expect(p.aliases).toEqual(['Full mount', 'Mount']);
    expect(posRow(FX.mount).userEditedAt).not.toBeNull();
    const hits = await taxonomy.searchFocuses({ query: 'mount', showExtended: false }, db);
    expect(hits.find((h) => h.refId === FX.mount)?.name).toBe('High mount');
    const noAlias = await taxonomy.updatePosition(FX.sideControl, { canonicalName: 'Side mount', keepOldNameAsAlias: false }, db);
    expect(noAlias.aliases).toEqual(['Cross side']);
  });

  it('rename to an existing alias of the same row: the alias goes, the name takes over; case-only rename adds no alias', async () => {
    const p = await taxonomy.updatePosition(FX.mount, { canonicalName: 'full mount' }, db);
    expect(p.canonicalName).toBe('full mount');
    expect(p.aliases).toEqual(['Mount']);
    expect((await taxonomy.updatePosition(FX.guard, { canonicalName: 'GUARD' }, db)).aliases).toEqual([]);
  });

  it('PS-24: rename onto another live name → duplicate; editing only notes of a duplicate-named row passes', async () => {
    await expect(taxonomy.updatePosition(FX.mount, { canonicalName: 'side control' }, db)).rejects.toThrow('TAXONOMY_NAME_DUPLICATE');
    await expect(taxonomy.updatePosition(FX.mount, { canonicalName: 'Cross side' }, db)).rejects.toThrow('TAXONOMY_NAME_DUPLICATE');
    // Seed-style duplicate pair (written directly, as the shipped seed carries one).
    db.update(positions).set({ canonicalName: 'Mount' }).where(eq(positions.id, FX.halfGuard)).run();
    expect((await taxonomy.updatePosition(FX.halfGuard, { notes: 'Fictional note' }, db)).canonicalName).toBe('Mount');
    expect(posRow(FX.halfGuard)).toMatchObject({ notes: 'Fictional note', userEditedAt: null });
    expect((await taxonomy.updatePosition(FX.halfGuard, { canonicalName: 'Mount', description: 'x' }, db)).canonicalName).toBe('Mount');
  });

  it('parent: null clears, a cycle is POSITION_PARENT_CYCLE (self included), a deleted parent is not found', async () => {
    await expect(taxonomy.updatePosition(FX.guard, { parentId: FX.closedGuard }, db)).rejects.toThrow('POSITION_PARENT_CYCLE');
    await expect(taxonomy.updatePosition(FX.guard, { parentId: FX.guard }, db)).rejects.toThrow('POSITION_PARENT_CYCLE');
    expect((await taxonomy.updatePosition(FX.closedGuard, { parentId: null }, db)).parentId).toBeUndefined();
    expect((await taxonomy.updatePosition(FX.closedGuard, { parentId: FX.mount }, db)).parentId).toBe(FX.mount);
    db.update(positions).set({ deletedAt: '2026-11-01T00:00:00.000Z' }).where(eq(positions.id, FX.sideControl)).run();
    await expect(taxonomy.updatePosition(FX.mount, { parentId: FX.sideControl }, db)).rejects.toThrow('TAXONOMY_ROW_NOT_FOUND');
  });

  it('updating a deleted or unknown row: TAXONOMY_ROW_DELETED / TAXONOMY_ROW_NOT_FOUND', async () => {
    await taxonomy.softDelete('POSITION', FX.sideControl, db);
    await expect(taxonomy.updatePosition(FX.sideControl, { notes: 'x' }, db)).rejects.toThrow('TAXONOMY_ROW_DELETED');
    await expect(taxonomy.updatePosition('nope', { notes: 'x' }, db)).rejects.toThrow('TAXONOMY_ROW_NOT_FOUND');
  });
});

describe('taxonomy.createTechnique / updateTechnique (PS-24 edges)', () => {
  const base = { name: 'Arm drag', type: 'TRANSITION' as const, fromPositionId: FX.closedGuard, toPositionId: FX.mount, appliesTo: 'BOTH' as const };

  it('creates a user CORE edge; the same name from another position passes; an exact live duplicate edge does not', async () => {
    const t = await taxonomy.createTechnique(base, db);
    expect(t).toMatchObject({ name: 'Arm drag', slug: 'arm-drag', fromName: 'Closed guard', toName: 'Mount', tier: 'CORE' });
    expect(techRow(t.id)).toMatchObject({ origin: 'user', perspective: null });
    expect((await taxonomy.createTechnique({ ...base, fromPositionId: FX.sideControl }, db)).slug).toBe('arm-drag-2');
    await expect(taxonomy.createTechnique({ ...base, name: 'ARM DRAG ' }, db)).rejects.toThrow('TAXONOMY_NAME_DUPLICATE');
    expect((await taxonomy.createTechnique({ ...base, type: 'SWEEP' }, db)).type).toBe('SWEEP');
  });

  it('shape and endpoint rules', async () => {
    await expect(taxonomy.createTechnique({ ...base, name: '' }, db)).rejects.toThrow('TAXONOMY_NAME_REQUIRED');
    await expect(taxonomy.createTechnique({ ...base, toPositionId: null }, db)).rejects.toThrow('TECHNIQUE_TARGET_REQUIRED');
    await expect(taxonomy.createTechnique({ ...base, type: 'SUBMISSION' }, db)).rejects.toThrow('TECHNIQUE_SUBMISSION_HAS_TARGET');
    await expect(taxonomy.createTechnique({ ...base, fromPositionId: 'nope' }, db)).rejects.toThrow('TAXONOMY_ROW_NOT_FOUND');
    await taxonomy.softDelete('POSITION', FX.sideControl, db);
    await expect(taxonomy.createTechnique({ ...base, toPositionId: FX.sideControl }, db)).rejects.toThrow('TAXONOMY_ROW_NOT_FOUND');
    expect((await taxonomy.createTechnique({ ...base, name: 'Kimura', type: 'SUBMISSION', toPositionId: undefined }, db)).toPositionId).toBeUndefined();
  });

  it('update: appliesTo only on a duplicate-named seed row passes without user_edited_at for notes; imported edits set it', async () => {
    db.update(techniques).set({ name: 'Knee slice' }).where(eq(techniques.id, FX.sweepToMount)).run();
    await taxonomy.updateTechnique(FX.sweepToMount, { notes: 'Fictional' }, db);
    expect(techRow(FX.sweepToMount).userEditedAt).toBeNull();
    expect((await taxonomy.updateTechnique(FX.sweepToMount, { appliesTo: 'NOGI' }, db)).appliesTo).toBe('NOGI');
    expect(techRow(FX.sweepToMount).userEditedAt).not.toBeNull();
  });

  it('update: changing name/from/to/type onto an exact live edge is a duplicate; rename keeps the alias; shape re-checked', async () => {
    const t = await taxonomy.createTechnique(base, db);
    const dup = await taxonomy.createTechnique({ ...base, name: 'Arm drag 2' }, db);
    await expect(taxonomy.updateTechnique(dup.id, { name: 'arm drag' }, db)).rejects.toThrow('TAXONOMY_NAME_DUPLICATE');
    const renamed = await taxonomy.updateTechnique(t.id, { name: 'Russian tie drag' }, db);
    expect(renamed.aliases).toEqual(['Arm drag']);
    await expect(taxonomy.updateTechnique(t.id, { type: 'SUBMISSION' }, db)).rejects.toThrow('TECHNIQUE_SUBMISSION_HAS_TARGET');
    expect((await taxonomy.updateTechnique(t.id, { type: 'SUBMISSION', toPositionId: null }, db)).type).toBe('SUBMISSION');
    await expect(taxonomy.updateTechnique(t.id, { fromPositionId: 'nope' }, db)).rejects.toThrow('TAXONOMY_ROW_NOT_FOUND');
  });
});

describe('subjects (plan §7.1)', () => {
  it('create/update with the live-name rule; deleted names are free; undo of a taken name is a duplicate', async () => {
    const s = await taxonomy.createSubject({ name: 'Breathing', description: ' calm ' }, db);
    expect(s).toEqual({ id: s.id, name: 'Breathing', description: 'calm' });
    await expect(taxonomy.createSubject({ name: 'grip FIGHTING' }, db)).rejects.toThrow('TAXONOMY_NAME_DUPLICATE');
    await expect(taxonomy.updateSubject(s.id, { name: 'Guard retention' }, db)).rejects.toThrow('TAXONOMY_NAME_DUPLICATE');
    expect((await taxonomy.updateSubject(FX.grips, { description: 'New' }, db)).description).toBe('New');
    expect(db.select().from(subjects).where(eq(subjects.id, FX.grips)).get()!.userEditedAt).not.toBeNull();
    await taxonomy.softDelete('SUBJECT', s.id, db);
    const again = await taxonomy.createSubject({ name: 'Breathing' }, db);
    await expect(taxonomy.undoDelete('SUBJECT', s.id, db)).rejects.toThrow('TAXONOMY_NAME_DUPLICATE');
    await taxonomy.softDelete('SUBJECT', again.id, db);
    expect((await taxonomy.undoDelete('SUBJECT', s.id, db)).name).toBe('Breathing');
  });
});

describe('soft delete and undo (PS-13)', () => {
  it('never cascades; an edge with a deleted endpoint is hidden from lists and getPosition, restored on undo', async () => {
    const deleted = await taxonomy.softDelete('POSITION', FX.mount, db);
    expect(deleted.canonicalName).toBe('Mount');
    expect(techRow(FX.sweepToMount).deletedAt).toBeNull();
    const cg = await taxonomy.getPosition(FX.closedGuard, db);
    expect(cg.techniquesFrom.map((t) => t.name)).toEqual(['Knee slice']);
    await expect(taxonomy.softDelete('POSITION', FX.mount, db)).rejects.toThrow('TAXONOMY_ROW_DELETED');
    await expect(taxonomy.softDelete('TECHNIQUE', 'nope', db)).rejects.toThrow('TAXONOMY_ROW_NOT_FOUND');
    await taxonomy.undoDelete('POSITION', FX.mount, db);
    expect((await taxonomy.getPosition(FX.closedGuard, db)).techniquesFrom.map((t) => t.name)).toEqual(['Knee slice', 'Scissor sweep']);
    expect((await taxonomy.undoDelete('POSITION', FX.mount, db)).canonicalName).toBe('Mount');
    await expect(taxonomy.undoDelete('SUBJECT', 'nope', db)).rejects.toThrow('TAXONOMY_ROW_NOT_FOUND');
  });

  it('technique soft delete and undo by id', async () => {
    await taxonomy.softDelete('TECHNIQUE', FX.passToSide, db);
    expect((await taxonomy.listTechniques({ query: 'knee', showExtended: true }, db))).toEqual([]);
    expect((await taxonomy.undoDelete('TECHNIQUE', FX.passToSide, db)).name).toBe('Knee slice');
  });
});

describe('aliases (plan §7.2, N9)', () => {
  it('add, list with ids on PositionDetail, remove, undo; duplicate and required rules', async () => {
    const a = await taxonomy.addAlias('POSITION', FX.guard, ' Open guard ', db);
    expect(a).toEqual({ id: a.id, targetKind: 'POSITION', targetId: FX.guard, name: 'Open guard', origin: 'user' });
    expect((await taxonomy.getPosition(FX.guard, db)).aliasRows).toEqual([a]);
    expect(await taxonomy.listAliases('POSITION', FX.guard, db)).toEqual([a]);
    await expect(taxonomy.addAlias('POSITION', FX.guard, 'open GUARD', db)).rejects.toThrow('ALIAS_DUPLICATE');
    await expect(taxonomy.addAlias('POSITION', FX.guard, 'guard', db)).rejects.toThrow('ALIAS_DUPLICATE');
    await expect(taxonomy.addAlias('POSITION', FX.guard, '  ', db)).rejects.toThrow('ALIAS_NAME_REQUIRED');
    await expect(taxonomy.addAlias('TECHNIQUE', 'nope', 'x', db)).rejects.toThrow('TAXONOMY_ROW_NOT_FOUND');
    // Across rows duplicates are allowed.
    expect((await taxonomy.addAlias('POSITION', FX.mount, 'Open guard', db)).targetId).toBe(FX.mount);
    expect(await taxonomy.removeAlias(a.id, db)).toEqual(a);
    expect((await taxonomy.getPosition(FX.guard, db)).aliases).toEqual([]);
    await expect(taxonomy.removeAlias(a.id, db)).rejects.toThrow('ALIAS_NOT_FOUND');
    expect(await taxonomy.undoRemoveAlias(a.id, db)).toEqual(a);
    expect(await taxonomy.undoRemoveAlias(a.id, db)).toEqual(a);
    await expect(taxonomy.undoRemoveAlias('nope', db)).rejects.toThrow('ALIAS_NOT_FOUND');
  });

  it('undoRemoveAlias with a live twin added meanwhile is ALIAS_DUPLICATE', async () => {
    const a = await taxonomy.addAlias('TECHNIQUE', FX.passToSide, 'Knee cut', db);
    await taxonomy.removeAlias(a.id, db);
    await taxonomy.addAlias('TECHNIQUE', FX.passToSide, 'knee cut', db);
    await expect(taxonomy.undoRemoveAlias(a.id, db)).rejects.toThrow('ALIAS_DUPLICATE');
    expect(db.select().from(aliases).where(eq(aliases.id, a.id)).get()!.deletedAt).not.toBeNull();
  });
});

describe('taxonomy.getTechnique (PS-16, N9)', () => {
  it('detail with aliases (ids), resources, endpoint flags and history (attached or submission, newest first)', async () => {
    const s1 = await sessions.log(
      { sessionTypeId: FX.gi, startsAt: '2026-10-20T18:00:00.000Z', timeZone: 'UTC', focuses: [{ kind: 'POSITION', refId: FX.closedGuard, isPlanned: false, isActual: true, techniqueIds: [FX.sweepToMount] }] },
      db,
    );
    const s2 = await sessions.log(
      { sessionTypeId: FX.nogi, startsAt: '2026-10-25T18:00:00.000Z', timeZone: 'UTC', focuses: [{ kind: 'POSITION', refId: FX.mount, isPlanned: false, isActual: true }], submissions: [{ direction: 'LANDED', techniqueId: FX.sweepToMount }] },
      db,
    );
    const d = await taxonomy.getTechnique(FX.sweepToMount, db);
    expect(d).toMatchObject({
      name: 'Scissor sweep',
      fromName: 'Closed guard',
      toName: 'Mount',
      origin: 'seed',
      removed: false,
      fromRemoved: false,
      toRemoved: false,
      aliases: ['Tesoura'],
      aliasRows: [{ id: FX.aliasScissor, targetKind: 'TECHNIQUE', targetId: FX.sweepToMount, name: 'Tesoura', origin: 'seed' }],
      resources: [{ id: FX.resource, title: 'Guard basics', resourceTypeName: 'Instructional', status: 'TO_WATCH', origin: 'seed' }],
      history: [
        { sessionId: s2.id, localDate: '2026-10-25', sessionTypeName: 'No-gi class', via: 'SUBMISSION' },
        { sessionId: s1.id, localDate: '2026-10-20', sessionTypeName: 'Gi class', via: 'ATTACHED' },
      ],
    });
  });

  it('opens for a soft-deleted technique and endpoint ("(removed)"); a submission has no toRemoved', async () => {
    await taxonomy.softDelete('POSITION', FX.mount, db);
    await taxonomy.softDelete('TECHNIQUE', FX.sweepToMount, db);
    expect(await taxonomy.getTechnique(FX.sweepToMount, db)).toMatchObject({ removed: true, fromRemoved: false, toRemoved: true, toName: 'Mount' });
    const sub = await taxonomy.getTechnique(FX.armbarFromMount, db);
    expect(sub.fromRemoved).toBe(true);
    expect(sub).not.toHaveProperty('toRemoved');
    expect(sub.history).toEqual([]);
    await expect(taxonomy.getTechnique('nope', db)).rejects.toThrow('TAXONOMY_ROW_NOT_FOUND');
  });

  it('resources created on the detail show up; extended setting does not hide the detail', async () => {
    await settings.set('library.showExtended', false, db);
    await resources.create({ title: 'Escape drills', resourceTypeId: FX.rtBook }, { kind: 'TECHNIQUE', id: FX.escapeToGuard }, db);
    expect((await taxonomy.getTechnique(FX.escapeToGuard, db)).resources.map((r) => r.title)).toEqual(['Escape drills']);
  });
});
