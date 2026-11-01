/**
 * @jest-environment node
 */
import fs from 'node:fs';
import path from 'node:path';

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

import { migrationsFolder } from '../testing/testDb';

type ColumnInfo = { name: string; type: string; notnull: number; pk: number };
type SnapshotColumn = { name: string; type: string; notNull: boolean; primaryKey: boolean };
type Snapshot = {
  tables: Record<
    string,
    {
      columns: Record<string, SnapshotColumn>;
      indexes: Record<string, { columns: string[]; isUnique: boolean; where?: string }>;
      foreignKeys: Record<string, { tableTo: string; columnsFrom: string[] }>;
      checkConstraints: Record<string, { name: string; value: string }>;
    }
  >;
};

const meta = path.join(migrationsFolder, 'meta');
const journal = JSON.parse(fs.readFileSync(path.join(meta, '_journal.json'), 'utf8')) as { entries: { idx: number; tag: string }[] };
const latest = journal.entries.reduce((a, b) => (b.idx > a.idx ? b : a));
const snapshot = JSON.parse(
  fs.readFileSync(path.join(meta, `${String(latest.idx).padStart(4, '0')}_snapshot.json`), 'utf8'),
) as Snapshot;

const NOW = '2026-03-02T10:00:00.000Z';
let seq = 0;
const uuid = () => `00000000-0000-4000-8000-${String(++seq).padStart(12, '0')}`;
const seamCols = () => ({ id: uuid(), created_at: NOW, updated_at: NOW });
const seedCols = (sourceId: string) => ({ origin: 'seed', source: 'grapplemap', source_id: sourceId, source_version: '2023-02-06' });

let sqlite: Database.Database;

function insert(table: string, row: Record<string, unknown>): Record<string, unknown> {
  const cols = Object.keys(row);
  sqlite
    .prepare(`INSERT INTO ${table} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`)
    .run(...cols.map((c) => (typeof row[c] === 'boolean' ? Number(row[c]) : row[c])));
  return row;
}

/** One valid row per table, built on the rows it references. */
function baseRows() {
  const sessionType = insert('session_types', { ...seamCols(), ...seedCols('st:x'), name: 'Gi class', sort_order: 1 });
  const position = insert('positions', { ...seamCols(), ...seedCols('gm:1'), slug: 'mount', canonical_name: 'Mount', tier: 'CORE' });
  const position2 = insert('positions', { ...seamCols(), ...seedCols('gm:2'), slug: 'side', canonical_name: 'Side control', tier: 'EXTENDED' });
  const technique = insert('techniques', {
    ...seamCols(), ...seedCols('gm:3'), slug: 'pass', name: 'Pass', type: 'GUARD_PASS',
    from_position_id: position.id, to_position_id: position2.id, tier: 'CORE',
  });
  const subject = insert('subjects', { ...seamCols(), origin: 'user', name: 'Grips' });
  const cycle = insert('cycles', { ...seamCols(), starts_on: '2026-03-01', ends_on: '2026-04-01' });
  const slot = insert('slots', { ...seamCols(), weekday: 1, start_time: '19:30', session_type_id: sessionType.id });
  const session = insert('sessions', {
    ...seamCols(), session_type_id: sessionType.id, status: 'PLANNED', starts_at: NOW, local_date: '2026-03-02',
  });
  const focus = insert('session_focuses', {
    ...seamCols(), session_id: session.id, focus_kind: 'POSITION', focus_ref_id: position.id,
    is_planned: 1, is_actual: 1, sort_order: 0,
  });
  const round = insert('rounds', { ...seamCols(), session_id: session.id, round_no: 1 });
  const resourceType = insert('resource_types', { ...seamCols(), origin: 'seed', source: 'curated', source_id: 'rt:book', name: 'Book', sort_order: 1 });
  const resource = insert('resources', { ...seamCols(), origin: 'user', title: 'A book', resource_type_id: resourceType.id });
  return { sessionType, position, position2, technique, subject, cycle, slot, session, focus, round, resourceType, resource };
}

type Base = ReturnType<typeof baseRows>;

