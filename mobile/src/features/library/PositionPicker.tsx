import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Chip } from '../../components/Chip';
import { ListRow } from '../../components/ListRow';
import { SearchField } from '../../components/SearchField';
import { Tag } from '../../components/Tag';
import { Txt } from '../../components/Txt';
import { useLibraryPositions } from '../../hooks/data';
import { useDebounced } from '../../hooks/useDebounced';
import { motion, spacing } from '../../theme/tokens';

export type PickedPosition = { id: string; name: string };
export type PickerField = 'from' | 'to' | 'parent';

type Props = {
  field: PickerField;
  label: string;
  value?: PickedPosition;
  onChange: (p: PickedPosition | undefined) => void;
  /** The row being edited (a position can't be its own variant parent). */
  excludeId?: string;
};

const MAX_RESULTS = 6;

/** Inline position search (P-21): a selected position shows as a chip; tapping it clears the choice. */
export function PositionPicker({ field, label, value, onChange, excludeId }: Props) {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const query = useDebounced(input.trim(), motion.durationState.duration);
  const results = useLibraryPositions(query || undefined);
  const id = `libraryEdit.${field}`;

  if (value) {
    return (
      <View style={styles.wrap}>
        <Txt variant="caption" color="textSecondary">{label}</Txt>
        <Chip
          testID={`${id}.selected`}
          variant="selectable"
          selected
          label={value.name}
          accessibilityRole="button"
          accessibilityLabel={t('libraryEdit.position.selected.a11y', { name: value.name })}
          onPress={() => onChange(undefined)}
        />
      </View>
    );
  }
  const rows = (results.data ?? []).filter((p) => p.id !== excludeId).slice(0, MAX_RESULTS);
  return (
    <View style={styles.wrap}>
      <SearchField
        label={label}
        value={input}
        onChangeText={setInput}
        placeholder={t('libraryEdit.position.placeholder')}
        testID={`${id}.input`}
        clearTestID={`${id}.clear`}
      />
      {rows.map((p) => (
        <ListRow
          key={p.id}
          testID={`${id}.result.${p.id}`}
          title={p.canonicalName}
          subtitle={[p.matchedAlias ? t('library.row.alias', { alias: p.matchedAlias }) : undefined]}
          trailing={p.tier === 'EXTENDED' ? <Tag label={t('library.tier.EXTENDED')} /> : undefined}
          onPress={() => onChange({ id: p.id, name: p.canonicalName })}
        />
      ))}
      {results.data && rows.length === 0 ? <Txt variant="caption" color="textSecondary">{t('library.empty.query.title', { query })}</Txt> : null}
    </View>
  );
}

const styles = StyleSheet.create({ wrap: { gap: spacing[1] } });
