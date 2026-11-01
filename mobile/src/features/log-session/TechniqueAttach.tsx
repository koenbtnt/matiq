import { StyleSheet, View } from 'react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '../../components/Button';
import { ListRow } from '../../components/ListRow';
import { SearchField } from '../../components/SearchField';
import { Txt } from '../../components/Txt';
import { useTechniqueSearch, type TechniqueRow, type TechniqueType } from '../../hooks/data';
import { spacing } from '../../theme/tokens';
import { techniqueMeta } from '../library/techniqueMeta';

type Props = {
  /** Techniques touching this position sort first. */
  focusRefId?: string;
  type?: TechniqueType;
  onPick: (t: TechniqueRow) => void;
  onClose: () => void;
};

/** Inline search panel (D-A21: never a second sheet). Up to 6 results. */
export function TechniqueAttach({ focusRefId, type, onPick, onClose }: Props) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const { data } = useTechniqueSearch(query, { type });
  const touches = (r: TechniqueRow) => (r.fromPositionId === focusRefId || r.toPositionId === focusRefId ? 0 : 1);
  const rows = [...(data ?? [])].sort((a, b) => touches(a) - touches(b)).slice(0, 6);
  return (
    <View style={styles.wrap}>
      <SearchField
        label={t('log.techniqueSearch.label')}
        value={query}
        onChangeText={setQuery}
        placeholder={t('log.techniqueSearch.placeholder')}
        testID="log.techniqueSearch.input"
        clearTestID="log.techniqueSearch.clear"
        autoFocus
      />
      {rows.map((r) => (
        <ListRow
          key={r.id}
          testID={`log.techniqueSearch.result.${r.id}`}
          title={r.name}
          subtitle={[techniqueMeta(t, r)]}
          accessibilityLabel={t('log.techniqueSearch.result.a11y', { name: r.name })}
          onPress={() => onPick(r)}
        />
      ))}
      {query.trim() && rows.length === 0 ? <Txt variant="caption" color="textSecondary">{t('log.techniqueSearch.empty', { query })}</Txt> : null}
      <Button variant="ghost" label={t('log.techniqueSearch.close')} onPress={onClose} testID="log.techniqueSearch.done" />
    </View>
  );
}

const styles = StyleSheet.create({ wrap: { gap: spacing[2] } });
