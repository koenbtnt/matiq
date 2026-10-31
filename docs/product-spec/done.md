# product-spec — done

Sprint 0, docs-only. Branch `feature/product-spec`, PR into `develop`.

## Completed
- `docs/PRODUCT.md` §1–§12: product spec derived from `po-brief.md` (R-00…R-35, S-01…S-12); §12 register maps every ruling id to a section.
- `docs/decisions.md`: binding record, every bullet dated 2026-10-31 and tagged; R-30 provisional; assumptions referenced, never stated as ruled.
- `docs/product-spec/plan.md`: D-01…D-36 (25 architectural), §0.1 items #1–#14 all "assumed, pending PO (2026-10-31)", field-level model, API surface, edge cases, sprint sequence.
- `docs/product-spec/assumptions.md`: A-1…A-14, one row each with what changes if the PO rules otherwise.
- `docs/product-spec/design.md`: no UI this sprint; design-system requests per target sprint.
- ADRs 0003–0017 (0014 proposed/provisional per R-30); arc42 01, 02, 03, 05, 07, 08, 09, 10, 12 in full, 04, 06, 11 partial; `docs/requirements/product-spec.md` (US-01…US-12, Gherkin).
- Generators `gen-data-model.mjs` and `gen-changelog.mjs` run (exit 0, `app_meta` only, no diff) — `verify.md`.
- Reviews: review 1 FAILED → recheck PASSED (+ follow-up R-01); review 2 PASSED → follow-up pass on F-01…F-05.
- `origin/develop` (design intake PR #3) merged into the branch at 95d82d0.

## Skipped
- data-coder, frontend-coder, tester (handoff steps 4–6): docs-only sprint, nothing to build or test; no `mobile/`, `e2e/`, `design-system/`, `scripts/` changes.
- No tsc / jest / Maestro runs.

## Carry-over
- Appended to `docs/carry-over.md`: CO-18…CO-27. CO-02 (CLAUDE.md "Next step"), CO-15 (fonts) and CO-16 (DSR rulings) remain open.
- Notes: commit trailers before the coordinator's 2026-10-31 ruling are left as pushed (some read "Fable 5.1" for non-Fable agents); from then on each agent names its actual model. `verify.md` rows were transcribed by the orchestrator because the path guard denied the documenter that file.
