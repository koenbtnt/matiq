import attribution from '../db/seed/attribution.json';
import { addDays, weekStartOf } from '../domain/session/localDate';
import type {
  AboutData, AlgorithmParamRow, ConsistencyData, DayCell, GapRow, PlannedVsActualData, ProgressOverview, ProgressResult,
  RankEntry, ResourceRow, ResourceTypeRow, SignalId, SignalRow, WeekRow,
} from '../hooks/data/types';

/** Phase-A typed mock data shaped to docs/progress-settings/plan.md §5.1. Fictional names only (privacy.md). */

export const PARAM_DEFAULTS: AlgorithmParamRow[] = [
  { key: 'windowWeeks', value: 8, defaultValue: 8, min: 2, max: 26 },
  { key: 'staleDays', value: 21, defaultValue: 21, min: 7, max: 90 },
  { key: 'minSessions', value: 3, defaultValue: 3, min: 2, max: 10 },
  { key: 'trendImproving', value: 0.5, defaultValue: 0.5, min: 0.1, max: 2 },
  { key: 'needsWorkThreshold', value: 0.5, defaultValue: 0.5, min: 0.1, max: 1 },
  { key: 'wNeedsWork', value: 0.4, defaultValue: 0.4, min: 0, max: 1 },
  { key: 'wHitCaught', value: 0.25, defaultValue: 0.25, min: 0, max: 1 },
  { key: 'wGap', value: 0.2, defaultValue: 0.2, min: 0, max: 1 },
  { key: 'wTrend', value: 0.15, defaultValue: 0.15, min: 0, max: 1 },
  { key: 'hitCaughtMinEvents', value: 3, defaultValue: 3, min: 1, max: 20 },
].map((p) => ({ id: `ap-${p.key}`, algorithmVersion: 'v1', ...p }));

export const INTEGER_PARAMS = new Set(['windowWeeks', 'staleDays', 'minSessions', 'hitCaughtMinEvents']);

const sig = (rows: Partial<Record<SignalId, Partial<SignalRow>>>): SignalRow[] =>
  (['n', 'trend', 'needsWorkRate', 'gap', 'daysSince', 'hitRatio'] as SignalId[]).map((signal) => ({
    signal, available: false, contributed: false, ...rows[signal],
  }));

