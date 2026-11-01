import { sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { imported, importedConstraints, LIVE, lower, seam } from './_columns';

export const subjects = sqliteTable(
  'subjects',
  {
    ...seam(),
    ...imported(),
    name: text('name').notNull(),
    description: text('description'),
  },
  (t) => [...importedConstraints('subjects', t), uniqueIndex('subjects_name_live_uq').on(lower('name')).where(LIVE)],
);
