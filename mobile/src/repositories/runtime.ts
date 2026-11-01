/**
 * Clock and id source of the repositories. Defaults: wall clock and expo-crypto UUID v4; Jest
 * installs deterministic ones with `setRuntime`. The domain never reads these — it receives them.
 */
export type Runtime = { now: () => string; newId: () => string };

const defaults = (): Runtime => ({
  now: () => new Date().toISOString(),
  // Lazy: keeps the native module out of modules that never write.
  newId: () => (require('expo-crypto') as typeof import('expo-crypto')).randomUUID(),
});

let current: Runtime = defaults();

export const runtime = (): Runtime => current;

/** Overrides the clock and/or id source; `setRuntime()` restores the defaults. */
export function setRuntime(overrides?: Partial<Runtime>): void {
  current = { ...defaults(), ...overrides };
}

/** Device IANA time zone (for `today`). */
export const deviceTimeZone = (): string => Intl.DateTimeFormat().resolvedOptions().timeZone;
