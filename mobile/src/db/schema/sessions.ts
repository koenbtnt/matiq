import { sql } from 'drizzle-orm';
import { check, index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { between, inList, isDate, positive, seam, SESSION_STATUSES } from './_columns';
import { cycles } from './cycles';
import { sessionTypes } from './session_types';
import { slots } from './slots';

export const sessions = sqliteTable(
  'sessions',
  {
    ...seam(),
    sessionTypeId: text('session_type_id')
      .notNull()
      .references(() => sessionTypes.id, { onDelete: 'restrict' }),
    status: text('status', { enum: SESSION_STATUSES }).notNull().default('PLANNED'),
    startsAt: text('starts_at').notNull(),
    localDate: text('local_date').notNull(),
    durationMinutes: integer('duration_minutes'),
    rating: integer('rating'),
    intensity: integer('intensity'),
    energy: integer('energy'),
    contextNote: text('context_note'),
    whatWorked: text('what_worked'),
    whatFailed: text('what_failed'),
    roundsCount: integer('rounds_count'),
    submissionsLanded: integer('submissions_landed'),
    submissionsTaken: integer('submissions_taken'),
    cycleId: text('cycle_id').references(() => cycles.id, { onDelete: 'restrict' }),
    slotId: text('slot_id').references(() => slots.id, { onDelete: 'restrict' }),
    completedAt: text('completed_at'),
    reviewedAt: text('reviewed_at'),
  },
  (t) => [
    inList('sessions_status_check', 'status', SESSION_STATUSES),
    between('sessions_rating_check', 'rating', 1, 5),
    between('sessions_intensity_check', 'intensity', 1, 5),
    between('sessions_energy_check', 'energy', 1, 5),
    positive('sessions_duration_check', 'duration_minutes'),
    positive('sessions_rounds_count_check', 'rounds_count', true),
    positive('sessions_submissions_landed_check', 'submissions_landed', true),
    positive('sessions_submissions_taken_check', 'submissions_taken', true),
    isDate('sessions_local_date_check', 'local_date'),
    check('sessions_completed_at_check', sql.raw("status <> 'COMPLETED' OR completed_at IS NOT NULL")),
    index('sessions_status_starts_idx').on(t.status, t.startsAt),
    index('sessions_local_date_idx').on(t.localDate),
    index('sessions_session_type_idx').on(t.sessionTypeId),
    index('sessions_cycle_idx').on(t.cycleId),
    index('sessions_slot_idx').on(t.slotId),
  ],
);
