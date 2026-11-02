import { and, asc, desc, eq, inArray, isNull, type SQL } from 'drizzle-orm';

import { getDb, type Db } from '../db/client';
import {
  sessionFocuses, sessions as sessionsTable, sessionTechniques, sessionTypes as sessionTypesTable, techniques,
} from '../db/schema';
import { DomainError } from '../domain/errors';
import { partitionPlanned } from '../domain/session/home';
import { localDateOf } from '../domain/session/localDate';
import { quickLogTarget } from '../domain/session/quickLog';
import { touchesReview, validateLog, validatePlan } from '../domain/session/validateLog';
import { forPlanning } from '../domain/suggestions/forPlanning';
import type {
  FocusInput, FocusRef, FocusRow, HomeData, LogSessionInput, PlanSessionInput, QuickLogTarget, SessionDetail,
  SessionSummary, SessionTypeRow,
} from './contracts';
import { refKey, resolveRefs } from './focusRefs';
import { compact, opt } from './internal';
import { progressStatesSync } from './progression';
import { currentRankSync } from './rank';
import { listRoundsSync, upsertRoundsSync } from './rounds';
import { runtime } from './runtime';
import { allSettingsSync } from './settings';
import { assertTechniquesExist, listSubmissionsSync, upsertSubmissionsSync } from './submissions';

type SessionRow = typeof sessionsTable.$inferSelect;
type FocusDbRow = typeof sessionFocuses.$inferSelect;

/* ---------- reads ---------- */

function liveFocusRows(sessionIds: readonly string[], tx: Db): FocusDbRow[] {
  if (sessionIds.length === 0) return [];
  return tx
    .select()
    .from(sessionFocuses)
    .where(and(inArray(sessionFocuses.sessionId, [...sessionIds]), isNull(sessionFocuses.deletedAt)))
    .orderBy(asc(sessionFocuses.sortOrder))
    .all();
}

function summaries(where: SQL | undefined, order: SQL[], limit: number | undefined, tx: Db): SessionSummary[] {
  const base = tx
    .select({ s: sessionsTable, typeName: sessionTypesTable.name })
    .from(sessionsTable)
    .innerJoin(sessionTypesTable, eq(sessionTypesTable.id, sessionsTable.sessionTypeId))
    .where(and(isNull(sessionsTable.deletedAt), where))
    .orderBy(...order);
  const rows = limit === undefined ? base.all() : base.limit(limit).all();
  const focuses = liveFocusRows(rows.map((r) => r.s.id), tx);
  const refs = resolveRefs(focuses.map((f) => ({ kind: f.focusKind, refId: f.focusRefId })), tx);
  return rows.map(({ s, typeName }) => {
    // Completed: what was trained; planned/skipped: what was planned.
    const shown = focuses.filter((f) => f.sessionId === s.id && (s.status === 'COMPLETED' ? f.isActual : f.isPlanned));
    return toSummary(s, typeName, shown.map((f) => refs.get(refKey(f.focusKind, f.focusRefId))?.name ?? ''));
  });
}

const toSummary = (s: SessionRow, typeName: string, focusNames: string[]): SessionSummary =>
  compact({
    id: s.id,
    status: s.status,
    sessionTypeId: s.sessionTypeId,
    sessionTypeName: typeName,
    startsAt: s.startsAt,
    localDate: s.localDate,
    durationMinutes: opt(s.durationMinutes),
    rating: opt(s.rating),
    focusNames,
  });

