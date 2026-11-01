import type { TFunction } from 'i18next';

import type { SessionSummary } from '../../hooks/data';
import { parseLocalDate, toLocalDate } from '../rank/format';

const dateLong = new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
const dateShort = new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
const dateMonthYear = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
const time = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
const weekdayShort = new Intl.DateTimeFormat(undefined, { weekday: 'short' });
const dayNum = new Intl.DateTimeFormat(undefined, { day: 'numeric' });

export const fmt = {
  todayLong: (d = new Date()) => dateLong.format(d),
  dateShort: (iso: string) => dateShort.format(new Date(iso)),
  localDateShort: (ld: string) => dateShort.format(parseLocalDate(ld)),
  localDateLong: (ld: string) => dateMonthYear.format(parseLocalDate(ld)),
  time: (iso: string) => time.format(new Date(iso)),
  weekday: (iso: string) => weekdayShort.format(new Date(iso)),
  day: (iso: string) => dayNum.format(new Date(iso)),
};

/** "Today 18:00" / "Tomorrow 18:00" / "Wed, 4 Nov 18:00". */
export function whenLabel(t: TFunction, s: SessionSummary, today: string): string {
  const tm = fmt.time(s.startsAt);
  if (s.localDate === today) return t('home.next.today', { time: tm });
  const tomorrow = parseLocalDate(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (s.localDate === toLocalDate(tomorrow)) return t('home.next.tomorrow', { time: tm });
  return t('home.next.onDate', { date: fmt.dateShort(s.startsAt), time: tm });
}
