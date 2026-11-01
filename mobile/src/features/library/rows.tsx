import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ListRow } from '../../components/ListRow';
import { Badge, Tag } from '../../components/Tag';
import { Txt } from '../../components/Txt';
import type { PositionRow as PositionRowData, SubjectRow as SubjectRowData, TechniqueRow as TechniqueRowData } from '../../hooks/data';
import { spacing } from '../../theme/tokens';
import { techniqueMeta } from './techniqueMeta';

export function PositionListRow({ row, testID }: { row: PositionRowData; testID?: string }) {
  const { t } = useTranslation();
  const sub = row.matchedAlias ? t('library.row.alias', { alias: row.matchedAlias }) : row.aliases.length ? row.aliases.join(' · ') : undefined;
  return (
    <ListRow
      testID={testID ?? `library.position.${row.id}`}
      title={row.canonicalName}
      subtitle={[sub]}
      subtitleLines={2}
      trailing={row.tier === 'EXTENDED' ? <Tag label={t('library.tier.EXTENDED')} /> : undefined}
      chevron
      accessibilityLabel={t('library.row.position.a11y', { name: row.canonicalName, aliases: row.aliases.join(', ') })}
      onPress={() => router.push({ pathname: '/library/position/[id]', params: { id: row.id } })}
    />
  );
}

/** Non-interactive (A-21): no chevron, no press. */
export function TechniqueListRow({ row, testID }: { row: TechniqueRowData; testID: string }) {
  const { t } = useTranslation();
  const meta = techniqueMeta(t, row);
  const alias = row.matchedAlias ? t('library.row.alias', { alias: row.matchedAlias }) : undefined;
  return (
    <View testID={testID} accessible accessibilityLabel={[row.name, meta, alias].filter(Boolean).join('. ')} style={styles.tech}>
      <View style={styles.titleRow}>
        <Txt variant="rowTitle" style={styles.flex}>{row.name}</Txt>
        {row.tier === 'EXTENDED' ? <Tag label={t('library.tier.EXTENDED')} /> : null}
        {row.appliesTo === 'GI' ? <Badge variant="gi" label={t('library.badge.GI')} /> : null}
        {row.appliesTo === 'NOGI' ? <Tag label={t('library.badge.NOGI')} /> : null}
      </View>
      <Txt variant="caption" color="textSecondary">{meta}</Txt>
      {alias ? <Txt variant="caption" color="textSecondary">{alias}</Txt> : null}
    </View>
  );
}

export function SubjectListRow({ row }: { row: SubjectRowData }) {
  return <ListRow testID={`library.subject.${row.id}`} title={row.name} subtitle={[row.description]} subtitleLines={2} />;
}

const styles = StyleSheet.create({
  tech: { paddingVertical: spacing[3], gap: spacing[1] },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  flex: { flex: 1 },
});
