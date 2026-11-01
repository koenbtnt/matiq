import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { FOCUS_KINDS, inList, LIVE, seam } from './_columns';
import { cycles } from './cycles';

export const cycleFocuses = sqliteTable(
  'cycle_focuses',
  {
    ...seam(),
    cycleId: text('cycle_id')
      .notNull()
      .references(() => cycles.id, { onDelete: 'restrict' }),
    focusKind: text('focus_kind', { enum: FOCUS_KINDS }).notNull(),
    focusRefId: text('focus_ref_id').notNull(),
    sortOrder: integer('sort_order').notNull(),
  },
  (t) => [
    inList('cycle_focuses_focus_kind_check', 'focus_kind', FOCUS_KINDS),
    uniqueIndex('cycle_focuses_ref_live_uq').on(t.cycleId, t.focusKind, t.focusRefId).where(LIVE),
    index('cycle_focuses_ref_idx').on(t.focusKind, t.focusRefId),
  ],
);
