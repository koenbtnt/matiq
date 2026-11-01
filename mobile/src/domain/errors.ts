/**
 * The one registry of business-rule error codes. The UI maps each code to the i18n key
 * `errors.<CODE>`; `UNKNOWN` is the fallback for anything that is not a DomainError.
 */
export const ERROR_CODES = [
  // sessions
  'SESSION_TYPE_REQUIRED',
  'SESSION_TYPE_NOT_FOUND',
  'SESSION_NOT_FOUND',
  'SESSION_NOT_PLANNED',
  'SESSION_START_INVALID',
  'SESSION_NEEDS_ACTUAL_FOCUS',
  // focuses
  'FOCUS_REQUIRED',
  'FOCUS_REF_NOT_FOUND',
  'FOCUS_KIND_INVALID',
  'FOCUS_DUPLICATE',
  'NEEDS_WORK_REQUIRES_ACTUAL',
  'RATING_REQUIRES_ACTUAL',
  'COUNTS_REQUIRE_ACTUAL',
  'TECHNIQUE_REQUIRES_ACTUAL',
  // values
  'RATING_OUT_OF_RANGE',
  'SCALE_OUT_OF_RANGE',
  'DURATION_INVALID',
  'COUNT_NEGATIVE',
  // techniques, rounds, submissions
  'TECHNIQUE_NOT_FOUND',
  'ROUND_NO_DUPLICATE',
  'ROUND_NO_INVALID',
  'ROUND_NOT_IN_SESSION',
  'SUBMISSION_DIRECTION_INVALID',
  // taxonomy and seed
  'TAXONOMY_ROW_NOT_FOUND',
  'SEED_FORMAT_UNSUPPORTED',
  'SEED_RELEASE_OLDER',
  // settings
  'SETTING_UNKNOWN',
  'SETTING_TYPE_MISMATCH',
  // rank
  'RANK_BELT_INVALID_FOR_SCALE',
  'RANK_STRIPES_INVALID',
  'RANK_DATE_INVALID',
  // database lifecycle
  'DB_NOT_OPEN',
  'DB_KEY_UNAVAILABLE',
  'DB_KEY_MISSING_FOR_EXISTING_DB',
  'DB_KEY_REJECTED',
  'DB_MIGRATION_FAILED',
  'DB_SEED_FAILED',
  'DB_RESET_FAILED',
  // fallback
  'UNKNOWN',
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export class DomainError extends Error {
  /**
   * @param code registry code
   * @param details structured, non-sensitive context for callers (e.g. the offending focus ref);
   *   never key material or free text from the user.
   */
  constructor(
    public readonly code: ErrorCode,
    public readonly details?: Readonly<Record<string, string | number>>,
  ) {
    super(code);
    this.name = 'DomainError';
  }
}

export const isDomainError = (e: unknown): e is DomainError => e instanceof DomainError;

/** Normalises anything thrown into a DomainError (`UNKNOWN` for non-domain errors). */
export const toDomainError = (e: unknown): DomainError => (isDomainError(e) ? e : new DomainError('UNKNOWN'));
