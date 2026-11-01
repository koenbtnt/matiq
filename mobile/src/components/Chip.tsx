import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { vSlop } from '../theme/layout';
import { semantic, size, spacing } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { Icon, type IconName } from './Icon';
import { Touch } from './Touch';
import { Txt } from './Txt';

export type ChipVariant = 'filter' | 'selectable' | 'add' | 'picker';

type Props = {
  label: string;
  variant: ChipVariant;
  /** filter: active; selectable: selected. */
  selected?: boolean;
  onPress?: () => void;
  icon?: IconName;
  accessibilityLabel?: string;
  accessibilityRole?: 'radio' | 'checkbox' | 'button';
  testID?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Chip({ label, variant, selected = false, onPress, icon, accessibilityLabel, accessibilityRole, testID, disabled, style }: Props) {
  const { c } = useTheme();
  const role = accessibilityRole ?? (variant === 'filter' ? 'radio' : variant === 'selectable' ? 'checkbox' : 'button');
  const stateful = role === 'radio' || role === 'checkbox';

  let bg: string = 'transparent';
  let fg: string = c.textPrimary;
  let borderColor: string = c.borderDefault;
  let borderStyle: 'solid' | 'dashed' = 'solid';
  let text: 'chip' | 'chipRegular' = 'chipRegular';
  if (variant === 'filter' && selected) {
    bg = c[semantic.chipActive.bg]; fg = c[semantic.chipActive.text]; borderColor = bg; text = 'chip';
  } else if (variant === 'selectable' && selected) {
    bg = c[semantic.chipSelected.bg]; fg = c[semantic.chipSelected.text]; borderColor = c.accentBorder; text = 'chip';
  } else if (variant === 'add') {
    fg = c.textSecondary; borderColor = c.borderStronger; borderStyle = 'dashed';
  } else if (variant === 'picker') {
    bg = c.bgRaised; borderColor = bg;
  }

  return (
    <Touch
      testID={testID}
      accessibilityRole={role}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={stateful ? { checked: selected, disabled } : { disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={vSlop(size.chipHeight)}
      style={[styles.base, { backgroundColor: bg, borderColor, borderStyle }, variant === 'filter' ? styles.filter : null, style]}
    >
      {variant === 'selectable' && selected ? <Icon name="check" size={size.iconCheck} color={semantic.chipSelected.text} emphasis /> : null}
      {variant === 'picker' && icon ? <Icon name={icon} size={size.iconCheck} color="textSecondary" /> : null}
      <Txt variant={text} style={{ color: fg }}>{label}</Txt>
    </Touch>
  );
}

const styles = StyleSheet.create({
  base: {
    height: size.chipHeight,
    borderRadius: size.chipHeight / 2,
    borderWidth: size.borderWidth,
    paddingHorizontal: spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1],
    alignSelf: 'flex-start',
  },
  filter: { paddingHorizontal: spacing[4] },
});
