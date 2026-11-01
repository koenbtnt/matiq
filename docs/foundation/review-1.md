# foundation — review 1 (plan.md @ b6850ac, design.md @ 863da73)

Reviewer: Themis · 2026-11-01 · sprint 1. Severity: **blocker** (fix before code) · **major** (fix this round unless answered with reasons) · **minor** (recorded).

## Checklist

| item | result |
|---|---|
| Plan: whole request in v1 scope; §0 (63 lines) + §0.1; edge cases; field-level data; open questions with defaults; decisions carried (§12) | pass, except edge-case gap R1-04 |
| Plan: repository/domain API surface (function · input · output · codes) | **fail** R1-01 |
| Data rules: seam on all 20 new tables (and `app_meta`); `check()` per enum/range; taxonomy, types, params as rows; pure domain with injected `now`/`newId`/`timeZone`; `DomainError` registry; `descriptions.json`; migration test | pass (R1-05, R1-14) |
| Privacy: no network with user data, no analytics SDK, export/erase not harder (`resetDatabase` primitive), A-16 recorded in §13 | pass (R1-12) |
| Design mode: `tokens.ts:8` `designStatus = 'intake'` | pass |
| Design §0 (34 lines); 390/430, light/dark, iOS/Android; states default/pressed/focus/disabled/busy/empty/error | pass |
| A11y: roles, i18n labels incl. icon-only, ≥ 44 pt / 48 dp, reduced motion, status not by colour | **fail** R1-09, R1-10; R1-18 |
| Tokens and citations: 24 spot-checked, all say what is cited (cm:46, :49, :61, :98, :118, :144, :152, :153, :256, :270, :277, :283, :304, :433, :435, :447, :448; contrast :28, :33, :34, :39, :40; tk:11-23, :56-82; `Log:30-33`, `:56-60`, `:141`, `:155-158`, `Home:40-42`); every `size.*`/`semantic.*`/`textStyle.*` name exists in `tokens.ts` | pass |
| Consistent with RULES.md; deviations tabled | pass, except R1-19 |
| No web-only API or wide-viewport layout | pass |
| Contrast: every other pair is recorded (checked ~35 pairs); the two new pairs recomputed: light 5.13 / 4.74, dark composites `#322717` 8.31 / `#2D171D` 5.64 — correct; contrast doc does not contain them | **fail** R1-03 |
| Feasibility: `types.d.ts:491` and `:355` (detents), `sheetCornerRadius`, `expo-symbols` 58.0.4 + all 12 Android names in `symbols.json`, reanimated `useReducedMotion`, `drizzle-orm/expo-sqlite/migrator` `migrate`, `indexes.d.ts` `.where()`, `ExpoConfig.d.ts:589` `allowBackup`, `withSQLite.js` `useSQLCipher`, `defaultDatabaseDirectory`, `getRandomBytesAsync`, `web-and-config.md:96` | pass, except T-13 (R1-08) |
| Copy table: every key used in §4 is in §6 (scripted diff) | pass |
| testID table: every interactive element and list row | **fail** R1-02 |
| Domain rules visible: planned vs actual by text; needs-work/rating only on actual; save needs ≥ 1 actual; why line on suggestions | pass |
| Design-system requests: none new; artifact untouched | pass |

## Findings

