import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { ListRow } from '../../components/ListRow';
import { SegmentedControl } from '../../components/SegmentedControl';
import { SwitchRow } from '../../components/SwitchRow';
import { Txt } from '../../components/Txt';
import { useAbout, useAlgorithmParams, useCurrentRank, useSetting } from '../../hooks/data';
import { isAndroid } from '../../theme/layout';
import { size, spacing } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';
import { RankCard } from '../home/RankCard';
import { useWriteSetting } from './useWriteSetting';

type ThemeMode = 'SYSTEM' | 'LIGHT' | 'DARK';

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.group}>
      <Txt variant="overline" color="textSecondary" accessibilityRole="header">{title}</Txt>
      {children}
    </View>
  );
}

const value = (text: string) => <Txt variant="rowValue" color="textSecondary">{text}</Txt>;

/** Profile = the Settings surface (Q3 (a), design §4.4.1): rank on top, settings groups below. */
export function ProfileScreen() {
  const { t } = useTranslation();
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const write = useWriteSetting();
  const rank = useCurrentRank();
  const params = useAlgorithmParams();
  const about = useAbout();
  const detailedRounds = useSetting('log.detailedRounds').data === true;
  const showExtended = useSetting('library.showExtended').data === true;
  const themeSetting = useSetting('theme.override').data;
  const theme = (['SYSTEM', 'LIGHT', 'DARK'] as const).find((m) => m === themeSetting) ?? 'SYSTEM';
  const scale = useSetting('rank.scale').data === 'KIDS' ? 'KIDS' : 'ADULT';
  const max = useSetting('suggest.max').data;
  const sources = [
    useSetting('suggest.lastNeedsWork').data, useSetting('suggest.needsWork').data,
    useSetting('suggest.notTrainedLately').data, useSetting('suggest.cycle').data,
  ];
  const tabBar = (isAndroid ? size.tabbarHeightAndroid : size.tabbarHeightIos) + insets.bottom;

  const windowWeeks = params.data?.find((p) => p.key === 'windowWeeks')?.value;
  const algorithmValue = windowWeeks === undefined ? '' : t('profile.algorithm.value', { count: windowWeeks });
  const suggestionsValue = max === 0 || sources.every((s) => s !== true) ? t('profile.suggestions.off') : t('profile.suggestions.value', { count: typeof max === 'number' ? max : 0 });
  const rankValue = t(`profile.rankScale.${scale}`);
  const aboutValue = about.data ? t('about.version', { version: about.data.appVersion }) : '';
  const a11y = (title: string, v: string) => (v ? `${title}, ${v}` : title);

  return (
    <ScrollView
      testID="profile.screen"
      style={{ backgroundColor: c.bgBase }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing[4], paddingBottom: tabBar + spacing[5] }]}
    >
      <Txt variant="titleL" accessibilityRole="header">{t('profile.title')}</Txt>
      {rank.data !== undefined ? <RankCard rank={rank.data} testIDPrefix="profile.rank" /> : null}

      <Group title={t('profile.group.algorithm')}>
        <ListRow testID="profile.algorithm" title={t('profile.algorithm')} trailing={value(algorithmValue)} chevron
          accessibilityLabel={a11y(t('profile.algorithm'), algorithmValue)} onPress={() => router.push('/profile/algorithm')} />
      </Group>
      <Group title={t('profile.group.suggestions')}>
        <ListRow testID="profile.suggestions" title={t('profile.suggestions')} trailing={value(suggestionsValue)} chevron
          accessibilityLabel={a11y(t('profile.suggestions'), suggestionsValue)} onPress={() => router.push('/profile/suggestions')} />
      </Group>
      <Group title={t('profile.group.logging')}>
        <SwitchRow testID="profile.detailedRounds" label={t('profile.detailedRounds')} hint={t('profile.detailedRounds.hint')}
          value={detailedRounds} onValueChange={(v) => write('log.detailedRounds', v)} />
      </Group>
      <Group title={t('profile.group.library')}>
        <SwitchRow testID="profile.showExtended" label={t('profile.showExtended')} hint={t('profile.showExtended.hint')}
          value={showExtended} onValueChange={(v) => write('library.showExtended', v)} />
      </Group>
      <Group title={t('profile.group.appearance')}>
        <Txt variant="caption" color="textSecondary">{t('profile.theme.label')}</Txt>
        <SegmentedControl<ThemeMode>
          accessibilityLabel={t('profile.theme.a11y')}
          value={theme}
          onChange={(v) => write('theme.override', v)}
          options={[
            { key: 'SYSTEM', label: t('profile.theme.SYSTEM'), testID: 'profile.theme.SYSTEM' },
            { key: 'LIGHT', label: t('profile.theme.LIGHT'), testID: 'profile.theme.LIGHT' },
            { key: 'DARK', label: t('profile.theme.DARK'), testID: 'profile.theme.DARK' },
          ]}
        />
      </Group>
      <Group title={t('profile.group.rank')}>
        <ListRow testID="profile.rankHistory" title={t('profile.rankHistory')} trailing={value(rankValue)} chevron
          accessibilityLabel={a11y(t('profile.rankHistory'), rankValue)} onPress={() => router.push('/profile/rank')} />
      </Group>
      <Group title={t('profile.group.about')}>
        <ListRow testID="profile.about" title={t('profile.about')} trailing={value(aboutValue)} chevron borderless
          accessibilityLabel={a11y(t('profile.about'), aboutValue)} onPress={() => router.push('/profile/about')} />
      </Group>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing[5], gap: spacing[5] },
  group: { gap: spacing[2] },
});
