# 0022. Curated layer, append-only id registry and idempotent first-launch seed

- **Status:** proposed — pending PO (A-28, A-29)
- **Date:** 2026-11-01
- **Deciders:** planner (agent) under the PO's overnight-autonomy instruction of 2026-10-31; review 1 passed 2026-11-01. PO confirmation pending for A-28 and A-29; also awaits PO review of the curated core content (names, aliases, parents, edge types).
- **Decision ids:** F-14, F-16 / R-28, D-07, D-08; A-4, A-14, A-28, A-29
- **Source:** `docs/foundation/plan.md` §0 F-14, F-16, §0.1 A-28, A-29, §2, §6, §14; `docs/foundation/review-1.md` R1-07.

## Ruling (quoted)

ADR 0011 and ADR 0012 hold the PO rulings. The layout below is planner rulings of 2026-11-01 under the PO's overnight-autonomy instruction; it makes sprint 0's assumption A-14 ("seed ids minted by the converter") concrete as A-29.

## Context and problem

The raw graph is large; the product shows a curated core by default (ADR 0012). Seed ids must be stable across releases so user edits, focuses and sessions keep pointing at the same rows (ADR 0011). The first launch must populate an empty, encrypted database exactly once, and a later taxonomy release must not clobber user edits.

## Decision drivers

- Stable ids; no hash-derived ids that change with a name.
- Hand-curated content reviewable as data, not code.
- Idempotent seeding: running it twice changes nothing.

## Considered options

- Data under `data/taxonomy/curated/`: `core.json` (about 40-60 positions, about 150 techniques), `aliases.json` (maps vendored grapple-flows slugs to our source ids), `edge-types.json`, `name-rules.json`, `gi.json` (starter, at least 8 gi techniques, A-28), `catalog.json` (6 session types, 6 subjects, 5 resource types), `ids.json`, `release.json` (chosen, F-14).
- The grapple-flows data is vendored and pinned (`data/taxonomy/grapple-flows/`, `SOURCE.md`, `LICENSE`, CC BY 4.0, `ATTRIBUTION.md`) so aliases cite fixed slugs.
- Ids: `curated/ids.json` registry `(source, source_id) -> UUID`, append-only, minted only with `--mint`; check mode fails on a missing id (chosen, A-29). Hash ids: rejected.
- Seeding in a migration: rejected, taxonomy releases are data versions (ADR 0011), not schema.

## Decision outcome

`seed.ensureSeeded(db, { now })` is the only seed entry point. It inserts catalog rows, imports the taxonomy release, and inserts `settings` and `algorithm_params` v1 rows. It is idempotent through `(source, source_id)` and `app_meta.taxonomy_release`. Only unedited `origin = seed` rows are updated by a later release (ADR 0011).

## Consequences

- A re-run produces no change; the bootstrap calls it on every launch cheaply (ADR 0019).
- The ids registry grows monotonically and is reviewed in diffs.
- Content review by the PO (names, aliases, parents, edge types) and gi-layer growth are carry-over items; the attribution screen remains a release gate (ADR 0012).
- Report counts (no content): 45 core positions, 602 positions, 91 aliases.
- Related: ADR 0011, ADR 0012, ADR 0021.
