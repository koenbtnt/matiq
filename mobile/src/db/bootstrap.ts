import type { ErrorCode } from '../domain/errors';
import { setAppMetaSync } from '../repositories/appMeta';
import {
  BACKUP_CHECKED_META_KEY,
  BACKUP_META_KEY,
  notApplicableBackupExclusion,
  type BackupExclusion,
  type BackupExclusionResult,
} from './backup';
import { setDb, type Db } from './client';
import { generateKeyHex, isKeyHex } from './key/generate';
import type { KeyStore } from './key/KeyStore';
import { DB_NAME, openEncryptedDatabase, type SqliteDriver, type SqliteHandle } from './open';

export type BootstrapErrorCode = Extract<
  ErrorCode,
  'DB_KEY_UNAVAILABLE' | 'DB_KEY_MISSING_FOR_EXISTING_DB' | 'DB_KEY_REJECTED' | 'DB_MIGRATION_FAILED' | 'DB_SEED_FAILED'
>;

export type BootstrapResult = { ok: true; db: Db } | { ok: false; code: BootstrapErrorCode };

/** Everything bootstrap touches, injectable so Jest runs every branch without native modules. */
export interface BootstrapDeps<H extends SqliteHandle = SqliteHandle> {
  keyStore: KeyStore;
  driver: SqliteDriver<H>;
  /** Whether `matiq.db` already exists on disk. */
  databaseFileExists: (name: string) => boolean;
  generateKey: () => Promise<string>;
  /** Wraps the open handle in Drizzle. */
  toDrizzle: (handle: H) => Db;
  migrate: (db: Db) => Promise<void>;
  seed: (db: Db, now: () => string) => Promise<unknown>;
  /** Records `db_key_created_at` (an ISO date, never the key) after a new key was stored. */
  recordKeyCreated: (db: Db, now: () => string) => Promise<void>;
  now: () => string;
  /** PS-17: excludes the database directory and files from device backups (default `not_applicable`). */
  backupExclusion?: BackupExclusion;
  /**
   * URIs handed to `backupExclusion.exclude`, in order: expo-sqlite's database directory, then the
   * `matiq.db`, `-wal`, `-shm` files that exist. Missing → no URIs.
   */
  backupTargets?: (name: string) => string[];
}

export type BootstrapState<H extends SqliteHandle = SqliteHandle> = { handle: H; db: Db };

let state: BootstrapState | undefined;

/** The handle of the current bootstrap (lifecycle uses it to close before a reset). */
export const currentHandle = (): SqliteHandle | undefined => state?.handle;

/**
 * F-09: key → open (PRAGMA key first) → migrate → seed → setDb. Never falls back to an unencrypted
 * open; never recreates a database whose key is missing.
 */
export async function runBootstrap<H extends SqliteHandle>(
  deps: BootstrapDeps<H>,
  name: string = DB_NAME,
): Promise<BootstrapResult> {
  let keyHex: string | null;
  try {
    keyHex = await deps.keyStore.get();
  } catch {
    return { ok: false, code: 'DB_KEY_UNAVAILABLE' };
  }

  let createdKey = false;
  if (keyHex === null) {
    if (deps.databaseFileExists(name)) return { ok: false, code: 'DB_KEY_MISSING_FOR_EXISTING_DB' };
    try {
      keyHex = await deps.generateKey();
      await deps.keyStore.set(keyHex);
      createdKey = true;
    } catch {
      return { ok: false, code: 'DB_KEY_UNAVAILABLE' };
    }
  }
  if (!isKeyHex(keyHex)) return { ok: false, code: 'DB_KEY_REJECTED' };

  let handle: H;
  try {
    handle = openEncryptedDatabase({ name, keyHex, driver: deps.driver });
  } catch {
    return { ok: false, code: 'DB_KEY_REJECTED' };
  }
  keyHex = null;

  const db = deps.toDrizzle(handle);
  try {
    await deps.migrate(db);
  } catch {
    handle.closeSync();
    return { ok: false, code: 'DB_MIGRATION_FAILED' };
  }
  try {
    await deps.seed(db, deps.now);
    if (createdKey) await deps.recordKeyCreated(db, deps.now);
  } catch {
    handle.closeSync();
    return { ok: false, code: 'DB_SEED_FAILED' };
  }

  await applyBackupExclusion(deps, db, name);

  state = { handle, db };
  setDb(db);
  return { ok: true, db };
}

/**
 * Runs the backup exclusion and records the outcome in app_meta (`backup_exclusion`,
 * `backup_exclusion_checked_at`). Repeats on every launch and after every reset; never fails
 * bootstrap (PS-17).
 */
async function applyBackupExclusion<H extends SqliteHandle>(deps: BootstrapDeps<H>, db: Db, name: string): Promise<void> {
  const exclusion = deps.backupExclusion ?? notApplicableBackupExclusion;
  let uris: string[] = [];
  let result: BackupExclusionResult;
  try {
    uris = deps.backupTargets?.(name) ?? [];
    result = await exclusion.exclude(uris);
  } catch {
    result = { status: 'failed', failed: uris };
  }
  if (result.status === 'failed') {
    // Sandbox file URIs only; no user data.
    console.warn('[matiq] backup exclusion failed', result.failed);
  }
  try {
    const now = deps.now();
    db.transaction((tx) => {
      setAppMetaSync(BACKUP_META_KEY, result.status, now, tx as unknown as Db);
      setAppMetaSync(BACKUP_CHECKED_META_KEY, now.slice(0, 10), now, tx as unknown as Db);
    });
  } catch {
    // Recording the status is best effort; the exclusion itself already ran.
  }
}

/** Closes the current database and clears `getDb()`. */
export function closeCurrent(): void {
  const s = state;
  state = undefined;
  setDb(undefined);
  if (s) s.handle.closeSync();
}

let appOverrides: Partial<BootstrapDeps> = {};

/**
 * Installs app-wide bootstrap overrides (PS-17, S6). The app calls it once at module scope in
 * `_layout.tsx` with `{ backupExclusion }` from the native module; every later
 * `bootstrapDatabase()` — including the one inside `resetDatabase()` — merges them over the native
 * defaults. A new call replaces the previous overrides; `setBootstrapOverrides({})` clears them.
 */
export function setBootstrapOverrides(overrides: Partial<BootstrapDeps>): void {
  appOverrides = { ...overrides };
}

/**
 * App entry point (F-09): bootstraps with the device defaults (secure store, expo-sqlite, the
 * shipped migrations and seed), then the `setBootstrapOverrides` values, then `overrides`.
 */
export async function bootstrapDatabase(overrides: Partial<BootstrapDeps> = {}): Promise<BootstrapResult> {
  // Loaded lazily so Jest can exercise runBootstrap without the native modules.
  const { nativeBootstrapDeps } = require('./nativeDeps') as typeof import('./nativeDeps');
  return runBootstrap({ ...nativeBootstrapDeps(), ...appOverrides, ...overrides } as BootstrapDeps);
}
