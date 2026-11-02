/**
 * Phase-A reads and writes for the sprint-2 surface, backed by `progressStore` + `mockStore.taxonomy`.
 * `src/hooks/data/index.ts` re-exports these; phase B points that file at `src/repositories` and this
 * module stays for unit tests only.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';

import type {
  AboutData, AlgorithmParamRow, PositionInput, ProgressOverview, RankEntry, RankInput, ResourceInput, ResourceRow, ResourceStatus,
  ResourceTarget, ResourceTypeRow, SubjectInput, TaxonomyKind, TechniqueDetail, TechniqueInput,
} from '../hooks/data/types';
import type { DomainError } from '../domain/errors';
import { mockStore } from './mockStore';
import { progressStore } from './progressStore';

export type MockLive<T> = { data?: T; error?: DomainError; reload: () => void };

/** Recomputes on every store change; honours the forced loading / error switch used by tests. */
function useQuery<T>(compute: () => T, deps: unknown[]): MockLive<T> {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    const offs = [progressStore.subscribe(bump), mockStore.subscribe(bump)];
    return () => offs.forEach((off) => off());
  }, []);
  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const state = useMemo(() => {
    const f = progressStore.forced ?? mockStore.forced;
    if (f === 'loading') return {};
    if (f) return { error: f.error as unknown as DomainError };
    try {
      return { data: compute() };
    } catch (e) {
      return { error: e as DomainError };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, ...deps]);
  return { ...state, reload };
}

export const useProgress = (): MockLive<ProgressOverview> => useQuery(() => progressStore.overview(), []);
export const useAlgorithmParams = (): MockLive<AlgorithmParamRow[]> => useQuery(() => progressStore.params.map((p) => ({ ...p })), []);
export const useRankHistory = (): MockLive<RankEntry[]> => useQuery(() => progressStore.rankHistory(), []);
export const useTechnique = (id: string): MockLive<TechniqueDetail> => useQuery(() => progressStore.technique(id), [id]);
export const useResources = (target: ResourceTarget): MockLive<ResourceRow[]> => useQuery(() => progressStore.resourcesFor(target), [target.kind, target.id]);
export const useResourceTypes = (): MockLive<ResourceTypeRow[]> => useQuery(() => progressStore.resourceTypes, []);
export const useAbout = (): MockLive<AboutData> => useQuery(() => progressStore.about, []);

const run = async <T>(fn: () => T): Promise<T> => fn();
const tax = () => mockStore.taxonomy;

/** The sprint-2 half of `DataActions`. */
export const progressActions = {
  setParam: (i: { version: string; key: string; value: number }) => run(() => progressStore.setParam(i.version, i.key, i.value)),
  resetParams: (version: string) => run(() => progressStore.resetParams(version)),
  setSetting: (key: string, value: unknown) => run(() => progressStore.setSetting(key, value)),
  updateRank: (id: string, i: RankInput) => run(() => progressStore.updateRank(id, i)),
  deleteRank: (id: string) => run(() => progressStore.deleteRank(id, true)),
  undoDeleteRank: (id: string) => run(() => progressStore.deleteRank(id, false)),
  createPosition: (i: PositionInput) => run(() => tax().createPosition(i)),
  createTechnique: (i: TechniqueInput) => run(() => tax().createTechnique(i)),
  createSubject: (i: SubjectInput) => run(() => tax().createSubject(i)),
  updatePosition: (id: string, p: Partial<PositionInput>) => run(() => tax().updatePosition(id, p)),
  updateTechnique: (id: string, p: Partial<TechniqueInput>) => run(() => tax().updateTechnique(id, p)),
  updateSubject: (id: string, p: Partial<SubjectInput>) => run(() => tax().updateSubject(id, p)),
  deleteTaxonomy: (kind: TaxonomyKind, id: string) => run(() => tax().softDelete(kind, id)),
  undoDeleteTaxonomy: (kind: TaxonomyKind, id: string) => run(() => tax().undoDelete(kind, id)),
  addAlias: (kind: 'POSITION' | 'TECHNIQUE', id: string, name: string) => run(() => tax().addAlias(kind, id, name)),
  removeAlias: (aliasId: string) => run(() => tax().removeAlias(aliasId)),
  undoRemoveAlias: (aliasId: string) => run(() => tax().undoRemoveAlias(aliasId)),
  merge: (kind: TaxonomyKind, fromId: string, intoId: string) => run(() => tax().merge(kind, fromId, intoId)),
  undoMerge: (mergeId: string) => run(() => tax().undoMerge(mergeId)),
  createResource: (input: ResourceInput, target: ResourceTarget) => run(() => progressStore.createResource(input, target)),
  updateResource: (id: string, patch: Partial<ResourceInput>) => run(() => progressStore.updateResource(id, patch)),
  setResourceStatus: (id: string, status: ResourceStatus) => run(() => progressStore.setResourceStatus(id, status)),
  deleteResource: (id: string) => run(() => progressStore.deleteResource(id)),
  undoDeleteResource: (id: string) => run(() => progressStore.undoDeleteResource(id)),
};
