/**
 * @jest-environment node
 */
import { eq } from 'drizzle-orm';

import { positions, sessionFocuses, sessions as sessionsTable, sessionTechniques, submissions as submissionsTable } from '../../db/schema';
import type { Db } from '../../db/client';
import type { FocusInput, LogSessionInput } from '../contracts';
import { rounds } from '../rounds';
import { sessions } from '../sessions';
import { settings } from '../settings';
import { submissions } from '../submissions';
import { FX } from '../testing/fixtures';
import { resetRuntime, seededDb } from '../testing/helpers';

const TZ = 'Europe/Amsterdam';
let db: Db;
let clock: Awaited<ReturnType<typeof seededDb>>['clock'];

beforeEach(async () => {
  ({ db, clock } = await seededDb('2026-03-02T20:00:00.000Z'));
});
afterEach(resetRuntime);

const actual = (refId: string, over: Partial<FocusInput> = {}): FocusInput => ({
  kind: 'POSITION', refId, isPlanned: false, isActual: true, ...over,
});
const logInput = (over: Partial<LogSessionInput> = {}): LogSessionInput => ({
  sessionTypeId: FX.gi,
  startsAt: '2026-03-02T18:00:00.000Z',
  timeZone: TZ,
  focuses: [actual(FX.mount)],
  ...over,
});
const plan = (focuses = [FX.mount, FX.closedGuard], startsAt = '2026-03-03T18:00:00.000Z') =>
  sessions.create({ sessionTypeId: FX.gi, startsAt, timeZone: TZ, focuses: focuses.map((refId) => ({ kind: 'POSITION' as const, refId })) }, db);

describe('sessions.log — new session', () => {
  it('NF-03: type + one actual focus is a COMPLETED session with derived local date', async () => {
    const d = await sessions.log(logInput(), db);
    expect(d).toMatchObject({
      status: 'COMPLETED', sessionTypeName: 'Gi class', localDate: '2026-03-02', focusNames: ['Mount'], completedAt: expect.any(String),
    });
    expect(d.focuses).toEqual([
      expect.objectContaining({ refId: FX.mount, isPlanned: false, isActual: true, needsWork: false, name: 'Mount', aliases: ['Full mount'], removed: false, techniques: [] }),
    ]);
    expect(d).not.toHaveProperty('rating');
  });

  it('stores per-focus feedback, techniques, aggregates and session-level submissions', async () => {
    const d = await sessions.log(
      logInput({
        rating: 4, intensity: 3, energy: 2, durationMinutes: 90, whatWorked: 'Frames', contextNote: '  ',
        focuses: [actual(FX.closedGuard, { rating: 5, needsWork: true, hitCount: 2, caughtCount: 1, comment: 'Hips', techniqueIds: [FX.sweepToMount] }), { kind: 'SUBJECT', refId: FX.grips, isPlanned: false, isActual: true }],
        aggregates: { roundsCount: 5, submissionsLanded: 2, submissionsTaken: 1 },
        submissions: [{ direction: 'LANDED', techniqueId: FX.armbarFromMount }, { direction: 'TAKEN' }],
      }),
      db,
    );
    expect(d).toMatchObject({ rating: 4, intensity: 3, energy: 2, durationMinutes: 90, whatWorked: 'Frames', roundsCount: 5, submissionsLanded: 2, submissionsTaken: 1 });
    expect(d).not.toHaveProperty('contextNote');
    expect(d.focuses[0]).toMatchObject({ rating: 5, needsWork: true, hitCount: 2, caughtCount: 1, comment: 'Hips', techniques: [{ id: FX.sweepToMount, name: 'Scissor sweep' }] });
    expect(d.focuses[1]).toMatchObject({ kind: 'SUBJECT', name: 'Grip fighting' });
    expect(d.submissions).toEqual([
      expect.objectContaining({ direction: 'LANDED', techniqueId: FX.armbarFromMount, techniqueName: 'Armbar from mount' }),
      expect.objectContaining({ direction: 'TAKEN' }),
    ]);
    expect(d.submissions[1]).not.toHaveProperty('techniqueId');
  });

  it.each<[string, Partial<LogSessionInput>]>([
    ['SESSION_TYPE_NOT_FOUND', { sessionTypeId: 'nope' }],
    ['FOCUS_REF_NOT_FOUND', { focuses: [actual('nope')] }],
    ['FOCUS_REF_NOT_FOUND', { focuses: [{ kind: 'SUBJECT', refId: FX.mount, isPlanned: false, isActual: true }] }],
    ['TECHNIQUE_NOT_FOUND', { focuses: [actual(FX.mount, { techniqueIds: ['nope'] })] }],
    ['TECHNIQUE_NOT_FOUND', { submissions: [{ direction: 'LANDED', techniqueId: 'nope' }] }],
    ['SESSION_NOT_FOUND', { sessionId: 'nope' }],
    ['SESSION_NEEDS_ACTUAL_FOCUS', { focuses: [actual(FX.mount, { isPlanned: true, isActual: false })] }],
    ['SESSION_START_INVALID', { timeZone: 'Nowhere/Land' }],
    ['ROUND_NOT_IN_SESSION', { submissions: [{ direction: 'LANDED', roundId: 'r-x' }] }],
    ['ROUND_NO_DUPLICATE', { rounds: [{ roundNo: 1 }, { roundNo: 1 }] }],
  ])('rejects with %s and writes nothing', async (code, over) => {
    await expect(sessions.log(logInput(over), db)).rejects.toThrow(code);
    expect(db.select().from(sessionsTable).all()).toHaveLength(0);
  });

  it('rejects a focus on a soft-deleted position (pickers never offer it)', async () => {
    db.update(positions).set({ deletedAt: clock.now() }).where(eq(positions.id, FX.mount)).run();
    await expect(sessions.log(logInput(), db)).rejects.toThrow('FOCUS_REF_NOT_FOUND');
  });
});

