import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { BELTS, between, inList, isDate, RANK_SCALES, seam } from './_columns';

export const rankEntries = sqliteTable(
  'rank_entries',
  {
    ...seam(),
    scale: text('scale', { enum: RANK_SCALES }).notNull(),
    belt: text('belt', { enum: BELTS }).notNull(),
    stripes: integer('stripes').notNull().default(0),
    awardedOn: text('awarded_on').notNull(),
    note: text('note'),
  },
  (t) => [
    inList('rank_entries_scale_check', 'scale', RANK_SCALES),
    inList('rank_entries_belt_check', 'belt', BELTS),
    between('rank_entries_stripes_check', 'stripes', 0, 6, false),
    isDate('rank_entries_awarded_on_check', 'awarded_on'),
    index('rank_entries_awarded_idx').on(t.awardedOn),
  ],
);
