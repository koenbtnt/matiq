import { DomainError } from '../errors';

/** Merge preconditions (plan §5.5): not into itself; submissions only into submissions. */
export function assertMergeable(
  fromId: string,
  intoId: string,
  types?: { from: string; into: string },
): void {
  if (fromId === intoId) throw new DomainError('TAXONOMY_SELF_MERGE');
  if (types && (types.from === 'SUBMISSION') !== (types.into === 'SUBMISSION')) throw new DomainError('TAXONOMY_MERGE_KIND_MISMATCH');
}

export type FoldableFocus = {
  isPlanned: boolean;
  isActual: boolean;
  needsWork: boolean;
  rating: number | null;
  comment: string | null;
  hitCount: number | null;
  caughtCount: number | null;
};

const sumNullable = (a: number | null, b: number | null): number | null => (a === null && b === null ? null : (a ?? 0) + (b ?? 0));

/** Joins non-empty texts with " / " (plan §7.3); null when both are empty. */
export function joinNotes(a: string | null, b: string | null): string | null {
  const parts = [a, b].map((s) => (s ?? '').trim()).filter(Boolean);
  return parts.length ? parts.join(' / ') : null;
}

/**
 * Folds a loser focus row into the survivor of the same session (plan §7.3): booleans OR'd,
 * survivor's rating if set else the loser's, counts summed, comments joined.
 */
export function foldFocus(survivor: FoldableFocus, loser: FoldableFocus): FoldableFocus {
  return {
    isPlanned: survivor.isPlanned || loser.isPlanned,
    isActual: survivor.isActual || loser.isActual,
    needsWork: survivor.needsWork || loser.needsWork,
    rating: survivor.rating ?? loser.rating,
    comment: joinNotes(survivor.comment, loser.comment),
    hitCount: sumNullable(survivor.hitCount, loser.hitCount),
    caughtCount: sumNullable(survivor.caughtCount, loser.caughtCount),
  };
}

/** Merge payload stored in `taxonomy_merges.payload` (plan §7.4). */
export type MergePayloadV1 = {
  v: 1;
  kind: 'POSITION' | 'TECHNIQUE' | 'SUBJECT';
  fromId: string;
  intoId: string;
  loser: Record<string, unknown>;
  survivorBefore: { parentPositionId: string | null };
  moved: { table: string; id: string; column: string; from: string }[];
  folded: { table: string; loserId: string; survivorId: string | null; survivorBefore: Record<string, unknown> | null }[];
  aliasesAdded: string[];
};

/** Counts per table for `MergeResult.moved`. */
export function movedCounts(moved: MergePayloadV1['moved']): Record<string, number> {
  const out: Record<string, number> = {};
  for (const m of moved) out[m.table] = (out[m.table] ?? 0) + 1;
  return out;
}
