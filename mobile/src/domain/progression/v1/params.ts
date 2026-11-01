import { DomainError } from '../../errors';

/**
 * Progression algorithm v1 parameter defaults and bounds (product-spec §4.3). These seed the
 * `algorithm_params` rows; the algorithm reads the rows, never these constants. `integer` is a
 * property of the key (PS-07), not a tunable.
 */
export const ALGORITHM_VERSION_V1 = 'v1';

export type ParamDefault = { key: string; defaultValue: number; min: number; max: number; integer?: true };

export const V1_PARAM_DEFAULTS: readonly ParamDefault[] = [
  { key: 'windowWeeks', defaultValue: 8, min: 2, max: 26, integer: true },
  { key: 'staleDays', defaultValue: 21, min: 7, max: 90, integer: true },
  { key: 'minSessions', defaultValue: 3, min: 2, max: 10, integer: true },
  { key: 'trendImproving', defaultValue: 0.5, min: 0.1, max: 2 },
  { key: 'needsWorkThreshold', defaultValue: 0.5, min: 0.1, max: 1 },
  { key: 'wNeedsWork', defaultValue: 0.4, min: 0, max: 1 },
  { key: 'wHitCaught', defaultValue: 0.25, min: 0, max: 1 },
  { key: 'wGap', defaultValue: 0.2, min: 0, max: 1 },
  { key: 'wTrend', defaultValue: 0.15, min: 0, max: 1 },
  { key: 'hitCaughtMinEvents', defaultValue: 3, min: 1, max: 20, integer: true },
];

export const V1_PARAM_KEYS = V1_PARAM_DEFAULTS.map((p) => p.key);
const INTEGER_KEYS = new Set(V1_PARAM_DEFAULTS.filter((p) => p.integer).map((p) => p.key));

export type V1Params = {
  windowWeeks: number;
  staleDays: number;
  minSessions: number;
  trendImproving: number;
  needsWorkThreshold: number;
  wNeedsWork: number;
  wHitCaught: number;
  wGap: number;
  wTrend: number;
  hitCaughtMinEvents: number;
};

/** Narrows a params record to v1; a missing key is PARAM_UNKNOWN (the domain never substitutes a default, §6.1). */
export function requireV1Params(params: Readonly<Record<string, number>>): V1Params {
  for (const key of V1_PARAM_KEYS) {
    const v = params[key];
    if (typeof v !== 'number' || !Number.isFinite(v)) throw new DomainError('PARAM_UNKNOWN', { key });
  }
  return params as unknown as V1Params;
}

/**
 * Validates a parameter write against its stored row (PS-07): bounds come from the row, never
 * from the defaults table. Throws PARAM_NOT_INTEGER / PARAM_OUT_OF_RANGE (details min/max).
 */
export function validateParamValue(row: { key: string; min: number; max: number }, value: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new DomainError('PARAM_OUT_OF_RANGE', { key: row.key, min: row.min, max: row.max });
  if (INTEGER_KEYS.has(row.key) && !Number.isInteger(value)) throw new DomainError('PARAM_NOT_INTEGER', { key: row.key });
  if (value < row.min || value > row.max) throw new DomainError('PARAM_OUT_OF_RANGE', { key: row.key, min: row.min, max: row.max });
  return value;
}
