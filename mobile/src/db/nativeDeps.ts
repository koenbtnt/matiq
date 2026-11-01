import { drizzle } from 'drizzle-orm/expo-sqlite';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import { File } from 'expo-file-system';
import { defaultDatabaseDirectory, deleteDatabaseSync, openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';

import { setAppMeta } from '../repositories/appMeta';
import { ensureSeeded } from '../repositories/seed';
import type { BootstrapDeps } from './bootstrap';
import type { Db } from './client';
import { generateKeyHex } from './key/generate';
import { secureKeyStore } from './key/secureStore';
import migrations from './migrations';
import * as schema from './schema';

const dirUri = (): string => {
  const dir = String(defaultDatabaseDirectory);
  return dir.startsWith('file://') ? dir : `file://${dir}`;
};

/** The database file and its WAL/SHM siblings in expo-sqlite's default directory. */
export const databaseFile = (name: string, suffix: '' | '-wal' | '-shm' = ''): File =>
  new File(dirUri(), `${name}${suffix}`);

export function nativeBootstrapDeps(): BootstrapDeps<SQLiteDatabase> {
  return {
    keyStore: secureKeyStore,
    driver: { open: (name, options) => openDatabaseSync(name, options) },
    databaseFileExists: (name) => databaseFile(name).exists,
    generateKey: () => generateKeyHex(),
    toDrizzle: (handle) => drizzle(handle, { schema }) as unknown as Db,
    migrate: (db) => migrate(db as Parameters<typeof migrate>[0], migrations),
    seed: (db, now) => ensureSeeded(db, { now }),
    recordKeyCreated: (db, now) => setAppMeta('db_key_created_at', now().slice(0, 10), now, db),
    now: () => new Date().toISOString(),
  };
}

/** Deletes `matiq.db`, `-wal` and `-shm` (R-12 exception: reset/erase only; the db must be closed). */
export function deleteDatabaseFiles(name: string): void {
  deleteDatabaseSync(name);
  for (const suffix of ['-wal', '-shm'] as const) {
    const file = databaseFile(name, suffix);
    if (file.exists) file.delete();
  }
}