function detailSync(sessionId: string, tx: Db): SessionDetail {
  const [summary] = summaries(eq(sessionsTable.id, sessionId), [], undefined, tx);
  const s = tx.select().from(sessionsTable).where(and(eq(sessionsTable.id, sessionId), isNull(sessionsTable.deletedAt))).get();
  if (!summary || !s) throw new DomainError('SESSION_NOT_FOUND');
  const focusRows = liveFocusRows([sessionId], tx);
  const refs = resolveRefs(focusRows.map((f) => ({ kind: f.focusKind, refId: f.focusRefId })), tx);
  const techRows = tx
    .select({ focusId: sessionTechniques.sessionFocusId, id: techniques.id, name: techniques.name })
    .from(sessionTechniques)
    .innerJoin(techniques, eq(techniques.id, sessionTechniques.techniqueId))
    .where(and(eq(sessionTechniques.sessionId, sessionId), isNull(sessionTechniques.deletedAt)))
    .orderBy(asc(sessionTechniques.createdAt), asc(techniques.name))
    .all();
  const focuses: FocusRow[] = focusRows.map((f) => {
    const ref = refs.get(refKey(f.focusKind, f.focusRefId));
    return compact({
      id: f.id,
      kind: f.focusKind,
      refId: f.focusRefId,
      isPlanned: f.isPlanned,
      isActual: f.isActual,
      needsWork: f.needsWork,
      rating: opt(f.rating),
      comment: opt(f.comment),
      hitCount: opt(f.hitCount),
      caughtCount: opt(f.caughtCount),
      sortOrder: f.sortOrder,
      name: ref?.name ?? '',
      aliases: ref?.aliases ?? [],
      removed: ref ? ref.removed : true,
      techniques: techRows.filter((t) => t.focusId === f.id).map(({ id, name }) => ({ id, name })),
    });
  });
  return compact({
    ...summary,
    intensity: opt(s.intensity),
    energy: opt(s.energy),
    contextNote: opt(s.contextNote),
    whatWorked: opt(s.whatWorked),
    whatFailed: opt(s.whatFailed),
    roundsCount: opt(s.roundsCount),
    submissionsLanded: opt(s.submissionsLanded),
    submissionsTaken: opt(s.submissionsTaken),
    completedAt: opt(s.completedAt),
    reviewedAt: opt(s.reviewedAt),
    focuses,
    submissions: listSubmissionsSync(sessionId, tx).filter((x) => x.roundId === undefined),
    rounds: listRoundsSync(sessionId, tx),
  });
}

/* ---------- write helpers ---------- */

function liveSession(sessionId: string, tx: Db): SessionRow {
  const s = tx.select().from(sessionsTable).where(and(eq(sessionsTable.id, sessionId), isNull(sessionsTable.deletedAt))).get();
  if (!s) throw new DomainError('SESSION_NOT_FOUND');
  return s;
}

function assertTypeExists(sessionTypeId: string, tx: Db): void {
  const t = tx
    .select({ id: sessionTypesTable.id })
    .from(sessionTypesTable)
    .where(and(eq(sessionTypesTable.id, sessionTypeId), isNull(sessionTypesTable.deletedAt)))
    .get();
  if (!t) throw new DomainError('SESSION_TYPE_NOT_FOUND');
}

/** Every ref must be live — except refs already on this session (a removed focus stays editable). */
function assertRefsExist(refs: readonly FocusRef[], alreadyOnSession: ReadonlySet<string>, tx: Db): void {
  const info = resolveRefs(refs, tx);
  for (const r of refs) {
    const k = refKey(r.kind, r.refId);
    const found = info.get(k);
    if (!found || (found.removed && !alreadyOnSession.has(k))) throw new DomainError('FOCUS_REF_NOT_FOUND', { refId: r.refId });
  }
}

type FocusWrite = {
  isPlanned: boolean;
  isActual: boolean;
  needsWork: boolean;
  rating: number | null;
  comment: string | null;
  hitCount: number | null;
  caughtCount: number | null;
  techniqueIds: string[];
};

const PLANNED_ONLY: Omit<FocusWrite, 'isPlanned'> = {
  isActual: false, needsWork: false, rating: null, comment: null, hitCount: null, caughtCount: null, techniqueIds: [],
};

/**
 * Brings the live focus rows of a session to `desired` (ordered): updates matching rows, inserts
 * new ones, soft-deletes the rest; then the technique attachments of each row (none on rows that
 * are not actual — TECHNIQUE_REQUIRES_ACTUAL is enforced before this point).
 */
