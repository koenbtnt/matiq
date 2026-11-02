import { and, desc, eq, isNotNull, isNull } from 'drizzle-orm';

import { getDb, type Db } from '../db/client';
import { rankEntries } from '../db/schema';
import { DomainError } from '../domain/errors';
import { currentOf, validateRank } from '../domain/rank/validate';
import { localDateOf } from '../domain/session/localDate';
import type { RankEntry, RankInput, RankScale } from './contracts';
import { compact, opt } from './internal';
import { deviceTimeZone, runtime } from './runtime';
import { getSettingSync } from './settings';

type Row = typeof rankEntries.$inferSelect;

const toEntry = (r: Row): RankEntry =>
  compact({ id: r.id, scale: r.scale, belt: r.belt, stripes: r.stripes, awardedOn: r.awardedOn, note: opt(r.note) });

/** The scale to read: the given one, else the `rank.scale` setting (PS-11). */
const scaleOf = (scale: RankScale | undefined, database: Db): RankScale =>
  scale ?? (getSettingSync('rank.scale', database).value as RankScale);

function liveRows(scale: RankScale, database: Db): Row[] {
  return database
    .select()
    .from(rankEntries)
    .where(and(isNull(rankEntries.deletedAt), eq(rankEntries.scale, scale)))
    .orderBy(desc(rankEntries.awardedOn), desc(rankEntries.createdAt))
    .all();
}

const today = (at: string) => localDateOf(at, deviceTimeZone());

function rowById(id: string, database: Db): Row | undefined {
  return database.select().from(rankEntries).where(eq(rankEntries.id, id)).get();
}

/** Current entry of the active scale (Home's rank card). */
export function currentRankSync(database: Db, scale?: RankScale): RankEntry | undefined {
  const row = currentOf(liveRows(scaleOf(scale, database), database));
  return row ? toEntry(row) : undefined;
}

export const rank = {
  /** Adds a rank entry; `awardedOn` must not be after today (device zone, runtime clock). */
  async add(input: RankInput, database: Db = getDb()): Promise<RankEntry> {
    const { now, newId } = runtime();
    const at = now();
    validateRank(input, today(at));
    const row = database
      .insert(rankEntries)
      .values({
        id: newId(),
        scale: input.scale,
        belt: input.belt,
        stripes: input.stripes,
        awardedOn: input.awardedOn,
        note: input.note ?? null,
        createdAt: at,
        updatedAt: at,
      })
      .returning()
      .get();
    return toEntry(row);
  },

  /** Re-validates belt-for-scale, stripes and date (plan §8.2) and rewrites a live entry. */
  async update(id: string, input: RankInput, database: Db = getDb()): Promise<RankEntry> {
    const at = runtime().now();
    return database.transaction((tx) => {
      const row = rowById(id, tx);
      if (!row || row.deletedAt) throw new DomainError('RANK_NOT_FOUND');
      validateRank(input, today(at));
      return toEntry(
        tx
          .update(rankEntries)
          .set({ scale: input.scale, belt: input.belt, stripes: input.stripes, awardedOn: input.awardedOn, note: input.note ?? null, updatedAt: at })
          .where(eq(rankEntries.id, id))
          .returning()
          .get(),
      );
    });
  },

  /** Soft-deletes a live entry (undo toast). */
  async softDelete(id: string, database: Db = getDb()): Promise<RankEntry> {
    const at = runtime().now();
    return database.transaction((tx) => {
      const row = rowById(id, tx);
      if (!row || row.deletedAt) throw new DomainError('RANK_NOT_FOUND');
      return toEntry(tx.update(rankEntries).set({ deletedAt: at, updatedAt: at }).where(eq(rankEntries.id, id)).returning().get());
    });
  },

  /** Restores a soft-deleted entry; a live entry is returned unchanged. */
  async undoDelete(id: string, database: Db = getDb()): Promise<RankEntry> {
    const at = runtime().now();
    return database.transaction((tx) => {
      const row = rowById(id, tx);
      if (!row) throw new DomainError('RANK_NOT_FOUND');
      if (!row.deletedAt) return toEntry(row);
      return toEntry(
        tx.update(rankEntries).set({ deletedAt: null, updatedAt: at }).where(and(eq(rankEntries.id, id), isNotNull(rankEntries.deletedAt))).returning().get()!,
      );
    });
  },

  /** Latest live entry of `scale` (default: the `rank.scale` setting) by awarded date, then creation. */
  async current({ scale }: { scale?: RankScale } = {}, database: Db = getDb()): Promise<RankEntry | undefined> {
    return currentRankSync(database, scale);
  },

  /** Live entries of `scale` (default: the `rank.scale` setting), newest first. */
  async history({ scale }: { scale?: RankScale } = {}, database: Db = getDb()): Promise<RankEntry[]> {
    return liveRows(scaleOf(scale, database), database).map(toEntry);
  },
};
