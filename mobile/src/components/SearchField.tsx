import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { size, spacing, textMaxScale, textStyle } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { Icon } from './Icon';
import { IconButton } from './IconButton';
import { Txt } from './Txt';

type Props = {
  label: string;
  accessibilityLabel?: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  testID: string;
  clearTestID: string;
  autoFocus?: boolean;
};

export function SearchField({ label, accessibilityLabel, value, onChangeText, placeholder, testID, clearTestID, autoFocus }: Props) {
  const { t } = useTranslation();
  const { c } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.wrap}>
      <Txt variant="caption" color="textSecondary">{label}</Txt>
      <View
        style={[
          styles.field,
          { backgroundColor: c.bgRaised, borderColor: focused ? c.accentBorder : c.bgRaised, borderWidth: focused ? size.borderWidthFocus : size.borderWidth },
        ]}
      >
        <Icon name="search" color="textSecondary" />
        <TextInput
          testID={testID}
          accessibilityLabel={accessibilityLabel ?? label}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={c.textPlaceholder}
          returnKeyType="search"
          autoFocus={autoFocus}
          autoCorrect={false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          maxFontSizeMultiplier={textMaxScale.input}
          style={[textStyle.input, styles.input, { color: c.textPrimary }]}
        />
        {value.length > 0 ? (
          <IconButton bare icon="close" glyphSize={size.iconInline} accessibilityLabel={t('common.clearSearch')} testID={clearTestID} onPress={() => onChangeText('')} />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing[1] },
  field: { height: size.searchHeight, borderRadius: size.searchHeight / 2, paddingLeft: spacing[4], flexDirection: 'row', alignItems: 'center', gap: spacing[2], overflow: 'visible' },
  input: { flex: 1, paddingVertical: 0 },
});
