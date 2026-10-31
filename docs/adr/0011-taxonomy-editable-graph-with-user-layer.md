# 0011. Taxonomy as an editable graph with aliases and a user layer

- **Status:** accepted
- **Date:** 2026-10-31
- **Deciders:** PO (user)
- **Decision ids:** D-06, D-07, D-08, D-09, D-25, D-36 / R-13, R-14, R-23, R-34, R-28
- **Source:** `docs/decisions.md` Data R-13, R-14, R-23, R-34; plan §0 D-06..D-09, D-25, D-36, §6.

## Ruling (quoted)

> PO, 2026-10-31 · R-13: "a solid framework where we can gather all position BJJ information from … Idealy this framework can be updated etc and is a framework that works like a graph."
>
> PO, 2026-10-31 · R-14: "Yes"
>
> PO, 2026-10-31 · R-23: "yes ok."
>
> PO, 2026-10-31 · R-34: "Keep in mind that some positions have multiple names"

## Context and problem

The Library must be updatable from curated releases yet fully editable by the user, without a release ever destroying the user's work.

## Decision drivers

- Graph shape for a later visualisation with progression overlay.
- Multiple names per position.
- History must survive rename, delete and merge.

## Considered options

- Positions = nodes, techniques = typed edges (submissions terminal), `aliases` keyed `{target_kind, target_id}` (chosen).
- Flat technique list with tags: rejected, loses structure.
- Taxonomy as TypeScript enums: rejected by `.claude/rules/data.md`.

## Decision outcome

Imported rows carry `origin` (seed|user), `source`, `source_id`, `source_version`, `user_edited_at`. A release upserts only `origin = seed` rows with `user_edited_at IS NULL AND deleted_at IS NULL`; user rows are never touched. Seed ids are minted once by the converter and fixed in the seed file (a recorded deviation from repository-minted ids, plan §11); `app_meta.taxonomy_release` records the installed release. `tier` (CORE|EXTENDED) controls visibility via `library.showExtended`; `applies_to` (GI|NOGI|BOTH) on techniques. Rename follows the id; delete is soft and hides from pickers; merge moves every reference to the survivor and is logged in `taxonomy_merges` for undo.

## Consequences

- Assumed, pending PO (A-3): aliases also apply to techniques.
- Assumed, pending PO (A-9): a rename keeps the old name as an alias (pre-ticked option).
- Edits to imported fields freeze a row against re-import; `notes`, resource status and user aliases do not.
- Graph layout data is not stored in v1.
