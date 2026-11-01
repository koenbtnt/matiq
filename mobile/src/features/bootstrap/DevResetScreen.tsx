import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { LoadingState } from '../../components/LoadingState';
import { Txt } from '../../components/Txt';
import { useAbout, useDataActions } from '../../hooks/data';
import { spacing } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';
import { BootstrapErrorScreen } from './BootstrapErrorScreen';

/** `matiq://dev/reset` (F-25): wipe the database, then go Home. `__DEV__` only. */
export function DevResetScreen() {
  const { t } = useTranslation();
  const { c } = useTheme();
  const actions = useDataActions();
  const about = useAbout();
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!__DEV__) return;
    let live = true;
    setFailed(false);
    actions.resetDatabase().then(
      () => { if (live) router.replace('/'); },
      () => { if (live) setFailed(true); },
    );
    return () => { live = false; };
  }, [actions, attempt]);

  if (!__DEV__) return <Redirect href="/" />;
  if (failed) return <BootstrapErrorScreen code="DB_RESET_FAILED" onRetry={() => setAttempt((n) => n + 1)} />;
  return (
    <View style={[styles.fill, { backgroundColor: c.bgBase }]}>
      <LoadingState fill />
      <Txt testID="dev.reset.status" variant="body" color="textSecondary" style={styles.status}>{t('dev.reset.status')}</Txt>
      {about.data ? <Txt testID="dev.reset.backup" variant="caption" color="textSecondary">{t('dev.reset.backup', { status: about.data.backup })}</Txt> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  status: { padding: spacing[5], textAlign: 'center' },
});
