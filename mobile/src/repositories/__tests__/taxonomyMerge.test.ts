/**
 * @jest-environment node
 */
import { eq } from 'drizzle-orm';

import type { Db } from '../../db/client';
import {
  aliases, positions, resourceLinks, sessionFocuses, sessionTechniques, subjects, submissions, taxonomyMerges, techniques,
} from '../../db/schema';
import type { FocusInput } from '../contracts';
import { resources } from '../resources';
import { sessions } from '../sessions';
import { taxonomy } from '../taxonomy';
import { FX } from '../testing/fixtures';
import { resetRuntime, seededDb } from '../testing/helpers';

let db: Db;
beforeEach(async () => {
  ({ db } = await seededDb('2026-11-01T12:00:00.000Z'));
});
afterEach(resetRuntime);

const f = (refId: string, over: Partial<FocusInput> = {}): FocusInput => ({ kind: 'POSITION', refId, isPlanned: false, isActual: true, ...over });
const log = (focuses: FocusInput[], extra: object = {}) =>
  sessions.log({ sessionTypeId: FX.gi, startsAt: '2026-10-30T18:00:00.000Z', timeZone: 'UTC', focuses, ...extra }, db);

/** Every row of the tables a merge touches, without `updated_at` (an undo is itself an update, so it advances). */
function snapshot() {
  const strip = <T extends { id: string; updatedAt: string }>(rows: T[]) => rows.map(({ updatedAt: _u, ...r }) => r).sort((a, b) => (a.id < b.id ? -1 : 1));
  return {
    positions: strip(db.select().from(positions).all()),
    techniques: strip(db.select().from(techniques).all()),
    subjects: strip(db.select().from(subjects).all()),
    aliases: strip(db.select().from(aliases).all()),
    sessionFocuses: strip(db.select().from(sessionFocuses).all()),
    sessionTechniques: strip(db.select().from(sessionTechniques).all()),
    submissions: strip(db.select().from(submissions).all()),
    resourceLinks: strip(db.select().from(resourceLinks).all()),
  };
}

/**
 * Undo round trip: every row that existed before the merge is equal again (ignoring `updated_at`),
 * and rows the merge created (the loser-name alias) are soft-deleted — never hard-deleted.
 */
function expectRestored(before: ReturnType<typeof snapshot>) {
  const after = snapshot();
  for (const key of Object.keys(before) as (keyof typeof before)[]) {
    const ids = new Set(before[key].map((r) => r.id));
    expect(after[key].filter((r) => ids.has(r.id))).toEqual(before[key]);
    expect(after[key].filter((r) => !ids.has(r.id)).every((r) => r.deletedAt !== null)).toBe(true);
  }
}

