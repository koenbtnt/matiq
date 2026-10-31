/**
 * @jest-environment node
 */
import fs from 'node:fs';
import path from 'node:path';

import descriptions from '../schema/descriptions.json';

type Snapshot = { tables: Record<string, { columns: Record<string, unknown> }> };
type Journal = { entries: { idx: number; tag: string }[] };

const metaDir = path.join(__dirname, '../../../drizzle/meta');

function loadLatestSnapshot(): Snapshot {
  const journal = JSON.parse(fs.readFileSync(path.join(metaDir, '_journal.json'), 'utf8')) as Journal;
  const latest = journal.entries.reduce((a, b) => (b.idx > a.idx ? b : a));
  const file = `${String(latest.idx).padStart(4, '0')}_snapshot.json`;
  return JSON.parse(fs.readFileSync(path.join(metaDir, file), 'utf8')) as Snapshot;
}

const described = descriptions as Record<string, Record<string, string>>;
const { tables } = loadLatestSnapshot();

describe('schema descriptions', () => {
  it.each(Object.keys(tables))('describes table %s and all its columns', (table) => {
    const entry = described[table];
    expect(entry).toBeDefined();
    expect(entry?._?.trim()).toBeTruthy();
    for (const column of Object.keys(tables[table]!.columns)) {
      expect({ column, description: entry?.[column]?.trim() || undefined }).toEqual({
        column,
        description: expect.any(String),
      });
    }
  });

  it('has no entries for tables or columns that do not exist', () => {
    for (const [table, entry] of Object.entries(described)) {
      expect(tables).toHaveProperty([table]);
      const known = new Set(['_', ...Object.keys(tables[table]?.columns ?? {})]);
      expect(Object.keys(entry).filter((k) => !known.has(k))).toEqual([]);
    }
  });
});
