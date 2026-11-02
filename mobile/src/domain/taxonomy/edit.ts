import { DomainError, type ErrorCode } from '../errors';

/** Trimmed, non-empty name or `code` (TAXONOMY_NAME_REQUIRED / ALIAS_NAME_REQUIRED). */
export function requireName(name: string | null | undefined, code: Extract<ErrorCode, 'TAXONOMY_NAME_REQUIRED' | 'ALIAS_NAME_REQUIRED'> = 'TAXONOMY_NAME_REQUIRED'): string {
  const t = (name ?? '').trim();
  if (!t) throw new DomainError(code);
  return t;
}

export const sameName = (a: string, b: string): boolean => a.trim().toLowerCase() === b.trim().toLowerCase();

/** PRODUCT §8 edge shape: a target position iff the type is not SUBMISSION. */
export function validateTechniqueShape(type: string, toPositionId: string | null | undefined): void {
  if (type === 'SUBMISSION') {
    if (toPositionId) throw new DomainError('TECHNIQUE_SUBMISSION_HAS_TARGET');
  } else if (!toPositionId) throw new DomainError('TECHNIQUE_TARGET_REQUIRED');
}

export const MAX_PARENT_DEPTH = 50;

/**
 * POSITION_PARENT_CYCLE when making `parentId` the parent of `id` would loop: `parentId` is `id`
 * or one of its descendants (walks up from `parentId` at most 50 levels, plan §7.1).
 */
export function assertNoParentCycle(id: string, parentId: string, parentOf: (id: string) => string | null | undefined): void {
  let cur: string | null | undefined = parentId;
  for (let depth = 0; cur && depth <= MAX_PARENT_DEPTH; depth += 1) {
    if (cur === id) throw new DomainError('POSITION_PARENT_CYCLE');
    cur = parentOf(cur);
  }
  if (cur) throw new DomainError('POSITION_PARENT_CYCLE');
}

/**
 * Rename (R-50/A-9, plan §7.2): the old name becomes a user alias unless it equals the new name
 * (case-insensitive) or a live alias of the row already carries it. Returns the alias name to add.
 */
export function aliasForRename(oldName: string, newName: string, liveAliases: readonly string[], keep = true): string | undefined {
  if (!keep || sameName(oldName, newName)) return undefined;
  if (liveAliases.some((a) => sameName(a, oldName))) return undefined;
  return oldName;
}

/** Fields whose edit sets `user_edited_at` on a seed row (sprint-0 §6); notes never do. */
export const IMPORTED_FIELDS = {
  POSITION: ['canonicalName', 'description', 'parentPositionId'],
  TECHNIQUE: ['name', 'type', 'fromPositionId', 'toPositionId', 'appliesTo', 'perspective', 'description'],
  SUBJECT: ['name', 'description'],
  RESOURCE: ['title', 'url', 'author', 'resourceTypeId'],
} as const;

/** True when `next` changes any imported field of `before` (null and undefined compare equal). */
export function touchesImported(
  kind: keyof typeof IMPORTED_FIELDS,
  before: Readonly<Record<string, unknown>>,
  next: Readonly<Record<string, unknown>>,
): boolean {
  return IMPORTED_FIELDS[kind].some((f) => Object.hasOwn(next, f) && (next[f] ?? null) !== (before[f] ?? null));
}
