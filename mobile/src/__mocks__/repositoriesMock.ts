/**
 * Mock of `src/repositories` backed by the in-memory store, for UI Jest:
 *   jest.mock('../src/repositories', () => require('../src/__mocks__/repositoriesMock'));
 * Same names and shapes as the real module's surface the seam (`hooks/data`) uses. Reads are
 * synchronous recomputations on store changes; writes are async like the real ones.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';

import { quickLogTarget } from '../domain/session/quickLog';
import type { HomeData, LogSessionInput, PlanSessionInput, RankInput, TechniqueType } from '../repositories/contracts';
import { mockStore, type BootstrapState } from './mockStore';
import { progressActions } from './progressMock';
import { progressStore } from './progressStore';

export * from '../repositories/contracts';

/** Re-computes on every store change; honours the forced loading/error switch used by tests. */
function useQuery<T>(compute: () => T, deps: unknown[]) {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    const offs = [mockStore.subscribe(bump), progressStore.subscribe(bump)];
    return () => offs.forEach((off) => off());
  }, []);
  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const state = useMemo(() => {
    const f = mockStore.forced;
    if (f === 'loading') return {};
    if (f) return { error: f.error };
    try {
      return { data: compute() };
    } catch (e) {
      return { error: e as { code: string } };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, ...deps]);
  return { ...state, reload };
}

export const useHome = () => useQuery(() => mockStore.home(), []);
export const useSession = (id: string) => useQuery(() => mockStore.session(id), [id]);
export const useSessionTypes = () => useQuery(() => mockStore.sessionTypes(), []);
export const useFocusSearch = (query: string) => useQuery(() => mockStore.searchFocuses(query), [query]);
export const useTechniqueSearch = (query: string, opts: { type?: TechniqueType } = {}) =>
  useQuery(() => mockStore.listTechniques(query, opts.type), [query, opts.type]);
export const useLibraryPositions = (query?: string) => useQuery(() => mockStore.listPositions(query), [query]);
export const usePosition = (id: string) => useQuery(() => mockStore.position(id), [id]);
export const useSubjects = () => useQuery(() => mockStore.subjects(), []);
export const useSetting = (key: string) => useQuery(() => (key === 'library.showExtended' ? mockStore.showExtended : progressStore.settings[key] ?? false), [key]);
export const useCurrentRank = () => useQuery(() => mockStore.rank, []);

export function useDatabaseBootstrap(): BootstrapState & { retry: () => void } {
  const [state, setState] = useState<BootstrapState>(mockStore.bootstrap);
  useEffect(() => mockStore.subscribe(() => setState(mockStore.bootstrap)), []);
  const retry = useCallback(() => {
    mockStore.bootstrap = { status: 'ready' };
    mockStore.emit();
  }, []);
  return { ...state, retry };
}

const run = async <T>(fn: () => T): Promise<T> => fn();

export const sessions = {
  home: (_args?: { today: string }): Promise<HomeData> => run(() => mockStore.home()),
  log: (i: LogSessionInput) => run(() => mockStore.logSession(i)),
  create: (i: PlanSessionInput) => run(() => mockStore.planSession(i)),
  softDelete: (id: string) => run(() => mockStore.softDelete(id)),
  undoDelete: (id: string) => run(() => mockStore.undoDelete(id)),
  skip: (id: string) => run(() => mockStore.skip(id)),
  undoSkip: (id: string) => run(() => mockStore.undoSkip(id)),
  quickLogTarget,
};
export const sessionTypes = { list: () => run(() => mockStore.sessionTypes()) };
/** Also records the entry in the rank history the sprint-2 screens read. */
export const rank: Record<string, (...a: any[]) => Promise<unknown>> = {
  add: (i: RankInput) => run(() => {
    const entry = mockStore.addRank(i);
    progressStore.ranks.push(entry);
    progressStore.emit();
    return entry;
  }),
};
export const resetDatabase = async (_opts?: { keepKey: boolean }) => {
  mockStore.reset();
};
/** Real `settings.set` stand-in: the seam's `setSetting` calls it. */
export const settings = { set: (key: string, value: unknown) => run(() => progressStore.setSetting(key, value)) };

// ---- sprint 2: the surface `hooks/data` imports from the real module, backed by the phase-A stores ----
export { useAbout, useAlgorithmParams, useProgress, useRankHistory, useResources, useResourceTypes, useTechnique } from './progressMock';
const pa = progressActions;
rank.update = pa.updateRank;
rank.softDelete = pa.deleteRank;
rank.undoDelete = pa.undoDeleteRank;
export const algorithmParams = { set: pa.setParam, resetAll: pa.resetParams };
export const resources = {
  create: pa.createResource,
  update: pa.updateResource,
  setStatus: pa.setResourceStatus,
  softDelete: pa.deleteResource,
  undoDelete: pa.undoDeleteResource,
};
export const taxonomy = {
  createPosition: pa.createPosition,
  createTechnique: pa.createTechnique,
  createSubject: pa.createSubject,
  updatePosition: pa.updatePosition,
  updateTechnique: pa.updateTechnique,
  updateSubject: pa.updateSubject,
  softDelete: pa.deleteTaxonomy,
  undoDelete: pa.undoDeleteTaxonomy,
  addAlias: pa.addAlias,
  removeAlias: pa.removeAlias,
  undoRemoveAlias: pa.undoRemoveAlias,
  merge: pa.merge,
  undoMerge: pa.undoMerge,
};
export const setBootstrapOverrides = (_o: unknown) => undefined;
