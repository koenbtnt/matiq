# 0027. Taxonomy name uniqueness: positions and subjects by name, techniques by edge

- **Status:** accepted
- **Date:** 2026-11-01
- **Deciders:** planner (agent). **This is a planner decision, not a PO ruling**: `docs/decisions.md` has no uniqueness bullet.
- **Decision ids:** PS-24 / PRODUCT §8, R-48
- **Source:** `docs/progress-settings/plan.md` §0 PS-24, §7.1, §13 (note on review S3); `docs/progress-settings/review-1.md` S3.

## Ruling (quoted)

None. The rule is derived from two recorded facts: `docs/PRODUCT.md` §8 defines a technique as a typed edge between positions, and R-48 ("Q13: yes", 2026-11-01) accepts the shipped seed. Measured on that seed: 164 duplicate technique names, 10 duplicate name plus from-position, 1 exact duplicate edge, 1 duplicate position name. If the PO wants technique names unique per from-position, the 10 seed rows need curation first (CO-33).

## Context and problem

Library editing needs duplicate protection, but a blanket "names are unique" rule would reject rows the seed already contains and block editing them.

## Considered options

- Names unique for every kind: contradicts the accepted seed.
- No checks: invites accidental duplicates of positions the user searches by name.
- Per-kind rule keyed to identity (chosen).

## Decision outcome

- Positions and subjects: a live canonical name (for positions also a live POSITION alias) equal case-insensitively gives `TAXONOMY_NAME_DUPLICATE`.
- Techniques: never by name. Only an exact live duplicate of (lower(name), from, to, type) is rejected.
- Checks run only when the compared fields change, so unrelated edits of the seed's duplicate rows pass.
- Implemented in `mobile/src/domain/taxonomy/edit.ts` and `repositories/taxonomyEdit.ts`.

## Consequences

- Two techniques may share a name across different from-positions; search and pickers must show the from-position (design handles it).
- Reversal path: a PO ruling plus a curation pass, then a superseding ADR.
- Related: ADR 0011, ADR 0022.