function syncFocuses(sessionId: string, desired: readonly (FocusRef & FocusWrite)[], now: string, tx: Db): void {
  const existing = new Map(liveFocusRows([sessionId], tx).map((f) => [refKey(f.focusKind, f.focusRefId), f]));
  const keep = new Set<string>();
  desired.forEach((d, sortOrder) => {
    const k = refKey(d.kind, d.refId);
    const values = {
      isPlanned: d.isPlanned,
      isActual: d.isActual,
      needsWork: d.needsWork,
      rating: d.rating,
      comment: d.comment,
      hitCount: d.hitCount,
      caughtCount: d.caughtCount,
      sortOrder,
      updatedAt: now,
    };
    const prev = existing.get(k);
    let focusId: string;
    if (prev) {
      focusId = prev.id;
      keep.add(k);
      tx.update(sessionFocuses).set(values).where(eq(sessionFocuses.id, prev.id)).run();
    } else {
      focusId = runtime().newId();
      tx.insert(sessionFocuses)
        .values({ ...values, id: focusId, sessionId, focusKind: d.kind, focusRefId: d.refId, createdAt: now })
        .run();
    }
    syncFocusTechniques(sessionId, focusId, d.isActual ? d.techniqueIds : [], now, tx);
  });
  for (const [k, f] of existing) {
    if (keep.has(k)) continue;
    syncFocusTechniques(sessionId, f.id, [], now, tx);
    tx.update(sessionFocuses).set({ deletedAt: now, updatedAt: now }).where(eq(sessionFocuses.id, f.id)).run();
  }
}

function syncFocusTechniques(sessionId: string, focusId: string, techniqueIds: readonly string[], now: string, tx: Db): void {
  const rows = tx
    .select({ id: sessionTechniques.id, techniqueId: sessionTechniques.techniqueId })
    .from(sessionTechniques)
    .where(and(eq(sessionTechniques.sessionFocusId, focusId), isNull(sessionTechniques.deletedAt)))
    .all();
  const want = new Set(techniqueIds);
  const have = new Set(rows.map((r) => r.techniqueId));
  const drop = rows.filter((r) => !want.has(r.techniqueId)).map((r) => r.id);
  if (drop.length) tx.update(sessionTechniques).set({ deletedAt: now, updatedAt: now }).where(inArray(sessionTechniques.id, drop)).run();
  for (const techniqueId of want) {
    if (have.has(techniqueId)) continue;
    tx.insert(sessionTechniques)
      .values({ id: runtime().newId(), sessionId, sessionFocusId: focusId, techniqueId, createdAt: now, updatedAt: now })
      .run();
  }
}

const toWrite = (f: FocusInput, isPlanned: boolean): FocusRef & FocusWrite => ({
  kind: f.kind,
  refId: f.refId,
  isPlanned,
  isActual: f.isActual,
  needsWork: f.isActual ? (f.needsWork ?? false) : false,
  rating: f.isActual ? (f.rating ?? null) : null,
  comment: f.comment?.trim() ? f.comment : null,
  hitCount: f.isActual ? (f.hitCount ?? null) : null,
  caughtCount: f.isActual ? (f.caughtCount ?? null) : null,
  techniqueIds: [...new Set(f.techniqueIds ?? [])],
});

const text = (s: string | undefined) => (s?.trim() ? s : null);

/* ---------- API ---------- */

