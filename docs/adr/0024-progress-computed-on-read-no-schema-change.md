# 0024. Progress is computed on read: algorithm v1 module, window and panels, no schema change

- **Status:** accepted
- **Date:** 2026-11-01
- **Deciders:** planner (agent); panel scope ruled by the PO (R-52, 2026-11-01)
- **Decision ids:** PS-01, PS-02, PS-03, PS-04, PS-05, PS-06, PS-07, PS-21, PS-22, PS-23 / R-08, R-17, R-22, R-49, R-52
- **Source:** `docs/progress-settings/plan.md` §0 (PS-01..PS-07, PS-21..PS-23), §0.1 Q1, §4, §6, §6.6, §6.7; refines ADR 0010 and ADR 0016.

## Ruling (quoted)

> PO, 2026-11-01 · R-52 (Q1): "(a). Rank history, heatmap and gap panel all ship now."

Algorithm shape and defaults are ruled earlier: R-08, R-17, R-22 (ADR 0010) and R-49 (numeric defaults). The placement below is a planner decision.

## Context and problem

Sprint 2 ships the Progress tab: four states per focus with an explanation, plus rank history, a consistency heatmap and a planned-vs-actual gap panel. Where the numbers are computed, over which window, and whether anything is persisted, had to be fixed.

## Decision drivers

- PRODUCT §7: computed on demand, no background job, every state explains why.
- Deterministic and unit-testable: the domain must stay pure (`data.md`).
- `local_date` is fixed at write time (ADR 0016); date arithmetic in the domain would reintroduce timezone drift (CO-06).
- A panel and the explanation of the same focus must never disagree.

## Considered options

- Cache or materialise state per focus in a table: rejected, staleness on edit and an extra migration for no measured need.
- Compute in the UI: rejected, untestable and duplicated by Home.
- Pure domain functions over rows assembled by one repository read (chosen).

## Decision outcome

- **No schema change, no migration (PS-01, PS-23).** `algorithm_params`, `settings`, `sessions`, `session_focuses`, `rank_entries` already hold every input; the `drizzle-kit generate` diff stays clean.
- **Algorithm v1** lives in `mobile/src/domain/progression/v1/` (`compute.ts`, `signals.ts`, `window.ts`, `params.ts`): pure, params and `today` injected, output structured (state, rule, signal rows) with no strings; the UI maps it to i18n keys (PS-02).
- **Window** = `windowWeeks x 7` local dates ending today inclusive; later-dated sessions are outside it; same-day order by `starts_at` (PS-03). "Flagged" is the badge for the latest completed `needs_work`, never a state (PS-05, R-17).
- **Panels** are pure `aggregateConsistency` and `aggregatePlannedVsActual` in `mobile/src/domain/progression/panels/`, over `local_date`, Monday weeks (R-15); the gap panel reuses the v1 `gap` signal (PS-21, PS-22).
- One repository read, `progression.overview`, feeds Progress and Home suggestions (PS-06); the hook also subscribes to `algorithm_params`.
- Param writes are validated in the domain against the row's `min`/`max` and integer flags (PS-07).

## Consequences

- Cost grows with session count on every read; guarded by the NF-09 benchmark (< 100 ms at 500 sessions).
- Changing the algorithm is a new `progression/v2` module and a carry-over notice (ADR 0010), not a migration.
- Related: ADR 0010, ADR 0016, ADR 0017. Tests: `mobile/src/domain/progression/__tests__/`; E2E: `progress-states`, `progress-panels`, `settings-weights`.