describe('taxonomy.merge — positions (plan §7.3)', () => {
  it('moves focus rows, edges, children, links and aliases; the loser name becomes an alias; loser soft-deleted', async () => {
    const s = await log([f(FX.mount, { rating: 4 })]);
    const r = await taxonomy.merge('POSITION', FX.mount, FX.sideControl, db);
    expect(r).toMatchObject({ kind: 'POSITION', fromId: FX.mount, intoId: FX.sideControl, folded: 0, aliasesAdded: 1 });
    expect(r.moved).toMatchObject({ session_focuses: 1, aliases: 1, techniques: 3 });
    const detail = await sessions.getDetail(s.id, db);
    expect(detail.focuses[0]).toMatchObject({ refId: FX.sideControl, name: 'Side control', rating: 4 });
    const side = await taxonomy.getPosition(FX.sideControl, db);
    expect(side.aliases).toEqual(['Cross side', 'Full mount', 'Mount']);
    // Elbow escape (EXTENDED) moved too but is hidden while library.showExtended is off.
    expect(side.techniquesFrom.map((t) => t.name)).toEqual(['Armbar from mount']);
    expect(db.select().from(positions).where(eq(positions.id, FX.mount)).get()).toMatchObject({ deletedAt: expect.any(String), userEditedAt: expect.any(String) });
    const row = db.select().from(taxonomyMerges).where(eq(taxonomyMerges.id, r.mergeId)).get()!;
    expect(JSON.parse(row.payload)).toMatchObject({ v: 1, kind: 'POSITION', fromId: FX.mount, intoId: FX.sideControl, loser: { id: FX.mount } });
  });

  it('folds a session holding both refs: OR booleans, survivor rating else loser, counts summed, comments joined', async () => {
    const s = await log([
      f(FX.mount, { needsWork: true, rating: 2, hitCount: 1, caughtCount: 2, comment: 'Base' }),
      f(FX.sideControl, { hitCount: 3, comment: 'Frames' }),
    ]);
    const r = await taxonomy.merge('POSITION', FX.mount, FX.sideControl, db);
    expect(r.folded).toBe(1);
    const [focus] = (await sessions.getDetail(s.id, db)).focuses;
    expect((await sessions.getDetail(s.id, db)).focuses).toHaveLength(1);
    expect(focus).toMatchObject({ refId: FX.sideControl, needsWork: true, rating: 2, hitCount: 4, caughtCount: 2, comment: 'Frames / Base' });
  });

  it('B1: a technique attached to the folded loser row follows to the survivor row; undo puts it back (rows equal)', async () => {
    const s = await log([f(FX.closedGuard, { techniqueIds: [FX.sweepToMount] }), f(FX.guard, { techniqueIds: [FX.passToSide] })]);
    const before = snapshot();
    const r = await taxonomy.merge('POSITION', FX.closedGuard, FX.guard, db);
    expect(r).toMatchObject({ folded: 1 });
    expect(r.moved.session_techniques).toBe(1);
    const merged = await sessions.getDetail(s.id, db);
    expect(merged.focuses).toHaveLength(1);
    expect(merged.focuses[0]!.techniques.map((t) => t.id).sort()).toEqual([FX.passToSide, FX.sweepToMount].sort());
    const payload = JSON.parse(db.select().from(taxonomyMerges).where(eq(taxonomyMerges.id, r.mergeId)).get()!.payload);
    expect(payload.moved).toContainEqual(expect.objectContaining({ table: 'session_techniques', column: 'session_focus_id' }));
    await taxonomy.undoMerge(r.mergeId, db);
    const restored = await sessions.getDetail(s.id, db);
    expect(restored.focuses.map((x) => [x.refId, x.techniques.map((t) => t.id)])).toEqual([
      [FX.closedGuard, [FX.sweepToMount]],
      [FX.guard, [FX.passToSide]],
    ]);
    expectRestored(before);
  });

  it('B1 collision: the same technique on both rows folds the attachment (note joined) and undoes cleanly', async () => {
    const s = await log([f(FX.closedGuard, { techniqueIds: [FX.sweepToMount] }), f(FX.guard, { techniqueIds: [FX.sweepToMount] })]);
    db.update(sessionTechniques).set({ note: 'Loser note' }).where(eq(sessionTechniques.sessionFocusId, (await sessions.getDetail(s.id, db)).focuses[0]!.id)).run();
    const before = snapshot();
    const r = await taxonomy.merge('POSITION', FX.closedGuard, FX.guard, db);
    expect(r.folded).toBe(2);
    const live = db.select().from(sessionTechniques).all().filter((x) => !x.deletedAt);
    expect(live).toHaveLength(1);
    expect(live[0]!.note).toBe('Loser note');
    await taxonomy.undoMerge(r.mergeId, db);
    expectRestored(before);
  });

  it("survivor's parent is the loser → survivor takes the loser's parent; restored on undo; self-loop edges kept", async () => {
    // closedGuard's parent is guard; merge guard (loser) into closedGuard (survivor).
    const r = await taxonomy.merge('POSITION', FX.guard, FX.closedGuard, db);
    expect(db.select().from(positions).where(eq(positions.id, FX.closedGuard)).get()!.parentPositionId).toBeNull();
    await taxonomy.undoMerge(r.mergeId, db);
    expect(db.select().from(positions).where(eq(positions.id, FX.closedGuard)).get()!.parentPositionId).toBe(FX.guard);
    // Scissor sweep goes closedGuard → mount: merging mount into closedGuard leaves a self-loop, kept.
    await taxonomy.merge('POSITION', FX.mount, FX.closedGuard, db);
    expect(db.select().from(techniques).where(eq(techniques.id, FX.sweepToMount)).get()).toMatchObject({ fromPositionId: FX.closedGuard, toPositionId: FX.closedGuard, deletedAt: null });
  });

  it('undo round trip restores every moved row (all tables), and resource links fold per target', async () => {
    await log([f(FX.mount), f(FX.sideControl)]);
    await log([f(FX.mount, { comment: 'Only loser' })], { startsAt: '2026-10-29T18:00:00.000Z' });
    await resources.link(FX.resource, { kind: 'POSITION', id: FX.mount }, db);
    await resources.link(FX.resource, { kind: 'POSITION', id: FX.sideControl }, db);
    const before = snapshot();
    const r = await taxonomy.merge('POSITION', FX.mount, FX.sideControl, db);
    expect(r.folded).toBe(2);
    await taxonomy.undoMerge(r.mergeId, db);
    expectRestored(before);
  });
});

