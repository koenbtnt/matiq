import { router, Stack } from 'expo-router';
import { Linking, SectionList, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Chip } from '../../components/Chip';
import { EmptyState } from '../../components/EmptyState';
import { IconButton } from '../../components/IconButton';
import { ListRow } from '../../components/ListRow';
import { LoadingState } from '../../components/LoadingState';
import { SectionHeader } from '../../components/SectionHeader';
import { Badge, Tag } from '../../components/Tag';
import { Txt } from '../../components/Txt';
import { useDataActions, useTechnique, type ResourceRow, type TechniqueDetail } from '../../hooks/data';
import { errorKey } from '../../i18n/keys';
import { spacing } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';
import { fmt } from '../home/format';
import { HeaderEditButton } from './HeaderEditButton';

type Item =
  | { kind: 'resource'; key: string; row: ResourceRow }
  | { kind: 'history'; key: string; row: TechniqueDetail['history'][number] }
  | { kind: 'empty'; key: string; testID: string; text: 'technique.resources.empty' | 'technique.history.empty' };
type Section = { key: 'resources' | 'history'; data: Item[] };

function ResourceListRow({ row, techniqueId }: { row: ResourceRow; techniqueId: string }) {
  const { t } = useTranslation();
  const actions = useDataActions();
  const id = `technique.resource.${row.id}`;
  const meta = row.author ? t('technique.resource.meta', { type: row.resourceTypeName, author: row.author }) : row.resourceTypeName;
  const watched = row.status === 'WATCHED';
  return (
    <ListRow
      testID={id}
      title={row.title}
      subtitle={[meta]}
      wrap
      accessibilityLabel={t('technique.resource.a11y', { title: row.title, meta, status: t(`technique.resource.status.${row.status}`) })}
      onPress={() => router.push({ pathname: '/resource-edit', params: { id: row.id, techniqueId } })}
      trailing={
        <View style={styles.trailing}>
          <Chip
            testID={`${id}.watched`}
            variant="selectable"
            selected={watched}
            label={t('technique.resource.watched')}
            accessibilityRole="checkbox"
            accessibilityLabel={t('technique.resource.watched.a11y', { title: row.title })}
            onPress={() => void actions.setResourceStatus(row.id, watched ? 'TO_WATCH' : 'WATCHED')}
          />
          {row.url ? (
            <IconButton
              testID={`${id}.open`}
              icon="openLink"
              accessibilityLabel={t('technique.resource.open.a11y', { title: row.title })}
              onPress={() => void Linking.openURL(row.url!)}
            />
          ) : null}
        </View>
      }
    />
  );
}

