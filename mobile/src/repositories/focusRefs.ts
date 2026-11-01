import { inArray } from 'drizzle-orm';

import type { Db } from '../db/client';
import { positions, subjects } from '../db/schema';
import type { FocusKind } from './contracts';
import { aliasMap } from './taxonomy';

export type RefInfo = { name: string; aliases: string[]; removed: boolean };

export const refKey = (kind: string, refId: string) => `${kind}:${refId}`;

/**
 * Resolves focus refs to their current name, aliases and removed flag — soft-deleted targets
 * included (history keeps the reference, R-12). Unknown refs are absent from the map.
 */
export function resolveRefs(refs: readonly { kind: FocusKind | string; refId: string }[], tx: Db): Map<string, RefInfo> {
  const out = new Map<string, RefInfo>();
  const posIds = [...new Set(refs.filter((r) => r.kind === 'POSITION').map((r) => r.refId))];
  const subjIds = [...new Set(refs.filter((r) => r.kind === 'SUBJECT').map((r) => r.refId))];
  if (posIds.length) {
    const al = aliasMap('POSITION', posIds, tx);
    for (const p of tx
      .select({ id: positions.id, name: positions.canonicalName, deletedAt: positions.deletedAt })
      .from(positions)
      .where(inArray(positions.id, posIds))
      .all())
      out.set(refKey('POSITION', p.id), { name: p.name, aliases: al.get(p.id) ?? [], removed: p.deletedAt !== null });
  }
  if (subjIds.length) {
    for (const s of tx
      .select({ id: subjects.id, name: subjects.name, deletedAt: subjects.deletedAt })
      .from(subjects)
      .where(inArray(subjects.id, subjIds))
      .all())
      out.set(refKey('SUBJECT', s.id), { name: s.name, aliases: [], removed: s.deletedAt !== null });
  }
  return out;
}
