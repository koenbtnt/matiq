import { and, asc, eq, isNull } from 'drizzle-orm';

import { getDb, type Db } from '../db/client';
import { cycles, positions, resourceLinks, resources as resourcesTable, resourceTypes as resourceTypesTable, subjects, techniques } from '../db/schema';
import { DomainError } from '../domain/errors';
import { blankToUndefined, normalizeResourceTitle, normalizeResourceUrl } from '../domain/resources/validate';
import { touchesImported } from '../domain/taxonomy/edit';
import type { ResourceInput, ResourceRow, ResourceStatus, ResourceTarget, ResourceTypeRow } from './contracts';
import { compact, opt } from './internal';
import { runtime } from './runtime';

type ResourceDbRow = typeof resourcesTable.$inferSelect;

const STATUS_ORDER: Record<ResourceStatus, number> = { TO_WATCH: 0, WATCHED: 1 };

const resourceCols = {
  id: resourcesTable.id,
  title: resourcesTable.title,
  url: resourcesTable.url,
  author: resourcesTable.author,
  resourceTypeId: resourcesTable.resourceTypeId,
  resourceTypeName: resourceTypesTable.name,
  notes: resourcesTable.notes,
  status: resourcesTable.status,
  origin: resourcesTable.origin,
};

const toRow = (r: { [K in keyof typeof resourceCols]: unknown }): ResourceRow =>
  compact({
    id: r.id as string,
    title: r.title as string,
    url: opt(r.url as string | null),
    author: opt(r.author as string | null),
    resourceTypeId: r.resourceTypeId as string,
    resourceTypeName: r.resourceTypeName as string,
    notes: opt(r.notes as string | null),
    status: r.status as ResourceStatus,
    origin: r.origin as 'seed' | 'user',
  });

/** Live resources linked (live link) to `target`; TO_WATCH first, then title. */
export function listResourcesSync(target: ResourceTarget, database: Db): ResourceRow[] {
  return database
    .select(resourceCols)
    .from(resourceLinks)
    .innerJoin(resourcesTable, and(eq(resourcesTable.id, resourceLinks.resourceId), isNull(resourcesTable.deletedAt)))
    .innerJoin(resourceTypesTable, eq(resourceTypesTable.id, resourcesTable.resourceTypeId))
    .where(and(eq(resourceLinks.targetKind, target.kind), eq(resourceLinks.targetId, target.id), isNull(resourceLinks.deletedAt)))
    .all()
    .map(toRow)
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.title.localeCompare(b.title, 'en'));
}

function resourceRowSync(id: string, database: Db): ResourceRow {
  const r = database
    .select(resourceCols)
    .from(resourcesTable)
    .innerJoin(resourceTypesTable, eq(resourceTypesTable.id, resourcesTable.resourceTypeId))
    .where(eq(resourcesTable.id, id))
    .get();
  if (!r) throw new DomainError('RESOURCE_NOT_FOUND');
  return toRow(r);
}

function liveResource(id: string, database: Db): ResourceDbRow {
  const r = database.select().from(resourcesTable).where(and(eq(resourcesTable.id, id), isNull(resourcesTable.deletedAt))).get();
  if (!r) throw new DomainError('RESOURCE_NOT_FOUND');
  return r;
}

function assertTypeLive(id: string, database: Db): void {
  const t = database
    .select({ id: resourceTypesTable.id })
    .from(resourceTypesTable)
    .where(and(eq(resourceTypesTable.id, id), isNull(resourceTypesTable.deletedAt)))
    .get();
  if (!t) throw new DomainError('RESOURCE_TYPE_NOT_FOUND');
}

const TARGET_TABLE = { TECHNIQUE: techniques, POSITION: positions, SUBJECT: subjects, CYCLE: cycles } as const;

function assertTargetLive(target: ResourceTarget, database: Db): void {
  const table = TARGET_TABLE[target.kind];
  if (!table) throw new DomainError('RESOURCE_LINK_TARGET_NOT_FOUND');
  const hit = database.select({ id: table.id }).from(table).where(and(eq(table.id, target.id), isNull(table.deletedAt))).get();
  if (!hit) throw new DomainError('RESOURCE_LINK_TARGET_NOT_FOUND');
}

function linkSync(resourceId: string, target: ResourceTarget, now: string, database: Db): void {
  const existing = database
    .select({ id: resourceLinks.id })
    .from(resourceLinks)
    .where(
      and(
        eq(resourceLinks.resourceId, resourceId),
        eq(resourceLinks.targetKind, target.kind),
        eq(resourceLinks.targetId, target.id),
        isNull(resourceLinks.deletedAt),
      ),
    )
    .get();
  if (existing) return;
  database
    .insert(resourceLinks)
    .values({ id: runtime().newId(), resourceId, targetKind: target.kind, targetId: target.id, createdAt: now, updatedAt: now })
    .run();
}

