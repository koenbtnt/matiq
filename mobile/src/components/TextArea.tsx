import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { radius, size, spacing, textMaxScale, textStyle } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { Txt } from './Txt';

type Props = {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  testID?: string;
};

/** R-A4: the visible caption label is required; the placeholder is a hint only. */
export function TextArea({ label, value, onChangeText, placeholder, testID }: Props) {
  const { c } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.wrap}>
      <Txt variant="caption" color="textSecondary">{label}</Txt>
      <TextInput
        testID={testID}
        accessibilityLabel={label}
        multiline
        textAlignVertical="top"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.textPlaceholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        maxFontSizeMultiplier={textMaxScale.body}
        style={[
          textStyle.body,
          styles.input,
          { color: c.textPrimary, backgroundColor: c.bgRaised, borderColor: focused ? c.accentBorder : c.borderDefault, borderWidth: focused ? size.borderWidthFocus : size.borderWidth },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing[1] },
  input: { minHeight: size.textareaHeight, borderRadius: radius.md, padding: spacing[3] },
});
