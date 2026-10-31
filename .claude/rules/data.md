---
paths:
  - "mobile/src/db/**"
  - "mobile/src/domain/**"
  - "mobile/src/repositories/**"
  - "mobile/drizzle/**"
  - "mobile/drizzle.config.ts"
---
# Data layer — expo-sqlite, Drizzle, domain and repositories — binding

Derived from the decisions of 2026-10-31 (local-first; real-SQLite tests; generated migrations;
sync seam). Loads when a data-layer file is touched.

## Architecture

- **Local-first, no backend.** The only data store is the SQLite database `matiq.db`, opened once in `mobile/src/db/client.ts` through `expo-sqlite` and queried through Drizzle (`drizzle-orm/expo-sqlite`).
- Three layers, one direction: `mobile/src/db/` (schema, client, migrations) ← `mobile/src/repositories/` (all reads and writes, typed against the shared `Db` type) ← `mobile/src/domain/` (pure business logic; imports neither). The UI imports repositories and their hooks, never `drizzle-orm` or `expo-sqlite`.

## Hard rules (each one is review-blocking)

- **Schema-first.** Tables are declared in `mobile/src/db/schema/*.ts` (`sqlite-core`). Migrations are generated with `npx drizzle-kit generate --name <slug>`; the generated SQL, snapshots and journal are **never hand-edited** (the path guard denies snapshot/journal files; CI runs `npx drizzle-kit generate && git diff --exit-code -- drizzle/`). Hand-written SQL only via `npx drizzle-kit generate --custom --name custom_<slug>`.
- **Every migration has a Jest test** that applies the whole chain on a fresh database and asserts the resulting shape (tables, columns, constraints). Tests run on `better-sqlite3` against the same `mobile/drizzle/` files the app ships.
- **Sync seam on every table:** `id` text primary key (UUID v4 from `expo-crypto`, generated in the repository), `created_at` and `updated_at` as ISO-8601 UTC text, `deleted_at` nullable for soft delete. **No hard-delete code path**; every read filters `deleted_at IS NULL`. No sync code and no outbox in v1 — the seam is the whole commitment.
- **Constraints live in the schema:** a `check()` for every enum and range. Invariants carried from the legacy model: tag type ∈ POSITION | SUBJECT (POSITION ⇒ a position id), `needs_work ⇒ is_actual`, rating 1–5, technique `to_position` null iff type SUBMISSION, a session completes only with at least one actual focus row (domain rule with a test).
- **Taxonomy is data, not code.** Positions, techniques, tags and algorithm weights are user-editable rows; never a TypeScript enum or constant the user cannot change. Edits keep history intact (rename or soft delete; a merge is a domain operation with a test).
- **Domain purity:** nothing in `mobile/src/domain/` imports from `db/`, `repositories/`, React, Expo or the network; no `Date.now()`, `Math.random()` or crypto calls — the clock and id source are parameters. Every domain function has unit tests. The progression algorithm's weights and thresholds are inputs read from the database, never constants.
- **`descriptions.json` is complete:** every table and column has an entry in `mobile/src/db/schema/descriptions.json` (purpose, unit, allowed values). The Jest test fails otherwise; the documenter generates the data dictionary from it.
- **Errors are typed:** a business-rule failure throws `DomainError` with a code from `mobile/src/domain/errors.ts` (the one registry); the UI maps codes to i18n keys. Never a bare `throw new Error('…')` for a business rule.
- **Live queries** (`useLiveQuery`) live in repository hooks only.

## Working on the data layer

- Inputs: `plan.md §0` names the fields; `design.md §10` names what the UI consumes. `docs/<sprint-slug>/data-contracts.md` is the contract the frontend integrates against — write it as soon as the schema compiles.
- Verify before any completion signal, from `mobile/`: `npx tsc --noEmit` · `npx jest --watchAll=false` · `npx drizzle-kit generate && git diff --exit-code -- drizzle/` (no schema changes, clean diff). Record the rows in `verify.md`.
- Catalog seed data (positions, techniques, tags) is an idempotent repository call on first launch; fictional notes only.
