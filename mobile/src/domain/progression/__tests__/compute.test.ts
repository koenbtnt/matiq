/**
 * @jest-environment node
 */
import { computeProgression } from '../v1/compute';
import { sortProgressResults } from '../sort';
import { CLOCK, DEFAULTS, hist, row, VECTORS } from '../testing/vectors';
import type { FocusHistory, FocusHistoryRow, ProgressResult, SignalId } from '../types';

const one = (rows: FocusHistoryRow[], params = DEFAULTS, clock = CLOCK): ProgressResult => computeProgression([hist(rows)], params, clock)[0]!;
const sig = (r: ProgressResult, id: SignalId) => r.signals.find((s) => s.signal === id)!;

describe('computeProgression v1 — plan §6.5 vectors (defaults, today 2026-11-01)', () => {
  it('T1 empty: NOT_TRAINED rule 1, every signal unavailable, no score', () => {
    const r = one(VECTORS.T1!);
    expect([r.state, r.rule, r.n, r.score, r.flagged]).toEqual(['NOT_TRAINED', 1, 0, undefined, false]);
    expect(r.signals.map((s) => s.signal)).toEqual(['n', 'trend', 'needsWorkRate', 'gap', 'daysSince', 'hitRatio']);
    expect(r.signals.every((s) => !s.available)).toBe(true);
    expect(sig(r, 'n')).toEqual({ signal: 'n', available: false, value: 0, threshold: 3, contributed: true });
  });

  it('T2 planned only: NOT_TRAINED rule 1; gap available = 1', () => {
    const r = one(VECTORS.T2!);
    expect([r.state, r.rule]).toEqual(['NOT_TRAINED', 1]);
    expect(sig(r, 'gap')).toMatchObject({ available: true, value: 1 });
    expect(sig(r, 'gap').weight).toBeUndefined();
  });

  it('T3 stale: daysSince 61 > 21, outside the window so n = 0; lastTrainedOn kept', () => {
    const r = one(VECTORS.T3!);
    expect([r.state, r.rule, r.n, r.lastTrainedOn]).toEqual(['NOT_TRAINED', 1, 0, '2026-09-01']);
    expect(sig(r, 'daysSince')).toEqual({ signal: 'daysSince', available: true, value: 61, threshold: 21, contributed: true });
  });

  it('T4 flagged once: NEEDS_WORK rule 2, score 1 from needsWorkRate alone (weight 1), flagged', () => {
    const r = one(VECTORS.T4!);
    expect([r.state, r.rule, r.score, r.flagged]).toEqual(['NEEDS_WORK', 2, 1, true]);
    expect(sig(r, 'needsWorkRate')).toEqual({ signal: 'needsWorkRate', available: true, value: 1, weight: 1, contributed: true });
  });

  it('T5 steady: n 1 < 3, score 0 → STEADY rule 4', () => {
    const r = one(VECTORS.T5!);
    expect([r.state, r.rule, r.score, r.n]).toEqual(['STEADY', 4, 0, 1]);
    expect(r.signals.some((s) => s.contributed)).toBe(false);
  });

  it('T6 improving: trend (3+5)/2 − 2 = 2, n 3 → IMPROVING rule 3 (trend and n contributed)', () => {
    const r = one(VECTORS.T6!);
    expect([r.state, r.rule]).toEqual(['IMPROVING', 3]);
    expect(sig(r, 'trend')).toMatchObject({ available: true, value: 2, threshold: 0.5, contributed: true });
    expect(sig(r, 'n')).toMatchObject({ value: 3, contributed: true });
  });

  it('T7 improving blocked by n: trend 3, n 2 < 3 → STEADY', () => {
    const r = one(VECTORS.T7!);
    expect([r.state, sig(r, 'trend').value]).toEqual(['STEADY', 3]);
  });

  it('T8 declining: trend −2.5, score (0.15·0.625)/0.55 ≈ 0.170 → STEADY', () => {
    const r = one(VECTORS.T8!);
    expect(sig(r, 'trend').value).toBe(-2.5);
    expect(r.score).toBeCloseTo(0.1705, 3);
    expect(r.state).toBe('STEADY');
    expect(sig(r, 'needsWorkRate').weight! + sig(r, 'trend').weight!).toBeCloseTo(1, 10);
  });

  it('T9 gap drives: gap 0.8, score ≈ 0.267 → STEADY; wGap 1 → ≈ 0.571 NEEDS_WORK', () => {
    const r = one(VECTORS.T9!);
    expect([r.n, sig(r, 'daysSince').value, sig(r, 'needsWorkRate').value, sig(r, 'gap').value]).toEqual([1, 20, 0, 0.8]);
    expect(r.score).toBeCloseTo(0.2667, 3);
    expect([r.state, r.rule]).toEqual(['STEADY', 4]);
    const r2 = one(VECTORS.T9!, { ...DEFAULTS, wGap: 1 });
    expect(r2.score).toBeCloseTo(0.5714, 3);
    expect([r2.state, r2.rule]).toEqual(['NEEDS_WORK', 2]);
    expect(sig(r2, 'gap').contributed).toBe(true);
  });

  it('T10 hit/caught: ratio 0 over 3 events → ≈ 0.385 STEADY; caught 5 + flagged → 1 NEEDS_WORK', () => {
    const r = one(VECTORS.T10!);
    expect(sig(r, 'hitRatio')).toMatchObject({ available: true, value: 0 });
    expect(r.score).toBeCloseTo(0.3846, 3);
    expect(r.state).toBe('STEADY');
    const r2 = one([row('2026-10-30', { rating: 3, hitCount: 0, caughtCount: 5, needsWork: true })]);
    expect([r2.score, r2.state]).toEqual([1, 'NEEDS_WORK']);
    expect(sig(one([row('2026-10-30', { hitCount: 1, caughtCount: 1 })]), 'hitRatio').available).toBe(false);
  });

  it('T11 window edge: 09-07 is in (windowStart), 09-06 is out', () => {
    expect(one(VECTORS.T11!).n).toBe(1);
  });

  it('T12 same day: ordered by startsAt → trend (2+5)/2 − 2 = 1.5', () => {
    expect(sig(one(VECTORS.T12!), 'trend').value).toBe(1.5);
  });

  it('T13 future row: ignored → T1 result', () => {
    expect(one(VECTORS.T13!)).toEqual(one([]));
  });

  it('T14 removed focus: computed with removed: true', () => {
    const [r] = computeProgression([hist([row('2026-10-30')], { removed: true })], DEFAULTS, CLOCK);
    expect([r!.removed, r!.state]).toEqual([true, 'STEADY']);
  });

  it('T15 param guard: a missing key is PARAM_UNKNOWN; no default is substituted', () => {
    const { wGap: _omit, ...missing } = DEFAULTS;
    expect(() => computeProgression([hist([])], missing, CLOCK)).toThrow(expect.objectContaining({ code: 'PARAM_UNKNOWN', details: { key: 'wGap' } }));
  });

  it('T16 rescale: needsWorkRate 0.5 alone → score 0.5 ≥ threshold → NEEDS_WORK', () => {
    const r = one(VECTORS.T16!);
    expect([r.score, r.state]).toEqual([0.5, 'NEEDS_WORK']);
    expect(sig(r, 'needsWorkRate').weight).toBe(1);
  });

  it('all weights zero: score 0, never NEEDS_WORK; weights shown as 0', () => {
    const zero = { ...DEFAULTS, wNeedsWork: 0, wHitCaught: 0, wGap: 0, wTrend: 0 };
    const r = one(VECTORS.T4!, zero);
    expect([r.score, r.state, sig(r, 'needsWorkRate').weight]).toEqual([0, 'STEADY', 0]);
  });

  it('flagged follows the most recent completed actual row (all time), not the window', () => {
    expect(one([row('2026-10-01', { needsWork: true }), row('2026-10-30')]).flagged).toBe(false);
    expect(one([row('2026-08-01', { needsWork: true })]).flagged).toBe(true);
  });

  it('n = 0 with daysSince ≤ staleDays (staleDays ≥ window) is still rule 1, citing n', () => {
    const r = one([row('2026-10-10')], { ...DEFAULTS, windowWeeks: 2, staleDays: 90 });
    expect([r.rule, r.n, sig(r, 'n').contributed, sig(r, 'daysSince').contributed]).toEqual([1, 0, true, false]);
  });

  it('is deterministic for an injected clock and leaves its input untouched', () => {
    const input = [hist(VECTORS.T12!)];
    const snapshot = JSON.stringify(input);
    expect(computeProgression(input, DEFAULTS, CLOCK)).toEqual(computeProgression(input, DEFAULTS, CLOCK));
    expect(JSON.stringify(input)).toBe(snapshot);
  });

  it('NF-09: 500 sessions × 3 focuses computes well inside the budget (< 100 ms target, asserts < 500 ms)', () => {
    const histories: FocusHistory[] = ['A', 'B', 'C'].map((id, k) => ({
      ref: { kind: 'POSITION', refId: id },
      name: id,
      removed: false,
      rows: Array.from({ length: 500 }, (_, i) => {
        const d = new Date(Date.UTC(2026, 10, 1 - Math.floor(i / 2)));
        const localDate = d.toISOString().slice(0, 10);
        return row(localDate, {
          startsAt: `${localDate}T${String(8 + (i % 2) * 10).padStart(2, '0')}:00:00.000Z`,
          isPlanned: i % 3 === k,
          needsWork: i % 5 === 0,
          rating: ((i + k) % 5) + 1,
          hitCount: i % 4,
          caughtCount: (i + 1) % 3,
        });
      }),
    }));
    computeProgression(histories, DEFAULTS, CLOCK); // warm-up
    const t0 = process.hrtime.bigint();
    computeProgression(histories, DEFAULTS, CLOCK);
    const ms = Number(process.hrtime.bigint() - t0) / 1e6;
    console.log(`NF-09 computeProgression 500 sessions × 3 focuses: ${ms.toFixed(2)} ms`);
    expect(ms).toBeLessThan(500);
  });
});

describe('sortProgressResults (PS-04)', () => {
  it('live before removed; Needs work → Not trained → Steady → Improving; then name', () => {
    const r = (name: string, state: ProgressResult['state'], removed = false) =>
      ({ name, state, removed, ref: { kind: 'POSITION', refId: name } }) as ProgressResult;
    const sorted = sortProgressResults([r('z', 'IMPROVING'), r('b', 'STEADY'), r('a', 'STEADY'), r('x', 'NEEDS_WORK', true), r('c', 'NOT_TRAINED'), r('d', 'NEEDS_WORK')]);
    expect(sorted.map((x) => x.name)).toEqual(['d', 'c', 'a', 'b', 'z', 'x']);
  });
});
