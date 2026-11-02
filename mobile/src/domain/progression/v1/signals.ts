import { diffDays } from '../../session/localDate';
import type { FocusHistoryRow, ProgressClock } from '../types';
import type { V1Params } from './params';
import { byDateThenStart, classifyPlanned, inWindow, windowStartOf } from './window';

export type Signal = { available: boolean; value?: number };

/** Raw §6.3 signals of one focus, plus the PS-05 flag. */
export type FocusSignals = {
  n: number;
  trend: Signal;
  needsWorkRate: Signal;
  gap: Signal;
  daysSince: Signal;
  hitRatio: Signal;
  lastTrainedOn?: string;
  flagged: boolean;
};

const mean = (xs: readonly number[]): number => xs.reduce((s, x) => s + x, 0) / xs.length;

/** §6.3 over one focus's rows (all time); the window is cut here. */
export function computeSignals(rows: readonly FocusHistoryRow[], params: V1Params, { today, nowIso }: ProgressClock): FocusSignals {
  const windowStart = windowStartOf(today, params.windowWeeks);
  const w = inWindow(rows, windowStart, today);
  const trained = w.filter((r) => r.status === 'COMPLETED' && r.isActual);
  const n = trained.length;

  const rated = trained.filter((r) => typeof r.rating === 'number').map((r) => r.rating!);
  const trend: Signal =
    rated.length >= 2
      ? { available: true, value: mean(rated.slice(Math.floor(rated.length / 2))) - mean(rated.slice(0, Math.floor(rated.length / 2))) }
      : { available: false };

  const needsWorkRate: Signal = n >= 1 ? { available: true, value: trained.filter((r) => r.needsWork).length / n } : { available: false };

  const planned = w.filter((r) => r.isPlanned);
  const gap: Signal =
    planned.length >= 1
      ? { available: true, value: planned.filter((r) => classifyPlanned(r, nowIso) === 'notTrained').length / planned.length }
      : { available: false };

  // daysSince and the flag look at all time (≤ today), not the window.
  const trainedAllTime = rows.filter((r) => r.status === 'COMPLETED' && r.isActual && r.localDate <= today).sort(byDateThenStart);
  const last = trainedAllTime[trainedAllTime.length - 1];
  const daysSince: Signal = last ? { available: true, value: diffDays(last.localDate, today) } : { available: false };

  const hit = trained.reduce((s, r) => s + (r.hitCount ?? 0), 0);
  const caught = trained.reduce((s, r) => s + (r.caughtCount ?? 0), 0);
  const hitRatio: Signal =
    hit + caught >= params.hitCaughtMinEvents && hit + caught > 0 ? { available: true, value: hit / (hit + caught) } : { available: false };

  return { n, trend, needsWorkRate, gap, daysSince, hitRatio, lastTrainedOn: last?.localDate, flagged: last?.needsWork ?? false };
}
