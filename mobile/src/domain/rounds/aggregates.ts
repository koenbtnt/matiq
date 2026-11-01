export type AggregateRound = { submissions?: readonly { direction: string }[] };

/**
 * Aggregates derived from detailed rows (product-spec §6): offered to the user, never applied
 * silently — the stored aggregates stay authoritative.
 */
export function deriveAggregates(
  rounds: readonly AggregateRound[],
  sessionSubmissions: readonly { direction: string }[] = [],
): { roundsCount: number; submissionsLanded: number; submissionsTaken: number } {
  const all = [...sessionSubmissions, ...rounds.flatMap((r) => r.submissions ?? [])];
  return {
    roundsCount: rounds.length,
    submissionsLanded: all.filter((s) => s.direction === 'LANDED').length,
    submissionsTaken: all.filter((s) => s.direction === 'TAKEN').length,
  };
}
