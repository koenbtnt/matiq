import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { imported, importedConstraints, LIVE, lower, seam } from './_columns';

export const resourceTypes = sqliteTable(
  'resource_types',
  {
    ...seam(),
    ...imported(),
    name: text('name').notNull(),
    sortOrder: integer('sort_order').notNull(),
  },
  (t) => [
    ...importedConstraints('resource_types', t),
    uniqueIndex('resource_types_name_live_uq').on(lower('name')).where(LIVE),
  ],
);
