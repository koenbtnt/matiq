import { sql, type SQL } from 'drizzle-orm';
import { check, text, uniqueIndex, type SQLiteColumn } from 'drizzle-orm/sqlite-core';

/**
 * Shared column sets and check builders. Raw column names are used inside `sql` fragments on
 * purpose: SQLite only accepts unqualified column names in CHECK and partial-index WHERE clauses.
 */

/** Sync seam (data.md): UUID v4 id, ISO-8601 UTC timestamps, soft delete. */
export const seam = () => ({
  id: text('id').primaryKey(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  deletedAt: text('deleted_at'),
});

export const ORIGINS = ['seed', 'user'] as const;
export const SOURCES = ['grapplemap', 'grapple-flows', 'curated'] as const;

/** Provenance columns of imported (seedable) tables. */
export const imported = () => ({
  origin: text('origin', { enum: ORIGINS }).notNull(),
  source: text('source', { enum: SOURCES }),
  sourceId: text('source_id'),
  sourceVersion: text('source_version'),
  userEditedAt: text('user_edited_at'),
});

export const LIVE = sql`deleted_at IS NULL`;

const quote = (values: readonly string[]) => values.map((v) => `'${v}'`).join(', ');

/** `col IN (...)` check over a fixed vocabulary; `nullable` admits NULL. */
export function inList(name: string, column: string, values: readonly string[], nullable = false) {
  const body = `${column} IN (${quote(values)})`;
  return check(name, sql.raw(nullable ? `${column} IS NULL OR ${body}` : body));
}

/** Boolean stored as integer 0/1. */
export const bool01 = (name: string, column: string) => check(name, sql.raw(`${column} IN (0, 1)`));

/** Integer range check; `nullable` admits NULL. */
export function between(name: string, column: string, min: number, max: number, nullable = true) {
  const body = `${column} BETWEEN ${min} AND ${max}`;
  return check(name, sql.raw(nullable ? `${column} IS NULL OR ${body}` : body));
}

/** `col > 0` (or `>= 0` with `inclusive`), NULL admitted. */
export function positive(name: string, column: string, inclusive = false) {
  return check(name, sql.raw(`${column} IS NULL OR ${column} ${inclusive ? '>=' : '>'} 0`));
}

export const DATE_GLOB = "'[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]'";

/** Local date `YYYY-MM-DD` shape check. */
export const isDate = (name: string, column: string) => check(name, sql.raw(`${column} GLOB ${DATE_GLOB}`));

/** Checks and the provenance unique index shared by every imported table. */
export function importedConstraints(table: string, t: { source: SQLiteColumn; sourceId: SQLiteColumn }) {
  return [
    inList(`${table}_origin_check`, 'origin', ORIGINS),
    inList(`${table}_source_check`, 'source', SOURCES, true),
    check(`${table}_origin_source_check`, sql.raw(`origin = 'user' OR source IS NOT NULL`)),
    uniqueIndex(`${table}_source_uq`)
      .on(t.source, t.sourceId)
      .where(sql`deleted_at IS NULL AND source_id IS NOT NULL`),
  ];
}

/** `lower(<column>)` index expression. */
export const lower = (column: string): SQL => sql.raw(`lower(${column})`);

export const FOCUS_KINDS = ['POSITION', 'SUBJECT'] as const;
export const TIERS = ['CORE', 'EXTENDED'] as const;
export const TECHNIQUE_TYPES = ['TRANSITION', 'GUARD_PASS', 'SWEEP', 'ESCAPE', 'TAKEDOWN', 'SUBMISSION'] as const;
export const APPLIES_TO = ['GI', 'NOGI', 'BOTH'] as const;
export const PERSPECTIVES = ['TOP', 'BOTTOM'] as const;
export const SESSION_STATUSES = ['PLANNED', 'COMPLETED', 'SKIPPED'] as const;
export const DIRECTIONS = ['LANDED', 'TAKEN'] as const;
export const OUTCOMES = ['DOMINANT', 'EVEN', 'DOMINATED'] as const;
export const RANK_SCALES = ['ADULT', 'KIDS'] as const;
export const ADULT_BELTS = ['WHITE', 'BLUE', 'PURPLE', 'BROWN', 'BLACK'] as const;
export const KIDS_BELTS = [
  'WHITE', 'GREY_WHITE', 'GREY', 'GREY_BLACK', 'YELLOW_WHITE', 'YELLOW', 'YELLOW_BLACK',
  'ORANGE_WHITE', 'ORANGE', 'ORANGE_BLACK', 'GREEN_WHITE', 'GREEN', 'GREEN_BLACK',
] as const;
/** Union of both scales (§3.1); `rank_entries.belt` and `rounds.partner_belt` accept it. */
export const BELTS = [
  'WHITE', 'BLUE', 'PURPLE', 'BROWN', 'BLACK',
  'GREY_WHITE', 'GREY', 'GREY_BLACK', 'YELLOW_WHITE', 'YELLOW', 'YELLOW_BLACK',
  'ORANGE_WHITE', 'ORANGE', 'ORANGE_BLACK', 'GREEN_WHITE', 'GREEN', 'GREEN_BLACK',
] as const;
export const RESOURCE_STATUSES = ['TO_WATCH', 'WATCHED'] as const;
export const RESOURCE_TARGET_KINDS = ['TECHNIQUE', 'POSITION', 'SUBJECT', 'CYCLE'] as const;
export const ALIAS_TARGET_KINDS = ['POSITION', 'TECHNIQUE'] as const;
export const SETTING_VALUE_TYPES = ['BOOL', 'INT', 'STRING', 'JSON'] as const;
export const MERGE_TARGET_KINDS = ['POSITION', 'SUBJECT', 'TECHNIQUE'] as const;
