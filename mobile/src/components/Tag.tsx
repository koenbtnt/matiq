import { StyleSheet, View } from 'react-native';

import { radius, semantic, size, spacing } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { Icon } from './Icon';
import { Txt } from './Txt';

type TagProps = { label: string; testID?: string };

/** Neutral tag (cm:157-159). */
export function Tag({ label, testID }: TagProps) {
  const { c } = useTheme();
  return (
    <View testID={testID} style={[styles.box, { backgroundColor: c.bgRaised }]}>
      <Txt variant="tag">{label}</Txt>
    </View>
  );
}

type BadgeProps = { label: string; variant: 'gi' | 'flagged'; testID?: string };

/** Status badge (cm:162): text always present, plus a flag glyph for Flagged (R-17). */
export function Badge({ label, variant, testID }: BadgeProps) {
  const { c } = useTheme();
  const pair = variant === 'gi' ? semantic.tagGi : semantic.badgeComp;
  return (
    <View testID={testID} style={[styles.box, styles.badge, { backgroundColor: c[pair.bg] }]}>
      {variant === 'flagged' ? <Icon name="flag" size={size.iconCheck} color={pair.text} /> : null}
      <Txt variant="badge" style={{ color: c[pair.text] }}>{label}</Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { height: size.tagHeight, borderRadius: radius.sm, paddingHorizontal: spacing[2], justifyContent: 'center', alignSelf: 'flex-start' },
  badge: { height: size.badgeHeight, flexDirection: 'row', alignItems: 'center', gap: spacing[1] },
});
