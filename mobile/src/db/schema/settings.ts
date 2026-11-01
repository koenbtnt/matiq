import { sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { inList, LIVE, seam, SETTING_VALUE_TYPES } from './_columns';

/** User settings; `value` is JSON text typed by `value_type`. Keys: domain/settings/defaults.ts. */
export const settings = sqliteTable(
  'settings',
  {
    ...seam(),
    key: text('key').notNull(),
    value: text('value').notNull(),
    valueType: text('value_type', { enum: SETTING_VALUE_TYPES }).notNull(),
  },
  (t) => [
    inList('settings_value_type_check', 'value_type', SETTING_VALUE_TYPES),
    uniqueIndex('settings_key_live_uq').on(t.key).where(LIVE),
  ],
);
