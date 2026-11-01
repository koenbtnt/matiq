import { buildSessions } from '../../../__mocks__/fixtures';
import {
  blankDraft, canSave, defaultWhen, draftFromSession, isDirty, quickAddGroups, reducer, toLogInput, toPlanInput,
  type LogDraft,
} from '../state';

const add = (d: LogDraft, refId: string, actual = true): LogDraft => reducer(d, { type: 'addFocus', kind: 'POSITION', refId, name: refId, actual });

describe('log draft', () => {
  it('log/edit need a type and a trained focus; plan needs any focus', () => {
    let d = blankDraft('log', 'st-gi');
    expect(canSave(d)).toBe(false);
    d = add(d, 'pos-mount');
    expect(canSave(d)).toBe(true);
    d = reducer(d, { type: 'toggleTrained', refId: 'pos-mount' });
    expect(canSave(d)).toBe(false);
    expect(canSave(add(blankDraft('plan', 'st-gi'), 'pos-mount'))).toBe(true);
    expect(canSave(add(blankDraft('log', undefined), 'pos-mount'))).toBe(false);
  });

  it('does not add the same focus twice', () => {
    const d = add(add(blankDraft('log', 'st-gi'), 'a'), 'a');
    expect(d.focuses).toHaveLength(1);
  });

  it('sends body values only while the row is actual (cannot trip *_REQUIRES_ACTUAL)', () => {
    let d = add(blankDraft('log', 'st-gi'), 'a');
    d = reducer(d, { type: 'focusPatch', refId: 'a', patch: { rating: 4, needsWork: true, hitCount: 2, comment: ' hi ' } });
    d = reducer(d, { type: 'attachTechnique', refId: 'a', technique: { id: 't1', name: 'T' } });
    expect(toLogInput(d, 'UTC').focuses[0]).toMatchObject({ isActual: true, rating: 4, needsWork: true, hitCount: 2, comment: 'hi', techniqueIds: ['t1'] });
    d = reducer(d, { type: 'toggleTrained', refId: 'a' });
    expect(toLogInput(d, 'UTC').focuses[0]).toEqual({ kind: 'POSITION', refId: 'a', isPlanned: false, isActual: false });
  });

  it('untouched optional numbers stay undefined (D-A7)', () => {
    const input = toLogInput(add(blankDraft('log', 'st-gi'), 'a'), 'UTC');
    expect(input.durationMinutes).toBeUndefined();
    expect(input.aggregates).toEqual({ roundsCount: undefined, submissionsLanded: undefined, submissionsTaken: undefined });
  });

  it('plan input carries refs only', () => {
    const d = add(blankDraft('plan', 'st-gi'), 'a');
    expect(toPlanInput(d, 'UTC').focuses).toEqual([{ kind: 'POSITION', refId: 'a' }]);
  });

  it('a planned session pre-ticks its planned rows when logged', () => {
    const planned = buildSessions(new Date()).find((s) => s.id === 'ses-today')!;
    expect(draftFromSession(planned, 'log').focuses.every((f) => f.planned && f.actual)).toBe(true);
    expect(draftFromSession(planned, 'plan').focuses.every((f) => !f.actual)).toBe(true);
  });

  it('plan mode defaults to the next full hour (D-A8)', () => {
    const w = defaultWhen('plan', new Date(2026, 10, 1, 23, 20));
    expect(w.getHours()).toBe(0);
    expect(w.getDate()).toBe(2);
    expect(defaultWhen('log', new Date(2026, 10, 1, 9, 5)).getMinutes()).toBe(5);
  });

  it('quick-add: flagged first, then the rest, at most 6, added excluded', () => {
    const last = buildSessions(new Date()).find((s) => s.id === 'ses-last')!;
    const home = { lastCompleted: last } as never;
    const g = quickAddGroups(home, new Set());
    expect(g.flagged.map((r) => r.refId)).toEqual(['pos-half']);
    expect(g.last.map((r) => r.refId)).toEqual(['pos-mount']);
    expect(quickAddGroups(home, new Set(['pos-half'])).flagged).toHaveLength(0);
    expect(quickAddGroups(undefined, new Set())).toEqual({ flagged: [], last: [] });
  });

  it('detects dirtiness', () => {
    const a = blankDraft('log', 'st-gi', new Date(0));
    expect(isDirty(a, a)).toBe(false);
    expect(isDirty(reducer(a, { type: 'setText', field: 'whatWorked', value: 'x' }), a)).toBe(true);
  });
});
