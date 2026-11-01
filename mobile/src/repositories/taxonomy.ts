import { and, asc, eq, inArray, isNull, or, sql, type AnyColumn, type SQL } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';

import { getDb, type Db } from '../db/client';
import { aliases, positions, subjects, techniques } from '../db/schema';
import { DomainError } from '../domain/errors';
import { matchRows, rankRows } from '../domain/taxonomy/search';
import type { TaxonomySeed } from '../domain/taxonomy/seed';
import type {
  AliasRow, FocusPickerRow, ImportReport, PositionDetail, PositionRow, SubjectRow, TechniqueRow, TechniqueType, Tier,
} from './contracts';
import { compact, likeContains, opt } from './internal';
import { runtime } from './runtime';
import { getSettingSync } from './settings';
import { importTaxonomySync } from './taxonomyImport';

const TYPE_ORDER: Record<TechniqueType, number> = {
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
function nameOrAliasLike(kind: 'POSITION' | 'TECHNIQUE', nameCol: AnyColumn, idCol: AnyColumn, query: string): SQL | undefined {
  const q = query.trim().toLowerCase();
  if (!q) return undefined;
  const pattern = likeContains(q);
  return or(
    sql`lower(${nameCol}) LIKE ${pattern} ESCAPE '\\'`,
    sql`${idCol} IN (SELECT target_id FROM aliases WHERE target_kind = ${kind} AND deleted_at IS NULL AND lower(name) LIKE ${pattern} ESCAPE '\\')`,
  );
}

function positionRows(where: (SQL | undefined)[], database: Db): PositionRow[] {
  const rows = database
    .select({
      id: positions.id,
      slug: positions.slug,
      canonicalName: positions.canonicalName,
      tier: positions.tier,
      parentId: positions.parentPositionId,
    })
    .from(positions)
    .where(and(isNull(positions.deletedAt), ...where))
    .all();
  const al = aliasMap('POSITION', rows.map((r) => r.id), database);
  return rows.map((r) => compact({ ...r, parentId: opt(r.parentId), aliases: al.get(r.id) ?? [] }));
}

const fromPos = alias(positions, 'from_pos');
const toPos = alias(positions, 'to_pos');

function techniqueRows(where: (SQL | undefined)[], database: Db): TechniqueRow[] {
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
    .innerJoin(fromPos, and(eq(fromPos.id, techniques.fromPositionId), isNull(fromPos.deletedAt)))
    .leftJoin(toPos, eq(toPos.id, techniques.toPositionId))
    .where(and(isNull(techniques.deletedAt), ...where))
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

const byTypeThenName = (a: TechniqueRow, b: TechniqueRow) =>
  TYPE_ORDER[a.type] - TYPE_ORDER[b.type] || a.name.localeCompare(b.name, 'en');

const byTierThenName = (a: PositionRow, b: PositionRow) =>
  (a.tier === b.tier ? 0 : a.tier === 'CORE' ? -1 : 1) || a.canonicalName.localeCompare(b.canonicalName, 'en');

const tierFilter = (col: typeof positions.tier, showExtended: boolean) => (showExtended ? undefined : eq(col, 'CORE' as Tier));

function subjectRowsSync(database: Db): SubjectRow[] {
  return database
    .select({ id: subjects.id, name: subjects.name, description: subjects.description })
    .from(subjects)
    .where(isNull(subjects.deletedAt))
    .orderBy(asc(subjects.name))
    .all()
    .map((r) => compact({ ...r, description: opt(r.description) }));
}

export const taxonomy = {
  /**
   * Focus picker: positions (CORE only unless `showExtended`) and subjects whose name or alias
   * contains `query`; prefix > substring, CORE > EXTENDED (domain `rankRows`).
   */
  async searchFocuses(
    { query, showExtended, limit = 30 }: { query: string; showExtended: boolean; limit?: number },
    database: Db = getDb(),
  ): Promise<FocusPickerRow[]> {
    const pos = positionRows(
      [tierFilter(positions.tier, showExtended), nameOrAliasLike('POSITION', positions.canonicalName, positions.id, query)],
      database,
    ).map((p) => ({ kind: 'POSITION' as const, refId: p.id, name: p.canonicalName, aliases: p.aliases, tier: p.tier }));
    const subj = subjectRowsSync(database).map((s) => ({ kind: 'SUBJECT' as const, refId: s.id, name: s.name, aliases: [] }));
    return rankRows<FocusPickerRow>([...pos, ...subj], query, limit);
  },

  /** Library positions: CORE first, then name; `matchedAlias` when `query` hit an alias. */
  async listPositions(
    { showExtended, query = '' }: { showExtended: boolean; query?: string },
    database: Db = getDb(),
  ): Promise<PositionRow[]> {
    const rows = positionRows(
      [tierFilter(positions.tier, showExtended), nameOrAliasLike('POSITION', positions.canonicalName, positions.id, query)],
      database,
    );
    const matched = matchRows(rows.map((r) => ({ ...r, name: r.canonicalName })), query);
    return matched.map(({ name: _name, ...r }) => r).sort(byTierThenName);
  },

  /**
   * One live position with parent, children and techniques from/into it (type, then name).
   * Children and techniques honour `library.showExtended`.
   */
  async getPosition(id: string, database: Db = getDb()): Promise<PositionDetail> {
    const row = database.select().from(positions).where(and(eq(positions.id, id), isNull(positions.deletedAt))).get();
    if (!row) throw new DomainError('TAXONOMY_ROW_NOT_FOUND');
    const showExtended = getSettingSync('library.showExtended', database).value;
    const parent = row.parentPositionId
      ? database
          .select({ id: positions.id, canonicalName: positions.canonicalName })
          .from(positions)
          .where(and(eq(positions.id, row.parentPositionId), isNull(positions.deletedAt)))
          .get()
      : undefined;
    const children = database
      .select({ id: positions.id, canonicalName: positions.canonicalName, tier: positions.tier })
      .from(positions)
      .where(and(eq(positions.parentPositionId, id), isNull(positions.deletedAt), tierFilter(positions.tier, showExtended)))
      .orderBy(asc(positions.canonicalName))
      .all();
    const techTier = showExtended ? undefined : eq(techniques.tier, 'CORE' as Tier);
    return compact({
      id: row.id,
      slug: row.slug,
      canonicalName: row.canonicalName,
      description: opt(row.description),
      notes: opt(row.notes),
      tier: row.tier,
      aliases: aliasMap('POSITION', [id], database).get(id) ?? [],
      aliasRows: listAliasesSync('POSITION', id, database),
      parent: parent ?? undefined,
      children,
      techniquesFrom: techniqueRows([eq(techniques.fromPositionId, id), techTier], database).sort(byTypeThenName),
      techniquesTo: techniqueRows([eq(techniques.toPositionId, id), techTier], database).sort(byTypeThenName),
    });
  },

  /** Live subjects by name. */
  async listSubjects(database: Db = getDb()): Promise<SubjectRow[]> {
    return subjectRowsSync(database);
  },

  /** Technique search (name or alias); `type` filters in SQL (D-A22 submission chips). */
  async listTechniques(
    { query, showExtended, type, limit = 30 }: { query: string; showExtended: boolean; type?: TechniqueType; limit?: number },
    database: Db = getDb(),
  ): Promise<TechniqueRow[]> {
    const rows = techniqueRows(
      [
        showExtended ? undefined : eq(techniques.tier, 'CORE' as Tier),
        type ? eq(techniques.type, type) : undefined,
        nameOrAliasLike('TECHNIQUE', techniques.name, techniques.id, query),
      ],
      database,
    );
    return rankRows(rows, query, limit);
  },

  /** Imports a taxonomy release (user edits win, never deletes). One transaction. */
  async importRelease(seed: TaxonomySeed, { now }: { now: () => string } = runtime(), database: Db = getDb()): Promise<ImportReport> {
    return database.transaction((tx) => importTaxonomySync(seed, now(), tx));
  },
};
