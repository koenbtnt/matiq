import { SectionList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { LoadingState } from '../../components/LoadingState';
import { SectionHeader } from '../../components/SectionHeader';
import { Txt } from '../../components/Txt';
import { useProgress, type ProgressResult } from '../../hooks/data';
import { errorKey } from '../../i18n/keys';
import { isAndroid } from '../../theme/layout';
import { size, spacing } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';
import { openQuickLog } from '../home/openQuickLog';
import { ConsistencyCard } from './ConsistencyCard';
import { PlannedVsActualCard } from './PlannedVsActualCard';
import { ProgressRow } from './ProgressRow';
import { RankHistoryPanel } from './RankHistoryPanel';
import { STATE_ICON, STATE_ORDER, pfmt } from './format';

type Section = { key: string; state?: ProgressResult['state']; data: ProgressResult[] };

/** Sections in PS-04 order (NEEDS_WORK, NOT_TRAINED, STEADY, IMPROVING), then Removed; empty sections are omitted. */
export function groupResults(results: ProgressResult[]): Section[] {
  const live = results.filter((r) => !r.removed);
  const sections: Section[] = STATE_ORDER.map((state) => ({ key: state, state, data: live.filter((r) => r.state === state) }));
  sections.push({ key: 'REMOVED', data: results.filter((r) => r.removed) });
  return sections.filter((s) => s.data.length > 0);
}

export function ProgressScreen() {
  const { t } = useTranslation();
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const progress = useProgress();
  const data = progress.data;
  // Read once at render: React Compiler hoists `data.params` out of the renderItem closure, so it must be null-safe here.
  const params = data?.params;
  const tabBar = (isAndroid ? size.tabbarHeightAndroid : size.tabbarHeightIos) + insets.bottom;

  const header = (
    <View style={styles.header}>
      <Txt variant="titleL" accessibilityRole="header">{t('progress.title')}</Txt>
      {data ? (
        <Txt variant="caption" color="textSecondary">
          {t('progress.window', {
            count: data.params.windowWeeks,
            start: pfmt.dayMonthShort(data.windowStart),
            end: pfmt.dayMonthShort(data.today),
          })}
        </Txt>
      ) : null}
    </View>
  );

  const empty = progress.error ? (
    <EmptyState
      tone="card"
      testID="progress.error"
      title={t('progress.error')}
      body={t(errorKey(progress.error.code))}
      action={<Button variant="secondary" testID="progress.error.retry" label={t('common.tryAgain')} onPress={progress.reload} />}
    />
  ) : !data ? (
    <LoadingState testID="progress.loading" />
  ) : (
    <EmptyState
      tone="card"
      testID="progress.empty"
      title={t('progress.empty.title')}
      body={t('progress.empty.body')}
      action={<Button variant="secondary" testID="progress.empty.action" label={t('progress.empty.action')} onPress={() => void openQuickLog()} />}
    />
  );

  const footer = data ? (
    <View style={styles.panels}>
      <ConsistencyCard data={data.consistency} />
      <PlannedVsActualCard data={data.plannedVsActual} />
      <RankHistoryPanel />
    </View>
  ) : undefined;

  return (
    <SectionList<ProgressResult, Section>
      testID="progress.screen"
      style={{ backgroundColor: c.bgBase }}
      contentContainerStyle={{ paddingHorizontal: spacing[5], paddingTop: insets.top + spacing[4], paddingBottom: tabBar + spacing[5] }}
      sections={data ? groupResults(data.results) : []}
      keyExtractor={(r) => `${r.ref.kind}:${r.ref.refId}`}
      stickySectionHeadersEnabled
      initialNumToRender={24}
      ListHeaderComponent={header}
      ListEmptyComponent={empty}
      ListFooterComponent={footer}
      SectionSeparatorComponent={() => <View style={styles.separator} />}
      renderSectionHeader={({ section }) => (
        <View testID={`progress.section.${section.key}`}>
          <SectionHeader
            background="bgBase"
            icon={section.state ? STATE_ICON[section.state] : undefined}
            title={section.state
              ? t('progress.section.header', { state: t(`progress.state.${section.state}`), count: section.data.length })
              : t('progress.section.removed')}
          />
        </View>
      )}
      renderItem={({ item }) => (params ? <ProgressRow result={item} params={params} /> : null)}
    />
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing[1], paddingBottom: spacing[4] },
  separator: { height: spacing[3] },
  panels: { gap: spacing[4], paddingTop: spacing[5] },
});
