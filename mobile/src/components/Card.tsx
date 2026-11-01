import { StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { radius, size, spacing } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';

type Props = ViewProps & {
  /** surface + hairline (default), or the raised class-card (no border). */
  tone?: 'surface' | 'raised';
  padding?: number;
  style?: StyleProp<ViewStyle>;
};

export function Card({ tone = 'surface', padding = spacing[5], style, ...rest }: Props) {
  const { c } = useTheme();
  return (
    <View
      style={[
        styles.base,
        { padding },
        tone === 'raised'
          ? { backgroundColor: c.bgRaised }
          : { backgroundColor: c.bgSurface, borderWidth: size.borderWidth, borderColor: c.borderDefault },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({ base: { borderRadius: radius.lg, gap: spacing[3] } });