export function buildResults(today: string): ProgressResult[] {
  return [
    {
      ref: { kind: 'POSITION', refId: 'pos-half' }, name: 'Half guard', removed: false, state: 'NEEDS_WORK', rule: 2, flagged: true,
      n: 4, score: 0.58, lastTrainedOn: addDays(today, -2),
      signals: sig({
        n: { available: true, value: 4, threshold: 3 },
        needsWorkRate: { available: true, value: 0.5, weight: 0.5, contributed: true },
        gap: { available: true, value: 0.33, weight: 0.25, contributed: true },
        daysSince: { available: true, value: 2, threshold: 21 },
        hitRatio: { available: true, value: 0.4, weight: 0.31, contributed: true },
        trend: { available: true, value: -0.5, weight: 0.19, threshold: 0.5, contributed: true },
      }),
    },
    {
      ref: { kind: 'POSITION', refId: 'pos-side' }, name: 'Side control', removed: false, state: 'NOT_TRAINED', rule: 1, flagged: false,
      n: 0, lastTrainedOn: addDays(today, -40),
      signals: sig({
        n: { available: true, value: 0, threshold: 3 },
        gap: { available: true, value: 0.5 },
        daysSince: { available: true, value: 40, threshold: 21, contributed: true },
      }),
    },
    {
      ref: { kind: 'POSITION', refId: 'pos-turtle' }, name: 'Turtle', removed: false, state: 'NOT_TRAINED', rule: 1, flagged: false,
      n: 0, signals: sig({ n: { available: true, value: 0, threshold: 3, contributed: true } }),
    },
    {
      ref: { kind: 'POSITION', refId: 'pos-closed' }, name: 'Closed guard', removed: false, state: 'STEADY', rule: 4, flagged: false,
      n: 3, score: 0.12, lastTrainedOn: addDays(today, -6),
      signals: sig({
        n: { available: true, value: 3, threshold: 3 }, needsWorkRate: { available: true, value: 0, weight: 1, contributed: true },
        daysSince: { available: true, value: 6, threshold: 21 },
      }),
    },
    {
      ref: { kind: 'SUBJECT', refId: 'sub-grips' }, name: 'Grip fighting', removed: false, state: 'STEADY', rule: 4, flagged: false,
      n: 2, score: 0.2, lastTrainedOn: addDays(today, -9),
      signals: sig({ n: { available: true, value: 2, threshold: 3 }, needsWorkRate: { available: true, value: 0.2, weight: 1, contributed: true }, daysSince: { available: true, value: 9, threshold: 21 } }),
    },
    {
      ref: { kind: 'POSITION', refId: 'pos-mount' }, name: 'Mount', removed: false, state: 'IMPROVING', rule: 3, flagged: false,
      n: 4, score: 0.1, lastTrainedOn: addDays(today, -2),
      signals: sig({
        n: { available: true, value: 4, threshold: 3, contributed: true }, trend: { available: true, value: 1.2, weight: 0.4, threshold: 0.5, contributed: true },
        needsWorkRate: { available: true, value: 0, weight: 0.6 }, daysSince: { available: true, value: 2, threshold: 21 },
      }),
    },
    {
      ref: { kind: 'POSITION', refId: 'pos-retired' }, name: 'Retired guard', removed: true, state: 'STEADY', rule: 4, flagged: false,
      n: 3, score: 0.1, lastTrainedOn: addDays(today, -12),
      signals: sig({ n: { available: true, value: 3, threshold: 3 }, needsWorkRate: { available: true, value: 0, weight: 1, contributed: true }, daysSince: { available: true, value: 12, threshold: 21 } }),
    },
  ];
}

type DayData = { completed?: number; skipped?: number; pending?: number; minutes?: number };

/** Builds `ConsistencyData` (the data layer does this from session rows; here from a sparse day map). */
export function buildConsistency(today: string, windowWeeks: number, data: Record<string, DayData>): ConsistencyData {
  const windowStart = addDays(today, -(windowWeeks * 7 - 1));
  const first = weekStartOf(windowStart);
  const last = weekStartOf(today);
  const weeks: WeekRow[] = [];
  for (let ws = first; ws <= last; ws = addDays(ws, 7)) {
    const days = Array.from({ length: 7 }, (_, j): DayCell => {
      const localDate = addDays(ws, j);
      const d = data[localDate] ?? {};
      const inWindow = localDate >= windowStart && localDate <= today;
      return {
        localDate, inWindow, future: localDate > today,
        completed: d.completed ?? 0, skipped: d.skipped ?? 0, pending: d.pending ?? 0, minutes: d.minutes ?? 0,
      };
    }) as WeekRow['days'];
    weeks.push({ weekStart: ws, days, completed: days.reduce((n, d) => n + (d.inWindow ? d.completed : 0), 0) });
  }
  const inWin = weeks.flatMap((w) => w.days).filter((d) => d.inWindow);
  let streak = 0;
  for (let i = weeks.length - 1; i >= 0 && weeks[i]!.completed > 0; i -= 1) streak += 1;
  return {
    windowStart, today, weeks,
    totals: {
      completed: inWin.reduce((n, d) => n + d.completed, 0),
      activeDays: inWin.filter((d) => d.completed > 0).length,
      minutes: inWin.reduce((n, d) => n + d.minutes, 0),
      weeksWithTraining: weeks.filter((w) => w.completed > 0).length,
      weeksInWindow: windowWeeks,
      currentStreakWeeks: streak,
    },
  };
}

