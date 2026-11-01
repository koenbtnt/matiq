# 0003. Local-first: all data on the device in SQLite

- **Status:** accepted
- **Date:** 2026-10-31
- **Deciders:** PO (user)
- **Decision ids:** D-01 / S-02, S-03, S-12
- **Source:** `docs/decisions.md` Data S-02; plan §0 D-01; `.claude/rules/data.md` Architecture.

## Ruling (quoted)

> PO, 2026-10-31 · S-02: "Local-first on device (Recommended)"
>
> PO, 2026-10-31 · S-03: "Me first, built for publishing"

## Context and problem

matIQ v1 serves one practitioner and handles personal training data. The question is where that data lives and which layers may touch it.

## Decision drivers

- Privacy: no user data leaves the device (`.claude/rules/privacy.md`).
- Offline use in a gym (NF-10).
- Testability: domain logic and migrations must run under Jest on real SQLite.

## Considered options

- Local SQLite via `expo-sqlite` + Drizzle (chosen).
- Hosted backend (Oracle, as in sugar/cadence): rejected, no backend or account in v1.
- Key-value / document store: rejected, the model is relational (graph edges, FKs, checks).

## Decision outcome

`matiq.db` opened once in `mobile/src/db/client.ts`; Drizzle schema with generated migrations; three layers in one direction (`db` <- `repositories` <- `domain`, domain pure); live queries only in repository hooks. No backend, no authentication.

## Consequences

- Every table carries the sync seam (see ADR 0004).
- Migrations are generated, never hand-edited; each has a Jest test on `better-sqlite3` against the shipped files.
- Encryption at rest: ADR 0006. Export/import/erase: ADR 0015.
- Backup is the user's JSON export; there is no cloud copy (see ADR 0006 on OS backups).
