import { ActivityIndicator, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { vSlop } from '../theme/layout';
import { semantic, size, spacing, type ColorScheme } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { Touch } from './Touch';
import { Txt, type TextVariant } from './Txt';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outlinedCompact';

type Spec = { height: number; text: TextVariant; bg: keyof ColorScheme | null; fg: keyof ColorScheme; border: keyof ColorScheme | null };

const SPEC: Record<ButtonVariant, Spec> = {
  primary: { height: size.buttonPrimaryHeight, text: 'buttonLg', bg: semantic.buttonPrimary.bg, fg: semantic.buttonPrimary.text, border: null },
  secondary: { height: size.buttonHeight, text: 'button', bg: semantic.buttonSecondary.bg, fg: semantic.buttonSecondary.text, border: 'borderDefault' },
  ghost: { height: size.buttonHeight, text: 'button', bg: null, fg: 'accentText', border: null },
  destructive: { height: size.buttonHeight, text: 'button', bg: semantic.buttonDestructive.bg, fg: semantic.buttonDestructive.text, border: null },
  outlinedCompact: { height: size.buttonCompactHeight, text: 'button', bg: null, fg: 'textPrimary', border: 'borderStrong' },
};

type Props = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  busy?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  /** Ghost buttons hug their label (cm:46: `paddingHorizontal: spacing[3]`). */
  busyLabel?: string;
  accessibilityLabel?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, onPress, variant = 'secondary', busy = false, disabled = false, fullWidth = false, busyLabel, accessibilityLabel, testID, style }: Props) {
  const { c } = useTheme();
  const spec = SPEC[variant];
  const inactive = disabled;
  const bg = inactive ? c[semantic.buttonDisabled.bg] : spec.bg ? c[spec.bg] : 'transparent';
  const fg = inactive ? c[semantic.buttonDisabled.text] : c[spec.fg];
  return (
    <Touch
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={busy ? busyLabel ?? accessibilityLabel ?? label : accessibilityLabel ?? label}
      accessibilityState={{ disabled: inactive, busy }}
      disabled={inactive || busy}
      onPress={onPress}
      hitSlop={vSlop(spec.height)}
      style={[
        styles.base,
        { height: spec.height, borderRadius: spec.height / 2, backgroundColor: bg },
        spec.border && !inactive ? { borderWidth: size.borderWidth, borderColor: c[spec.border] } : null,
        variant === 'ghost' ? styles.ghost : null,
        fullWidth ? styles.full : null,
        style,
      ]}
    >
      {busy ? <ActivityIndicator color={c.accentOn} /> : <Txt variant={spec.text} style={{ color: fg }} numberOfLines={2}>{label}</Txt>}
    </Touch>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing[5], overflow: 'hidden' },
  ghost: { paddingHorizontal: spacing[3] },
  full: { alignSelf: 'stretch' },
});
