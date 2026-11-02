import type { ProgressResult } from '../progression/types';

export type SuggestionSourceOut = 'LAST_NEEDS_WORK' | 'CYCLE' | 'NEEDS_WORK' | 'NOT_TRAINED';
export type SuggestionOut = { ref: { kind: 'POSITION' | 'SUBJECT'; refId: string }; name: string; source: SuggestionSourceOut };

export type SuggestionSettings = {
  'suggest.lastNeedsWork': boolean;
  'suggest.cycle': boolean;
  'suggest.needsWork': boolean;
  'suggest.notTrainedLately': boolean;
  'suggest.max': number;
};

export type LastCompletedLike = {
  focuses: readonly {
    kind: 'POSITION' | 'SUBJECT';
    refId: string;
    name: string;
    isActual: boolean;
    needsWork: boolean;
    removed: boolean;
    sortOrder: number;
  }[];
};

const daysSinceOf = (r: ProgressResult): number => r.signals.find((s) => s.signal === 'daysSince')?.value ?? 0;

/**
 * Planning suggestions (A-30, PS-06), deduplicated by ref and capped at `suggest.max`, in source
 * order: LAST_NEEDS_WORK (the last completed session's actual, flagged, live focuses by sort order)
 * → CYCLE (sprint 3; no input yet) → NEEDS_WORK (algorithm state, score desc) → NOT_TRAINED
 * (algorithm state, only focuses trained at some point, longest ago first). Removed focuses never appear.
 */
export function forPlanning(input: {
  settings: SuggestionSettings;
  lastCompleted?: LastCompletedLike;
  cycleFocuses?: readonly never[];
  states?: readonly ProgressResult[];
}): SuggestionOut[] {
  const max = Math.max(0, Math.floor(input.settings['suggest.max']));
  const out: SuggestionOut[] = [];
  const seen = new Set<string>();
  const push = (ref: { kind: 'POSITION' | 'SUBJECT'; refId: string }, name: string, source: SuggestionSourceOut) => {
    const key = `${ref.kind}:${ref.refId}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ ref: { kind: ref.kind, refId: ref.refId }, name, source });
  };

  if (input.settings['suggest.lastNeedsWork'] && input.lastCompleted) {
    [...input.lastCompleted.focuses]
      .filter((f) => f.isActual && f.needsWork && !f.removed)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .forEach((f) => push(f, f.name, 'LAST_NEEDS_WORK'));
  }
  const live = (input.states ?? []).filter((s) => !s.removed);
  if (input.settings['suggest.needsWork']) {
    live
      .filter((s) => s.state === 'NEEDS_WORK')
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0) || a.name.localeCompare(b.name, 'en'))
      .forEach((s) => push(s.ref, s.name, 'NEEDS_WORK'));
  }
  if (input.settings['suggest.notTrainedLately']) {
    live
      .filter((s) => s.state === 'NOT_TRAINED' && s.lastTrainedOn !== undefined)
      .sort((a, b) => daysSinceOf(b) - daysSinceOf(a) || a.name.localeCompare(b.name, 'en'))
      .forEach((s) => push(s.ref, s.name, 'NOT_TRAINED'));
  }
  return out.slice(0, max);
}
