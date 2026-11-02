import { useEffect, useState } from 'react';
import { PixelRatio, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ErrorBanner } from '../../components/ErrorBanner';
import { Stepper } from '../../components/Stepper';
import { TextField } from '../../components/TextField';
import { Txt } from '../../components/Txt';
import { useDataActions, type AlgorithmParamRow } from '../../hooks/data';
import { errorKey } from '../../i18n/keys';
import { STACK_FONT_SCALE } from '../../theme/layout';
import { spacing } from '../../theme/tokens';
import { pfmt } from '../progress/format';
import { parseTyped, roundTo, type ParamUi } from './paramUi';

type Props = { row: AlgorithmParamRow; ui: ParamUi; weightShare?: number };

/** One param: a stepper and a typed numeric field, two separate accessibility stops (S7, P-12). */
export function ParamField({ row, ui, weightShare }: Props) {
  const { t } = useTranslation();
  const actions = useDataActions();
  const [text, setText] = useState(String(row.value));
  const [error, setError] = useState<string>();
  useEffect(() => setText(String(row.value)), [row.value]);

  const label = t(`algorithm.param.${ui.key}`);
  const id = `algorithm.param.${ui.key}`;

  const commit = async (value: number) => {
    try {
      await actions.setParam({ version: row.algorithmVersion, key: ui.key, value });
      setError(undefined);
    } catch (e) {
      const err = e as { code?: string; details?: Record<string, string | number> };
      setError(t(errorKey(err.code), err.details));
      setText(String(row.value));
    }
  };
  const commitText = () => {
    const n = parseTyped(text);
    if (Number.isNaN(n)) {
      setError(t('algorithm.param.invalidNumber'));
      setText(String(row.value));
      return;
    }
    void commit(n);
  };

  const stacked = PixelRatio.getFontScale() >= STACK_FONT_SCALE;
  const range = t('algorithm.param.range', { min: pfmt.decimal(row.min), max: pfmt.decimal(row.max), default: pfmt.decimal(row.defaultValue) });
  return (
    <View style={styles.wrap}>
      <Txt variant="caption" color="textSecondary">{label}</Txt>
      <View style={[styles.controls, stacked ? styles.stacked : null]}>
        <View style={stacked ? null : styles.flex}>
          <Stepper
            value={row.value}
            onChange={(v) => void commit(roundTo(v, ui.decimals))}
            min={row.min}
            max={row.max}
            step={ui.step}
            unsetText="0"
            unit={ui.unit ? t(`algorithm.unit.${ui.unit}`) : undefined}
            lessLabel={t('algorithm.param.less.a11y', { label })}
            moreLabel={t('algorithm.param.more.a11y', { label })}
            accessibilityLabel={label}
            testIDPrefix={id}
          />
        </View>
        <View style={stacked ? null : styles.flex}>
          <TextField
            hideLabel
            centered
            tabular
            label={label}
            accessibilityLabel={t('algorithm.param.input.a11y', { label })}
            accessibilityHint={range}
            testID={`${id}.input`}
            value={text}
            onChangeText={setText}
            keyboardType={ui.keyboard}
            selectTextOnFocus
            onBlur={commitText}
            onSubmitEditing={commitText}
          />
        </View>
      </View>
      <Txt variant="caption" color="textSecondary">{range}</Txt>
      {weightShare !== undefined ? <Txt variant="caption" color="textSecondary">{t('algorithm.weightShare', { pct: pfmt.percent(weightShare) })}</Txt> : null}
      {error ? <ErrorBanner testID={`${id}.error`} message={error} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing[1] },
  controls: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  stacked: { flexDirection: 'column', alignItems: 'stretch', gap: spacing[2] },
  flex: { flex: 1 },
});
