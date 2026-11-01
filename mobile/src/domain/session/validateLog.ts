import { DomainError } from '../errors';
import { isIsoUtc } from './localDate';

/** Structural inputs (mirror of the repository contracts; the domain does not import them). */
export type FocusKindIn = string;
export type FocusIn = {
  kind: FocusKindIn;
  refId: string;
  isPlanned: boolean;
  isActual: boolean;
  needsWork?: boolean;
  rating?: number;
  comment?: string;
  hitCount?: number;
  caughtCount?: number;
  techniqueIds?: string[];
};
export type SubmissionIn = { direction: string; techniqueId?: string; roundId?: string };
export type RoundIn = { id?: string; roundNo: number; durationMinutes?: number; submissions?: SubmissionIn[] };
export type LogIn = {
  sessionTypeId: string;
  startsAt: string;
  durationMinutes?: number;
  rating?: number;
  intensity?: number;
  energy?: number;
  focuses: FocusIn[];
  aggregates?: { roundsCount?: number; submissionsLanded?: number; submissionsTaken?: number };
  submissions?: SubmissionIn[];
  rounds?: RoundIn[];
};
export type PlanIn = { sessionTypeId: string; startsAt: string; focuses: { kind: FocusKindIn; refId: string }[] };

const FOCUS_KINDS: readonly string[] = ['POSITION', 'SUBJECT'];
const DIRECTIONS: readonly string[] = ['LANDED', 'TAKEN'];

const isInt = (n: unknown): n is number => typeof n === 'number' && Number.isInteger(n);

function checkScale(value: number | undefined, code: 'RATING_OUT_OF_RANGE' | 'SCALE_OUT_OF_RANGE') {
  if (value !== undefined && !(isInt(value) && value >= 1 && value <= 5)) throw new DomainError(code);
}

function checkCount(value: number | undefined) {
  if (value !== undefined && !(isInt(value) && value >= 0)) throw new DomainError('COUNT_NEGATIVE');
}

function checkDuration(value: number | undefined) {
  if (value !== undefined && !(isInt(value) && value > 0)) throw new DomainError('DURATION_INVALID');
}

function checkRefs(focuses: readonly { kind: string; refId: string }[]) {
  const seen = new Set<string>();
  for (const f of focuses) {
    if (!FOCUS_KINDS.includes(f.kind)) throw new DomainError('FOCUS_KIND_INVALID');
    const key = `${f.kind}:${f.refId}`;
    if (seen.has(key)) throw new DomainError('FOCUS_DUPLICATE', { refId: f.refId });
    seen.add(key);
  }
}

function checkHeader(input: { sessionTypeId: string; startsAt: string }) {
  if (!input.sessionTypeId) throw new DomainError('SESSION_TYPE_REQUIRED');
  if (!isIsoUtc(input.startsAt)) throw new DomainError('SESSION_START_INVALID');
}

/** Plan mode (status PLANNED): type, a valid start and ≥ 1 distinct focus. */
export function validatePlan(input: PlanIn): void {
  checkHeader(input);
  if (input.focuses.length === 0) throw new DomainError('FOCUS_REQUIRED');
  checkRefs(input.focuses);
}

/**
 * Log mode (→ COMPLETED). Every structural rule of plan §4 `sessions.log` in a fixed order; the
 * repository adds the existence checks (type, refs, techniques, rounds). NF-03: a type plus one
 * actual focus is a valid log.
 */
export function validateLog(input: LogIn): void {
  checkHeader(input);
  if (input.focuses.length === 0) throw new DomainError('FOCUS_REQUIRED');
  checkRefs(input.focuses);

  for (const f of input.focuses) {
    if (!f.isPlanned && !f.isActual) throw new DomainError('FOCUS_REQUIRED', { refId: f.refId });
    if (!f.isActual) {
      if (f.needsWork) throw new DomainError('NEEDS_WORK_REQUIRES_ACTUAL', { refId: f.refId });
      if (f.rating !== undefined) throw new DomainError('RATING_REQUIRES_ACTUAL', { refId: f.refId });
      if (f.hitCount !== undefined || f.caughtCount !== undefined)
        throw new DomainError('COUNTS_REQUIRE_ACTUAL', { refId: f.refId });
      if (f.techniqueIds && f.techniqueIds.length > 0)
        throw new DomainError('TECHNIQUE_REQUIRES_ACTUAL', { refId: f.refId });
    }
    checkScale(f.rating, 'RATING_OUT_OF_RANGE');
    checkCount(f.hitCount);
    checkCount(f.caughtCount);
  }
  if (!input.focuses.some((f) => f.isActual)) throw new DomainError('SESSION_NEEDS_ACTUAL_FOCUS');

  checkScale(input.rating, 'RATING_OUT_OF_RANGE');
  checkScale(input.intensity, 'SCALE_OUT_OF_RANGE');
  checkScale(input.energy, 'SCALE_OUT_OF_RANGE');
  checkDuration(input.durationMinutes);
  checkCount(input.aggregates?.roundsCount);
  checkCount(input.aggregates?.submissionsLanded);
  checkCount(input.aggregates?.submissionsTaken);

  const roundNos = new Set<number>();
  for (const r of input.rounds ?? []) {
    if (!isInt(r.roundNo) || r.roundNo < 1) throw new DomainError('ROUND_NO_INVALID');
    if (roundNos.has(r.roundNo)) throw new DomainError('ROUND_NO_DUPLICATE', { roundNo: r.roundNo });
    roundNos.add(r.roundNo);
    checkDuration(r.durationMinutes);
    for (const s of r.submissions ?? []) checkDirection(s.direction);
  }
  for (const s of input.submissions ?? []) checkDirection(s.direction);
}

function checkDirection(direction: string) {
  if (!DIRECTIONS.includes(direction)) throw new DomainError('SUBMISSION_DIRECTION_INVALID');
}

/** True when an edit of a COMPLETED session touches the review fields (sets `reviewed_at`, A-12). */
export function touchesReview(
  before: { rating?: number | null; whatWorked?: string | null; whatFailed?: string | null },
  after: { rating?: number; whatWorked?: string; whatFailed?: string },
): boolean {
  const norm = (v: unknown) => (v === undefined || v === '' ? null : v);
  return (
    norm(before.rating) !== norm(after.rating) ||
    norm(before.whatWorked) !== norm(after.whatWorked) ||
    norm(before.whatFailed) !== norm(after.whatFailed)
  );
}
