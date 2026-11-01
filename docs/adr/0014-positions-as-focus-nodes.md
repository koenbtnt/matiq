# 0014. A focus is {kind, ref_id}; positions and subjects for now

- **Status:** proposed (provisional per R-30)
- **Date:** 2026-10-31
- **Deciders:** PO (user)
- **Decision ids:** D-05 / R-04, R-30
- **Source:** `docs/decisions.md` Data R-30 (marked Provisional), Product R-04; plan §0 D-05.

## Ruling (quoted)

> PO, 2026-10-31 · R-30: "positions for now, but this might change later after user tests"
>
> PO, 2026-10-31 · R-04: "yes later, but one of the earlier later features" (technique-level progression)

## Context and problem

The unit that is planned, logged and scored must be chosen before the first migration, but the PO expects to revisit it after user tests.

## Decision drivers

- Avoid a migration of historical sessions if the unit changes.
- Progression computed per node.

## Considered options

- `session_focuses` / `cycle_focuses` with `focus_kind` + `focus_ref_id`, kind check POSITION|SUBJECT (chosen).
- FK to `positions` only: rejected, subjects are a ruled focus kind and the unit may change.
- Techniques as the focus now: rejected, deferred by R-04.

## Decision outcome

Provisional per R-30. v1 `check()` allows exactly POSITION and SUBJECT; the kind set is data-extensible (`.claude/rules/data.md`), so TECHNIQUE arrives in v1.x by widening the check in one migration. Techniques are catalogued and optionally attached to a session or focus row (`session_techniques`). Revisit after the first user tests; if the unit changes, a superseding ADR replaces this one.

## Consequences

- Polymorphic references cannot be FK-enforced; the repository validates `focus_ref_id` and merge operations rewrite them (ADR 0011).
- Status stays proposed until the PO confirms after user tests.
