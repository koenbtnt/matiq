import { act, renderHook, waitFor } from '@testing-library/react-native';
import { addDatabaseChangeListener } from 'expo-sqlite';

import { setDb, type Db } from '../../../db/client';
import { rank } from '../../rank';
import { sessions } from '../../sessions';
import { settings } from '../../settings';
import { FX } from '../../testing/fixtures';
import { resetRuntime, seededDb } from '../../testing/helpers';
import {
  useCurrentRank, useFocusSearch, useLibraryPositions, usePosition, useSession, useSetting, useSubjects, useTechniqueSearch,
} from '..';

/** Per-hook wrappers over the real repositories (better-sqlite3); only the native change feed is faked. */
const listeners: ((e: { tableName: string }) => void)[] = [];
const emit = (tableName: string) => act(() => listeners.forEach((l) => l({ tableName })));
let db: Db;
let sqlite: Awaited<ReturnType<typeof seededDb>>['sqlite'];

beforeEach(async () => {
  listeners.length = 0;
  (addDatabaseChangeListener as jest.Mock).mockImplementation((fn) => {
    listeners.push(fn);
    return { remove: () => listeners.splice(listeners.indexOf(fn), 1) };
  });
  process.env.TZ = 'Europe/Amsterdam';
  const t = await seededDb('2026-03-02T20:00:00.000Z');
  db = t.db;
  sqlite = t.sqlite;
  setDb(db);
});
afterEach(() => {
  setDb(undefined);
  sqlite.close();
  resetRuntime();
});

describe('read hooks', () => {
  it('useSession(id) reads the detail and re-reads when session tables change', async () => {
    const d = await sessions.log({ sessionTypeId: FX.gi, startsAt: '2026-03-02T18:00:00.000Z', timeZone: 'UTC', focuses: [{ kind: 'POSITION', refId: FX.mount, isPlanned: false, isActual: true }] }, db);
    const { result } = await renderHook(() => useSession(d.id));
    await waitFor(() => expect(result.current.data?.focusNames).toEqual(['Mount']));
    await sessions.log({ sessionId: d.id, sessionTypeId: FX.gi, startsAt: d.startsAt, timeZone: 'UTC', rating: 4, focuses: [{ kind: 'POSITION', refId: FX.mount, isPlanned: false, isActual: true }] }, db);
    await emit('sessions');
    await waitFor(() => expect(result.current.data?.rating).toBe(4));
  });

  it('useFocusSearch reads library.showExtended itself and follows a settings change', async () => {
    const { result } = await renderHook(() => useFocusSearch('deep'));
    await waitFor(() => expect(result.current.data).toEqual([]));
    await settings.set('library.showExtended', true, db);
    await emit('settings');
    await waitFor(() => expect(result.current.data?.map((r) => r.name)).toEqual(['Deep half variant']));
  });

  it('useLibraryPositions(query) returns matchedAlias; usePosition(id) the detail or TAXONOMY_ROW_NOT_FOUND', async () => {
    const list = await renderHook(() => useLibraryPositions('full'));
    await waitFor(() => expect(list.result.current.data).toEqual([expect.objectContaining({ id: FX.mount, matchedAlias: 'Full mount' })]));
    const pos = await renderHook(() => usePosition(FX.closedGuard));
    await waitFor(() => expect(pos.result.current.data?.parent).toEqual({ id: FX.guard, canonicalName: 'Guard' }));
    const missing = await renderHook(() => usePosition('nope'));
    await waitFor(() => expect(missing.result.current.error?.code).toBe('TAXONOMY_ROW_NOT_FOUND'));
  });

  it('useSubjects lists subjects; useTechniqueSearch filters by type', async () => {
    const subj = await renderHook(() => useSubjects());
    await waitFor(() => expect(subj.result.current.data?.map((s) => s.name)).toEqual(['Grip fighting', 'Guard retention']));
    const subs = await renderHook(() => useTechniqueSearch('', { type: 'SUBMISSION' }));
    await waitFor(() => expect(subs.result.current.data?.map((t) => t.name)).toEqual(['Armbar from mount']));
    const alias = await renderHook(() => useTechniqueSearch('tesoura'));
    await waitFor(() => expect(alias.result.current.data?.[0]).toMatchObject({ id: FX.sweepToMount, matchedAlias: 'Tesoura' }));
  });

  it('useSetting(key) returns the typed value and follows changes', async () => {
    const { result } = await renderHook(() => useSetting('suggest.max'));
    await waitFor(() => expect(result.current.data).toBe(3));
    await settings.set('suggest.max', 5, db);
    await emit('settings');
    await waitFor(() => expect(result.current.data).toBe(5));
  });

  it('useCurrentRank is null (not loading) without a rank, then the added entry', async () => {
    const { result } = await renderHook(() => useCurrentRank());
    await waitFor(() => expect(result.current.data).toBeNull());
    await rank.add({ scale: 'ADULT', belt: 'PURPLE', stripes: 1, awardedOn: '2025-12-01' }, db);
    await emit('rank_entries');
    await waitFor(() => expect(result.current.data).toMatchObject({ belt: 'PURPLE', stripes: 1 }));
  });
});
