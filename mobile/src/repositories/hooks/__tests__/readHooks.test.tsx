import { setEnv } from '../../../db/testing/env';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { addDatabaseChangeListener } from 'expo-sqlite';
import { AppState } from 'react-native';

import { setDb, type Db } from '../../../db/client';
import { rank } from '../../rank';
import { sessions } from '../../sessions';
import { settings } from '../../settings';
import { FX } from '../../testing/fixtures';
import { sequentialIds } from '../../../db/testing/testDb';
import * as runtimeModule from '../../runtime';
import { setRuntime } from '../../runtime';
import { resetRuntime, seededDb } from '../../testing/helpers';
import {
  useCurrentRank, useFocusSearch, useHome, useLibraryPositions, usePosition, useSession, useSetting, useSubjects, useTechniqueSearch,
} from '..';
import { LOCAL_DATE_POLL_MS } from '../useLocalDate';
import { useLiveRead } from '../useLiveRead';

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
  restoreTz = setEnv('TZ', 'Europe/Amsterdam');
  const t = await seededDb('2026-03-02T20:00:00.000Z');
  db = t.db;
  sqlite = t.sqlite;
  setDb(db);
});
let restoreTz: () => void = () => undefined;
afterEach(() => restoreTz());
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

describe('error routing after a dev reset (R2-06)', () => {
  it('setting-reading hooks land in error DB_NOT_OPEN instead of throwing when the database is closed', async () => {
    setDb(undefined);
    const focus = await renderHook(() => useFocusSearch('mount'));
    const lib = await renderHook(() => useLibraryPositions());
    const tech = await renderHook(() => useTechniqueSearch('sweep'));
    await waitFor(() => expect(focus.result.current.error?.code).toBe('DB_NOT_OPEN'));
    await waitFor(() => expect(lib.result.current.error?.code).toBe('DB_NOT_OPEN'));
    await waitFor(() => expect(tech.result.current.error?.code).toBe('DB_NOT_OPEN'));
    setDb(db);
    await act(() => focus.result.current.reload());
    await waitFor(() => expect(focus.result.current.data?.[0]?.name).toBe('Mount'));
  });

  it('a read that throws synchronously becomes error UNKNOWN', async () => {
    const { result } = await renderHook(() =>
      useLiveRead((): Promise<number> => {
        throw new Error('sync');
      }, ['sessions'], []),
    );
    await waitFor(() => expect(result.current.error?.code).toBe('UNKNOWN'));
  });
});

describe('useHome date rollover (R2-06)', () => {
  const plan = (startsAt: string) =>
    sessions.create({ sessionTypeId: FX.gi, startsAt, timeZone: 'Europe/Amsterdam', focuses: [{ kind: 'POSITION', refId: FX.mount }] }, db);

  it('re-partitions when the app returns to the foreground on a new local day', async () => {
    let onChange: (s: string) => void = () => undefined;
    const spy = jest.spyOn(AppState, 'addEventListener').mockImplementation((_t, fn) => {
      onChange = fn as (s: string) => void;
      return { remove: jest.fn() } as never;
    });
    let now = '2026-03-02T20:00:00.000Z';
    setRuntime({ now: () => now, newId: sequentialIds('d') });
    const p = await plan('2026-03-02T21:00:00.000Z');
    const { result } = await renderHook(() => useHome());
    await waitFor(() => expect(result.current.data?.todayPlanned.map((s) => s.id)).toEqual([p.id]));
    now = '2026-03-03T06:30:00.000Z';
    await act(() => onChange('active'));
    await waitFor(() => expect(result.current.data?.today).toBe('2026-03-03'));
    expect(result.current.data?.stalePlanned.map((s) => s.id)).toEqual([p.id]);
    expect(result.current.data?.todayPlanned).toEqual([]);
    spy.mockRestore();
  });

  it('re-partitions from the foreground minute check past local midnight', async () => {
    // The hook reads the device zone through the runtime seam; pin it so the 23:00Z instants below straddle
    // local midnight on any runner (CI runs in UTC, where 23:00:30Z is still 2026-03-02; process.env.TZ
    // does not reach Intl inside the Jest sandbox).
    const zone = jest.spyOn(runtimeModule, 'deviceTimeZone').mockReturnValue('Europe/Amsterdam');
    const appState = jest.spyOn(AppState, 'addEventListener').mockReturnValue({ remove: jest.fn() } as never);
    const intervals: [() => void, number][] = [];
    const spy = jest.spyOn(global, 'setInterval').mockImplementation(((fn: () => void, ms: number) => {
      intervals.push([fn, ms]);
      return 0 as never;
    }) as never);
    let now = '2026-03-02T22:59:00.000Z'; // 23:59 in Amsterdam
    setRuntime({ now: () => now, newId: sequentialIds('d') });
    const { result } = await renderHook(() => useHome());
    await waitFor(() => expect(result.current.data?.today).toBe('2026-03-02'));
    const tick = intervals.find(([, ms]) => ms === LOCAL_DATE_POLL_MS)![0];
    await act(() => tick());
    expect(result.current.data?.today).toBe('2026-03-02');
    now = '2026-03-02T23:00:30.000Z'; // 00:00:30 the next local day
    await act(() => tick());
    await waitFor(() => expect(result.current.data?.today).toBe('2026-03-03'));
    spy.mockRestore();
    appState.mockRestore();
    zone.mockRestore();
  });
});