export const sessions = {
  /**
   * Plan mode: creates a PLANNED session, or edits one (`sessionId`) — type, start and the planned
   * focus set (removed focuses are soft-deleted).
   */
  async create(input: PlanSessionInput, database: Db = getDb()): Promise<SessionDetail> {
    validatePlan(input);
    const localDate = localDateOf(input.startsAt, input.timeZone);
    const now = runtime().now();
    return database.transaction((tx) => {
      assertTypeExists(input.sessionTypeId, tx);
      let sessionId = input.sessionId;
      const onSession = new Set<string>();
      if (sessionId) {
        const s = liveSession(sessionId, tx);
        if (s.status !== 'PLANNED') throw new DomainError('SESSION_NOT_PLANNED');
        for (const f of liveFocusRows([sessionId], tx)) onSession.add(refKey(f.focusKind, f.focusRefId));
      }
      assertRefsExist(input.focuses, onSession, tx);
      const header = { sessionTypeId: input.sessionTypeId, startsAt: input.startsAt, localDate, updatedAt: now };
      if (sessionId) tx.update(sessionsTable).set(header).where(eq(sessionsTable.id, sessionId)).run();
      else {
        sessionId = runtime().newId();
        tx.insert(sessionsTable).values({ ...header, id: sessionId, status: 'PLANNED', createdAt: now }).run();
      }
      syncFocuses(sessionId, input.focuses.map((f) => ({ ...f, isPlanned: true, ...PLANNED_ONLY })), now, tx);
      return detailSync(sessionId, tx);
    });
  },

  /**
   * Log mode, create-or-complete (F-19/F-20): a new COMPLETED session; or completes a PLANNED/
   * SKIPPED one (its planned rows are kept — un-ticked ones stay `isActual = false`); or updates a
   * COMPLETED one (review mode; sets `reviewedAt` on the first change of rating / whatWorked /
   * whatFailed). `submissions` / `rounds` left undefined keep the stored rows; `[]` clears them.
   */
  async log(input: LogSessionInput, database: Db = getDb()): Promise<SessionDetail> {
    validateLog(input);
    const localDate = localDateOf(input.startsAt, input.timeZone);
    const now = runtime().now();
    return database.transaction((tx) => {
      assertTypeExists(input.sessionTypeId, tx);
      const prev = input.sessionId ? liveSession(input.sessionId, tx) : undefined;
      const prevFocuses = prev ? liveFocusRows([prev.id], tx) : [];
      const prevByKey = new Map(prevFocuses.map((f) => [refKey(f.focusKind, f.focusRefId), f]));
      assertRefsExist(input.focuses, new Set(prevByKey.keys()), tx);
      assertTechniquesExist(
        [
          ...input.focuses.flatMap((f) => f.techniqueIds ?? []),
          ...(input.submissions ?? []).map((s) => s.techniqueId),
          ...(input.rounds ?? []).flatMap((r) => (r.submissions ?? []).map((s) => s.techniqueId)),
        ],
        tx,
      );

      const header = {
        sessionTypeId: input.sessionTypeId,
        status: 'COMPLETED' as const,
        startsAt: input.startsAt,
        localDate,
        durationMinutes: input.durationMinutes ?? null,
        rating: input.rating ?? null,
        intensity: input.intensity ?? null,
        energy: input.energy ?? null,
        contextNote: text(input.contextNote),
        whatWorked: text(input.whatWorked),
        whatFailed: text(input.whatFailed),
        roundsCount: input.aggregates?.roundsCount ?? null,
        submissionsLanded: input.aggregates?.submissionsLanded ?? null,
        submissionsTaken: input.aggregates?.submissionsTaken ?? null,
        updatedAt: now,
      };
      let sessionId: string;
      if (prev) {
        sessionId = prev.id;
        const wasCompleted = prev.status === 'COMPLETED';
        const reviewedAt =
          wasCompleted && !prev.reviewedAt &&
          touchesReview(prev, { rating: input.rating, whatWorked: text(input.whatWorked) ?? undefined, whatFailed: text(input.whatFailed) ?? undefined })
            ? now
            : prev.reviewedAt;
        tx.update(sessionsTable)
          .set({ ...header, completedAt: wasCompleted ? prev.completedAt : now, reviewedAt })
          .where(eq(sessionsTable.id, sessionId))
          .run();
      } else {
        sessionId = runtime().newId();
        tx.insert(sessionsTable).values({ ...header, id: sessionId, completedAt: now, createdAt: now }).run();
      }

      // Planned rows keep their planned flag; a planned row the input omits stays planned-not-trained.
      const desired = input.focuses.map((f) => toWrite(f, prevByKey.get(refKey(f.kind, f.refId))?.isPlanned ?? f.isPlanned));
      const sent = new Set(desired.map((d) => refKey(d.kind, d.refId)));
      for (const f of prevFocuses)
        if (f.isPlanned && !sent.has(refKey(f.focusKind, f.focusRefId)))
          desired.push({ kind: f.focusKind, refId: f.focusRefId, isPlanned: true, ...PLANNED_ONLY });
      syncFocuses(sessionId, desired, now, tx);

      if (input.submissions) upsertSubmissionsSync(sessionId, null, input.submissions, now, tx);
      if (input.rounds) upsertRoundsSync(sessionId, input.rounds, now, tx);
      return detailSync(sessionId, tx);
    });
  },

  /** Soft-deletes a session (undoable). */
  async softDelete(sessionId: string, database: Db = getDb()): Promise<SessionSummary> {
    const now = runtime().now();
    return database.transaction((tx) => {
      liveSession(sessionId, tx);
      const [summary] = summaries(eq(sessionsTable.id, sessionId), [], undefined, tx);
      tx.update(sessionsTable).set({ deletedAt: now, updatedAt: now }).where(eq(sessionsTable.id, sessionId)).run();
      return summary!;
    });
  },

  /** Restores a soft-deleted session; a live one is returned unchanged. */
  async undoDelete(sessionId: string, database: Db = getDb()): Promise<SessionSummary> {
    const now = runtime().now();
    return database.transaction((tx) => {
      const s = tx.select({ id: sessionsTable.id, deletedAt: sessionsTable.deletedAt }).from(sessionsTable).where(eq(sessionsTable.id, sessionId)).get();
      if (!s) throw new DomainError('SESSION_NOT_FOUND');
      if (s.deletedAt !== null) tx.update(sessionsTable).set({ deletedAt: null, updatedAt: now }).where(eq(sessionsTable.id, sessionId)).run();
      return summaries(eq(sessionsTable.id, sessionId), [], undefined, tx)[0]!;
    });
  },

  /** PLANNED → SKIPPED; every focus row stays planned-not-trained. */
  async skip(sessionId: string, database: Db = getDb()): Promise<SessionSummary> {
    return setStatus(sessionId, 'PLANNED', 'SKIPPED', database);
  },

  /** SKIPPED → PLANNED. */
  async undoSkip(sessionId: string, database: Db = getDb()): Promise<SessionSummary> {
    return setStatus(sessionId, 'SKIPPED', 'PLANNED', database);
  },

  async getDetail(sessionId: string, database: Db = getDb()): Promise<SessionDetail> {
    return detailSync(sessionId, database);
  },

  /**
   * Everything Home renders, in one read (F-22, R1-04 partition by local date). Suggestions use
   * `progression.overview` (PS-06); `now` (ISO UTC) defaults to the runtime clock.
   */
  async home({ today, now }: { today: string; now?: string }, database: Db = getDb()): Promise<HomeData> {
    return homeSync(today, database, now ?? runtime().now());
  },

  /** Pure target rule of Home's quick log (product-spec §6). */
  quickLogTarget(home: HomeData, sessionTypes: readonly SessionTypeRow[] = []): QuickLogTarget {
    return quickLogTarget(home, sessionTypes);
  },
};

