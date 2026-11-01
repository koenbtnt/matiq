import { sql } from 'drizzle-orm';
import { check, index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { between, bool01, FOCUS_KINDS, inList, LIVE, positive, seam } from './_columns';
import { sessions } from './sessions';

/** A focus `{kind, ref}` of a session; `focus_ref_id` is polymorphic (no SQL FK, ADR 0014). */
export const sessionFocuses = sqliteTable(
  'session_focuses',
  {
    ...seam(),
    sessionId: text('session_id')
      .notNull()
      .references(() => sessions.id, { onDelete: 'restrict' }),
    focusKind: text('focus_kind', { enum: FOCUS_KINDS }).notNull(),
    focusRefId: text('focus_ref_id').notNull(),
    isPlanned: integer('is_planned', { mode: 'boolean' }).notNull(),
    isActual: integer('is_actual', { mode: 'boolean' }).notNull(),
    needsWork: integer('needs_work', { mode: 'boolean' }).notNull().default(false),
    rating: integer('rating'),
    comment: text('comment'),
    hitCount: integer('hit_count'),
    caughtCount: integer('caught_count'),
    sortOrder: integer('sort_order').notNull(),
  },
  (t) => [
    inList('session_focuses_focus_kind_check', 'focus_kind', FOCUS_KINDS),
    bool01('session_focuses_is_planned_check', 'is_planned'),
    bool01('session_focuses_is_actual_check', 'is_actual'),
    bool01('session_focuses_needs_work_check', 'needs_work'),
    check('session_focuses_needs_work_actual_check', sql.raw('needs_work = 0 OR is_actual = 1')),
    check('session_focuses_rating_actual_check', sql.raw('rating IS NULL OR is_actual = 1')),
    check(
      'session_focuses_counts_actual_check',
      sql.raw('(hit_count IS NULL AND caught_count IS NULL) OR is_actual = 1'),
    ),
    check('session_focuses_planned_or_actual_check', sql.raw('is_planned = 1 OR is_actual = 1')),
    between('session_focuses_rating_check', 'rating', 1, 5),
    positive('session_focuses_hit_count_check', 'hit_count', true),
    positive('session_focuses_caught_count_check', 'caught_count', true),
    uniqueIndex('session_focuses_ref_live_uq').on(t.sessionId, t.focusKind, t.focusRefId).where(LIVE),
    index('session_focuses_ref_idx').on(t.focusKind, t.focusRefId),
  ],
);