/** Valid row factories per table (fresh ids each call). */
const factories: Record<string, (b: Base) => Record<string, unknown>> = {
  session_types: () => ({ ...seamCols(), origin: 'user', name: `Type ${seq}`, sort_order: 2 }),
  positions: () => ({ ...seamCols(), origin: 'user', slug: `p-${seq}`, canonical_name: 'P', tier: 'CORE' }),
  techniques: (b) => ({
    ...seamCols(), origin: 'user', slug: `t-${seq}`, name: 'T', type: 'SWEEP',
    from_position_id: b.position.id, to_position_id: b.position2.id, tier: 'CORE',
  }),
  aliases: (b) => ({ ...seamCols(), origin: 'user', target_kind: 'POSITION', target_id: b.position.id, name: `Alias ${seq}` }),
  subjects: () => ({ ...seamCols(), origin: 'user', name: `Subject ${seq}` }),
  sessions: (b) => ({ ...seamCols(), session_type_id: b.sessionType.id, starts_at: NOW, local_date: '2026-03-02' }),
  session_focuses: (b) => ({
    ...seamCols(), session_id: b.session.id, focus_kind: 'SUBJECT', focus_ref_id: uuid(),
    is_planned: 0, is_actual: 1, sort_order: 1,
  }),
  session_techniques: (b) => ({ ...seamCols(), session_id: b.session.id, session_focus_id: b.focus.id, technique_id: b.technique.id }),
  rounds: (b) => ({ ...seamCols(), session_id: b.session.id, round_no: 100 + seq }),
  submissions: (b) => ({ ...seamCols(), session_id: b.session.id, direction: 'LANDED' }),
  cycles: () => ({ ...seamCols(), starts_on: '2026-05-01', ends_on: '2026-06-01' }),
  cycle_focuses: (b) => ({ ...seamCols(), cycle_id: b.cycle.id, focus_kind: 'POSITION', focus_ref_id: uuid(), sort_order: 0 }),
  slots: (b) => ({ ...seamCols(), weekday: 7, start_time: '06:05', session_type_id: b.sessionType.id }),
  rank_entries: () => ({ ...seamCols(), scale: 'ADULT', belt: 'BLUE', stripes: 2, awarded_on: '2025-06-01' }),
  resource_types: () => ({ ...seamCols(), origin: 'user', name: `RT ${seq}`, sort_order: 9 }),
  resources: (b) => ({ ...seamCols(), origin: 'user', title: 'R', resource_type_id: b.resourceType.id }),
  resource_links: (b) => ({ ...seamCols(), resource_id: b.resource.id, target_kind: 'TECHNIQUE', target_id: uuid() }),
  settings: () => ({ ...seamCols(), key: `k.${seq}`, value: 'true', value_type: 'BOOL' }),
  algorithm_params: () => ({
    ...seamCols(), algorithm_version: 'v1', key: `p${seq}`, value: 0.5, default_value: 0.5, min: 0, max: 1,
  }),
  taxonomy_merges: () => ({ ...seamCols(), target_kind: 'POSITION', from_id: uuid(), into_id: uuid(), payload: '{}' }),
  app_meta: () => ({ ...seamCols(), key: `meta.${seq}`, value: 'x' }),
};

