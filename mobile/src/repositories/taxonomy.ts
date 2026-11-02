import { and, asc, desc, eq, inArray, isNull } from 'drizzle-orm';

import { getDb, type Db } from '../db/client';
import { positions, sessions as sessionsTable, sessionTechniques, sessionTypes, submissions, techniques } from '../db/schema';
import { DomainError } from '../domain/errors';
import { matchRows, rankRows } from '../domain/taxonomy/search';
import type { TaxonomySeed } from '../domain/taxonomy/seed';
import type {
  AliasRow, FocusPickerRow, ImportReport, PositionDetail, PositionRow, SubjectRow, TechniqueDetail, TechniqueHistoryRow,
  TechniqueRow, TechniqueType, Tier,
} from './contracts';
import { compact, opt } from './internal';
import { listResourcesSync } from './resources';
import { runtime } from './runtime';
import { getSettingSync } from './settings';
import { taxonomyEdits } from './taxonomyEdit';
import { importTaxonomySync } from './taxonomyImport';
import { taxonomyMergeOps } from './taxonomyMerge';
import {
  aliasMap, byTierThenName, byTypeThenName, listAliasesSync, nameOrAliasLike, positionRows, subjectRowsSync, techniqueRows,
  tierFilter,
} from './taxonomyRows';

export { aliasMap, listAliasesSync };

const HISTORY_LIMIT = 20;

/** PS-16: sessions where the technique was attached or logged as a submission; newest first, 20 rows. */
function techniqueHistorySync(id: string, database: Db): TechniqueHistoryRow[] {
  const cols = {
    sessionId: sessionsTable.id,
    localDate: sessionsTable.localDate,
    startsAt: sessionsTable.startsAt,
    sessionTypeName: sessionTypes.name,
  };
  const attached = database
    .select(cols)
    .from(sessionTechniques)
    .innerJoin(sessionsTable, and(eq(sessionsTable.id, sessionTechniques.sessionId), isNull(sessionsTable.deletedAt)))
    .innerJoin(sessionTypes, eq(sessionTypes.id, sessionsTable.sessionTypeId))
    .where(and(eq(sessionTechniques.techniqueId, id), isNull(sessionTechniques.deletedAt)))
    .orderBy(desc(sessionsTable.startsAt))
    .limit(HISTORY_LIMIT)
    .all();
  const subs = database
    .select(cols)
    .from(submissions)
    .innerJoin(sessionsTable, and(eq(sessionsTable.id, submissions.sessionId), isNull(sessionsTable.deletedAt)))
    .innerJoin(sessionTypes, eq(sessionTypes.id, sessionsTable.sessionTypeId))
    .where(and(eq(submissions.techniqueId, id), isNull(submissions.deletedAt)))
    .orderBy(desc(sessionsTable.startsAt))
    .limit(HISTORY_LIMIT)
    .all();
  // One row per session; ATTACHED wins when both apply.
  const bySession = new Map<string, TechniqueHistoryRow & { startsAt: string }>();
  for (const r of attached) if (!bySession.has(r.sessionId)) bySession.set(r.sessionId, { ...r, via: 'ATTACHED' });
  for (const r of subs) if (!bySession.has(r.sessionId)) bySession.set(r.sessionId, { ...r, via: 'SUBMISSION' });
  return [...bySession.values()]
    .sort((a, b) => (a.startsAt < b.startsAt ? 1 : a.startsAt > b.startsAt ? -1 : 0))
    .slice(0, HISTORY_LIMIT)
    .map(({ startsAt: _s, ...r }) => r);
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
   * One live position with parent, children, techniques from/into it (type, then name; edges with
   * a soft-deleted endpoint hidden, PS-13) and its aliases with ids. Children and techniques honour
   * `library.showExtended`.
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
    const aliasRows = listAliasesSync('POSITION', id, database);
    return compact({
      id: row.id,
      slug: row.slug,
      canonicalName: row.canonicalName,
      description: opt(row.description),
      notes: opt(row.notes),
      tier: row.tier,
      aliases: aliasRows.map((a) => a.name),
      aliasRows,
      parent: parent ?? undefined,
      children,
      techniquesFrom: techniqueRows([eq(techniques.fromPositionId, id), techTier], database).sort(byTypeThenName),
      techniquesTo: techniqueRows([eq(techniques.toPositionId, id), techTier], database).sort(byTypeThenName),
    });
  },

  /**
   * Technique detail (PS-16, N9): opens for live and soft-deleted techniques (history links), with
   * endpoint soft-delete flags, aliases with ids, live resources and session history.
   */
  async getTechnique(id: string, database: Db = getDb()): Promise<TechniqueDetail> {
    const row = database.select().from(techniques).where(eq(techniques.id, id)).get();
    if (!row) throw new DomainError('TAXONOMY_ROW_NOT_FOUND');
    const ends = database
      .select({ id: positions.id, name: positions.canonicalName, deletedAt: positions.deletedAt })
      .from(positions)
      .where(inArray(positions.id, [row.fromPositionId, ...(row.toPositionId ? [row.toPositionId] : [])]))
      .all();
    const from = ends.find((e) => e.id === row.fromPositionId)!;
    const to = row.toPositionId ? ends.find((e) => e.id === row.toPositionId) : undefined;
    const aliasRows = listAliasesSync('TECHNIQUE', id, database);
    return compact({
      id: row.id,
      slug: row.slug,
      name: row.name,
      type: row.type,
      fromPositionId: row.fromPositionId,
      fromName: from.name,
      toPositionId: opt(row.toPositionId),
      toName: to?.name,
      appliesTo: row.appliesTo,
      perspective: opt(row.perspective),
      tier: row.tier,
      aliases: aliasRows.map((a) => a.name),
      description: opt(row.description),
      notes: opt(row.notes),
      origin: row.origin,
      removed: row.deletedAt !== null,
      resources: listResourcesSync({ kind: 'TECHNIQUE', id }, database),
      fromRemoved: from.deletedAt !== null,
      toRemoved: to ? to.deletedAt !== null : undefined,
      aliasRows,
      history: techniqueHistorySync(id, database),
    });
  },

  /** Live aliases of a position or technique, with ids, by name. */
  async listAliases(kind: 'POSITION' | 'TECHNIQUE', id: string, database: Db = getDb()): Promise<AliasRow[]> {
    return listAliasesSync(kind, id, database);
  },

  /** Live subjects by name. */
  async listSubjects(database: Db = getDb()): Promise<SubjectRow[]> {
    return subjectRowsSync(database);
  },

  /** Technique search (name or alias); `type` filters in SQL (D-A22 submission chips). Hides edges with a deleted endpoint. */
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

  ...taxonomyEdits,
  ...taxonomyMergeOps,
};
