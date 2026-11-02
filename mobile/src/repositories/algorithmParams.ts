import { and, asc, eq, isNull, sql } from 'drizzle-orm';

import { getDb, type Db } from '../db/client';
import { algorithmParams as paramsTable } from '../db/schema';
import { DomainError } from '../domain/errors';
import { ALGORITHM_VERSION_V1, V1_PARAM_DEFAULTS, validateParamValue } from '../domain/progression/v1/params';
import type { AlgorithmParamRow, ParamInput } from './contracts';
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

const paramColumns = {
  id: paramsTable.id,
  algorithmVersion: paramsTable.algorithmVersion,
  key: paramsTable.key,
  value: paramsTable.value,
  defaultValue: paramsTable.defaultValue,
  min: paramsTable.min,
  max: paramsTable.max,
};

export const algorithmParams = {
  /** Live parameter rows of one algorithm version, by key. */
  async list(version: string, database: Db = getDb()): Promise<AlgorithmParamRow[]> {
    return database
      .select(paramColumns)
      .from(paramsTable)
      .where(and(eq(paramsTable.algorithmVersion, version), isNull(paramsTable.deletedAt)))
      .orderBy(asc(paramsTable.key))
      .all();
  },

  /** PS-07: validates against the stored row's min/max (and integer keys) and writes `value`. */
  async set({ version, key, value }: ParamInput, database: Db = getDb()): Promise<AlgorithmParamRow> {
    const now = runtime().now();
    return database.transaction((tx) => {
      const row = tx
        .select(paramColumns)
        .from(paramsTable)
        .where(and(eq(paramsTable.algorithmVersion, version), eq(paramsTable.key, key), isNull(paramsTable.deletedAt)))
        .get();
      if (!row) throw new DomainError('PARAM_UNKNOWN', { key });
      const valid = validateParamValue(row, value);
      tx.update(paramsTable).set({ value: valid, updatedAt: now }).where(eq(paramsTable.id, row.id)).run();
      return { ...row, value: valid };
    });
  },

  /** `value = default_value` for every live row of `version`; returns the rows by key. */
  async resetAll(version: string, database: Db = getDb()): Promise<AlgorithmParamRow[]> {
    const now = runtime().now();
    return database.transaction((tx) => {
      tx.update(paramsTable)
        .set({ value: sql`${paramsTable.defaultValue}`, updatedAt: now })
        .where(and(eq(paramsTable.algorithmVersion, version), isNull(paramsTable.deletedAt)))
        .run();
      return tx
        .select(paramColumns)
        .from(paramsTable)
        .where(and(eq(paramsTable.algorithmVersion, version), isNull(paramsTable.deletedAt)))
        .orderBy(asc(paramsTable.key))
        .all();
    });
  },
};
