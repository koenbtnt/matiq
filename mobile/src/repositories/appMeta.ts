import { and, count, eq, isNull } from 'drizzle-orm';

import { getDb, type Db } from '../db/client';
import { appMeta } from '../db/schema';
import { runtime } from './runtime';

/** Number of live (not soft-deleted) app_meta rows. */
export async function countAppMeta(database: Db = getDb()): Promise<number> {
  const [row] = await database.select({ value: count() }).from(appMeta).where(isNull(appMeta.deletedAt));
  return row?.value ?? 0;
}

/** Value of a live app_meta key, or undefined. Sync; usable inside a transaction. */
export function getAppMetaSync(key: string, database: Db): string | undefined {
  return database
    .select({ value: appMeta.value })
    .from(appMeta)
    .where(and(eq(appMeta.key, key), isNull(appMeta.deletedAt)))
    .get()?.value;
}

/** Upserts a key (app_meta.key is unique over all rows). Sync; usable inside a transaction. */
export function setAppMetaSync(key: string, value: string, now: string, database: Db): void {
  database
    .insert(appMeta)
    .values({ id: runtime().newId(), key, value, createdAt: now, updatedAt: now })
    .onConflictDoUpdate({ target: appMeta.key, set: { value, updatedAt: now, deletedAt: null } })
    .run();
}

export async function getAppMeta(key: string, database: Db = getDb()): Promise<string | undefined> {
  return getAppMetaSync(key, database);
}

export async function setAppMeta(key: string, value: string, now: () => string, database: Db = getDb()): Promise<void> {
  setAppMetaSync(key, value, now(), database);
}
