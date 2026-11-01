/** Taxonomy editing (plan §7.1–§7.2, PS-12, PS-13, PS-24). Spread into the `taxonomy` namespace. */
import { and, eq, isNull, ne, sql, type AnyColumn, type SQL } from 'drizzle-orm';

import { getDb, type Db } from '../db/client';
import { aliases, positions, subjects, techniques } from '../db/schema';
import { DomainError } from '../domain/errors';
import {
  aliasForRename, assertNoParentCycle, requireName, sameName, touchesImported, validateTechniqueShape,
} from '../domain/taxonomy/edit';
import { slugify, uniqueSlug } from '../domain/taxonomy/slug';
import type {
  AliasRow, PositionInput, PositionRow, SubjectInput, SubjectRow, TaxonomyKind, TechniqueInput, TechniqueRow,
} from './contracts';
import { runtime } from './runtime';
import { listAliasesSync, positionRows, subjectRowsSync, techniqueRows } from './taxonomyRows';

type AliasKind = 'POSITION' | 'TECHNIQUE';
export type TaxonomyRowOf<K extends TaxonomyKind> = K extends 'POSITION' ? PositionRow : K extends 'TECHNIQUE' ? TechniqueRow : SubjectRow;

const TABLE = { POSITION: positions, TECHNIQUE: techniques, SUBJECT: subjects } as const;

const lowerEq = (col: AnyColumn, value: string): SQL => sql`lower(${col}) = ${value.trim().toLowerCase()}`;

/* ---------- row loading ---------- */

function loadRow<K extends TaxonomyKind>(kind: K, id: string, database: Db) {
  const t = TABLE[kind];
  const row = database.select().from(t).where(eq(t.id, id)).get();
  if (!row) throw new DomainError('TAXONOMY_ROW_NOT_FOUND');
  return row as K extends 'POSITION'
    ? typeof positions.$inferSelect
    : K extends 'TECHNIQUE'
      ? typeof techniques.$inferSelect
      : typeof subjects.$inferSelect;
}

function loadLiveRow<K extends TaxonomyKind>(kind: K, id: string, database: Db) {
  const row = loadRow(kind, id, database);
  if (row.deletedAt) throw new DomainError('TAXONOMY_ROW_DELETED');
  return row;
}

/** Any-state row in its list shape (edit results, soft delete). */
export function rowOf<K extends TaxonomyKind>(kind: K, id: string, database: Db): TaxonomyRowOf<K> {
  const out =
    kind === 'POSITION'
      ? positionRows([eq(positions.id, id)], database, true)[0]
      : kind === 'TECHNIQUE'
        ? techniqueRows([eq(techniques.id, id)], database, 'any')[0]
        : subjectRowsSync(database, eq(subjects.id, id), true)[0];
  if (!out) throw new DomainError('TAXONOMY_ROW_NOT_FOUND');
  return out as TaxonomyRowOf<K>;
}

function assertLivePosition(id: string, database: Db): void {
  const p = database.select({ id: positions.id }).from(positions).where(and(eq(positions.id, id), isNull(positions.deletedAt))).get();
  if (!p) throw new DomainError('TAXONOMY_ROW_NOT_FOUND');
}

function mintSlug(kind: 'POSITION' | 'TECHNIQUE', name: string, database: Db): string {
  const t = TABLE[kind];
  const taken = new Set(database.select({ slug: t.slug }).from(t).all().map((r) => r.slug));
  return uniqueSlug(slugify(name) || kind.toLowerCase(), taken);
}

/* ---------- PS-24 duplicate rules ---------- */

/** Positions: another live position's canonical name, or a live POSITION alias of another position. */
function assertPositionNameFree(name: string, selfId: string | undefined, database: Db): void {
  const canon = database
    .select({ id: positions.id })
    .from(positions)
    .where(and(isNull(positions.deletedAt), lowerEq(positions.canonicalName, name), selfId ? ne(positions.id, selfId) : undefined))
    .get();
  const alias = database
    .select({ id: aliases.id })
    .from(aliases)
    .innerJoin(positions, and(eq(positions.id, aliases.targetId), isNull(positions.deletedAt)))
    .where(
      and(
        eq(aliases.targetKind, 'POSITION'),
        isNull(aliases.deletedAt),
        lowerEq(aliases.name, name),
        selfId ? ne(aliases.targetId, selfId) : undefined,
      ),
    )
    .get();
  if (canon || alias) throw new DomainError('TAXONOMY_NAME_DUPLICATE');
}

function assertSubjectNameFree(name: string, selfId: string | undefined, database: Db): void {
  const hit = database
    .select({ id: subjects.id })
    .from(subjects)
    .where(and(isNull(subjects.deletedAt), lowerEq(subjects.name, name), selfId ? ne(subjects.id, selfId) : undefined))
    .get();
  if (hit) throw new DomainError('TAXONOMY_NAME_DUPLICATE');
}

