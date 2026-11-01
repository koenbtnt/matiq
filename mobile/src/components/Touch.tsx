import { Platform, Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/useTheme';

const PRESSED_OPACITY = 0.72; // token-adherence: allow — DSR-6 pressed state (no drawn token)

type Props = Omit<PressableProps, 'style'> & { style?: StyleProp<ViewStyle> };

/** Pressable with the DSR-6 pressed state: opacity on iOS, ripple on Android. */
export function Touch({ style, disabled, ...rest }: Props) {
  const { c } = useTheme();
  return (
    <Pressable
      disabled={disabled}
      android_ripple={{ color: c.borderStrong }}
      style={({ pressed }) => [style, Platform.OS === 'ios' && pressed && !disabled ? { opacity: PRESSED_OPACITY } : null]}
      {...rest}
    />
  );
}
