import { Text, type TextProps, type TextStyle } from 'react-native';

import { useTheme } from '../theme/useTheme';
import { textMaxScale, textStyle, type ColorScheme } from '../theme/tokens';

export type TextVariant = keyof typeof textStyle;

type Props = TextProps & { variant?: TextVariant; color?: keyof ColorScheme };

/** Themed text: typography, colour and Dynamic Type cap all come from tokens. */
export function Txt({ variant = 'body', color = 'textPrimary', style, ...rest }: Props) {
  const { c } = useTheme();
  return (
    <Text
      maxFontSizeMultiplier={textMaxScale[variant]}
      style={[textStyle[variant] as TextStyle, { color: c[color] }, style]}
      {...rest}
    />
  );
}
