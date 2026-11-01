import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { size } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';

/** DSR-9: a native spinner, no skeletons. */
export function LoadingState({ testID, fill = false }: { testID?: string; fill?: boolean }) {
  const { t } = useTranslation();
  const { c } = useTheme();
  return (
    <View testID={testID} style={[styles.box, fill ? styles.fill : null]} accessible accessibilityLabel={t('common.loading')} accessibilityRole="progressbar">
      <ActivityIndicator color={c.textSecondary} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { minHeight: size.listRowMinHeight, alignItems: 'center', justifyContent: 'center' },
  fill: { flex: 1 },
});