describe('plan → log (F-19, F-20)', () => {
  it('sessions.create plans a session; editing replaces its focus set', async () => {
    const p = await plan();
    expect(p).toMatchObject({ status: 'PLANNED', localDate: '2026-03-03', focusNames: ['Mount', 'Closed guard'] });
    expect(p.focuses.every((f) => f.isPlanned && !f.isActual)).toBe(true);
    const edited = await sessions.create({ sessionId: p.id, sessionTypeId: FX.nogi, startsAt: '2026-03-04T18:00:00.000Z', timeZone: TZ, focuses: [{ kind: 'SUBJECT', refId: FX.grips }] }, db);
    expect(edited).toMatchObject({ id: p.id, sessionTypeName: 'No-gi class', localDate: '2026-03-04', focusNames: ['Grip fighting'] });
    expect(db.select().from(sessionFocuses).where(eq(sessionFocuses.sessionId, p.id)).all().filter((f) => f.deletedAt)).toHaveLength(2);
  });

  it('logging a planned session keeps un-ticked planned rows as planned-not-trained', async () => {
    const p = await plan();
    const d = await sessions.log(
      logInput({
        sessionId: p.id,
        focuses: [
          actual(FX.mount, { isPlanned: true, rating: 4, techniqueIds: [FX.armbarFromMount] }),
          actual(FX.closedGuard, { isPlanned: true, isActual: false }),
          actual(FX.sideControl),
        ],
      }),
      db,
    );
    expect(d.status).toBe('COMPLETED');
    expect(d.focuses.map((f) => [f.name, f.isPlanned, f.isActual])).toEqual([
      ['Mount', true, true],
      ['Closed guard', true, false],
      ['Side control', false, true],
    ]);
    expect(d.focusNames).toEqual(['Mount', 'Side control']);
  });

  it('a planned row omitted from the log input stays planned-not-trained', async () => {
    const p = await plan();
    const d = await sessions.log(logInput({ sessionId: p.id, focuses: [actual(FX.mount)] }), db);
    expect(d.focuses.map((f) => [f.name, f.isPlanned, f.isActual])).toEqual([
      ['Mount', true, true],
      ['Closed guard', true, false],
    ]);
  });

  it('create on a COMPLETED session is SESSION_NOT_PLANNED', async () => {
    const d = await sessions.log(logInput(), db);
    await expect(sessions.create({ sessionId: d.id, sessionTypeId: FX.gi, startsAt: d.startsAt, timeZone: TZ, focuses: [{ kind: 'POSITION', refId: FX.mount }] }, db)).rejects.toThrow('SESSION_NOT_PLANNED');
  });
});

