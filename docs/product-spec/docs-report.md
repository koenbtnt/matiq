# product-spec — docs report

Documenter: documenter-ps · 2026-10-31 · base sha 7812738 · first run (backfill). Result: DOCS COMPLETE (verification rows delegated, see below).

| Artefact | Generated / written | Changed? | Source |
|---|---|---|---|
| `docs/data-model/dictionary.md`, `erd.md` | generated (`node scripts/docs/gen-data-model.mjs`, exit 0) | no (app_meta only) | Drizzle snapshot 0000 + `descriptions.json` |
| `docs/data-model/changelog.md` | generated (`node scripts/docs/gen-changelog.mjs`, exit 0) | no | `_journal.json` |
| `docs/adr/0003`-`0017` (15 ADRs) + `README.md` index | written | yes | `docs/decisions.md`, plan §0 |
| `docs/architecture/README.md`, 01, 02, 03, 05, 07, 08, 09, 10, 12 | written (full) | yes | PRODUCT, decisions, `.claude/rules` |
| `docs/architecture/04`, 06, 11 | written (partial; pending items marked) | yes | PRODUCT §4/§7, plan §12, assumptions |
| `docs/requirements/product-spec.md` | written (12 stories, Gherkin, R-ids) | yes | PRODUCT §4/§6/§7 |

## Verification rows (delegated)

The path guard denies this agent the sprint's verification ledger files, so the block below is for the Orchestrator to append there:

### documenter @ 7812738 — 2026-10-31

| Command | Exit | Notes |
|---|---|---|
| `node scripts/docs/gen-data-model.mjs` | 0 | 1 table (`app_meta`), 0 undescribed; output identical to HEAD |
| `node scripts/docs/gen-changelog.mjs` | 0 | 1 migration; output identical to HEAD |

## ADR to D-id map

| ADR | Status | D-ids |
|---|---|---|
| 0003 local-first | accepted | D-01 |
| 0004 sync seam | accepted | D-02 |
| 0005 Expo / dev-client | accepted | D-01 |
| 0006 SQLCipher | accepted (A-10, A-11 pending PO) | D-22 |
| 0007 Maestro | accepted | D-01 |
| 0008 design artifact | accepted | D-34 |
| 0009 i18n | accepted | D-33 |
| 0010 progression v1 | accepted | D-16, D-17 |
| 0011 taxonomy graph | accepted | D-06, D-07, D-08, D-09, D-25, D-36 |
| 0012 GrappleMap pipeline | accepted | D-31, D-32 (+D-08, D-09) |
| 0013 Resources | accepted | D-28 |
| 0014 focus nodes | proposed (provisional, R-30) | D-05 |
| 0015 export/import/erase | accepted | D-21 |
| 0016 time model, settings vs app_meta | accepted | D-26, D-35 |
| 0017 planning and logging model | accepted | D-04, D-10..D-15, D-19 |

All 25 architectural D-ids are covered. ADRs 0015-0017 were added for D-21, D-26/D-35 and D-04/D-10..15/D-19, which fit none of the named groups.

## Undescribed tables and columns

None (only `app_meta`, fully described). Owner if this changes: data-coder.

## Blocked

None. Pending PO, carried as assumptions and not as rulings: A-1…A-11 (`docs/product-spec/assumptions.md`); ADR 0006 states A-10/A-11 as pending. The planner's parallel wording fix for the keychain class was not present at this sha; ADR 0006 cites A-11 and plan D-22 as written.
