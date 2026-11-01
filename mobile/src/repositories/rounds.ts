import { and, asc, eq, inArray, isNull } from 'drizzle-orm';

import { getDb, type Db } from '../db/client';
import { rounds as roundsTable, sessions as sessionsTable, submissions as submissionsTable } from '../db/schema';
import { DomainError } from '../domain/errors';
import { deriveAggregates } from '../domain/rounds/aggregates';
import type { RoundInput, RoundRow } from './contracts';
import { compact, opt } from './internal';
import { runtime } from './runtime';
import { listSubmissionsSync, upsertSubmissionsSync } from './submissions';

export function listRoundsSync(sessionId: string, tx: Db): RoundRow[] {
  const subs = listSubmissionsSync(sessionId, tx);
  return tx
    .select()
    .from(roundsTable)
    .where(and(eq(roundsTable.sessionId, sessionId), isNull(roundsTable.deletedAt)))
    .orderBy(asc(roundsTable.roundNo))
    .all()
    .map((r) =>
      compact({
        id: r.id,
        roundNo: r.roundNo,
        partnerBelt: opt(r.partnerBelt),
        outcome: opt(r.outcome),
        durationMinutes: opt(r.durationMinutes),
        note: opt(r.note),
        submissions: subs.filter((s) => s.roundId === r.id),
      }),
    );
}

/**
 * Replace-set of a session's rounds: rows with an `id` of this session are updated, rows without
 * are inserted, live rounds missing from `rows` are soft-deleted with their submissions; each
 * round's `submissions` replace that round's rows. Sync; the caller supplies the transaction.
 */
export function upsertRoundsSync(sessionId: string, rows: readonly RoundInput[], now: string, tx: Db): void {
  const seen = new Set<number>();
  for (const r of rows) {
    if (!Number.isInteger(r.roundNo) || r.roundNo < 1) throw new DomainError('ROUND_NO_INVALID');
    if (seen.has(r.roundNo)) throw new DomainError('ROUND_NO_DUPLICATE', { roundNo: r.roundNo });
    seen.add(r.roundNo);
  }
  const existing = new Set(
    tx
      .select({ id: roundsTable.id })
      .from(roundsTable)
      .where(and(eq(roundsTable.sessionId, sessionId), isNull(roundsTable.deletedAt)))
      .all()
      .map((r) => r.id),
  );
  for (const r of rows) if (r.id && !existing.has(r.id)) throw new DomainError('ROUND_NOT_IN_SESSION');

  const keep = new Set(rows.map((r) => r.id).filter((x): x is string => !!x));
  const drop = [...existing].filter((id) => !keep.has(id));
  if (drop.length) {
    // Soft-delete first so a reused round_no never collides with the partial unique index.
    tx.update(roundsTable).set({ deletedAt: now, updatedAt: now }).where(inArray(roundsTable.id, drop)).run();
    tx.update(submissionsTable)
      .set({ deletedAt: now, updatedAt: now })
      .where(and(inArray(submissionsTable.roundId, drop), isNull(submissionsTable.deletedAt)))
      .run();
  }
  // Two-phase renumbering avoids transient unique-index clashes when rounds swap numbers.
  for (const r of rows) if (r.id) tx.update(roundsTable).set({ roundNo: 1_000_000 + r.roundNo }).where(eq(roundsTable.id, r.id)).run();

  for (const r of rows) {
    const values = {
      roundNo: r.roundNo,
      partnerBelt: r.partnerBelt ?? null,
      outcome: r.outcome ?? null,
      durationMinutes: r.durationMinutes ?? null,
      note: r.note ?? null,
      updatedAt: now,
    };
    let id = r.id;
    if (id) tx.update(roundsTable).set(values).where(eq(roundsTable.id, id)).run();
    else {
      id = runtime().newId();
      tx.insert(roundsTable).values({ ...values, id, sessionId, createdAt: now }).run();
    }
    upsertSubmissionsSync(sessionId, id, r.submissions ?? [], now, tx);
  }
}

export const rounds = {
  /** Replaces the rounds of `sessionId` (detailed-rounds UI is sprint 3, A-20). */
  async upsert(sessionId: string, rows: RoundInput[], database: Db = getDb()): Promise<RoundRow[]> {
    const now = runtime().now();
    return database.transaction((tx) => {
      const s = tx
        .select({ id: sessionsTable.id })
        .from(sessionsTable)
        .where(and(eq(sessionsTable.id, sessionId), isNull(sessionsTable.deletedAt)))
        .get();
      if (!s) throw new DomainError('SESSION_NOT_FOUND');
      upsertRoundsSync(sessionId, rows, now, tx);
      return listRoundsSync(sessionId, tx);
    });
  },

  /** Aggregates from detailed rows; offered by the UI, never applied silently. */
  deriveAggregates,
};
