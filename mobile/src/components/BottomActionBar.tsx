import type { ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { size, spacing } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';

type Props = {
  children: ReactNode;
  /** `bgBase` screens (detail, bootstrap) use `base` and no top border. */
  tone?: 'surface' | 'base';
  onHeight?: (h: number) => void;
  absolute?: boolean;
};

/** Bottom-anchored message line + primary action (cm:369-375). */
export function BottomActionBar({ children, tone = 'surface', onHeight, absolute = true }: Props) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      onLayout={onHeight ? (e: LayoutChangeEvent) => onHeight(e.nativeEvent.layout.height) : undefined}
      style={[
        styles.bar,
        absolute ? styles.abs : null,
        {
          backgroundColor: tone === 'surface' ? c.bgSurface : c.bgBase,
          borderTopWidth: tone === 'surface' ? size.borderWidth : 0,
          borderTopColor: c.borderDefault,
          paddingBottom: Math.max(insets.bottom, spacing[3]),
        },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { paddingTop: spacing[3], paddingHorizontal: spacing[5], gap: spacing[2] },
  abs: { position: 'absolute', left: 0, right: 0, bottom: 0 },
});
