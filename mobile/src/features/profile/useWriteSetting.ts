import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { toast } from '../../components/Toast';
import { useDataActions, type SettingKey, type SettingValue } from '../../hooks/data';
import { errorKey } from '../../i18n/keys';

/** Writes a setting at once (P-13); a rejected write is a toast with the error copy. */
export function useWriteSetting() {
  const { t } = useTranslation();
  const actions = useDataActions();
  return useCallback(
    <K extends SettingKey>(key: K, value: SettingValue<K>) => {
      actions.setSetting(key, value).catch((e: unknown) => toast.show({ message: t(errorKey((e as { code?: string }).code)) }));
    },
    [actions, t],
  );
}