/** [table, CHECK name, overrides] — each row violates exactly that CHECK. */
const IMPORTED = ['session_types', 'positions', 'techniques', 'aliases', 'subjects', 'resource_types', 'resources'];
const checkViolations: [string, string, Record<string, unknown>][] = [
  ...IMPORTED.flatMap((t): [string, string, Record<string, unknown>][] => [
    [t, `${t}_origin_check`, { origin: 'import' }],
    [t, `${t}_source_check`, { origin: 'seed', source: 'wikipedia', source_id: 'w:1' }],
    [t, `${t}_origin_source_check`, { origin: 'seed', source: null }],
  ]),
  ['positions', 'positions_tier_check', { tier: 'BASIC' }],
  ['positions', 'positions_parent_not_self_check', { id: 'self', parent_position_id: 'self' }],
  ['techniques', 'techniques_type_check', { type: 'THROW' }],
  ['techniques', 'techniques_submission_target_check', { type: 'SUBMISSION' }],
  ['techniques', 'techniques_applies_to_check', { applies_to: 'BJJ' }],
  ['techniques', 'techniques_perspective_check', { perspective: 'SIDE' }],
  ['techniques', 'techniques_tier_check', { tier: 'BASIC' }],
  ['aliases', 'aliases_target_kind_check', { target_kind: 'SUBJECT' }],
  ['cycles', 'cycles_starts_on_check', { starts_on: '2026-5-01' }],
  ['cycles', 'cycles_ends_on_check', { ends_on: 'June 2026' }],
  ['cycles', 'cycles_dates_order_check', { ends_on: '2026-05-01' }],
  ['cycle_focuses', 'cycle_focuses_focus_kind_check', { focus_kind: 'CYCLE' }],
  ['slots', 'slots_weekday_check', { weekday: 0 }],
  ['slots', 'slots_start_time_check', { start_time: '24:00' }],
  ['slots', 'slots_start_time_check', { start_time: '19:60' }],
  ['slots', 'slots_duration_check', { duration_minutes: 0 }],
  ['slots', 'slots_use_cycle_focuses_check', { use_cycle_focuses: 3 }],
  ['sessions', 'sessions_status_check', { status: 'DONE' }],
  ['sessions', 'sessions_rating_check', { rating: 6 }],
  ['sessions', 'sessions_intensity_check', { intensity: 0 }],
  ['sessions', 'sessions_energy_check', { energy: 9 }],
  ['sessions', 'sessions_duration_check', { duration_minutes: 0 }],
  ['sessions', 'sessions_rounds_count_check', { rounds_count: -1 }],
  ['sessions', 'sessions_submissions_landed_check', { submissions_landed: -1 }],
  ['sessions', 'sessions_submissions_taken_check', { submissions_taken: -1 }],
  ['sessions', 'sessions_local_date_check', { local_date: '2026-3-2' }],
  ['sessions', 'sessions_completed_at_check', { status: 'COMPLETED' }],
  ['session_focuses', 'session_focuses_focus_kind_check', { focus_kind: 'TECHNIQUE' }],
  ['session_focuses', 'session_focuses_is_planned_check', { is_planned: 2 }],
  ['session_focuses', 'session_focuses_is_actual_check', { is_planned: 1, is_actual: 2 }],
  ['session_focuses', 'session_focuses_needs_work_check', { needs_work: 2 }],
  ['session_focuses', 'session_focuses_needs_work_actual_check', { is_planned: 1, is_actual: 0, needs_work: 1 }],
  ['session_focuses', 'session_focuses_rating_actual_check', { is_planned: 1, is_actual: 0, rating: 3 }],
  ['session_focuses', 'session_focuses_counts_actual_check', { is_planned: 1, is_actual: 0, caught_count: 1 }],
  ['session_focuses', 'session_focuses_planned_or_actual_check', { is_planned: 0, is_actual: 0 }],
  ['session_focuses', 'session_focuses_rating_check', { rating: 0 }],
  ['session_focuses', 'session_focuses_hit_count_check', { hit_count: -1 }],
  ['session_focuses', 'session_focuses_caught_count_check', { caught_count: -1 }],
  ['rounds', 'rounds_round_no_check', { round_no: 0 }],
  ['rounds', 'rounds_duration_check', { duration_minutes: -5 }],
  ['rounds', 'rounds_partner_belt_check', { partner_belt: 'RED' }],
  ['rounds', 'rounds_outcome_check', { outcome: 'WIN' }],
  ['submissions', 'submissions_direction_check', { direction: 'GIVEN' }],
  ['rank_entries', 'rank_entries_scale_check', { scale: 'MASTER' }],
  ['rank_entries', 'rank_entries_belt_check', { belt: 'CORAL' }],
  ['rank_entries', 'rank_entries_stripes_check', { stripes: 7 }],
  ['rank_entries', 'rank_entries_awarded_on_check', { awarded_on: 'June' }],
  ['resources', 'resources_status_check', { status: 'READ' }],
  ['resource_links', 'resource_links_target_kind_check', { target_kind: 'SESSION' }],
  ['settings', 'settings_value_type_check', { value_type: 'FLOAT' }],
  ['algorithm_params', 'algorithm_params_value_range_check', { value: 2 }],
  ['algorithm_params', 'algorithm_params_default_range_check', { default_value: -1 }],
  ['taxonomy_merges', 'taxonomy_merges_target_kind_check', { target_kind: 'SESSION' }],
  ['taxonomy_merges', 'taxonomy_merges_not_self_check', { into_id: 'same', from_id: 'same' }],
];

/** [table, description, row a, row b overrides] — b must clash with a on a live unique index. */
const uniqueViolations: [string, string, (b: Base) => Record<string, unknown>][] = [
  ['session_types', 'name (case-insensitive)', () => ({ name: 'GI CLASS', origin: 'user', source: null, source_id: null })],
  ['positions', 'slug', () => ({ slug: 'mount' })],
  ['positions', '(source, source_id)', () => ({ origin: 'seed', source: 'grapplemap', source_id: 'gm:1' })],
  ['techniques', 'slug', () => ({ slug: 'pass' })],
];

