/**
 * @jest-environment node
 */
import { aggregateConsistency } from '../panels/consistency';
import { aggregatePlannedVsActual } from '../panels/plannedVsActual';
import { computeProgression } from '../v1/compute';
import { CLOCK, DEFAULTS, hist, row, VECTORS } from '../testing/vectors';
import type { SessionDayRow } from '../types';

const day = (localDate: string, status: SessionDayRow['status'] = 'COMPLETED', durationMinutes?: number): SessionDayRow =>
  durationMinutes === undefined ? { localDate, startsAt: `${localDate}T18:00:00.000Z`, status } : { localDate, startsAt: `${localDate}T18:00:00.000Z`, status, durationMinutes };
const agg = (rows: SessionDayRow[], today = '2026-11-01', windowWeeks = 8) => aggregateConsistency(rows, { today, windowWeeks });
const cell = (d: ReturnType<typeof agg>, localDate: string) => d.weeks.flatMap((w) => w.days).find((c) => c.localDate === localDate)!;

describe('aggregateConsistency — plan §6.6 (today 2026-11-01, windowWeeks 8)', () => {
  it('H1 empty: 8 weeks × 7 zero cells; index-stable from gridStart 09-07; totals 0', () => {
    const d = agg([]);
    expect([d.windowStart, d.today, d.weeks.length]).toEqual(['2026-09-07', '2026-11-01', 8]);
    expect(d.weeks.every((w) => w.days.length === 7 && w.completed === 0)).toBe(true);
    expect(d.weeks[0]!.weekStart).toBe('2026-09-07');
    expect(d.weeks[7]!.days[6].localDate).toBe('2026-11-01');
    expect(d.weeks[2]!.days[3].localDate).toBe('2026-09-24');
    expect(d.totals).toEqual({ completed: 0, activeDays: 0, minutes: 0, weeksWithTraining: 0, weeksInWindow: 8, currentStreakWeeks: 0 });
  });

  it('H2 one session: Friday 10-30 completed 1, 60 minutes; totals and streak 1', () => {
    const d = agg([day('2026-10-30', 'COMPLETED', 60)]);
    expect(d.weeks[7]!.days[4]).toEqual({ localDate: '2026-10-30', inWindow: true, future: false, completed: 1, skipped: 0, pending: 0, minutes: 60 });
    expect(d.totals).toEqual({ completed: 1, activeDays: 1, minutes: 60, weeksWithTraining: 1, weeksInWindow: 8, currentStreakWeeks: 1 });
  });

  it('H3 two a day: count 2, minutes 60 (missing duration = 0), one active day', () => {
    const d = agg([day('2026-10-30', 'COMPLETED', 60), day('2026-10-30')]);
    expect([cell(d, '2026-10-30').completed, cell(d, '2026-10-30').minutes, d.totals.activeDays]).toEqual([2, 60, 1]);
  });

  it('H4 statuses: skipped, stale planned → pending, completed', () => {
    const d = agg([day('2026-10-29', 'SKIPPED'), day('2026-10-31', 'PLANNED'), day('2026-11-01', 'COMPLETED', 30)]);
    expect(cell(d, '2026-10-29').skipped).toBe(1);
    expect(cell(d, '2026-10-31').pending).toBe(1);
    expect(cell(d, '2026-11-01').completed).toBe(1);
    expect(d.totals.completed).toBe(1);
  });

  it('H5 window edge: 09-06 before gridStart is ignored; 09-07 counted', () => {
    const d = agg([day('2026-09-06'), day('2026-09-07')]);
    expect(cell(d, '2026-09-07')).toMatchObject({ inWindow: true, completed: 1 });
    expect(d.totals.completed).toBe(1);
  });

  it('H6 partial weeks: today 11-03 (Tue), 2 weeks → 3 rows; out-of-window and future cells; totals in-window only', () => {
    const d = agg([day('2026-10-19'), day('2026-10-21'), day('2026-11-03')], '2026-11-03', 2);
    expect([d.windowStart, d.weeks.length, d.weeks[0]!.weekStart, d.weeks[2]!.days[6].localDate]).toEqual(['2026-10-21', 3, '2026-10-19', '2026-11-08']);
    expect([cell(d, '2026-10-19').inWindow, cell(d, '2026-10-20').inWindow, cell(d, '2026-10-21').inWindow]).toEqual([false, false, true]);
    expect(['2026-11-04', '2026-11-08'].map((x) => cell(d, x).future)).toEqual([true, true]);
    expect(cell(d, '2026-11-03').future).toBe(false);
    expect(cell(d, '2026-10-19').completed).toBe(1);
    expect([d.totals.completed, d.totals.weeksInWindow]).toEqual([2, 2]);
  });

  it('H7 streak: 3 consecutive weeks incl. the current; current empty → from previous (2); gap → 1', () => {
    expect(agg([day('2026-10-13'), day('2026-10-20'), day('2026-10-27')]).totals.currentStreakWeeks).toBe(3);
    expect(agg([day('2026-10-13'), day('2026-10-20'), day('2026-10-24')]).totals.currentStreakWeeks).toBe(2);
    expect(agg([day('2026-10-13'), day('2026-10-27')]).totals.currentStreakWeeks).toBe(1);
  });

  it('ignores rows after today (§6.2)', () => {
    expect(agg([day('2026-11-05')], '2026-11-03', 2).totals.completed).toBe(0);
  });
});

