import type { KeyboardTypeOptions } from 'react-native';

export type ParamGroup = 'window' | 'states' | 'weights' | 'data';
export type ParamKey =
  | 'windowWeeks' | 'staleDays' | 'minSessions' | 'trendImproving' | 'needsWorkThreshold'
  | 'wNeedsWork' | 'wHitCaught' | 'wGap' | 'wTrend' | 'hitCaughtMinEvents';
export type ParamUnit = 'weeks' | 'days' | 'sessions' | 'points' | 'events';

export type ParamUi = { key: ParamKey; group: ParamGroup; unit?: ParamUnit; step: number; decimals: number; keyboard: KeyboardTypeOptions };

/** Key → group, unit, step and decimals (design §4.4.2 table). */
export const PARAM_UI: ParamUi[] = [
  { key: 'windowWeeks', group: 'window', unit: 'weeks', step: 1, decimals: 0, keyboard: 'number-pad' },
  { key: 'staleDays', group: 'window', unit: 'days', step: 1, decimals: 0, keyboard: 'number-pad' },
  { key: 'minSessions', group: 'states', unit: 'sessions', step: 1, decimals: 0, keyboard: 'number-pad' },
  { key: 'trendImproving', group: 'states', unit: 'points', step: 0.1, decimals: 1, keyboard: 'decimal-pad' },
  { key: 'needsWorkThreshold', group: 'states', step: 0.05, decimals: 2, keyboard: 'decimal-pad' },
  { key: 'wNeedsWork', group: 'weights', step: 0.05, decimals: 2, keyboard: 'decimal-pad' },
  { key: 'wHitCaught', group: 'weights', step: 0.05, decimals: 2, keyboard: 'decimal-pad' },
  { key: 'wGap', group: 'weights', step: 0.05, decimals: 2, keyboard: 'decimal-pad' },
  { key: 'wTrend', group: 'weights', step: 0.05, decimals: 2, keyboard: 'decimal-pad' },
  { key: 'hitCaughtMinEvents', group: 'data', unit: 'events', step: 1, decimals: 0, keyboard: 'number-pad' },
];

export const PARAM_GROUPS: ParamGroup[] = ['window', 'states', 'weights', 'data'];

/** Rounds to the field's decimals so stepper arithmetic never shows 0.45000000000000007. */
export const roundTo = (n: number, decimals: number): number => Number(n.toFixed(decimals));

/** Parses a typed number with "," or "." as the decimal separator; NaN when it isn't one. */
export function parseTyped(text: string): number {
  const s = text.trim().replace(',', '.');
  return s === '' || !/^-?\d*\.?\d+$/.test(s) ? NaN : Number(s);
}
