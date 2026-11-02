import { addDays } from '../../session/localDate';

/** `today − (windowWeeks × 7 − 1)` days: the window is `windowWeeks × 7` local dates ending today (PS-03). */
export const windowStartOf = (today: string, windowWeeks: number): string => addDays(today, -(windowWeeks * 7 - 1));

/** §6.2 order: localDate asc, then startsAt asc. */
export const byDateThenStart = <T extends { localDate: string; startsAt: string }>(a: T, b: T): number =>
  a.localDate < b.localDate ? -1 : a.localDate > b.localDate ? 1 : a.startsAt < b.startsAt ? -1 : a.startsAt > b.startsAt ? 1 : 0;

/** Rows dated `windowStart ≤ localDate ≤ today`, in §6.2 order. Rows after today are ignored everywhere. */
export function inWindow<T extends { localDate: string; startsAt: string }>(rows: readonly T[], windowStart: string, today: string): T[] {
  return rows.filter((r) => r.localDate >= windowStart && r.localDate <= today).sort(byDateThenStart);
}

const DAY_MS = 86_400_000;

/**
 * §6.3 classification of a planned row, shared by the `gap` signal and the gap panel (PS-22):
 * `trained` (planned ∧ actual), `notTrained` (planned ∧ ¬actual ∧ (COMPLETED/SKIPPED, or PLANNED
 * with `startsAt + 24 h < nowIso`)), else `pending`.
 */
export function classifyPlanned(
  row: { isPlanned: boolean; isActual: boolean; status: 'PLANNED' | 'COMPLETED' | 'SKIPPED'; startsAt: string },
  nowIso: string,
): 'trained' | 'notTrained' | 'pending' | 'unplanned' {
  if (!row.isPlanned) return 'unplanned';
  if (row.isActual) return 'trained';
  if (row.status !== 'PLANNED') return 'notTrained';
  return Date.parse(row.startsAt) + DAY_MS < Date.parse(nowIso) ? 'notTrained' : 'pending';
}
