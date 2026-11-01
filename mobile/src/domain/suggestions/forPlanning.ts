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

/**
 * Planning suggestions (A-30). Sprint 1 has one live source — the last completed session's actual,
 * flagged, not-removed focuses — capped at `suggest.max`. The cycle, needs-work and not-trained
 * sources (sprint 2–3) take their inputs here and yield nothing until those inputs exist.
 */
export function forPlanning(input: {
  settings: SuggestionSettings;
  lastCompleted?: LastCompletedLike;
  cycleFocuses?: readonly never[];
  states?: readonly never[];
}): SuggestionOut[] {
  const max = Math.max(0, Math.floor(input.settings['suggest.max']));
  const out: SuggestionOut[] = [];
  const seen = new Set<string>();
  if (input.settings['suggest.lastNeedsWork'] && input.lastCompleted) {
    const flagged = [...input.lastCompleted.focuses]
      .filter((f) => f.isActual && f.needsWork && !f.removed)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    for (const f of flagged) {
      const key = `${f.kind}:${f.refId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ ref: { kind: f.kind, refId: f.refId }, name: f.name, source: 'LAST_NEEDS_WORK' });
    }
  }
  return out.slice(0, max);
}
