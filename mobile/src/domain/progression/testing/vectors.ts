/** Test vectors of plan §6.5 (fictional data), shared by the algorithm and panel suites. */
import type { FocusHistory, FocusHistoryRow } from '../types';
import { V1_PARAM_DEFAULTS } from '../v1/params';

export const DEFAULTS: Record<string, number> = Object.fromEntries(V1_PARAM_DEFAULTS.map((p) => [p.key, p.defaultValue]));
export const CLOCK = { today: '2026-11-01', nowIso: '2026-11-01T12:00:00.000Z' };

export const row = (localDate: string, over: Partial<FocusHistoryRow> = {}): FocusHistoryRow => ({
  localDate,
  startsAt: `${localDate}T18:00:00.000Z`,
  status: 'COMPLETED',
  isPlanned: false,
  isActual: true,
  needsWork: false,
  ...over,
});

export const hist = (rows: FocusHistoryRow[], over: Partial<FocusHistory> = {}): FocusHistory => ({
  ref: { kind: 'POSITION', refId: 'A' },
  name: 'A',
  removed: false,
  rows,
  ...over,
});

export const VECTORS: Record<string, FocusHistoryRow[]> = {
  T1: [],
  T2: [row('2026-10-30', { status: 'PLANNED', isPlanned: true, isActual: false, startsAt: '2026-10-30T12:00:00.000Z' })],
  T3: [row('2026-09-01', { rating: 4 })],
  T4: [row('2026-10-30', { needsWork: true, rating: 3 })],
  T5: [row('2026-10-30', { rating: 3 })],
  T6: [row('2026-10-20', { rating: 2 }), row('2026-10-25', { rating: 3 }), row('2026-10-30', { rating: 5 })],
  T7: [row('2026-10-25', { rating: 2 }), row('2026-10-30', { rating: 5 })],
  T8: [row('2026-10-20', { rating: 5 }), row('2026-10-25', { rating: 4 }), row('2026-10-30', { rating: 1 })],
  T9: [
    row('2026-10-12', { isPlanned: true, rating: 3 }),
    ...['2026-10-15', '2026-10-20', '2026-10-25'].map((d) => row(d, { status: 'PLANNED', isPlanned: true, isActual: false })),
    row('2026-10-30', { status: 'SKIPPED', isPlanned: true, isActual: false }),
  ],
  T10: [row('2026-10-30', { rating: 3, hitCount: 0, caughtCount: 3 })],
  T11: [row('2026-09-06'), row('2026-09-07')],
  T12: [
    row('2026-10-30', { startsAt: '2026-10-30T18:00:00.000Z', rating: 5 }),
    row('2026-10-30', { startsAt: '2026-10-30T10:00:00.000Z', rating: 2 }),
    row('2026-10-29', { rating: 2 }),
  ],
  T13: [row('2026-11-05', { status: 'PLANNED', isPlanned: true, isActual: false })],
  T16: [row('2026-10-29', { needsWork: true }), row('2026-10-30')],
};
