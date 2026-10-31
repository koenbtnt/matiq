# foundation — review 1 recheck (round 2 of 2)

Reviewer: Themis · 2026-11-01. Artefacts: `plan.md` @ c26af5d, `design.md` @ 7103704, `docs/design-system-contrast.md` (two rows appended), `.claude/rules/data.md:42` @ d0131d3. Scope: the round-1 findings and the sections the rework touched; no new scope.

## Round-1 findings

| id | status | evidence |
|---|---|---|
| R1-01 | closed | plan §4 defines every named type: `HookResult`, `SubmissionRow`/`Input` (+ `roundId?`/`note?`), `RoundRow`/`Input`, `RankEntry`, `HomeData` (+ `rank?`), `PositionDetail`, `TechniqueRow`, `TaxonomySeed` + `Seed*`. It adds `sessions.skip`/`undoSkip` with codes, `type` on `listTechniques`, and `matchedAlias` on `PositionRow`/`TechniqueRow`. One leftover type is noted as R2-02. |
| R1-02 | closed | design §7: `log.techniqueSearch.clear`, `log.notFound.cancel`, `library.error.retry`; each is also named in §4.3.3, §4.3.7 and §4.6.7. |
| R1-03 | closed | `design-system-contrast.md` has both rows: light 5.13 / 4.74, dark `#322717` 8.31 / `#2D171D` 5.64, matching my recomputation. |
| R1-04 | closed | `sessions.home` partitions PLANNED rows by `local_date`; §10 and A-19 follow; §9.1 has the 23:30 / 00:30 boundary case. |
| R1-05 | closed | §3 adds the `session_focuses` counts check and the `session_techniques` domain rule. `COUNTS_REQUIRE_ACTUAL` and `TECHNIQUE_REQUIRES_ACTUAL` are in §4 and §9.1, with copy in design §6.2. |
| R1-06 | **open (major)** | The tsconfig and the verify/CI rows exist (§6.2, §6.5, §9.1, §9.4, F-26), but the tsconfig as specified cannot pass. It sets `types: ["node"]` in `scripts/taxonomy/`, and no `node_modules` exists above that directory (`@types/node` lives only in `mobile/node_modules`), so tsc stops on TS2688 and `node:` imports do not resolve. The same project also covers `scripts/taxonomy/__tests__/`, which has no `jest` types. Fix: `"typeRoots": ["../../mobile/node_modules/@types"]`, `"types": ["node", "jest"]` (or exclude `__tests__` and type-check the tests from the mobile project). |
| R1-07 | closed | `data/taxonomy/grapple-flows/` is vendored with `SOURCE.md` (URL, commit, date, sha256, count) and `LICENSE`, plus F-14 aliases by vendored slug. |
| R1-08 | closed | T-13 is withdrawn; `predictiveBackGestureEnabled` stays `false` (design §0, §10.3; plan §0, §7.3). |
| R1-09 | closed | One hit-slop rule `(hit − v)/2` per axis and platform, applied to segments, picker chips, rating buttons and the toast action. The arithmetic checks out (36 → 4/6, 40 → 2/4, 44 → 0/2). Rating buttons are ≥ 60 wide even inside a FocusRow card. |
| R1-10 | closed | Wrapped chip rows use `rowGap` `spacing[2]` on iOS and `spacing[3]` on Android, which equals `hit − chipHeight` on each platform. It is applied in §4.3.3 and §4.3.4. |
| R1-11 | closed | plan F-18, §0.1 A-18, §8 and §15 read Home · Log · Library. Ledger mirror: R2-01. |
| R1-12 | closed | plan F-07, A-16, §13 and §14 are reworded and name the `NSURLIsExcludedFromBackupKey` module. Ledger mirror: R2-01. |
| R1-13 | closed | plan §0 work split and §7.3 list datetimepicker, `expo-haptics`, `expo-symbols` kept, and the splash colours. |
| R1-14 | closed | The `slots.start_time` check now admits 00:00–23:59 only. |
| R1-15 | closed | plan A-23 and §14 make the PO confirmation of A-23/A-70 against S-05 a close-out item. |
| R1-16 | closed | design §4.3.6: path B = 3 taps, B′ = 4. |
| R1-17 | closed | design D-A9: the draft lives as long as its toast, including the D-A11 screen-reader case. |
| R1-18 | closed | design §9 gives the reading order for Position detail, Session detail, Set-rank and the bootstrap error screen. |
| R1-19 | closed | design §8 has an R-N3 row (large-only Log, `fitToContents` Set-rank, native scrim). |
| R1-20 | closed | Skip is rendered and the gating is removed from §4.4.4, §6.4, §7 and T-14. |

**Name match, design §10.4 vs plan §4:** exact for `HookResult<T>`, `sessions.skip`/`undoSkip` → `SessionSummary` + codes, `HomeData.suggestions: Suggestion[]` (`ref`, `name`, `source`), `matchedAlias?` on `PositionRow`/`TechniqueRow`, `PositionDetail` fields, `useTechniqueSearch(query, { type? })`, `useFocusSearch` reading the setting, and the two new codes. `SubmissionRow`/`SubmissionInput` in plan §4 contain everything design §10.4 lists; the extra `roundId?`/`note?` are optional and compatible. `HomeData.rank?` and the `useCurrentRank()` the design uses both exist and agree (`RankEntry` / `RankEntry | null`). There is no mismatch.

## New findings from the rework

| id | sev | artefact · section | finding | required change | owner |
|---|---|---|---|---|---|
| R2-01 | minor | `docs/foundation/assumptions.md` | The mirror was not refreshed. A-16 still says "stays unreadable because the key is device-only", A-18 still says Home · Library · Log, and A-19/A-23 lack the reworked text. Only A-15 changed. | Mirror plan §0.1 A-16, A-18, A-19 and A-23 verbatim. | orchestrator |
| R2-02 | minor | plan §4 `settings.*` | `useSetting<K>(key): HookResult<SettingValue<K>>` names `SettingValue`, which is not defined, although §4 now claims every named type is. | Define `SettingValue<K>` as the value type `domain/settings/defaults.ts` gives key `K`. | planner |
| R2-03 | minor | plan §0.1 A-15, §15 | A-15 is marked closed because `data.md:42` was amended (d0131d3). That rule edit is a harness change, not a quoted PO ruling. The `curated` vs product-spec §4 `matiq-seed` value also still departs from the D-register. | Keep A-15 in the PO ledger as "rule aligned, PO to confirm" rather than "closed". | orchestrator |

R1-06 stays open as a major: the fix is in the file but does not work as written. Under the round-2 contract this does not fail the review. It must be corrected before the data-coder's first verify run.

REVIEW PASSED

All blockers are closed. R1-06 remains an open major, fixed by one tsconfig edit, and R2-01…R2-03 are minors.
