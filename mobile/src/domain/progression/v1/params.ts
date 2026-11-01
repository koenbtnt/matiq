/**
 * Progression algorithm v1 parameter defaults and bounds (product-spec §4.3). These seed the
 * `algorithm_params` rows; the algorithm itself (sprint 2) reads the rows, never these constants.
 */
export const ALGORITHM_VERSION_V1 = 'v1';

export type ParamDefault = { key: string; defaultValue: number; min: number; max: number };

export const V1_PARAM_DEFAULTS: readonly ParamDefault[] = [
  { key: 'windowWeeks', defaultValue: 8, min: 2, max: 26 },
  { key: 'staleDays', defaultValue: 21, min: 7, max: 90 },
  { key: 'minSessions', defaultValue: 3, min: 2, max: 10 },
  { key: 'trendImproving', defaultValue: 0.5, min: 0.1, max: 2 },
  { key: 'needsWorkThreshold', defaultValue: 0.5, min: 0.1, max: 1 },
  { key: 'wNeedsWork', defaultValue: 0.4, min: 0, max: 1 },
  { key: 'wHitCaught', defaultValue: 0.25, min: 0, max: 1 },
  { key: 'wGap', defaultValue: 0.2, min: 0, max: 1 },
  { key: 'wTrend', defaultValue: 0.15, min: 0, max: 1 },
  { key: 'hitCaughtMinEvents', defaultValue: 3, min: 1, max: 20 },
];
