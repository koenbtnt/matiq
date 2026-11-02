import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { LoadingState } from '../../components/LoadingState';
import { toast } from '../../components/Toast';
import { Txt } from '../../components/Txt';
import { useAlgorithmParams, useDataActions, useProgress, type AlgorithmParamRow } from '../../hooks/data';
import { errorKey } from '../../i18n/keys';
import { fontVariantNumeric, spacing } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';
import { ParamField } from './ParamField';
import { PARAM_GROUPS, PARAM_UI } from './paramUi';

const WEIGHT_KEYS = ['wNeedsWork', 'wHitCaught', 'wGap', 'wTrend'];

/** Algorithm parameters (design §4.4.2): live preview, one field per key, reset with Undo. */
export function AlgorithmScreen() {
  const { t } = useTranslation();
  const { c } = useTheme();
  const params = useAlgorithmParams();
  const progress = useProgress();
  const actions = useDataActions();
  const rows = params.data;

  if (params.error) {
    return (
      <View testID="algorithm.screen" style={[styles.fill, { backgroundColor: c.bgBase }]}>
        <EmptyState tone="card" style={styles.pad} title={t('progress.error')} body={t(errorKey(params.error.code))}
          action={<Button variant="secondary" label={t('common.tryAgain')} onPress={params.reload} />} />
      </View>
    );
  }
  if (!rows) return <View style={[styles.fill, { backgroundColor: c.bgBase }]}><LoadingState fill /></View>;

  const byKey = new Map(rows.map((r) => [r.key, r]));
  const version = rows[0]?.algorithmVersion ?? 'v1';
  const weightSum = WEIGHT_KEYS.reduce((n, k) => n + (byKey.get(k)?.value ?? 0), 0);
  const counts = { NEEDS_WORK: 0, NOT_TRAINED: 0, STEADY: 0, IMPROVING: 0 };
  for (const r of progress.data?.results ?? []) counts[r.state] += 1;

  const reset = async () => {
    const snapshot: AlgorithmParamRow[] = rows.map((r) => ({ ...r }));
    try {
      await actions.resetParams(version);
    } catch (e) {
      toast.show({ message: t(errorKey((e as { code?: string }).code)) });
      return;
    }
    toast.show({
      message: t('toast.defaultsRestored'),
      undo: () => {
        for (const r of snapshot) if (r.value !== r.defaultValue) void actions.setParam({ version, key: r.key, value: r.value });
      },
    });
  };

  return (
    <ScrollView
      testID="algorithm.screen"
      style={{ backgroundColor: c.bgBase }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      automaticallyAdjustKeyboardInsets
    >
      <Card testID="algorithm.preview" padding={spacing[4]} accessibilityLiveRegion="polite" style={styles.preview}>
        <Txt variant="overline" color="textSecondary">{t('algorithm.preview.title')}</Txt>
        <Txt variant="body" style={styles.tabular}>
          {t('algorithm.preview.body', { needsWork: counts.NEEDS_WORK, notTrained: counts.NOT_TRAINED, steady: counts.STEADY, improving: counts.IMPROVING })}
        </Txt>
        <Txt variant="caption" color="textSecondary">{`${t('algorithm.version', { version })} · ${t('algorithm.intro')}`}</Txt>
      </Card>

      {PARAM_GROUPS.map((group) => (
        <View key={group} style={styles.group}>
          <Txt variant="overline" color="textSecondary" accessibilityRole="header">{t(`algorithm.group.${group}`)}</Txt>
          {group === 'weights' ? <Txt variant="caption" color="textSecondary">{t('algorithm.weights.hint')}</Txt> : null}
          {PARAM_UI.filter((p) => p.group === group).map((ui) => {
            const row = byKey.get(ui.key);
            if (!row) return null;
            return (
              <ParamField key={ui.key} row={row} ui={ui} weightShare={group === 'weights' ? (weightSum === 0 ? 0 : row.value / weightSum) : undefined} />
            );
          })}
        </View>
      ))}

      <View style={styles.reset}>
        <Button variant="secondary" fullWidth testID="algorithm.reset" label={t('algorithm.reset')} onPress={() => void reset()} />
        <Txt variant="caption" color="textSecondary">{t('algorithm.reset.hint')}</Txt>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  pad: { margin: spacing[5] },
  content: { padding: spacing[5], gap: spacing[5], paddingBottom: spacing[8] },
  preview: { gap: spacing[1] },
  tabular: { fontVariant: [...fontVariantNumeric] },
  group: { gap: spacing[4] },
  reset: { gap: spacing[2] },
});
