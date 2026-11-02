import { StyleSheet, View } from 'react-native';

import { hit } from '../theme/layout';
import { size, spacing, type ColorScheme } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { Icon, type IconName } from './Icon';
import { Touch } from './Touch';
import { Txt } from './Txt';

type Action = { label: string; accessibilityLabel: string; onPress: () => void; testID: string };

type Props = {
  title: string;
  testID?: string;
  /** Leading glyph (Progress state headers, P-03). */
  icon?: IconName;
  /** Trailing link action (cm:317-319), e.g. Resources "Add". */
  action?: Action;
  /** Sticky headers need an opaque fill. */
  background?: keyof ColorScheme;
};

export function SectionHeader({ title, testID, icon, action, background }: Props) {
  const { c } = useTheme();
  return (
    <View style={[styles.row, background ? { backgroundColor: c[background] } : null]}>
      {icon ? <Icon name={icon} size={size.iconInline} color="textSecondary" /> : null}
      <Txt testID={testID} variant="titleM" accessibilityRole="header" style={styles.title}>{title}</Txt>
      {action ? (
        <Touch
          testID={action.testID}
          accessibilityRole="link"
          accessibilityLabel={action.accessibilityLabel}
          onPress={action.onPress}
          style={styles.action}
        >
          <Txt variant="chip" color="accentText">{action.label}</Txt>
        </Touch>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: hit, flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  title: { flex: 1 },
  action: { minHeight: hit, paddingHorizontal: spacing[2], justifyContent: 'center' },
});