| id | sev | artefact · section | finding | required change | owner |
|---|---|---|---|---|---|
| R1-01 | blocker | plan §4 | Phase A mocks are built from §4, but §4 names types it never defines (`SubmissionRow`, `RoundRow`, `SubmissionInput`, `RoundInput`, `RankEntry`, `TaxonomySeed`). It drops `sessions.skip` (product-spec plan §5:199) while §8 Home needs "Skip … undoable". It has no hook result shape, and `useHome()` serves suggestions that `sessions.home` does not return. `getPosition` has no `parent`/`children`/`description`; `matchedAlias` exists only on `FocusPickerRow`; technique search has no `type` filter. Design §10.4 lists these as "define/add/confirm", which are open questions, not a contract. | §4 settles every design §10.4 row, or rejects it with a reason: `sessions.skip`/`undoSkip` (`SESSION_NOT_FOUND`, `SESSION_NOT_PLANNED`); `HookResult<T> = { data?; error? }`; the `useHome()` shape incl. `suggestions`; the `getPosition` output; `matchedAlias` on position/technique rows; the `type` filter (or a UI filter); every named type with its fields. | planner |
| R1-02 | blocker | design §7 | Three interactive elements have no testID: the clear button of the TechniqueAttach SearchField (§4.3.3), the Library error-card retry (§4.6.7), and the Log not-found dismiss ghost (§4.3.7). | Add `log.techniqueSearch.clear`, `library.error.retry` and `log.notFound.cancel`. | designer |
| R1-03 | blocker | design §9.1 · `docs/design-system-contrast.md` | The two new pairs (warning on its tint over `bgBase`; danger on its tint over `bgBase`) exist only in design.md. R-A1 says "a new pair is computed there before it is used". The values are correct (recomputed). | Append both rows to the contrast doc's text table. The orchestrator authorises the file. | designer |
| R1-04 | major | plan §4 `sessions.home`, §10 | Gap: `nextPlanned`/`todayPlanned` need `starts_at ≥ start of today`, and `stalePlanned` needs `starts_at < now − 24 h`. Last night's unlogged plan is in no bucket the next morning, so it is invisible on Home for up to 24 h, exactly when the user wants to log it. | Partition PLANNED by `local_date`: stale `< today`, today `= today`, next = earliest `≥ today`. Add a Jest case at the boundary. | planner |
| R1-05 | major | plan §3 `session_focuses`, F-20 | F-20 says "ratings/flags/counts only on actual rows", but only rating and `needs_work` are checked. `hit_count`/`caught_count`, and `session_techniques` attached to an un-ticked focus, have neither a check nor a code. | Add `check((hit_count IS NULL AND caught_count IS NULL) OR is_actual = 1)` plus a domain code, and a rule for techniques on non-actual focuses. Otherwise narrow F-20. | planner |
| R1-06 | major | plan §6.2, §6.5, §9.1, F-26 | The converter runs on Node type stripping, which rejects non-erasable syntax, while its Jest tests compile through babel, which accepts anything. Nothing type-checks `scripts/taxonomy/` (mobile `tsc` excludes it). Tests can pass while CI `convert.ts` fails. | Add `scripts/taxonomy/tsconfig.json` (`strict`, `noEmit`, `allowImportingTsExtensions`, `erasableSyntaxOnly`) and a verify/CI row `npx tsc -p scripts/taxonomy`. | planner |
| R1-07 | major | plan §6.2, F-14 | grapple-flows is not pinned. GrappleMap gets SOURCE.md + sha256, but grapple-flows (CC BY 4.0) has only a URL in `stack-notes.md:47`. There is no commit, licence copy or record count, yet rows are emitted as `source = 'grapple-flows'` with `source_id` = its slugs. | Vendor a pinned copy plus `SOURCE.md` (URL, commit, date, sha256, LICENSE), or cite the commit in `ATTRIBUTION.md` and state that the aliases are transcribed by hand. | planner |
| R1-08 | major | design T-13, §0, §10.3 | T-13 rests on a false premise. `predictiveBackGestureEnabled: false` does not disable the system back gesture: `ExpoConfig.d.ts:605` says it "Enable[s] … the predictive back gesture … Default to false". R-N4 is met as configured. Turning it on is an untested Android behaviour change, and no Android device path exists to test it. | Drop T-13, keep `false`, and record the predictive animation as a carry-over. | designer |
| R1-09 | major | design T-02, §4.6.1 vs §9 | Segments are 36 high. "Android `hitSlop` 2" gives 40 dp, and iOS has no slop, so the iOS target is 36 pt. §9 says "hitSlop to hit". The 44-high stepper buttons and IconButtons get no Android slop at all. | State it per control: vertical slop `(hit − visual)/2`. That is 4/6 for 36-high elements and 0/2 for 44-high ones. | designer |
| R1-10 | major | design §4.3.3, §4.3.4 (wrap rows) | Chips are 36 high in wrapped rows with `gap: spacing[2]`. Their 48 dp Android slops overlap by 4 dp between rows, so neighbouring targets overlap. | Set `rowGap ≥ hit − size.chipHeight` on every wrapped chip row: `spacing[2]` on iOS, `spacing[3]` on Android. | designer |
| R1-11 | minor | plan F-18, §8, A-18 | "Home · Library · Log (centre)" contradicts itself: with three tabs, Log is at the edge. | Adopt D-A2 (Home · Log · Library) in F-18, §8 and the A-18 text. | planner |
| R1-12 | minor | plan F-07, §13, A-16 | "A backed-up file stays unreadable because the key is device-only" holds only for a restore to another device. A `…ThisDeviceOnly` item comes back on a same-device restore. | Reword. The carry-over names the fix: a local Expo module that sets `NSURLIsExcludedFromBackupKey` on `matiq.db`, `-wal` and `-shm`, before any store release. | planner |
| R1-13 | minor | plan §0 work split, §7.3 | The shared-files line does not list the design's packages and config: `@react-native-community/datetimepicker`, `expo-haptics`, keeping `expo-symbols`, and the `app.json` splash colours. | Add them to the frontend-coder's shared-file scope. | planner |
| R1-14 | minor | plan §3 `slots` | `start_time GLOB '[0-2][0-9]:…'` admits 24:00–29:59. | `GLOB '[01][0-9]:[0-5][0-9]' OR GLOB '2[0-3]:[0-5][0-9]'`. | planner |
| R1-15 | minor | plan §0.1 | `decisions.md` S-05 says DSR-12 and DSR-15 "block sprint 1". A-23 and A-70 build past that block on defaults. | Mark the PO's confirmation of A-23 and A-70 as a close-out item, not only "pending". | planner |
| R1-16 | minor | design §4.3.6 vs §0 | Path B is listed at 4 taps because it includes the optional rating, while §0 says 3. | Show the minimal B row (`tabs.log` → `log.quickAdd.<refId>` → `log.save` = 3) and a B′ row with the rating. | designer |
| R1-17 | minor | design D-A9 vs D-A11 | The discarded draft is held for `motion.durationToast` (4 s), but with a screen reader the toast stays until the next toast. Undo then reopens an expired draft. | Tie the draft's lifetime to the toast's lifetime. | designer |
| R1-18 | minor | design §9 | Focus and reading order is given only for Log, Home and Library. | Add Session detail, the Set-rank sheet, Position detail and the bootstrap error screen. | designer |
| R1-19 | minor | design §8 | R-N3 says "medium / large detents" plus a scrim. The large-only Log sheet (D-A23) and `fitToContents` Set-rank depart from it, but are not in the Deviations table. | Add an R-N3 row with the reason and the native scrim behaviour. | designer |
| R1-20 | minor | design §4.4.4, §6.4, §7 | Skip is gated "after T-14". | Once R1-01 lands, render Skip and drop the gating notes. | designer |

