import { and, eq, isNotNull, isNull } from 'drizzle-orm';

import type { Db } from '../db/client';
import {
  aliases, positions, resourceLinks, resources, resourceTypes, sessionTypes, subjects, techniques,
} from '../db/schema';
import { DomainError } from '../domain/errors';
import { decideImport, mayRetire, seedSlug, type ImportDecision } from '../domain/taxonomy/importRelease';
import {
  assertCatalogSeed, assertTaxonomySeed, compareReleases, type CatalogSeed, type SeedSource, type TaxonomySeed,
} from '../domain/taxonomy/seed';
import { getAppMetaSync, setAppMetaSync } from './appMeta';
import type { ImportReport } from './contracts';

/* eslint-disable @typescript-eslint/no-explicit-any -- one generic upsert over eight imported tables */
type ImportedTable =
  | typeof positions | typeof techniques | typeof aliases | typeof resources
  | typeof sessionTypes | typeof subjects | typeof resourceTypes;

type ExistingImported = {
  id: string;
  origin: 'seed' | 'user';
  source: SeedSource | null;
  sourceId: string | null;
  userEditedAt: string | null;
  deletedAt: string | null;
  [column: string]: unknown;
};

export type Incoming = {
  id: string;
  source: SeedSource;
  sourceId: string;
  sourceVersion: string;
  /** Imported fields (camelCase column keys) compared and written. */
  values: Record<string, unknown>;
  /** Written on insert only (e.g. a de-clashed slug). */
  insertOnly?: Record<string, unknown>;
};

const key = (source: string | null, sourceId: string | null) => `${source}|${sourceId}`;
const same = (a: unknown, b: unknown) => (a ?? null) === (b ?? null);

/** All rows with provenance, keyed `source|source_id`; a live row wins over soft-deleted ones. */
function existingBySource(table: ImportedTable, tx: Db): Map<string, ExistingImported> {
  const rows = (tx as any).select().from(table).where(isNotNull(table.sourceId)).all() as ExistingImported[];
  const out = new Map<string, ExistingImported>();
  for (const r of rows) {
    const k = key(r.source, r.sourceId);
    const prev = out.get(k);
    if (!prev || (prev.deletedAt !== null && r.deletedAt === null)) out.set(k, r);
  }
  return out;
}

export type UpsertResult = { ids: Map<string, string>; decisions: ImportDecision[] };

/**
 * Upserts seed rows by `(source, source_id)` with the D-07 rule: add new, update untouched live
 * seed rows whose imported fields changed, skip user-edited / soft-deleted / user-owned rows.
 * Returns `sourceId → id` for every incoming row (existing id when present).
 */
export function upsertImported(table: ImportedTable, incoming: readonly Incoming[], now: string, tx: Db): UpsertResult {
  const existing = existingBySource(table, tx);
  const ids = new Map<string, string>();
  const decisions: ImportDecision[] = [];
  const inserts: Record<string, unknown>[] = [];
  for (const row of incoming) {
    const prev = existing.get(key(row.source, row.sourceId));
    const changed =
      !!prev &&
      (!same(prev.sourceVersion, row.sourceVersion) || Object.entries(row.values).some(([k, v]) => !same(prev[k], v)));
    const decision = decideImport(prev, changed);
    decisions.push(decision);
    ids.set(row.sourceId, prev?.id ?? row.id);
    if (decision === 'add') {
      inserts.push({
        ...row.values,
        ...row.insertOnly,
        id: row.id,
        origin: 'seed',
        source: row.source,
        sourceId: row.sourceId,
        sourceVersion: row.sourceVersion,
        createdAt: now,
        updatedAt: now,
      });
    } else if (decision === 'update' && prev) {
      (tx as any)
        .update(table)
        .set({ ...row.values, sourceVersion: row.sourceVersion, updatedAt: now })
        .where(eq(table.id, prev.id))
        .run();
    }
  }
  for (let i = 0; i < inserts.length; i += 50) (tx as any).insert(table).values(inserts.slice(i, i + 50)).run();
  return { ids, decisions };
}

const count = (d: readonly ImportDecision[], ...which: ImportDecision[]) => d.filter((x) => which.includes(x)).length;

