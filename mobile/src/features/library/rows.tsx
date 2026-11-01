import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon } from '../../components/Icon';
import { ListRow } from '../../components/ListRow';
import { Badge, Tag } from '../../components/Tag';
import { Touch } from '../../components/Touch';
import { Txt } from '../../components/Txt';
import type { PositionRow as PositionRowData, SubjectRow as SubjectRowData, TechniqueRow as TechniqueRowData } from '../../hooks/data';
import { hit } from '../../theme/layout';
import { size, spacing } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';
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

/** Opens the technique detail (design §4.5.1): chevron, `role="button"`. */
export function TechniqueListRow({ row, testID }: { row: TechniqueRowData; testID: string }) {
  const { t } = useTranslation();
  const { c } = useTheme();
  const meta = techniqueMeta(t, row);
  const alias = row.matchedAlias ? t('library.row.alias', { alias: row.matchedAlias }) : undefined;
  return (
    <Touch
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={t('library.row.technique.a11y', { name: row.name, meta })}
      onPress={() => router.push({ pathname: '/library/technique/[id]', params: { id: row.id } })}
      style={[styles.tech, { borderBottomColor: c.borderDefault }]}
    >
      <View style={styles.flex}>
        <View style={styles.titleRow}>
          <Txt variant="rowTitle" style={styles.flex}>{row.name}</Txt>
          {row.tier === 'EXTENDED' ? <Tag label={t('library.tier.EXTENDED')} /> : null}
          {row.appliesTo === 'GI' ? <Badge variant="gi" label={t('library.badge.GI')} /> : null}
          {row.appliesTo === 'NOGI' ? <Tag label={t('library.badge.NOGI')} /> : null}
        </View>
        <Txt variant="caption" color="textSecondary">{meta}</Txt>
        {alias ? <Txt variant="caption" color="textSecondary">{alias}</Txt> : null}
      </View>
      <Icon name="chevron" size={size.iconChevron} color="textSecondary" emphasis />
    </Touch>
  );
}

/** Opens the edit sheet (design §4.5.1, P-16). */
export function SubjectListRow({ row }: { row: SubjectRowData }) {
  const { t } = useTranslation();
  return (
    <ListRow
      testID={`library.subject.${row.id}`}
      title={row.name}
      subtitle={[row.description]}
      subtitleLines={2}
      chevron
      accessibilityLabel={t('library.row.subject.a11y', { name: row.name })}
      onPress={() => router.push({ pathname: '/library-edit', params: { kind: 'SUBJECT', id: row.id } })}
    />
  );
}

const styles = StyleSheet.create({
  tech: { minHeight: hit, paddingVertical: spacing[3], flexDirection: 'row', alignItems: 'center', gap: spacing[3], borderBottomWidth: size.borderWidth },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  flex: { flex: 1, minWidth: 0 },
});
