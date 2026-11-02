/**
 * Taxonomy merge and undo (plan §7.3–§7.4, PS-14, review B1). One transaction each; every change is
 * recorded in `taxonomy_merges.payload` so undo restores the exact prior values.
 */
import { and, desc, eq, gt, isNull, ne, or } from 'drizzle-orm';

import { getDb, type Db } from '../db/client';
import {
  aliases, cycleFocuses, positions, resourceLinks, sessionFocuses, sessionTechniques, subjects, submissions, taxonomyMerges,
  techniques,
} from '../db/schema';
import { DomainError } from '../domain/errors';
import { sameName } from '../domain/taxonomy/edit';
import { assertMergeable, foldFocus, joinNotes, movedCounts, type MergePayloadV1 } from '../domain/taxonomy/merge';
import type { MergeResult, TaxonomyKind } from './contracts';
import { runtime } from './runtime';
import { listAliasesSync } from './taxonomyRows';

/** Tables a merge may touch, by their SQL name (payload entries name them). */
const TABLES = {
  positions,
  techniques,
  subjects,
  aliases,
  session_focuses: sessionFocuses,
  session_techniques: sessionTechniques,
  submissions,
  cycle_focuses: cycleFocuses,
  resource_links: resourceLinks,
} as const;
type TableName = keyof typeof TABLES;

/** Payload `column` (SQL name) → drizzle property, per table. */
const COLUMN_PROP: Record<string, string> = {
  focus_ref_id: 'focusRefId',
  target_id: 'targetId',
  from_position_id: 'fromPositionId',
  to_position_id: 'toPositionId',
  parent_position_id: 'parentPositionId',
  technique_id: 'techniqueId',
  session_focus_id: 'sessionFocusId',
};

const ENTITY = { POSITION: positions, TECHNIQUE: techniques, SUBJECT: subjects } as const;

type Ctx = { tx: Db; now: string; payload: MergePayloadV1 };

// Drizzle's table types do not unify across tables; these helpers address columns by property name.
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic table access by payload name
type Loose = any;
const tbl = (name: TableName): Loose => TABLES[name];
const col = (name: TableName, prop: string): Loose => (TABLES[name] as Loose)[prop];

function setColumn(ctx: Ctx, table: TableName, id: string, column: string, from: string, to: string | null): void {
  const prop = COLUMN_PROP[column]!;
  ctx.tx
    .update(tbl(table))
    .set({ [prop]: to, updatedAt: ctx.now } as never)
    .where(eq(col(table, 'id'), id))
    .run();
  ctx.payload.moved.push({ table, id, column, from });
}

function softDeleteRow(ctx: Ctx, table: TableName, id: string): void {
  ctx.tx.update(tbl(table)).set({ deletedAt: ctx.now, updatedAt: ctx.now } as never).where(eq(col(table, 'id'), id)).run();
}

/* ---------- focus refs (session_focuses, cycle_focuses) ---------- */

/** B1: re-points the live attachments of a folded loser focus row to the survivor focus row (folding collisions). */
function moveAttachments(ctx: Ctx, loserFocusId: string, survivorFocusId: string): void {
  const { tx } = ctx;
  const rows = tx
    .select()
    .from(sessionTechniques)
    .where(and(eq(sessionTechniques.sessionFocusId, loserFocusId), isNull(sessionTechniques.deletedAt)))
    .all();
  for (const r of rows) {
    const twin = tx
      .select()
      .from(sessionTechniques)
      .where(
        and(
          eq(sessionTechniques.sessionId, r.sessionId),
          eq(sessionTechniques.sessionFocusId, survivorFocusId),
          eq(sessionTechniques.techniqueId, r.techniqueId),
          isNull(sessionTechniques.deletedAt),
        ),
      )
      .get();
    if (twin) {
      ctx.payload.folded.push({ table: 'session_techniques', loserId: r.id, survivorId: twin.id, survivorBefore: { ...twin } });
      tx.update(sessionTechniques).set({ note: joinNotes(twin.note, r.note), updatedAt: ctx.now }).where(eq(sessionTechniques.id, twin.id)).run();
      softDeleteRow(ctx, 'session_techniques', r.id);
    } else {
      setColumn(ctx, 'session_techniques', r.id, 'session_focus_id', loserFocusId, survivorFocusId);
    }
  }
}

