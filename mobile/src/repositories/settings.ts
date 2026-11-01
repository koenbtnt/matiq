import { and, eq, isNull } from 'drizzle-orm';

import { getDb, type Db } from '../db/client';
import { settings as settingsTable } from '../db/schema';
import { DomainError } from '../domain/errors';
import {
  defaultSettings, isSettingKey, SETTING_DEFAULTS, SETTING_KEYS, validateSettingValue,
  type SettingKey, type SettingsMap, type SettingValue,
} from '../domain/settings/defaults';
import type { Setting } from './contracts';
import { runtime } from './runtime';

function parse<K extends SettingKey>(key: K, raw: string): SettingValue<K> {
  try {
    return validateSettingValue<K>(key, JSON.parse(raw));
  } catch {
    // A corrupt row falls back to the shipped default rather than breaking every screen.
    return SETTING_DEFAULTS[key].value as SettingValue<K>;
  }
}

function rowFor(key: SettingKey, database: Db) {
  return database
    .select()
    .from(settingsTable)
    .where(and(eq(settingsTable.key, key), isNull(settingsTable.deletedAt)))
    .get();
}

/** Every known setting (missing rows → default). Sync; usable inside a transaction. */
export function allSettingsSync(database: Db): SettingsMap {
  const out = defaultSettings() as Record<string, unknown>;
  const rows = database.select().from(settingsTable).where(isNull(settingsTable.deletedAt)).all();
  for (const row of rows) if (isSettingKey(row.key)) out[row.key] = parse(row.key, row.value);
  return out as SettingsMap;
}

export function getSettingSync<K extends SettingKey>(key: K, database: Db): Setting<K> {
  if (!isSettingKey(key)) throw new DomainError('SETTING_UNKNOWN', { key });
  const row = rowFor(key, database);
  const value = row ? parse(key, row.value) : (SETTING_DEFAULTS[key].value as SettingValue<K>);
  return { key, value, valueType: SETTING_DEFAULTS[key].valueType };
}

/** Inserts the rows of keys that have none yet; returns how many were inserted. Sync. */
export function ensureSettingRowsSync(now: string, database: Db): number {
  let inserted = 0;
  for (const key of SETTING_KEYS) {
    if (rowFor(key, database)) continue;
    const def = SETTING_DEFAULTS[key];
    database
      .insert(settingsTable)
      .values({
        id: runtime().newId(),
        key,
        value: JSON.stringify(def.value),
        valueType: def.valueType,
        createdAt: now,
        updatedAt: now,
      })
      .run();
    inserted += 1;
  }
  return inserted;
}

export const settings = {
  async get<K extends SettingKey>(key: K, database: Db = getDb()): Promise<Setting<K>> {
    return getSettingSync(key, database);
  },

  /** Validates the value against the key's type and upserts the row. */
  async set<K extends SettingKey>(key: K, value: SettingValue<K>, database: Db = getDb()): Promise<Setting<K>> {
    const valid = validateSettingValue<K>(key, value);
    const now = runtime().now();
    database.transaction((tx) => {
      const row = rowFor(key, tx);
      if (row) {
        tx.update(settingsTable).set({ value: JSON.stringify(valid), updatedAt: now }).where(eq(settingsTable.id, row.id)).run();
      } else {
        tx.insert(settingsTable)
          .values({
            id: runtime().newId(),
            key,
            value: JSON.stringify(valid),
            valueType: SETTING_DEFAULTS[key].valueType,
            createdAt: now,
            updatedAt: now,
          })
          .run();
      }
    });
    return { key, value: valid, valueType: SETTING_DEFAULTS[key].valueType };
  },

  /** Every known setting as `Setting` rows, in `defaults.ts` order. */
  async all(database: Db = getDb()): Promise<Setting[]> {
    const map = allSettingsSync(database);
    return SETTING_KEYS.map((key) => ({ key, value: map[key], valueType: SETTING_DEFAULTS[key].valueType }) as Setting);
  },
};
