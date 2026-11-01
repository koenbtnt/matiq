# 0019. Shared Db type, transaction-only writes and the bootstrap sequence

- **Status:** proposed — pending PO (no PO sentence exists; ratification only, no A-row)
- **Rulings of 2026-11-01:** none cover this ADR (no question in the morning brief §3 or §4 names it); R-50 ("All are accepted as is") answers the §4 list only and therefore does not ratify it; it still needs the PO's explicit ratification.
- **Date:** 2026-11-01
- **Deciders:** planner (agent) under the PO's overnight-autonomy instruction of 2026-10-31; review 1 passed 2026-11-01. No A-row applies.
- **Decision ids:** F-03, F-08, F-09 / R-24, CO-15
- **Source:** `docs/foundation/plan.md` §0 F-03, F-08, F-09, §2, §5; `docs/foundation/data-contracts.md` (conventions).

## Ruling (quoted)

No PO sentence. Planner rulings of 2026-11-01 under the PO's overnight-autonomy instruction of 2026-10-31; they implement R-24 (encryption from the foundation sprint) and the `data.md` rules on repositories.

## Context and problem

The app runs on expo-sqlite (SQLCipher) and Jest runs the same repositories on better-sqlite3. The encryption key is read asynchronously, so a module-level `openDatabaseSync` is impossible. Expo SQLite's exclusive-transaction API opens a second connection.

## Decision drivers

- Repositories tested unchanged on real SQLite in Jest.
- One connection, always keyed.
- A startup failure must be a typed, user-explainable state, not a crash.

## Considered options

- A shared base type `Db = BaseSQLiteDatabase<'sync', unknown, typeof schema>` that both drivers extend (chosen, F-03).
- Separate repository implementations per driver: rejected, duplicates logic.
- `withExclusiveTransactionAsync` for writes: rejected, it opens a second unkeyed connection (F-08).
- `db.transaction()` for every write call (chosen).

## Decision outcome

- `mobile/src/repositories/types.ts` exports `Db`; `mobile/src/db/client.ts` exports `getDb()` (throws `DB_NOT_OPEN` before bootstrap) and `setDb()`. Every repository function takes `database: Db = getDb()` as its last parameter.
- Writes use `db.transaction()` only, one transaction per write call.
- `bootstrapDatabase()` (`mobile/src/db/bootstrap.ts`): key, open, migrate, `seed.ensureSeeded`, `setDb`. The root layout holds the splash until fonts and bootstrap are ready. Failures return a code: `DB_KEY_UNAVAILABLE`, `DB_KEY_MISSING_FOR_EXISTING_DB`, `DB_KEY_REJECTED`, `DB_MIGRATION_FAILED`, `DB_SEED_FAILED`; the UI renders a bootstrap error screen from the code (copy keys `errors.<CODE>`).
- Live hooks (`mobile/src/hooks/data`, `mobile/src/repositories/hooks`) re-read on table change events; the UI never imports Drizzle.

## Consequences

- Jest covers repositories on better-sqlite3; encryption itself cannot be asserted there (ADR 0020).
- `DB_NOT_OPEN` is a bug indicator, not a user path.
- Related: ADR 0006, ADR 0020.
