import { DomainError } from '../errors';

export type QuickLogHome = { todayPlanned: readonly { id: string }[]; lastUsedTypeId?: string };
export type QuickLogTarget = { sessionId: string } | { sessionTypeId: string; focuses: [] };

/**
 * Home's quick-log target (product-spec §6): exactly one PLANNED session today ⇒ it; otherwise a
 * new session with the last-used type, else the first session type in display order.
 */
export function quickLogTarget(
  home: QuickLogHome,
  sessionTypes: readonly { id: string; sortOrder: number }[] = [],
): QuickLogTarget {
  const only = home.todayPlanned.length === 1 ? home.todayPlanned[0] : undefined;
  if (only) return { sessionId: only.id };
  const fallback = [...sessionTypes].sort((a, b) => a.sortOrder - b.sortOrder)[0]?.id;
  const sessionTypeId = home.lastUsedTypeId ?? fallback;
  if (!sessionTypeId) throw new DomainError('SESSION_TYPE_REQUIRED');
  return { sessionTypeId, focuses: [] };
}
