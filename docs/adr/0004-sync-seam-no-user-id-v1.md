# 0004. Sync seam on every table; no user_id in v1

- **Status:** accepted
- **Date:** 2026-10-31
- **Deciders:** PO (user)
- **Decision ids:** D-02 / S-03, S-12, R-01, R-16, R-27
- **Source:** `docs/decisions.md` Product R-27, R-16; plan §0 D-02 (marked there as the planner's reading of brief prose for the `user_id` absence).

## Ruling (quoted)

> PO, 2026-10-31 · R-27: "yes" (to: v2 backend + accounts so a coach follows clients as a paid tier; v1 keeps the sync seam, versions the JSON export as the future upload format)
>
> PO, 2026-10-31 · R-16: "Ideally i can monitize this app for coaches to check in on their clients"
>
> PO, 2026-10-31 · S-03: "Me first, built for publishing"

## Context and problem

v1 has one user and no backend, but the PO intends a coach tier later (v2). Retrofitting identity and change tracking into every table later is costly; building sync now is out of scope.

## Decision drivers

- Do not paint v2 into a corner (R-27 "nothing assumes a single user forever").
- Do not build sync, an outbox or accounts before they are needed.

## Considered options

- Seam only: `id` UUID v4, `created_at`, `updated_at` (ISO UTC), `deleted_at` on every table (chosen).
- Seam plus `user_id` column now: rejected, `.claude/rules/privacy.md` and the single-user scope give it no value; a tenant column arrives by additive migration in v2.
- No seam: rejected, soft delete and stable ids are also needed for undo (R-26) and merge (R-14).

## Decision outcome

Every table has `id`, `created_at`, `updated_at`, `deleted_at`; reads filter `deleted_at IS NULL`; no hard-delete path (single exception: ADR 0015). No `user_id`, no sync code, no outbox in v1. The versioned JSON export is documented as the future upload format.

## Consequences

- The v2 backend/accounts design needs its own ADR (carry-over CO-08).
- Soft-deleted rows accumulate; a tombstone purge policy is a carry-over candidate (plan §12), a second hard-delete path if adopted.
