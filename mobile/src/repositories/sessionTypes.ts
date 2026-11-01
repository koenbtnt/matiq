import { asc, isNull } from 'drizzle-orm';

import { getDb, type Db } from '../db/client';
import { sessionTypes as sessionTypesTable } from '../db/schema';
import type { SessionTypeRow } from './contracts';

export function listSessionTypesSync(database: Db): SessionTypeRow[] {
  return database
    .select({ id: sessionTypesTable.id, name: sessionTypesTable.name, sortOrder: sessionTypesTable.sortOrder })
    .from(sessionTypesTable)
    .where(isNull(sessionTypesTable.deletedAt))
    .orderBy(asc(sessionTypesTable.sortOrder), asc(sessionTypesTable.name))
    .all();
}

export const sessionTypes = {
  /** Live session types in display order. */
  async list(database: Db = getDb()): Promise<SessionTypeRow[]> {
    return listSessionTypesSync(database);
  },
};
