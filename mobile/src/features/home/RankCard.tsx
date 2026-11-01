import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BeltRank } from '../../components/BeltRank';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Txt } from '../../components/Txt';
import type { RankEntry } from '../../hooks/data';
import { fmt } from './format';
import { rankTitle } from '../rank/format';

type Props = {
  rank: RankEntry | null | undefined;
  /** `home.rank` (default), `progress.rank` or `profile.rank` (design §7). */
  testIDPrefix?: string;
  /** Rendered between the meta line and the Update button (Progress: the promotions). */
  children?: ReactNode;
};

export function RankCard({ rank, testIDPrefix = 'home.rank', children }: Props) {
  const { t } = useTranslation();
  const open = () => router.push('/set-rank');
  if (!rank) {
    return (
      <Card testID={testIDPrefix}>
        <Txt variant="overline" color="textSecondary">{t('home.rank.overline')}</Txt>
        <Txt variant="headline">{t('home.rank.empty.title')}</Txt>
        <Txt variant="caption" color="textSecondary">{t('home.rank.empty.body')}</Txt>
        <Button variant="secondary" testID={`${testIDPrefix}.set`} label={t('home.rank.empty.action')} onPress={open} />
      </Card>
    );
  }
  return (
    <Card testID={testIDPrefix}>
      <Txt variant="overline" color="textSecondary">{t('home.rank.overline')}</Txt>
      <BeltRank belt={rank.belt} stripes={rank.stripes} />
      <Txt variant="titleM">{rankTitle(t, rank.belt, rank.stripes)}</Txt>
      <Txt variant="caption" color="textSecondary">{t('home.rank.since', { date: fmt.localDateLong(rank.awardedOn) })}</Txt>
      {children}
      <View style={styles.end}>
        <Button variant="ghost" testID={`${testIDPrefix}.update`} label={t('home.rank.update')} accessibilityLabel={t('home.rank.update.a11y')} onPress={open} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({ end: { alignItems: 'flex-end' } });
