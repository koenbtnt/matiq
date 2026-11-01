import { act, renderHook, waitFor } from '@testing-library/react-native';

import { setDb } from '../src/db/client';
import { ERROR_CODES } from '../src/domain/errors';
import { blankDraft, draftFromSession, toLogInput } from '../src/features/log-session/state';
import { loadQuickLogTarget, useDataActions, useHome, useSession, useSessionTypes } from '../src/hooks/data';
import { errorKey } from '../src/i18n/keys';
import { FX } from '../src/repositories/testing/fixtures';
import { deviceTimeZone, runtime } from '../src/repositories/runtime';
import { resetRuntime, seededDb } from '../src/repositories/testing/helpers';

/**
 * Phase B: the seam (`hooks/data`) over the real repositories on migrated better-sqlite3
 * (the data-coder's `seededDb`). Nothing is mocked except the native expo-sqlite change feed.
 */
const TZ = 'Europe/Amsterdam';
let sqlite: Awaited<ReturnType<typeof seededDb>>['sqlite'];

beforeEach(async () => {
  const t = await seededDb('2026-03-02T20:00:00.000Z');
  sqlite = t.sqlite;
  setDb(t.db);
});
afterEach(() => {
  setDb(undefined);
  sqlite.close();
  resetRuntime();
});

const focus = (refId: string) => ({ kind: 'POSITION' as const, refId, isPlanned: false, isActual: true });

describe('read hooks over the repositories', () => {
  it('useSessionTypes and useHome resolve; reload re-reads', async () => {
    const types = await renderHook(() => useSessionTypes());
    await waitFor(() => expect(types.result.current.data?.map((x) => x.id)).toEqual([FX.gi, FX.nogi, FX.openMat]));
    const home = await renderHook(() => useHome());
    await waitFor(() => expect(home.result.current.data?.recent).toEqual([]));

    const { logSession } = useDataActions();
    await logSession({ sessionTypeId: FX.nogi, startsAt: new Date().toISOString(), timeZone: TZ, focuses: [focus(FX.mount)] });
    await act(() => home.result.current.reload());
    await waitFor(() => expect(home.result.current.data?.lastUsedTypeId).toBe(FX.nogi));
  });

  it('useSession(undefined) reads nothing; an unknown id errors with SESSION_NOT_FOUND', async () => {
    const none = await renderHook(() => useSession(undefined));
    expect(none.result.current.data).toBeUndefined();
    expect(none.result.current.error).toBeUndefined();
    const missing = await renderHook(() => useSession('00000000-0000-4000-8000-0000000000ff'));
    await waitFor(() => expect(missing.result.current.error?.code).toBe('SESSION_NOT_FOUND'));
  });
});

describe('loadQuickLogTarget', () => {
  it('falls back to the first session type, then to the last-used one', async () => {
    expect(await loadQuickLogTarget()).toEqual({ sessionTypeId: FX.gi, focuses: [] });
    await useDataActions().logSession({ sessionTypeId: FX.openMat, startsAt: new Date().toISOString(), timeZone: TZ, focuses: [focus(FX.mount)] });
    expect(await loadQuickLogTarget()).toEqual({ sessionTypeId: FX.openMat, focuses: [] });
  });

  it('targets the single session planned today', async () => {
    const planned = await useDataActions().planSession({
      sessionTypeId: FX.gi, startsAt: runtime().now(), timeZone: deviceTimeZone(),
      focuses: [{ kind: 'POSITION', refId: FX.mount }],
    });
    expect(await loadQuickLogTarget()).toEqual({ sessionId: planned.id });
  });
});

describe('edit-mode round trip (sessions.log replace-set)', () => {
  it('sends submissions explicitly, so stored rows (incl. a technique-less one with a note) survive an edit', async () => {
    const actions = useDataActions();
    const saved = await actions.logSession({
      sessionTypeId: FX.gi, startsAt: '2026-03-02T18:00:00.000Z', timeZone: TZ, focuses: [focus(FX.mount)],
      submissions: [
        { direction: 'LANDED', techniqueId: FX.armbarFromMount, note: 'from mount' },
        { direction: 'TAKEN', note: 'lost track of the name' },
      ],
    });
    expect(saved.submissions).toHaveLength(2);

    const draft = { ...draftFromSession(saved, 'edit'), contextNote: 'edited' };
    const input = toLogInput(draft, TZ);
    expect(input.submissions).toHaveLength(2);
    const after = await actions.logSession(input);
    expect(after.contextNote).toBe('edited');
    expect(after.submissions.map((s) => [s.direction, s.techniqueId, s.note])).toEqual(
      expect.arrayContaining([['LANDED', FX.armbarFromMount, 'from mount'], ['TAKEN', undefined, 'lost track of the name']]),
    );
    expect(after.submissions).toHaveLength(2);
  });

  it('removing the last chip sends [] and clears the stored rows', async () => {
    const actions = useDataActions();
    const saved = await actions.logSession({
      sessionTypeId: FX.gi, startsAt: '2026-03-02T18:00:00.000Z', timeZone: TZ, focuses: [focus(FX.mount)],
      submissions: [{ direction: 'LANDED', techniqueId: FX.armbarFromMount }],
    });
    const draft = { ...draftFromSession(saved, 'edit'), submissions: [] };
    expect(toLogInput(draft, TZ).submissions).toEqual([]);
    expect((await actions.logSession(toLogInput(draft, TZ))).submissions).toEqual([]);
  });
});

describe('DomainError mapping', () => {
  it('a rejected write carries a code with its own copy', async () => {
    const draft = { ...blankDraft('log', FX.gi), when: new Date('2026-03-02T18:00:00Z') };
    const err = await useDataActions().logSession(toLogInput(draft, TZ)).then(() => undefined, (e: { code: string }) => e);
    expect(err?.code).toBe('FOCUS_REQUIRED');
    expect(errorKey(err?.code)).toBe('errors.FOCUS_REQUIRED');
  });

  it.each([...ERROR_CODES])('%s has errors.<CODE> copy', (code) => {
    expect(errorKey(code)).toBe(`errors.${code}`);
  });
});
