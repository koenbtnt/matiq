import { sql } from 'drizzle-orm';
import { check, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { inList, MERGE_TARGET_KINDS, seam } from './_columns';

/** Undo log of taxonomy merges (sprint 2 UI). */
export const taxonomyMerges = sqliteTable(
  'taxonomy_merges',
  {
    ...seam(),
    targetKind: text('target_kind', { enum: MERGE_TARGET_KINDS }).notNull(),
    fromId: text('from_id').notNull(),
    intoId: text('into_id').notNull(),
    payload: text('payload').notNull(),
    undoneAt: text('undone_at'),
  },
  () => [
    inList('taxonomy_merges_target_kind_check', 'target_kind', MERGE_TARGET_KINDS),
    check('taxonomy_merges_not_self_check', sql.raw('from_id <> into_id')),
  ],
);
