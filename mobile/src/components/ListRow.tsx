import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';

import { hit } from '../theme/layout';
import { size, spacing } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { Icon } from './Icon';
import { Touch } from './Touch';
import { Txt } from './Txt';

type Props = {
  title: string;
  /** One caption line per entry. */
  subtitle?: (string | undefined)[];
  subtitleLines?: number;
  leading?: ReactNode;
  trailing?: ReactNode;
  chevron?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'link' | 'radio' | 'none';
  /** For role radio. */
  checked?: boolean;
  testID?: string;
  /** No bottom hairline (last row / stand-alone). */
  borderless?: boolean;
  wrap?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** List row (cm:238-244): title, caption lines, trailing node, optional chevron. */
export function ListRow({ title, subtitle, subtitleLines, leading, trailing, chevron = false, onPress, disabled, accessibilityLabel, accessibilityRole, checked, testID, borderless, wrap, style }: Props) {
  const { c } = useTheme();
  const interactive = !!onPress;
  const lines = (subtitle ?? []).filter((s): s is string => !!s);
  const body = (
    <>
      {leading}
      <View style={styles.text}>
        <Txt variant="rowTitle">{title}</Txt>
        {lines.map((l, i) => (
          <Txt key={i} variant="caption" color="textSecondary" numberOfLines={subtitleLines}>{l}</Txt>
        ))}
      </View>
      {trailing}
      {chevron ? <Icon name="chevron" size={size.iconChevron} color="textSecondary" emphasis /> : null}
    </>
  );
  const rowStyle = [
    styles.row,
    { borderBottomColor: c.borderDefault, borderBottomWidth: borderless ? 0 : size.borderWidth },
    wrap ? styles.wrap : null,
    style,
  ];
  if (!interactive) {
    return (
      <View testID={testID} accessible={!!accessibilityLabel} accessibilityLabel={accessibilityLabel} style={rowStyle}>
        {body}
      </View>
    );
  }
  return (
    <Touch
      testID={testID}
      accessibilityRole={accessibilityRole === 'none' ? undefined : (accessibilityRole ?? 'button')}
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled, ...(accessibilityRole === 'radio' ? { checked } : {}) }}
      disabled={disabled}
      onPress={onPress}
      style={rowStyle}
    >
      {body}
    </Touch>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: Math.max(size.listRowMinHeight, hit), paddingVertical: spacing[2], flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  wrap: { flexWrap: 'wrap' },
  text: { flex: 1, minWidth: 0, gap: 0 },
});
