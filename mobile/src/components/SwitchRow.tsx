import { StyleSheet, Switch, View } from 'react-native';

import { radius, size, spacing } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { Touch } from './Touch';
import { Txt } from './Txt';

type Props = {
  label: string;
  hint?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  testID: string;
};

/**
 * Switch row (cm:120-127, P-15): the row is the one accessible control and toggles; the inner native
 * Switch is hidden from accessibility so VoiceOver / TalkBack get one stop per row (N4).
 */
export function SwitchRow({ label, hint, value, onValueChange, testID }: Props) {
  const { c } = useTheme();
  return (
    <Touch
      testID={testID}
      accessibilityRole="switch"
      accessibilityLabel={hint ? `${label}. ${hint}` : label}
      accessibilityState={{ checked: value }}
      onPress={() => onValueChange(!value)}
      style={[styles.row, { backgroundColor: c.bgRaised }]}
    >
      <View style={styles.text}>
        <Txt variant="chipRegular">{label}</Txt>
        {hint ? <Txt variant="caption" color="textSecondary">{hint}</Txt> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: c.borderStronger, true: c.accentFill }}
        ios_backgroundColor={c.borderStronger}
        thumbColor={value ? c.accentOn : c.textPrimary}
        accessible={false}
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
      />
    </Touch>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: size.listRowMinHeight, borderRadius: radius.md, paddingVertical: spacing[3], paddingHorizontal: spacing[4], flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  text: { flex: 1, minWidth: 0, gap: spacing[1] },
});
