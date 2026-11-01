/**
 * @jest-environment node
 */
import { touchesReview, validateLog, validatePlan, type FocusIn, type LogIn } from '../session/validateLog';

const focus = (over: Partial<FocusIn> = {}): FocusIn => ({ kind: 'POSITION', refId: 'p1', isPlanned: false, isActual: true, ...over });
const log = (over: Partial<LogIn> = {}): LogIn => ({
  sessionTypeId: 't1',
  startsAt: '2026-03-02T18:00:00.000Z',
  focuses: [focus()],
  ...over,
});

describe('validateLog', () => {
  it('NF-03: a type plus one actual focus is valid', () => {
    expect(() => validateLog(log())).not.toThrow();
  });

  it.each<[string, Partial<LogIn>]>([
    ['SESSION_TYPE_REQUIRED', { sessionTypeId: '' }],
    ['SESSION_START_INVALID', { startsAt: 'yesterday' }],
    ['FOCUS_REQUIRED', { focuses: [] }],
    ['FOCUS_KIND_INVALID', { focuses: [focus({ kind: 'TECHNIQUE' })] }],
    ['FOCUS_DUPLICATE', { focuses: [focus(), focus({ rating: 3 })] }],
    ['NEEDS_WORK_REQUIRES_ACTUAL', { focuses: [focus(), focus({ refId: 'p2', isPlanned: true, isActual: false, needsWork: true })] }],
    ['RATING_REQUIRES_ACTUAL', { focuses: [focus(), focus({ refId: 'p2', isPlanned: true, isActual: false, rating: 4 })] }],
    ['COUNTS_REQUIRE_ACTUAL', { focuses: [focus(), focus({ refId: 'p2', isPlanned: true, isActual: false, hitCount: 1 })] }],
    ['TECHNIQUE_REQUIRES_ACTUAL', { focuses: [focus(), focus({ refId: 'p2', isPlanned: true, isActual: false, techniqueIds: ['t'] })] }],
    ['RATING_OUT_OF_RANGE', { focuses: [focus({ rating: 6 })] }],
    ['COUNT_NEGATIVE', { focuses: [focus({ caughtCount: -1 })] }],
    ['SESSION_NEEDS_ACTUAL_FOCUS', { focuses: [focus({ isPlanned: true, isActual: false })] }],
    ['RATING_OUT_OF_RANGE', { rating: 0 }],
    ['SCALE_OUT_OF_RANGE', { intensity: 6 }],
    ['SCALE_OUT_OF_RANGE', { energy: 2.5 }],
    ['DURATION_INVALID', { durationMinutes: 0 }],
    ['COUNT_NEGATIVE', { aggregates: { submissionsTaken: -2 } }],
    ['ROUND_NO_INVALID', { rounds: [{ roundNo: 0 }] }],
    ['ROUND_NO_DUPLICATE', { rounds: [{ roundNo: 1 }, { roundNo: 1 }] }],
    ['DURATION_INVALID', { rounds: [{ roundNo: 1, durationMinutes: -1 }] }],
    ['SUBMISSION_DIRECTION_INVALID', { submissions: [{ direction: 'GIVEN' }] }],
    ['SUBMISSION_DIRECTION_INVALID', { rounds: [{ roundNo: 1, submissions: [{ direction: 'X' }] }] }],
  ])('%s', (code, over) => {
    expect(() => validateLog(log(over))).toThrow(code);
  });

  it('accepts a planned-not-trained row next to an actual one (F-20)', () => {
    expect(() => validateLog(log({ focuses: [focus(), focus({ refId: 'p2', isPlanned: true, isActual: false })] }))).not.toThrow();
  });

  it('accepts boundary values', () => {
    expect(() =>
      validateLog(log({ rating: 5, intensity: 1, energy: 5, durationMinutes: 1, aggregates: { roundsCount: 0 }, focuses: [focus({ rating: 1, hitCount: 0 })] })),
    ).not.toThrow();
  });
});

describe('validatePlan', () => {
  it('needs a type, a start and ≥ 1 distinct focus', () => {
    const plan = { sessionTypeId: 't', startsAt: '2026-03-02T18:00:00Z', focuses: [{ kind: 'SUBJECT', refId: 's' }] };
    expect(() => validatePlan(plan)).not.toThrow();
    expect(() => validatePlan({ ...plan, focuses: [] })).toThrow('FOCUS_REQUIRED');
    expect(() => validatePlan({ ...plan, sessionTypeId: '' })).toThrow('SESSION_TYPE_REQUIRED');
    expect(() => validatePlan({ ...plan, focuses: [plan.focuses[0]!, plan.focuses[0]!] })).toThrow('FOCUS_DUPLICATE');
  });
});

describe('touchesReview', () => {
  it('is true only when rating / whatWorked / whatFailed change', () => {
    expect(touchesReview({ rating: 3, whatWorked: null, whatFailed: null }, { rating: 3 })).toBe(false);
    expect(touchesReview({ rating: 3 }, { rating: 4 })).toBe(true);
    expect(touchesReview({ whatWorked: null }, { whatWorked: 'Frames' })).toBe(true);
    expect(touchesReview({ whatFailed: 'x' }, { whatFailed: '' })).toBe(true);
  });
});
