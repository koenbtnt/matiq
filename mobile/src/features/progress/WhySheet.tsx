import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { Icon } from '../../components/Icon';
import { ListRow } from '../../components/ListRow';
import { LoadingState } from '../../components/LoadingState';
import { SheetChrome } from '../../components/SheetChrome';
import { Badge } from '../../components/Tag';
import { Txt } from '../../components/Txt';
import { useProgress, type ProgressResult, type SignalRow } from '../../hooks/data';
import { errorKey } from '../../i18n/keys';
import { fontVariantNumeric, size, spacing } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';
import { SIGNAL_ORDER, STATE_ICON, pfmt, ruleSentence, signalDetails, signalValue } from './format';

const SCORED = ['needsWorkRate', 'hitRatio', 'gap', 'trend'] as const;

function SignalLine({ row }: { row: SignalRow }) {
  const { t } = useTranslation();
  const { c } = useTheme();
  const label = t(`progress.signal.${row.signal}.label`);
  const value = signalValue(t, row);
  const details = signalDetails(t, row);
  const spoken = [...details, ...(row.contributed ? [t('progress.signal.contributed')] : [])].join(', ');
  return (
    <View
      testID={`why.signal.${row.signal}`}
      accessible
      accessibilityLabel={t('progress.signal.a11y', { label, value, details: spoken })}
      style={[styles.signal, { borderBottomColor: c.borderDefault }]}
    >
      <View style={styles.line}>
        <Txt variant="rowTitle" style={styles.flex}>{label}</Txt>
        <Txt testID={`why.signal.${row.signal}.value`} variant="rowValue" color={row.available ? 'textPrimary' : 'textSecondary'} style={styles.tabular}>{value}</Txt>
      </View>
      {details.length > 0 || row.contributed ? (
        <View style={styles.meta}>
          {details.length > 0 ? <Txt variant="caption" color="textSecondary">{details.join(' · ')}</Txt> : null}
          {row.contributed ? (
            <View style={styles.contributed}>
              <Icon name="check" size={size.iconCheck} color="textSecondary" emphasis />
              <Txt variant="caption" color="textSecondary">{t('progress.signal.contributed')}</Txt>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function Body({ result, params, windowStart, today }: { result: ProgressResult; params: Record<string, number>; windowStart: string; today: string }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const scoredAvailable = result.signals.filter((s) => (SCORED as readonly string[]).includes(s.signal) && s.available).length;
  const ordered = SIGNAL_ORDER.map((id) => result.signals.find((s) => s.signal === id)).filter((s): s is SignalRow => !!s);
  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing[5] }]}>
      <View style={styles.block}>
        <View style={styles.state}>
          <Icon name={STATE_ICON[result.state]} size={size.icon} color="textSecondary" />
          <Txt testID="why.state" variant="titleM">{t(`progress.state.${result.state}`)}</Txt>
          {result.flagged ? <Badge variant="flagged" label={t('common.badge.flagged')} /> : null}
        </View>
        <Txt testID="why.rule" variant="body">{ruleSentence(t, result, params)}</Txt>
        {result.flagged ? <Txt variant="caption" color="textSecondary">{t('progress.why.flagged')}</Txt> : null}
      </View>

      {result.score !== undefined ? (
        <View style={styles.block}>
          <Txt testID="why.score" variant="headline" style={styles.tabular}>
            {t('progress.score', { score: pfmt.decimal(result.score), threshold: pfmt.decimal(params.needsWorkThreshold ?? 0) })}
          </Txt>
          {scoredAvailable < 4 ? <Txt variant="caption" color="textSecondary">{t('progress.rescaled', { count: scoredAvailable })}</Txt> : null}
        </View>
      ) : (
        <Txt variant="caption" color="textSecondary">{t('progress.score.notEvaluated')}</Txt>
      )}

      <View>
        <Txt variant="overline" color="textSecondary" accessibilityRole="header">{t('progress.why.signals')}</Txt>
        {ordered.map((s) => <SignalLine key={s.signal} row={s} />)}
      </View>

      <Txt testID="why.window" variant="caption" color="textSecondary">
        {t('progress.why.window', { start: pfmt.dayMonthShort(windowStart), end: pfmt.dayMonthShort(today) })}
      </Txt>

      <ListRow
        testID="why.settings"
        title={t('progress.why.settings')}
        accessibilityRole="link"
        chevron
        onPress={() => {
          router.dismiss();
          router.navigate('/profile/algorithm');
        }}
      />
    </ScrollView>
  );
}

/** "Why" sheet (design §4.3): state, rule sentence, score and one row per signal. Read-only. */
export function WhySheet() {
  const { t } = useTranslation();
  const { c } = useTheme();
  const { kind, refId } = useLocalSearchParams<{ kind: string; refId: string }>();
  const progress = useProgress();
  const result = progress.data?.results.find((r) => r.ref.kind === kind && r.ref.refId === refId);
  return (
    <View testID="why.sheet" style={[styles.fill, { backgroundColor: c.bgSurface }]}>
      <SheetChrome
        title={result ? (result.removed ? t('common.removed', { name: result.name }) : result.name) : t('progress.title')}
        cancelLabel={t('common.close')}
        onCancel={() => router.back()}
        cancelTestID="why.close"
        titleTestID="why.title"
      />
      {progress.error ? (
        <View style={styles.pad}>
          <EmptyState title={t('progress.error')} body={t(errorKey(progress.error.code))} action={<Button variant="secondary" label={t('common.tryAgain')} onPress={progress.reload} />} />
        </View>
      ) : !progress.data ? (
        <LoadingState />
      ) : result ? (
        <Body result={result} params={progress.data.params} windowStart={progress.data.windowStart} today={progress.data.today} />
      ) : (
        <View style={styles.pad}>
          <EmptyState testID="why.notFound" body={t('progress.why.notFound')} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  pad: { paddingHorizontal: spacing[5] },
  content: { paddingHorizontal: spacing[5], paddingTop: spacing[2], gap: spacing[4] },
  block: { gap: spacing[1] },
  state: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing[2] },
  tabular: { fontVariant: [...fontVariantNumeric] },
  signal: { minHeight: size.listRowMinHeight, paddingVertical: spacing[2], gap: spacing[1], borderBottomWidth: size.borderWidth },
  line: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  flex: { flex: 1 },
  meta: { gap: spacing[1] },
  contributed: { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },
});