export const resources = {
  /** Live resources linked to `target`, TO_WATCH first then title. */
  async listFor(target: ResourceTarget, database: Db = getDb()): Promise<ResourceRow[]> {
    return listResourcesSync(target, database);
  },

  /** Creates a user resource and links it to `target` in one transaction. */
  async create(input: ResourceInput, target: ResourceTarget, database: Db = getDb()): Promise<ResourceRow> {
    const title = normalizeResourceTitle(input.title);
    const url = normalizeResourceUrl(input.url);
    const { now, newId } = runtime();
    const at = now();
    return database.transaction((tx) => {
      assertTypeLive(input.resourceTypeId, tx);
      assertTargetLive(target, tx);
      const id = newId();
      tx.insert(resourcesTable)
        .values({
          id,
          origin: 'user',
          title,
          url: url ?? null,
          author: blankToUndefined(input.author) ?? null,
          resourceTypeId: input.resourceTypeId,
          notes: blankToUndefined(input.notes) ?? null,
          status: input.status ?? 'TO_WATCH',
          createdAt: at,
          updatedAt: at,
        })
        .run();
      linkSync(id, target, at, tx);
      return resourceRowSync(id, tx);
    });
  },

  /** Edits a live resource; title/url/author/type edits set `user_edited_at` on seed rows (plan §8.1). */
  async update(id: string, patch: Partial<ResourceInput>, database: Db = getDb()): Promise<ResourceRow> {
    const at = runtime().now();
    return database.transaction((tx) => {
      const row = liveResource(id, tx);
      const next: Partial<ResourceDbRow> = {};
      if (patch.title !== undefined) next.title = normalizeResourceTitle(patch.title);
      if (patch.url !== undefined) next.url = normalizeResourceUrl(patch.url) ?? null;
      if (patch.author !== undefined) next.author = blankToUndefined(patch.author) ?? null;
      if (patch.notes !== undefined) next.notes = blankToUndefined(patch.notes) ?? null;
      if (patch.status !== undefined) next.status = patch.status;
      if (patch.resourceTypeId !== undefined) {
        assertTypeLive(patch.resourceTypeId, tx);
        next.resourceTypeId = patch.resourceTypeId;
      }
      const edited = row.origin === 'seed' && touchesImported('RESOURCE', row, next);
      tx.update(resourcesTable)
        .set({ ...next, updatedAt: at, ...(edited ? { userEditedAt: at } : {}) })
        .where(eq(resourcesTable.id, id))
        .run();
      return resourceRowSync(id, tx);
    });
  },

  /** TO_WATCH ↔ WATCHED; never sets `user_edited_at`. */
  async setStatus(id: string, status: ResourceStatus, database: Db = getDb()): Promise<ResourceRow> {
    const at = runtime().now();
    return database.transaction((tx) => {
      liveResource(id, tx);
      tx.update(resourcesTable).set({ status, updatedAt: at }).where(eq(resourcesTable.id, id)).run();
      return resourceRowSync(id, tx);
    });
  },

  /** Soft-deletes the resource and all its live links (same timestamp, so undo restores exactly those). */
  async softDelete(id: string, database: Db = getDb()): Promise<ResourceRow> {
    const at = runtime().now();
    return database.transaction((tx) => {
      liveResource(id, tx);
      tx.update(resourceLinks).set({ deletedAt: at, updatedAt: at }).where(and(eq(resourceLinks.resourceId, id), isNull(resourceLinks.deletedAt))).run();
      tx.update(resourcesTable).set({ deletedAt: at, updatedAt: at }).where(eq(resourcesTable.id, id)).run();
      return resourceRowSync(id, tx);
    });
  },

  /** Restores a soft-deleted resource and the links deleted with it; a live resource is returned unchanged. */
  async undoDelete(id: string, database: Db = getDb()): Promise<ResourceRow> {
    const at = runtime().now();
    return database.transaction((tx) => {
      const row = tx.select().from(resourcesTable).where(eq(resourcesTable.id, id)).get();
      if (!row) throw new DomainError('RESOURCE_NOT_FOUND');
      if (row.deletedAt) {
        tx.update(resourceLinks)
          .set({ deletedAt: null, updatedAt: at })
          .where(and(eq(resourceLinks.resourceId, id), eq(resourceLinks.deletedAt, row.deletedAt)))
          .run();
        tx.update(resourcesTable).set({ deletedAt: null, updatedAt: at }).where(eq(resourcesTable.id, id)).run();
      }
      return resourceRowSync(id, tx);
    });
  },

  /** Links a live resource to a live target (idempotent). */
  async link(id: string, target: ResourceTarget, database: Db = getDb()): Promise<void> {
    const at = runtime().now();
    database.transaction((tx) => {
      liveResource(id, tx);
      assertTargetLive(target, tx);
      linkSync(id, target, at, tx);
    });
  },

  /** Soft-deletes the live link between a resource and a target (no-op when none). */
  async unlink(id: string, target: ResourceTarget, database: Db = getDb()): Promise<void> {
    const at = runtime().now();
    database.transaction((tx) => {
      liveResource(id, tx);
      tx.update(resourceLinks)
        .set({ deletedAt: at, updatedAt: at })
        .where(
          and(
            eq(resourceLinks.resourceId, id),
            eq(resourceLinks.targetKind, target.kind),
            eq(resourceLinks.targetId, target.id),
            isNull(resourceLinks.deletedAt),
          ),
        )
        .run();
    });
  },
};

export const resourceTypes = {
  /** Live resource types by sort order (seeded list; editing is sprint 3, ruling Q2). */
  async list(database: Db = getDb()): Promise<ResourceTypeRow[]> {
    return database
      .select({ id: resourceTypesTable.id, name: resourceTypesTable.name, sortOrder: resourceTypesTable.sortOrder })
      .from(resourceTypesTable)
      .where(isNull(resourceTypesTable.deletedAt))
      .orderBy(asc(resourceTypesTable.sortOrder))
      .all();
  },
};
