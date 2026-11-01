import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { LoadingState } from '../../components/LoadingState';
import { SectionHeader } from '../../components/SectionHeader';
import { Txt } from '../../components/Txt';
import { useCurrentRank, useHome, useSessionTypes, quickLogTarget, type QuickLogTarget } from '../../hooks/data';
import { errorKey } from '../../i18n/keys';
import { isAndroid } from '../../theme/layout';
import { size, spacing } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';
import { NextSessionCard } from './NextSessionCard';
import { RankCard } from './RankCard';
import { RecentSessionRow } from './RecentSessionRow';
import { StaleSessionRow } from './StaleSessionRow';
import { SuggestionRow } from './SuggestionRow';
import { fmt } from './format';
import { openQuickLog } from './openQuickLog';

const MAX_STALE = 5;

export function HomeScreen() {
  const { t } = useTranslation();
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const home = useHome();
  const rank = useCurrentRank();
  const types = useSessionTypes();
  const tabBar = (isAndroid ? size.tabbarHeightAndroid : size.tabbarHeightIos) + insets.bottom;

  const h = home.data;
  let target: QuickLogTarget | undefined;
  try {
    target = h && types.data ? quickLogTarget(h, types.data) : undefined;
  } catch {
    target = undefined; // no session type at all: the hint is omitted, the tap surfaces the error
  }
  let hint: string | undefined;
  if (h && target) {
    if ('sessionId' in target) {
      const s = h.todayPlanned.find((x) => x.id === target.sessionId);
      if (s) hint = t('home.quickLog.hintPlanned', { type: s.sessionTypeName, time: fmt.time(s.startsAt) });
    } else {
      hint = t('home.quickLog.hintNew', { type: types.data?.find((x) => x.id === target.sessionTypeId)?.name ?? '' });
    }
  }

  const alsoToday = h ? h.todayPlanned.filter((s) => s.id !== h.nextPlanned?.id) : [];
  const stale = h ? h.stalePlanned.slice(-MAX_STALE).reverse() : [];
  const staleMore = h ? Math.max(0, h.stalePlanned.length - MAX_STALE) : 0;

  return (
    <ScrollView
      testID="home.screen"
      style={{ backgroundColor: c.bgBase }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing[4], paddingBottom: tabBar + spacing[5] }]}
    >
      <View>
        <Txt variant="overline" color="textSecondary">{fmt.todayLong()}</Txt>
        <Txt variant="titleL" accessibilityRole="header" style={styles.title}>{t('home.greeting')}</Txt>
      </View>

      <View>
        <Button variant="primary" fullWidth testID="home.quickLog" label={t('home.quickLog')} busy={!h} onPress={() => void openQuickLog()} />
        {hint ? <Txt variant="caption" color="textSecondary" style={styles.hint}>{hint}</Txt> : null}
      </View>

      {home.error ? (
        <EmptyState
          tone="card"
          testID="home.error"
          title={t('home.error')}
          body={t(errorKey(home.error.code))}
          action={<Button variant="secondary" testID="home.error.retry" label={t('common.tryAgain')} onPress={home.reload} />}
        />
      ) : !h ? (
        <LoadingState testID="home.loading" />
      ) : (
        <>
          {h.nextPlanned ? (
            <NextSessionCard session={h.nextPlanned} today={h.today} />
          ) : (
            <EmptyState
              tone="card"
              title={t('home.planEmpty.title')}
              body={t('home.planEmpty.body')}
              action={<Button variant="secondary" testID="home.planEmpty.action" label={t('home.planEmpty.action')} onPress={() => router.push({ pathname: '/log-session', params: { mode: 'plan' } })} />}
            />
          )}

          {alsoToday.length > 0 ? (
            <View>
              <SectionHeader title={t('home.alsoToday.title')} />
              {alsoToday.map((s) => <StaleSessionRow key={s.id} session={s} kind="planned" />)}
            </View>
          ) : null}

          {stale.length > 0 ? (
            <View>
              <SectionHeader title={t('home.stale.title')} />
              {stale.map((s) => <StaleSessionRow key={s.id} session={s} kind="stale" />)}
              {staleMore > 0 ? <Txt variant="caption" color="textSecondary">{t('home.stale.more', { count: staleMore })}</Txt> : null}
            </View>
          ) : null}

          {h.suggestions.length > 0 ? (
            <View>
              <SectionHeader title={t('home.suggestions.title')} />
              {h.suggestions.map((s) => <SuggestionRow key={s.ref.refId} suggestion={s} lastDate={h.lastCompleted?.localDate} />)}
            </View>
          ) : null}

          <View>
            <SectionHeader title={t('home.recent.title')} />
            {h.recent.length === 0 ? (
              <EmptyState testID="home.recent.empty" body={t('home.recent.empty')} style={styles.recentEmpty} />
            ) : (
              h.recent.map((s) => <RecentSessionRow key={s.id} session={s} />)
            )}
          </View>

          {rank.error ? null : rank.data !== undefined ? <RankCard rank={rank.data} /> : <LoadingState />}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing[5], gap: spacing[4] },
  title: { marginTop: spacing[1] },
  hint: { marginTop: spacing[2] },
  recentEmpty: { paddingVertical: spacing[2] },
});
