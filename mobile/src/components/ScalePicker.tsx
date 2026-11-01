import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { isAndroid } from '../theme/layout';
import { radius, semantic, size, spacing } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import type { TKey } from '../i18n/keys';
import { Touch } from './Touch';
import { Txt } from './Txt';

type Props = {
  value: number | undefined;
  /** D-A6: re-tapping the selected level reports `undefined`. */
  onChange: (v: number | undefined) => void;
  /** The overline text (already includes the "· n of 5" part when set). */
  label: string;
  groupLabel: string;
  /** Word used in each option's a11y label (`log.label.*`). */
  optionKind: TKey;
  /** testIDs: `<prefix>.<n>`. */
  testIDPrefix: string;
};

const LEVELS = [1, 2, 3, 4, 5] as const;

/** The intensity picker (cm:129-139), reused for ratings and energy (DSR-19). */
export function ScalePicker({ value, onChange, label, groupLabel, optionKind, testIDPrefix }: Props) {
  const { t } = useTranslation();
  const { c } = useTheme();
  return (
    <View style={styles.wrap}>
      <Txt variant="overline" color="textSecondary">{label}</Txt>
      <View accessibilityRole="radiogroup" accessibilityLabel={groupLabel} style={styles.row}>
        {LEVELS.map((n) => {
          const on = value !== undefined && n <= value;
          const pair = on ? semantic.intensitySelected : semantic.intensityUnselected;
          return (
            <Touch
              key={n}
              testID={`${testIDPrefix}.${n}`}
              accessibilityRole="radio"
              accessibilityLabel={t('log.scale.option.a11y', { label: t(optionKind), value: n })}
              accessibilityState={{ checked: n === value }}
              hitSlop={isAndroid ? { top: 2, bottom: 2 } : undefined}
              onPress={() => onChange(n === value ? undefined : n)}
              style={[styles.btn, { backgroundColor: c[pair.bg] }]}
            >
              <Txt variant="statUnit" style={[{ color: c[pair.text] }, styles.num]}>{String(n)}</Txt>
            </Touch>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing[2] },
  row: { flexDirection: 'row', gap: spacing[1] },
  btn: { flex: 1, height: size.intensityButtonHeight, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  num: { fontVariant: ['tabular-nums'] },
});
