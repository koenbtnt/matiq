/**
 * THE data seam. Every screen imports hooks and actions from here only; this file is the single
 * importer of `src/repositories`. UI Jest mocks `src/repositories` with `__mocks__/repositoriesMock`.
 */
import {
  algorithmParams, rank, resetDatabase, resources, sessions, sessionTypes, setBootstrapOverrides, settings, taxonomy,
  useAbout, useAlgorithmParams, useCurrentRank, useDatabaseBootstrap, useFocusSearch, useHome, useLibraryPositions, usePosition,
  useProgress, useRankHistory, useResources, useResourceTypes, useSession as useSessionRead,
  useSessionTypes, useSetting, useSubjects, useTechnique, useTechniqueSearch,
} from '../../repositories';
import { localDateOf } from '../../domain/session/localDate';
import { deviceTimeZone, runtime } from '../../repositories/runtime';
import type { DataActions, HomeData, LiveResult, QuickLogTarget, SessionDetail, SessionTypeRow } from './types';

export * from './types';
export {
  setBootstrapOverrides,
  useCurrentRank, useDatabaseBootstrap, useFocusSearch, useHome, useLibraryPositions, usePosition,
  useSessionTypes, useSetting, useSubjects, useTechniqueSearch,
  useAbout, useAlgorithmParams, useProgress, useRankHistory, useResources, useResourceTypes, useTechnique,
};

const NO_SESSION: LiveResult<SessionDetail> = { reload: () => undefined };

/** `useSession(undefined)` (a new log/plan sheet) reads nothing: loading-free, error-free, no data. */
export function useSession(id: string | undefined): LiveResult<SessionDetail> {
  const result = useSessionRead(id ?? '');
  return id ? result : NO_SESSION;
}

/** `sessions.quickLogTarget`: exactly one planned today ⇒ it; else a new session of the last-used (or first) type. */
export const quickLogTarget = (home: HomeData, types?: SessionTypeRow[]): QuickLogTarget => sessions.quickLogTarget(home, types);

/** Imperative twin of `quickLogTarget` for the tab bar (no hook context). */
export async function loadQuickLogTarget(): Promise<QuickLogTarget> {
  const [home, types] = await Promise.all([
    sessions.home({ today: localDateOf(runtime().now(), deviceTimeZone()) }),
    sessionTypes.list(),
  ]);
  return sessions.quickLogTarget(home, types);
}

const actions: DataActions = {
  logSession: (i) => sessions.log(i),
  planSession: (i) => sessions.create(i),
  softDelete: (id) => sessions.softDelete(id),
  undoDelete: (id) => sessions.undoDelete(id),
  skip: (id) => sessions.skip(id),
  undoSkip: (id) => sessions.undoSkip(id),
  addRank: (i) => rank.add(i),
  setParam: (i) => algorithmParams.set(i),
  resetParams: (version) => algorithmParams.resetAll(version),
  updateRank: (id, i) => rank.update(id, i),
  deleteRank: (id) => rank.softDelete(id),
  undoDeleteRank: (id) => rank.undoDelete(id),
  createPosition: (i) => taxonomy.createPosition(i),
  createTechnique: (i) => taxonomy.createTechnique(i),
  createSubject: (i) => taxonomy.createSubject(i),
  updatePosition: (id, p) => taxonomy.updatePosition(id, p),
  updateTechnique: (id, p) => taxonomy.updateTechnique(id, p),
  updateSubject: (id, p) => taxonomy.updateSubject(id, p),
  deleteTaxonomy: (kind, id) => taxonomy.softDelete(kind, id),
  undoDeleteTaxonomy: (kind, id) => taxonomy.undoDelete(kind, id),
  addAlias: (kind, id, name) => taxonomy.addAlias(kind, id, name),
  removeAlias: (id) => taxonomy.removeAlias(id),
  undoRemoveAlias: (id) => taxonomy.undoRemoveAlias(id),
  merge: (kind, from, into) => taxonomy.merge(kind, from, into),
  undoMerge: (id) => taxonomy.undoMerge(id),
  createResource: (i, target) => resources.create(i, target),
  updateResource: (id, p) => resources.update(id, p),
  setResourceStatus: (id, status) => resources.setStatus(id, status),
  deleteResource: (id) => resources.softDelete(id),
  undoDeleteResource: (id) => resources.undoDelete(id),
  setSetting: (key, value) => settings.set(key, value),
  resetDatabase: async () => {
    await resetDatabase({ keepKey: true });
  },
};

export const useDataActions = (): DataActions => actions;
