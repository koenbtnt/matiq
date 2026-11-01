# progress-settings — review 2 (code, tests, docs)

Reviewer: Themis · HEAD 2e796c2 vs origin/develop · 165 files. Commits after 0e8d4db touch only `e2e/` and `docs/` (checked with the diff stat; nothing under `mobile/drizzle/`).

## Checklist
1 Requirements: met; PS-01..24 and R-52..56 are traced in `plan.md §0.1` and `test-report.md`. 2 Data layer: no schema change, `descriptions.json` complete (21 tables, none undescribed), domain purity intact. 3/3b Frontend and UX: `testids.test.ts` plus 13 flows. 4 Privacy: clean. 5 Tests: present for both layers. 6 Runtime: green at HEAD. 7 Docs: present.

## Verification provenance
| Check | Source | Status |
|---|---|---|
| tsc, Jest (UTC + Europe/Amsterdam, 1726), adherence | frontend-coder @ 0e8d4db | accepted; later commits are docs/e2e only |
| drizzle no-diff | data-coder @ f39172c | accepted; `mobile/drizzle/` absent from the diff |
| tokens check, expo-doctor 20/20, run:ios, smoke, xattr x4 | frontend-coder @ 169fe7e | accepted; only JS changed afterwards |
| Maestro 13/13 | tester @ 416dd64 | accepted; not re-run |
| Re-run by me | none | nothing stale or missing |

## Rulings on the six items
1. **Accepted, no coverage lost.** The 5 removed test lines are the `rank.current(db)` / `rank.history(db)` call sites, rewritten to `({}, db)` (`settingsRank.test.ts:43-48`) with added scale cases (`:129-154`). The hidden-technique test is widened to both endpoints, from and to (`taxonomy.test.ts:93-97`). No `validateRank` line was removed (`domainPure.test.ts:64-69` is untouched).
2. **Accepted, all additive and documented in `data-contracts.md`.** `TechniqueDetail.removed`, `AboutMeta`, `rank({scale?})` and `RESOURCE_NOT_FOUND` on link/unlink all fit the registry (`errors.ts:53`, `en.json:106`). `inputs` ignoring `today` is a dead parameter (see R2-05).
3. **Accepted.** The seam keeps `src/db` free of any import from `modules/` (`backup.ts` header). Failures never block bootstrap, and the log carries sandbox URIs only (`bootstrap.ts:127`). `allowBackup: false` is set (`app.json:28`). Overrides are installed at module scope before the first bootstrap (`_layout.tsx:21`) and reach reset (data-coder test). Only simulator xattr evidence exists (R2-03).
4. **Carry-over row needed** (R2-02).
5. **Accepted.** `decisions.md:99-103` carries R-52..R-56, dated 2026-11-01, and each PO quote matches `plan.md §0.1` (lines 79-83) verbatim. The commit 2e796c2 touched `decisions.md` and `progress.md` only. PS-24 is correctly kept out as a planner decision (ADR 0027).
6. **Acceptable with one reservation.** `hide-devtools-button.yaml` is dev-client only and Maestro is local only (CO-01). The `pressKey: Enter` workaround hides a possible keyboard-covers-Save problem (R2-04).

## Findings
| id | sev | owner | file:line | defect |
|---|---|---|---|---|
| R2-01 | M | documenter | `docs/carry-over.md` (untouched in the diff) | Not updated this sprint. Close CO-28 (module shipped), CO-35 (About attribution), CO-42 (`headerBackButtonDisplayMode: 'minimal'`, `_layout.tsx:73`). Add the R-53 line that `plan.md:489` promises ("sprint 3: session-type and resource-type list editors"). |
| R2-02 | M | frontend-coder | `mobile/src/features/progress/ProgressScreen.tsx:38` | The 169fe7e crash class (`data!` inside a closure hoisted by the React Compiler) has no guard: the repo has no ESLint and the fix is only noted in `stack-notes.md`. Propose a CO row: add the React Compiler lint rule, or ban `!` on live data inside render closures in the frontend.md review checklist. |
| R2-03 | M | PO | `mobile/modules/matiq-backup/ios/MatiqBackupModule.swift` | Exclusion is proven on the simulator only. It has no unit test and no on-device or restore check. CO-25/CO-28 remain a release gate. **PO decision:** on-device xattr check plus a backup/restore test before the first TestFlight. |
| R2-04 | m | frontend-coder | `e2e/maestro/flows/features/library-edit.yaml:33,72`, `library-merge.yaml:28,44,113,181`, `settings-weights.yaml:37,71` | The tester dismisses the keyboard because it covers Save and Merge in the edit sheet. If this is real on a device, it breaks one-handed use (R-26). Confirm keyboard avoidance (or a pinned action bar) in `LibraryEditSheet` and the merge panel. **PO decision** if it is judged cosmetic. |
| R2-05 | m | data-coder | `mobile/src/repositories/progression.ts` (`inputs({ today })`) | The `today` parameter is unused (speculative). Drop it from the signature and `data-contracts.md`, or keep it with a comment; low risk. |
| R2-06 | m | tester | `test-report.md` | `progress-states`, `settings-rank-theme` and `settings-weights` have never passed inside a whole-suite run, and the suite predates the flow fixes. Run the whole suite once at the sprint-close gate; verify the order dependence of the seed subflow. |
| R2-07 | m | frontend-coder | `docs/progress-settings/verify.md` | `sync-design-tokens --check` and expo-doctor were last run at 169fe7e, before 0e8d4db; the later diff touches no token or config file. Accepted, but add the rows at the final sha. |

No B findings. The documentation set (ADR 0024..0028, arc42, dictionary, requirements, docs-report) is complete and regenerated; no hand-edited generated files found.

**Proposed carry-over rows:** (a) the lint guard from R2-02 (frontend-coder); (b) on-device backup-exclusion verification before release (data-coder, PO gate; extends CO-28); (c) the whole-suite re-run at close (tester); (d) the R-53 sprint-3 line for the list editors (planner).

REVIEW PASSED
Round 1 found no blocking defects; R2-01 and R2-02 are due before the PR merges, and R2-03 needs the PO.
