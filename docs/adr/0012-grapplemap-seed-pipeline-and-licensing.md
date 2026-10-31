# 0012. GrappleMap as seed source: curated core, extended tier, licence handling

- **Status:** accepted
- **Date:** 2026-10-31
- **Deciders:** PO (user)
- **Decision ids:** D-31, D-32, D-08, D-09 / R-28, R-35, R-13
- **Source:** `docs/decisions.md` Data R-28, R-35, Privacy R-28; plan §0 D-31, D-32, §11 (seed ids).

## Ruling (quoted)

> PO, 2026-10-31 · R-28: "ok do that"
>
> PO, 2026-10-31 · R-35: "if so we use them" (GrappleMap PRs 4 validator, 5 split/join, 6 format as the reference for our converter)

## Context and problem

Hand-typing a position graph is not feasible; third-party data comes with licences that constrain use and require attribution.

## Decision drivers

- Licence compliance.
- Reproducible, reviewable seed data.
- A small curated surface by default.

## Considered options

- GrappleMap (public domain) converted by our own TypeScript pipeline, aliases hand-curated from grapple-flows (CC BY 4.0), gi layer hand-authored (chosen).
- Import BJJGraph: rejected, PolyForm Noncommercial; structural reference only unless the PO licenses it.
- Copy GrappleMap tooling: rejected, reimplemented from the PR descriptions.

## Decision outcome

`scripts/taxonomy/` vendors the GrappleMap snapshot one file per record, validates, parses, canonicalises poses, derives edge types from tags then reviews them, applies the hand-maintained curated-core list and emits a versioned seed JSON under our own stable ids. Curated core (about 40-60 positions, about 150 techniques) is visible by default; the full graph is the optional extended library. GrappleMap citations seed Resources. Sources: GrappleMap (public domain), grapple-flows (CC BY 4.0, attribution shown in Settings "about and licences").

## Consequences

- Attribution screen is a release requirement.
- Updates are our own versioned taxonomy releases, not live syncs.
- Seed content for subjects (A-4) and session types is seed-file content only.
