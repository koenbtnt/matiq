/**
 * Shapes of the progression algorithm and the Progress panels (progress-settings plan §5.1).
 * Defined here so the domain stays free of repository imports; `repositories/contracts.ts`
 * re-exports them unchanged. No strings for display: the UI maps states, rules and signal ids to
 * i18n keys.
 */
export type ProgressFocusRef = { kind: 'POSITION' | 'SUBJECT'; refId: string };
export type ProgressSessionStatus = 'PLANNED' | 'COMPLETED' | 'SKIPPED';

export type ProgressState = 'IMPROVING' | 'STEADY' | 'NEEDS_WORK' | 'NOT_TRAINED';
export type SignalId = 'n' | 'trend' | 'needsWorkRate' | 'gap' | 'daysSince' | 'hitRatio';

export type SignalRow = {
  signal: SignalId;
  available: boolean;
  /** Raw value: trend −4…4, rates 0…1, daysSince and n integers. `n` always carries its value (0 included). */
  value?: number;
  /** Rescaled weight `w_s / Σ w_S` on the four scored signals when available; absent otherwise. */
  weight?: number;
  /** Only on `daysSince` (staleDays), `trend` (trendImproving) and `n` (minSessions). */
  threshold?: number;
  /** True when the signal was part of the rule that fired. */
  contributed: boolean;
};

export type ProgressResult = {
  ref: ProgressFocusRef;
  name: string;
  removed: boolean;
  state: ProgressState;
  rule: 1 | 2 | 3 | 4;
  /** `needs_work` of the focus row in the most recent completed session where it is actual (PS-05). */
  flagged: boolean;
  n: number;
  /** Needs-work score; present whenever rule 1 did not fire. */
  score?: number;
  lastTrainedOn?: string;
  /** One row per SignalId, always in the order n, trend, needsWorkRate, gap, daysSince, hitRatio. */
  signals: SignalRow[];
};

export type FocusHistoryRow = {
  localDate: string;
  startsAt: string;
  status: ProgressSessionStatus;
  isPlanned: boolean;
  isActual: boolean;
  needsWork: boolean;
  rating?: number;
  hitCount?: number;
  caughtCount?: number;
};

/** Domain input: one focus ref and all its live rows (all time, any status). */
export type FocusHistory = { ref: ProgressFocusRef; name: string; removed: boolean; rows: FocusHistoryRow[] };

/** Domain input of the consistency heatmap: one live session. */
export type SessionDayRow = { localDate: string; startsAt: string; status: ProgressSessionStatus; durationMinutes?: number };

export type DayCell = {
  localDate: string;
  inWindow: boolean;
  future: boolean;
  completed: number;
  skipped: number;
  pending: number;
  minutes: number;
};

export type WeekRow = { weekStart: string; days: [DayCell, DayCell, DayCell, DayCell, DayCell, DayCell, DayCell]; completed: number };

export type ConsistencyData = {
  windowStart: string;
  today: string;
  weeks: WeekRow[];
  totals: {
    completed: number;
    activeDays: number;
    minutes: number;
    weeksWithTraining: number;
    weeksInWindow: number;
    currentStreakWeeks: number;
  };
};

export type GapRow = {
  ref: ProgressFocusRef;
  name: string;
  removed: boolean;
  planned: number;
  trained: number;
  notTrained: number;
  pending: number;
  unplannedTrained: number;
  /** notTrained / planned; absent when planned = 0. */
  gap?: number;
};

export type PlannedVsActualData = {
  windowStart: string;
  today: string;
  totals: Omit<GapRow, 'ref' | 'name' | 'removed'>;
  rows: GapRow[];
};

/** Injected clock (S2): `today` is the device-local date, `nowIso` the UTC instant. */
export type ProgressClock = { today: string; nowIso: string };
