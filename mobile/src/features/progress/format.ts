import type { TFunction } from 'i18next';

import type { IconName } from '../../components/Icon';
import type { ProgressResult, ProgressState, SignalId, SignalRow } from '../../hooks/data';
import { parseLocalDate } from '../rank/format';

const dayMonthShort = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' });
const dayMonthLong = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'long' });
const weekdayLong = new Intl.DateTimeFormat(undefined, { weekday: 'long' });
const weekdayNarrow = new Intl.DateTimeFormat(undefined, { weekday: 'narrow' });
const percent = new Intl.NumberFormat(undefined, { style: 'percent', maximumFractionDigits: 0 });
const decimal2 = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
const signed1 = new Intl.NumberFormat(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1, signDisplay: 'exceptZero' });
const plain1 = new Intl.NumberFormat(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** P-31: counts are integers, rates and weight shares percent, score and decimals max 2, trend signed with 1 decimal. */
export const pfmt = {
  dayMonthShort: (ld: string) => dayMonthShort.format(parseLocalDate(ld)),
  dayMonthLong: (ld: string) => dayMonthLong.format(parseLocalDate(ld)),
  weekdayLong: (ld: string) => weekdayLong.format(parseLocalDate(ld)),
  weekdayNarrow: (ld: string) => weekdayNarrow.format(parseLocalDate(ld)),
  percent: (n: number) => percent.format(n),
  decimal: (n: number) => decimal2.format(n),
  trend: (n: number) => signed1.format(n),
  trendAbs: (n: number) => plain1.format(Math.abs(n)),
};

/** Section order of the Progress list (PS-04); REMOVED is appended after the four states. */
export const STATE_ORDER: ProgressState[] = ['NEEDS_WORK', 'NOT_TRAINED', 'STEADY', 'IMPROVING'];

export const STATE_ICON: Record<ProgressState, IconName> = {
  IMPROVING: 'stateImproving',
  STEADY: 'stateSteady',
  NEEDS_WORK: 'stateNeedsWork',
  NOT_TRAINED: 'stateNotTrained',
};

/** Order of the signal rows in the why sheet (design §4.3). */
export const SIGNAL_ORDER: SignalId[] = ['n', 'daysSince', 'needsWorkRate', 'gap', 'hitRatio', 'trend'];

const signalOf = (r: ProgressResult, id: SignalId): SignalRow | undefined => r.signals.find((s) => s.signal === id);

/** The one-line "why" of a result (P-33): the key and values come from the rule that fired. */
export function ruleSentence(t: TFunction, r: ProgressResult, params: Record<string, number>): string {
  switch (r.rule) {
    case 1: {
      const days = signalOf(r, 'daysSince');
      if (!days?.available || days.value === undefined) return t('progress.rule.1.never');
      if (days.value > (params.staleDays ?? Infinity)) return t('progress.rule.1.stale', { days: days.value, threshold: params.staleDays });
      return t('progress.rule.1.window', { count: params.windowWeeks });
    }
    case 2:
      return t('progress.rule.2', { score: pfmt.decimal(r.score ?? 0), threshold: pfmt.decimal(params.needsWorkThreshold ?? 0) });
    case 3:
      return t('progress.rule.3', { value: pfmt.trendAbs(signalOf(r, 'trend')?.value ?? 0), count: r.n });
    default:
      return t('progress.rule.4', { count: r.n });
  }
}

/** The right-hand value of a signal row, or "Not enough data". */
export function signalValue(t: TFunction, s: SignalRow): string {
  if (!s.available || s.value === undefined) return t('progress.signal.notEnoughData');
  switch (s.signal) {
    case 'n':
      return String(s.value);
    case 'daysSince':
      return t('progress.signal.daysSince.value', { count: s.value });
    case 'hitRatio':
      return t('progress.signal.hitRatio.value', { pct: pfmt.percent(s.value) });
    case 'trend':
      return pfmt.trend(s.value);
    default:
      return pfmt.percent(s.value);
  }
}

/** Caption parts under a signal: weight, threshold, "Decided this result" (text + icon is drawn by the caller). */
export function signalDetails(t: TFunction, s: SignalRow): string[] {
  const parts: string[] = [];
  if (s.weight !== undefined) parts.push(t('progress.signal.weight', { pct: pfmt.percent(s.weight) }));
  if (s.threshold !== undefined && (s.signal === 'n' || s.signal === 'trend' || s.signal === 'daysSince')) {
    parts.push(t(`progress.signal.threshold.${s.signal}`, { threshold: pfmt.decimal(s.threshold) }));
  }
  return parts;
}
