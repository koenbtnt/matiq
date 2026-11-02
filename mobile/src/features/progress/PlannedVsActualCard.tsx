import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Touch } from '../../components/Touch';
import { Txt } from '../../components/Txt';
import type { GapRow, PlannedVsActualData } from '../../hooks/data';
import { hit } from '../../theme/layout';
import { fontVariantNumeric, radius, size, spacing } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';

/** "2 not trained · 1 pending · +2 unplanned" parts (design §4.2.4). */
export function gapParts(t: TFunction, r: GapRow): string[] {
  const parts: string[] = [];
  if (r.notTrained >= 1) parts.push(t('progress.gap.notTrained', { count: r.notTrained }));
  if (r.pending >= 1) parts.push(t('progress.gap.pending', { count: r.pending }));
  if (r.unplannedTrained >= 1) parts.push(t('progress.gap.unplanned', { count: r.unplannedTrained }));
  return parts;
}

function Row({ row, first }: { row: GapRow; first: boolean }) {
  const { t } = useTranslation();
  const { c } = useTheme();
  const parts = gapParts(t, row);
  const name = row.removed ? t('common.removed', { name: row.name }) : row.name;
  return (
    <Touch
      testID={`progress.gap.${row.ref.kind}.${row.ref.refId}`}
      accessibilityRole="button"
      accessibilityLabel={t('progress.gap.row.a11y', {
        name, trained: row.trained, planned: row.planned, details: parts.length ? `${parts.join(', ')}.` : '',
      }).replace(/\s+/g, ' ')}
      onPress={() => router.push({ pathname: '/progress-why', params: { kind: row.ref.kind, refId: row.ref.refId } })}
      style={[styles.row, first ? null : { borderTopColor: c.borderDefault, borderTopWidth: size.borderWidth }]}
    >
      <View style={styles.line}>
        <Txt variant="rowTitle" numberOfLines={2} style={styles.name}>{name}</Txt>
        {row.planned >= 1 ? (
          <Txt variant="rowValue" color="textSecondary" style={styles.tabular}>{t('progress.gap.row', { trained: row.trained, planned: row.planned })}</Txt>
        ) : null}
      </View>
      {row.planned >= 1 ? (
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.track, { backgroundColor: c.borderDefault }]}>
          <View style={{ width: `${Math.min(100, (row.trained / row.planned) * 100)}%`, height: spacing[1], borderRadius: radius.xs, backgroundColor: c.textPrimary }} />
        </View>
      ) : null}
      {parts.length ? <Txt variant="caption" color="textSecondary">{parts.join(' · ')}</Txt> : null}
    </Touch>
  );
}

/** Planned-vs-trained panel (design §4.2.4): summary line plus one row per focus; tap opens the why sheet. */
export function PlannedVsActualCard({ data }: { data: PlannedVsActualData }) {
  const { t } = useTranslation();
  const { totals, rows } = data;
  return (
    <Card testID="progress.gap.card" padding={spacing[4]}>
      <View style={styles.header}>
        <Txt variant="overline" color="textSecondary">{t('progress.gap.title')}</Txt>
        {rows.length > 0 ? (
          <>
            <Txt testID="progress.gap.summary" variant="headline" style={styles.tabular}>
              {t('progress.gap.summary', { trained: totals.trained, planned: totals.planned })}
            </Txt>
            {totals.unplannedTrained >= 1 ? (
              <Txt variant="caption" color="textSecondary">{t('progress.gap.summaryUnplanned', { count: totals.unplannedTrained })}</Txt>
            ) : null}
          </>
        ) : null}
      </View>
      {rows.length === 0 ? (
        <View style={styles.empty}>
          <Txt testID="progress.gap.empty" variant="caption" color="textSecondary">{t('progress.gap.empty')}</Txt>
          <Button
            variant="secondary"
            testID="progress.gap.empty.action"
            label={t('progress.gap.empty.action')}
            onPress={() => router.push({ pathname: '/log-session', params: { mode: 'plan' } })}
          />
        </View>
      ) : (
        <View>
          {rows.map((r, i) => <Row key={`${r.ref.kind}:${r.ref.refId}`} row={r} first={i === 0} />)}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing[1] },
  tabular: { fontVariant: [...fontVariantNumeric] },
  empty: { gap: spacing[3], alignItems: 'flex-start' },
  row: { minHeight: hit, paddingVertical: spacing[2], gap: spacing[1] },
  line: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  name: { flex: 1 },
  track: { height: spacing[1], borderRadius: radius.xs, overflow: 'hidden' },
});
