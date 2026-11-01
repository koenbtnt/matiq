import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { hapticStepper } from '../hooks/haptics';
import { vSlop } from '../theme/layout';
import { radius, semantic, size, spacing } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { Icon } from './Icon';
import { Touch } from './Touch';
import { Txt } from './Txt';

type Props = {
  value: number | undefined;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  /** D-A7: the first touch of an untouched stepper sets this (duration: 60). Default: `min + step` for +, `min` for −. */
  firstValue?: number;
  /** Shown while `value` is undefined (D-A7: "0" for counts, "–" for duration). */
  unsetText: string;
  unit?: string;
  lessLabel: string;
  moreLabel: string;
  /** testIDs: `<prefix>.less`, `.more`, `.value`. */
  testIDPrefix: string;
  /** Spoken label when the visible caption is drawn by the caller (Algorithm param fields). */
  accessibilityLabel?: string;
  /** Overline label above (omit to render the control alone). */
  label?: string;
};

export function Stepper({ value, onChange, min, max, step = 1, firstValue, unsetText, unit, lessLabel, moreLabel, testIDPrefix, label, accessibilityLabel }: Props) {
  const { t } = useTranslation();
  const { c } = useTheme();
  const now = value ?? min;
  const lessDisabled = value === undefined ? firstValue === undefined : value <= min;
  const moreDisabled = value !== undefined && value >= max;

  const change = (dir: 1 | -1) => {
    let next: number;
    if (value === undefined) next = firstValue ?? (dir === 1 ? Math.min(min + step, max) : min);
    else next = Math.min(max, Math.max(min, value + dir * step));
    if (next === value) return;
    hapticStepper();
    onChange(next);
  };

  const button = (dir: 1 | -1, disabled: boolean) => (
    <Touch
      testID={`${testIDPrefix}.${dir === 1 ? 'more' : 'less'}`}
      accessibilityRole="button"
      accessibilityLabel={dir === 1 ? moreLabel : lessLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => change(dir)}
      hitSlop={vSlop(size.stepperButton)}
      style={[styles.btn, { backgroundColor: disabled ? c[semantic.buttonDisabled.bg] : c.borderDefault }]}
    >
      <Icon name={dir === 1 ? 'plus' : 'minus'} size={size.iconButtonGlyph} color={disabled ? semantic.buttonDisabled.text : 'textPrimary'} />
    </Touch>
  );

  return (
    <View style={styles.wrap}>
      {label ? <Txt variant="overline" color="textSecondary">{label}</Txt> : null}
      <View style={[styles.box, { backgroundColor: c.bgRaised }]}>
        {button(-1, lessDisabled)}
        <View
          testID={`${testIDPrefix}.value`}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={label ?? accessibilityLabel}
          accessibilityValue={value === undefined ? { text: t('log.notSet') } : { min, max, now: value }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(e) => {
            if (e.nativeEvent.actionName === 'increment' && !moreDisabled) change(1);
            if (e.nativeEvent.actionName === 'decrement' && !lessDisabled) change(-1);
          }}
          style={styles.value}
        >
          <Txt variant="stepperValue">{value === undefined ? unsetText : String(value)}</Txt>
          {unit && value !== undefined ? <Txt variant="caption" color="textSecondary">{unit}</Txt> : null}
        </View>
        {button(1, moreDisabled)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing[1] },
  box: { borderRadius: radius.md, padding: spacing[1], flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  btn: { width: size.stepperButton, height: size.stepperButton, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  value: { flexDirection: 'row', alignItems: 'baseline', gap: spacing[1] },
});