describe('taxonomy.merge — techniques and subjects', () => {
  it('technique: attachments, submissions, aliases and links move; kind mismatch refused', async () => {
    const s = await log([f(FX.mount, { techniqueIds: [FX.escapeToGuard] })], { submissions: [{ direction: 'LANDED', techniqueId: FX.escapeToGuard }] });
    await expect(taxonomy.merge('TECHNIQUE', FX.armbarFromMount, FX.escapeToGuard, db)).rejects.toThrow('TAXONOMY_MERGE_KIND_MISMATCH');
    const before = snapshot();
    const r = await taxonomy.merge('TECHNIQUE', FX.escapeToGuard, FX.sweepToMount, db);
    expect(r.moved).toMatchObject({ session_techniques: 1, submissions: 1 });
    const d = await sessions.getDetail(s.id, db);
    expect(d.focuses[0]!.techniques).toEqual([{ id: FX.sweepToMount, name: 'Scissor sweep' }]);
    expect(d.submissions[0]).toMatchObject({ techniqueId: FX.sweepToMount });
    expect((await taxonomy.getTechnique(FX.sweepToMount, db)).aliases).toEqual(['Elbow escape', 'Tesoura']);
    await taxonomy.undoMerge(r.mergeId, db);
    expectRestored(before);
  });

  it('subject: focus rows move, no aliases (name kept in the payload only)', async () => {
    const s = await log([{ kind: 'SUBJECT', refId: FX.grips, isPlanned: false, isActual: true }]);
    const r = await taxonomy.merge('SUBJECT', FX.grips, FX.retention, db);
    expect(r).toMatchObject({ aliasesAdded: 0, moved: { session_focuses: 1 } });
    expect((await sessions.getDetail(s.id, db)).focuses[0]).toMatchObject({ kind: 'SUBJECT', refId: FX.retention, name: 'Guard retention' });
    expect(db.select().from(subjects).where(eq(subjects.id, FX.grips)).get()!.deletedAt).not.toBeNull();
    await taxonomy.undoMerge(r.mergeId, db);
    expect(db.select().from(subjects).where(eq(subjects.id, FX.grips)).get()!.deletedAt).toBeNull();
  });
});

describe('merge / undo guards', () => {
  it('self, unknown and deleted rows', async () => {
    await expect(taxonomy.merge('POSITION', FX.mount, FX.mount, db)).rejects.toThrow('TAXONOMY_SELF_MERGE');
    await expect(taxonomy.merge('POSITION', FX.mount, 'nope', db)).rejects.toThrow('TAXONOMY_ROW_NOT_FOUND');
    await taxonomy.softDelete('POSITION', FX.sideControl, db);
    await expect(taxonomy.merge('POSITION', FX.mount, FX.sideControl, db)).rejects.toThrow('TAXONOMY_ROW_DELETED');
  });

  it('MERGE_NOT_FOUND, MERGE_ALREADY_UNDONE, MERGE_NOT_LATEST (a later merge names either id)', async () => {
    await expect(taxonomy.undoMerge('nope', db)).rejects.toThrow('MERGE_NOT_FOUND');
    const first = await taxonomy.merge('POSITION', FX.mount, FX.sideControl, db);
    const second = await taxonomy.merge('POSITION', FX.sideControl, FX.guard, db);
    await expect(taxonomy.undoMerge(first.mergeId, db)).rejects.toThrow('MERGE_NOT_LATEST');
    await taxonomy.undoMerge(second.mergeId, db);
    await expect(taxonomy.undoMerge(second.mergeId, db)).rejects.toThrow('MERGE_ALREADY_UNDONE');
    expect((await taxonomy.undoMerge(first.mergeId, db)).mergeId).toBe(first.mergeId);
    expect((await taxonomy.getPosition(FX.mount, db)).canonicalName).toBe('Mount');
  });
});
