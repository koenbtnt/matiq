/** The UI's data types are the repositories' contract types (data-contracts.md). */
export * from '../../repositories/contracts';
export type { LiveResult, DatabaseBootstrapState } from '../../repositories/hooks';

import type { LogSessionInput, PlanSessionInput, RankEntry, RankInput, SessionDetail, SessionSummary } from '../../repositories/contracts';

/** Mutations the screens call. Each rejects with a `DomainError`. */
export type DataActions = {
  logSession: (input: LogSessionInput) => Promise<SessionDetail>;
  planSession: (input: PlanSessionInput) => Promise<SessionDetail>;
  softDelete: (sessionId: string) => Promise<SessionSummary>;
  undoDelete: (sessionId: string) => Promise<SessionSummary>;
  skip: (sessionId: string) => Promise<SessionSummary>;
  undoSkip: (sessionId: string) => Promise<SessionSummary>;
  addRank: (input: RankInput) => Promise<RankEntry>;
  resetDatabase: () => Promise<void>;
};
