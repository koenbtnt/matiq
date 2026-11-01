import { addDatabaseChangeListener } from 'expo-sqlite';
import { useCallback, useEffect, useRef, useState } from 'react';

import { toDomainError } from '../../domain/errors';
import type { HookResult } from '../contracts';

export type LiveResult<T> = HookResult<T> & { reload: () => void };

/**
 * Re-runs a repository read whenever one of `tables` changes. drizzle's `useLiveQuery` watches
 * only the main table of one query, while every read here is a multi-table composite, so this
 * hook subscribes to expo-sqlite's change events itself (the mechanism `useLiveQuery` uses).
 * Bursts of change events (one per written row) are coalesced into one re-read.
 */
export function useLiveRead<T>(read: () => Promise<T>, tables: readonly string[], deps: readonly unknown[]): LiveResult<T> {
  const [state, setState] = useState<HookResult<T>>({});
  const readRef = useRef(read);
  readRef.current = read;
  const generation = useRef(0);

  const run = useCallback(() => {
    const mine = ++generation.current;
    // Promise.resolve().then: a read that throws synchronously still lands in `error`.
    Promise.resolve().then(() => readRef.current()).then(
      (data) => mine === generation.current && setState({ data }),
      (e: unknown) => mine === generation.current && setState({ error: toDomainError(e) }),
    );
  }, []);

  useEffect(() => {
    setState({});
    run();
    const watched = new Set(tables);
    let scheduled: ReturnType<typeof setTimeout> | undefined;
    const sub = addDatabaseChangeListener(({ tableName }) => {
      if (!watched.has(tableName) || scheduled) return;
      scheduled = setTimeout(() => {
        scheduled = undefined;
        run();
      }, 0);
    });
    return () => {
      generation.current += 1;
      if (scheduled) clearTimeout(scheduled);
      sub.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- callers pass the read's inputs as deps
  }, deps);

  return { ...state, reload: run };
}
