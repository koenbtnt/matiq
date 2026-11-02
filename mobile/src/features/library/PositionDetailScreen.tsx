import { router, Stack } from 'expo-router';
import { SectionList, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '../../components/EmptyState';
import { ListRow } from '../../components/ListRow';
import { LoadingState } from '../../components/LoadingState';
import { SectionHeader } from '../../components/SectionHeader';
import { Tag } from '../../components/Tag';
import { Txt } from '../../components/Txt';
import { usePosition, useSetting, type TechniqueRow, type TechniqueType } from '../../hooks/data';
import { errorKey } from '../../i18n/keys';
import { spacing } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';
import { HeaderEditButton } from './HeaderEditButton';
import { TechniqueListRow } from './rows';

const GROUPS: TechniqueType[] = ['TRANSITION', 'GUARD_PASS', 'SWEEP', 'ESCAPE', 'TAKEDOWN', 'SUBMISSION'];

type Item = { kind: 'group'; key: string; type: TechniqueType; count: number } | { kind: 'tech'; key: string; row: TechniqueRow };
type Section = { key: string; title: string; data: Item[] };

function items(prefix: string, rows: TechniqueRow[]): Item[] {
  return GROUPS.flatMap((type) => {
    const of = rows.filter((r) => r.type === type);
    if (of.length === 0) return [];
    return [
      { kind: 'group', key: `${prefix}-g-${type}`, type, count: of.length } as Item,
      ...of.map((row): Item => ({ kind: 'tech', key: `${prefix}-${row.id}`, row })),
    ];
  });
}

export function PositionDetailScreen({ id }: { id: string }) {
  const { t } = useTranslation();
  const { c } = useTheme();
  const { data, error } = usePosition(id);
  const extended = useSetting('library.showExtended').data ?? false;

  if (error) {
    return (
      <View testID="position.screen" style={[styles.fill, { backgroundColor: c.bgBase }]}>
        <EmptyState style={styles.pad} title={t('position.notFound.title')} body={t(errorKey(error.code))} />
      </View>
    );
  }
  if (!data) return <View style={[styles.fill, { backgroundColor: c.bgBase }]}><LoadingState fill /></View>;

  const sections: Section[] = [];
  const from = items('from', data.techniquesFrom);
  const into = items('into', data.techniquesTo);
  if (from.length) sections.push({ key: 'from', title: t('position.from.title'), data: from });
  if (into.length) sections.push({ key: 'into', title: t('position.into.title'), data: into });

  const header = (
    <View style={styles.headerBlock}>
      <Txt variant="titleL" accessibilityRole="header">{data.canonicalName}</Txt>
      {data.aliases.length ? <Txt variant="caption" color="textSecondary">{t('position.aliases', { aliases: data.aliases.join(', ') })}</Txt> : null}
      {extended && data.tier === 'EXTENDED' ? <Tag label={t('library.tier.EXTENDED')} /> : null}
      {data.description ? <Txt variant="body">{data.description}</Txt> : null}
      {data.notes ? (
        <View style={styles.notes}>
          <Txt variant="overline" color="textSecondary">{t('position.notes')}</Txt>
          <Txt variant="body">{data.notes}</Txt>
        </View>
      ) : null}
      {data.parent ? (
        <ListRow
          testID="position.variantOf"
          title={t('position.variantOf', { name: data.parent.canonicalName })}
          chevron
          onPress={() => router.push({ pathname: '/library/position/[id]', params: { id: data.parent!.id } })}
        />
      ) : null}
      {data.children.length ? (
        <View>
          <SectionHeader title={t('position.variants.title')} />
          {data.children.map((ch) => (
            <ListRow
              key={ch.id}
              testID={`position.variant.${ch.id}`}
              title={ch.canonicalName}
              trailing={extended && ch.tier === 'EXTENDED' ? <Tag label={t('library.tier.EXTENDED')} /> : undefined}
              chevron
              onPress={() => router.push({ pathname: '/library/position/[id]', params: { id: ch.id } })}
            />
          ))}
        </View>
      ) : null}
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <HeaderEditButton
              testID="position.edit"
              accessibilityLabel={t('position.edit.a11y', { name: data.canonicalName })}
              onPress={() => router.push({ pathname: '/library-edit', params: { kind: 'POSITION', id } })}
            />
          ),
        }}
      />
    <SectionList<Item, Section>
      testID="position.screen"
      style={{ backgroundColor: c.bgBase }}
      contentContainerStyle={styles.content}
      sections={sections}
      keyExtractor={(i) => i.key}
      ListHeaderComponent={header}
      ListEmptyComponent={<Txt variant="caption" color="textSecondary">{t('position.empty')}</Txt>}
      stickySectionHeadersEnabled={false}
      renderSectionHeader={({ section }) => <SectionHeader title={section.title} />}
      renderItem={({ item }) =>
        item.kind === 'group' ? (
          <Txt variant="overline" color="textSecondary" style={styles.group}>
            {t('position.group', { type: t(`library.technique.typePlural.${item.type}`), count: item.count })}
          </Txt>
        ) : (
          <TechniqueListRow row={item.row} testID={`position.technique.${item.row.id}`} />
        )
      }
    />
    </>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  pad: { paddingHorizontal: spacing[5] },
  content: { padding: spacing[5], paddingBottom: spacing[8] },
  headerBlock: { gap: spacing[3], marginBottom: spacing[3] },
  group: { marginTop: spacing[2] },
  notes: { gap: spacing[1] },
});
