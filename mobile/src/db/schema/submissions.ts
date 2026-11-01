import { index, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { DIRECTIONS, inList, seam } from './_columns';
import { rounds } from './rounds';
import { sessions } from './sessions';
import { techniques } from './techniques';

/** A submission landed or taken; `round_id` null = logged at session level (R-06). */
export const submissions = sqliteTable(
  'submissions',
  {
    ...seam(),
    sessionId: text('session_id')
      .notNull()
      .references(() => sessions.id, { onDelete: 'restrict' }),
    roundId: text('round_id').references(() => rounds.id, { onDelete: 'restrict' }),
    direction: text('direction', { enum: DIRECTIONS }).notNull(),
    techniqueId: text('technique_id').references(() => techniques.id, { onDelete: 'restrict' }),
    note: text('note'),
  },
  (t) => [
    inList('submissions_direction_check', 'direction', DIRECTIONS),
    index('submissions_session_idx').on(t.sessionId),
    index('submissions_round_idx').on(t.roundId),
    index('submissions_technique_idx').on(t.techniqueId),
  ],
);
