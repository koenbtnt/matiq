import { StyleSheet, View } from 'react-native';

import type { Belt } from '../hooks/data/types';
import { radius, size } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import type { ColorScheme } from '../theme/tokens';

type Look = { fill: keyof ColorScheme; band?: 'beltWhite' | 'beltBlack' };

const LOOK: Record<Belt, Look> = {
  WHITE: { fill: 'beltWhite' },
  BLUE: { fill: 'beltBlue' },
  PURPLE: { fill: 'beltPurple' },
  BROWN: { fill: 'beltBrown' },
  BLACK: { fill: 'beltBlack' },
  GREY_WHITE: { fill: 'beltKidsGrey', band: 'beltWhite' },
  GREY: { fill: 'beltKidsGrey' },
  GREY_BLACK: { fill: 'beltKidsGrey', band: 'beltBlack' },
  YELLOW_WHITE: { fill: 'beltKidsYellow', band: 'beltWhite' },
  YELLOW: { fill: 'beltKidsYellow' },
  YELLOW_BLACK: { fill: 'beltKidsYellow', band: 'beltBlack' },
  ORANGE_WHITE: { fill: 'beltKidsOrange', band: 'beltWhite' },
  ORANGE: { fill: 'beltKidsOrange' },
  ORANGE_BLACK: { fill: 'beltKidsOrange', band: 'beltBlack' },
  GREEN_WHITE: { fill: 'beltKidsGreen', band: 'beltWhite' },
  GREEN: { fill: 'beltKidsGreen' },
  GREEN_BLACK: { fill: 'beltKidsGreen', band: 'beltBlack' },
};

/** Belt swatch (cm:160): fill + ring; kids split belts draw a 50 % band (P-25). Rank only, never UI state. */
export function BeltSwatch({ belt }: { belt: Belt }) {
  const { c } = useTheme();
  const look = LOOK[belt];
  const edge = belt === 'WHITE' || belt === 'BLACK' ? c.borderStrong : c[look.fill];
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: size.beltSwatchWidth, height: size.beltSwatchHeight, borderRadius: radius.xs, backgroundColor: c[look.fill], borderWidth: size.borderWidth, borderColor: edge, overflow: 'hidden', justifyContent: 'center' }}
    >
      {look.band ? <View style={{ height: size.beltSwatchHeight / 2, backgroundColor: c[look.band] }} /> : null}
    </View>
  );
}

/** Belt rank, size L (cm:179-200). Decorative: the rank name is rendered beside it (R-C5, DSR-4). */
export function BeltRank({ belt, stripes }: { belt: Belt; stripes: number }) {
  const { c } = useTheme();
  const look = LOOK[belt];
  const edge = belt === 'WHITE' || belt === 'BLACK' ? c.borderStrong : c[look.fill];
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.belt, { backgroundColor: c[look.fill], borderColor: edge }]}
    >
      {look.band ? <View style={[styles.band, { backgroundColor: c[look.band] }]} /> : null}
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
  band: { position: 'absolute', left: 0, right: 0, top: size.beltLHeight / 4, height: size.beltLHeight / 2 },
  bar: { width: size.beltLBarWidth, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'stretch', gap: size.beltLStripeGap, paddingHorizontal: size.beltLBarPadding },
  stripe: { width: size.beltLStripe },
  tail: { width: size.beltLTail },
});
