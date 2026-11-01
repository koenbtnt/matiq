import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { localDateOf } from '../../domain/session/localDate';
import { deviceTimeZone, runtime } from '../runtime';

/** How often the device-local date is re-checked while the app is in the foreground. */
export const LOCAL_DATE_POLL_MS = 60_000;

const todayNow = () => localDateOf(runtime().now(), deviceTimeZone());

/**
 * The device-local date (`YYYY-MM-DD`), updated when it rolls over: on returning to the foreground
 * (AppState `active`) and by a once-a-minute check while open — robust to DST and zone changes,
 * unlike a single midnight timer. Internal to the hooks (not part of the data contract).
 */
export function useLocalDate(): string {
  const [today, setToday] = useState(todayNow);
  useEffect(() => {
    const check = () => setToday((prev) => {
      const next = todayNow();
      return next === prev ? prev : next;
    });
    const timer = setInterval(check, LOCAL_DATE_POLL_MS);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, []);
  return today;
}
