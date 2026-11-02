/** Row builders shared by the taxonomy read, edit and merge repositories (no namespace here, no cycles). */
import { and, asc, eq, inArray, isNull, or, sql, type AnyColumn, type SQL } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';

import type { Db } from '../db/client';
import { aliases, positions, subjects, techniques } from '../db/schema';
import type { AliasRow, PositionRow, SubjectRow, TechniqueRow, TechniqueType, Tier } from './contracts';
import { compact, likeContains, opt } from './internal';

export const TYPE_ORDER: Record<TechniqueType, number> = {
  TRANSITION: 0, GUARD_PASS: 1, SWEEP: 2, ESCAPE: 3, TAKEDOWN: 4, SUBMISSION: 5,
};

/** Live alias names per target id, sorted. */
export function aliasMap(kind: 'POSITION' | 'TECHNIQUE', ids: readonly string[], database: Db): Map<string, string[]> {
  const out = new Map<string, string[]>();
  if (ids.length === 0) return out;
  for (let i = 0; i < ids.length; i += 500) {
    const rows = database
      .select({ targetId: aliases.targetId, name: aliases.name })
      .from(aliases)
      .where(and(eq(aliases.targetKind, kind), inArray(aliases.targetId, ids.slice(i, i + 500)), isNull(aliases.deletedAt)))
      .all();
    for (const r of rows) out.set(r.targetId, [...(out.get(r.targetId) ?? []), r.name]);
  }
  for (const list of out.values()) list.sort((a, b) => a.localeCompare(b, 'en'));
  return out;
}

/** Live aliases of one target with ids (N9), sorted by name. */
export function listAliasesSync(kind: 'POSITION' | 'TECHNIQUE', id: string, database: Db): AliasRow[] {
  return database
    .select({ id: aliases.id, targetKind: aliases.targetKind, targetId: aliases.targetId, name: aliases.name, origin: aliases.origin })
    .from(aliases)
    .where(and(eq(aliases.targetKind, kind), eq(aliases.targetId, id), isNull(aliases.deletedAt)))
    .all()
    .sort((a, b) => a.name.localeCompare(b.name, 'en'));
}

/** SQL prefilter: name or a live alias contains the (lower-cased) query. Ranking happens in the domain. */
export function nameOrAliasLike(kind: 'POSITION' | 'TECHNIQUE', nameCol: AnyColumn, idCol: AnyColumn, query: string): SQL | undefined {
  const q = query.trim().toLowerCase();
  if (!q) return undefined;
  const pattern = likeContains(q);
  return or(
    sql`lower(${nameCol}) LIKE ${pattern} ESCAPE '\\'`,
    sql`${idCol} IN (SELECT target_id FROM aliases WHERE target_kind = ${kind} AND deleted_at IS NULL AND lower(name) LIKE ${pattern} ESCAPE '\\')`,
  );
}

/** Positions matching `where`; live only unless `includeDeleted`. */
export function positionRows(where: (SQL | undefined)[], database: Db, includeDeleted = false): PositionRow[] {
  const rows = database
    .select({
      id: positions.id,
      slug: positions.slug,
      canonicalName: positions.canonicalName,
      tier: positions.tier,
      parentId: positions.parentPositionId,
    })
    .from(positions)
    .where(and(includeDeleted ? undefined : isNull(positions.deletedAt), ...where))
    .all();
  const al = aliasMap('POSITION', rows.map((r) => r.id), database);
  return rows.map((r) => compact({ ...r, parentId: opt(r.parentId), aliases: al.get(r.id) ?? [] }));
}

export const fromPos = alias(positions, 'from_pos');
export const toPos = alias(positions, 'to_pos');

/**
 * Techniques matching `where`. Default (lists, pickers, search): live techniques whose endpoints are
 * live (PS-13: a soft-deleted endpoint hides the edge). `any`: no liveness filter (edit results).
 */
export function techniqueRows(where: (SQL | undefined)[], database: Db, mode: 'live' | 'any' = 'live'): TechniqueRow[] {
  const live = mode === 'live';
  const rows = database
    .select({
      id: techniques.id,
      slug: techniques.slug,
      name: techniques.name,
      type: techniques.type,
      fromPositionId: techniques.fromPositionId,
      fromName: fromPos.canonicalName,
      toPositionId: techniques.toPositionId,
      toName: toPos.canonicalName,
      appliesTo: techniques.appliesTo,
      perspective: techniques.perspective,
      tier: techniques.tier,
    })
    .from(techniques)
    .innerJoin(fromPos, live ? and(eq(fromPos.id, techniques.fromPositionId), isNull(fromPos.deletedAt)) : eq(fromPos.id, techniques.fromPositionId))
    .leftJoin(toPos, eq(toPos.id, techniques.toPositionId))
    .where(
      and(
        live ? isNull(techniques.deletedAt) : undefined,
        live ? or(isNull(techniques.toPositionId), isNull(toPos.deletedAt)) : undefined,
        ...where,
      ),
    )
    .all();
  const al = aliasMap('TECHNIQUE', rows.map((r) => r.id), database);
  return rows.map((r) =>
    compact({
      ...r,
      toPositionId: opt(r.toPositionId),
      toName: opt(r.toName),
      perspective: opt(r.perspective),
      aliases: al.get(r.id) ?? [],
    }),
  );
}

export const byTypeThenName = (a: TechniqueRow, b: TechniqueRow) =>
  TYPE_ORDER[a.type] - TYPE_ORDER[b.type] || a.name.localeCompare(b.name, 'en');

export const byTierThenName = (a: PositionRow, b: PositionRow) =>
  (a.tier === b.tier ? 0 : a.tier === 'CORE' ? -1 : 1) || a.canonicalName.localeCompare(b.canonicalName, 'en');

export const tierFilter = (col: typeof positions.tier, showExtended: boolean) => (showExtended ? undefined : eq(col, 'CORE' as Tier));

export function subjectRowsSync(database: Db, where?: SQL, includeDeleted = false): SubjectRow[] {
  return database
    .select({ id: subjects.id, name: subjects.name, description: subjects.description })
    .from(subjects)
    .where(and(includeDeleted ? undefined : isNull(subjects.deletedAt), where))
    .orderBy(asc(subjects.name))
    .all()
    .map((r) => compact({ ...r, description: opt(r.description) }));
}