describe('review edits (R-26, A-12)', () => {
  it('sets reviewedAt on the first change of rating / whatWorked / whatFailed only', async () => {
    const d = await sessions.log(logInput({ rating: 3 }), db);
    const same = await sessions.log(logInput({ sessionId: d.id, rating: 3, durationMinutes: 60 }), db);
    expect(same).not.toHaveProperty('reviewedAt');
    expect(same.completedAt).toBe(d.completedAt);
    const reviewed = await sessions.log(logInput({ sessionId: d.id, rating: 3, whatFailed: 'Guard passes' }), db);
    expect(reviewed.reviewedAt).toEqual(expect.any(String));
    const again = await sessions.log(logInput({ sessionId: d.id, rating: 5, whatFailed: 'Guard passes' }), db);
    expect(again.reviewedAt).toBe(reviewed.reviewedAt);
    expect(again.status).toBe('COMPLETED');
  });

  it('un-ticking a focus drops its technique attachments (TECHNIQUE_REQUIRES_ACTUAL kept by construction)', async () => {
    const p = await plan([FX.closedGuard]);
    const d = await sessions.log(logInput({ sessionId: p.id, focuses: [actual(FX.closedGuard, { isPlanned: true, techniqueIds: [FX.sweepToMount] }), actual(FX.mount)] }), db);
    expect(d.focuses[0]!.techniques).toHaveLength(1);
    const e = await sessions.log(logInput({ sessionId: d.id, focuses: [actual(FX.closedGuard, { isPlanned: true, isActual: false }), actual(FX.mount)] }), db);
    expect(e.focuses[0]).toMatchObject({ isActual: false, techniques: [] });
    expect(db.select().from(sessionTechniques).all().filter((t) => !t.deletedAt)).toHaveLength(0);
  });

  it('COUNTS_REQUIRE_ACTUAL and TECHNIQUE_REQUIRES_ACTUAL reach the caller as DomainErrors (R1-05)', async () => {
    const p = await plan([FX.closedGuard]);
    await expect(sessions.log(logInput({ sessionId: p.id, focuses: [actual(FX.mount), actual(FX.closedGuard, { isPlanned: true, isActual: false, hitCount: 1 })] }), db)).rejects.toMatchObject({ code: 'COUNTS_REQUIRE_ACTUAL' });
    await expect(sessions.log(logInput({ sessionId: p.id, focuses: [actual(FX.mount), actual(FX.closedGuard, { isPlanned: true, isActual: false, techniqueIds: [FX.sweepToMount] })] }), db)).rejects.toMatchObject({ code: 'TECHNIQUE_REQUIRES_ACTUAL' });
  });

  it('a removed focus target renders removed and stays editable', async () => {
    const d = await sessions.log(logInput(), db);
    db.update(positions).set({ deletedAt: clock.now() }).where(eq(positions.id, FX.mount)).run();
    const detail = await sessions.getDetail(d.id, db);
    expect(detail.focuses[0]).toMatchObject({ name: 'Mount', removed: true });
    await expect(sessions.log(logInput({ sessionId: d.id, rating: 2 }), db)).resolves.toMatchObject({ rating: 2 });
  });

  it('submissions: undefined keeps stored rows, [] clears them', async () => {
    const d = await sessions.log(logInput({ submissions: [{ direction: 'LANDED' }] }), db);
    expect((await sessions.log(logInput({ sessionId: d.id }), db)).submissions).toHaveLength(1);
    expect((await sessions.log(logInput({ sessionId: d.id, submissions: [] }), db)).submissions).toHaveLength(0);
    expect(db.select().from(submissionsTable).all()[0]!.deletedAt).not.toBeNull();
  });
});

