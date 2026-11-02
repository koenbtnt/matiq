import type { ProgressResult, ProgressState } from './types';

const STATE_ORDER: Record<ProgressState, number> = { NEEDS_WORK: 0, NOT_TRAINED: 1, STEADY: 2, IMPROVING: 3 };

/** PS-04 order: live focuses before removed ones; then Needs work → Not trained → Steady → Improving; then name. */
export function sortProgressResults(results: readonly ProgressResult[]): ProgressResult[] {
  return [...results].sort(
    (a, b) =>
      Number(a.removed) - Number(b.removed) ||
      STATE_ORDER[a.state] - STATE_ORDER[b.state] ||
      a.name.localeCompare(b.name, 'en'),
  );
}
