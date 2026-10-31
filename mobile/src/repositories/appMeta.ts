import { count, isNull } from 'drizzle-orm';

import { db } from '../db/client';
import { appMeta } from '../db/schema';
import type { Db } from './types';

/** Number of live (not soft-deleted) app_meta rows. */
export async function countAppMeta(database: Db = db): Promise<number> {
  const [row] = await database.select({ value: count() }).from(appMeta).where(isNull(appMeta.deleted_at));
  return row?.value ?? 0;
}
