/**
 * @jest-environment node
 */
import { V1_PARAM_DEFAULTS, validateParamValue } from '../progression/v1/params';
import type { ProgressResult } from '../progression/types';
import { diffDays } from '../session/localDate';
import { forPlanning } from '../suggestions/forPlanning';
import { blankToUndefined, normalizeResourceTitle, normalizeResourceUrl } from '../resources/validate';
import { validateSettingValue } from '../settings/defaults';
import { aliasForRename, assertNoParentCycle, requireName, touchesImported, validateTechniqueShape } from '../taxonomy/edit';
import { assertMergeable, foldFocus, joinNotes, movedCounts } from '../taxonomy/merge';

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


describe('taxonomy/edit (plan §7.1–§7.2)', () => {
  it('requireName trims and raises the given code', () => {
    expect(requireName('  Mount ')).toBe('Mount');
    expect(() => requireName(' ')).toThrow(expect.objectContaining({ code: 'TAXONOMY_NAME_REQUIRED' }));
    expect(() => requireName(undefined, 'ALIAS_NAME_REQUIRED')).toThrow(expect.objectContaining({ code: 'ALIAS_NAME_REQUIRED' }));
  });
  it('validateTechniqueShape: target iff not SUBMISSION', () => {
    expect(() => validateTechniqueShape('SWEEP', 'p')).not.toThrow();
    expect(() => validateTechniqueShape('SUBMISSION', null)).not.toThrow();
    expect(() => validateTechniqueShape('SWEEP', undefined)).toThrow(expect.objectContaining({ code: 'TECHNIQUE_TARGET_REQUIRED' }));
    expect(() => validateTechniqueShape('SUBMISSION', 'p')).toThrow(expect.objectContaining({ code: 'TECHNIQUE_SUBMISSION_HAS_TARGET' }));
  });
  it('assertNoParentCycle: self, descendant and over-deep chains are cycles', () => {
    const parents: Record<string, string> = { c: 'b', b: 'a' };
    expect(() => assertNoParentCycle('x', 'c', (id) => parents[id])).not.toThrow();
    expect(() => assertNoParentCycle('a', 'a', (id) => parents[id])).toThrow(expect.objectContaining({ code: 'POSITION_PARENT_CYCLE' }));
    expect(() => assertNoParentCycle('a', 'c', (id) => parents[id])).toThrow(expect.objectContaining({ code: 'POSITION_PARENT_CYCLE' }));
    const deep = (id: string) => `n${Number(id.slice(1)) + 1}`;
    expect(() => assertNoParentCycle('x', 'n0', deep)).toThrow(expect.objectContaining({ code: 'POSITION_PARENT_CYCLE' }));
  });
  it('aliasForRename: old name unless equal (ci), already an alias, or keep = false', () => {
    expect(aliasForRename('Mount', 'High mount', [])).toBe('Mount');
    expect(aliasForRename('Mount', 'MOUNT', [])).toBeUndefined();
    expect(aliasForRename('Mount', 'High mount', ['mount'])).toBeUndefined();
    expect(aliasForRename('Mount', 'High mount', [], false)).toBeUndefined();
  });
  it('touchesImported: only imported fields that change; null ≡ undefined', () => {
    expect(touchesImported('POSITION', { canonicalName: 'A', notes: null }, { notes: 'x' })).toBe(false);
    expect(touchesImported('POSITION', { canonicalName: 'A' }, { canonicalName: 'A' })).toBe(false);
    expect(touchesImported('POSITION', { description: null }, { description: undefined })).toBe(false);
    expect(touchesImported('TECHNIQUE', { appliesTo: 'BOTH' }, { appliesTo: 'GI' })).toBe(true);
    expect(touchesImported('RESOURCE', { status: 'TO_WATCH', url: null }, { status: 'WATCHED' })).toBe(false);
  });
});

describe('taxonomy/merge (plan §7.3)', () => {
  it('assertMergeable: self and submission-ness', () => {
    expect(() => assertMergeable('a', 'a')).toThrow(expect.objectContaining({ code: 'TAXONOMY_SELF_MERGE' }));
    expect(() => assertMergeable('a', 'b', { from: 'SUBMISSION', into: 'SWEEP' })).toThrow(expect.objectContaining({ code: 'TAXONOMY_MERGE_KIND_MISMATCH' }));
    expect(() => assertMergeable('a', 'b', { from: 'SWEEP', into: 'ESCAPE' })).not.toThrow();
  });
  it('foldFocus: OR booleans, survivor rating else loser, counts summed (null + null = null), comments joined', () => {
    const base = { isPlanned: false, isActual: true, needsWork: false, rating: null, comment: null, hitCount: null, caughtCount: null };
    expect(foldFocus({ ...base, rating: 3, hitCount: 1 }, { ...base, isPlanned: true, needsWork: true, rating: 5, hitCount: 2, comment: 'L' })).toEqual({
      isPlanned: true, isActual: true, needsWork: true, rating: 3, comment: 'L', hitCount: 3, caughtCount: null,
    });
    expect(foldFocus(base, { ...base, rating: 4 }).rating).toBe(4);
    expect(joinNotes('a', ' b ')).toBe('a / b');
    expect(joinNotes(' ', null)).toBeNull();
  });
  it('movedCounts groups by table', () => {
    expect(movedCounts([{ table: 'a', id: '1', column: 'c', from: 'x' }, { table: 'a', id: '2', column: 'c', from: 'x' }, { table: 'b', id: '3', column: 'c', from: 'x' }])).toEqual({ a: 2, b: 1 });
  });
});

describe('resources/validate (plan §8.1)', () => {
  it.each(['https://example.org', 'http://example.org/a?b=c#d', 'https://user@example.org:8080/x', 'HTTPS://EXAMPLE.ORG'])('accepts %s', (url) => {
    expect(normalizeResourceUrl(` ${url} `)).toBe(url);
  });
  it.each(['ftp://example.org', 'javascript:alert(1)', 'https://', 'example.org', 'https://exa mple.org', 'mailto:a@b.c'])('rejects %s', (url) => {
    expect(() => normalizeResourceUrl(url)).toThrow(expect.objectContaining({ code: 'RESOURCE_URL_INVALID' }));
  });
  it('blank URL → undefined; title required; blank text → undefined', () => {
    expect(normalizeResourceUrl('  ')).toBeUndefined();
    expect(normalizeResourceUrl(null)).toBeUndefined();
    expect(normalizeResourceTitle(' T ')).toBe('T');
    expect(() => normalizeResourceTitle('')).toThrow(expect.objectContaining({ code: 'RESOURCE_TITLE_REQUIRED' }));
    expect(blankToUndefined('  ')).toBeUndefined();
  });
});

describe('settings vocabularies (PS-08)', () => {
  it('validateSettingValue raises SETTING_VALUE_INVALID outside the vocabulary or range', () => {
    expect(validateSettingValue('theme.override', 'LIGHT')).toBe('LIGHT');
    expect(() => validateSettingValue('theme.override', 'light')).toThrow(expect.objectContaining({ code: 'SETTING_VALUE_INVALID' }));
    expect(() => validateSettingValue('suggest.max', 11)).toThrow(expect.objectContaining({ code: 'SETTING_VALUE_INVALID', details: { key: 'suggest.max', min: 0, max: 10 } }));
    expect(() => validateSettingValue('rank.scale', 3)).toThrow(expect.objectContaining({ code: 'SETTING_TYPE_MISMATCH' }));
  });
});
