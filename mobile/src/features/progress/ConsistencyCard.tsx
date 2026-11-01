import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

import { Card } from '../../components/Card';
import { Icon } from '../../components/Icon';
import { Txt } from '../../components/Txt';
import type { ConsistencyData, DayCell, WeekRow } from '../../hooks/data';
import { fontVariantNumeric, radius, size, spacing } from '../../theme/tokens';
import type { ColorScheme } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';
import { pfmt } from './format';

type Level = { fill: keyof ColorScheme | null; digit: keyof ColorScheme };

/** P-04: the only accent steps the system has; the digit carries the count (R-C5). */
const LEVELS: Level[] = [
  { fill: 'bgRaised', digit: 'textPrimary' },
  { fill: 'accentTint', digit: 'accentText' },
  { fill: 'accentGraphic', digit: 'accentOn' },
  { fill: 'accentText', digit: 'inverseFg' },
];

/** One phrase per day that has sessions (or is today): date, counts, then the flags (design §4.2.3). */
export function dayPhrase(t: TFunction, d: DayCell, today: string): string | undefined {
  if (d.future) return undefined;
  const isToday = d.localDate === today;
  if (d.completed + d.skipped + d.pending === 0 && !isToday) return undefined;
  const parts = [
    t('progress.consistency.cell', {
      date: pfmt.weekdayLong(d.localDate),
      sessions: t('progress.consistency.sessions', { count: d.completed }),
      minutes: d.minutes,
    }),
  ];
  if (d.skipped >= 1) parts.push(t('progress.consistency.cell.skipped', { count: d.skipped }));
  if (d.pending >= 1) {
    parts.push(d.localDate < today ? t('progress.consistency.cell.notLogged', { count: d.pending }) : t('progress.consistency.cell.planned', { count: d.pending }));
  }
  if (!d.inWindow) parts.push(t('progress.consistency.cell.outside'));
  if (isToday) parts.push(t('progress.consistency.cell.today'));
  return parts.join(', ');
}

/** The label of a week row: the day phrases joined, "no sessions", and a partial-window note. */
export function weekLabel(t: TFunction, week: WeekRow, today: string): string {
  const date = pfmt.dayMonthLong(week.weekStart);
  const phrases = week.days.map((d) => dayPhrase(t, d, today)).filter((p): p is string => !!p);
  const base = phrases.length ? t('progress.consistency.week', { date, days: phrases.join('; ') }) : t('progress.consistency.week.none', { date });
  const past = week.days.filter((d) => !d.future);
  const mixed = past.some((d) => d.inWindow) && past.some((d) => !d.inWindow);
  return mixed ? `${base} · ${t('progress.consistency.week.partial')}` : base;
}

function Cell({ day, today }: { day: DayCell; today: string }) {
  const { c } = useTheme();
  const isToday = day.localDate === today;
  const level = LEVELS[Math.min(3, day.completed)]!;
  let fill: string = 'transparent';
  let border: string = 'transparent';
  let borderWidth: number = 0;
  let digit: string | undefined;
  let digitColor: string = c.textSecondary;
  if (!day.future) {
    if (!day.inWindow) {
      border = c.borderDefault;
      borderWidth = size.borderWidth;
      if (day.completed >= 1) digit = String(day.completed);
    } else {
      fill = c[level.fill!];
      digitColor = c[level.digit];
      if (day.completed >= 1) digit = String(day.completed);
    }
  }
  if (isToday) {
    border = c.textPrimary;
    borderWidth = size.borderWidthFocus;
  }
  return (
    <View
      testID={`progress.consistency.cell.${day.localDate}`}
      accessible={false}
      style={[styles.cell, { backgroundColor: fill, borderColor: border, borderWidth }]}
    >
      {digit ? <Txt variant="caption" style={[styles.digit, { color: digitColor }]}>{digit}</Txt> : null}
    </View>
  );
}

