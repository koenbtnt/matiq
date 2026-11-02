/**
 * @jest-environment node
 */
import { eq } from 'drizzle-orm';

import type { Db } from '../../db/client';
import { positions, sessionFocuses } from '../../db/schema';
import { algorithmParams } from '../algorithmParams';
import type { FocusInput } from '../contracts';
import { progression } from '../progression';
import { sessions } from '../sessions';
import { settings } from '../settings';
import { FX } from '../testing/fixtures';
import { resetRuntime, seededDb } from '../testing/helpers';

const CLOCK = { today: '2026-11-01', nowIso: '2026-11-01T12:00:00.000Z' };
let db: Db;
let sqlite: Awaited<ReturnType<typeof seededDb>>['sqlite'];
beforeEach(async () => {
  ({ db, sqlite } = await seededDb('2026-11-01T12:00:00.000Z'));
});
afterEach(resetRuntime);

const f = (refId: string, over: Partial<FocusInput> = {}): FocusInput => ({ kind: 'POSITION', refId, isPlanned: false, isActual: true, ...over });
const log = (date: string, focuses: FocusInput[], durationMinutes?: number) =>
  sessions.log({ sessionTypeId: FX.gi, startsAt: `${date}T18:00:00.000Z`, timeZone: 'UTC', focuses, durationMinutes }, db);
const plan = (date: string, refIds: string[], time = '18:00:00.000Z') =>
  sessions.create({ sessionTypeId: FX.gi, startsAt: `${date}T${time}`, timeZone: 'UTC', focuses: refIds.map((refId) => ({ kind: 'POSITION' as const, refId })) }, db);

describe('progression.inputs / sessionDays', () => {
  it('one FocusHistory per ref with live rows of live sessions (all time); removed from the taxonomy row', async () => {
    await log('2026-01-05', [f(FX.mount, { rating: 4 })]);
    const s2 = await log('2026-10-30', [f(FX.mount, { needsWork: true }), { kind: 'SUBJECT', refId: FX.grips, isPlanned: false, isActual: true }]);
    const gone = await log('2026-10-29', [f(FX.sideControl)]);
    await sessions.softDelete(gone.id, db);
    db.update(positions).set({ deletedAt: '2026-11-01T00:00:00.000Z' }).where(eq(positions.id, FX.mount)).run();
    const inputs = await progression.inputs({ today: CLOCK.today }, db);
    const byRef = Object.fromEntries(inputs.map((h) => [h.ref.refId, h]));
    expect(Object.keys(byRef).sort()).toEqual([FX.grips, FX.mount].sort());
    expect(byRef[FX.mount]).toMatchObject({ name: 'Mount', removed: true });
    expect(byRef[FX.mount]!.rows).toHaveLength(2);
    expect(byRef[FX.mount]!.rows).toContainEqual({ localDate: '2026-10-30', startsAt: s2.startsAt, status: 'COMPLETED', isPlanned: false, isActual: true, needsWork: true });
    expect(byRef[FX.grips]).toMatchObject({ ref: { kind: 'SUBJECT', refId: FX.grips }, name: 'Grip fighting', removed: false });
  });

  it('sessionDays: live sessions dated ≤ today, any status', async () => {
    await log('2026-10-30', [f(FX.mount)], 60);
    await plan('2026-10-31', [FX.mount]);
    await plan('2026-11-03', [FX.mount]);
    const days = await progression.sessionDays({ today: CLOCK.today }, db);
    expect(days.map((d) => [d.localDate, d.status, d.durationMinutes]).sort()).toEqual([
      ['2026-10-30', 'COMPLETED', 60],
      ['2026-10-31', 'PLANNED', undefined],
    ]);
  });
});