## Rulings on the flagged points

1. **Detailed-rounds UI and technique detail vs the orchestrator scope.** R-32 governs: it is a dated PO ruling, and the orchestrator's scope line is not. A-20 and A-21 are upheld.
2. **data.md `source` literal vs `source_version` (A-15).** Upheld. R-23 names `source` and `source_version` as separate columns, so packing the version into `source` would duplicate it. Amending `data.md:43` is a harness/PO action. The switch from `matiq-seed` to `curated` is covered by A-15.
3. **iOS backup exclusion has no API (A-16).** Accepted as a recorded deviation. The grep for `ExcludedFromBackup` in expo-file-system and expo-sqlite finds nothing. There is no app network call, and the file is encrypted. Privacy.md still requires the exclusion before any store release (wording: R1-12).
4. **Cycles/slots tables in 0001 (A-24).** Upheld. D-29 allows it, and po-brief's "may be deferred" is permissive.
5. **Three tabs vs R-N1's five (A-18).** Upheld: no placeholder tabs. The order follows D-A2 (R1-11).
6. **R-M1 "48 dp pending" vs R-18.** R-18 governs. It is a dated PO "yes", and `frontend.md:35` already says 48 dp, so T-12 is upheld. The RULES amendment happens at the next intake.
7. **`predictiveBackGestureEnabled: false` vs R-N4.** T-13 is overturned. `false` does not disable back (R1-08).
8. **`sessions.skip`/`undoSkip`.** They belong in plan §4: product-spec plan §5:199 lists `sessions.skip`. After that, the design's hide-until fallback goes (R1-01, R1-20).
9. **R-M3 "always undoable" vs no revert API.** D-A10 is accepted. The PO ruling R-26 requires undo for destructive actions only, and delete has it. The R-M3 gap is tabled in §8.
10. **Two contrast pairs only in design.md.** Both values are correct. They must be mirrored into the contrast doc before code starts (R1-03).
11. **Tab order: Home · Log · Library (D-A2) vs plan F-18.** D-A2 is upheld, because R-N1's binding property is "Log centre". The plan follows (R1-11).
12. **Design §10.4 data requests.** They must land in plan §4 (R1-01). `data.md:35` makes design §10 an input, but phase-A typed mocks come from §4, and "request/confirm" rows are not a contract.
13. **R-26 fast path (≤ 2 taps only when a plan exists today, 3 otherwise).** Compliant under A-7, which is in force: the prefilled sheet in ≤ 2 taps, then one tap to save. With a plan today, that is 2 taps. Without one: the Log tab (type and time prefilled), one quick-add chip, then Save, which is 3 taps, A-7's maximum. A focus cannot be pre-ticked without a plan without inventing an actual. The first-ever session needs typing, because there is no history yet; that is accepted. The table fix is R1-16, and a stricter reading stays a PO call (A-7's consequence column).

Assumptions A-15…A-80 are reasonable and consistent with each other, except that A-18 lists the tab order differently from A-35 (R1-11).

REVIEW FAILED

Defects to clear before code: R1-01 (plan §4 contract incomplete: types, skip, hook shape, design §10.4 rows), R1-02 (three missing testIDs), R1-03 (contrast doc not mirrored). Majors R1-04…R1-10 are fixed in the same round unless answered with reasons.