describe('soft delete, skip (NF-05)', () => {
  it('softDelete hides the session; undoDelete restores it', async () => {
    const d = await sessions.log(logInput(), db);
    await expect(sessions.softDelete(d.id, db)).resolves.toMatchObject({ id: d.id });
    await expect(sessions.getDetail(d.id, db)).rejects.toThrow('SESSION_NOT_FOUND');
    expect((await sessions.home({ today: '2026-03-02' }, db)).recent).toHaveLength(0);
    await expect(sessions.softDelete(d.id, db)).rejects.toThrow('SESSION_NOT_FOUND');
    await expect(sessions.undoDelete(d.id, db)).resolves.toMatchObject({ id: d.id, status: 'COMPLETED' });
    expect((await sessions.getDetail(d.id, db)).id).toBe(d.id);
    await expect(sessions.undoDelete('nope', db)).rejects.toThrow('SESSION_NOT_FOUND');
    expect(db.select().from(sessionsTable).all()).toHaveLength(1);
  });

  it('skip PLANNED → SKIPPED; undoSkip back; wrong states are SESSION_NOT_PLANNED', async () => {
    const p = await plan();
    await expect(sessions.undoSkip(p.id, db)).rejects.toThrow('SESSION_NOT_PLANNED');
    expect((await sessions.skip(p.id, db)).status).toBe('SKIPPED');
    await expect(sessions.skip(p.id, db)).rejects.toThrow('SESSION_NOT_PLANNED');
    expect((await sessions.getDetail(p.id, db)).focuses.every((f) => f.isPlanned && !f.isActual)).toBe(true);
    expect((await sessions.undoSkip(p.id, db)).status).toBe('PLANNED');
    await expect(sessions.skip('nope', db)).rejects.toThrow('SESSION_NOT_FOUND');
    const d = await sessions.log(logInput(), db);
    await expect(sessions.skip(d.id, db)).rejects.toThrow('SESSION_NOT_PLANNED');
  });
});

describe('sessions.home (F-22, R1-04)', () => {
  it('partitions PLANNED by local date at the midnight boundary', async () => {
    // 23:30 yesterday and 00:30 today, Amsterdam (UTC+1 in March).
    const late = await plan([FX.mount], '2026-03-02T22:30:00.000Z');
    const early = await plan([FX.closedGuard], '2026-03-02T23:30:00.000Z');
    const h = await sessions.home({ today: '2026-03-03' }, db);
    expect(h.stalePlanned.map((s) => s.id)).toEqual([late.id]);
    expect(h.todayPlanned.map((s) => s.id)).toEqual([early.id]);
    expect(h.nextPlanned?.id).toBe(early.id);
    expect(sessions.quickLogTarget(h)).toEqual({ sessionId: early.id });
  });

  it('recent (5, newest first), lastCompleted, lastUsedTypeId, suggestions and rank', async () => {
    for (let i = 1; i <= 6; i += 1) {
      await sessions.log(logInput({ startsAt: `2026-02-2${i}T18:00:00.000Z`, sessionTypeId: i === 6 ? FX.nogi : FX.gi, focuses: [actual(FX.mount, { needsWork: i === 6 }), actual(FX.closedGuard, { needsWork: true })] }), db);
    }
    await settings.set('suggest.max', 1, db);
    const h = await sessions.home({ today: '2026-03-02' }, db);
    expect(h.recent).toHaveLength(5);
    expect(h.recent[0]!.startsAt).toBe('2026-02-26T18:00:00.000Z');
    expect(h.lastCompleted?.id).toBe(h.recent[0]!.id);
    expect(h.lastUsedTypeId).toBe(FX.nogi);
    expect(h.suggestions).toEqual([{ ref: { kind: 'POSITION', refId: FX.mount }, name: 'Mount', source: 'LAST_NEEDS_WORK' }]);
    expect(h).not.toHaveProperty('rank');
    expect(sessions.quickLogTarget(h)).toEqual({ sessionTypeId: FX.nogi, focuses: [] });
  });

  it('empty database: empty lists, no next, quick log falls back to the first type', async () => {
    const h = await sessions.home({ today: '2026-03-02' }, db);
    expect(h).toEqual({ today: '2026-03-02', todayPlanned: [], stalePlanned: [], recent: [], suggestions: [] });
    expect(sessions.quickLogTarget(h, [{ id: FX.gi, name: 'Gi class', sortOrder: 1 }])).toEqual({ sessionTypeId: FX.gi, focuses: [] });
  });
});