function setStatus(
  sessionId: string,
  from: 'PLANNED' | 'SKIPPED',
  to: 'PLANNED' | 'SKIPPED',
  database: Db,
): Promise<SessionSummary> {
  const now = runtime().now();
  return Promise.resolve(
    database.transaction((tx) => {
      const s = liveSession(sessionId, tx);
      if (s.status !== from) throw new DomainError('SESSION_NOT_PLANNED');
      tx.update(sessionsTable).set({ status: to, updatedAt: now }).where(eq(sessionsTable.id, sessionId)).run();
      return summaries(eq(sessionsTable.id, sessionId), [], undefined, tx)[0]!;
    }),
  );
}

export function homeSync(today: string, database: Db, nowIso: string = runtime().now()): HomeData {
  const planned = summaries(eq(sessionsTable.status, 'PLANNED'), [asc(sessionsTable.startsAt)], undefined, database);
  const { stalePlanned, todayPlanned, nextPlanned } = partitionPlanned(planned, today);
  const recent = summaries(eq(sessionsTable.status, 'COMPLETED'), [desc(sessionsTable.startsAt), desc(sessionsTable.createdAt)], 5, database);
  const lastCompleted = recent[0] ? detailSync(recent[0].id, database) : undefined;
  const settingsMap = allSettingsSync(database);
  return compact({
    today,
    nextPlanned,
    todayPlanned,
    stalePlanned,
    recent,
    lastCompleted,
    lastUsedTypeId: lastCompleted?.sessionTypeId,
    suggestions: forPlanning({ settings: settingsMap, lastCompleted, states: progressStatesSync({ today, nowIso }, database) }),
    rank: currentRankSync(database),
  });
}
