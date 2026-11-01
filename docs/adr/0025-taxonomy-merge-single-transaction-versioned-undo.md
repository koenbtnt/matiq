# 0025. Taxonomy merge as one transaction with a versioned undo payload

- **Status:** accepted
- **Date:** 2026-11-01
- **Deciders:** planner (agent); the merge-with-undo behaviour is ruled R-14 (2026-10-31) and R-26 (undoable destructive actions)
- **Decision ids:** PS-12, PS-13, PS-14 / R-14, R-26, R-50
- **Source:** `docs/progress-settings/plan.md` §0 PS-12..PS-14, §7.3, §7.4; `docs/progress-settings/review-1.md` finding B1 (session_techniques re-pointing).

## Ruling (quoted)

R-14 and R-26 are recorded in `docs/decisions.md` (ADR 0011 carries the R-14 quote). R-26: destructive actions are undoable (soft delete plus undo toast) instead of confirm dialogs. The payload format below is a planner decision.

## Context and problem

Merging two positions, techniques or subjects must move every reference to the survivor, keep history intact, and be undoable without a confirm dialog. References live in eight tables, several behind live-unique partial indexes that a naive `UPDATE` would violate.

## Decision drivers

- No data loss and no orphaned attachments; history must keep reading correctly.
- Undo must be exact, including rows that were folded, not only moved.
- Soft delete never cascades (PS-13).

## Considered options

- Hard delete the loser and rewrite references: rejected, irreversible.
- Leave the loser as a redirect row read at query time: rejected, every read pays and the graph keeps duplicates.
- One transaction that moves, folds and soft-deletes, recording a payload that reverses it (chosen).

## Decision outcome

- `mobile/src/domain/taxonomy/merge.ts` plans the moves and folds from in-memory rows (pure); `mobile/src/repositories/taxonomyMerge.ts` applies the plan in one `db.transaction()` (ADR 0019).
- Folding on live-unique collisions: keep the survivor row, OR booleans, survivor rating wins if set, counts summed, comments joined, loser row soft-deleted.
- When a loser `session_focuses` row folds into a survivor row, every live `session_techniques` row on the loser focus row is re-pointed to the survivor focus row; a collision folds the attachment and joins its note (review finding B1).
- The loser's name and aliases become survivor aliases; the loser is soft-deleted.
- `taxonomy_merges.payload` is JSON `{ v: 1, kind, fromId, intoId, loser, survivorBefore, moved[], folded[], aliasesAdded[] }`; the `v` field versions the format.
- Undo reverses from the payload and is allowed only while the merge is the latest live merge touching either id (`MERGE_NOT_LATEST`); it is surfaced as the toast Undo. `MERGE_ALREADY_UNDONE` and `MERGE_NOT_FOUND` cover the other cases.

## Consequences

- No migration: the payload lives in the existing `taxonomy_merges.payload` column.
- A payload shape change needs `v: 2` and a reader for `v: 1` while any such row exists.
- A merge can only be undone in LIFO order per row; older merges stay permanent. Export (sprint 3) must carry the table.
- Related: ADR 0011, ADR 0013, ADR 0015. Tests: `taxonomyMerge` repository tests on real SQLite; E2E: `library-merge`.
