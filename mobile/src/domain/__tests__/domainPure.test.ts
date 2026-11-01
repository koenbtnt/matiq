/**
 * @jest-environment node
 */
import { deriveAggregates } from '../rounds/aggregates';
import { currentOf, validateRank } from '../rank/validate';
import { partitionPlanned } from '../session/home';
import { quickLogTarget } from '../session/quickLog';
import { defaultSettings, SETTING_KEYS, validateSettingValue } from '../settings/defaults';
import { forPlanning } from '../suggestions/forPlanning';
import { V1_PARAM_DEFAULTS } from '../progression/v1/params';

describe('partitionPlanned (A-19, R1-04)', () => {
  const s = (id: string, localDate: string, startsAt: string) => ({ id, localDate, startsAt });
  const today = '2026-03-03';
  const yesterdayLate = s('a', '2026-03-02', '2026-03-02T22:30:00.000Z');
  const todayEarly = s('b', '2026-03-03', '2026-03-02T23:30:00.000Z');
  const todayLate = s('c', '2026-03-03', '2026-03-03T18:00:00.000Z');
  const tomorrow = s('d', '2026-03-04', '2026-03-04T18:00:00.000Z');

  it('last night’s plan is stale the next morning; today’s earliest is next', () => {
    const p = partitionPlanned([tomorrow, todayLate, yesterdayLate, todayEarly], today);
    expect(p.stalePlanned.map((x) => x.id)).toEqual(['a']);
    expect(p.todayPlanned.map((x) => x.id)).toEqual(['b', 'c']);
    expect(p.nextPlanned?.id).toBe('b');
  });

  it('next is the earliest future one when nothing is planned today', () => {
    expect(partitionPlanned([tomorrow, yesterdayLate], today).nextPlanned?.id).toBe('d');
    expect(partitionPlanned([yesterdayLate], today).nextPlanned).toBeUndefined();
  });
});

describe('quickLogTarget', () => {
  const types = [{ id: 'nogi', sortOrder: 2 }, { id: 'gi', sortOrder: 1 }];
  it('exactly one planned today ⇒ that session', () => {
    expect(quickLogTarget({ todayPlanned: [{ id: 's1' }], lastUsedTypeId: 'nogi' }, types)).toEqual({ sessionId: 's1' });
  });
  it('two planned today ⇒ new session with the last-used type', () => {
    expect(quickLogTarget({ todayPlanned: [{ id: 's1' }, { id: 's2' }], lastUsedTypeId: 'nogi' }, types)).toEqual({ sessionTypeId: 'nogi', focuses: [] });
  });
  it('no history ⇒ first type by sort order', () => {
    expect(quickLogTarget({ todayPlanned: [] }, types)).toEqual({ sessionTypeId: 'gi', focuses: [] });
    expect(() => quickLogTarget({ todayPlanned: [] })).toThrow('SESSION_TYPE_REQUIRED');
  });
});

describe('forPlanning (A-30)', () => {
  const settings = { 'suggest.lastNeedsWork': true, 'suggest.cycle': true, 'suggest.needsWork': true, 'suggest.notTrainedLately': true, 'suggest.max': 2 };
  const f = (refId: string, over: object = {}) => ({ kind: 'POSITION' as const, refId, name: refId, isActual: true, needsWork: true, removed: false, sortOrder: 0, ...over });
  it('yields flagged, actual, not-removed focuses of the last session, capped by suggest.max', () => {
    const lastCompleted = { focuses: [f('c', { sortOrder: 2 }), f('a'), f('x', { needsWork: false }), f('r', { removed: true }), f('b', { sortOrder: 1 })] };
    expect(forPlanning({ settings, lastCompleted }).map((s) => [s.ref.refId, s.source])).toEqual([
      ['a', 'LAST_NEEDS_WORK'],
      ['b', 'LAST_NEEDS_WORK'],
    ]);
  });
  it('is empty when the source is switched off or there is no session', () => {
    expect(forPlanning({ settings: { ...settings, 'suggest.lastNeedsWork': false }, lastCompleted: { focuses: [f('a')] } })).toEqual([]);
    expect(forPlanning({ settings })).toEqual([]);
    expect(forPlanning({ settings: { ...settings, 'suggest.max': 0 }, lastCompleted: { focuses: [f('a')] } })).toEqual([]);
  });
});

