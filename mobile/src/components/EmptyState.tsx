import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';

import { radius, size, spacing } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { Txt } from './Txt';

type Props = {
  title?: string;
  body: string;
  /** An optional Button node (secondary or ghost). */
  action?: ReactNode;
  /** `card` = bordered surface (Home); `plain` = centred text (lists). */
  tone?: 'card' | 'plain';
  testID?: string;
  style?: StyleProp<ViewStyle>;
};

/** DSR-8 / T-06: title, body naming the next step, optional action. */
export function EmptyState({ title, body, action, tone = 'plain', testID, style }: Props) {
  const { c } = useTheme();
  return (
    <View
      testID={testID}
      style={[
        styles.base,
        tone === 'card' ? { backgroundColor: c.bgSurface, borderWidth: size.borderWidth, borderColor: c.borderDefault, borderRadius: radius.lg, padding: spacing[5] } : { paddingVertical: spacing[8] },
        style,
      ]}
    >
      {title ? <Txt variant="headline" accessibilityRole="header">{title}</Txt> : null}
      <Txt variant="body" color="textSecondary">{body}</Txt>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({ base: { gap: spacing[3], alignItems: 'flex-start' } });
