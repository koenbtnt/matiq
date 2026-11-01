/**
 * THE data seam. Every screen imports hooks and actions from here only.
 * Phase A: backed by the in-memory mock store. Phase B: re-implement this file over
 * `src/repositories/hooks/*` (plan §4); no screen changes.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';

import { mockStore } from '../../__mocks__/mockStore';
import type {
  BootstrapState, DataActions, DomainErrorLike, FocusPickerRow, HomeData, HookResult, PositionDetail, PositionRow,
  QuickLogTarget, RankEntry, SessionDetail, SessionTypeRow, SubjectRow, TechniqueRow, TechniqueType,
} from './types';

export * from './types';

/** Re-computes on every store change; honours the forced loading/error switch used by tests and dev. */
function useQuery<T>(compute: () => T, deps: unknown[]): HookResult<T> {
  const [version, setVersion] = useState(0);
  useEffect(() => mockStore.subscribe(() => setVersion((v) => v + 1)), []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => {
    const f = mockStore.forced;
    if (f === 'loading') return {};
    if (f) return { error: f.error };
    try {
      return { data: compute() };
    } catch (e) {
      return { error: e as DomainErrorLike };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, ...deps]);
}

export const useHome = (): HookResult<HomeData> => useQuery(() => mockStore.home(), []);
export const useSession = (id: string | undefined): HookResult<SessionDetail | undefined> =>
  useQuery(() => (id ? mockStore.session(id) : undefined), [id]);
export const useSessionTypes = (): HookResult<SessionTypeRow[]> => useQuery(() => mockStore.sessionTypes(), []);
export const useFocusSearch = (query: string): HookResult<FocusPickerRow[]> => useQuery(() => mockStore.searchFocuses(query), [query]);
export const useTechniqueSearch = (query: string, opts: { type?: TechniqueType } = {}): HookResult<TechniqueRow[]> =>
  useQuery(() => mockStore.listTechniques(query, opts.type), [query, opts.type]);
export const useLibraryPositions = (query?: string): HookResult<PositionRow[]> => useQuery(() => mockStore.listPositions(query), [query]);
export const usePosition = (id: string): HookResult<PositionDetail> => useQuery(() => mockStore.position(id), [id]);
export const useSubjects = (): HookResult<SubjectRow[]> => useQuery(() => mockStore.subjects(), []);
export const useSetting = (key: 'library.showExtended'): HookResult<boolean> => useQuery(() => (key === 'library.showExtended' ? mockStore.showExtended : false), [key]);
export const useCurrentRank = (): HookResult<RankEntry | null> => useQuery(() => mockStore.rank, []);

/** Plan §4 `sessions.quickLogTarget`: exactly one planned today ⇒ it; else a new session of the last-used type. */
export function quickLogTarget(home: HomeData, firstTypeId: string): QuickLogTarget {
  const only = home.todayPlanned.length === 1 ? home.todayPlanned[0] : undefined;
  if (only) return { sessionId: only.id };
  return { sessionTypeId: home.lastUsedTypeId ?? firstTypeId, focuses: [] };
}

/** Imperative twin of `quickLogTarget` for the tab bar (no hook context). */
export async function loadQuickLogTarget(): Promise<QuickLogTarget> {
  return quickLogTarget(mockStore.home(), mockStore.sessionTypes()[0]?.id ?? '');
}

export function useDatabaseBootstrap(): BootstrapState & { retry: () => void } {
  const [state, setState] = useState<BootstrapState>(mockStore.bootstrap);
  useEffect(() => mockStore.subscribe(() => setState(mockStore.bootstrap)), []);
  const retry = useCallback(() => {
    mockStore.bootstrap = { status: 'ready' };
    mockStore.emit();
  }, []);
  return { ...state, retry };
}

const act = async <T>(fn: () => T): Promise<T> => fn();

const actions: DataActions = {
  logSession: (i) => act(() => mockStore.logSession(i)),
  planSession: (i) => act(() => mockStore.planSession(i)),
  softDelete: (id) => act(() => mockStore.softDelete(id)),
  undoDelete: (id) => act(() => mockStore.undoDelete(id)),
  skip: (id) => act(() => mockStore.skip(id)),
  undoSkip: (id) => act(() => mockStore.undoSkip(id)),
  addRank: (i) => act(() => mockStore.addRank(i)),
  resetDatabase: () => act(() => mockStore.reset()),
};

export const useDataActions = (): DataActions => actions;