export function buildGap(today: string, windowWeeks: number): PlannedVsActualData {
  const rows: GapRow[] = [
    { ref: { kind: 'POSITION', refId: 'pos-half' }, name: 'Half guard', removed: false, planned: 3, trained: 2, notTrained: 1, pending: 0, unplannedTrained: 0, gap: 1 / 3 },
    { ref: { kind: 'POSITION', refId: 'pos-side' }, name: 'Side control', removed: false, planned: 2, trained: 0, notTrained: 1, pending: 1, unplannedTrained: 0, gap: 0.5 },
    { ref: { kind: 'POSITION', refId: 'pos-mount' }, name: 'Mount', removed: false, planned: 0, trained: 0, notTrained: 0, pending: 0, unplannedTrained: 2 },
  ];
  const sum = (k: 'planned' | 'trained' | 'notTrained' | 'pending' | 'unplannedTrained') => rows.reduce((n, r) => n + r[k], 0);
  const planned = sum('planned');
  return {
    windowStart: addDays(today, -(windowWeeks * 7 - 1)), today, rows,
    totals: { planned, trained: sum('trained'), notTrained: sum('notTrained'), pending: sum('pending'), unplannedTrained: sum('unplannedTrained'), gap: planned ? sum('notTrained') / planned : undefined },
  };
}

export function buildOverview(today: string, params: Record<string, number>): ProgressOverview {
  const windowWeeks = params.windowWeeks ?? 8;
  const day = (offset: number, d: DayData) => [addDays(today, offset), d] as const;
  const consistency = buildConsistency(today, windowWeeks, Object.fromEntries([
    day(0, { pending: 1 }), day(-2, { completed: 1, minutes: 90 }), day(-4, { completed: 2, minutes: 150 }), day(-6, { completed: 1, minutes: 60 }),
    day(-9, { completed: 1, minutes: 75 }), day(-11, { skipped: 1 }), day(-13, { completed: 1, minutes: 60 }), day(-20, { completed: 1, minutes: 90 }),
    day(-24, { completed: 3, minutes: 200 }), day(-31, { completed: 1, minutes: 60 }),
  ]));
  return {
    today, windowStart: consistency.windowStart, algorithmVersion: 'v1', params,
    results: buildResults(today), consistency, plannedVsActual: buildGap(today, windowWeeks),
  };
}

export const EMPTY_PANELS = (today: string, windowWeeks: number) => ({
  consistency: buildConsistency(today, windowWeeks, {}),
  plannedVsActual: {
    windowStart: addDays(today, -(windowWeeks * 7 - 1)), today, rows: [],
    totals: { planned: 0, trained: 0, notTrained: 0, pending: 0, unplannedTrained: 0 },
  } satisfies PlannedVsActualData,
});

export const rankHistory = (): RankEntry[] => [
  { id: 'rk-3', scale: 'ADULT', belt: 'BLUE', stripes: 2, awardedOn: '2025-06-14' },
  { id: 'rk-2', scale: 'ADULT', belt: 'BLUE', stripes: 0, awardedOn: '2024-09-02' },
  { id: 'rk-1', scale: 'ADULT', belt: 'WHITE', stripes: 4, awardedOn: '2023-01-20' },
  { id: 'rk-k2', scale: 'KIDS', belt: 'GREY_WHITE', stripes: 1, awardedOn: '2016-05-01' },
];

export const resourceTypes: ResourceTypeRow[] = [
  { id: 'rt-video', name: 'Video', sortOrder: 1 },
  { id: 'rt-course', name: 'Course', sortOrder: 2 },
  { id: 'rt-book', name: 'Book', sortOrder: 3 },
  { id: 'rt-article', name: 'Article', sortOrder: 4 },
];

export const initialResources = (): Record<string, ResourceRow[]> => ({
  'tec-scissor': [
    { id: 'res-1', title: 'Scissor sweep details', url: 'https://example.com/scissor', author: 'Coach Ada', resourceTypeId: 'rt-video', resourceTypeName: 'Video', status: 'TO_WATCH', origin: 'seed' },
    { id: 'res-2', title: 'Guard fundamentals', author: 'Ben Okafor', resourceTypeId: 'rt-book', resourceTypeName: 'Book', status: 'WATCHED', origin: 'user' },
  ],
});

export const buildAbout = (): AboutData => ({
  appVersion: '0.1.0', algorithmVersion: 'v1', taxonomyRelease: '2026.10', backup: 'excluded', attribution,
});
