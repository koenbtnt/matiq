import { DomainError } from '../domain/errors';
import { isKeyHex } from './key/generate';

/** The subset of an expo-sqlite `SQLiteDatabase` the opener needs (a recording fake in Jest). */
export interface SqliteHandle {
  execSync(sql: string): void;
  getFirstSync<T>(sql: string): T | null;
  closeSync(): void;
}

export interface SqliteDriver<H extends SqliteHandle = SqliteHandle> {
  open(name: string, options: { enableChangeListener: boolean }): H;
}

export const DB_NAME = 'matiq.db';

/**
 * Opens the SQLCipher database (F-05). Order is load-bearing and tested: `PRAGMA key` before any
 * other statement, then foreign keys, WAL, and a `sqlite_master` read that fails on a wrong key or
 * a plaintext file. The key never enters an error, a log or app_meta.
 */
export function openEncryptedDatabase<H extends SqliteHandle>({
  name = DB_NAME,
  keyHex,
  driver,
}: {
  name?: string;
  keyHex: string;
  driver: SqliteDriver<H>;
}): H {
  if (!isKeyHex(keyHex)) throw new DomainError('DB_KEY_REJECTED');
  const handle = driver.open(name, { enableChangeListener: true });
  try {
    handle.execSync(`PRAGMA key = "x'${keyHex}'"`);
    handle.execSync('PRAGMA foreign_keys = ON');
    handle.execSync('PRAGMA journal_mode = WAL');
    handle.getFirstSync<{ n: number }>('SELECT count(*) AS n FROM sqlite_master');
  } catch {
    try {
      handle.closeSync();
    } catch {
      // already unusable; the typed error below is what matters
    }
    throw new DomainError('DB_KEY_REJECTED');
  }
  return handle;
}
