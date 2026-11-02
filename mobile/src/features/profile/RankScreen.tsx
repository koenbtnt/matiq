import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BeltSwatch } from '../../components/BeltRank';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { ListRow } from '../../components/ListRow';
import { LoadingState } from '../../components/LoadingState';
import { SegmentedControl } from '../../components/SegmentedControl';
import { Txt } from '../../components/Txt';
import { useRankHistory, useSetting, type RankScale } from '../../hooks/data';
import { errorKey } from '../../i18n/keys';
import { spacing } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';
import { fmt } from '../home/format';
import { rankTitle } from '../rank/format';
import { useWriteSetting } from './useWriteSetting';

/** Profile › Rank (design §4.4.4): scale switch, promotions list, add entry. */
export function RankScreen() {
  const { t } = useTranslation();
  const { c } = useTheme();
  const write = useWriteSetting();
  const scale: RankScale = useSetting('rank.scale').data === 'KIDS' ? 'KIDS' : 'ADULT';
  const history = useRankHistory();
  return (
    <ScrollView testID="profileRank.screen" style={{ backgroundColor: c.bgBase }} contentContainerStyle={styles.content}>
      <View style={styles.block}>
        <Txt variant="caption" color="textSecondary">{t('profileRank.scale.label')}</Txt>
        <SegmentedControl<RankScale>
          accessibilityLabel={t('profileRank.scale.a11y')}
          value={scale}
          onChange={(v) => write('rank.scale', v)}
          options={[
            { key: 'ADULT', label: t('profileRank.scale.ADULT'), testID: 'profileRank.scale.ADULT' },
            { key: 'KIDS', label: t('profileRank.scale.KIDS'), testID: 'profileRank.scale.KIDS' },
          ]}
        />
        <Txt variant="caption" color="textSecondary">{t('profileRank.scale.hint')}</Txt>
      </View>

      <View>
        <Txt variant="overline" color="textSecondary" accessibilityRole="header">{t('profileRank.history.title')}</Txt>
        {history.error ? (
          <EmptyState title={t('progress.error')} body={t(errorKey(history.error.code))} action={<Button variant="secondary" label={t('common.tryAgain')} onPress={history.reload} />} />
        ) : !history.data ? (
          <LoadingState />
        ) : history.data.length === 0 ? (
          <EmptyState testID="profileRank.empty" title={t('profileRank.empty.title')} body={t('profileRank.empty.body')} />
        ) : (
          history.data.map((e) => {
            const title = rankTitle(t, e.belt, e.stripes);
            const since = t('home.rank.since', { date: fmt.localDateLong(e.awardedOn) });
            return (
              <ListRow
                key={e.id}
                testID={`profileRank.entry.${e.id}`}
                title={title}
                subtitle={[since]}
                leading={<BeltSwatch belt={e.belt} />}
                chevron
                accessibilityLabel={t('profileRank.entry.a11y', { title, date: fmt.localDateLong(e.awardedOn) })}
                onPress={() => router.push({ pathname: '/set-rank', params: { entryId: e.id } })}
              />
            );
          })
        )}
      </View>

      <Button variant="secondary" fullWidth testID="profileRank.add" label={t('profileRank.add')} onPress={() => router.push('/set-rank')} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing[5], gap: spacing[4], paddingBottom: spacing[8] },
  block: { gap: spacing[2] },
});