/** Technique detail (design §4.6): the graph edge, aliases, notes, Resources and History. */
export function TechniqueDetailScreen({ id }: { id: string }) {
  const { t } = useTranslation();
  const { c } = useTheme();
  const { data, error } = useTechnique(id);

  if (error) {
    return (
      <View testID="technique.notFound" style={[styles.fill, { backgroundColor: c.bgBase }]}>
        <EmptyState style={styles.pad} title={t('technique.notFound.title')} body={t(errorKey(error.code))} />
      </View>
    );
  }
  if (!data) return <View style={[styles.fill, { backgroundColor: c.bgBase }]}><LoadingState testID="technique.loading" fill /></View>;

  const sections: Section[] = [
    {
      key: 'resources',
      data: data.resources.length
        ? data.resources.map((row): Item => ({ kind: 'resource', key: row.id, row }))
        : [{ kind: 'empty', key: 'r-empty', testID: 'technique.resources.empty', text: 'technique.resources.empty' }],
    },
    {
      key: 'history',
      data: data.history.length
        ? data.history.map((row): Item => ({ kind: 'history', key: `${row.sessionId}-${row.via}`, row }))
        : [{ kind: 'empty', key: 'h-empty', testID: 'technique.history.empty', text: 'technique.history.empty' }],
    },
  ];

  const endpoint = (which: 'from' | 'to', positionId: string, name: string, removed: boolean) => (
    <ListRow
      testID={`technique.${which}`}
      title={removed ? t('common.removed', { name }) : t(`technique.${which}`, { name })}
      chevron={!removed}
      accessibilityRole="link"
      accessibilityLabel={removed ? t('common.removed', { name }) : t(`technique.${which}.a11y`, { name })}
      onPress={removed ? undefined : () => router.push({ pathname: '/library/position/[id]', params: { id: positionId } })}
    />
  );

  const header = (
    <View style={styles.headerBlock}>
      <Txt variant="titleL" accessibilityRole="header">{data.name}</Txt>
      {data.aliases.length ? <Txt variant="caption" color="textSecondary">{t('technique.aliases', { aliases: data.aliases.join(', ') })}</Txt> : null}
      <View style={styles.meta}>
        <Tag label={t(`library.technique.type.${data.type}`)} />
        {data.appliesTo === 'GI' ? <Badge variant="gi" label={t('library.badge.GI')} /> : null}
        {data.appliesTo === 'NOGI' ? <Tag label={t('library.badge.NOGI')} /> : null}
        {data.perspective ? <Tag label={t(`library.technique.perspective.${data.perspective}`)} /> : null}
        {data.tier === 'EXTENDED' ? <Tag label={t('library.tier.EXTENDED')} /> : null}
      </View>
      <View>
        {endpoint('from', data.fromPositionId, data.fromName, data.fromRemoved)}
        {data.type !== 'SUBMISSION' && data.toPositionId ? endpoint('to', data.toPositionId, data.toName ?? '', data.toRemoved === true) : null}
      </View>
      {data.description ? (
        <View style={styles.block}>
          <Txt variant="overline" color="textSecondary">{t('technique.description.title')}</Txt>
          <Txt variant="body">{data.description}</Txt>
        </View>
      ) : null}
      <View style={styles.block}>
        <Txt variant="overline" color="textSecondary">{t('technique.notes.title')}</Txt>
        {data.notes ? <Txt variant="body">{data.notes}</Txt> : <Txt variant="caption" color="textSecondary">{t('technique.notes.empty')}</Txt>}
      </View>
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <HeaderEditButton
              testID="technique.edit"
              accessibilityLabel={t('technique.edit.a11y', { name: data.name })}
              onPress={() => router.push({ pathname: '/library-edit', params: { kind: 'TECHNIQUE', id } })}
            />
          ),
        }}
      />
      <SectionList<Item, Section>
        testID="technique.screen"
        style={{ backgroundColor: c.bgBase }}
        contentContainerStyle={styles.content}
        sections={sections}
        keyExtractor={(i) => i.key}
        ListHeaderComponent={header}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) =>
          section.key === 'resources' ? (
            <SectionHeader
              title={t('technique.resources.title')}
              action={{
                label: t('technique.resources.add'),
                accessibilityLabel: t('technique.resources.add.a11y'),
                testID: 'technique.resources.add',
                onPress: () => router.push({ pathname: '/resource-edit', params: { techniqueId: id } }),
              }}
            />
          ) : (
            <SectionHeader title={t('technique.history.title')} />
          )
        }
        renderItem={({ item }) => {
          if (item.kind === 'resource') return <ResourceListRow row={item.row} techniqueId={id} />;
          if (item.kind === 'empty') return <Txt testID={item.testID} variant="caption" color="textSecondary">{t(item.text)}</Txt>;
          const via = t(`technique.history.via.${item.row.via}`);
          const date = fmt.localDateLong(item.row.localDate);
          return (
            <ListRow
              testID={`technique.history.${item.row.sessionId}`}
              title={item.row.sessionTypeName}
              subtitle={[`${date} · ${via}`]}
              chevron
              accessibilityLabel={t('technique.history.a11y', { type: item.row.sessionTypeName, date, via })}
              onPress={() => router.push({ pathname: '/session/[id]', params: { id: item.row.sessionId } })}
            />
          );
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  pad: { paddingHorizontal: spacing[5] },
  content: { padding: spacing[5], paddingBottom: spacing[8] },
  headerBlock: { gap: spacing[3], marginBottom: spacing[3] },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  block: { gap: spacing[1] },
  trailing: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
});
