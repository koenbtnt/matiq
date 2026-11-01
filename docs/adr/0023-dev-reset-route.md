# 0023. Dev-only database reset route for Maestro

- **Status:** accepted — A-25 ruled R-50 (2026-11-01)
- **Rulings of 2026-11-01:** R-50 ("All are accepted as is", the PO's reply to the morning brief's §4 accept-by-default list) accepts A-25 at its recorded default; nothing in this ADR remains open.
- **Date:** 2026-11-01
- **Deciders:** planner (agent) under the PO's overnight-autonomy instruction of 2026-10-31; review 1 passed 2026-11-01. A-25 ruled R-50 (2026-11-01).
- **Decision ids:** F-25 / R-12; A-25
- **Source:** `docs/foundation/plan.md` §0 F-25, §0.1 A-25, §2, §13; `.claude/rules/e2e.md`.

## Ruling (quoted)

No PO sentence. Planner ruling of 2026-11-01 under the PO's overnight-autonomy instruction of 2026-10-31. It is the second use of the hard-delete exception recorded in ADR 0015 (R-12).

## Context and problem

Maestro flows must start from a clean, seeded, encrypted database (A-25: the tester needs a file-level reset beside `clearState`).

## Decision drivers

- Independent flows (each starts from known state).
- No hard-delete path reachable in a release build beyond erase-all (ADR 0015).

## Considered options

- Route `mobile/app/dev/reset.tsx`, rendered only when `__DEV__`, otherwise a redirect to `/`; it calls `resetDatabase({ keepKey: true })` in `mobile/src/db/lifecycle.ts` (chosen).
- Rely on `clearState` only: kept as the first step of `e2e/maestro/subflows/reset.yaml`, insufficient alone.
- A debug menu in Settings: rejected, Settings does not exist yet and would ship the control.

## Decision outcome

`resetDatabase` closes the connection, deletes `matiq.db`, `-wal` and `-shm`, optionally deletes the key, then re-runs `bootstrapDatabase()`. The flows reach it by the deep link `matiq://dev/reset`. Sprint 3's `data.eraseAll` reuses the primitive with `keepKey: false`.

## Consequences

- A second hard-delete code path exists, gated by `__DEV__`; recorded in `plan.md` §13 as a deviation from `data.md`.
- The route renders only under `__DEV__`; in any other build it redirects to `/`.
- Related: ADR 0007, ADR 0015, ADR 0020.
