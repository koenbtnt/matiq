import { and, eq, isNull, lte } from 'drizzle-orm';

import { getDb, type Db } from '../db/client';
import { algorithmParams as paramsTable, sessionFocuses, sessions as sessionsTable } from '../db/schema';
import { aggregateConsistency } from '../domain/progression/panels/consistency';
import { aggregatePlannedVsActual } from '../domain/progression/panels/plannedVsActual';
import { sortProgressResults } from '../domain/progression/sort';
import { computeProgression } from '../domain/progression/v1/compute';
import { requireV1Params } from '../domain/progression/v1/params';
import { windowStartOf } from '../domain/progression/v1/window';
import type { FocusHistory, FocusHistoryRow, ProgressOverview, ProgressResult, SessionDayRow } from './contracts';
import { refKey, resolveRefs } from './focusRefs';
import { compact, opt } from './internal';
import { getSettingSync } from './settings';

/** Live parameter values of a version as a record (the algorithm's input, R-22). */
export function paramsRecordSync(version: string, database: Db): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of database
    .select({ key: paramsTable.key, value: paramsTable.value })
    .from(paramsTable)
    .where(and(eq(paramsTable.algorithmVersion, version), isNull(paramsTable.deletedAt)))
    .all())
    out[r.key] = r.value;
  return out;
}

/**
 * One FocusHistory per focus ref with a live focus row in a live session (any status, all time);
 * name and `removed` from the taxonomy row (soft-deleted targets included). Rows in §6.2 order is
 * the domain's job; refs whose taxonomy row no longer exists at all are skipped.
 */
export function progressionInputsSync(database: Db): FocusHistory[] {
  const rows = database
    .select({
      kind: sessionFocuses.focusKind,
      refId: sessionFocuses.focusRefId,
      localDate: sessionsTable.localDate,
      startsAt: sessionsTable.startsAt,
      status: sessionsTable.status,
      isPlanned: sessionFocuses.isPlanned,
      isActual: sessionFocuses.isActual,
      needsWork: sessionFocuses.needsWork,
      rating: sessionFocuses.rating,
      hitCount: sessionFocuses.hitCount,
      caughtCount: sessionFocuses.caughtCount,
    })
    .from(sessionFocuses)
    .innerJoin(sessionsTable, and(eq(sessionsTable.id, sessionFocuses.sessionId), isNull(sessionsTable.deletedAt)))
    .where(isNull(sessionFocuses.deletedAt))
    .all();
  const groups = new Map<string, { kind: 'POSITION' | 'SUBJECT'; refId: string; rows: FocusHistoryRow[] }>();
  for (const r of rows) {
    const key = refKey(r.kind, r.refId);
    let g = groups.get(key);
    if (!g) groups.set(key, (g = { kind: r.kind, refId: r.refId, rows: [] }));
    g.rows.push(
      compact({
        localDate: r.localDate,
        startsAt: r.startsAt,
        status: r.status,
        isPlanned: r.isPlanned,
        isActual: r.isActual,
        needsWork: r.needsWork,
        rating: opt(r.rating),
        hitCount: opt(r.hitCount),
        caughtCount: opt(r.caughtCount),
      }),
    );
  }
  const info = resolveRefs([...groups.values()], database);
  const out: FocusHistory[] = [];
  for (const [key, g] of groups) {
    const ref = info.get(key);
    if (!ref) continue;
    out.push({ ref: { kind: g.kind, refId: g.refId }, name: ref.name, removed: ref.removed, rows: g.rows });
  }
  return out;
}

/** Every live session dated on or before `today`, any status (heatmap input). */
export function sessionDaysSync(today: string, database: Db): SessionDayRow[] {
  return database
    .select({
      localDate: sessionsTable.localDate,
      startsAt: sessionsTable.startsAt,
      status: sessionsTable.status,
      durationMinutes: sessionsTable.durationMinutes,
    })
    .from(sessionsTable)
    .where(and(isNull(sessionsTable.deletedAt), lte(sessionsTable.localDate, today)))
    .all()
    .map((r) => compact({ ...r, durationMinutes: opt(r.durationMinutes) }));
}

function loadStates({ today, nowIso }: { today: string; nowIso: string }, database: Db) {
  const algorithmVersion = getSettingSync('algorithm.version', database).value;
  const params = paramsRecordSync(algorithmVersion, database);
  const { windowWeeks } = requireV1Params(params);
  const windowStart = windowStartOf(today, windowWeeks);
  // A removed focus is shown only while it has a live row inside the window (PS-04, T14).
  const shown = progressionInputsSync(database).filter(
    (h) => !h.removed || h.rows.some((r) => r.localDate >= windowStart && r.localDate <= today),
  );
  const results: ProgressResult[] = sortProgressResults(computeProgression(shown, params, { today, nowIso }));
  return { algorithmVersion, params, windowWeeks, windowStart, shown, results };
}

/** Sorted states only (Home suggestions, PS-06). */
export function progressStatesSync(clock: { today: string; nowIso: string }, database: Db): ProgressResult[] {
  return loadStates(clock, database).results;
}

/** States + both panels from one load (PS-06, PS-21, PS-22). */
export function overviewSync({ today, nowIso }: { today: string; nowIso: string }, database: Db): ProgressOverview {
  const { algorithmVersion, params, windowWeeks, windowStart, shown, results } = loadStates({ today, nowIso }, database);
  return {
    today,
    windowStart,
    algorithmVersion,
    params,
    results,
    consistency: aggregateConsistency(sessionDaysSync(today, database), { today, windowWeeks }),
    plannedVsActual: aggregatePlannedVsActual(shown, { today, windowWeeks, nowIso }),
  };
}

export const progression = {
  /** FocusHistory per focus ref (all time; the domain cuts the window). `today` is accepted for symmetry and unused. */
  async inputs(_opts: { today: string }, database: Db = getDb()): Promise<FocusHistory[]> {
    return progressionInputsSync(database);
  },

  /** Live sessions with `localDate ≤ today`, any status. */
  async sessionDays({ today }: { today: string }, database: Db = getDb()): Promise<SessionDayRow[]> {
    return sessionDaysSync(today, database);
  },

  /** The Progress tab's single read: sorted states (PS-04) plus the consistency and planned-vs-actual panels. */
  async overview(clock: { today: string; nowIso: string }, database: Db = getDb()): Promise<ProgressOverview> {
    return overviewSync(clock, database);
  },
};
