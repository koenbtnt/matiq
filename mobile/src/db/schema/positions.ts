import { sql } from 'drizzle-orm';
import { check, index, sqliteTable, text, uniqueIndex, type AnySQLiteColumn } from 'drizzle-orm/sqlite-core';

import { imported, importedConstraints, inList, LIVE, seam, TIERS } from './_columns';

export const positions = sqliteTable(
  'positions',
  {
    ...seam(),
    ...imported(),
    slug: text('slug').notNull(),
    canonicalName: text('canonical_name').notNull(),
    description: text('description'),
    notes: text('notes'),
    parentPositionId: text('parent_position_id').references((): AnySQLiteColumn => positions.id, {
      onDelete: 'restrict',
    }),
    tier: text('tier', { enum: TIERS }).notNull(),
  },
  (t) => [
    ...importedConstraints('positions', t),
    inList('positions_tier_check', 'tier', TIERS),
    check('positions_parent_not_self_check', sql.raw('parent_position_id IS NULL OR parent_position_id <> id')),
    uniqueIndex('positions_slug_live_uq').on(t.slug).where(LIVE),
    index('positions_parent_idx').on(t.parentPositionId),
  ],
);