function moveSessionFocuses(ctx: Ctx, kind: 'POSITION' | 'SUBJECT', fromId: string, intoId: string): void {
  const { tx } = ctx;
  const rows = tx
    .select()
    .from(sessionFocuses)
    .where(and(eq(sessionFocuses.focusKind, kind), eq(sessionFocuses.focusRefId, fromId), isNull(sessionFocuses.deletedAt)))
    .all();
  for (const loser of rows) {
    const survivor = tx
      .select()
      .from(sessionFocuses)
      .where(
        and(
          eq(sessionFocuses.sessionId, loser.sessionId),
          eq(sessionFocuses.focusKind, kind),
          eq(sessionFocuses.focusRefId, intoId),
          isNull(sessionFocuses.deletedAt),
        ),
      )
      .get();
    if (!survivor) {
      // Moved without folding: attachments keep their session_focus_id, which now belongs to the survivor's ref.
      setColumn(ctx, 'session_focuses', loser.id, 'focus_ref_id', fromId, intoId);
      continue;
    }
    ctx.payload.folded.push({ table: 'session_focuses', loserId: loser.id, survivorId: survivor.id, survivorBefore: { ...survivor } });
    tx.update(sessionFocuses).set({ ...foldFocus(survivor, loser), updatedAt: ctx.now }).where(eq(sessionFocuses.id, survivor.id)).run();
    softDeleteRow(ctx, 'session_focuses', loser.id);
    moveAttachments(ctx, loser.id, survivor.id);
  }
}

function moveCycleFocuses(ctx: Ctx, kind: 'POSITION' | 'SUBJECT', fromId: string, intoId: string): void {
  const { tx } = ctx;
  for (const loser of tx
    .select()
    .from(cycleFocuses)
    .where(and(eq(cycleFocuses.focusKind, kind), eq(cycleFocuses.focusRefId, fromId), isNull(cycleFocuses.deletedAt)))
    .all()) {
    const survivor = tx
      .select()
      .from(cycleFocuses)
      .where(
        and(eq(cycleFocuses.cycleId, loser.cycleId), eq(cycleFocuses.focusKind, kind), eq(cycleFocuses.focusRefId, intoId), isNull(cycleFocuses.deletedAt)),
      )
      .get();
    if (survivor) {
      ctx.payload.folded.push({ table: 'cycle_focuses', loserId: loser.id, survivorId: survivor.id, survivorBefore: { ...survivor } });
      softDeleteRow(ctx, 'cycle_focuses', loser.id);
    } else setColumn(ctx, 'cycle_focuses', loser.id, 'focus_ref_id', fromId, intoId);
  }
}

function moveResourceLinks(ctx: Ctx, kind: TaxonomyKind, fromId: string, intoId: string): void {
  const { tx } = ctx;
  for (const loser of tx
    .select()
    .from(resourceLinks)
    .where(and(eq(resourceLinks.targetKind, kind), eq(resourceLinks.targetId, fromId), isNull(resourceLinks.deletedAt)))
    .all()) {
    const survivor = tx
      .select()
      .from(resourceLinks)
      .where(
        and(eq(resourceLinks.resourceId, loser.resourceId), eq(resourceLinks.targetKind, kind), eq(resourceLinks.targetId, intoId), isNull(resourceLinks.deletedAt)),
      )
      .get();
    if (survivor) {
      ctx.payload.folded.push({ table: 'resource_links', loserId: loser.id, survivorId: survivor.id, survivorBefore: { ...survivor } });
      softDeleteRow(ctx, 'resource_links', loser.id);
    } else setColumn(ctx, 'resource_links', loser.id, 'target_id', fromId, intoId);
  }
}

/** Loser aliases move to the survivor; one equal to a survivor alias or its canonical name folds (soft-deleted). */
function moveAliases(ctx: Ctx, kind: 'POSITION' | 'TECHNIQUE', fromId: string, intoId: string, survivorName: string): void {
  const survivorAliases = listAliasesSync(kind, intoId, ctx.tx);
  for (const a of listAliasesSync(kind, fromId, ctx.tx)) {
    const twin = survivorAliases.find((s) => sameName(s.name, a.name));
    if (twin || sameName(a.name, survivorName)) {
      ctx.payload.folded.push({ table: 'aliases', loserId: a.id, survivorId: twin?.id ?? null, survivorBefore: null });
      softDeleteRow(ctx, 'aliases', a.id);
    } else setColumn(ctx, 'aliases', a.id, 'target_id', fromId, intoId);
  }
}

/** Every row (live or deleted) whose FK column points at the loser is re-pointed (keeps the graph consistent). */
function moveFk(ctx: Ctx, table: 'techniques' | 'positions', column: string, fromId: string, intoId: string, exceptId?: string): void {
  const prop = COLUMN_PROP[column]!;
  const rows = ctx.tx
    .select({ id: col(table, 'id') as never })
    .from(tbl(table))
    .where(and(eq(col(table, prop), fromId), exceptId ? ne(col(table, 'id'), exceptId) : undefined))
    .all() as { id: string }[];
  for (const r of rows) setColumn(ctx, table, r.id, column, fromId, intoId);
}

