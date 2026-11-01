import { act, renderHook, waitFor } from '@testing-library/react-native';
import { addDatabaseChangeListener } from 'expo-sqlite';

import { DomainError } from '../../../domain/errors';
import { useLiveRead } from '../useLiveRead';

const listeners: ((e: { tableName: string }) => void)[] = [];
beforeEach(() => {
  listeners.length = 0;
  (addDatabaseChangeListener as jest.Mock).mockImplementation((fn) => {
    listeners.push(fn);
    return { remove: () => listeners.splice(listeners.indexOf(fn), 1) };
  });
});
const emit = (tableName: string) => listeners.forEach((l) => l({ tableName }));

describe('useLiveRead', () => {
  it('is loading before the first read resolves', async () => {
    let resolve: (v: number) => void = () => undefined;
    const { result } = await renderHook(() => useLiveRead(() => new Promise<number>((r) => (resolve = r)), ['sessions'], []));
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeUndefined();
    await act(() => resolve(7));
    await waitFor(() => expect(result.current.data).toBe(7));
  });

  it('resolves data, re-reads once per burst on a watched table only', async () => {
    let n = 0;
    const read = jest.fn(async () => ++n);
    const { result } = await renderHook(() => useLiveRead(read, ['sessions'], []));
    await waitFor(() => expect(result.current.data).toBe(1));
    await act(() => {
      emit('positions');
      emit('sessions');
      emit('sessions');
    });
    await waitFor(() => expect(result.current.data).toBe(2));
    expect(read).toHaveBeenCalledTimes(2);
  });

  it('surfaces DomainErrors as is and anything else as UNKNOWN; reload re-runs', async () => {
    const read = jest.fn().mockRejectedValueOnce(new DomainError('SESSION_NOT_FOUND')).mockRejectedValueOnce(new Error('boom')).mockResolvedValue('ok');
    const { result } = await renderHook(() => useLiveRead(read, ['sessions'], []));
    await waitFor(() => expect(result.current.error?.code).toBe('SESSION_NOT_FOUND'));
    await act(() => result.current.reload());
    await waitFor(() => expect(result.current.error?.code).toBe('UNKNOWN'));
    await act(() => result.current.reload());
    await waitFor(() => expect(result.current.data).toBe('ok'));
    expect(result.current.error).toBeUndefined();
  });

  it('unsubscribes on unmount', async () => {
    const { unmount } = await renderHook(() => useLiveRead(async () => 1, ['sessions'], []));
    expect(listeners).toHaveLength(1);
    await unmount();
    expect(listeners).toHaveLength(0);
  });
});
