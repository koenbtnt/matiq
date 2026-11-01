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
import { bootstrapDatabase, closeCurrent, type BootstrapDeps } from '../bootstrap';
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