function moveTechniqueRefs(ctx: Ctx, fromId: string, intoId: string): void {
  const { tx } = ctx;
  for (const r of tx
    .select()
    .from(sessionTechniques)
    .where(and(eq(sessionTechniques.techniqueId, fromId), isNull(sessionTechniques.deletedAt)))
    .all()) {
    const twin = tx
      .select()
      .from(sessionTechniques)
      .where(
        and(
          eq(sessionTechniques.sessionId, r.sessionId),
          r.sessionFocusId ? eq(sessionTechniques.sessionFocusId, r.sessionFocusId) : isNull(sessionTechniques.sessionFocusId),
          eq(sessionTechniques.techniqueId, intoId),
          isNull(sessionTechniques.deletedAt),
        ),
      )
      .get();
    if (twin) {
      ctx.payload.folded.push({ table: 'session_techniques', loserId: r.id, survivorId: twin.id, survivorBefore: { ...twin } });
      tx.update(sessionTechniques).set({ note: joinNotes(twin.note, r.note), updatedAt: ctx.now }).where(eq(sessionTechniques.id, twin.id)).run();
      softDeleteRow(ctx, 'session_techniques', r.id);
    } else setColumn(ctx, 'session_techniques', r.id, 'technique_id', fromId, intoId);
  }
  for (const s of tx
    .select({ id: submissions.id })
    .from(submissions)
    .where(and(eq(submissions.techniqueId, fromId), isNull(submissions.deletedAt)))
    .all())
    setColumn(ctx, 'submissions', s.id, 'technique_id', fromId, intoId);
}

const nameOf = (kind: TaxonomyKind, row: Record<string, unknown>): string =>
  (kind === 'POSITION' ? row.canonicalName : row.name) as string;

function resultOf(mergeId: string, p: MergePayloadV1): MergeResult {
  return { mergeId, kind: p.kind, fromId: p.fromId, intoId: p.intoId, moved: movedCounts(p.moved), folded: p.folded.length, aliasesAdded: p.aliasesAdded.length };
}

