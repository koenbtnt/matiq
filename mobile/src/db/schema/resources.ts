import { index, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { imported, importedConstraints, inList, RESOURCE_STATUSES, seam } from './_columns';
import { resourceTypes } from './resource_types';

export const resources = sqliteTable(
  'resources',
  {
    ...seam(),
    ...imported(),
    title: text('title').notNull(),
    url: text('url'),
    author: text('author'),
    resourceTypeId: text('resource_type_id')
      .notNull()
      .references(() => resourceTypes.id, { onDelete: 'restrict' }),
    notes: text('notes'),
    status: text('status', { enum: RESOURCE_STATUSES }).notNull().default('TO_WATCH'),
  },
  (t) => [
    ...importedConstraints('resources', t),
    inList('resources_status_check', 'status', RESOURCE_STATUSES),
    index('resources_type_idx').on(t.resourceTypeId),
  ],
);
