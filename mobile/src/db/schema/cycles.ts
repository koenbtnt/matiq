import { sql } from 'drizzle-orm';
import { check, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { isDate, seam } from './_columns';

/** Training cycles (sprint 3 UI; table ships in 0001, A-24). */
export const cycles = sqliteTable(
  'cycles',
  {
    ...seam(),
    name: text('name'),
    startsOn: text('starts_on').notNull(),
    endsOn: text('ends_on').notNull(),
    note: text('note'),
  },
  () => [
    isDate('cycles_starts_on_check', 'starts_on'),
    isDate('cycles_ends_on_check', 'ends_on'),
    check('cycles_dates_order_check', sql.raw('ends_on > starts_on')),
  ],
);