/** Techniques: only an exact live duplicate edge (lower(name), from, to, type). */
function assertEdgeFree(
  e: { name: string; type: string; fromPositionId: string; toPositionId: string | null },
  selfId: string | undefined,
  database: Db,
): void {
  const hit = database
    .select({ id: techniques.id })
    .from(techniques)
    .where(
      and(
        isNull(techniques.deletedAt),
        lowerEq(techniques.name, e.name),
        eq(techniques.type, e.type as never),
        eq(techniques.fromPositionId, e.fromPositionId),
        e.toPositionId ? eq(techniques.toPositionId, e.toPositionId) : isNull(techniques.toPositionId),
        selfId ? ne(techniques.id, selfId) : undefined,
      ),
    )
    .get();
  if (hit) throw new DomainError('TAXONOMY_NAME_DUPLICATE');
}

/* ---------- aliases ---------- */

function insertAlias(kind: AliasKind, targetId: string, name: string, now: string, database: Db): string {
  const id = runtime().newId();
  database.insert(aliases).values({ id, origin: 'user', targetKind: kind, targetId, name, createdAt: now, updatedAt: now }).run();
  return id;
}

/**
 * Rename bookkeeping (plan §7.2, §12): a live alias of the row equal to the new name is soft-deleted
 * (the name takes over); the old name becomes a user alias unless `keep` is false or it already is one.
 */
function applyRenameAliases(kind: AliasKind, id: string, oldName: string, newName: string, keep: boolean, now: string, database: Db): void {
  const live = listAliasesSync(kind, id, database);
  for (const a of live.filter((x) => sameName(x.name, newName)))
    database.update(aliases).set({ deletedAt: now, updatedAt: now }).where(eq(aliases.id, a.id)).run();
  const add = aliasForRename(oldName, newName, live.filter((x) => !sameName(x.name, newName)).map((x) => x.name), keep);
  if (add) insertAlias(kind, id, add, now, database);
}

function aliasRowById(id: string, database: Db): AliasRow | undefined {
  return database
    .select({ id: aliases.id, targetKind: aliases.targetKind, targetId: aliases.targetId, name: aliases.name, origin: aliases.origin, deletedAt: aliases.deletedAt })
    .from(aliases)
    .where(eq(aliases.id, id))
    .get() as (AliasRow & { deletedAt: string | null }) | undefined;
}

const stripDeleted = (a: AliasRow & { deletedAt?: string | null }): AliasRow => {
  const { deletedAt: _d, ...rest } = a;
  return rest;
};

/* ---------- namespace ---------- */

