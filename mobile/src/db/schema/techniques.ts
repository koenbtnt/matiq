import { sql } from 'drizzle-orm';
import { check, index, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import {
  APPLIES_TO, imported, importedConstraints, inList, LIVE, PERSPECTIVES, seam, TECHNIQUE_TYPES, TIERS,
} from './_columns';
import { positions } from './positions';

export const techniques = sqliteTable(
  'techniques',
  {
    ...seam(),
    ...imported(),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    type: text('type', { enum: TECHNIQUE_TYPES }).notNull(),
    fromPositionId: text('from_position_id')
      .notNull()
      .references(() => positions.id, { onDelete: 'restrict' }),
    toPositionId: text('to_position_id').references(() => positions.id, { onDelete: 'restrict' }),
    appliesTo: text('applies_to', { enum: APPLIES_TO }).notNull().default('BOTH'),
    perspective: text('perspective', { enum: PERSPECTIVES }),
    description: text('description'),
    notes: text('notes'),
    tier: text('tier', { enum: TIERS }).notNull(),
  },
  (t) => [
    ...importedConstraints('techniques', t),
    inList('techniques_type_check', 'type', TECHNIQUE_TYPES),
    check('techniques_submission_target_check', sql.raw("(type = 'SUBMISSION') = (to_position_id IS NULL)")),
    inList('techniques_applies_to_check', 'applies_to', APPLIES_TO),
    inList('techniques_perspective_check', 'perspective', PERSPECTIVES, true),
    inList('techniques_tier_check', 'tier', TIERS),
    uniqueIndex('techniques_slug_live_uq').on(t.slug).where(LIVE),
    index('techniques_from_idx').on(t.fromPositionId),
    index('techniques_to_idx').on(t.toPositionId),
  ],
);
