import { act, renderHook, waitFor } from '@testing-library/react-native';

import { bootstrapDatabase } from '../../../db/bootstrap';
import { useDatabaseBootstrap } from '..';

jest.mock('../../../db/bootstrap', () => ({ bootstrapDatabase: jest.fn() }));
const boot = bootstrapDatabase as jest.Mock;

beforeEach(() => boot.mockReset());

describe('useDatabaseBootstrap (F-09)', () => {
  it('runs bootstrap once on mount: loading → ready', async () => {
    let resolve: (v: unknown) => void = () => undefined;
    boot.mockReturnValue(new Promise((r) => (resolve = r)));
    const { result } = await renderHook(() => useDatabaseBootstrap());
    expect(result.current.status).toBe('loading');
    await act(() => resolve({ ok: true, db: {} }));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(boot).toHaveBeenCalledTimes(1);
  });

  it('surfaces the typed code; retry runs it again and can succeed', async () => {
    boot.mockResolvedValueOnce({ ok: false, code: 'DB_KEY_UNAVAILABLE' }).mockResolvedValueOnce({ ok: true, db: {} });
    const { result } = await renderHook(() => useDatabaseBootstrap());
    await waitFor(() => expect(result.current).toMatchObject({ status: 'error', code: 'DB_KEY_UNAVAILABLE' }));
    await act(() => result.current.retry());
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(boot).toHaveBeenCalledTimes(2);
  });

  it('a thrown bootstrap maps to DB_MIGRATION_FAILED; retry while running is ignored', async () => {
    boot.mockRejectedValueOnce(new Error('boom'));
    const { result } = await renderHook(() => useDatabaseBootstrap());
    await waitFor(() => expect(result.current).toMatchObject({ status: 'error', code: 'DB_MIGRATION_FAILED' }));
    let resolve: (v: unknown) => void = () => undefined;
    boot.mockReturnValue(new Promise((r) => (resolve = r)));
    await act(() => {
      result.current.retry();
      result.current.retry();
    });
    expect(boot).toHaveBeenCalledTimes(2);
    expect(result.current.status).toBe('loading');
    await act(() => resolve({ ok: true, db: {} }));
    await waitFor(() => expect(result.current.status).toBe('ready'));
  });
});
