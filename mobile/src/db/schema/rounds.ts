import { sql } from 'drizzle-orm';
import { check, index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { BELTS, inList, LIVE, OUTCOMES, positive, seam } from './_columns';
import { sessions } from './sessions';

export const rounds = sqliteTable(
  'rounds',
  {
    ...seam(),
    sessionId: text('session_id')
      .notNull()
      .references(() => sessions.id, { onDelete: 'restrict' }),
    roundNo: integer('round_no').notNull(),
    partnerBelt: text('partner_belt', { enum: BELTS }),
    outcome: text('outcome', { enum: OUTCOMES }),
    durationMinutes: integer('duration_minutes'),
    note: text('note'),
  },
  (t) => [
    check('rounds_round_no_check', sql.raw('round_no >= 1')),
    positive('rounds_duration_check', 'duration_minutes'),
    inList('rounds_partner_belt_check', 'partner_belt', BELTS, true),
    inList('rounds_outcome_check', 'outcome', OUTCOMES, true),
    uniqueIndex('rounds_session_round_live_uq').on(t.sessionId, t.roundNo).where(LIVE),
    index('rounds_session_idx').on(t.sessionId),
  ],
);
