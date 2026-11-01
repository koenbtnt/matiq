import { sql } from 'drizzle-orm';
import { index, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { seam } from './_columns';
import { sessionFocuses } from './session_focuses';
import { sessions } from './sessions';
import { techniques } from './techniques';

export const sessionTechniques = sqliteTable(
  'session_techniques',
  {
    ...seam(),
    sessionId: text('session_id')
      .notNull()
      .references(() => sessions.id, { onDelete: 'restrict' }),
    sessionFocusId: text('session_focus_id').references(() => sessionFocuses.id, { onDelete: 'restrict' }),
    techniqueId: text('technique_id')
      .notNull()
      .references(() => techniques.id, { onDelete: 'restrict' }),
    note: text('note'),
  },
  (t) => [
    // Live-unique (session, focus or none, technique) as two partial indexes: drizzle-kit 0.31
    // splits index expressions on commas, so coalesce(session_focus_id, '') cannot be declared.
    uniqueIndex('session_techniques_focus_live_uq')
      .on(t.sessionId, t.sessionFocusId, t.techniqueId)
      .where(sql`deleted_at IS NULL AND session_focus_id IS NOT NULL`),
    uniqueIndex('session_techniques_session_live_uq')
      .on(t.sessionId, t.techniqueId)
      .where(sql`deleted_at IS NULL AND session_focus_id IS NULL`),
    index('session_techniques_technique_idx').on(t.techniqueId),
    index('session_techniques_focus_idx').on(t.sessionFocusId),
  ],
);
