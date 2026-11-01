/**
 * @jest-environment node
 */
import { V1_PARAM_DEFAULTS, validateParamValue } from '../progression/v1/params';
import type { ProgressResult } from '../progression/types';
import { diffDays } from '../session/localDate';
import { forPlanning } from '../suggestions/forPlanning';

describe('diffDays (plan §6.6, N7)', () => {
  it('counts whole calendar days to − from, across months, years and DST changes', () => {
    expect(diffDays('2026-09-01', '2026-11-01')).toBe(61);
    expect(diffDays('2026-11-01', '2026-09-01')).toBe(-61);
    expect(diffDays('2026-10-24', '2026-10-26')).toBe(2); // EU DST ends 10-25
    expect(diffDays('2026-03-28', '2026-03-30')).toBe(2); // EU DST starts 03-29
    expect(diffDays('2025-12-31', '2026-01-01')).toBe(1);
    expect(diffDays('2028-02-28', '2028-03-01')).toBe(2);
    expect(diffDays('2026-11-01', '2026-11-01')).toBe(0);
  });
  it('rejects a malformed date', () => {
    expect(() => diffDays('2026-11', '2026-11-01')).toThrow(expect.objectContaining({ code: 'SESSION_START_INVALID' }));
  });
});

describe('validateParamValue (PS-07)', () => {
  const row = (key: string, min: number, max: number) => ({ key, min, max });
  it('integer keys reject fractions; bounds come from the row; boundaries are inclusive', () => {
    expect(V1_PARAM_DEFAULTS.filter((p) => p.integer).map((p) => p.key)).toEqual(['windowWeeks', 'staleDays', 'minSessions', 'hitCaughtMinEvents']);
    expect(() => validateParamValue(row('windowWeeks', 2, 26), 8.5)).toThrow(expect.objectContaining({ code: 'PARAM_NOT_INTEGER' }));
    expect(validateParamValue(row('windowWeeks', 2, 26), 26)).toBe(26);
    expect(validateParamValue(row('wGap', 0, 1), 0)).toBe(0);
    expect(validateParamValue(row('wGap', 0, 1), 0.33)).toBe(0.33);
    expect(() => validateParamValue(row('wGap', 0, 1), 1.5)).toThrow(expect.objectContaining({ code: 'PARAM_OUT_OF_RANGE', details: { key: 'wGap', min: 0, max: 1 } }));
    expect(() => validateParamValue(row('wGap', 0.2, 0.3), 0.1)).toThrow(expect.objectContaining({ code: 'PARAM_OUT_OF_RANGE' }));
    expect(() => validateParamValue(row('wGap', 0, 1), Number.NaN)).toThrow(expect.objectContaining({ code: 'PARAM_OUT_OF_RANGE' }));
  });
});

describe('forPlanning with algorithm states (PS-06)', () => {
  const settings = { 'suggest.lastNeedsWork': true, 'suggest.cycle': true, 'suggest.needsWork': true, 'suggest.notTrainedLately': true, 'suggest.max': 10 };
  const st = (refId: string, state: ProgressResult['state'], over: Partial<ProgressResult> & { daysSince?: number } = {}): ProgressResult => {
    const { daysSince, ...rest } = over;
    return {
      ref: { kind: 'POSITION', refId },
      name: refId,
      removed: false,
      state,
      rule: 1,
      flagged: false,
      n: 0,
      signals: daysSince === undefined ? [] : [{ signal: 'daysSince', available: true, value: daysSince, contributed: true }],
      ...rest,
    };
  };
  const last = { focuses: [{ kind: 'POSITION' as const, refId: 'L', name: 'L', isActual: true, needsWork: true, removed: false, sortOrder: 0 }] };
  const states = [
    st('nw-low', 'NEEDS_WORK', { score: 0.6 }),
    st('nw-high', 'NEEDS_WORK', { score: 0.9 }),
    st('L', 'NEEDS_WORK', { score: 1 }),
    st('stale-30', 'NOT_TRAINED', { lastTrainedOn: '2026-10-02', daysSince: 30 }),
    st('stale-60', 'NOT_TRAINED', { lastTrainedOn: '2026-09-02', daysSince: 60 }),
    st('never', 'NOT_TRAINED'),
    st('gone', 'NEEDS_WORK', { score: 1, removed: true }),
    st('ok', 'STEADY'),
  ];

  it('orders LAST_NEEDS_WORK → NEEDS_WORK by score → NOT_TRAINED by daysSince; dedupes; skips never-trained and removed', () => {
    expect(forPlanning({ settings, lastCompleted: last, states }).map((s) => `${s.source}:${s.ref.refId}`)).toEqual([
      'LAST_NEEDS_WORK:L',
      'NEEDS_WORK:nw-high',
      'NEEDS_WORK:nw-low',
      'NOT_TRAINED:stale-60',
      'NOT_TRAINED:stale-30',
    ]);
  });

  it('honours each switch and suggest.max', () => {
    expect(forPlanning({ settings: { ...settings, 'suggest.needsWork': false }, states }).map((s) => s.source)).toEqual(['NOT_TRAINED', 'NOT_TRAINED']);
    expect(forPlanning({ settings: { ...settings, 'suggest.notTrainedLately': false }, states }).map((s) => s.ref.refId)).toEqual(['L', 'nw-high', 'nw-low']);
    expect(forPlanning({ settings: { ...settings, 'suggest.max': 3 }, lastCompleted: last, states })).toHaveLength(3);
  });
});
