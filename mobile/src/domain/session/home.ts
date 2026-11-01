/** Minimal shape the partition needs (a SessionSummary satisfies it). */
export type PlannedLike = { localDate: string; startsAt: string };

export type PlannedPartition<T> = { stalePlanned: T[]; todayPlanned: T[]; nextPlanned?: T };

const byStart = <T extends PlannedLike>(a: T, b: T) =>
  a.startsAt < b.startsAt ? -1 : a.startsAt > b.startsAt ? 1 : 0;

/**
 * Partitions PLANNED sessions by local date (A-19, R1-04): stale = before today (oldest first),
 * today = on today, next = the earliest on or after today by start time.
 */
export function partitionPlanned<T extends PlannedLike>(planned: readonly T[], today: string): PlannedPartition<T> {
  const sorted = [...planned].sort(byStart);
  const stalePlanned = sorted.filter((s) => s.localDate < today);
  const todayPlanned = sorted.filter((s) => s.localDate === today);
  const nextPlanned = sorted.find((s) => s.localDate >= today);
  return { stalePlanned, todayPlanned, ...(nextPlanned ? { nextPlanned } : {}) };
}
