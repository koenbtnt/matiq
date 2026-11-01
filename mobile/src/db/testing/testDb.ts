/**
 * Jest helpers for real-SQLite tests (better-sqlite3, same `drizzle/` migrations the app ships).
 * Not a test file itself; imported by `__tests__` under `@jest-environment node`.
 */
import path from 'node:path';

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

import { setRuntime } from '../../repositories/runtime';
import type { Db } from '../client';
import * as schema from '../schema';

export const migrationsFolder = path.join(__dirname, '../../../drizzle');

export type TestDb = { sqlite: Database.Database; db: Db };

/** Fresh in-memory database, foreign keys on, whole migration chain applied. */
export function createTestDb(): TestDb {
  const sqlite = new Database(':memory:');
  sqlite.pragma('foreign_keys = ON');
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder });
  return { sqlite, db: db as unknown as Db };
}

/** Deterministic UUID v4-shaped ids: …-000000000001, …-000000000002, … */
export function sequentialIds(prefix = '0000'): () => string {
  let n = 0;
  return () => {
    n += 1;
    return `${prefix.padStart(8, '0')}-0000-4000-8000-${String(n).padStart(12, '0')}`;
  };
}

/** A clock that returns `start` and advances 1 ms per call (a later write always sorts later). */
export function steppingClock(start = '2026-03-02T10:00:00.000Z'): { now: () => string; set: (iso: string) => void } {
  let t = Date.parse(start);
  return {
    now: () => {
      const iso = new Date(t).toISOString();
      t += 1;
      return iso;
    },
    set: (iso: string) => {
      t = Date.parse(iso);
    },
  };
}

/** Installs a deterministic runtime; returns the clock so a test can move time. */
export function installTestRuntime(start?: string) {
  const clock = steppingClock(start);
  setRuntime({ now: clock.now, newId: sequentialIds() });
  return clock;
}