export const taxonomyMergeOps = {
  /**
   * Merges `fromId` (loser) into `intoId` (survivor) of the same kind: re-points every reference
   * (§7.3), folds live-unique collisions, turns the loser's name and aliases into survivor aliases,
   * soft-deletes the loser and records the payload. Returns per-table move counts.
   */
  async merge(kind: TaxonomyKind, fromId: string, intoId: string, database: Db = getDb()): Promise<MergeResult> {
    if (fromId === intoId) throw new DomainError('TAXONOMY_SELF_MERGE');
    const { now, newId } = runtime();
    const at = now();
    return database.transaction((tx) => {
      const entity = ENTITY[kind];
      const loser = tx.select().from(entity).where(eq(entity.id, fromId)).get() as Record<string, unknown> | undefined;
      const survivor = tx.select().from(entity).where(eq(entity.id, intoId)).get() as Record<string, unknown> | undefined;
      if (!loser || !survivor) throw new DomainError('TAXONOMY_ROW_NOT_FOUND');
      if (loser.deletedAt || survivor.deletedAt) throw new DomainError('TAXONOMY_ROW_DELETED');
      assertMergeable(fromId, intoId, kind === 'TECHNIQUE' ? { from: loser.type as string, into: survivor.type as string } : undefined);

      const payload: MergePayloadV1 = {
        v: 1,
        kind,
        fromId,
        intoId,
        loser: { ...loser },
        survivorBefore: { parentPositionId: (survivor.parentPositionId as string | null | undefined) ?? null },
        moved: [],
        folded: [],
        aliasesAdded: [],
      };
      const ctx: Ctx = { tx, now: at, payload };
      const survivorName = nameOf(kind, survivor);

      if (kind === 'POSITION' || kind === 'SUBJECT') {
        moveSessionFocuses(ctx, kind, fromId, intoId);
        moveCycleFocuses(ctx, kind, fromId, intoId);
      }
      moveResourceLinks(ctx, kind, fromId, intoId);
      if (kind === 'POSITION') {
        moveAliases(ctx, 'POSITION', fromId, intoId, survivorName);
        moveFk(ctx, 'techniques', 'from_position_id', fromId, intoId);
        moveFk(ctx, 'techniques', 'to_position_id', fromId, intoId);
        moveFk(ctx, 'positions', 'parent_position_id', fromId, intoId, intoId);
        if (survivor.parentPositionId === fromId) {
          tx.update(positions).set({ parentPositionId: (loser.parentPositionId as string | null) ?? null, updatedAt: at }).where(eq(positions.id, intoId)).run();
        }
      }
      if (kind === 'TECHNIQUE') {
        moveTechniqueRefs(ctx, fromId, intoId);
        moveAliases(ctx, 'TECHNIQUE', fromId, intoId, survivorName);
      }
      if (kind !== 'SUBJECT') {
        const aliasKind = kind;
        const loserName = nameOf(kind, loser);
        const live = listAliasesSync(aliasKind, intoId, tx);
        if (!sameName(loserName, survivorName) && !live.some((a) => sameName(a.name, loserName))) {
          const id = newId();
          tx.insert(aliases).values({ id, origin: 'user', targetKind: aliasKind, targetId: intoId, name: loserName, createdAt: at, updatedAt: at }).run();
          payload.aliasesAdded.push(id);
        }
      }
      tx.update(entity).set({ deletedAt: at, updatedAt: at, userEditedAt: at } as never).where(eq(entity.id, fromId)).run();

      const mergeId = newId();
      tx.insert(taxonomyMerges)
        .values({ id: mergeId, targetKind: kind, fromId, intoId, payload: JSON.stringify(payload), createdAt: at, updatedAt: at })
        .run();
      return resultOf(mergeId, payload);
    });
  },

  /**
   * Reverses a merge from its payload while no later live merge names either id
   * (MERGE_NOT_LATEST): moved columns restored in reverse order, folded survivors restored, folded
   * losers un-deleted, added aliases soft-deleted, the survivor's parent and the loser restored.
   */
  async undoMerge(mergeId: string, database: Db = getDb()): Promise<MergeResult> {
    const at = runtime().now();
    return database.transaction((tx) => {
      const m = tx.select().from(taxonomyMerges).where(and(eq(taxonomyMerges.id, mergeId), isNull(taxonomyMerges.deletedAt))).get();
      if (!m) throw new DomainError('MERGE_NOT_FOUND');
      if (m.undoneAt) throw new DomainError('MERGE_ALREADY_UNDONE');
      const later = tx
        .select({ id: taxonomyMerges.id })
        .from(taxonomyMerges)
        .where(
          and(
            ne(taxonomyMerges.id, m.id),
            isNull(taxonomyMerges.deletedAt),
            isNull(taxonomyMerges.undoneAt),
            gt(taxonomyMerges.createdAt, m.createdAt),
            or(
              eq(taxonomyMerges.fromId, m.fromId),
              eq(taxonomyMerges.intoId, m.fromId),
              eq(taxonomyMerges.fromId, m.intoId),
              eq(taxonomyMerges.intoId, m.intoId),
            ),
          ),
        )
        .orderBy(desc(taxonomyMerges.createdAt))
        .get();
      if (later) throw new DomainError('MERGE_NOT_LATEST');
      const p = JSON.parse(m.payload) as MergePayloadV1;

      for (const id of p.aliasesAdded) tx.update(aliases).set({ deletedAt: at, updatedAt: at }).where(eq(aliases.id, id)).run();
      for (const mv of [...p.moved].reverse()) {
        const table = mv.table as TableName;
        tx.update(tbl(table)).set({ [COLUMN_PROP[mv.column]!]: mv.from, updatedAt: at } as never).where(eq(col(table, 'id'), mv.id)).run();
      }
      for (const f of [...p.folded].reverse()) {
        const table = f.table as TableName;
        if (f.survivorId && f.survivorBefore) {
          const { id: _id, createdAt: _c, ...restore } = f.survivorBefore;
          tx.update(tbl(table)).set({ ...restore, updatedAt: at } as never).where(eq(col(table, 'id'), f.survivorId)).run();
        }
        tx.update(tbl(table)).set({ deletedAt: null, updatedAt: at } as never).where(eq(col(table, 'id'), f.loserId)).run();
      }
      const entity = ENTITY[p.kind];
      if (p.kind === 'POSITION')
        tx.update(positions).set({ parentPositionId: p.survivorBefore.parentPositionId, updatedAt: at }).where(eq(positions.id, p.intoId)).run();
      tx.update(entity)
        .set({ deletedAt: (p.loser.deletedAt as string | null) ?? null, userEditedAt: (p.loser.userEditedAt as string | null) ?? null, updatedAt: at } as never)
        .where(eq(entity.id, p.fromId))
        .run();
      tx.update(taxonomyMerges).set({ undoneAt: at, updatedAt: at }).where(eq(taxonomyMerges.id, m.id)).run();
      return resultOf(m.id, p);
    });
  },
};

