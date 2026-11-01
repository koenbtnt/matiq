import { and, eq, inArray, isNull } from 'drizzle-orm';

import { getDb, type Db } from '../db/client';
import { rounds as roundsTable, submissions as submissionsTable, techniques } from '../db/schema';
import { DomainError } from '../domain/errors';
import type { SubmissionInput, SubmissionRow } from './contracts';
import { compact, opt } from './internal';
import { runtime } from './runtime';

/** Throws TECHNIQUE_NOT_FOUND unless every id is a live technique. */
export function assertTechniquesExist(ids: readonly (string | undefined)[], tx: Db): void {
  const wanted = [...new Set(ids.filter((x): x is string => !!x))];
  if (wanted.length === 0) return;
  const found = new Set(
    tx.select({ id: techniques.id }).from(techniques).where(and(inArray(techniques.id, wanted), isNull(techniques.deletedAt))).all().map((r) => r.id),
  );
  const missing = wanted.find((id) => !found.has(id));
  if (missing) throw new DomainError('TECHNIQUE_NOT_FOUND', { techniqueId: missing });
}

/** Live submissions of a session (all rounds), with technique names. */
export function listSubmissionsSync(sessionId: string, tx: Db): SubmissionRow[] {
  return tx
    .select({
      id: submissionsTable.id,
      direction: submissionsTable.direction,
      techniqueId: submissionsTable.techniqueId,
      techniqueName: techniques.name,
      roundId: submissionsTable.roundId,
      note: submissionsTable.note,
    })
    .from(submissionsTable)
    .leftJoin(techniques, eq(techniques.id, submissionsTable.techniqueId))
    .where(and(eq(submissionsTable.sessionId, sessionId), isNull(submissionsTable.deletedAt)))
    .orderBy(submissionsTable.createdAt, submissionsTable.id)
    .all()
    .map((r) =>
      compact({
        id: r.id,
        direction: r.direction,
        techniqueId: opt(r.techniqueId),
        techniqueName: opt(r.techniqueName),
        roundId: opt(r.roundId),
        note: opt(r.note),
      }),
    );
}

/**
 * Replace-set of the submissions in one scope — session level (`roundId` null) or one round:
 * rows with an `id` of that scope are updated, rows without are inserted, live rows of the scope
 * missing from `rows` are soft-deleted. Sync; the caller supplies the transaction.
 */
export function upsertSubmissionsSync(
  sessionId: string,
  scopeRoundId: string | null,
  rows: readonly SubmissionInput[],
  now: string,
  tx: Db,
): void {
  if (scopeRoundId) {
    const round = tx
      .select({ id: roundsTable.id })
      .from(roundsTable)
      .where(and(eq(roundsTable.id, scopeRoundId), eq(roundsTable.sessionId, sessionId), isNull(roundsTable.deletedAt)))
      .get();
    if (!round) throw new DomainError('ROUND_NOT_IN_SESSION');
  }
  for (const r of rows) {
    if (!['LANDED', 'TAKEN'].includes(r.direction)) throw new DomainError('SUBMISSION_DIRECTION_INVALID');
    if (r.roundId !== undefined && r.roundId !== scopeRoundId) throw new DomainError('ROUND_NOT_IN_SESSION');
  }
  assertTechniquesExist(rows.map((r) => r.techniqueId), tx);

  const scope = and(
    eq(submissionsTable.sessionId, sessionId),
    scopeRoundId ? eq(submissionsTable.roundId, scopeRoundId) : isNull(submissionsTable.roundId),
    isNull(submissionsTable.deletedAt),
  );
  const existing = new Set(tx.select({ id: submissionsTable.id }).from(submissionsTable).where(scope).all().map((r) => r.id));
  const keep = new Set<string>();
  for (const r of rows) {
    const values = { direction: r.direction, techniqueId: r.techniqueId ?? null, note: r.note ?? null, updatedAt: now };
    if (r.id && existing.has(r.id)) {
      keep.add(r.id);
      tx.update(submissionsTable).set(values).where(eq(submissionsTable.id, r.id)).run();
    } else if (r.id) {
      throw new DomainError('ROUND_NOT_IN_SESSION');
    } else {
      tx.insert(submissionsTable)
        .values({ ...values, id: runtime().newId(), sessionId, roundId: scopeRoundId, createdAt: now })
        .run();
    }
  }
  const drop = [...existing].filter((id) => !keep.has(id));
  if (drop.length) tx.update(submissionsTable).set({ deletedAt: now, updatedAt: now }).where(inArray(submissionsTable.id, drop)).run();
}

export const submissions = {
  /** Session-level submissions of `sessionId` replaced by `rows` (sprint 3 also calls it per round). */
  async upsert(sessionId: string, rows: SubmissionInput[], database: Db = getDb()): Promise<SubmissionRow[]> {
    const now = runtime().now();
    return database.transaction((tx) => {
      upsertSubmissionsSync(sessionId, null, rows, now, tx);
      return listSubmissionsSync(sessionId, tx).filter((s) => s.roundId === undefined);
    });
  },
};