const NOW = { today: CLOCK.today, windowWeeks: 8, nowIso: CLOCK.nowIso };

describe('aggregatePlannedVsActual — plan §6.7 (today 2026-11-01, now 12:00Z)', () => {
  it('G1 none: no rows, totals 0', () => {
    expect(aggregatePlannedVsActual([hist([])], NOW)).toEqual({
      windowStart: '2026-09-07',
      today: '2026-11-01',
      totals: { planned: 0, trained: 0, notTrained: 0, pending: 0, unplannedTrained: 0 },
      rows: [],
    });
  });

  it('G2 trained as planned: gap 0', () => {
    const [r] = aggregatePlannedVsActual([hist([row('2026-10-30', { isPlanned: true })])], NOW).rows;
    expect(r).toMatchObject({ planned: 1, trained: 1, notTrained: 0, pending: 0, gap: 0 });
  });

  it('G3 skipped: notTrained 1, gap 1', () => {
    const [r] = aggregatePlannedVsActual([hist([row('2026-10-30', { status: 'SKIPPED', isPlanned: true, isActual: false })])], NOW).rows;
    expect(r).toMatchObject({ planned: 1, notTrained: 1, gap: 1 });
  });

  it('G4 stale planned vs pending: 10-25 notTrained, 11-01 09:00Z pending (< 24 h), gap 0.5', () => {
    const p = { status: 'PLANNED' as const, isPlanned: true, isActual: false };
    const [r] = aggregatePlannedVsActual(
      [hist([row('2026-10-25', { ...p, startsAt: '2026-10-25T18:00:00.000Z' }), row('2026-11-01', { ...p, startsAt: '2026-11-01T09:00:00.000Z' })])],
      NOW,
    ).rows;
    expect(r).toMatchObject({ planned: 2, trained: 0, notTrained: 1, pending: 1, gap: 0.5 });
  });

  it('G5 unplanned: row present, unplannedTrained 1, no gap', () => {
    const [r] = aggregatePlannedVsActual([hist([row('2026-10-30')])], NOW).rows;
    expect(r).toMatchObject({ planned: 0, unplannedTrained: 1 });
    expect(r!.gap).toBeUndefined();
  });

  it('G6 mixed (T9): planned 5, trained 1, notTrained 4, pending 0, gap 0.8', () => {
    const [r] = aggregatePlannedVsActual([hist(VECTORS.T9!)], NOW).rows;
    expect(r).toMatchObject({ planned: 5, trained: 1, notTrained: 4, pending: 0, unplannedTrained: 0, gap: 0.8 });
  });

  it('orders by notTrained desc, gap desc, name; removed last; totals sum the rows', () => {
    const skipped = (d: string) => row(d, { status: 'SKIPPED', isPlanned: true, isActual: false });
    const d = aggregatePlannedVsActual(
      [
        hist([row('2026-10-30')], { name: 'unplanned', ref: { kind: 'SUBJECT', refId: 'u' } }),
        hist([skipped('2026-10-30')], { name: 'b', ref: { kind: 'POSITION', refId: 'b' } }),
        hist([skipped('2026-10-29'), skipped('2026-10-30')], { name: 'removed', removed: true, ref: { kind: 'POSITION', refId: 'r' } }),
        hist([skipped('2026-10-30'), row('2026-10-29', { isPlanned: true })], { name: 'a', ref: { kind: 'POSITION', refId: 'a' } }),
        hist([skipped('2026-10-28'), skipped('2026-10-30')], { name: 'z', ref: { kind: 'POSITION', refId: 'z' } }),
      ],
      NOW,
    );
    expect(d.rows.map((r) => r.name)).toEqual(['z', 'b', 'a', 'unplanned', 'removed']);
    expect(d.totals).toEqual({ planned: 7, trained: 1, notTrained: 6, pending: 0, unplannedTrained: 1 });
  });

  it.each(Object.keys(VECTORS))('PS-22 equality: panel gap equals the gap signal for %s', (key) => {
    const h = hist(VECTORS[key]!);
    const signal = computeProgression([h], DEFAULTS, CLOCK)[0]!.signals.find((s) => s.signal === 'gap')!;
    const panelRow = aggregatePlannedVsActual([h], NOW).rows[0];
    expect(panelRow?.gap).toBe(signal.available ? signal.value : undefined);
  });
});
