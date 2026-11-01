import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BeltSwatch } from '../../components/BeltRank';
import { Button } from '../../components/Button';
import { LoadingState } from '../../components/LoadingState';
import { Txt } from '../../components/Txt';
import { useCurrentRank, useRankHistory } from '../../hooks/data';
import { hit } from '../../theme/layout';
import { spacing } from '../../theme/tokens';
import { fmt } from '../home/format';
import { RankCard } from '../home/RankCard';
import { rankTitle } from '../rank/format';

const MAX_ROWS = 5;

/** Rank history panel (P-09): the current rank card, up to five earlier promotions, a link to Profile › Rank. */
export function RankHistoryPanel() {
  const { t } = useTranslation();
  const current = useCurrentRank();
  const history = useRankHistory();
  if (current.error) return null;
  if (current.data === undefined) return <LoadingState />;
  const promotions = (history.data ?? []).slice(1, 1 + MAX_ROWS);
  return (
    <RankCard rank={current.data} testIDPrefix="progress.rank">
      {promotions.length > 0 ? (
        <View style={styles.history}>
          <Txt variant="overline" color="textSecondary">{t('progress.rank.history')}</Txt>
          {promotions.map((e) => (
            <View key={e.id} testID={`progress.rank.entry.${e.id}`} accessible style={styles.row}>
              <BeltSwatch belt={e.belt} />
              <Txt variant="rowTitle" style={styles.title}>{rankTitle(t, e.belt, e.stripes)}</Txt>
              <Txt variant="caption" color="textSecondary">{fmt.localDateLong(e.awardedOn)}</Txt>
            </View>
          ))}
          <View style={styles.start}>
            <Button variant="ghost" testID="progress.rank.allHistory" label={t('progress.rank.allHistory')} onPress={() => router.push('/profile/rank')} />
          </View>
        </View>
      ) : null}
    </RankCard>
  );
}

const styles = StyleSheet.create({
  history: { gap: spacing[1] },
  row: { minHeight: hit, flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  title: { flex: 1 },
  start: { alignItems: 'flex-start' },
});