describe('validateRank', () => {
  const ok = { scale: 'ADULT', belt: 'BLUE', stripes: 2, awardedOn: '2026-01-10' };
  it('accepts valid ranks', () => {
    expect(() => validateRank(ok, '2026-03-02')).not.toThrow();
    expect(() => validateRank({ ...ok, belt: 'BLACK', stripes: 6 }, '2026-03-02')).not.toThrow();
    expect(() => validateRank({ ...ok, scale: 'KIDS', belt: 'GREY_WHITE', stripes: 4 }, '2026-03-02')).not.toThrow();
    expect(() => validateRank({ ...ok, awardedOn: '2026-03-02' }, '2026-03-02')).not.toThrow();
  });
  it.each<[string, object]>([
    ['RANK_BELT_INVALID_FOR_SCALE', { belt: 'GREY' }],
    ['RANK_BELT_INVALID_FOR_SCALE', { scale: 'KIDS', belt: 'BLUE' }],
    ['RANK_STRIPES_INVALID', { stripes: 5 }],
    ['RANK_STRIPES_INVALID', { stripes: -1 }],
    ['RANK_STRIPES_INVALID', { belt: 'BLACK', stripes: 7 }],
    ['RANK_DATE_INVALID', { awardedOn: '2026-03-03' }],
    ['RANK_DATE_INVALID', { awardedOn: '2026-02-30' }],
  ])('%s', (code, over) => {
    expect(() => validateRank({ ...ok, ...over }, '2026-03-02')).toThrow(code);
  });
  it('current = latest awardedOn, then latest createdAt', () => {
    const e = (id: string, awardedOn: string, createdAt: string) => ({ id, awardedOn, createdAt });
    expect(currentOf([e('a', '2025-01-01', '3'), e('b', '2026-01-01', '1'), e('c', '2026-01-01', '2')])?.id).toBe('c');
    expect(currentOf([])).toBeUndefined();
  });
});

describe('settings defaults (product-spec §4.2)', () => {
  it('has the 14 keys with typed defaults', () => {
    expect(SETTING_KEYS).toHaveLength(14);
    expect(defaultSettings()['library.showExtended']).toBe(false);
    expect(defaultSettings()['suggest.max']).toBe(3);
  });
  it('type-checks values', () => {
    expect(validateSettingValue('suggest.max', 4)).toBe(4);
    expect(() => validateSettingValue('suggest.max', '4')).toThrow('SETTING_TYPE_MISMATCH');
    expect(() => validateSettingValue('suggest.max', 1.5)).toThrow('SETTING_TYPE_MISMATCH');
    expect(() => validateSettingValue('nope', true)).toThrow('SETTING_UNKNOWN');
  });
});

describe('algorithm params v1 (product-spec §4.3)', () => {
  it('has 10 rows, each default inside its bounds', () => {
    expect(V1_PARAM_DEFAULTS).toHaveLength(10);
    for (const p of V1_PARAM_DEFAULTS) expect(p.min <= p.defaultValue && p.defaultValue <= p.max).toBe(true);
  });
});

describe('deriveAggregates', () => {
  it('counts rounds and submissions by direction', () => {
    expect(
      deriveAggregates([{ submissions: [{ direction: 'LANDED' }, { direction: 'TAKEN' }] }, {}], [{ direction: 'LANDED' }]),
    ).toEqual({ roundsCount: 2, submissionsLanded: 2, submissionsTaken: 1 });
  });
});
