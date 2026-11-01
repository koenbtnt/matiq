/**
 * @jest-environment node
 */
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { File } from 'expo-file-system';
import * as SQLite from 'expo-sqlite';

import { getAppMeta } from '../../repositories/appMeta';
import { setRuntime } from '../../repositories/runtime';
import { sessionTypes } from '../../repositories/sessionTypes';
import { ensureSeeded } from '../../repositories/seed';
import { catalogFixture, taxonomyFixture } from '../../repositories/testing/fixtures';
import { fakeBackupExclusion } from '../backup';
import { bootstrapDatabase, closeCurrent, setBootstrapOverrides, type BootstrapDeps } from '../bootstrap';
import { resetDatabase } from '../lifecycle';
import { getDb, hasDb, setDb, type Db } from '../client';
import { MemoryKeyStore } from '../key/memory';
import { secureKeyStore } from '../key/secureStore';
import { deleteDatabaseFiles, nativeBootstrapDeps } from '../nativeDeps';
import * as schema from '../schema';
import { migrationsFolder, sequentialIds } from '../testing/testDb';

const KEY = 'cd'.repeat(32);
const mockExisting = new Set<string>();
const mockDeleted: string[] = [];

jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'DEVICE_ONLY',
    getItemAsync: jest.fn(async (k: string) => store.get(k) ?? null),
    setItemAsync: jest.fn(async (k: string, v: string) => void store.set(k, v)),
    deleteItemAsync: jest.fn(async (k: string) => void store.delete(k)),
  };
});
jest.mock('expo-file-system', () => ({
  File: jest.fn().mockImplementation((dir: string, name: string) => ({
    uri: `${dir}/${name}`,
    get exists() {
      return mockExisting.has(`${dir}/${name}`);
    },
    delete: () => void mockDeleted.push(`${dir}/${name}`),
  })),
}));
jest.mock('expo-sqlite', () => ({
  defaultDatabaseDirectory: '/data/SQLite',
  openDatabaseSync: jest.fn(() => ({ execSync: jest.fn(), getFirstSync: jest.fn(() => ({ n: 0 })), closeSync: jest.fn() })),
  deleteDatabaseSync: jest.fn(),
  addDatabaseChangeListener: jest.fn(() => ({ remove: jest.fn() })),
}));

/** Overrides that swap the native driver/ORM for better-sqlite3 while keeping the rest native. */
function realSqlite(): Partial<BootstrapDeps> & { handles: Database.Database[] } {
  const handles: Database.Database[] = [];
  return {
    handles,
    driver: {
      open: () => {
        const sqlite = new Database(':memory:');
        handles.push(sqlite);
        return { raw: sqlite, execSync: (s: string) => void sqlite.exec(s), getFirstSync: <T,>(s: string) => (sqlite.prepare(s).get() as T) ?? null, closeSync: () => sqlite.close() } as never;
      },
    },
    toDrizzle: (h) => drizzle((h as unknown as { raw: Database.Database }).raw, { schema }) as unknown as Db,
    migrate: async (db) => migrate(db as never, { migrationsFolder }),
    seed: (db, now) => ensureSeeded(db, { now }, { catalog: catalogFixture(), taxonomy: taxonomyFixture() }),
    generateKey: async () => KEY,
    now: () => '2026-03-02T10:00:00.000Z',
  };
}

beforeEach(() => {
  mockExisting.clear();
  mockDeleted.length = 0;
  setRuntime({ newId: sequentialIds('c') });
});
afterEach(() => {
  closeCurrent();
  setRuntime();
});

describe('getDb (F-03)', () => {
  it('throws DB_NOT_OPEN before bootstrap, also through a repository default parameter', async () => {
    setDb(undefined);
    expect(hasDb()).toBe(false);
    expect(() => getDb()).toThrow(expect.objectContaining({ code: 'DB_NOT_OPEN' }));
    await expect(sessionTypes.list()).rejects.toMatchObject({ code: 'DB_NOT_OPEN' });
  });
});

describe('bootstrapDatabase (F-09) with the native defaults', () => {
  it('fills every dependency it is not given from nativeBootstrapDeps: secure store key, file check, key date', async () => {
    const result = await bootstrapDatabase(realSqlite());
    expect(result.ok).toBe(true);
    // The key landed in the (mocked) secure store under the device-only class.
    expect(await secureKeyStore.get()).toBe(KEY);
    expect(await getAppMeta('db_key_created_at', getDb())).toBe('2026-03-02');
    expect((await sessionTypes.list()).length).toBe(3);
  });

  it('a database file without a key is DB_KEY_MISSING_FOR_EXISTING_DB through the native file check', async () => {
    await secureKeyStore.delete();
    mockExisting.add('file:///data/SQLite/matiq.db');
    expect(await bootstrapDatabase(realSqlite())).toEqual({ ok: false, code: 'DB_KEY_MISSING_FOR_EXISTING_DB' });
    expect(hasDb()).toBe(false);
  });

  it('overrides win over the defaults', async () => {
    const keyStore = new MemoryKeyStore(KEY);
    const result = await bootstrapDatabase({ ...realSqlite(), keyStore, databaseFileExists: () => false });
    expect(result.ok).toBe(true);
    expect(await getAppMeta('db_key_created_at', getDb())).toBeUndefined();
  });
});

