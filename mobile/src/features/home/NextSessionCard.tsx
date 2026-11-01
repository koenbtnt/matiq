import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Txt } from '../../components/Txt';
import type { SessionSummary } from '../../hooks/data';
import { spacing } from '../../theme/tokens';
import { whenLabel } from './format';

export function NextSessionCard({ session, today }: { session: SessionSummary; today: string }) {
  const { t } = useTranslation();
  const when = whenLabel(t, session, today);
  const go = (mode: 'log' | 'plan') => router.push({ pathname: '/log-session', params: { mode, sessionId: session.id } });
  return (
    <Card testID="home.next" tone="raised">
      <Txt variant="overline" color="accentText">{t('home.next.overline', { when })}</Txt>
      <Txt variant="titleM">{session.sessionTypeName}</Txt>
      <Txt variant="caption" color="textSecondary" numberOfLines={2}>{session.focusNames.join(' · ')}</Txt>
      <View style={styles.row}>
        <Button variant="outlinedCompact" testID="home.next.logIt" style={styles.flex} label={t('home.next.logIt')} accessibilityLabel={t('home.next.logIt.a11y', { type: session.sessionTypeName, when })} onPress={() => go('log')} />
        <Button variant="outlinedCompact" testID="home.next.editPlan" style={styles.flex} label={t('home.next.editPlan')} accessibilityLabel={t('home.next.editPlan.a11y', { type: session.sessionTypeName, when })} onPress={() => go('plan')} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', gap: spacing[2] }, flex: { flex: 1 } });
