import { desc, isNull } from 'drizzle-orm';

import { getDb, type Db } from '../db/client';
import { rankEntries } from '../db/schema';
import { currentOf, validateRank } from '../domain/rank/validate';
import { localDateOf } from '../domain/session/localDate';
import type { RankEntry, RankInput } from './contracts';
import { compact, opt } from './internal';
import { deviceTimeZone, runtime } from './runtime';

type Row = typeof rankEntries.$inferSelect;

const toEntry = (r: Row): RankEntry =>
  compact({ id: r.id, scale: r.scale, belt: r.belt, stripes: r.stripes, awardedOn: r.awardedOn, note: opt(r.note) });

function liveRows(database: Db): Row[] {
  return database
    .select()
    .from(rankEntries)
    .where(isNull(rankEntries.deletedAt))
    .orderBy(desc(rankEntries.awardedOn), desc(rankEntries.createdAt))
    .all();
}

export function currentRankSync(database: Db): RankEntry | undefined {
  const row = currentOf(liveRows(database));
  return row ? toEntry(row) : undefined;
}

export const rank = {
  /** Adds a rank entry; `awardedOn` must not be after today (device zone, runtime clock). */
  async add(input: RankInput, database: Db = getDb()): Promise<RankEntry> {
    const { now, newId } = runtime();
    const at = now();
    validateRank(input, localDateOf(at, deviceTimeZone()));
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

  /** Latest live entry by awarded date (then creation); undefined when none. */
  async current(database: Db = getDb()): Promise<RankEntry | undefined> {
    return currentRankSync(database);
  },

  /** All live entries, newest first. */
  async history(database: Db = getDb()): Promise<RankEntry[]> {
    return liveRows(database).map(toEntry);
  },
};