beforeEach(() => {
  sqlite = new Database(':memory:');
  sqlite.pragma('foreign_keys = ON');
  migrate(drizzle(sqlite), { migrationsFolder });
});

afterEach(() => sqlite.close());

describe('migration chain 0000 → latest (real SQLite)', () => {
  it('applies every journal entry', () => {
    const applied = sqlite.prepare('SELECT count(*) AS n FROM __drizzle_migrations').get() as { n: number };
    expect(applied.n).toBe(journal.entries.length);
    expect(journal.entries.map((e) => e.tag)).toEqual(['0000_init', '0001_foundation']);
  });

  it('is idempotent when re-applied', () => {
    expect(() => migrate(drizzle(sqlite), { migrationsFolder })).not.toThrow();
  });

  it('creates exactly the snapshot tables (21: 20 product-spec tables + app_meta)', () => {
    const tables = (
      sqlite.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name <> '__drizzle_migrations'").all() as { name: string }[]
    ).map((t) => t.name);
    expect(tables.sort()).toEqual(Object.keys(snapshot.tables).sort());
    expect(tables).toHaveLength(21);
  });

  it.each(Object.keys(snapshot.tables))('%s: columns, types, NOT NULL and PK match the snapshot', (table) => {
    const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);
    const actual = (sqlite.prepare(`PRAGMA table_info(${table})`).all() as ColumnInfo[])
      .map((c) => ({ name: c.name, type: c.type.toLowerCase(), notnull: c.notnull === 1, pk: c.pk === 1 }))
      .sort(byName);
    const expected = Object.values(snapshot.tables[table]!.columns)
      .map((c) => ({ name: c.name, type: c.type.toLowerCase(), notnull: c.notNull, pk: c.primaryKey }))
      .sort(byName);
    expect(actual).toEqual(expected);
  });

  it.each(Object.keys(snapshot.tables))('%s: carries the sync seam', (table) => {
    const cols = Object.values(snapshot.tables[table]!.columns);
    const byName = new Map(cols.map((c) => [c.name, c]));
    expect(byName.get('id')).toMatchObject({ type: 'text', primaryKey: true });
    expect(byName.get('created_at')).toMatchObject({ type: 'text', notNull: true });
    expect(byName.get('updated_at')).toMatchObject({ type: 'text', notNull: true });
    expect(byName.get('deleted_at')).toMatchObject({ type: 'text', notNull: false });
  });

  it.each(Object.keys(snapshot.tables))('%s: every declared index and foreign key exists', (table) => {
    const indexes = (sqlite.prepare(`PRAGMA index_list(${table})`).all() as { name: string; unique: number; partial: number }[])
      .filter((i) => !i.name.startsWith('sqlite_autoindex'));
    const declared = snapshot.tables[table]!.indexes;
    expect(indexes.map((i) => i.name).sort()).toEqual(Object.keys(declared).sort());
    for (const i of indexes) {
      expect(i.unique === 1).toBe(declared[i.name]!.isUnique);
      expect(i.partial === 1).toBe(!!declared[i.name]!.where);
    }
    const fks = (sqlite.prepare(`PRAGMA foreign_key_list(${table})`).all() as { table: string; from: string }[])
      .map((f) => `${f.from}->${f.table}`)
      .sort();
    expect(fks).toEqual(
      Object.values(snapshot.tables[table]!.foreignKeys).map((f) => `${f.columnsFrom[0]}->${f.tableTo}`).sort(),
    );
  });

  it.each(Object.keys(factories))('%s: a valid row inserts', (table) => {
    const base = baseRows();
    expect(() => insert(table, factories[table]!(base))).not.toThrow();
  });

  it.each(checkViolations)('%s rejects a row violating %s', (table, check, overrides) => {
    const base = baseRows();
    const row = { ...factories[table]!(base), ...overrides };
    expect(() => insert(table, row)).toThrow(new RegExp(`CHECK constraint failed: ${check}$`));
  });

  it('every CHECK in the snapshot has a violation case', () => {
    const declared = Object.values(snapshot.tables).flatMap((t) => Object.keys(t.checkConstraints));
    expect([...new Set(checkViolations.map(([, name]) => name))].sort()).toEqual(declared.sort());
  });

  it.each(uniqueViolations)('%s: unique among live rows — %s', (table, _label, clash) => {
    const base = baseRows();
    const source = table === 'session_types' ? base.sessionType : table === 'positions' ? base.position : base.technique;
    const dupe = { ...factories[table]!(base), ...clash(base) };
    expect(() => insert(table, dupe)).toThrow(/UNIQUE constraint failed/);
    // A soft-deleted original frees the key (partial index WHERE deleted_at IS NULL).
    sqlite.prepare(`UPDATE ${table} SET deleted_at = ? WHERE id = ?`).run(NOW, source.id);
    expect(() => insert(table, { ...dupe, id: uuid() })).not.toThrow();
  });

  it('session_focuses: one live row per (session, kind, ref)', () => {
    const b = baseRows();
    const dupe = { ...factories.session_focuses!(b), focus_kind: 'POSITION', focus_ref_id: b.position.id };
    expect(() => insert('session_focuses', dupe)).toThrow(/UNIQUE/);
  });

  it('session_techniques: one live row per (session, focus or none, technique)', () => {
    const b = baseRows();
    insert('session_techniques', { ...seamCols(), session_id: b.session.id, technique_id: b.technique.id });
    expect(() => insert('session_techniques', { ...seamCols(), session_id: b.session.id, technique_id: b.technique.id })).toThrow(/UNIQUE/);
    expect(() => insert('session_techniques', factories.session_techniques!(b))).not.toThrow();
  });

  it('rounds: one live round_no per session', () => {
    const b = baseRows();
    expect(() => insert('rounds', { ...seamCols(), session_id: b.session.id, round_no: 1 })).toThrow(/UNIQUE/);
  });

  it('aliases, resource_links, settings, algorithm_params, cycle_focuses: live-unique keys', () => {
    const b = baseRows();
    insert('aliases', { ...seamCols(), origin: 'user', target_kind: 'POSITION', target_id: b.position.id, name: 'Full mount' });
    expect(() => insert('aliases', { ...seamCols(), origin: 'user', target_kind: 'POSITION', target_id: b.position.id, name: 'FULL MOUNT' })).toThrow(/UNIQUE/);
    const link = { resource_id: b.resource.id, target_kind: 'TECHNIQUE', target_id: b.technique.id };
    insert('resource_links', { ...seamCols(), ...link });
    expect(() => insert('resource_links', { ...seamCols(), ...link })).toThrow(/UNIQUE/);
    insert('settings', { ...seamCols(), key: 'suggest.max', value: '3', value_type: 'INT' });
    expect(() => insert('settings', { ...seamCols(), key: 'suggest.max', value: '4', value_type: 'INT' })).toThrow(/UNIQUE/);
    const param = { algorithm_version: 'v1', key: 'wGap', value: 0.2, default_value: 0.2, min: 0, max: 1 };
    insert('algorithm_params', { ...seamCols(), ...param });
    expect(() => insert('algorithm_params', { ...seamCols(), ...param })).toThrow(/UNIQUE/);
    const cf = { cycle_id: b.cycle.id, focus_kind: 'POSITION', focus_ref_id: b.position.id, sort_order: 0 };
    insert('cycle_focuses', { ...seamCols(), ...cf });
    expect(() => insert('cycle_focuses', { ...seamCols(), ...cf })).toThrow(/UNIQUE/);
  });

  it('enforces declared foreign keys', () => {
    baseRows();
    expect(() =>
      insert('sessions', { ...seamCols(), session_type_id: uuid(), starts_at: NOW, local_date: '2026-03-02' }),
    ).toThrow(/FOREIGN KEY/);
    expect(() =>
      insert('techniques', { ...seamCols(), origin: 'user', slug: 'x', name: 'X', type: 'SUBMISSION', from_position_id: uuid(), tier: 'CORE' }),
    ).toThrow(/FOREIGN KEY/);
  });

  it('positions: parent is never the row itself', () => {
    const id = uuid();
    expect(() => insert('positions', { id, created_at: NOW, updated_at: NOW, origin: 'user', slug: 's', canonical_name: 'S', tier: 'CORE', parent_position_id: id })).toThrow(/CHECK/);
  });

  it('keeps app_meta.key unique over all rows', () => {
    insert('app_meta', { ...seamCols(), key: 'onboarded', value: 'true' });
    expect(() => insert('app_meta', { ...seamCols(), key: 'onboarded', value: 'false' })).toThrow(/UNIQUE constraint failed: app_meta\.key/);
  });
});