/** Live slugs not owned by the given (source, sourceId) set — what a new seed slug must avoid. */
function takenSlugs(table: typeof positions | typeof techniques, tx: Db): Set<string> {
  return new Set(
    (tx as any).select({ slug: table.slug }).from(table).where(isNull(table.deletedAt)).all().map((r: { slug: string }) => r.slug),
  );
}

/** Orders positions so every parent precedes its children (FKs are checked per statement). */
function parentsFirst<T extends { sourceId: string; parentSourceId?: string }>(rows: readonly T[]): T[] {
  const bySource = new Map(rows.map((r) => [r.sourceId, r]));
  const depth = (r: T, seen = new Set<string>()): number => {
    const parent = r.parentSourceId ? bySource.get(r.parentSourceId) : undefined;
    if (!parent || seen.has(r.sourceId)) return 0;
    seen.add(r.sourceId);
    return 1 + depth(parent, seen);
  };
  return [...rows].map((r) => ({ r, d: depth(r) })).sort((a, b) => a.d - b.d).map(({ r }) => r);
}

/** Taxonomy release import (plan §4 `taxonomy.importRelease`); the caller supplies the transaction. */
export function importTaxonomySync(seed: TaxonomySeed, now: string, tx: Db): ImportReport {
  assertTaxonomySeed(seed);
  const installed = getAppMetaSync('taxonomy_release', tx);
  if (installed && compareReleases(seed.release, installed) < 0) throw new DomainError('SEED_RELEASE_OLDER');

  const decisions: ImportDecision[] = [];
  const existingPositions = existingBySource(positions, tx);
  const seedPositionIds = new Map(
    seed.positions.map((p) => [p.sourceId, existingPositions.get(key(p.source, p.sourceId))?.id ?? p.id]),
  );

  const posSlugs = takenSlugs(positions, tx);
  const pos = upsertImported(
    positions,
    parentsFirst(seed.positions).map((p) => {
      const isNew = !existingPositions.has(key(p.source, p.sourceId));
      const slug = isNew ? seedSlug(p.slug, posSlugs) : undefined;
      if (slug) posSlugs.add(slug);
      return {
        id: p.id,
        source: p.source,
        sourceId: p.sourceId,
        sourceVersion: p.sourceVersion,
        values: {
          canonicalName: p.canonicalName,
          description: p.description ?? null,
          tier: p.tier,
          parentPositionId: p.parentSourceId ? (seedPositionIds.get(p.parentSourceId) ?? null) : null,
        },
        insertOnly: { slug },
      };
    }),
    now,
    tx,
  );
  decisions.push(...pos.decisions);

  const techSlugs = takenSlugs(techniques, tx);
  const existingTechniques = existingBySource(techniques, tx);
  const tech = upsertImported(
    techniques,
    seed.techniques.map((t) => {
      const isNew = !existingTechniques.has(key(t.source, t.sourceId));
      const slug = isNew ? seedSlug(t.slug, techSlugs) : undefined;
      if (slug) techSlugs.add(slug);
      const from = pos.ids.get(t.fromSourceId);
      const to = t.toSourceId ? pos.ids.get(t.toSourceId) : undefined;
      if (!from || (t.toSourceId && !to)) throw new DomainError('SEED_FORMAT_UNSUPPORTED', { sourceId: t.sourceId });
      return {
        id: t.id,
        source: t.source,
        sourceId: t.sourceId,
        sourceVersion: t.sourceVersion,
        values: {
          name: t.name,
          type: t.type,
          fromPositionId: from,
          toPositionId: to ?? null,
          appliesTo: t.appliesTo,
          perspective: t.perspective ?? null,
          description: t.description ?? null,
          tier: t.tier,
        },
        insertOnly: { slug },
      };
    }),
    now,
    tx,
  );
  decisions.push(...tech.decisions);

  const al = upsertImported(
    aliases,
    seed.aliases.map((a) => {
      const target = (a.targetKind === 'POSITION' ? pos.ids : tech.ids).get(a.targetSourceId);
      if (!target) throw new DomainError('SEED_FORMAT_UNSUPPORTED', { sourceId: a.sourceId });
      return {
        id: a.id,
        source: a.source,
        sourceId: a.sourceId,
        sourceVersion: a.sourceVersion,
        values: { targetKind: a.targetKind, targetId: target, name: a.name },
      };
    }),
    now,
    tx,
  );
  decisions.push(...al.decisions);

  const typeIds = resourceTypeIds(tx);
  const res = upsertImported(
    resources,
    seed.resources.map((r) => {
      const typeId = typeIds.get(r.resourceTypeKey);
      if (!typeId) throw new DomainError('SEED_FORMAT_UNSUPPORTED', { sourceId: r.sourceId });
      return {
        id: r.id,
        source: r.source,
        sourceId: r.sourceId,
        sourceVersion: r.sourceVersion,
        values: { title: r.title, url: r.url ?? null, author: r.author ?? null, resourceTypeId: typeId, notes: r.notes ?? null },
      };
    }),
    now,
    tx,
  );
  decisions.push(...res.decisions);

  // Links carry no provenance columns: their registry id is the identity; existing ones are kept.
  const existingLinks = new Set(
    tx.select({ id: resourceLinks.id }).from(resourceLinks).all().map((r) => r.id),
  );
  const newLinks = seed.resourceLinks
    .filter((l) => !existingLinks.has(l.id))
    .map((l) => {
      const resourceId = res.ids.get(l.resourceSourceId);
      const targetId = tech.ids.get(l.targetSourceId);
      if (!resourceId || !targetId) throw new DomainError('SEED_FORMAT_UNSUPPORTED', { sourceId: l.id });
      return { id: l.id, resourceId, targetKind: l.targetKind, targetId, createdAt: now, updatedAt: now };
    });
  for (let i = 0; i < newLinks.length; i += 100) tx.insert(resourceLinks).values(newLinks.slice(i, i + 100)).run();

  let retired = 0;
  for (const r of seed.retired ?? []) {
    for (const table of [positions, techniques, aliases, resources] as const) {
      const row = existingBySource(table, tx).get(key(r.source, r.sourceId));
      if (mayRetire(row) && row) {
        (tx as any).update(table).set({ deletedAt: now, updatedAt: now }).where(eq(table.id, row.id)).run();
        retired += 1;
      }
    }
  }

  setAppMetaSync('taxonomy_release', seed.release, now, tx);
  return {
    release: seed.release,
    added: count(decisions, 'add') + newLinks.length,
    updated: count(decisions, 'update'),
    skippedUserEdited: count(decisions, 'skipUserEdited', 'skipUserOwned'),
    skippedDeleted: count(decisions, 'skipDeleted'),
    retired,
  };
}

