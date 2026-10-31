/**
 * @jest-environment node
 */
import path from 'node:path';

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

const migrationsFolder = path.join(__dirname, '../../../drizzle');

type ColumnInfo = { name: string; type: string; notnull: number; pk: number };

describe('drizzle migrations (real SQLite)', () => {
  let sqlite: Database.Database;

  beforeEach(() => {
    sqlite = new Database(':memory:');
    migrate(drizzle(sqlite), { migrationsFolder });
  });

  afterEach(() => sqlite.close());

  it('creates app_meta with exactly the expected columns', () => {
    const columns = sqlite.prepare('PRAGMA table_info(app_meta)').all() as ColumnInfo[];

    expect(columns.map(({ name, type, notnull, pk }) => ({ name, type, notnull, pk }))).toEqual([
      { name: 'id', type: 'TEXT', notnull: 1, pk: 1 },
      { name: 'key', type: 'TEXT', notnull: 1, pk: 0 },
      { name: 'value', type: 'TEXT', notnull: 1, pk: 0 },
      { name: 'created_at', type: 'TEXT', notnull: 1, pk: 0 },
      { name: 'updated_at', type: 'TEXT', notnull: 1, pk: 0 },
      { name: 'deleted_at', type: 'TEXT', notnull: 0, pk: 0 },
    ]);
  });

  it('enforces a unique app_meta.key', () => {
    const insert = sqlite.prepare(
      'INSERT INTO app_meta (id, key, value, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
    );
    const now = '2026-01-01T00:00:00.000Z';
    insert.run('00000000-0000-4000-8000-000000000001', 'onboarded', 'true', now, now);

    expect(() =>
      insert.run('00000000-0000-4000-8000-000000000002', 'onboarded', 'false', now, now),
    ).toThrow(/UNIQUE constraint failed: app_meta\.key/);
  });

  it('is idempotent when re-applied', () => {
    expect(() => migrate(drizzle(sqlite), { migrationsFolder })).not.toThrow();
  });
});