describe('rounds.upsert / submissions.upsert (A-20, sprint 3 UI)', () => {
  it('replace-set rounds with their submissions; renumbering is safe', async () => {
    const d = await sessions.log(logInput(), db);
    const r1 = await rounds.upsert(d.id, [{ roundNo: 1, partnerBelt: 'BLUE', outcome: 'EVEN', submissions: [{ direction: 'LANDED', techniqueId: FX.armbarFromMount }] }, { roundNo: 2 }], db);
    expect(r1.map((r) => [r.roundNo, r.submissions.length])).toEqual([[1, 1], [2, 0]]);
    const swapped = await rounds.upsert(d.id, [{ ...r1[0]!, roundNo: 2 }, { ...r1[1]!, roundNo: 1 }], db);
    expect(swapped.map((r) => r.id)).toEqual([r1[1]!.id, r1[0]!.id]);
    const one = await rounds.upsert(d.id, [{ id: r1[1]!.id, roundNo: 1 }], db);
    expect(one).toHaveLength(1);
    await expect(rounds.upsert(d.id, [{ id: 'foreign', roundNo: 3 }], db)).rejects.toThrow('ROUND_NOT_IN_SESSION');
    await expect(rounds.upsert(d.id, [{ roundNo: 1 }, { roundNo: 1 }], db)).rejects.toThrow('ROUND_NO_DUPLICATE');
    await expect(rounds.upsert('nope', [], db)).rejects.toThrow('SESSION_NOT_FOUND');
    expect(rounds.deriveAggregates(r1)).toEqual({ roundsCount: 2, submissionsLanded: 1, submissionsTaken: 0 });
  });

  it('submissions.upsert updates by id, inserts new rows, soft-deletes the rest', async () => {
    const d = await sessions.log(logInput({ submissions: [{ direction: 'LANDED' }, { direction: 'TAKEN' }] }), db);
    const [a] = d.submissions;
    const next = await submissions.upsert(d.id, [{ id: a!.id, direction: 'LANDED', techniqueId: FX.armbarFromMount }, { direction: 'TAKEN', note: 'Late' }], db);
    expect(next.map((s) => [s.id === a!.id, s.techniqueName, s.note])).toEqual([[true, 'Armbar from mount', undefined], [false, undefined, 'Late']]);
    await expect(submissions.upsert(d.id, [{ direction: 'LANDED', techniqueId: 'nope' }], db)).rejects.toThrow('TECHNIQUE_NOT_FOUND');
    await expect(submissions.upsert(d.id, [{ direction: 'X' as never }], db)).rejects.toThrow('SUBMISSION_DIRECTION_INVALID');
  });
});
