import { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { LoadingState } from '../../components/LoadingState';
import { SearchField } from '../../components/SearchField';
import { SegmentedControl } from '../../components/SegmentedControl';
import { Txt } from '../../components/Txt';
import {
  useLibraryPositions, useSubjects, useTechniqueSearch, type LiveResult,
} from '../../hooks/data';
import { useDebounced } from '../../hooks/useDebounced';
import { errorKey } from '../../i18n/keys';
import { isAndroid } from '../../theme/layout';
import { motion, size, spacing } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';
import { PositionListRow, SubjectListRow, TechniqueListRow } from './rows';

type Segment = 'positions' | 'techniques' | 'subjects';

export function LibraryScreen() {
  const { t } = useTranslation();
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  // Kept per viewer in memory only (design §4.6.1); switching keeps the query.
  const [segment, setSegment] = useState<Segment>('positions');
  const [input, setInput] = useState('');
  const query = useDebounced(input.trim(), motion.durationState.duration);
  const tabBar = (isAndroid ? size.tabbarHeightAndroid : size.tabbarHeightIos) + insets.bottom;

  const header = (
    <View style={styles.header}>
      <Txt variant="titleL" accessibilityRole="header">{t('library.title')}</Txt>
      <SearchField
        label={t(`library.search.label.${segment}`)}
        value={input}
        onChangeText={setInput}
        placeholder={t(`library.search.placeholder.${segment}`)}
        testID="library.search.input"
        clearTestID="library.search.clear"
      />
      <SegmentedControl<Segment>
        accessibilityLabel={t('library.segment.a11y')}
        value={segment}
        onChange={setSegment}
        options={[
          { key: 'positions', label: t('library.segment.positions'), testID: 'library.segment.positions' },
          { key: 'techniques', label: t('library.segment.techniques'), testID: 'library.segment.techniques' },
          { key: 'subjects', label: t('library.segment.subjects'), testID: 'library.segment.subjects' },
        ]}
      />
    </View>
  );
  const common = { header, query, top: insets.top, bottom: tabBar };
  return (
    <View testID="library.screen" style={[styles.fill, { backgroundColor: c.bgBase }]}>
      {segment === 'positions' ? <PositionsList {...common} /> : segment === 'techniques' ? <TechniquesList {...common} /> : <SubjectsList {...common} />}
    </View>
  );
}

type ListProps = { header: React.ReactElement; query: string; top: number; bottom: number };

function useListShell<T>(result: LiveResult<T[]>, { header, query, top, bottom }: ListProps, attribution: boolean) {
  const { t } = useTranslation();
  const empty = result.error ? (
    <EmptyState
      tone="card"
      testID="library.error"
      title={t('library.error')}
      body={t(errorKey(result.error.code))}
      action={<Button variant="secondary" testID="library.error.retry" label={t('common.tryAgain')} onPress={result.reload} />}
    />
  ) : !result.data ? (
    <LoadingState testID="library.loading" />
  ) : query ? (
    <EmptyState testID="library.empty" title={t('library.empty.query.title', { query })} body={t('library.empty.query.body')} />
  ) : (
    <EmptyState testID="library.empty" title={t('library.empty.none.title')} body={t('library.empty.none.body')} />
  );
  return {
    ListHeaderComponent: header,
    ListEmptyComponent: empty,
    ListFooterComponent: attribution ? <Txt variant="caption" color="textSecondary" style={styles.footer}>{t('library.attribution')}</Txt> : undefined,
    contentContainerStyle: { paddingHorizontal: spacing[5], paddingTop: top + spacing[4], paddingBottom: bottom + spacing[5] },
    keyboardShouldPersistTaps: 'handled' as const,
  };
}

function PositionsList(p: ListProps) {
  const r = useLibraryPositions(p.query || undefined);
  return <FlatList data={r.data ?? []} keyExtractor={(x) => x.id} renderItem={({ item }) => <PositionListRow row={item} />} {...useListShell(r, p, true)} />;
}

function TechniquesList(p: ListProps) {
  const r = useTechniqueSearch(p.query);
  return <FlatList data={r.data ?? []} keyExtractor={(x) => x.id} renderItem={({ item }) => <TechniqueListRow row={item} testID={`library.technique.${item.id}`} />} {...useListShell(r, p, true)} />;
}

function SubjectsList(p: ListProps) {
  const r = useSubjects();
  const q = p.query.toLowerCase();
  const filtered: LiveResult<NonNullable<typeof r.data>> = {
    ...r,
    data: r.data?.filter((s) => !q || s.name.toLowerCase().includes(q) || (s.description ?? '').toLowerCase().includes(q)),
  };
  return <FlatList data={filtered.data ?? []} keyExtractor={(x) => x.id} renderItem={({ item }) => <SubjectListRow row={item} />} {...useListShell(filtered, p, false)} />;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  header: { gap: spacing[4], paddingBottom: spacing[4] },
  footer: { paddingVertical: spacing[5] },
});
