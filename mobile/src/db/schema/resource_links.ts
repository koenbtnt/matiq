import { index, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { inList, LIVE, RESOURCE_TARGET_KINDS, seam } from './_columns';
import { resources } from './resources';

/** Links a resource to a technique, position, subject or cycle; `target_id` is polymorphic. */
export const resourceLinks = sqliteTable(
  'resource_links',
  {
    ...seam(),
    resourceId: text('resource_id')
      .notNull()
      .references(() => resources.id, { onDelete: 'restrict' }),
    targetKind: text('target_kind', { enum: RESOURCE_TARGET_KINDS }).notNull(),
    targetId: text('target_id').notNull(),
  },
  (t) => [
    inList('resource_links_target_kind_check', 'target_kind', RESOURCE_TARGET_KINDS),
    uniqueIndex('resource_links_live_uq').on(t.resourceId, t.targetKind, t.targetId).where(LIVE),
    index('resource_links_target_idx').on(t.targetKind, t.targetId),
  ],
);
