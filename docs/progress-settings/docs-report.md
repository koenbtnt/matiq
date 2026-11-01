# progress-settings — docs report

Regenerated at HEAD 7053331 (generators run, no hand edits). **Blocked row: `docs/decisions.md` R-52..R-56 — outside the documenter's path guard; the orchestrator or PO commits the text below.**

| Artefact | Generated / written | Changed? | Source |
|---|---|---|---|
| `docs/data-model/dictionary.md` | generated (`gen-data-model.mjs`) | yes, `app_meta` description (backup_exclusion keys) | snapshot + `descriptions.json` |
| `docs/data-model/erd.md` | generated | no (21 tables) | snapshot |
| `docs/data-model/changelog.md` | generated (`gen-changelog.mjs`) | no (2 migrations; none this sprint) | `_journal.json` |
| `docs/adr/0024` Progress computed on read | written | new | PS-01..07, PS-21..23, R-52 |
| `docs/adr/0025` Merge, versioned undo | written | new | PS-12..14, R-14, R-26 |
| `docs/adr/0026` Backup exclusion seam | written | new | PS-17, R-39 |
| `docs/adr/0027` Name uniqueness | written | new; planner decision, not a ruling | PS-24 |
| `docs/adr/0028` Five-tab shell, theme override | written | new | PS-09, PS-10, R-54, R-56 |
| `docs/adr/0020` | Status line only | yes | implemented by 0026 |
| `docs/adr/README.md`, `docs/architecture/09-decisions.md` | written | yes (0024..0028) | ADR files |
| `docs/architecture/05` (C4 Container + sprint 2 table + flowchart), `06`, `07`, `08`, `10`, `11`, `12`, `README` | written | yes | plan §0, test-report |
| `docs/requirements/progress-settings.md` | written | new (US-P01..P09, Gherkin, flow map) | plan §0, `test-report.md` |
| `docs/decisions.md` R-52..R-56 | **not written (guard)** | blocked | plan §0.1 |

## Undescribed
None: 21 tables, 0 undescribed tables or columns.

## Proposed `docs/decisions.md` entries (next free ids; R-51 is the last)
- 2026-11-01 · R-52 · Progress secondary panels (plan Q1): rank history, consistency heatmap and planned-vs-actual gap panel all ship in sprint 2 (not the planner's default). "(a). Rank history, heatmap and gap panel all ship now." (ADR 0024)
- 2026-11-01 · R-53 · Session-type and resource-type list editing (plan Q2) moves to sprint 3; until then pickers read the seeded lists. "(b). Session-type and resource-type list editing moves to sprint 3. Until then the pickers read the seeded lists."
- 2026-11-01 · R-54 · Profile tab (plan Q3): "(a). The Profile tab is the Settings screen: rank at the top, settings groups below, titled \"Profile\"." Tab order per R-45. (ADR 0028)
- 2026-11-01 · R-55 · Coral/red belts (plan Q4, CO-27): "(b). Coral/red belts later. No migration this sprint." CO-27 stays open.
- 2026-11-01 · R-56 · Theme override (plan Q5): "Yes, theme override ships in sprint 2." Lifts the "system theme only (21)" limit of R-44 for sprint 1's build; cross-reference R-44, R-45. (ADR 0028)
- Not a ruling: PS-24 name uniqueness is a planner decision (ADR 0027); `decisions.md` has no uniqueness bullet.

## Open items
- ADR 0014 stays proposed (R-30); unrelated to this sprint.
- Backup exclusion verified on the simulator only (ADR 0026).