export const taxonomyEdits = {
  /** User position: origin user, tier CORE, minted slug; PS-24 name rule; parent must be live. */
  async createPosition(input: PositionInput, database: Db = getDb()): Promise<PositionRow> {
    const name = requireName(input.canonicalName);
    const { now, newId } = runtime();
    const at = now();
    return database.transaction((tx) => {
      assertPositionNameFree(name, undefined, tx);
      if (input.parentId) assertLivePosition(input.parentId, tx);
      const id = newId();
      tx.insert(positions)
        .values({
          id,
          origin: 'user',
          slug: mintSlug('POSITION', name, tx),
          canonicalName: name,
          description: input.description?.trim() || null,
          notes: input.notes?.trim() || null,
          parentPositionId: input.parentId ?? null,
          tier: 'CORE',
          createdAt: at,
          updatedAt: at,
        })
        .run();
      return rowOf('POSITION', id, tx);
    });
  },

  /**
   * Edits a live position. A rename checks PS-24 only when the name changes (case-insensitively)
   * and keeps the old name as an alias by default; parent `null` clears, a string must be live and
   * cycle-free. Imported-field edits set `user_edited_at` on seed rows.
   */
  async updatePosition(id: string, patch: Partial<PositionInput>, database: Db = getDb()): Promise<PositionRow> {
    const at = runtime().now();
    return database.transaction((tx) => {
      const row = loadLiveRow('POSITION', id, tx);
      const next: Partial<typeof positions.$inferInsert> = {};
      if (patch.canonicalName !== undefined) {
        const name = requireName(patch.canonicalName);
        if (!sameName(name, row.canonicalName)) assertPositionNameFree(name, id, tx);
        if (name !== row.canonicalName) {
          next.canonicalName = name;
          applyRenameAliases('POSITION', id, row.canonicalName, name, patch.keepOldNameAsAlias !== false, at, tx);
        }
      }
      if (patch.parentId !== undefined && (patch.parentId ?? null) !== row.parentPositionId) {
        if (patch.parentId) {
          assertLivePosition(patch.parentId, tx);
          assertNoParentCycle(id, patch.parentId, (pid) =>
            tx.select({ p: positions.parentPositionId }).from(positions).where(eq(positions.id, pid)).get()?.p,
          );
        }
        next.parentPositionId = patch.parentId ?? null;
      }
      if (patch.description !== undefined) next.description = patch.description.trim() || null;
      if (patch.notes !== undefined) next.notes = patch.notes.trim() || null;
      const edited = row.origin === 'seed' && touchesImported('POSITION', row, next);
      tx.update(positions).set({ ...next, updatedAt: at, ...(edited ? { userEditedAt: at } : {}) }).where(eq(positions.id, id)).run();
      return rowOf('POSITION', id, tx);
    });
  },

  /** User technique (edge): shape rule, live endpoints, exact-duplicate-edge rule (PS-24). */
  async createTechnique(input: TechniqueInput, database: Db = getDb()): Promise<TechniqueRow> {
    const name = requireName(input.name);
    validateTechniqueShape(input.type, input.toPositionId);
    const { now, newId } = runtime();
    const at = now();
    return database.transaction((tx) => {
      assertLivePosition(input.fromPositionId, tx);
      if (input.toPositionId) assertLivePosition(input.toPositionId, tx);
      const edge = { name, type: input.type, fromPositionId: input.fromPositionId, toPositionId: input.toPositionId ?? null };
      assertEdgeFree(edge, undefined, tx);
      const id = newId();
      tx.insert(techniques)
        .values({
          id,
          origin: 'user',
          slug: mintSlug('TECHNIQUE', name, tx),
          ...edge,
          appliesTo: input.appliesTo,
          perspective: input.perspective ?? null,
          description: input.description?.trim() || null,
          notes: input.notes?.trim() || null,
          tier: 'CORE',
          createdAt: at,
          updatedAt: at,
        })
        .run();
      return rowOf('TECHNIQUE', id, tx);
    });
  },

  /**
   * Edits a live technique. The edge duplicate check runs only when name (case-insensitively),
   * type, from or to change; changed endpoints must be live. Rename keeps the old name as alias.
   */
  async updateTechnique(id: string, patch: Partial<TechniqueInput>, database: Db = getDb()): Promise<TechniqueRow> {
    const at = runtime().now();
    return database.transaction((tx) => {
      const row = loadLiveRow('TECHNIQUE', id, tx);
      const name = patch.name !== undefined ? requireName(patch.name) : row.name;
      const type = patch.type ?? row.type;
      const fromPositionId = patch.fromPositionId ?? row.fromPositionId;
      const toPositionId = patch.toPositionId !== undefined ? patch.toPositionId ?? null : row.toPositionId;
      validateTechniqueShape(type, toPositionId);
      if (fromPositionId !== row.fromPositionId) assertLivePosition(fromPositionId, tx);
      if (toPositionId && toPositionId !== row.toPositionId) assertLivePosition(toPositionId, tx);
      const edgeChanged =
        !sameName(name, row.name) || type !== row.type || fromPositionId !== row.fromPositionId || toPositionId !== row.toPositionId;
      if (edgeChanged) assertEdgeFree({ name, type, fromPositionId, toPositionId }, id, tx);
      const next: Partial<typeof techniques.$inferInsert> = { type, fromPositionId, toPositionId };
      if (name !== row.name) {
        next.name = name;
        applyRenameAliases('TECHNIQUE', id, row.name, name, patch.keepOldNameAsAlias !== false, at, tx);
      }
      if (patch.appliesTo !== undefined) next.appliesTo = patch.appliesTo;
      if (patch.perspective !== undefined) next.perspective = patch.perspective ?? null;
      if (patch.description !== undefined) next.description = patch.description.trim() || null;
      if (patch.notes !== undefined) next.notes = patch.notes.trim() || null;
      const edited = row.origin === 'seed' && touchesImported('TECHNIQUE', row, next);
      tx.update(techniques).set({ ...next, updatedAt: at, ...(edited ? { userEditedAt: at } : {}) }).where(eq(techniques.id, id)).run();
      return rowOf('TECHNIQUE', id, tx);
    });
  },

  /** User subject; unique among live subjects (case-insensitive). */
  async createSubject(input: SubjectInput, database: Db = getDb()): Promise<SubjectRow> {
    const name = requireName(input.name);
    const { now, newId } = runtime();
    const at = now();
    return database.transaction((tx) => {
      assertSubjectNameFree(name, undefined, tx);
      const id = newId();
      tx.insert(subjects)
        .values({ id, origin: 'user', name, description: input.description?.trim() || null, createdAt: at, updatedAt: at })
        .run();
      return rowOf('SUBJECT', id, tx);
    });
  },

  /** Edits a live subject; the name rule runs only when the name changes. No aliases for subjects. */
  async updateSubject(id: string, patch: Partial<SubjectInput>, database: Db = getDb()): Promise<SubjectRow> {
    const at = runtime().now();
    return database.transaction((tx) => {
      const row = loadLiveRow('SUBJECT', id, tx);
      const next: Partial<typeof subjects.$inferInsert> = {};
      if (patch.name !== undefined) {
        const name = requireName(patch.name);
        if (!sameName(name, row.name)) assertSubjectNameFree(name, id, tx);
        if (name !== row.name) next.name = name;
      }
      if (patch.description !== undefined) next.description = patch.description.trim() || null;
      const edited = row.origin === 'seed' && touchesImported('SUBJECT', row, next);
      tx.update(subjects).set({ ...next, updatedAt: at, ...(edited ? { userEditedAt: at } : {}) }).where(eq(subjects.id, id)).run();
      return rowOf('SUBJECT', id, tx);
    });
  },

  /** Soft delete; never cascades (PS-13). Deleting twice is TAXONOMY_ROW_DELETED. */
  async softDelete<K extends TaxonomyKind>(kind: K, id: string, database: Db = getDb()): Promise<TaxonomyRowOf<K>> {
    const at = runtime().now();
    return database.transaction((tx) => {
      loadLiveRow(kind, id, tx);
      const t = TABLE[kind] as unknown as typeof positions;
      tx.update(t).set({ deletedAt: at, updatedAt: at }).where(eq(t.id, id)).run();
      return rowOf(kind, id, tx);
    });
  },

  /** Restores by id; a live row is returned unchanged. A subject whose name was taken meanwhile is TAXONOMY_NAME_DUPLICATE. */
  async undoDelete<K extends TaxonomyKind>(kind: K, id: string, database: Db = getDb()): Promise<TaxonomyRowOf<K>> {
    const at = runtime().now();
    return database.transaction((tx) => {
      const row = loadRow(kind, id, tx);
      if (row.deletedAt) {
        if (kind === 'SUBJECT') assertSubjectNameFree((row as typeof subjects.$inferSelect).name, id, tx);
        const t = TABLE[kind] as unknown as typeof positions;
        tx.update(t).set({ deletedAt: null, updatedAt: at }).where(eq(t.id, id)).run();
      }
      return rowOf(kind, id, tx);
    });
  },

  /** User alias of a live position/technique; equal to the canonical name or a live alias of the row → ALIAS_DUPLICATE. */
  async addAlias(kind: AliasKind, id: string, name: string, database: Db = getDb()): Promise<AliasRow> {
    const clean = requireName(name, 'ALIAS_NAME_REQUIRED');
    const at = runtime().now();
    return database.transaction((tx) => {
      const row = loadRow(kind, id, tx);
      if (row.deletedAt) throw new DomainError('TAXONOMY_ROW_NOT_FOUND');
      const canonical = kind === 'POSITION' ? (row as typeof positions.$inferSelect).canonicalName : (row as typeof techniques.$inferSelect).name;
      if (sameName(clean, canonical) || listAliasesSync(kind, id, tx).some((a) => sameName(a.name, clean)))
        throw new DomainError('ALIAS_DUPLICATE');
      const aliasId = insertAlias(kind, id, clean, at, tx);
      return stripDeleted(aliasRowById(aliasId, tx)!);
    });
  },

  /** Soft-deletes a live alias. */
  async removeAlias(aliasId: string, database: Db = getDb()): Promise<AliasRow> {
    const at = runtime().now();
    return database.transaction((tx) => {
      const a = aliasRowById(aliasId, tx) as (AliasRow & { deletedAt: string | null }) | undefined;
      if (!a || a.deletedAt) throw new DomainError('ALIAS_NOT_FOUND');
      tx.update(aliases).set({ deletedAt: at, updatedAt: at }).where(eq(aliases.id, aliasId)).run();
      return stripDeleted(a);
    });
  },

  /** Restores a removed alias; a live alias is returned unchanged; a live twin added meanwhile is ALIAS_DUPLICATE. */
  async undoRemoveAlias(aliasId: string, database: Db = getDb()): Promise<AliasRow> {
    const at = runtime().now();
    return database.transaction((tx) => {
      const a = aliasRowById(aliasId, tx) as (AliasRow & { deletedAt: string | null }) | undefined;
      if (!a) throw new DomainError('ALIAS_NOT_FOUND');
      if (a.deletedAt) {
        if (listAliasesSync(a.targetKind, a.targetId, tx).some((x) => sameName(x.name, a.name))) throw new DomainError('ALIAS_DUPLICATE');
        tx.update(aliases).set({ deletedAt: null, updatedAt: at }).where(eq(aliases.id, aliasId)).run();
      }
      return stripDeleted(a);
    });
  },
};
