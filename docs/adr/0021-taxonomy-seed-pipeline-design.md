# 0021. Taxonomy seed pipeline: vendored snapshot, zero-dependency converter, endpoint resolution

- **Status:** accepted — A-26, A-27, A-31, A-32, A-33 ruled R-50 (2026-11-01)
- **Rulings of 2026-11-01:** R-48 ("Q13: yes") accepts the 84.1 % endpoint-resolution deviation (CO-29); R-50 ("All are accepted as is", the PO's reply to the morning brief's §4 accept-by-default list) accepts A-26, A-27, A-31, A-32 and A-33 at their recorded defaults; nothing in this ADR remains open.
- **Date:** 2026-11-01
- **Deciders:** planner (agent) under the PO's overnight-autonomy instruction of 2026-10-31; review 1 passed 2026-11-01. The A-rows above ruled R-50 (2026-11-01); implements ADR 0012 (accepted).
- **Decision ids:** F-10, F-11, F-12, F-13, F-15 / R-28, R-35, R-29, R-33; D-31
- **Source:** `docs/foundation/plan.md` §0 F-10..F-13, F-15, §0.1 A-26, A-27, A-31..A-33, §2, §6; `mobile/src/db/seed/report.json`; verify row "converter + seed diff" at 83e6f12.

## Ruling (quoted)

ADR 0012 holds the PO rulings (R-35, 2026-10-31: "if so we use them"). The design below is planner rulings of 2026-11-01 under the PO's overnight-autonomy instruction.

## Context and problem

ADR 0012 chose GrappleMap as seed source and a converter of our own. Sprint 1 must fix its shape: how the snapshot is stored and verified, what runs the converter, how GrappleMap's pose-only transitions become edges between our named positions, and how edge types and citations are derived.

## Decision drivers

- Reproducible, reviewable output: a re-run produces an identical diff.
- No runtime dependency and no build step for a script that only emits JSON.
- GrappleMap transitions reference poses, not names; positions are the focus nodes (ADR 0014).

## Considered options

- Vendor the snapshot one file per record (`data/taxonomy/grapplemap/records/NNNN-<slug>.txt`) with `SOURCE.md` (URL, sha256, size, date); a test checks that joining the files is byte-identical to the pinned original (chosen, F-10).
- Fetch at build time: rejected, not reproducible.
- Converter in TypeScript run by Node type stripping, zero dependencies (`node scripts/taxonomy/convert.ts`), stages parse, validate, decode, canonicalise, resolve endpoints, derive types, curated overlay, emit; type-checked by `scripts/taxonomy/tsconfig.json` with `erasableSyntaxOnly`; mobile Jest `roots` includes `../scripts/taxonomy` (chosen, F-11, A-33).
- Endpoint resolution by pose canonicalisation (translation, rotation about the vertical axis, player swap, mirror, quantised key, nearest neighbour under epsilon as fallback) (chosen, F-12). Using bjj3d as a dependency: rejected, reference only.

## Decision outcome

- Unresolved endpoints drop the edge, never the node, and are counted in `mobile/src/db/seed/report.json`.
- Edge types come from tags by priority SUBMISSION > TAKEDOWN > GUARD_PASS > SWEEP > ESCAPE > TRANSITION, name keywords as fallback, `curated/edge-types.json` as the review layer. A SUBMISSION edge has `to_position_id` null with the target node kept (A-26). `bidirectional` yields two edges (A-31, source id suffix `#rev`). Placeholder names become `<from canonical> to <to canonical>` with numbered slug collisions (A-32).
- `ref:` citations become Resources of type Instructional, origin seed, plus `resource_links` per citing technique; one resource per distinct citation string (F-15, A-27) — the first fill of ADR 0013.

## Consequences

- **Measured outcome:** 1249 of 1485 transitions emitted (84.1 %) against the 95 % target; 268 of 2970 endpoints unresolved (`report.json`). The unresolved endpoints cluster into about 137 anonymous GrappleMap nodes, so epsilon tuning cannot reach the target (`docs/stack-notes.md`, GrappleMap row). Accepted for sprint 1; options for later are synthesising them as EXTENDED positions or curating them (carry-over candidate, `docs/architecture/11-risks-debt.md`).
- 602 positions, 1294 techniques, 756 citations emitted at release `2026-11-01.1`.
- CI runs the converter and fails on a diff in `mobile/src/db/seed/` or `data/taxonomy/` (F-26).
- Re-vendoring is a documented procedure: bump `SOURCE.md`, mint new ids, bump `release.json`.
- Related: ADR 0011, ADR 0012, ADR 0013, ADR 0022.
