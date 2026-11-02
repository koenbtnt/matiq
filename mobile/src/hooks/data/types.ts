/** The UI's data types are the repositories' contract types (data-contracts.md). */
export * from '../../repositories/contracts';
export type { LiveResult, DatabaseBootstrapState } from '../../repositories/hooks';

import type {
  AlgorithmParamRow, AliasRow, LogSessionInput, MergeResult, PlanSessionInput, PositionInput, PositionRow, RankEntry, RankInput, ResourceInput, ResourceRow,
  ResourceStatus, ResourceTarget, SessionDetail, SessionSummary, SettingKey, SettingValue, SubjectInput, SubjectRow, TaxonomyKind, TechniqueInput, TechniqueRow,
} from '../../repositories/contracts';

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

  // ---- sprint 2 (plan §5.9) ------------------------------------------------
  setParam: (input: { version: string; key: string; value: number }) => Promise<AlgorithmParamRow>;
  resetParams: (version: string) => Promise<AlgorithmParamRow[]>;
  setSetting: <K extends SettingKey>(key: K, value: SettingValue<K>) => Promise<unknown>;
  updateRank: (id: string, input: RankInput) => Promise<RankEntry>;
  deleteRank: (id: string) => Promise<RankEntry>;
  undoDeleteRank: (id: string) => Promise<RankEntry>;
  createPosition: (input: PositionInput) => Promise<PositionRow>;
  createTechnique: (input: TechniqueInput) => Promise<TechniqueRow>;
  createSubject: (input: SubjectInput) => Promise<SubjectRow>;
  updatePosition: (id: string, patch: Partial<PositionInput>) => Promise<PositionRow>;
  updateTechnique: (id: string, patch: Partial<TechniqueInput>) => Promise<TechniqueRow>;
  updateSubject: (id: string, patch: Partial<SubjectInput>) => Promise<SubjectRow>;
  deleteTaxonomy: (kind: TaxonomyKind, id: string) => Promise<unknown>;
  undoDeleteTaxonomy: (kind: TaxonomyKind, id: string) => Promise<unknown>;
  addAlias: (kind: 'POSITION' | 'TECHNIQUE', id: string, name: string) => Promise<AliasRow>;
  removeAlias: (aliasId: string) => Promise<AliasRow>;
  undoRemoveAlias: (aliasId: string) => Promise<AliasRow>;
  merge: (kind: TaxonomyKind, fromId: string, intoId: string) => Promise<MergeResult>;
  undoMerge: (mergeId: string) => Promise<MergeResult>;
  createResource: (input: ResourceInput, target: ResourceTarget) => Promise<ResourceRow>;
  updateResource: (id: string, patch: Partial<ResourceInput>) => Promise<ResourceRow>;
  setResourceStatus: (id: string, status: ResourceStatus) => Promise<ResourceRow>;
  deleteResource: (id: string) => Promise<ResourceRow>;
  undoDeleteResource: (id: string) => Promise<ResourceRow>;
};
