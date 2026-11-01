import { StyleSheet, View } from 'react-native';

import type { Belt } from '../hooks/data/types';
import { radius, size } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import type { ColorScheme } from '../theme/tokens';

const BELT_COLOR: Record<Belt, keyof ColorScheme> = {
  WHITE: 'beltWhite',
  BLUE: 'beltBlue',
  PURPLE: 'beltPurple',
  BROWN: 'beltBrown',
  BLACK: 'beltBlack',
};

/** Belt swatch (cm:160): fill + ring. Rank only, never UI state. */
export function BeltSwatch({ belt }: { belt: Belt }) {
  const { c } = useTheme();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: size.beltSwatchWidth, height: size.beltSwatchHeight, borderRadius: radius.xs, backgroundColor: c[BELT_COLOR[belt]], borderWidth: size.borderWidth, borderColor: c.borderStrong }}
    />
  );
}

/** Belt rank, size L (cm:179-200). Decorative: the rank name is rendered beside it (R-C5, DSR-4). */
export function BeltRank({ belt, stripes }: { belt: Belt; stripes: number }) {
  const { c } = useTheme();
  const edge = belt === 'WHITE' || belt === 'BLACK' ? c.borderStrong : c[BELT_COLOR[belt]];
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.belt, { backgroundColor: c[BELT_COLOR[belt]], borderColor: edge }]}
    >
      <View style={[styles.bar, { backgroundColor: belt === 'BLACK' ? c.beltBarBlack : c.beltBar }]}>
        {Array.from({ length: stripes }, (_, i) => (
          <View key={i} style={[styles.stripe, { backgroundColor: c.beltStripe }]} />
        ))}
      </View>
      <View style={styles.tail} />
    </View>
  );
}

const styles = StyleSheet.create({
  belt: { height: size.beltLHeight, borderRadius: radius.xs, borderWidth: size.borderWidth, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'stretch', alignSelf: 'stretch', overflow: 'hidden' },
  bar: { width: size.beltLBarWidth, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'stretch', gap: size.beltLStripeGap, paddingHorizontal: size.beltLBarPadding },
  stripe: { width: size.beltLStripe },
  tail: { width: size.beltLTail },
});
