import { Keyboard, StyleSheet, View } from 'react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Chip } from '../../components/Chip';
import { Icon } from '../../components/Icon';
import { ListRow } from '../../components/ListRow';
import { SearchField } from '../../components/SearchField';
import { Tag } from '../../components/Tag';
import { Txt } from '../../components/Txt';
import { useFocusSearch, type FocusPickerRow, type HomeData } from '../../hooks/data';
import { chipRowGap } from '../../theme/layout';
import { size, spacing } from '../../theme/tokens';
import { quickAddGroups } from './state';

type Props = {
  home: HomeData | undefined;
  added: Set<string>;
  onAdd: (row: FocusPickerRow) => void;
};

/** "Add a focus": search field, quick-add chips (D-A4) or result rows (up to 8). */
export function FocusSearch({ home, added, onAdd }: Props) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const { data } = useFocusSearch(query);
  const q = query.trim();
  const groups = quickAddGroups(home, added);
  const hasHistory = groups.flagged.length + groups.last.length > 0;

  const add = (row: FocusPickerRow) => {
    onAdd(row);
    setQuery('');
    Keyboard.dismiss();
  };

  const group = (labelKey: 'log.quickAdd.flagged' | 'log.quickAdd.last', rows: FocusPickerRow[]) =>
    rows.length === 0 ? null : (
      <View key={labelKey} style={styles.group}>
        <Txt variant="caption" color="textSecondary">{t(labelKey)}</Txt>
        <View style={styles.wrapRow}>
          {rows.map((r) => (
            <Chip key={r.refId} variant="selectable" testID={`log.quickAdd.${r.refId}`} label={r.name} accessibilityRole="button" accessibilityLabel={t('log.quickAdd.a11y', { name: r.name })} onPress={() => add(r)} />
          ))}
        </View>
      </View>
    );

  return (
    <View style={styles.wrap}>
      <SearchField
        label={t('log.search.label')}
        accessibilityLabel={t('log.search.a11y')}
        value={query}
        onChangeText={setQuery}
        placeholder={t('log.search.placeholder')}
        testID="log.search.input"
        clearTestID="log.search.clear"
      />
      {q === '' ? (
        hasHistory ? (
          <View style={styles.wrap}>
            {group('log.quickAdd.flagged', groups.flagged)}
            {group('log.quickAdd.last', groups.last)}
          </View>
        ) : (
          <Txt variant="caption" color="textSecondary">{t('log.search.hint')}</Txt>
        )
      ) : (data ?? []).length === 0 ? (
        <Txt testID="log.search.empty" variant="caption" color="textSecondary">{t('log.search.empty', { query: q })}</Txt>
      ) : (
        <View>
          {(data ?? []).slice(0, 8).map((r) => {
            const isAdded = added.has(r.refId);
            return (
              <ListRow
                key={`${r.kind}-${r.refId}`}
                testID={`log.search.result.${r.refId}`}
                title={r.name}
                subtitle={[r.matchedAlias ? t('log.search.result.alias', { alias: r.matchedAlias }) : t(`log.search.result.kind.${r.kind}`)]}
                accessibilityLabel={t('log.search.result.a11y', { name: r.name })}
                disabled={isAdded}
                onPress={() => add(r)}
                trailing={
                  isAdded ? (
                    <View style={styles.added}>
                      <Icon name="check" size={size.iconCheck} color="textSecondary" />
                      <Txt variant="caption" color="textSecondary">{t('log.search.result.added')}</Txt>
                    </View>
                  ) : r.tier === 'EXTENDED' ? <Tag label={t('library.tier.EXTENDED')} /> : undefined
                }
              />
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing[2] },
  group: { gap: spacing[1] },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', columnGap: spacing[2], rowGap: chipRowGap },
  added: { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },
});
