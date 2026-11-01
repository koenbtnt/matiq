import { Platform, StyleSheet, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid, type DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';

import { spacing } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { Chip } from './Chip';

type Props = {
  value: Date;
  onChange: (d: Date) => void;
  mode: 'date' | 'time';
  testID: string;
  maximumDate?: Date;
};

const dateFmt = new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
const timeFmt = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });

/** R-N5: iOS compact native picker; Android: picker chip that opens the system dialog (D-A19). */
export function DateTimeField({ value, onChange, mode, testID, maximumDate }: Props) {
  const { t } = useTranslation();
  const { scheme, c } = useTheme();
  const text = (mode === 'date' ? dateFmt : timeFmt).format(value);
  const a11y = mode === 'date' ? t('log.when.date.a11y', { date: text }) : t('log.when.time.a11y', { time: text });

  if (Platform.OS === 'android') {
    return (
      <Chip
        variant="picker"
        testID={testID}
        label={text}
        icon={mode === 'date' ? 'calendar' : 'clock'}
        accessibilityLabel={a11y}
        accessibilityRole="button"
        onPress={() =>
          DateTimePickerAndroid.open({
            value, mode, design: 'material', maximumDate,
            onValueChange: (_e: DateTimePickerChangeEvent, d: Date) => onChange(d),
          })
        }
      />
    );
  }
  return (
    <View style={styles.wrap} testID={testID} accessible={false}>
      <DateTimePicker
        value={value}
        mode={mode}
        display="compact"
        maximumDate={maximumDate}
        themeVariant={scheme}
        accentColor={c.accentText}
        accessibilityLabel={a11y}
        onValueChange={(_e: DateTimePickerChangeEvent, d: Date) => onChange(d)}
      />
    </View>
  );
}

const styles = StyleSheet.create({ wrap: { marginRight: spacing[2] } });
