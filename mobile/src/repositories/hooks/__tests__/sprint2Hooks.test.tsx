import { act, renderHook, waitFor } from '@testing-library/react-native';
import { addDatabaseChangeListener } from 'expo-sqlite';

import { setDb, type Db } from '../../../db/client';
import { setEnv } from '../../../db/testing/env';
import { algorithmParams } from '../../algorithmParams';
import { rank } from '../../rank';
import { resources } from '../../resources';
import { sessions } from '../../sessions';
import { settings } from '../../settings';
import { FX } from '../../testing/fixtures';
import { resetRuntime, seededDb } from '../../testing/helpers';
import {
  useAbout, useAlgorithmParams, useCurrentRank, useHome, useProgress, useRankHistory, useResources, useResourceTypes, useTechnique,
} from '..';

jest.mock('expo-constants', () => ({ __esModule: true, default: { expoConfig: { version: '1.2.3' } } }));

/** Sprint-2 hooks over the real repositories (better-sqlite3); only the native change feed is faked. */
const listeners: ((e: { tableName: string }) => void)[] = [];
const emit = (tableName: string) => act(() => listeners.forEach((l) => l({ tableName })));
let db: Db;
let sqlite: Awaited<ReturnType<typeof seededDb>>['sqlite'];
let restoreTz: () => void = () => undefined;

beforeEach(async () => {
  listeners.length = 0;
  (addDatabaseChangeListener as jest.Mock).mockImplementation((fn) => {
    listeners.push(fn);
    return { remove: () => listeners.splice(listeners.indexOf(fn), 1) };
  });
  restoreTz = setEnv('TZ', 'Europe/Amsterdam');
  const t = await seededDb('2026-11-01T12:00:00.000Z');
  db = t.db;
  sqlite = t.sqlite;
  setDb(db);
});
afterEach(() => {
  restoreTz();
  setDb(undefined);
  sqlite.close();
  resetRuntime();
});

const logMount = (needsWork: boolean) =>
  sessions.log({ sessionTypeId: FX.gi, startsAt: '2026-10-30T18:00:00.000Z', timeZone: 'UTC', focuses: [{ kind: 'POSITION', refId: FX.mount, isPlanned: false, isActual: true, needsWork }] }, db);

describe('sprint 2 hooks (plan §5.9)', () => {
  it('useProgress re-reads on algorithm_params changes (params edited while Progress is open)', async () => {
    await logMount(true);
    const { result } = await renderHook(() => useProgress());
    await waitFor(() => expect(result.current.data?.results[0]?.state).toBe('NEEDS_WORK'));
    expect(result.current.data).toMatchObject({ today: '2026-11-01', algorithmVersion: 'v1' });
    await algorithmParams.set({ version: 'v1', key: 'wNeedsWork', value: 0 }, db);
    await emit('algorithm_params');
    await waitFor(() => expect(result.current.data?.results[0]?.state).toBe('STEADY'));
  });

  it('useHome subscribes to algorithm_params (suggestions come from the algorithm)', async () => {
    await logMount(true);
    const { result } = await renderHook(() => useHome());
    await waitFor(() => expect(result.current.data?.suggestions.map((s) => s.source)).toEqual(['LAST_NEEDS_WORK']));
    await settings.set('suggest.lastNeedsWork', false, db);
    await emit('settings');
    await waitFor(() => expect(result.current.data?.suggestions.map((s) => s.source)).toEqual(['NEEDS_WORK']));
  });

  it('useAlgorithmParams lists the active version and follows writes', async () => {
    const { result } = await renderHook(() => useAlgorithmParams());
    await waitFor(() => expect(result.current.data).toHaveLength(10));
    await algorithmParams.set({ version: 'v1', key: 'wGap', value: 0.5 }, db);
    await emit('algorithm_params');
    await waitFor(() => expect(result.current.data?.find((p) => p.key === 'wGap')?.value).toBe(0.5));
  });

  it('useRankHistory and useCurrentRank follow rank.scale', async () => {
    await rank.add({ scale: 'ADULT', belt: 'BLUE', stripes: 0, awardedOn: '2025-01-01' }, db);
    const history = await renderHook(() => useRankHistory());
    const current = await renderHook(() => useCurrentRank());
    await waitFor(() => expect(history.result.current.data).toHaveLength(1));
    await waitFor(() => expect(current.result.current.data?.belt).toBe('BLUE'));
    await settings.set('rank.scale', 'KIDS', db);
    await emit('settings');
    await waitFor(() => expect(history.result.current.data).toEqual([]));
    await waitFor(() => expect(current.result.current.data).toBeNull());
  });

  it('useTechnique, useResources and useResourceTypes re-read on resource writes', async () => {
    const tech = await renderHook(() => useTechnique(FX.sweepToMount));
    const list = await renderHook(() => useResources({ kind: 'TECHNIQUE', id: FX.sweepToMount }));
    const types = await renderHook(() => useResourceTypes());
    await waitFor(() => expect(tech.result.current.data?.resources).toHaveLength(1));
    await waitFor(() => expect(types.result.current.data?.map((t) => t.name)).toEqual(['Instructional', 'Book']));
    await resources.create({ title: 'Hip bump notes', resourceTypeId: FX.rtBook }, { kind: 'TECHNIQUE', id: FX.sweepToMount }, db);
    await emit('resources');
    await waitFor(() => expect(list.result.current.data?.map((r) => r.title)).toEqual(['Guard basics', 'Hip bump notes']));
    await waitFor(() => expect(tech.result.current.data?.resources).toHaveLength(2));
  });

  it('useAbout adds the app version from expo-constants', async () => {
    const { result } = await renderHook(() => useAbout());
    await waitFor(() => expect(result.current.data).toMatchObject({ appVersion: '1.2.3', algorithmVersion: 'v1', backup: 'not_applicable' }));
  });
});
