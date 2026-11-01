import { useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { fontVariantNumeric, radius, size, spacing, textMaxScale, textStyle } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { Txt } from './Txt';

type Props = Pick<
  TextInputProps,
  'keyboardType' | 'autoCapitalize' | 'autoCorrect' | 'autoFocus' | 'returnKeyType' | 'onBlur' | 'onSubmitEditing' | 'selectTextOnFocus' | 'accessibilityHint'
> & {
  /** R-A4: the visible caption label is required; the placeholder is a hint only. */
  label: string;
  /** Overrides the spoken label (defaults to `label`). */
  accessibilityLabel?: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  testID?: string;
  /** Hide the caption (the control sits beside another labelled control, e.g. a stepper). */
  hideLabel?: boolean;
  centered?: boolean;
  tabular?: boolean;
};

/** Single-line text input (cm:71-78, P-36). */
export function TextField({ label, accessibilityLabel, value, onChangeText, placeholder, testID, hideLabel, centered, tabular, ...input }: Props) {
  const { c } = useTheme();
  const [focused, setFocused] = useState(false);
  const { onBlur, ...rest } = input;
  return (
    <View style={styles.wrap}>
      {hideLabel ? null : <Txt variant="caption" color="textSecondary">{label}</Txt>}
      <TextInput
        testID={testID}
        accessibilityLabel={accessibilityLabel ?? label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.textPlaceholder}
        onFocus={() => setFocused(true)}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        maxFontSizeMultiplier={textMaxScale.input}
        style={[
          textStyle.input,
          styles.input,
          centered ? styles.center : null,
          tabular ? { fontVariant: [...fontVariantNumeric] } : null,
          { color: c.textPrimary, backgroundColor: c.bgRaised, borderColor: focused ? c.accentBorder : c.borderDefault, borderWidth: focused ? size.borderWidthFocus : size.borderWidth },
        ]}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing[1] },
  input: { height: size.inputHeight, borderRadius: radius.md, paddingHorizontal: spacing[3] },
  center: { textAlign: 'center' },
});