/** Consistency heatmap (design §4.2.3): a plain `View` grid, weeks oldest first, Monday columns. */
export function ConsistencyCard({ data }: { data: ConsistencyData }) {
  const { t } = useTranslation();
  const { c } = useTheme();
  const { totals, weeks, today } = data;
  const first = weeks[0]?.days[0]?.localDate;
  const last = weeks[weeks.length - 1]?.days[6]?.localDate;
  const legend: { level: number; key: 'none' | 'one' | 'two' | 'three' }[] = [
    { level: 0, key: 'none' }, { level: 1, key: 'one' }, { level: 2, key: 'two' }, { level: 3, key: 'three' },
  ];
  return (
    <Card testID="progress.consistency.card" padding={spacing[4]}>
      <View style={styles.header}>
        <Txt variant="overline" color="textSecondary">{t('progress.consistency.title')}</Txt>
        <Txt testID="progress.consistency.summary" variant="headline" style={styles.tabular}>
          {t('progress.consistency.summary', {
            sessions: t('progress.consistency.sessions', { count: totals.completed }),
            days: t('progress.consistency.days', { count: totals.activeDays }),
            weeks: t('progress.consistency.weeks', { count: totals.weeksInWindow }),
          })}
        </Txt>
        {totals.currentStreakWeeks >= 1 ? (
          <View style={styles.streak}>
            <Icon name="streak" size={size.iconCheck} color="accentText" />
            <Txt testID="progress.consistency.streak" variant="statMeta" color="accentText">
              {t('progress.consistency.streak', { count: totals.currentStreakWeeks })}
            </Txt>
          </View>
        ) : null}
        <Txt variant="caption" color="textSecondary">{t('progress.consistency.minutes', { minutes: totals.minutes })}</Txt>
        {totals.completed === 0 ? (
          <Txt testID="progress.consistency.empty" variant="caption" color="textSecondary">{t('progress.consistency.empty')}</Txt>
        ) : null}
      </View>

      <View style={styles.weekdays} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {(weeks[0]?.days ?? []).map((d) => (
          <Txt key={d.localDate} variant="overline" color="textSecondary" style={styles.weekday}>{pfmt.weekdayNarrow(d.localDate)}</Txt>
        ))}
      </View>

      <View testID="progress.consistency" style={styles.grid}>
        {weeks.map((w) => (
          <View
            key={w.weekStart}
            testID={`progress.consistency.week.${w.weekStart}`}
            accessible
            accessibilityRole="image"
            accessibilityLabel={weekLabel(t, w, today)}
            style={styles.week}
          >
            {w.days.map((d) => <Cell key={d.localDate} day={d} today={today} />)}
          </View>
        ))}
      </View>

      {first && last ? (
        <Txt variant="caption" color="textSecondary">{t('progress.consistency.range', { start: pfmt.dayMonthShort(first), end: pfmt.dayMonthShort(last) })}</Txt>
      ) : null}

      <View style={styles.legend}>
        <Txt variant="caption" color="textSecondary">{t('progress.consistency.legend.title')}</Txt>
        {legend.map(({ level, key }) => (
          <View key={key} style={styles.legendItem}>
            <View
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={[styles.swatch, { backgroundColor: c[LEVELS[level]!.fill!] }]}
            />
            <Txt variant="caption" color="textSecondary">{t(`progress.consistency.legend.${key}`)}</Txt>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing[1] },
  tabular: { fontVariant: [...fontVariantNumeric] },
  streak: { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },
  weekdays: { flexDirection: 'row', columnGap: spacing[1] },
  weekday: { flex: 1, textAlign: 'center' },
  grid: { rowGap: spacing[1] },
  week: { flexDirection: 'row', columnGap: spacing[1] },
  cell: { flex: 1, aspectRatio: 1, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  digit: { fontVariant: [...fontVariantNumeric] },
  legend: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: spacing[3], rowGap: spacing[1] },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },
  swatch: { width: spacing[4], height: spacing[4], borderRadius: radius.xs },
});
