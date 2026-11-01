import { useCallback, useEffect, useRef, useState } from 'react';

import { bootstrapDatabase, type BootstrapErrorCode } from '../../db/bootstrap';
import type { SettingKey, SettingValue } from '../../domain/settings/defaults';
import type {
  FocusPickerRow, HomeData, PositionDetail, PositionRow, RankEntry, SessionDetail, SessionTypeRow, SubjectRow,
  TechniqueRow, TechniqueType,
} from '../contracts';
import { rank } from '../rank';
import { sessions } from '../sessions';
import { sessionTypes } from '../sessionTypes';
import { settings } from '../settings';
import { taxonomy } from '../taxonomy';
import { useLiveRead, type LiveResult } from './useLiveRead';
import { useLocalDate } from './useLocalDate';

export type { LiveResult };

const SESSION_TABLES = [
  'sessions', 'session_focuses', 'session_techniques', 'submissions', 'rounds', 'session_types',
  'positions', 'subjects', 'aliases', 'techniques',
] as const;
const TAXONOMY_TABLES = ['positions', 'techniques', 'aliases', 'subjects', 'settings'] as const;

/** Read inside the async read, so a closed database (dev reset) becomes `error`, not a throw. */
const showExtended = async () => (await settings.get('library.showExtended')).value;

/** Home's single read (F-22); re-reads when the device-local date rolls over (R2-06). */
export function useHome(): LiveResult<HomeData> {
  const today = useLocalDate();
  return useLiveRead(() => sessions.home({ today }), [...SESSION_TABLES, 'settings', 'rank_entries'], [today]);
}

export function useSession(id: string): LiveResult<SessionDetail> {
  return useLiveRead(() => sessions.getDetail(id), SESSION_TABLES, [id]);
}

export function useSessionTypes(): LiveResult<SessionTypeRow[]> {
  return useLiveRead(() => sessionTypes.list(), ['session_types'], []);
}

/** Log focus picker; reads `library.showExtended` itself. */
export function useFocusSearch(query: string): LiveResult<FocusPickerRow[]> {
  return useLiveRead(async () => taxonomy.searchFocuses({ query, showExtended: await showExtended() }), TAXONOMY_TABLES, [query]);
}

/** Library positions; reads `library.showExtended` itself. */
export function useLibraryPositions(query = ''): LiveResult<PositionRow[]> {
  return useLiveRead(async () => taxonomy.listPositions({ query, showExtended: await showExtended() }), TAXONOMY_TABLES, [query]);
}

export function usePosition(id: string): LiveResult<PositionDetail> {
  return useLiveRead(() => taxonomy.getPosition(id), TAXONOMY_TABLES, [id]);
}

export function useSubjects(): LiveResult<SubjectRow[]> {
  return useLiveRead(() => taxonomy.listSubjects(), ['subjects'], []);
}

/** Technique search; `type` filters server-side; reads `library.showExtended` itself. */
export function useTechniqueSearch(query: string, { type }: { type?: TechniqueType } = {}): LiveResult<TechniqueRow[]> {
  return useLiveRead(
    async () => taxonomy.listTechniques({ query, type, showExtended: await showExtended() }),
    TAXONOMY_TABLES,
    [query, type],
  );
}

export function useSetting<K extends SettingKey>(key: K): LiveResult<SettingValue<K>> {
  return useLiveRead(async () => (await settings.get(key)).value, ['settings'], [key]);
}

/** `data === null` means no rank yet (not loading). */
export function useCurrentRank(): LiveResult<RankEntry | null> {
  return useLiveRead(async () => (await rank.current()) ?? null, ['rank_entries'], []);
}

export type DatabaseBootstrapState =
  | { status: 'loading'; retry: () => void }
  | { status: 'ready'; retry: () => void }
  | { status: 'error'; code: BootstrapErrorCode; retry: () => void };

/** Runs `bootstrapDatabase()` once on mount; `retry()` runs it again (error screen "Try again"). */
export function useDatabaseBootstrap(): DatabaseBootstrapState {
  const [state, setState] = useState<{ status: 'loading' | 'ready' } | { status: 'error'; code: BootstrapErrorCode }>({
    status: 'loading',
  });
  const running = useRef(false);
  const run = useCallback(() => {
    if (running.current) return;
    running.current = true;
    setState({ status: 'loading' });
    bootstrapDatabase()
      .then((r) => setState(r.ok ? { status: 'ready' } : { status: 'error', code: r.code }))
      .catch(() => setState({ status: 'error', code: 'DB_MIGRATION_FAILED' }))
      .finally(() => {
        running.current = false;
      });
  }, []);
  useEffect(run, [run]);
  return { ...state, retry: run };
}
