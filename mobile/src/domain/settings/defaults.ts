import { DomainError } from '../errors';

/**
 * Settings keys and their shipped defaults (product-spec §4.2). Rows are created from this table
 * on first launch; after that the database row is the source of truth (taxonomy and settings are
 * data, not code). The type of each key is fixed here.
 */
export const SETTING_DEFAULTS = {
  'algorithm.version': { valueType: 'STRING', value: 'v1' },
  'suggest.lastNeedsWork': { valueType: 'BOOL', value: true },
  'suggest.cycle': { valueType: 'BOOL', value: true },
  'suggest.needsWork': { valueType: 'BOOL', value: true },
  'suggest.notTrainedLately': { valueType: 'BOOL', value: true },
  'suggest.max': { valueType: 'INT', value: 3 },
  'log.detailedRounds': { valueType: 'BOOL', value: false },
  'rank.scale': { valueType: 'STRING', value: 'ADULT' },
  'library.showExtended': { valueType: 'BOOL', value: false },
  'theme.override': { valueType: 'STRING', value: 'SYSTEM' },
  'reminders.preSession.enabled': { valueType: 'BOOL', value: false },
  'reminders.preSession.leadMinutes': { valueType: 'INT', value: 60 },
  'reminders.postSession.enabled': { valueType: 'BOOL', value: false },
  'reminders.postSession.delayMinutes': { valueType: 'INT', value: 90 },
} as const satisfies Record<string, { valueType: SettingValueType; value: unknown }>;

export type SettingValueType = 'BOOL' | 'INT' | 'STRING' | 'JSON';
export type SettingKey = keyof typeof SETTING_DEFAULTS;

type ValueOf<T extends SettingValueType> = T extends 'BOOL'
  ? boolean
  : T extends 'INT'
    ? number
    : T extends 'STRING'
      ? string
      : unknown;

/** The value type `defaults.ts` gives key `K` (R2-02): BOOL → boolean, INT → number, STRING → string. */
export type SettingValue<K extends SettingKey> = ValueOf<(typeof SETTING_DEFAULTS)[K]['valueType']>;

/** A full settings snapshot, as the domain consumes it. */
export type SettingsMap = { [K in SettingKey]: SettingValue<K> };

export const SETTING_KEYS = Object.keys(SETTING_DEFAULTS) as SettingKey[];

export const isSettingKey = (key: string): key is SettingKey => Object.hasOwn(SETTING_DEFAULTS, key);

/** Allowed values of the STRING keys (PS-08). */
export const SETTING_VOCABULARIES: Partial<Record<SettingKey, readonly string[]>> = {
  'algorithm.version': ['v1'],
  'rank.scale': ['ADULT', 'KIDS'],
  'theme.override': ['SYSTEM', 'LIGHT', 'DARK'],
};

/** Inclusive ranges of INT keys that have one (plan §8.3). */
export const SETTING_INT_RANGES: Partial<Record<SettingKey, { min: number; max: number }>> = {
  'suggest.max': { min: 0, max: 10 },
};

export type ThemeOverride = 'SYSTEM' | 'LIGHT' | 'DARK';

/**
 * Throws SETTING_UNKNOWN / SETTING_TYPE_MISMATCH / SETTING_VALUE_INVALID (STRING outside its
 * vocabulary, INT outside its range); returns the value unchanged when valid.
 */
export function validateSettingValue<K extends SettingKey>(key: string, value: unknown): SettingValue<K> {
  if (!isSettingKey(key)) throw new DomainError('SETTING_UNKNOWN', { key });
  const type = SETTING_DEFAULTS[key].valueType;
  const ok =
    (type === 'BOOL' && typeof value === 'boolean') ||
    (type === 'INT' && typeof value === 'number' && Number.isInteger(value)) ||
    (type === 'STRING' && typeof value === 'string');
  if (!ok) throw new DomainError('SETTING_TYPE_MISMATCH', { key });
  const vocab = SETTING_VOCABULARIES[key];
  if (vocab && !vocab.includes(value as string)) throw new DomainError('SETTING_VALUE_INVALID', { key });
  const range = SETTING_INT_RANGES[key];
  if (range && ((value as number) < range.min || (value as number) > range.max))
    throw new DomainError('SETTING_VALUE_INVALID', { key, min: range.min, max: range.max });
  return value as SettingValue<K>;
}

/** Defaults as a SettingsMap (what the domain falls back to for a missing row). */
export function defaultSettings(): SettingsMap {
  const out: Record<string, unknown> = {};
  for (const key of SETTING_KEYS) out[key] = SETTING_DEFAULTS[key].value;
  return out as SettingsMap;
}
