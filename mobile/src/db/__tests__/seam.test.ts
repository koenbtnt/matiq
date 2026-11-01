/**
 * @jest-environment node
 */
import fs from 'node:fs';
import path from 'node:path';

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

import { ensureSeeded } from '../../repositories/seed';
import { setRuntime } from '../../repositories/runtime';
import { getAppMeta, setAppMeta } from '../../repositories/appMeta';
import { catalogFixture, taxonomyFixture } from '../../repositories/testing/fixtures';
import { closeCurrent, runBootstrap, type BootstrapDeps } from '../bootstrap';
import { getDb, hasDb, type Db } from '../client';
import { generateKeyHex, isKeyHex } from '../key/generate';
import { MemoryKeyStore } from '../key/memory';
import { DB_KEY_ITEM, secureKeyStore } from '../key/secureStore';
import { resetDatabase } from '../lifecycle';
import { openEncryptedDatabase, type SqliteHandle } from '../open';
import * as schema from '../schema';
import { migrationsFolder, sequentialIds } from '../testing/testDb';

jest.mock('expo-secure-store', () => ({
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY_CONST',
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

const KEY = 'ab'.repeat(32);

/** Records every statement; `failOn` makes one statement throw (a wrong key). */
class RecordingHandle implements SqliteHandle {
  log: string[] = [];
  closed = false;
  constructor(private failOn?: RegExp) {}
  execSync(sql: string) {
    this.log.push(sql);
    if (this.failOn?.test(sql)) throw new Error('file is not a database');
  }
  getFirstSync<T>(sql: string): T | null {
    this.log.push(sql);
    if (this.failOn?.test(sql)) throw new Error('file is not a database');
    return { n: 0 } as T;
  }
  closeSync() {
    this.closed = true;
  }
}

describe('openEncryptedDatabase (F-05)', () => {
  it('runs PRAGMA key first, then foreign keys, WAL and the sqlite_master proof', () => {
    const handle = new RecordingHandle();
    const opened: unknown[] = [];
    openEncryptedDatabase({ keyHex: KEY, driver: { open: (name, opts) => (opened.push([name, opts]), handle) } });
    expect(opened).toEqual([['matiq.db', { enableChangeListener: true }]]);
    expect(handle.log).toEqual([
      `PRAGMA key = "x'${KEY}'"`,
      'PRAGMA foreign_keys = ON',
      'PRAGMA journal_mode = WAL',
      'SELECT count(*) AS n FROM sqlite_master',
    ]);
  });

  it('a failing sqlite_master read (wrong key / plaintext file) is DB_KEY_REJECTED and closes; the key is not in the error', () => {
    const handle = new RecordingHandle(/sqlite_master/);
    let error: unknown;
    try {
      openEncryptedDatabase({ keyHex: KEY, driver: { open: () => handle } });
    } catch (e) {
      error = e;
    }
    expect(error).toMatchObject({ code: 'DB_KEY_REJECTED' });
    expect(JSON.stringify(error) + String(error)).not.toContain(KEY);
    expect(handle.closed).toBe(true);
  });

  it('never interpolates a malformed key', () => {
    const handle = new RecordingHandle();
    expect(() => openEncryptedDatabase({ keyHex: `${KEY.slice(2)}"'`, driver: { open: () => handle } })).toThrow('DB_KEY_REJECTED');
    expect(handle.log).toEqual([]);
  });
});

describe('key generation (F-06)', () => {
  it('is 32 bytes as 64 lowercase hex chars', async () => {
    const hex = await generateKeyHex(async (n) => Uint8Array.from({ length: n }, (_, i) => i * 7));
    expect(hex).toMatch(/^[0-9a-f]{64}$/);
    expect(hex.slice(0, 6)).toBe('00070e');
    expect(isKeyHex(hex)).toBe(true);
    expect(isKeyHex(hex.toUpperCase())).toBe(false);
    await expect(generateKeyHex(async () => new Uint8Array(16))).rejects.toThrow();
  });

  it('the secure-store adapter uses the device-only class and the matiq.db.key item (A-17)', async () => {
    const SecureStore = jest.requireMock('expo-secure-store') as Record<string, jest.Mock>;
    await secureKeyStore.set(KEY);
    await secureKeyStore.get();
    await secureKeyStore.delete();
    const opts = { keychainAccessible: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY_CONST', requireAuthentication: false };
    expect(DB_KEY_ITEM).toBe('matiq.db.key');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('matiq.db.key', KEY, opts);
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith('matiq.db.key', opts);
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('matiq.db.key', opts);
  });
});

/** Bootstrap deps over a real better-sqlite3 database (PRAGMA key is a no-op on plain SQLite). */
function realDeps(over: Partial<BootstrapDeps> = {}): BootstrapDeps & { files: Set<string>; handles: Database.Database[] } {
  const files = new Set<string>();
  const handles: Database.Database[] = [];
  const deps = {
    keyStore: new MemoryKeyStore(),
    driver: {
      open: (name: string) => {
        files.add(name);
        const sqlite = new Database(':memory:');
        handles.push(sqlite);
        return {
          raw: sqlite,
          execSync: (sql: string) => void sqlite.exec(sql),
          getFirstSync: <T,>(sql: string) => (sqlite.prepare(sql).get() as T) ?? null,
          closeSync: () => sqlite.close(),
        };
      },
    },
    databaseFileExists: (name: string) => files.has(name),
    generateKey: async () => KEY,
    toDrizzle: (h: { raw?: Database.Database }) => drizzle(h.raw!, { schema }) as unknown as Db,
    migrate: async (db: Db) => migrate(db as never, { migrationsFolder }),
    seed: (db: Db, now: () => string) => ensureSeeded(db, { now }, { catalog: catalogFixture(), taxonomy: taxonomyFixture() }),
    recordKeyCreated: (db: Db, now: () => string) => setAppMeta('db_key_created_at', now().slice(0, 10), now, db),
    now: () => '2026-03-02T10:00:00.000Z',
    ...over,
  };
  return Object.assign(deps as unknown as BootstrapDeps, { files, handles });
}

describe('bootstrap (F-09, plan §10)', () => {
  beforeEach(() => setRuntime({ newId: sequentialIds('b') }));
  afterEach(() => {
    closeCurrent();
    setRuntime();
  });

  it('fresh install: generates and stores a key, migrates, seeds, setDb; records only the key date', async () => {
    const deps = realDeps();
    const result = await runBootstrap(deps);
    expect(result.ok).toBe(true);
    expect(await deps.keyStore.get()).toBe(KEY);
    expect(hasDb()).toBe(true);
    expect(await getAppMeta('db_key_created_at', getDb())).toBe('2026-03-02');
    const allMeta = deps.handles[0]!.prepare('SELECT key, value FROM app_meta').all() as { value: string }[];
    expect(JSON.stringify(allMeta)).not.toContain(KEY);
  });

  it('key present, no database: opens a new file with the existing key, no new key date', async () => {
    const deps = realDeps({ keyStore: new MemoryKeyStore(KEY), generateKey: jest.fn() });
    expect((await runBootstrap(deps)).ok).toBe(true);
    expect(deps.generateKey).not.toHaveBeenCalled();
    expect(await getAppMeta('db_key_created_at', getDb())).toBeUndefined();
  });

  it('database present, key missing: DB_KEY_MISSING_FOR_EXISTING_DB, never recreates', async () => {
    const deps = realDeps({ databaseFileExists: () => true, generateKey: jest.fn() });
    expect(await runBootstrap(deps)).toEqual({ ok: false, code: 'DB_KEY_MISSING_FOR_EXISTING_DB' });
    expect(deps.generateKey).not.toHaveBeenCalled();
    expect(hasDb()).toBe(false);
  });

  it('secure store throws: DB_KEY_UNAVAILABLE, no unencrypted fallback', async () => {
    const keyStore = new MemoryKeyStore();
    keyStore.get = () => Promise.reject(new Error('locked'));
    const deps = realDeps({ keyStore });
    expect(await runBootstrap(deps)).toEqual({ ok: false, code: 'DB_KEY_UNAVAILABLE' });
    expect(deps.files.size).toBe(0);
  });

  it('wrong key / plaintext file: DB_KEY_REJECTED', async () => {
    const deps = realDeps({
      keyStore: new MemoryKeyStore(KEY),
      driver: { open: () => new RecordingHandle(/sqlite_master/) },
    });
    expect(await runBootstrap(deps)).toEqual({ ok: false, code: 'DB_KEY_REJECTED' });
  });

  it('migration and seed failures map to DB_MIGRATION_FAILED / DB_SEED_FAILED', async () => {
    expect(await runBootstrap(realDeps({ migrate: () => Promise.reject(new Error('x')) }))).toEqual({ ok: false, code: 'DB_MIGRATION_FAILED' });
    expect(await runBootstrap(realDeps({ seed: () => Promise.reject(new Error('x')) }))).toEqual({ ok: false, code: 'DB_SEED_FAILED' });
    expect(hasDb()).toBe(false);
  });

  it('resetDatabase keeps the key, deletes the files and bootstraps again (F-25)', async () => {
    const keyStore = new MemoryKeyStore(KEY);
    const deps = realDeps({ keyStore });
    await runBootstrap(deps);
    const deleted: string[] = [];
    const db = await resetDatabase(
      { keepKey: true },
      { keyStore, deleteFiles: (name) => void deleted.push(name), bootstrap: () => runBootstrap(deps) },
    );
    expect(deleted).toEqual(['matiq.db']);
    expect(deps.handles[0]!.open).toBe(false);
    expect(await keyStore.get()).toBe(KEY);
    expect(getDb()).toBe(db);
  });

  it('resetDatabase without keepKey drops the key; a failed bootstrap is DB_RESET_FAILED', async () => {
    const keyStore = new MemoryKeyStore(KEY);
    await expect(
      resetDatabase({ keepKey: false }, { keyStore, deleteFiles: () => undefined, bootstrap: async () => ({ ok: false, code: 'DB_SEED_FAILED' }) }),
    ).rejects.toMatchObject({ code: 'DB_RESET_FAILED' });
    expect(await keyStore.get()).toBeNull();
  });
});

describe('single keyed connection (F-08, plan §10)', () => {
  const srcRoot = path.join(__dirname, '../..');
  const walk = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? (e.name === '__tests__' ? [] : walk(path.join(dir, e.name))) : /\.tsx?$/.test(e.name) ? [path.join(dir, e.name)] : [],
    );
  it.each(['db', 'repositories'])('src/%s never opens a second (unkeyed) connection', (dir) => {
    for (const file of walk(path.join(srcRoot, dir))) {
      const src = fs.readFileSync(file, 'utf8');
      expect({ file, hit: /withExclusiveTransactionAsync|useNewConnection/.test(src) }).toEqual({ file, hit: false });
    }
  });
});
