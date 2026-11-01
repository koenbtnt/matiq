import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';

import { DomainError } from '../domain/errors';
import type * as schema from './schema';

/**
 * Shared database type (F-03): both `drizzle-orm/expo-sqlite` (app) and
 * `drizzle-orm/better-sqlite3` (Jest) databases are assignable to it, so one repository
 * implementation runs on both. Sync driver: transactions take synchronous callbacks.
 */
export type Db = BaseSQLiteDatabase<'sync', unknown, typeof schema>;

let current: Db | undefined;

/** The open database; throws DB_NOT_OPEN before `bootstrapDatabase()` has succeeded. */
export function getDb(): Db {
  if (!current) throw new DomainError('DB_NOT_OPEN');
  return current;
}

/** Installs (or clears, with `undefined`) the process-wide database. Called by bootstrap/reset. */
export function setDb(db: Db | undefined): void {
  current = db;
}

export const hasDb = (): boolean => current !== undefined;
