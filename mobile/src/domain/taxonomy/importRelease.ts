/** What a re-import may do with one incoming seed row (D-07 / R-23: the user always wins). */
export type ImportDecision = 'add' | 'update' | 'unchanged' | 'skipUserEdited' | 'skipDeleted' | 'skipUserOwned';

export type ExistingRow = {
  origin: 'seed' | 'user';
  userEditedAt: string | null;
  deletedAt: string | null;
};

/**
 * Decision for one incoming row given the existing row with the same `(source, source_id)`
 * (live or soft-deleted). Only untouched, live seed rows are updated; `changed` says whether any
 * imported field differs (so an identical release writes nothing).
 */
export function decideImport(existing: ExistingRow | undefined, changed: boolean): ImportDecision {
  if (!existing) return 'add';
  if (existing.origin === 'user') return 'skipUserOwned';
  if (existing.deletedAt !== null) return 'skipDeleted';
  if (existing.userEditedAt !== null) return 'skipUserEdited';
  return changed ? 'update' : 'unchanged';
}

/** A retired seed row is soft-deleted only when it is still the untouched seed row. */
export const mayRetire = (existing: ExistingRow | undefined): boolean =>
  !!existing && existing.origin === 'seed' && existing.deletedAt === null && existing.userEditedAt === null;

/** Slug for a new seed row: keeps `slug` unless a live row owns it, then `-gm`, `-gm-2`, … (plan §10). */
export function seedSlug(slug: string, takenByOthers: ReadonlySet<string>): string {
  if (!takenByOthers.has(slug)) return slug;
  let candidate = `${slug}-gm`;
  for (let n = 2; takenByOthers.has(candidate); n += 1) candidate = `${slug}-gm-${n}`;
  return candidate;
}
