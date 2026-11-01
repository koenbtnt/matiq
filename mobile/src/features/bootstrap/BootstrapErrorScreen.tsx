import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { BottomActionBar } from '../../components/BottomActionBar';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { Txt } from '../../components/Txt';
import type { TKey } from '../../i18n/keys';
import en from '../../i18n/en.json';
import { errorKey } from '../../i18n/keys';
import { size, spacing } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';

type Props = {
  code: string;
  /** Re-runs the bootstrap; the button is busy while the promise is pending. */
  onRetry: () => void | Promise<void>;
  /** `__DEV__` only: wipe and re-create the database. */
  onDevReset?: () => void | Promise<void>;
};

const titleKey = (code: string): TKey => (`bootstrap.title.${code}` in en ? (`bootstrap.title.${code}` as TKey) : 'errors.UNKNOWN');

/** Rendered by the root layout instead of the navigator for a failed bootstrap (§4.2.2). */
export function BootstrapErrorScreen({ code, onRetry, onDevReset }: Props) {
  const { t } = useTranslation();
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);
  const retry = async () => {
    setBusy(true);
    try { await onRetry(); } finally { setBusy(false); }
  };
  return (
    <View testID="bootstrap.error" style={[styles.fill, { backgroundColor: c.bgBase, paddingTop: insets.top }]}>
      <View style={styles.center}>
        <Icon name="error" size={size.icon} color="textSecondary" />
        <Txt testID="bootstrap.error.title" variant="titleM" accessibilityRole="header">{t(titleKey(code))}</Txt>
        <Txt variant="body" color="textSecondary">{t(errorKey(code))}</Txt>
        <Txt variant="caption" color="textSecondary">{t('bootstrap.code', { code })}</Txt>
      </View>
      <BottomActionBar tone="base" absolute={false}>
        {onDevReset ? <Button variant="destructive" fullWidth testID="bootstrap.devReset" label={t('bootstrap.devReset')} onPress={() => void onDevReset()} /> : null}
        <Button variant="primary" fullWidth testID="bootstrap.retry" label={t('common.tryAgain')} busy={busy} onPress={() => void retry()} />
      </BottomActionBar>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing[5], gap: spacing[3] },
});