/** `resourceTypeKey` → id; catalog resource types carry `source_id = rt:<key>`. */
function resourceTypeIds(tx: Db): Map<string, string> {
  const rows = tx
    .select({ id: resourceTypes.id, sourceId: resourceTypes.sourceId })
    .from(resourceTypes)
    .where(and(eq(resourceTypes.source, 'curated'), isNull(resourceTypes.deletedAt)))
    .all();
  return new Map(rows.filter((r) => r.sourceId?.startsWith('rt:')).map((r) => [r.sourceId!.slice(3), r.id]));
}

/** Catalog import: session types, subjects, resource types (same upsert rule). */
export function importCatalogSync(seed: CatalogSeed, now: string, tx: Db): void {
  assertCatalogSeed(seed);
  const installed = getAppMetaSync('catalog_release', tx);
  if (installed && compareReleases(seed.release, installed) < 0) throw new DomainError('SEED_RELEASE_OLDER');
  const rows = <T extends { id: string; source: SeedSource; sourceId: string; sourceVersion: string }>(
    list: readonly T[],
    values: (r: T) => Record<string, unknown>,
  ): Incoming[] => list.map((r) => ({ id: r.id, source: r.source, sourceId: r.sourceId, sourceVersion: r.sourceVersion, values: values(r) }));
  upsertImported(sessionTypes, rows(seed.sessionTypes, (r) => ({ name: r.name, sortOrder: r.sortOrder })), now, tx);
  upsertImported(subjects, rows(seed.subjects, (r) => ({ name: r.name, description: r.description ?? null })), now, tx);
  upsertImported(resourceTypes, rows(seed.resourceTypes, (r) => ({ name: r.name, sortOrder: r.sortOrder })), now, tx);
  setAppMetaSync('catalog_release', seed.release, now, tx);
}
