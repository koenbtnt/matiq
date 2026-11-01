import { and, asc, eq, isNull } from 'drizzle-orm';

import { getDb, type Db } from '../db/client';
import { algorithmParams as paramsTable } from '../db/schema';
import { ALGORITHM_VERSION_V1, V1_PARAM_DEFAULTS } from '../domain/progression/v1/params';
import type { AlgorithmParamRow } from './contracts';
import { runtime } from './runtime';

/** Inserts the v1 rows that are missing; returns how many were inserted. Sync. */
export function ensureV1ParamsSync(now: string, database: Db): number {
  let inserted = 0;
  for (const p of V1_PARAM_DEFAULTS) {
    const exists = database
      .select({ id: paramsTable.id })
      .from(paramsTable)
      .where(and(eq(paramsTable.algorithmVersion, ALGORITHM_VERSION_V1), eq(paramsTable.key, p.key), isNull(paramsTable.deletedAt)))
      .get();
    if (exists) continue;
    database
      .insert(paramsTable)
      .values({
        id: runtime().newId(),
        algorithmVersion: ALGORITHM_VERSION_V1,
        key: p.key,
        value: p.defaultValue,
        defaultValue: p.defaultValue,
        min: p.min,
        max: p.max,
        createdAt: now,
        updatedAt: now,
      })
      .run();
    inserted += 1;
  }
  return inserted;
}

export const algorithmParams = {
  /** Live parameter rows of one algorithm version, by key. */
  async list(version: string, database: Db = getDb()): Promise<AlgorithmParamRow[]> {
    return database
      .select({
        id: paramsTable.id,
        algorithmVersion: paramsTable.algorithmVersion,
        key: paramsTable.key,
        value: paramsTable.value,
        defaultValue: paramsTable.defaultValue,
        min: paramsTable.min,
        max: paramsTable.max,
      })
      .from(paramsTable)
      .where(and(eq(paramsTable.algorithmVersion, version), isNull(paramsTable.deletedAt)))
      .orderBy(asc(paramsTable.key))
      .all();
  },
};
