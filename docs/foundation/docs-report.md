# foundation — docs report

Documenter (Clio) · 2026-11-01 · generators run at a3b4ee2

| artefact | generated / written | changed? | source |
|---|---|---|---|
| docs/data-model/dictionary.md | generated | yes | node scripts/docs/gen-data-model.mjs (snapshot 0001 + descriptions.json): 21 tables, 0 undescribed |
| docs/data-model/erd.md | generated | yes | same run |
| docs/data-model/changelog.md | generated | yes | node scripts/docs/gen-changelog.mjs: 2 migrations (0000_init, 0001_foundation) |
| docs/adr/0018..0023 (6 ADRs) | written | yes | plan.md §0 F-01..F-26, §0.1, §2; assumptions.md |
| docs/adr/README.md | written | yes | index rows 0018-0023 |
| docs/architecture/05-building-blocks.md | written | yes | real layer paths, taxonomy pipeline flowchart |
| docs/architecture/06-runtime.md | written | yes | startup sequence diagram, Log Session save table |
| docs/architecture/08-crosscutting.md | written | yes | encryption, error codes, repository access, seed idempotency, testIDs, i18n, hard delete |
| docs/architecture/09-decisions.md | written | yes | index rows 0018-0023 |
| docs/architecture/11-risks-debt.md | written | yes | endpoint resolution gap, iOS backup exclusion, dev-client unverified, dev reset, curated content, fonts |
| docs/requirements/foundation.md | written | yes | plan.md §0, data-contracts.md, test-report.md |

## Verify rows (documenter @ a3b4ee2; `verify.md` is outside the documenter's edit scope, so the orchestrator may mirror these)

| check | command | result |
|---|---|---|
| data model generated | `node scripts/docs/gen-data-model.mjs` | exit 0: 21 tables, 0 undescribed; output committed |
| changelog generated | `node scripts/docs/gen-changelog.mjs` | exit 0: 2 migrations; output committed |
| Mermaid fences | grep of fence counts in architecture, requirements, erd | all even |

## Undescribed tables and columns

None. The generator reports 21 tables, 0 undescribed (owner if that changes: data-coder).

## ADR status

| ADR | Status | Why |
|---|---|---|
| 0018 | proposed | A-24, A-31 pending PO |
| 0019 | accepted | no A-row |
| 0020 | proposed | A-16, A-17 pending PO |
| 0021 | proposed | A-26, A-27, A-31, A-32, A-33 pending PO |
| 0022 | proposed | A-28, A-29 pending PO |
| 0023 | proposed | A-25 pending PO |

No PO sentence exists for any of them: each ADR's Ruling section says so and cites the planner ruling of 2026-11-01 under the PO's overnight-autonomy instruction of 2026-10-31.

## Notes for review 2

- Resolution rate 84.1 % vs the 95 % target is recorded in ADR 0021 and arc42 §11.
- Encryption on a device and all Maestro flows are INFRA UNAVAILABLE (arc42 §11, requirements header).
- `10-quality-requirements.md` and `12-glossary.md` were not touched: no new quality target or vocabulary beyond sprint 0.

DOCS COMPLETE