describe('progression.overview (PS-04, PS-06, PS-21, PS-22)', () => {
  it('empty database: no results, zero grid, empty gap panel; params from the active version', async () => {
    const o = await progression.overview(CLOCK, db);
    expect(o).toMatchObject({ today: '2026-11-01', windowStart: '2026-09-07', algorithmVersion: 'v1', results: [] });
    expect(o.params).toMatchObject({ windowWeeks: 8, staleDays: 21, wNeedsWork: 0.4 });
    expect(o.consistency.weeks).toHaveLength(8);
    expect(o.consistency.totals.completed).toBe(0);
    expect(o.plannedVsActual.rows).toEqual([]);
  });

  it('states sorted per PS-04 and both panels from the same load', async () => {
    await plan('2026-10-28', [FX.sideControl]); // stale planned, never logged → NOT_TRAINED, gap 1
    await log('2026-10-30', [f(FX.mount, { needsWork: true, rating: 3 }), f(FX.closedGuard, { rating: 3 })], 45);
    const o = await progression.overview(CLOCK, db);
    expect(o.results.map((r) => [r.name, r.state, r.flagged])).toEqual([
      ['Mount', 'NEEDS_WORK', true],
      ['Side control', 'NOT_TRAINED', false],
      ['Closed guard', 'STEADY', false],
    ]);
    expect(o.consistency.totals).toMatchObject({ completed: 1, activeDays: 1, minutes: 45 });
    const cells = o.consistency.weeks.flatMap((w) => w.days);
    expect(cells.find((c) => c.localDate === '2026-10-28')!.pending).toBe(1);
    expect(o.plannedVsActual.rows.map((r) => [r.name, r.planned, r.notTrained, r.unplannedTrained])).toEqual([
      ['Side control', 1, 1, 0],
      ['Closed guard', 0, 0, 1],
      ['Mount', 0, 0, 1],
    ]);
    const side = o.results.find((r) => r.name === 'Side control')!;
    expect(side.signals.find((s) => s.signal === 'gap')!.value).toBe(o.plannedVsActual.rows[0]!.gap);
  });

  it('a removed focus shows only while it has a live row inside the window (T14)', async () => {
    await log('2026-10-30', [f(FX.mount)]);
    await log('2026-08-01', [f(FX.sideControl)]);
    db.update(positions).set({ deletedAt: '2026-11-01T00:00:00.000Z' }).where(eq(positions.id, FX.mount)).run();
    db.update(positions).set({ deletedAt: '2026-11-01T00:00:00.000Z' }).where(eq(positions.id, FX.sideControl)).run();
    const o = await progression.overview(CLOCK, db);
    expect(o.results.map((r) => [r.name, r.removed])).toEqual([['Mount', true]]);
  });

  it('reads the params rows: a weight edit flips a state; windowWeeks re-cuts the panels', async () => {
    await log('2026-10-30', [f(FX.mount, { needsWork: true })]);
    expect((await progression.overview(CLOCK, db)).results[0]!.state).toBe('NEEDS_WORK');
    await algorithmParams.set({ version: 'v1', key: 'wNeedsWork', value: 0 }, db);
    expect((await progression.overview(CLOCK, db)).results[0]).toMatchObject({ state: 'STEADY', score: 0 });
    await algorithmParams.set({ version: 'v1', key: 'windowWeeks', value: 2 }, db);
    const o = await progression.overview(CLOCK, db);
    expect([o.windowStart, o.consistency.weeks.length, o.consistency.totals.weeksInWindow]).toEqual(['2026-10-19', 2, 2]);
  });

  it('ignores soft-deleted focus rows', async () => {
    await log('2026-10-30', [f(FX.mount), f(FX.closedGuard)]);
    db.update(sessionFocuses).set({ deletedAt: '2026-11-01T00:00:00.000Z' }).where(eq(sessionFocuses.focusRefId, FX.closedGuard)).run();
    expect((await progression.overview(CLOCK, db)).results.map((r) => r.name)).toEqual(['Mount']);
  });

  it('NF-09 end to end on better-sqlite3: 500 sessions × 3 focuses (informative; asserts < 2000 ms)', async () => {
    const ins = sqlite;
    const sIns = ins.prepare(
      "INSERT INTO sessions (id, created_at, updated_at, session_type_id, status, starts_at, local_date, duration_minutes, completed_at) VALUES (?, ?, ?, ?, 'COMPLETED', ?, ?, 60, ?)",
    );
    const fIns = ins.prepare(
      'INSERT INTO session_focuses (id, created_at, updated_at, session_id, focus_kind, focus_ref_id, is_planned, is_actual, needs_work, rating, sort_order) VALUES (?, ?, ?, ?, ?, ?, 0, 1, ?, ?, ?)',
    );
    ins.transaction(() => {
      for (let i = 0; i < 500; i += 1) {
        const d = new Date(Date.UTC(2026, 10, 1 - Math.floor(i / 2)));
        const date = d.toISOString().slice(0, 10);
        const at = `${date}T${i % 2 ? '18' : '08'}:00:00.000Z`;
        const sid = `s-${i}`;
        sIns.run(sid, at, at, FX.gi, at, date, at);
        [FX.mount, FX.closedGuard, FX.sideControl].forEach((ref, k) => fIns.run(`f-${i}-${k}`, at, at, sid, 'POSITION', ref, i % 5 === 0 ? 1 : 0, ((i + k) % 5) + 1, k));
      }
    })();
    await progression.overview(CLOCK, db);
    const t0 = process.hrtime.bigint();
    const o = await progression.overview(CLOCK, db);
    const ms = Number(process.hrtime.bigint() - t0) / 1e6;
    console.log(`NF-09 progression.overview (load + compute + panels) 500 sessions × 3 focuses: ${ms.toFixed(2)} ms`);
    expect(o.results).toHaveLength(3);
    expect(ms).toBeLessThan(2000);
  });
});

describe('sessions.home suggestions from the algorithm (PS-06)', () => {
  it('LAST_NEEDS_WORK first, then NEEDS_WORK by score, then NOT_TRAINED by daysSince; capped at suggest.max', async () => {
    await log('2026-09-01', [f(FX.sideControl)]); // trained long ago → NOT_TRAINED with lastTrainedOn
    await log('2026-10-20', [f(FX.closedGuard, { needsWork: true })]);
    await log('2026-10-30', [f(FX.mount, { needsWork: true })]);
    const home = await sessions.home({ today: CLOCK.today, now: CLOCK.nowIso }, db);
    expect(home.suggestions.map((s) => [s.name, s.source])).toEqual([
      ['Mount', 'LAST_NEEDS_WORK'],
      ['Closed guard', 'NEEDS_WORK'],
      ['Side control', 'NOT_TRAINED'],
    ]);
    await settings.set('suggest.max', 1, db);
    expect((await sessions.home({ today: CLOCK.today, now: CLOCK.nowIso }, db)).suggestions).toHaveLength(1);
  });

  it('a planned-only focus (never trained) is not suggested as NOT_TRAINED', async () => {
    await plan('2026-10-28', [FX.sideControl]);
    expect((await sessions.home({ today: CLOCK.today }, db)).suggestions).toEqual([]);
  });
});
