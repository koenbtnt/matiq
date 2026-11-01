/** The UI's one import surface for data: repository namespaces, contract types and hooks. */
export * from './contracts';
export { about, type AboutMeta } from './about';
export { algorithmParams } from './algorithmParams';
export { progression } from './progression';
export { rank } from './rank';
export { resources, resourceTypes } from './resources';
export { rounds } from './rounds';
export { seed, ensureSeeded } from './seed';
export { sessions } from './sessions';
export { sessionTypes } from './sessionTypes';
export { settings } from './settings';
export { submissions } from './submissions';
export { taxonomy } from './taxonomy';
export * from './hooks';
export { DomainError, ERROR_CODES, isDomainError, type ErrorCode } from '../domain/errors';
export { SETTING_VOCABULARIES, SETTING_INT_RANGES, type ThemeOverride } from '../domain/settings/defaults';
export { computeProgression, aggregateConsistency, aggregatePlannedVsActual } from '../domain/progression';
export { resetDatabase } from '../db/lifecycle';
export {
  bootstrapDatabase,
  setBootstrapOverrides,
  type BootstrapDeps,
  type BootstrapErrorCode,
  type BootstrapResult,
} from '../db/bootstrap';
