import { router } from 'expo-router';

import { loadQuickLogTarget } from '../../hooks/data';

/** D-A1: the Log tab and Home "Quick log" both land in the prefilled Log sheet (plan §4 quickLogTarget). */
export async function openQuickLog(): Promise<void> {
  const target = await loadQuickLogTarget();
  if ('sessionId' in target) {
    router.push({ pathname: '/log-session', params: { mode: 'log', sessionId: target.sessionId } });
  } else {
    router.push({ pathname: '/log-session', params: { mode: 'log', typeId: target.sessionTypeId } });
  }
}
