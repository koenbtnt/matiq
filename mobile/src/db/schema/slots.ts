import { sql } from 'drizzle-orm';
import { check, index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { between, bool01, positive, seam } from './_columns';
import { sessionTypes } from './session_types';

/** Weekly training slots (sprint 3 UI; table ships in 0001, A-24). */
export const slots = sqliteTable(
  'slots',
  {
    ...seam(),
    weekday: integer('weekday').notNull(),
    startTime: text('start_time').notNull(),
    durationMinutes: integer('duration_minutes'),
    sessionTypeId: text('session_type_id')
      .notNull()
      .references(() => sessionTypes.id, { onDelete: 'restrict' }),
    useCycleFocuses: integer('use_cycle_focuses', { mode: 'boolean' }).notNull().default(true),
    pausedAt: text('paused_at'),
  },
  (t) => [
    between('slots_weekday_check', 'weekday', 1, 7, false),
    check(
      'slots_start_time_check',
      sql.raw("start_time GLOB '[01][0-9]:[0-5][0-9]' OR start_time GLOB '2[0-3]:[0-5][0-9]'"),
    ),
    positive('slots_duration_check', 'duration_minutes'),
    bool01('slots_use_cycle_focuses_check', 'use_cycle_focuses'),
    index('slots_session_type_idx').on(t.sessionTypeId),
  ],
);