describe('nativeBootstrapDeps / deleteDatabaseFiles', () => {
  it('wires the secure store, expo-sqlite (change listener on) and the default directory', () => {
    const deps = nativeBootstrapDeps();
    expect(deps.keyStore).toBe(secureKeyStore);
    deps.driver.open('matiq.db', { enableChangeListener: true });
    expect(SQLite.openDatabaseSync).toHaveBeenCalledWith('matiq.db', { enableChangeListener: true });
    mockExisting.add('file:///data/SQLite/matiq.db');
    expect(deps.databaseFileExists('matiq.db')).toBe(true);
    expect(deps.databaseFileExists('other.db')).toBe(false);
    expect(File).toHaveBeenCalledWith('file:///data/SQLite', 'matiq.db');
    expect(deps.now()).toMatch(/^\d{4}-\d{2}-\d{2}T.*Z$/);
  });

  it('records only the ISO date of key creation', async () => {
    const sqlite = new Database(':memory:');
    const db = drizzle(sqlite, { schema }) as unknown as Db;
    migrate(db as never, { migrationsFolder });
    await nativeBootstrapDeps().recordKeyCreated(db, () => '2026-04-05T06:07:08.000Z');
    expect(await getAppMeta('db_key_created_at', db)).toBe('2026-04-05');
    sqlite.close();
  });

  it('deletes matiq.db via expo-sqlite and the -wal/-shm files that exist', () => {
    mockExisting.add('file:///data/SQLite/matiq.db-wal');
    deleteDatabaseFiles('matiq.db');
    expect(SQLite.deleteDatabaseSync).toHaveBeenCalledWith('matiq.db');
    expect(mockDeleted).toEqual(['file:///data/SQLite/matiq.db-wal']);
  });
});

describe('backup exclusion seam (PS-17, plan §9.1)', () => {
  const DIR = 'file:///data/SQLite';
  afterEach(() => setBootstrapOverrides({}));

  it('nativeBootstrapDeps defaults to not_applicable; targets are the directory, then the files that exist', async () => {
    const deps = nativeBootstrapDeps();
    expect(await deps.backupExclusion!.exclude(['x'])).toEqual({ status: 'not_applicable', failed: [] });
    expect(deps.backupTargets!('matiq.db')).toEqual([DIR]);
    mockExisting.add(`${DIR}/matiq.db`).add(`${DIR}/matiq.db-shm`);
    expect(deps.backupTargets!('matiq.db')).toEqual([DIR, `${DIR}/matiq.db`, `${DIR}/matiq.db-shm`]);
  });

  it('the default records not_applicable and the check date in app_meta', async () => {
    expect((await bootstrapDatabase({ ...realSqlite(), keyStore: new MemoryKeyStore(KEY) })).ok).toBe(true);
    expect(await getAppMeta('backup_exclusion', getDb())).toBe('not_applicable');
    expect(await getAppMeta('backup_exclusion_checked_at', getDb())).toBe('2026-03-02');
  });

  it('setBootstrapOverrides reaches bootstrapDatabase: directory URI first, then matiq.db, -wal, -shm', async () => {
    const fake = fakeBackupExclusion();
    setBootstrapOverrides({ backupExclusion: fake });
    mockExisting.add(`${DIR}/matiq.db`).add(`${DIR}/matiq.db-wal`).add(`${DIR}/matiq.db-shm`);
    expect((await bootstrapDatabase({ ...realSqlite(), keyStore: new MemoryKeyStore(KEY) })).ok).toBe(true);
    expect(fake.calls).toEqual([[DIR, `${DIR}/matiq.db`, `${DIR}/matiq.db-wal`, `${DIR}/matiq.db-shm`]]);
    expect(await getAppMeta('backup_exclusion', getDb())).toBe('excluded');
  });

  it('a failed result or a throwing adapter still yields ok: true, records failed and warns', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    setBootstrapOverrides({ backupExclusion: fakeBackupExclusion({ status: 'failed', failed: [DIR] }) });
    expect((await bootstrapDatabase({ ...realSqlite(), keyStore: new MemoryKeyStore(KEY) })).ok).toBe(true);
    expect(await getAppMeta('backup_exclusion', getDb())).toBe('failed');
    closeCurrent();
    setBootstrapOverrides({ backupExclusion: { exclude: () => Promise.reject(new Error('native')) } });
    expect((await bootstrapDatabase({ ...realSqlite(), keyStore: new MemoryKeyStore(KEY) })).ok).toBe(true);
    expect(await getAppMeta('backup_exclusion', getDb())).toBe('failed');
    expect(warn).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });

  it('setBootstrapOverrides reaches the bootstrap inside resetDatabase (re-run on the new files)', async () => {
    const fake = fakeBackupExclusion();
    const keyStore = new MemoryKeyStore(KEY);
    setBootstrapOverrides({ ...realSqlite(), keyStore, backupExclusion: fake });
    expect((await bootstrapDatabase()).ok).toBe(true);
    await resetDatabase({ keepKey: true }, { keyStore, deleteFiles: () => undefined });
    expect(fake.calls).toHaveLength(2);
    expect(await getAppMeta('backup_exclusion', getDb())).toBe('excluded');
  });

  it('src/db never imports mobile/modules (S6)', () => {
    const fs = jest.requireActual<typeof import('node:fs')>('node:fs');
    const path = jest.requireActual<typeof import('node:path')>('node:path');
    const root = path.join(__dirname, '..');
    const walk = (dir: string): string[] =>
      fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? walk(path.join(dir, e.name)) : /\.tsx?$/.test(e.name) ? [path.join(dir, e.name)] : [],
      );
    const offenders = walk(root).filter((f) => /from ['"][^'"]*modules\//.test(fs.readFileSync(f, 'utf8').replace(/\/\/.*$/gm, '')));
    expect(offenders.filter((f) => !f.includes('__tests__'))).toEqual([]);
  });
});
