import { StyleSheet, View } from 'react-native';
import { useEffect } from 'react';
import { AccessibilityInfo } from 'react-native';

import { radius, semantic, spacing } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { Icon } from './Icon';
import { Txt } from './Txt';

/** T-05 / DSR-7: danger tint + glyph + text, polite live region. */
export function ErrorBanner({ message, testID }: { message: string; testID?: string }) {
  const { c } = useTheme();
  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(message);
  }, [message]);
  return (
    <View testID={testID} accessibilityLiveRegion="polite" accessible accessibilityLabel={message} style={[styles.row, { backgroundColor: c[semantic.buttonDestructive.bg] }]}>
      <Icon name="error" color={semantic.buttonDestructive.text} />
      <Txt variant="caption" style={[styles.text, { color: c[semantic.buttonDestructive.text] }]}>{message}</Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], padding: spacing[3], borderRadius: radius.md },
  text: { flex: 1 },
});
