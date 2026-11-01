/** The UI's one import surface for data: repository namespaces, contract types and hooks. */
export * from './contracts';
export { algorithmParams } from './algorithmParams';
export { rank } from './rank';
export { rounds } from './rounds';
export { seed, ensureSeeded } from './seed';
export { sessions } from './sessions';
export { sessionTypes } from './sessionTypes';
export { settings } from './settings';
export { submissions } from './submissions';
export { taxonomy } from './taxonomy';
export * from './hooks';
export { DomainError, ERROR_CODES, isDomainError, type ErrorCode } from '../domain/errors';
export { resetDatabase } from '../db/lifecycle';
export { bootstrapDatabase, type BootstrapErrorCode, type BootstrapResult } from '../db/bootstrap';
