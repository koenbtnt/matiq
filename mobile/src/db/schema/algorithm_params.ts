import { sql } from 'drizzle-orm';
import { check, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { LIVE, seam } from './_columns';

/** Progression algorithm weights and thresholds, editable per version (R-22). */
export const algorithmParams = sqliteTable(
  'algorithm_params',
  {
    ...seam(),
    algorithmVersion: text('algorithm_version').notNull(),
    key: text('key').notNull(),
    value: real('value').notNull(),
    defaultValue: real('default_value').notNull(),
    min: real('min').notNull(),
    max: real('max').notNull(),
  },
  (t) => [
    check('algorithm_params_value_range_check', sql.raw('min <= value AND value <= max')),
    check('algorithm_params_default_range_check', sql.raw('min <= default_value AND default_value <= max')),
    uniqueIndex('algorithm_params_version_key_live_uq').on(t.algorithmVersion, t.key).where(LIVE),
  ],
);
