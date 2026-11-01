import { router } from 'expo-router';

import i18n from '../../i18n';
import { errorKey } from '../../i18n/keys';
import { toast } from '../../components/Toast';
import { loadQuickLogTarget } from '../../hooks/data';

/** D-A1: the Log tab and Home "Quick log" both land in the prefilled Log sheet (plan §4 quickLogTarget). */
export async function openQuickLog(): Promise<void> {
  let target;
  try {
    target = await loadQuickLogTarget();
  } catch (e) {
    toast.show({ message: i18n.t(errorKey((e as { code?: string }).code)) });
    return;
  }
  if ('sessionId' in target) {
    router.push({ pathname: '/log-session', params: { mode: 'log', sessionId: target.sessionId } });
  } else {
    router.push({ pathname: '/log-session', params: { mode: 'log', typeId: target.sessionTypeId } });
  }
}
