/**
 * THE data seam. Every screen imports hooks and actions from here only; this file is the single
 * importer of `src/repositories`. UI Jest mocks `src/repositories` with `__mocks__/repositoriesMock`.
 */
import {
  rank, resetDatabase, sessions, sessionTypes, settings,
  useCurrentRank, useDatabaseBootstrap, useFocusSearch, useHome, useLibraryPositions, usePosition, useSession as useSessionRead,
  useSessionTypes, useSetting, useSubjects, useTechniqueSearch,
} from '../../repositories';
import { localDateOf } from '../../domain/session/localDate';
// PHASE A: sprint-2 reads and writes are mock-backed. Phase B replaces these re-exports and `progressActions`
// with the repository hooks / functions of data-contracts.md (mocks stay for unit tests).
import {
  progressActions, useAbout, useAlgorithmParams, useProgress, useRankHistory, useResources, useResourceTypes, useTechnique,
} from '../../__mocks__/progressMock';
import { deviceTimeZone, runtime } from '../../repositories/runtime';
import type { DataActions, HomeData, LiveResult, QuickLogTarget, SessionDetail, SessionTypeRow } from './types';

export * from './types';
export {
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
  ...progressActions,
  setSetting: (key, value) => settings.set(key, value),
  resetDatabase: async () => {
    await resetDatabase({ keepKey: true });
  },
};

export const useDataActions = (): DataActions => actions;
