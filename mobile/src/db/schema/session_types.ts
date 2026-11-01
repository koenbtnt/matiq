import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { imported, importedConstraints, LIVE, lower, seam } from './_columns';

export const sessionTypes = sqliteTable(
  'session_types',
  {
    ...seam(),
    ...imported(),
    name: text('name').notNull(),
    sortOrder: integer('sort_order').notNull(),
  },
  (t) => [
    ...importedConstraints('session_types', t),
    uniqueIndex('session_types_name_live_uq').on(lower('name')).where(LIVE),
  ],
);
