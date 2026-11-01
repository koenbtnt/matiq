import { index, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { ALIAS_TARGET_KINDS, imported, importedConstraints, inList, LIVE, lower, seam } from './_columns';

/** Alternative names of a position or technique; `target_id` is polymorphic (no SQL FK). */
export const aliases = sqliteTable(
  'aliases',
  {
    ...seam(),
    ...imported(),
    targetKind: text('target_kind', { enum: ALIAS_TARGET_KINDS }).notNull(),
    targetId: text('target_id').notNull(),
    name: text('name').notNull(),
  },
  (t) => [
    ...importedConstraints('aliases', t),
    inList('aliases_target_kind_check', 'target_kind', ALIAS_TARGET_KINDS),
    uniqueIndex('aliases_target_name_live_uq').on(t.targetKind, t.targetId, lower('name')).where(LIVE),
    index('aliases_target_idx').on(t.targetKind, t.targetId),
    index('aliases_name_idx').on(lower('name')),
  ],
);
