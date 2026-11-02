# progress-settings — plan

## Changes since review 1 (2026-11-01, rework round 2 — the last; `docs/progress-settings/review-1.md` @ 83d4159)

| finding | section(s) | what changed |
|---|---|---|
| B1 | §7.3, §7.4, §11.1 | Folding a loser `session_focuses` row re-points `session_techniques.session_focus_id` to the survivor focus row and folds on `session_techniques_focus_live_uq`; payload `moved`/`folded` record it; round-trip Jest vector with an attached technique |
| B2 | §6.5 T9, §6.7 G6 | T9's first row is 10-12 (20 days, ≤ `staleDays`) and planned ∧ actual; expected values restated (STEADY 0.267; `wGap` 1 → 0.571 NEEDS_WORK); G6 = planned 5 / trained 1 / notTrained 4 / gap 0.8 |
| S1 | PS-09, §12 | SYSTEM passes `'auto'` (`ColorSchemeOverride` = `'light' \| 'dark' \| 'auto' \| 'unspecified'`, `types_generated/src/private/specs_DEPRECATED/modules/NativeAppearance.d.ts:15`; `Appearance.d.ts:33-35` "Pass `'auto'` to reset") |
| S2 | §5.2, §6.3 | `computeProgression(histories, params, { today, nowIso })`; `progression.overview({ today, nowIso })`; the clock is an input |
| S3 | PS-24, §5.5, §7.1, §11.1 | Name rule measured against the shipped seed (164 duplicate technique names, 10 per from-position, 1 exact duplicate edge, 1 duplicate position name): positions and subjects unique by live name (case-insensitive) among the same kind; techniques never by name — only an exact duplicate live edge (name, from, to, type) is rejected; every check runs only when the compared fields change; vectors added. Derived from PRODUCT §8 (edges) and the R-48 seed — not a PO question (§13 note) |
| S4 | §11.3 settings-weights | Flip B by `wNeedsWork` → 0 (score 0 → Steady); Reset → Needs work; out-of-range via a typed value |
| S5 | §11.3 | Ids and strings from design §7/§6: `about.attribution.bjj-data-by-grapple-flows.link`, "1 session on 1 day", merge via `position.edit` → `libraryEdit.merge` → `libraryEdit.merge.result.<id>` → `libraryEdit.merge.confirm` (P-16, P-17, P-27, P-30) |
| S6 | §3 steps 4/6, §9.1, §9.2, §5.7 | No compile-time edge: data-coder ships the seam with a `not_applicable` default and `setBootstrapOverrides()` used by bootstrap and reset; frontend-coder injects the adapter from `_layout.tsx`; the two run in parallel |
| N5 | §11.3 progress-panels | Clock-independent assertion: the unplanned-trained row of the logged focus; the planned session's pending row is not asserted (plan mode defaults to the next full hour, `log-session/state.ts:170-176`) |
| N6 | §6.4 | Drafting text removed; `threshold` rule stated once |
| N7 | §6.6 | `addDays` and `weekStartOf` exist (`localDate.ts:49,57`); `diffDays` is new, with tests |
| N8 | §3 step 6, §9.2 | Podspec in the file list; exclusion applied to expo-sqlite's `SQLite/` directory and to the files that exist (both, each launch) |
| N9 | §5.1, §5.5 | `TechniqueDetail.fromRemoved` / `toRemoved`; `aliasRows: AliasRow[]` on `PositionDetail` and `TechniqueDetail` (`aliases: string[]` kept) |
| S8 (designer, 2fe0ce5) | PS-21, §6.6 keys, §10, §11.2 | Heatmap accessibility aligned with design §4.2.3 / §8: one `role="image"` stop per week row with a week label, cells not a11y elements; §11.2 asserts week rows, not cells |

## Changes since PO rulings Q1–Q5 (2026-11-01, rework round 1; rulings relayed by the coordinator, quoted in §0.1 and §13)

| ruling | section(s) | what changed |
|---|---|---|
| Q1 (a) — not the default | §0 scope, PS-21, PS-22, §3 steps 2–3/7, §4, §5.1, §5.2, §6.6, §6.7, §10, §11.1–§11.3, §12, §15 | Consistency heatmap and planned-vs-actual gap panel added to scope: aggregation spec with Jest vectors (H1–H7, G1–G6), `aggregateConsistency` / `aggregatePlannedVsActual` domain functions, `ProgressOverview.consistency` / `.plannedVsActual`, Progress screen panels, flow assertions; no schema change (§4 note) |
| Q2 (b) | §0.1, §13, §15 | Default confirmed; close-out carry-over line for the list editors |
| Q3 (a) | §0.1, §13, PS-10 | Profile tab = Settings screen, titled "Profile" — ruled, no longer an assumption |
| Q4 (b) | §0.1, §13, §15 | Coral/red belts later; CO-27 stays; PS-01 holds |
| Q5 | §0.1, §13, §16 | Theme override ships in sprint 2 by ruling; §16 cites Q5 instead of "the spec wins" |

Sprint 2. Planner · 2026-11-01 · branch `feature/progress-settings` (cut from `origin/develop` 99f5286). Binding inputs in order: `docs/decisions.md`, `docs/PRODUCT.md` (§6 Progress / Settings / Library / Technique detail, §7 algorithm, §8 taxonomy), `docs/product-spec/plan.md` (§4.2 settings keys, §4.3 params, §5 API, §6 edge cases, §8 algorithm), `docs/foundation/plan.md` (F-07, F-18, F-23, F-24) and `data-contracts.md`, `.claude/rules/*.md`, the shipped schema (`mobile/src/db/schema/`, 20 tables) and screens. Scope per R-32 and the orchestrator's brief: Progress tab with algorithm v1 and explanations · Settings (weights, suggestion sources, rank incl. kids scale, detailed-rounds toggle, theme override, About with the CC BY 4.0 attribution) · Library editing with aliases and merge/undo · Technique detail with Resources · iOS backup-exclusion local Expo module (CO-28) · "(tabs)" back label (CO-42).

## §0 Summary for builders

**What this sprint delivers.** No migration: every table, column and check this sprint needs exists in `0001_foundation` (PS-01). Algorithm v1 as pure domain code with structured explanations (§6), the Progress tab and its "why" sheet, a Profile tab that hosts Settings (rank with the kids scale, algorithm parameters with reset, suggestion sources, detailed-rounds and extended-library toggles, theme override, About rendering `attribution.json`), Library editing (create/rename/soft delete + undo, aliases, merge + undo) for positions, techniques and subjects, Technique detail with Resources (manual entry, to-watch/watched, history), the iOS backup-exclusion module behind a Jest-testable seam, and the back-label fix. Progress also ships its three secondary panels — rank history, consistency heatmap, planned-vs-actual gap panel (ruling Q1 (a), §6.6–§6.7, PS-21/PS-22) — and the theme override (ruling Q5). Out: cycles/slots/reminders/export/import/erase/detailed rounds (sprint 3), session-type / resource-type list editing (ruling Q2 (b), sprint 3).

**Work split (section → owner; guard scopes `.claude/agents/*.md`).** §4 data (no change) · §5 API · §6 algorithm · §7 taxonomy editing + merge · §8 resources + rank + settings + params · §9.1 backup seam (`mobile/src/db/`) · §11.1 Jest · `data-contracts.md` → **data-coder**. §9.2 native module (`mobile/modules/matiq-backup/`, frontend scope) · §10 screens, theme override, tab shell, back label · §11.2 UI Jest · dev-client rebuild → **frontend-coder** (phase A on typed mocks from §5, phase B after `data-contracts.md`). §11.3 Maestro → **tester**. Copy + testID tables → **designer** (`design.md`, keep the headings `## §7 testID table` / `## §8 Deviations` that `mobile/__tests__/testids.test.ts` slices on). Shared files: none needed in `package.json`; `app.json` unchanged (autolinking finds `./modules` by default, verified `expo-modules-autolinking/build/commands/autolinkingOptions.js:201`).

**Decision register (PS-nn · one line · source).** Full text §2.

| PS | decision | source |
|---|---|---|
| PS-01 | No schema change, no migration: `algorithm_params`, `taxonomy_merges`, `aliases`, `resources`/`resource_links`/`resource_types`, `rank_entries`, `settings` (`theme.override`, `rank.scale`, `library.showExtended`, `log.detailedRounds`) and `app_meta` already carry every field; new facts go in rows (`app_meta.backup_exclusion`) or the merge `payload` JSON | data.md, F-01 |
| PS-02 | Algorithm v1 = `mobile/src/domain/progression/v1/` (`compute.ts`, `signals.ts`, `window.ts`): pure, params and `today` injected, output structured (state · rule · signal rows), no strings — the UI maps to i18n keys (§6.4) | R-08, R-17, R-22, data.md |
| PS-03 | Window = the `windowWeeks × 7` local dates ending today inclusive; sessions dated after today are outside it; ordering within a day by `starts_at` | R-15, §8 sprint 0 |
| PS-04 | Progress lists every focus with a live `session_focuses` row in a live session (any status, all time); soft-deleted taxonomy rows appear only with a live row inside the window, under "Removed"; order Needs work → Not trained lately → Steady → Improving, then name | PRODUCT §6, sprint-0 §6 |
| PS-05 | "Flagged" = `needs_work` of the focus row in the most recent COMPLETED session where it is actual, all time; a badge, never a state | R-17 |
| PS-06 | Home suggestions gain the NEEDS_WORK and NOT_TRAINED sources from the same compute; `sessions.home` calls `progression.overview` and the hook also subscribes to `algorithm_params` | R-09, R-21 |
| PS-07 | Params: `algorithmParams.set` validates bounds and integer keys in the domain (`PARAM_OUT_OF_RANGE`, `PARAM_NOT_INTEGER`, `PARAM_UNKNOWN`); weights need not sum to 1 (rescaling); `resetAll` restores `default_value` of the active version only | R-08, R-22 |
| PS-08 | Settings STRING keys get a domain vocabulary: `theme.override` SYSTEM\|LIGHT\|DARK, `rank.scale` ADULT\|KIDS, `algorithm.version` v1 → `SETTING_VALUE_INVALID` | R-44, R-10 |
| PS-09 | Theme override ships now (ruled Q5, 2026-11-01): root layout reads `theme.override` live and calls `Appearance.setColorScheme('light' \| 'dark' \| 'auto')` — SYSTEM = `'auto'`, which resets the override (RN 0.88.1, `ColorSchemeOverride` in `types_generated/src/private/specs_DEPRECATED/modules/NativeAppearance.d.ts:15`, doc `Appearance.d.ts:33-35`) — so `useTheme`, native headers, sheets and the status bar follow one source | Q5, R-44, PRODUCT §6 |
| PS-10 | Shell = 5 tabs Home · Library · Log · Progress · Profile (R-45 final order); Profile is the Settings screen of R-02: rank at the top, settings groups below, titled "Profile" (ruled Q3 (a), 2026-11-01) | R-45, F-18, Q3 |
| PS-11 | Rank: `rank.current`/`history` filter by the active `rank.scale`; `rank.update`, `rank.softDelete` + `undoDelete`; the Set-rank sheet reads the scale instead of hard-coding ADULT; switching scale hides, never deletes | R-10, sprint-0 §6 |
| PS-12 | Taxonomy editing (§7): user rows `origin = user`, `tier = CORE`, slug minted from the name (`domain/taxonomy/slug.ts`, `-2` suffix on clash); rename keeps the old name as a user alias by default (R-50/A-9); imported-field edits set `user_edited_at`, `notes`/aliases/resource status never do | R-14, R-23, R-50 |
| PS-13 | Soft delete never cascades: a technique whose endpoint is deleted is hidden from lists/pickers while the endpoint is deleted; history renders "(removed)"; undo restores by id | R-14 |
| PS-14 | Merge = one transaction moving every reference per kind (§7.3), folding duplicates, turning the loser's name and aliases into survivor aliases, soft-deleting the loser, writing `taxonomy_merges.payload` (§7.4); undo reverses from the payload while it is the latest merge touching either id (`MERGE_NOT_LATEST`), surfaced as the toast Undo | R-14, R-26 |
| PS-15 | Resources (§8.1): manual entry in sprint 2 (R-29 names v1 and no later sprint carries it); UI on Technique detail only; `author` column stays, labelled "Author / source" — closes CO-26 without a rename | R-29, CO-26 |
| PS-16 | Technique detail history = sessions where the technique was attached (`session_techniques`) or logged as a submission (`submissions.technique_id`), newest first, 20 rows | PRODUCT §6 |
| PS-17 | Backup exclusion: `BackupExclusion` seam in `mobile/src/db/backup.ts` (interface, fake, `not_applicable` default) called after open and after reset for expo-sqlite's `SQLite/` directory plus `matiq.db`, `-wal`, `-shm` that exist; result in `app_meta.backup_exclusion` (`excluded` \| `failed` \| `not_applicable`); a failure never blocks bootstrap; the native module `mobile/modules/matiq-backup/` (iOS Swift; Android `not_applicable`) is the frontend-coder's and is injected through `setBootstrapOverrides({ backupExclusion })` from `_layout.tsx` — no import from `src/db` into `modules/` (S6); verification §9.3 | R-39, ADR 0020, CO-28 |
| PS-18 | Back label: `headerBackButtonDisplayMode: 'minimal'` on every Stack's `screenOptions` (verified `expo-router/build/react-navigation/native-stack/types.d.ts:426`) | CO-42 |
| PS-19 | About renders `mobile/src/db/seed/attribution.json` in full (name, licence + link, credit, change note per source), app version, algorithm version, backup status; links open with `Linking.openURL` | R-28, CO-35 |
| PS-20 | CO-13 closes: the template packages it lists are already gone from `package.json`; `expo-constants`/`expo-linking` are `expo-router` peers, `expo-system-ui` backs `userInterfaceStyle` — nothing to prune | CO-13 |
| PS-21 | Consistency heatmap (§6.6): pure `aggregateConsistency` over live sessions' `local_date` (fixed at write time, ADR 0016 — no Date math in the domain), Monday weeks (R-15), the algorithm's window plus the partial weeks around it; cells carry counts and minutes, never colour alone; accessibility = one `role="image"` stop per week row with a week label (design §4.2.3, §8 R-A3 row; cells are not a11y elements); part of `ProgressOverview` (one live read) | Q1 (a), R-15, CO-06 |
| PS-22 | Planned-vs-actual gap panel (§6.7): `aggregatePlannedVsActual` reuses the §6.3 `gap` signal per focus so the panel and the explanation never disagree; totals + per-focus rows for focuses with a planned or unplanned-trained row in the window; part of `ProgressOverview` | Q1 (a), PRODUCT §6 |
| PS-23 | The panels need no schema change: both read `sessions.local_date/status/starts_at/duration_minutes` and `session_focuses.is_planned/is_actual` — PS-01 holds | Q1 (a), PS-01 |
| PS-24 | Name uniqueness (measured on the shipped seed: 164 duplicate technique names, 10 duplicate name + from-position, 1 exact duplicate edge, 1 duplicate position name "spiderweb without leg over head"): positions and subjects — a live canonical name (or, for positions, a live POSITION alias) equal case-insensitively → `TAXONOMY_NAME_DUPLICATE`; techniques — never by name (PRODUCT §8: an edge is identified by its endpoints and type; the R-48 seed relies on it), only an exact live duplicate (lower(name), from, to, type) is rejected; every check runs only when the compared fields change, so unrelated edits of the seed's duplicate rows pass | PRODUCT §8, R-48, review S3 |

**Data (field level)** — §4: no new columns; the rows and JSON shapes this sprint writes. **API surface** — §5 (function · input · output · codes · live). **Algorithm** — §6. **Edge cases** — §12. **Open questions** — §13 (PO). **Carry-over in/out** — §15.

**Errors added to `mobile/src/domain/errors.ts`:** `PARAM_UNKNOWN` · `PARAM_OUT_OF_RANGE` · `PARAM_NOT_INTEGER` · `SETTING_VALUE_INVALID` · `TAXONOMY_NAME_REQUIRED` · `TAXONOMY_NAME_DUPLICATE` · `TAXONOMY_ROW_DELETED` · `TAXONOMY_SELF_MERGE` · `TAXONOMY_MERGE_KIND_MISMATCH` · `POSITION_PARENT_CYCLE` · `TECHNIQUE_TARGET_REQUIRED` · `TECHNIQUE_SUBMISSION_HAS_TARGET` · `ALIAS_NAME_REQUIRED` · `ALIAS_DUPLICATE` · `ALIAS_NOT_FOUND` · `MERGE_NOT_FOUND` · `MERGE_ALREADY_UNDONE` · `MERGE_NOT_LATEST` · `RESOURCE_NOT_FOUND` · `RESOURCE_TITLE_REQUIRED` · `RESOURCE_URL_INVALID` · `RESOURCE_TYPE_NOT_FOUND` · `RESOURCE_LINK_TARGET_NOT_FOUND` · `RANK_NOT_FOUND`.

**Edge-case index (full text §12):** sparse data and omitted signals · n = 0 vs stale · planned-only focus · future-dated sessions · same-day ordering · deleted focus in the window · heatmap with no sessions / partial weeks / several sessions a day / travel across zones · gap panel with no planned rows / unplanned training / pending planned · merge folding and self-loops · survivor's parent is the loser · subject merge has no aliases · rename to an existing alias · alias equal to the canonical name · extended-tier endpoints · params edited while Progress is open · theme override and the sheet backgrounds · kids scale switch with no entries · resource without URL · backup exclusion on a fresh file after reset · TZ (CO-06).

### §0.1 Rulings — PO, 2026-11-01, relayed by the coordinator (quoted verbatim; full readings in §13; the documenter records them in `docs/decisions.md`)

| Q | question | ruling (2026-11-01) | effect |
|---|---|---|---|
| Q1 | Progress secondary panels: which ship now? | "(a). Rank history, heatmap and gap panel all ship now." | all three in: §6.6, §6.7, PS-21–PS-23 (not the planner's default) |
| Q2 | Session-type and resource-type editing in sprint 2? | "(b). Session-type and resource-type list editing moves to sprint 3. Until then the pickers read the seeded lists." | out; close-out carry-over line §15 |
| Q3 | Profile tab = the Settings surface? | "(a). The Profile tab is the Settings screen: rank at the top, settings groups below, titled \"Profile\"." | PS-10 |
| Q4 | Coral/red belts now (CO-27)? | "(b). Coral/red belts later. No migration this sprint." | CO-27 stays open; PS-01 holds |
| Q5 | Theme override in sprint 2 (§16 R-44 conflict)? | "Yes, theme override ships in sprint 2." | PS-09; §16 cites Q5 |

No open PO question remains.

---

## §1 Summary

Sprint 2 turns the foundation's data into the product's feedback loop: the algorithm reads the logged signals (per-focus ratings, needs-work flags, planned-vs-actual rows, hit/caught counts, dates) and explains four states per focus, with rank history, a consistency heatmap and a planned-vs-actual panel beside it (ruling Q1); Settings exposes every knob the rules say the user owns (weights, thresholds, window, suggestion sources, rank incl. kids scale, detailed rounds, extended library, theme); the Library becomes editable with history-preserving rename, soft delete, aliases and merge/undo; Technique detail shows the graph edge with its resources and history; the iOS backup exclusion closes the privacy gap ADR 0020 deferred; the back label is fixed. No migration (PS-01).

## §2 Decision register (full text)

- **PS-01 No migration.** Checked column by column against `mobile/src/db/schema/*.ts`: `algorithm_params` (value/default/min/max per version), `settings` (14 keys incl. `theme.override`), `taxonomy_merges` (kind, from, into, payload, undone_at), `aliases` (polymorphic target, live-unique per target and lower(name)), `resources`/`resource_links`/`resource_types`, `rank_entries` (scale, belt, stripes, awarded_on, note, soft delete), `app_meta` (key/value). Nothing this sprint stores lacks a home. The verify row `npx drizzle-kit generate && git diff --exit-code -- drizzle/` must stay clean.
- **PS-02…PS-06 Algorithm placement and inputs.** The repository assembles `FocusHistory[]` from `sessions` + `session_focuses` (live rows only) and the domain computes; both Home (`sessions.home`) and Progress call the same `progression.overview`. Computation is on read (live hook), no cache, no background job (PRODUCT §7); NF-09 (< 100 ms for 500 sessions) is a Jest benchmark on better-sqlite3 for the domain part.
- **PS-07/PS-08 Validation in the domain.** `V1_PARAM_DEFAULTS` gains `integer: true` on `windowWeeks`, `staleDays`, `minSessions`, `hitCaughtMinEvents`; `domain/settings/defaults.ts` gains `values` for STRING keys. Bounds stay data (`min`/`max` rows) — the domain reads the row, never the constant, when validating a `set`.
- **PS-09 Theme.** `Appearance.setColorScheme` is the one override point; `useTheme` stays a `useColorScheme` consumer. `StatusBar style="auto"` follows. The setting is applied in `_layout.tsx` before the splash hides so the first frame is right.
- **PS-10 Shell.** `MainTabBar` grows to five columns; Log stays centre; Progress and Profile are nested Stacks (`progress/index`, `profile/index` + settings screens). Design decides icon names (expo-symbols, R-47).
- **PS-12…PS-14 Taxonomy editing.** Domain functions in `domain/taxonomy/edit.ts` (validation, slug, which fields set `user_edited_at`), `merge.ts` (plan the moves and folds from in-memory rows — pure), `aliases.ts`; the repository applies the plan in one transaction. Merge payload §7.4.
- **PS-15 Resources.** `resources.ts` repository + `domain/resources/validate.ts` (title required, URL must parse as `http(s)`). Seeded GrappleMap citations (756 rows) are `origin = seed` and editable like taxonomy rows (user_edited_at on title/url/author/type).
- **PS-17 Backup seam.** Mirrors the `KeyStore` seam (ADR 0020): `BootstrapDeps.backupExclusion: BackupExclusion`; `nativeBootstrapDeps()` wires the module; Jest wires a recording fake. `resetDatabase` re-runs it (the files are recreated). The dev reset screen and About show the status; the About line is the Maestro assertion.
- **PS-18/PS-19/PS-20** as in §0.

## §3 Implementation steps (WHAT, in order)

1. **data-coder** — errors + contracts: add the §0 codes and the §5 types to `errors.ts` / `contracts.ts`; `V1_PARAM_DEFAULTS` integer flags; settings vocabularies (PS-07, PS-08).
2. **data-coder** — algorithm: `domain/progression/v1/{window,signals,compute}.ts` + tests from §6.5; panels `domain/progression/panels/{consistency,plannedVsActual}.ts` + tests from §6.6/§6.7 (algorithm-version-independent, hence outside `v1/`); `domain/suggestions/forPlanning.ts` takes `states` (PS-06).
3. **data-coder** — repositories: `progression.ts` (`inputs`, `sessionDays`, `overview` incl. the two panels), `algorithmParams.set/resetAll`, `settings` vocabulary, `rank.update/softDelete/undoDelete` + scale filter, `taxonomy` editing/merge/aliases/`getTechnique`, `resources.ts`, `resourceTypes.list`; `sessions.home` wired to `progression.overview`; hooks §5.9.
4. **data-coder** — backup seam `db/backup.ts` (`BackupExclusion` interface, `fakeBackupExclusion()`, `notApplicableBackupExclusion`), `BootstrapDeps.backupExclusion` defaulting to `not_applicable` in `nativeDeps.ts`, `setBootstrapOverrides(overrides: Partial<BootstrapDeps>)` in `db/bootstrap.ts` merged by `bootstrapDatabase` and by `resetDatabase`'s bootstrap, `app_meta.backup_exclusion`, re-run after reset; the `BackupExclusion` type re-exported from `src/repositories/index.ts`; tests with the fake. No import of `mobile/modules/**` anywhere under `src/db` (S6) — steps 4 and 6 run in parallel.
5. **data-coder** — `docs/progress-settings/data-contracts.md`, `descriptions.json` unchanged (no columns added; document the new `app_meta` key in its `app_meta` entry), verify rows incl. `TZ=UTC npx jest` and local TZ (CO-06).
6. **frontend-coder (phase A)** — `mobile/modules/matiq-backup/` (`expo-module.config.json`, `ios/MatiqBackup.podspec`, `ios/MatiqBackupModule.swift`, `index.ts` with `setExcludedFromBackup(fileUri, excluded): boolean`, `isExcludedFromBackup(fileUri): boolean`, `isAvailable` = iOS, and `backupExclusionAdapter: BackupExclusion` built on them — the type imported from `src/repositories`); `_layout.tsx` calls `setBootstrapOverrides({ backupExclusion: backupExclusionAdapter })` before `useDatabaseBootstrap()` runs. Independent of step 4's commit order (S6). Swift API names (`Module`, `Name`, `Function`, `URLResourceValues.isExcludedFromBackup`) are the planner's recollection — confirm against `node_modules/expo-modules-core` docs/`/expo:*` skill and append the facts to `docs/stack-notes.md`.
7. **frontend-coder (phase A)** — shell: five tabs, Progress + Profile stacks, back label, theme override hook, `testids.test.ts` generalised to every `docs/*/design.md` with the two headings; screens of §10 on typed mocks of §5 incl. the heatmap grid and the gap panel from a mocked `ProgressOverview` (`design.md` copy/testID tables).
8. **frontend-coder (phase B)** — integrate against `data-contracts.md`; dev-client rebuild `npx expo run:ios` (the module needs pod install; record the verify row; infra failure → PO action per CO-14); simulator smoke of every touched route in light and dark; About shows backup status `excluded`.
9. **tester** — flows §11.3 on the rebuilt dev client; `xattr` measurement §9.3 appended to `docs/stack-notes.md`.
10. **orchestrator** — carry-over rows §15 at close.

## §4 Data requirements (field level; no DDL change)

| table | rows this sprint writes | fields and constraints relied on |
|---|---|---|
| `algorithm_params` | `set`: `value`, `updated_at`; `resetAll`: `value = default_value` for `algorithm_version = settings.algorithm.version` | `min ≤ value ≤ max` check; live-unique (version, key) |
| `settings` | `theme.override` ∈ SYSTEM\|LIGHT\|DARK · `rank.scale` ∈ ADULT\|KIDS · `library.showExtended` BOOL · `log.detailedRounds` BOOL · `suggest.*` BOOL/INT (`suggest.max` 0–10, domain check) | `value` JSON text by `value_type`; live-unique key |
| `rank_entries` | add/update: `scale`, `belt` (must belong to the scale), `stripes` 0–4 (0–6 on BLACK), `awarded_on` ≤ today, `note`; soft delete | checks in schema; reads filter `deleted_at IS NULL AND scale = <active>` |
| `positions` | create: `id` UUID, `origin='user'`, `source NULL`, `slug` (minted), `canonical_name`, `description`, `parent_position_id`, `tier='CORE'`; update: name/description/parent (+ `user_edited_at`), `notes` (no `user_edited_at`); soft delete | `positions_slug_live_uq`; parent ≠ self (domain also rejects cycles) |
| `techniques` | create/update: `name`, `type`, `from_position_id`, `to_position_id` (null iff SUBMISSION), `applies_to`, `perspective`, `description` (+ `user_edited_at`), `notes`; soft delete | `techniques_submission_target_check`, `techniques_slug_live_uq` |
| `subjects` | create/update: `name`, `description`; soft delete | `subjects_name_live_uq` (lower) |
| `aliases` | add: `target_kind` POSITION\|TECHNIQUE, `target_id`, `name`, `origin='user'`; rename-keeps-name alias; merge moves `target_id`; soft delete / undo | `aliases_target_name_live_uq` (kind, target, lower(name)) |
| `taxonomy_merges` | one row per merge: `target_kind`, `from_id` (loser), `into_id` (survivor), `payload` JSON (§7.4), `undone_at` on undo | `from_id <> into_id` |
| `session_focuses`, `cycle_focuses`, `resource_links`, `techniques.from/to`, `positions.parent_position_id`, `session_techniques.technique_id`, `submissions.technique_id` | merge re-points `focus_ref_id` / `target_id` / FK columns to the survivor; folded duplicates soft-deleted with survivor row updated (§7.3) | live-unique indexes per table drive the fold |
| `resources` | create/update: `title` NN, `url` (http/https or null), `author`, `resource_type_id` FK NN, `notes`, `status` TO_WATCH\|WATCHED; `origin='user'` for new rows; soft delete | `resources_status_check`; seed rows keep `source='grapplemap'` |
| `resource_links` | link/unlink (soft delete) `{resource_id, target_kind, target_id}`; sprint 2 UI creates TECHNIQUE links only | `resource_links_live_uq` |
| `app_meta` | `backup_exclusion` = `excluded` \| `failed` \| `not_applicable`; `backup_exclusion_checked_at` ISO date | key unique |

Belt lists: `docs/product-spec/plan.md §4.1`. Params and bounds: `§4.3` there (seeded, unchanged).

**Panels (Q1 (a)) — read-only, no new columns (PS-23).** Heatmap reads `sessions.local_date`, `status`, `starts_at`, `duration_minutes` (live rows); gap panel reads `session_focuses.is_planned`, `is_actual` joined to `sessions.status`, `starts_at`, `local_date` (live rows) — the same rows `progression.inputs` already loads. Rank history reads `rank_entries` by the active scale (§5.4). Nothing is stored; both are computed on read like the states. Verdict: the schema-change answer stays **no**.

## §5 Repository / domain API surface (data-coder implements; frontend-coder consumes, mocks in phase A)

Conventions as `docs/foundation/data-contracts.md` (runtime clock/ids, transactions on writes, `deleted_at IS NULL` on every read except `undo*`, export and import). Types below go in `contracts.ts`.

### §5.1 Types

```ts
type ProgressState = 'IMPROVING' | 'STEADY' | 'NEEDS_WORK' | 'NOT_TRAINED';
type SignalId = 'n' | 'trend' | 'needsWorkRate' | 'gap' | 'daysSince' | 'hitRatio';
type SignalRow = { signal: SignalId; available: boolean; value?: number; weight?: number; threshold?: number; contributed: boolean };
type ProgressResult = { ref: FocusRef; name: string; removed: boolean; state: ProgressState; rule: 1 | 2 | 3 | 4; flagged: boolean;
  n: number; score?: number; lastTrainedOn?: string; signals: SignalRow[] };
type ProgressOverview = { today: string; windowStart: string; algorithmVersion: string; params: Record<string, number>; results: ProgressResult[];
  consistency: ConsistencyData; plannedVsActual: PlannedVsActualData };
// panels (Q1 (a)); all dates are local `YYYY-MM-DD` strings, weeks start Monday (R-15)
type SessionDayRow = { localDate: string; startsAt: string; status: SessionStatus; durationMinutes?: number };   // domain input
type DayCell = { localDate: string; inWindow: boolean; future: boolean; completed: number; skipped: number; pending: number; minutes: number };
type WeekRow = { weekStart: string; days: [DayCell, DayCell, DayCell, DayCell, DayCell, DayCell, DayCell]; completed: number };
type ConsistencyData = { windowStart: string; today: string; weeks: WeekRow[]; totals: { completed: number; activeDays: number; minutes: number; weeksWithTraining: number; weeksInWindow: number; currentStreakWeeks: number } };
type GapRow = { ref: FocusRef; name: string; removed: boolean; planned: number; trained: number; notTrained: number; pending: number; unplannedTrained: number; gap?: number };
type PlannedVsActualData = { windowStart: string; today: string; totals: Omit<GapRow, 'ref' | 'name' | 'removed'>; rows: GapRow[] };
type FocusHistory = { ref: FocusRef; name: string; removed: boolean; rows: FocusHistoryRow[] };   // domain input
type FocusHistoryRow = { localDate: string; startsAt: string; status: SessionStatus; isPlanned: boolean; isActual: boolean;
  needsWork: boolean; rating?: number; hitCount?: number; caughtCount?: number };
type ParamInput = { version: string; key: string; value: number };
type TaxonomyKind = 'POSITION' | 'TECHNIQUE' | 'SUBJECT';
type PositionInput = { canonicalName: string; parentId?: string | null; description?: string; notes?: string; keepOldNameAsAlias?: boolean /* default true */ };
type TechniqueInput = { name: string; type: TechniqueType; fromPositionId: string; toPositionId?: string | null; appliesTo: AppliesTo; perspective?: Perspective | null; description?: string; notes?: string; keepOldNameAsAlias?: boolean };
type SubjectInput = { name: string; description?: string };
type AliasRow = { id: string; targetKind: 'POSITION' | 'TECHNIQUE'; targetId: string; name: string; origin: 'seed' | 'user' };
type MergeResult = { mergeId: string; kind: TaxonomyKind; fromId: string; intoId: string; moved: Record<string, number>; folded: number; aliasesAdded: number };
type TechniqueDetail = TechniqueRow & { description?: string; notes?: string; origin: 'seed' | 'user'; resources: ResourceRow[];
  /** Endpoint soft-delete flags (design §10.2, N9): the UI renders "(removed)" and disables the link. */
  fromRemoved: boolean; toRemoved?: boolean;
  /** Aliases with ids for remove/undo; `aliases: string[]` (from TechniqueRow) stays for display. */
  aliasRows: AliasRow[];
  history: { sessionId: string; localDate: string; sessionTypeName: string; via: 'ATTACHED' | 'SUBMISSION' }[] };
// PositionDetail (shipped) gains `aliasRows: AliasRow[]` beside its `aliases: string[]` (N9); no other shipped field changes.
type ResourceRow = { id: string; title: string; url?: string; author?: string; resourceTypeId: string; resourceTypeName: string; notes?: string; status: 'TO_WATCH' | 'WATCHED'; origin: 'seed' | 'user' };
type ResourceInput = { title: string; url?: string; author?: string; resourceTypeId: string; notes?: string; status?: 'TO_WATCH' | 'WATCHED' };
type ResourceTarget = { kind: 'TECHNIQUE' | 'POSITION' | 'SUBJECT' | 'CYCLE'; id: string };
type ResourceTypeRow = { id: string; name: string; sortOrder: number };
type BackupExclusionStatus = 'excluded' | 'failed' | 'not_applicable';
type AboutData = { appVersion: string; algorithmVersion: string; taxonomyRelease: string; backup: BackupExclusionStatus; attribution: typeof attributionJson };
```

### §5.2 Progression (`repositories/progression.ts`, domain `progression/v1`)

| function | input | output | codes | live |
|---|---|---|---|---|
| `computeProgression` (domain) | `histories: FocusHistory[]`, `params: Record<string, number>`, `{ today, nowIso }` (the clock is an input, data.md; `nowIso` feeds the §6.3 `gap` rule) | `ProgressResult[]` (unsorted) | `PARAM_UNKNOWN` (missing key) | — |
| `progression.inputs` | `{ today }` | `FocusHistory[]` — one per focus ref with a live `session_focuses` row in a live session; `removed` from the taxonomy row; rows for all time (the domain cuts the window; `daysSince` needs all time) | — | — |
| `aggregateConsistency` (domain, `progression/panels/consistency.ts`) | `rows: SessionDayRow[]`, `{ today, windowWeeks }` | `ConsistencyData` (§6.6) | — | — |
| `aggregatePlannedVsActual` (domain, `progression/panels/plannedVsActual.ts`) | `histories: FocusHistory[]`, `{ today, windowWeeks, nowIso }` | `PlannedVsActualData` (§6.7) | — | — |
| `progression.sessionDays` | `{ today }` | `SessionDayRow[]` — every live session with `localDate ≤ today`, any status | — | — |
| `progression.overview` | `{ today, nowIso }` (the hook passes `useLocalDate()` and the runtime clock) | `ProgressOverview` sorted per PS-04; removed focuses without a live row in the window dropped; `consistency` and `plannedVsActual` from the two aggregators over the same loaded rows | — | hook `useProgress()` (tables: sessions, session_focuses, algorithm_params, settings, positions, subjects) |
| `suggestions.forPlanning` (domain, extended) | settings, lastCompleted, `states: ProgressResult[]` | `Suggestion[]` ≤ max, order LAST_NEEDS_WORK → CYCLE (empty) → NEEDS_WORK by score desc → NOT_TRAINED by daysSince desc (only focuses with `lastTrainedOn`); dedupe by ref | — | via `useHome` |

### §5.3 Params and settings

| function | input | output | codes | live |
|---|---|---|---|---|
| `algorithmParams.list(version)` | — | `AlgorithmParamRow[]` by key | — | `useAlgorithmParams()` reads `algorithm.version` then lists |
| `algorithmParams.set` | `ParamInput` | row | `PARAM_UNKNOWN`, `PARAM_OUT_OF_RANGE` (details min/max), `PARAM_NOT_INTEGER` | — |
| `algorithmParams.resetAll(version)` | — | rows | — | — |
| `settings.set(key, value)` (extended) | as today | `Setting<K>` | + `SETTING_VALUE_INVALID` for STRING keys outside PS-08; `suggest.max` outside 0–10 → `SETTING_VALUE_INVALID` | `useSetting(key)` (exists) |

### §5.4 Rank

| function | input | output | codes | live |
|---|---|---|---|---|
| `rank.add` | `RankInput` (scale from the setting) | `RankEntry` | existing codes | — |
| `rank.update(id, RankInput)` | | `RankEntry` | `RANK_NOT_FOUND`, existing codes | — |
| `rank.softDelete(id)` / `rank.undoDelete(id)` | | `RankEntry` | `RANK_NOT_FOUND` | — |
| `rank.current({ scale })` / `rank.history({ scale })` | scale = active setting | latest / newest-first of that scale | — | `useCurrentRank()`, `useRankHistory()` (both read `rank.scale`) |

### §5.5 Taxonomy editing (`repositories/taxonomy.ts`, domain `taxonomy/{edit,merge,aliases}.ts`)

| function | input | output | codes | live |
|---|---|---|---|---|
| `taxonomy.createPosition` / `createTechnique` / `createSubject` | `PositionInput` / `TechniqueInput` / `SubjectInput` | `PositionRow` / `TechniqueRow` / `SubjectRow` | `TAXONOMY_NAME_REQUIRED`; `TAXONOMY_NAME_DUPLICATE` per PS-24 (positions: live canonical name or POSITION alias; subjects: live name; techniques: exact live duplicate edge only); `TAXONOMY_ROW_NOT_FOUND` (parent/endpoint), `POSITION_PARENT_CYCLE`, `TECHNIQUE_TARGET_REQUIRED`, `TECHNIQUE_SUBMISSION_HAS_TARGET` | — |
| `taxonomy.updatePosition(id, Partial<PositionInput>)` / `updateTechnique` / `updateSubject` | rename sets `user_edited_at` on seed rows and (default) adds the old name as a user alias; the PS-24 duplicate check runs only when the compared fields (name; for techniques also from/to/type) change | row | as create + `TAXONOMY_ROW_DELETED` | — |
| `taxonomy.softDelete(kind, id)` / `undoDelete(kind, id)` | | row | `TAXONOMY_ROW_NOT_FOUND`, `TAXONOMY_ROW_DELETED` (delete twice) | — |
| `taxonomy.addAlias(kind, id, name)` | kind POSITION\|TECHNIQUE | `AliasRow` | `ALIAS_NAME_REQUIRED`, `ALIAS_DUPLICATE` (same target, or equals the canonical name), `TAXONOMY_ROW_NOT_FOUND` | — |
| `taxonomy.removeAlias(aliasId)` / `undoRemoveAlias(aliasId)` | | `AliasRow` | `ALIAS_NOT_FOUND` | — |
| `taxonomy.merge(kind, fromId, intoId)` | loser → survivor | `MergeResult` | `TAXONOMY_SELF_MERGE`, `TAXONOMY_MERGE_KIND_MISMATCH` (SUBMISSION into non-submission technique or vice versa), `TAXONOMY_ROW_NOT_FOUND`, `TAXONOMY_ROW_DELETED` | — |
| `taxonomy.undoMerge(mergeId)` | | `MergeResult` | `MERGE_NOT_FOUND`, `MERGE_ALREADY_UNDONE`, `MERGE_NOT_LATEST` | — |
| `taxonomy.getTechnique(id)` | | `TechniqueDetail` (incl. `fromRemoved` / `toRemoved`, `aliasRows`; opens even when an endpoint or the row itself is soft-deleted, for history) | `TAXONOMY_ROW_NOT_FOUND` | `useTechnique(id)` (taxonomy tables + resources, resource_links, session_techniques, submissions, sessions) |
| `taxonomy.listAliases(kind, id)` | | `AliasRow[]` | — | surfaced as `aliasRows` on `PositionDetail` (`usePosition`) and `TechniqueDetail` (`useTechnique`) (N9) |

Existing list/search functions gain nothing but must exclude techniques whose endpoint is soft-deleted (PS-13; `listTechniques` already requires a live `from`).

### §5.6 Resources (`repositories/resources.ts`)

| function | input | output | codes | live |
|---|---|---|---|---|
| `resources.listFor(target)` | `ResourceTarget` | `ResourceRow[]` by status (TO_WATCH first) then title | — | `useResources(target)` |
| `resources.create(input, target)` | creates + links in one transaction | `ResourceRow` | `RESOURCE_TITLE_REQUIRED`, `RESOURCE_URL_INVALID`, `RESOURCE_TYPE_NOT_FOUND`, `RESOURCE_LINK_TARGET_NOT_FOUND` | — |
| `resources.update(id, Partial<ResourceInput>)` | title/url/author/type set `user_edited_at` on seed rows | `ResourceRow` | `RESOURCE_NOT_FOUND` + validation | — |
| `resources.setStatus(id, status)` | | `ResourceRow` | `RESOURCE_NOT_FOUND` | — |
| `resources.softDelete(id)` / `undoDelete(id)` | soft-deletes the resource and its links / restores both | `ResourceRow` | `RESOURCE_NOT_FOUND` | — |
| `resources.link(id, target)` / `unlink(id, target)` | | — | `RESOURCE_LINK_TARGET_NOT_FOUND` | — |
| `resourceTypes.list()` | | `ResourceTypeRow[]` by sortOrder | — | `useResourceTypes()` |

### §5.7 About and backup

| function | input | output | codes | live |
|---|---|---|---|---|
| `about.get()` | — | `AboutData` (`appVersion` from `expo-constants`, read in the hook, not the repository) | — | `useAbout()` (app_meta, settings) |
| `BackupExclusion.exclude(uris)` (seam, `db/backup.ts`; type re-exported from `src/repositories`) | the `SQLite/` directory URI plus the file URIs that exist | `{ status: BackupExclusionStatus; failed: string[] }` | never throws | — |
| `setBootstrapOverrides(overrides)` (`db/bootstrap.ts`, re-exported from `src/repositories`) | `Partial<BootstrapDeps>` — the frontend passes `{ backupExclusion }` once at app start | — | — | — |

### §5.8 Sessions (unchanged surface, one behaviour change)

`sessions.home` builds `suggestions` from `progression.overview` (PS-06). `SessionDetail.focuses[].name` already follows renames and merges (joined by id).

### §5.9 Hooks (`repositories/hooks/index.ts`, exposed through `src/hooks/data`)

`useProgress()`, `useAlgorithmParams()`, `useRankHistory()`, `useTechnique(id)`, `useResources(target)`, `useResourceTypes()`, `useAbout()`; `useDataActions()` gains `setParam`, `resetParams`, `setSetting`, `updateRank`, `deleteRank`, `undoDeleteRank`, `createPosition/Technique/Subject`, `update*`, `deleteTaxonomy`, `undoDeleteTaxonomy`, `addAlias`, `removeAlias`, `undoRemoveAlias`, `merge`, `undoMerge`, `createResource`, `updateResource`, `setResourceStatus`, `deleteResource`, `undoDeleteResource`.

## §6 Progression algorithm v1 — unit-test precision (data-coder; PRODUCT §7, sprint-0 §8, R-49)

### §6.1 Params (rows of `algorithm_params`, version `v1`; defaults R-49)

`windowWeeks` 8 [2, 26] int · `staleDays` 21 [7, 90] int · `minSessions` 3 [2, 10] int · `trendImproving` 0.5 [0.1, 2] · `needsWorkThreshold` 0.5 [0.1, 1] · `wNeedsWork` 0.4 [0, 1] · `wHitCaught` 0.25 [0, 1] · `wGap` 0.2 [0, 1] · `wTrend` 0.15 [0, 1] · `hitCaughtMinEvents` 3 [1, 20] int. A missing key → `PARAM_UNKNOWN`; the domain never substitutes a default.

### §6.2 Window and ordering (PS-03)

`windowStart = today − (windowWeeks × 7 − 1) days` (local dates, `domain/session/localDate.ts`); a row is in the window iff `windowStart ≤ localDate ≤ today`. Rows with `localDate > today` are ignored everywhere. Order = `localDate` asc, then `startsAt` asc. Live rows only (the repository filters soft-deleted sessions and focus rows).

### §6.3 Signals per focus (W = rows in the window)

- `n` = |{W : status = COMPLETED ∧ isActual}|; `nr` = those with a rating.
- `trend` (available iff `nr ≥ 2`) = mean(rating of the later ⌈nr/2⌉ rated rows) − mean(rating of the earlier ⌊nr/2⌋ rows), in the §6.2 order. Range −4…4.
- `needsWorkRate` (available iff `n ≥ 1`) = |{COMPLETED ∧ isActual ∧ needsWork}| / n.
- `gap` (available iff `planned ≥ 1`): `planned` = |{W : isPlanned}| over any status; `plannedNotTrained` = |{W : isPlanned ∧ ¬isActual ∧ (status ∈ {COMPLETED, SKIPPED} ∨ (status = PLANNED ∧ startsAt + 24 h < nowIso))}|; `gap = plannedNotTrained / planned`. `nowIso` is the injected clock (S2), compared as ISO-UTC strings after adding 24 h; `today` at 00:00 local is **not** used.
- `daysSince` (available iff the focus has any COMPLETED ∧ isActual row **all time**) = `today − max(localDate)` of those rows, in whole days; `lastTrainedOn` = that date.
- `hitRatio` (available iff `Σ hitCount + Σ caughtCount ≥ hitCaughtMinEvents` over W, COMPLETED ∧ isActual) = `Σ hit / (Σ hit + Σ caught)`.

### §6.4 Rules (first match wins) and output

1. `n = 0` ∨ `¬daysSince.available` ∨ `daysSince > staleDays` → **NOT_TRAINED**, rule 1.
2. Score over the available terms among `needsWorkRate` (weight `wNeedsWork`, term = rate), `hitRatio` (`wHitCaught`, term = 1 − ratio), `gap` (`wGap`, term = gap), `trend` (`wTrend`, term = max(0, −trend) / 4). Let `S` = the available set; `score = Σ_{s∈S} w_s·term_s / Σ_{s∈S} w_s` (rescaling; if `Σ w_s = 0` the score is 0). `score ≥ needsWorkThreshold` → **NEEDS_WORK**, rule 2. (`needsWorkRate` is always available here because n ≥ 1.)
3. `trend.available ∧ trend ≥ trendImproving ∧ n ≥ minSessions` → **IMPROVING**, rule 3.
4. else **STEADY**, rule 4.

Output per focus: `state`, `rule`, `flagged` (PS-05), `n`, `score` (when rule 2 was evaluated, i.e. rule 1 did not fire), `lastTrainedOn`, `signals[]` with one row per `SignalId`: `available`, `value` (raw: trend −4…4, rates 0…1, daysSince integer, n integer), `weight` (the rescaled weight `w_s / Σ w_S` for the four scored signals, absent otherwise), `threshold` (set on exactly three rows: `daysSince` → `staleDays`, `trend` → `trendImproving`, `n` → `minSessions`; the score's threshold is not a row — the UI renders the score line from `score` and `params.needsWorkThreshold`), `contributed` (true when the signal was part of the rule that fired). No strings in the output.

**i18n keys (UI maps; designer's copy table fixes the English):** `progress.state.IMPROVING|STEADY|NEEDS_WORK|NOT_TRAINED` · `progress.rule.1|2|3|4` (the "why" sentence with interpolated `{{value}}`/`{{threshold}}`) · `progress.signal.n|trend|needsWorkRate|gap|daysSince|hitRatio.label` · `progress.signal.notEnoughData` · `progress.signal.weight` ("weight {{pct}}") · `progress.score` ("needs-work score {{score}} vs {{threshold}}") · `progress.rescaled` ("{{count}} signals rescaled") · `common.badge.flagged` (exists).

### §6.5 Test vectors (Jest, `domain/progression/__tests__/`; params = defaults, today 2026-11-01)

| case | rows (localDate · status · planned/actual · needsWork · rating · hit/caught) | expected |
|---|---|---|
| T1 empty | none | NOT_TRAINED rule 1, all signals unavailable |
| T2 planned only | 10-30 PLANNED p/¬a (startsAt 2 days ago) | NOT_TRAINED rule 1; gap available = 1 |
| T3 stale | 09-01 COMPLETED a rating 4 | NOT_TRAINED rule 1 (daysSince 61 > 21; outside the window so n = 0 too) |
| T4 flagged once | 10-30 COMPLETED a nw rating 3 | NEEDS_WORK rule 2, score 1 (only needsWorkRate), flagged true |
| T5 steady | 10-30 COMPLETED a rating 3 | STEADY rule 4 (n 1 < 3; score 0) |
| T6 improving | 10-20 r2 · 10-25 r3 · 10-30 r5 (COMPLETED a) | trend = (3+5)/2 − 2 = 2 ≥ 0.5, n 3 → IMPROVING rule 3 |
| T7 improving blocked by n | 10-25 r2 · 10-30 r5 | trend 3 but n 2 < 3 → STEADY |
| T8 declining | 10-20 r5 · 10-25 r4 · 10-30 r1, no flags | trend = (4+1)/2 − 5 = −2.5; score = (0.4·0 + 0.15·0.625)/0.55 ≈ 0.170 < 0.5 → STEADY |
| T9 gap drives | 10-12 COMPLETED p∧a r3 · 10-15, 10-20, 10-25 PLANNED p/¬a (startsAt > 24 h before `nowIso` 11-01T12:00Z) · 10-30 SKIPPED p/¬a | n 1, daysSince 20 ≤ 21 (rule 1 does not fire); needsWorkRate 0; planned 5, plannedNotTrained 4 → gap 0.8; score = (0.4·0 + 0.2·0.8)/0.6 ≈ 0.267 < 0.5 → STEADY rule 4; with `wGap` set to 1 → score 0.8/1.4 ≈ 0.571 → NEEDS_WORK rule 2 |
| T10 hit/caught | 10-30 COMPLETED a r3 hit 0 / caught 3 | hitRatio 0 available (3 ≥ 3); score = (0 + 0.25·1)/0.65 ≈ 0.385 → STEADY; caught 5 hit 0 and nw → (0.4 + 0.25)/0.65 = 1 → NEEDS_WORK |
| T11 window edge | windowWeeks 8: 09-07 is in (windowStart = 09-07), 09-06 is out | n counts 09-07 only |
| T12 same day | two COMPLETED rows on 10-30, startsAt 10:00 r2 and 18:00 r5, plus 10-29 r2 | order by startsAt → trend = (2+5)/2 − 2 = 1.5 |
| T13 future row | 11-05 PLANNED p | ignored; T1 result |
| T14 removed focus | taxonomy row deleted, live focus row 10-30 | computed, `removed: true`; with no row in the window → dropped by `overview` |
| T15 param guard | params missing `wGap` | `PARAM_UNKNOWN` |
| T16 rescale | needsWorkRate 0.5, gap unavailable, hit unavailable, trend unavailable | score 0.5 → NEEDS_WORK (≥) |
| NF-09 | 500 synthetic sessions × 3 focuses | `computeProgression` < 100 ms (node, informative threshold; assert < 500 ms to keep CI stable, log the value) |

### §6.6 Consistency heatmap — aggregation (ruling Q1 (a); data-coder, `domain/progression/panels/consistency.ts`)

Inputs: `SessionDayRow[]` (live sessions, `localDate ≤ today`), `today`, `windowWeeks` (the algorithm's row, so the heatmap and the states share one window). All arithmetic is on local-date strings through `domain/session/localDate.ts`: `addDays` and `weekStartOf` exist (`localDate.ts:49`, `:57`); **`diffDays(a, b)` is a new helper the data-coder adds with its own tests** (whole days between two local dates, UTC-safe); no `Date` time-zone conversion (CO-06, ADR 0016: `local_date` was fixed at write time in the device zone of that moment).

- `windowStart` as §6.2. `gridStart` = `weekStartOf(windowStart)` (the Monday on or before it); `gridEnd` = `addDays(weekStartOf(today), 6)` (the Sunday on or after `today`). Weeks = consecutive 7-day rows from `gridStart` to `gridEnd` (so `windowWeeks` or `windowWeeks + 1` rows).
- Per `DayCell`: `inWindow` = `windowStart ≤ localDate ≤ today`; `future` = `localDate > today`; `completed` = COMPLETED sessions that day; `skipped` = SKIPPED; `pending` = PLANNED (a stale planned session renders as pending-in-the-past, which the UI labels "not logged"); `minutes` = Σ `durationMinutes` of COMPLETED rows (missing = 0). Rows outside the grid (`localDate < gridStart`) are ignored.
- Per `WeekRow`: `completed` = Σ day `completed`. `totals` over `inWindow` cells only: `completed`, `activeDays` (cells with `completed ≥ 1`), `minutes`, `weeksInWindow` = `windowWeeks`, `weeksWithTraining` = weeks whose in-window cells have `completed ≥ 1`, `currentStreakWeeks` = number of consecutive weeks ending with the current week (the row containing `today`) with `completed ≥ 1` — the current week counts only if it already has one; otherwise the streak is counted from the previous week.
- Output is deterministic and index-stable: `weeks[i].days[j]` is `gridStart + 7i + j`.

**i18n keys:** `progress.consistency.title` · `progress.consistency.summary` ("{{completed}} sessions on {{activeDays}} days in {{weeks}} weeks") · `progress.consistency.streak` ("{{count}} weeks in a row") · `progress.consistency.week` (the one `accessibilityLabel` per week row, `role="image"`, composed from the day phrases `progress.consistency.cell`, `.cell.skipped`, `.cell.notLogged` (past days only), `.cell.planned` (today's pending), `.cell.outside`, `.cell.today` — design §4.2.3 and §8 R-A3 row own the phrasing; cells themselves are not accessibility elements) · `progress.consistency.empty` (names the next step: log a session) · `progress.consistency.legend.none|one|two|three` (levels 0, 1, 2, ≥ 3 sessions; every cell with ≥ 1 session draws its count, never colour alone).

**Test vectors (`today` 2026-11-01, a Sunday; `windowWeeks` 8 → `windowStart` 2026-09-07, a Monday → `gridStart` 09-07, `gridEnd` 11-01, 8 week rows):**

| case | rows | expected |
|---|---|---|
| H1 empty | none | 8 weeks × 7 cells, all zero; totals all 0; `currentStreakWeeks` 0 |
| H2 one session | 10-30 COMPLETED 60 min | `weeks[7].days[4]` (Friday) completed 1 minutes 60; totals completed 1, activeDays 1, minutes 60, weeksWithTraining 1, streak 1 |
| H3 two a day | 10-30 COMPLETED 60 · 10-30 COMPLETED (no duration) | cell completed 2, minutes 60; activeDays 1 |
| H4 statuses | 10-29 SKIPPED · 10-31 PLANNED (stale) · 11-01 COMPLETED 30 | 10-29 skipped 1, 10-31 pending 1, 11-01 completed 1; totals completed 1 |
| H5 window edge | 09-06 COMPLETED · 09-07 COMPLETED | 09-06 is before `gridStart` → ignored; 09-07 `inWindow` true, counted |
| H6 partial weeks | `today` 2026-11-03 (Tuesday), windowWeeks 2 → windowStart 10-21 (Wed) → gridStart 10-19, gridEnd 11-08 | 3 week rows; 10-19/10-20 `inWindow` false; 11-04…11-08 `future` true; totals count in-window cells only |
| H7 streak | COMPLETED on 10-13, 10-20, 10-27 (three consecutive weeks), nothing this week (11-01 is Sunday of week 10-26) | 10-27 is in the week of 10-26 = current week → streak 3; move the 10-27 row to 10-24 (week of 10-19, which already has 10-20) → current week empty, streak counted from the previous week → 2; from the original rows drop 10-20 → 1 |

### §6.7 Planned-vs-actual gap panel — aggregation (ruling Q1 (a); data-coder, `domain/progression/panels/plannedVsActual.ts`)

Inputs: the same `FocusHistory[]` the states use, `today`, `windowWeeks`, `nowIso`. Window and ordering as §6.2; the per-row classification is the §6.3 `gap` definition verbatim, so a focus's `gap` here equals its `gap` signal in the why sheet (PS-22; a Jest test asserts equality for every vector in §6.5).

- Per focus over W: `planned` = rows with `isPlanned`; `trained` = `isPlanned ∧ isActual`; `notTrained` = `isPlanned ∧ ¬isActual ∧ (status ∈ {COMPLETED, SKIPPED} ∨ (PLANNED ∧ startsAt + 24 h < nowIso))`; `pending` = `planned − trained − notTrained` (planned sessions less than 24 h old or in the future-but-≤ today part of W); `unplannedTrained` = `¬isPlanned ∧ isActual ∧ COMPLETED`; `gap` = `notTrained / planned` when `planned ≥ 1`, else absent.
- Rows: focuses with `planned ≥ 1 ∨ unplannedTrained ≥ 1`; order `notTrained` desc, `gap` desc, `name` asc; removed focuses last with `removed: true`. `totals` = column sums over the rows.
- Output carries no strings.

**i18n keys:** `progress.gap.title` · `progress.gap.summary` ("Trained {{trained}} of {{planned}} planned focuses; {{unplanned}} unplanned") · `progress.gap.row` ("{{trained}} of {{planned}}") · `progress.gap.pending` ("{{count}} pending") · `progress.gap.unplanned` ("+{{count}} unplanned") · `progress.gap.empty` ("Plan a session to compare plan and practice" — names the next step).

**Test vectors (`today` 2026-11-01, `nowIso` 2026-11-01T12:00:00Z, defaults):**

| case | rows for focus A | expected row A |
|---|---|---|
| G1 none | no rows | no row; totals 0; `rows` empty |
| G2 trained as planned | 10-30 COMPLETED p∧a | planned 1, trained 1, notTrained 0, pending 0, gap 0 |
| G3 skipped | 10-30 SKIPPED p∧¬a | planned 1, notTrained 1, gap 1 |
| G4 stale planned vs pending | 10-25 PLANNED p (startsAt 10-25T18:00Z) · 11-01 PLANNED p (startsAt 11-01T09:00Z) | planned 2, notTrained 1 (10-25), pending 1 (11-01: less than 24 h), gap 0.5 |
| G5 unplanned | 10-30 COMPLETED ¬p∧a | planned 0, unplannedTrained 1, gap absent; row present |
| G6 mixed and equality | T9 of §6.5 (first row 10-12 planned ∧ actual) | planned 5, trained 1, notTrained 4, pending 0, gap 0.8 — equal to the `gap` signal value of T9 (B2) |

## §7 Taxonomy editing and merge (data-coder)

### §7.1 Create / update
Position: name required (trim, non-empty); duplicate (PS-24) = a live position's canonical name or a live POSITION alias equal case-insensitively, checked on create and on a rename whose new name differs from the current one (the seed's one duplicate pair stays editable in every other field); slug = `slug(name)` + `-2`, `-3` on clash among live and deleted rows; parent must be live and not create a cycle (walk up ≤ 50 levels). Technique: name required; **no name uniqueness** (PS-24 — the seed has 164 duplicate names such as "Arm drag" from several positions); duplicate = an exact live edge with the same lower(name), `fromPositionId`, `toPositionId` and `type`, checked on create and on an update that changes any of those four; `fromPositionId` live; `toPositionId` required unless SUBMISSION (`TECHNIQUE_TARGET_REQUIRED`) and forbidden when SUBMISSION (`TECHNIQUE_SUBMISSION_HAS_TARGET`); slug minted as positions. Subject: name required, unique among live subjects (case-insensitive), checked on create and on a name change. Imported-field edits set `user_edited_at` (sprint-0 §6 list); `notes` never does.

### §7.2 Rename and aliases
Rename with `keepOldNameAsAlias !== false` adds a user alias = old name unless it equals the new name (case-insensitive) or an existing live alias of the same row. `addAlias` rejects a name equal to the row's canonical name or an existing live alias of that row; across rows duplicates are allowed (search ranks both). `removeAlias` soft-deletes; undo restores.

### §7.3 Merge moves (loser → survivor, one transaction)
POSITION: `session_focuses.focus_ref_id`, `cycle_focuses` (same column shape), `resource_links.target_id` (POSITION), `aliases.target_id`, `techniques.from_position_id` / `to_position_id`, children's `parent_position_id`; if the survivor's parent is the loser, the survivor takes the loser's parent. SUBJECT: `session_focuses`, `cycle_focuses`, `resource_links` (SUBJECT). TECHNIQUE: `session_techniques.technique_id`, `submissions.technique_id`, `resource_links` (TECHNIQUE), `aliases`. Folding when a live-unique index would collide (session_focuses per session, session_techniques per session/focus, resource_links per target, aliases per name): keep the survivor row, OR booleans, rating = survivor's if set else loser's, counts summed, comments joined with " / ", loser row soft-deleted. **When a loser `session_focuses` row folds into a survivor row (B1), every live `session_techniques` row whose `session_focus_id` is the loser focus row is re-pointed to the survivor focus row** (`repositories/sessions.ts:77-99` lists a focus's techniques by that id); if that collides on `session_techniques_focus_live_uq` (same session, survivor focus row, same technique) the loser's attachment row is soft-deleted and its `note` joined into the survivor's. The same applies to TECHNIQUE merges for `session_techniques.technique_id` (already listed) and to focus rows that are moved without folding (the attachment keeps its `session_focus_id`, which now belongs to the survivor's ref). Then: loser's canonical name and live aliases become survivor aliases (skip duplicates); loser soft-deleted with `user_edited_at` set. Self-loop edges after a position merge are kept.

### §7.4 Merge payload (JSON in `taxonomy_merges.payload`, versioned `{ v: 1 }`)
`{ v, kind, fromId, intoId, loser: <full loser row>, survivorBefore: { parentPositionId }, moved: [{ table, id, column, from }], folded: [{ table, loserId, survivorId, survivorBefore: <row> }], aliasesAdded: [id] }`. The B1 re-pointing is recorded as `moved` entries `{ table: 'session_techniques', id, column: 'session_focus_id', from: <loser focus row id> }` and, on collision, as `folded` entries for `session_techniques`. Undo (while `MERGE_NOT_LATEST` does not apply: no later live merge row names `fromId` or `intoId`): restore each `moved` column, restore folded survivor rows and un-delete loser rows, soft-delete `aliasesAdded`, restore the survivor's parent, un-delete the loser, set `undone_at`.

## §8 Resources, rank, settings, params (data-coder)

- **§8.1 Resources.** URL validation = `new URL()` succeeds with protocol `http:` or `https:`; blank → null. `create` links to the given target in the same transaction. Status toggle never sets `user_edited_at`. `listFor` joins the type name. Seeded rows (`origin = seed`, source `grapplemap`) are editable; a seed re-import skips rows with `user_edited_at` (existing `importRelease` rule).
- **§8.2 Rank.** `rank.scale` is read inside `current`/`history` when `scale` is not passed; `update` re-validates belt-for-scale and stripes; `add` from the sheet uses the active scale.
- **§8.3 Settings.** `validateSettingValue` checks the PS-08 vocabularies and `suggest.max` 0–10.
- **§8.4 Params.** `set` reads the row (`min`, `max`), checks integer keys, writes `value`; `resetAll(version)` writes `value = default_value` for every live row of the version. `useAlgorithmParams` subscribes to `algorithm_params` and `settings`.

## §9 Backup exclusion (CO-28, R-39, ADR 0020)

- **§9.1 Seam (data-coder, `mobile/src/db/backup.ts`).** `interface BackupExclusion { exclude(uris: string[]): Promise<{ status; failed: string[] }> }`; `fakeBackupExclusion()` records calls; `notApplicableBackupExclusion` resolves `not_applicable` and is `nativeBootstrapDeps()`'s default. `setBootstrapOverrides(overrides)` in `db/bootstrap.ts` stores `Partial<BootstrapDeps>` that `bootstrapDatabase()` and `resetDatabase()`'s bootstrap merge over the native deps (the existing `overrides` parameter stays for tests). `runBootstrap` calls `exclude` after `openEncryptedDatabase` with the URI of expo-sqlite's database directory (`defaultDatabaseDirectory`, which holds only `matiq.db*`) followed by the URIs of `matiq.db`, `-wal`, `-shm` that exist (`databaseFile(name, suffix).exists`) — directory first because SQLite recreates `-wal`/`-shm` and a directory exclusion covers them (N8); per-file exclusion is kept as belt-and-braces and the call repeats on every launch and after reset. Writes `app_meta.backup_exclusion` and `backup_exclusion_checked_at`, logs a warning on `failed`, never fails bootstrap. Jest: the directory URI then the three file URIs, in order; a `failed` result still yields `ok: true`; the default yields `not_applicable`; `setBootstrapOverrides` reaches both bootstrap and reset. `src/db` imports nothing from `mobile/modules/**` (S6).
- **§9.2 Native module (frontend-coder, `mobile/modules/matiq-backup/`).** Files: `expo-module.config.json` (`platforms: ["apple"]`), `ios/MatiqBackup.podspec`, `ios/MatiqBackupModule.swift`, `index.ts`. iOS: `Function("setExcludedFromBackup")` sets `URLResourceValues.isExcludedFromBackup` on the `file://` URI (file or directory) and returns the re-read value; `Function("isExcludedFromBackup")`. `index.ts` exports the two functions, `isAvailable` (`Platform.OS === 'ios'`) and `backupExclusionAdapter: BackupExclusion` (type from `src/repositories`): on iOS it excludes every URI and reports `excluded` or `failed` + the failing URIs; on Android it resolves `not_applicable` without loading the native module. `_layout.tsx` calls `setBootstrapOverrides({ backupExclusion: backupExclusionAdapter })` at module scope, before the first `useDatabaseBootstrap()`. No `app.json` change (autolinking default `./modules`). Facts to confirm and append to `docs/stack-notes.md`: expo-modules-core 58.0.29 Swift DSL names; `npx create-expo-module@latest --local` scaffold shape (incl. the podspec); whether `isExcludedFromBackup` on the directory is honoured on the simulator.
- **§9.3 Verification.** (1) Jest on the seam (§9.1). (2) Dev-client rebuild `npx expo run:ios` by the frontend-coder in phase B — the module changes the native build (pod install); recorded in `verify.md`; a CocoaPods/simulator failure is `INFRA UNAVAILABLE` → PO builds (CO-14 pattern). (3) About shows `about.backup.status` = the `excluded` copy; Maestro `settings-about.yaml` asserts it (copy under test). (4) Tester measures on the simulator container: `xattr -p com.apple.metadata:com_apple_backup_excludeItem <path to matiq.db>` — a measurement for `docs/stack-notes.md`, not a gate (the simulator may not persist the attribute); the module's getter is the assertion.

## §10 Screens (frontend-coder; copy and testID tables in `design.md`)

- **Shell.** Tabs Home · Library · Log · Progress · Profile (PS-10); `headerBackButtonDisplayMode: 'minimal'` on the root, library, progress and profile Stacks (PS-18); theme override effect in `_layout.tsx` (PS-09).
- **Progress (`(tabs)/progress/index`).** Sections per state in PS-04 order, each row: name, state (text + icon, never colour alone), Flagged badge, one-line summary (`progress.rule.n`); tap → "why" sheet (`progress-why` formSheet with `kind`, `refId` params or in-screen; designer) listing every `SignalRow` (label, value or "not enough data", weight, threshold, contributed mark), the score line, the window, a link to Settings › Algorithm; empty state names the next step (log a session). Removed focuses under a "Removed" header. **Secondary panels (ruling Q1 (a)), below the state list, in this order:** (1) consistency heatmap — `weeks × 7` grid from `ConsistencyData` with Monday-first columns, cells outside the window dimmed, future cells empty, intensity by level token plus the drawn count (never colour alone); accessibility per design §4.2.3 / §8: the header text is the chart summary and each week row is one `role="image"` stop (`progress.consistency.week.<weekStart>`) whose label joins the day phrases, cells are not accessibility elements; summary and streak lines, empty copy; (2) planned-vs-actual — summary line + one row per `GapRow` (name, "x of y", pending and unplanned counts, Flagged badge not shown here), tap → the focus's why sheet; (3) rank history — current entry and promotions (`useRankHistory`), "Set rank" entry. Designer fixes sizes within tokens; the grid is a plain `View` grid, no chart library.
- **Profile (`(tabs)/profile/index`).** Rank header (belt visual, name, stripes, since; "Set rank" opens the existing sheet with the active scale) · groups: Algorithm (`profile/algorithm`: window, thresholds, weights as steppers/sliders with min/max, live state preview count, "Reset to defaults" → toast with Undo = restore the previous values) · Suggestions (`profile/suggestions`: four switches + max stepper 0–10) · Logging (detailed rounds switch — stored only; the rounds UI is sprint 3, copy says so) · Library (show extended library switch) · Appearance (segmented SYSTEM / LIGHT / DARK) · Rank (`profile/rank`: scale segmented ADULT / KIDS, history list with edit sheet, swipe/soft delete + undo toast) · About (`profile/about`: attribution per PS-19, versions, backup status line, licence links).
- **Library editing.** Index: add button per segment → `library-edit` formSheet (`kind`, `id?`); row long-press/overflow → Rename, Aliases, Merge into…, Delete (undo toast). Position detail gains Edit; `library-edit` sheet fields per §7.1 incl. an alias chip list (add/remove) and, for techniques, from/to position pickers reusing `FocusSearch` restricted to positions, type segmented, applies-to, perspective. merge = an inline panel of the same `library-edit` sheet (design P-17; nested sheets are unsupported on Android): search survivor (same kind, same submission-ness for techniques), confirm → toast "Merged into X" with Undo (PS-14). Extended-tier rows reachable only with the setting on.
- **Technique detail (`(tabs)/library/technique/[id]`).** Header name + aliases, type, from → to (links to position detail), GI/NOGI, perspective, description (imported), notes (user, editable inline or via sheet), Resources list (status toggle, open URL, edit, add → `resource-edit` formSheet with title, URL, author/source, type picker, notes, status), History list (→ session detail). Library technique rows now push this route.
- **Dev reset screen** shows the backup status (`dev.reset.backup`) in `__DEV__`.
- **Jest (§11.2)**: screens on mocks; `testids.test.ts` reads every `docs/*/design.md`.

## §11 Tests and verify rows

### §11.1 data-coder Jest
§6.5 vectors; §6.6 H1–H7 and §6.7 G1–G6 plus the gap-equality test over every §6.5 vector; `progression.overview` returns both panels from one load; window/ordering; `diffDays`; suggestions with states; params set/reset/bounds/integer; settings vocabularies; rank scale filter/update/delete/undo; taxonomy create/rename-alias/parent-cycle/technique-target rules/soft delete + hidden edges/undo; PS-24 duplicate vectors: position rename to an existing name → `TAXONOMY_NAME_DUPLICATE`, editing only `notes` of one of the seed's duplicate-named positions passes, technique create with a name another edge uses from a different position passes, exact duplicate edge → `TAXONOMY_NAME_DUPLICATE`, technique update of `appliesTo` only on a seed row with a duplicate name passes; alias add/remove/undo; merge per kind incl. fold, survivor-parent swap, self-loop, subject (no aliases), **B1: a session with both loser and survivor focus rows where a technique is attached to the loser row — after the merge `sessions.getDetail` lists the technique under the survivor focus; after `undoMerge` it is back on the loser row, byte-equal rows**, undo round-trip equality of all moved rows, `MERGE_NOT_LATEST`; resources validation/link/unlink/status/delete-undo; `getTechnique` history; backup seam; purity test extended to the new domain files; `TZ=UTC` and local runs (CO-06).

### §11.2 frontend-coder Jest
Progress list order and why-sheet rows from a mocked `ProgressOverview`; heatmap renders `weeks.length × 7` cells and `weeks.length` week rows (`progress.consistency.week.<weekStart>`, `role="image"`) whose `accessibilityLabel` carries the day phrases per design §4.2.3 (today's pending reads "planned", "not logged" only for past days), dims out-of-window cells, and exposes no cell as an accessibility element; gap panel rows in `rows` order with the "x of y" copy; params screen rejects out-of-range (error banner from `errors.PARAM_OUT_OF_RANGE`); theme effect calls `Appearance.setColorScheme`; tab bar renders five tabs; library edit sheet validation copy; technique detail renders resources/history; About renders every `attribution.json` source with its link; testID table coverage.

### §11.3 tester (Maestro, iOS simulator, dev-client rebuilt with the module)
| flow | journey | asserts |
|---|---|---|
| `features/progress-states.yaml` | reset → plan a session for focus A (never log it) → log a session with focus B flagged and focus C rated, no flag → Progress | A = Not trained lately, B = Needs work + Flagged, C = Steady; why sheet for B shows `needsWorkRate` row and "not enough data" rows |
| `features/progress-panels.yaml` | reset → Progress (empty) → log one session (focus C, unplanned, 45 min) → Progress | before: `progress.consistency.empty` and `progress.gap.empty` visible; after: `progress.consistency` grid visible, `progress.consistency.summary` shows "1 session on 1 day" (design P-30 plural copy, under test), `progress.gap.POSITION.<C id>` row visible with the "+1 unplanned" copy, `progress.gap.summary` visible; `progress.rank` card visible. Clock-independent (N5): no planned session is created here — plan mode defaults to the next full hour, which lands tomorrow after 23:00 and the gap panel ignores future rows; today's cell id is unknown to the flow, so the summary copy is the assertion |
| `features/settings-weights.yaml` | from `progress-states` → Profile › Algorithm → `wNeedsWork` typed to 0 → Progress | B's score becomes 0 (its only available signal now has weight 0, §6.4 `Σ w_S = 0`) → B flips to Steady live; Reset to defaults → B back to Needs work; typing 1.5 into `wNeedsWork` shows `errors.PARAM_OUT_OF_RANGE` in the banner (S4: the threshold cannot flip a score of 1.0) |
| `features/library-edit.yaml` | Library › positions plus → `library-edit` create "Zeta guard" → detail → `position.edit` → rename to "Zeta guard high" (alias kept) → search "zeta guard" finds it via alias → `position.edit` → delete → undo | entry points per design P-16 (plus button, detail header Edit; no long-press); rows by `id` regex (`library\.position\..*`, Maestro ids are regexes) since user ids are minted |
| `features/library-merge.yaml` | create "Zeta A", "Zeta B" → log a session on Zeta A → Zeta A detail → `position.edit` → `libraryEdit.merge` → `libraryEdit.merge.result.<B id>` → `libraryEdit.merge.confirm` → session detail shows Zeta B → `toast.undo` → shows Zeta A | merge is the inline panel of `library-edit` (design P-17), not a sheet |
| `features/technique-resources.yaml` | Library › technique (seed id from `seed/taxonomy.json`) → detail → add resource (title, URL) → toggle watched → delete → undo | |
| `features/settings-rank-theme.yaml` | Profile › Rank: scale KIDS → add GREY 1 stripe → Home shows it → scale ADULT → Home shows the adult entry or empty; Appearance → DARK → segmented value persists after relaunch | |
| `features/settings-about.yaml` | Profile › About | `about.attribution.bjj-data-by-grapple-flows.link` visible (design P-27 slug = kebab-case of `source.name`); `about.backup.status` shows the `excluded` copy |
| `regression/back-label.yaml` | Home → recent session → detail | `assertNotVisible: text: "(tabs)"` |

Flows reuse `subflows/reset.yaml`; new flows start from it; Metro port per run (`-e METRO_URL=…`).

## §12 Edge cases (full)

- **Sparse data** — omitted signals rescale (§6.4); only `needsWorkRate` → compared alone; the sheet lists them as "not enough data" with `contributed: false`.
- **n = 0 but trained long ago** — rule 1 fires on `n = 0` even when `daysSince` is small? Impossible: an actual COMPLETED row inside the window gives n ≥ 1; outside the window gives daysSince ≥ windowWeeks×7 ≥ 14 — with `staleDays` < that window the states agree; with `staleDays` ≥ window (e.g. 90 vs 2 weeks) a focus can be NOT_TRAINED by `n = 0` while `daysSince ≤ staleDays`; the rule-1 sentence then cites `n`, not days (`progress.rule.1` takes both values).
- **Planned-only focus** — NOT_TRAINED, gap = 1 shown in the sheet (T2).
- **Future-dated sessions** — ignored by the algorithm (§6.2); Home still shows them as next.
- **PLANNED less than 24 h past** — not yet "not trained" (pending); gap excludes it from the numerator but it counts in `planned`.
- **Same-day sessions** — `startsAt` order (T12).
- **Deleted focus in the window** — computed and shown under Removed; its Home suggestion is suppressed (`removed`).
- **Heatmap, no sessions** — full zero grid plus the empty copy; never a spinner (NF-09).
- **Heatmap, partial weeks** — `windowStart` is rarely a Monday and `today` rarely a Sunday: out-of-window cells are rendered dimmed, excluded from totals (H6); the grid never shows fewer than `windowWeeks` rows.
- **Heatmap, several sessions a day** — count and minutes sum; level ≥ 3 caps the intensity; the label carries the exact count (H3).
- **Heatmap, travel across zones** — `local_date` was fixed when the session was written (ADR 0016); a session logged at 23:30 in Tokyo and viewed in Amsterdam stays on its Tokyo date; `today` comes from the device's current zone (`useLocalDate`), so the current-week row can shift by a day after travel — accepted, consistent with Home (R-46).
- **Heatmap, missing duration** — contributes 0 minutes, still counts as a session.
- **Gap panel, no planned rows** — a focus trained without a plan shows "+n unplanned" and no gap (G5); with no rows at all the empty copy names the next step (plan a session).
- **Gap panel, pending planned** — a planned session less than 24 h old or dated today is `pending`, not a gap (G4); it moves to `notTrained` after 24 h without logging, which is also when the gap signal moves (same rule).
- **Gap panel vs why sheet** — identical `gap` by construction (PS-22, equality test); if the sheet omits `gap` as "not enough data" the panel shows no row for that focus either (both require `planned ≥ 1`).
- **Panels and the window setting** — changing `windowWeeks` re-aggregates both panels live with the states.
- **Merge while Progress is open** — live hooks re-read; the survivor's history now includes the loser's rows (n, trend recomputed).
- **Merge folding** — §7.3; the survivor row's prior values are in `folded[].survivorBefore` for undo; techniques attached to a folded focus row follow it to the survivor focus row (B1), so session detail keeps listing them.
- **Duplicate names in the seed** — one position pair and 164 technique names are duplicates today (PS-24); edits that leave the compared fields unchanged pass; a user who renames one of the pair to the other's name is refused, and the seed re-import never runs the check.
- **Survivor's parent is the loser** — survivor takes the loser's parent (§7.3), restored on undo.
- **Subject merge** — no aliases table for subjects: the loser's name is recorded in the payload only; search no longer finds it (R-34 covers positions and techniques).
- **Rename to an existing alias of the same row** — the alias is removed (soft) and the name takes over; undo of the rename is not offered (edit again).
- **Alias equal to the canonical name** — `ALIAS_DUPLICATE`.
- **Technique with an extended-tier endpoint** — visible when `library.showExtended` is on; the picker in `library-edit` honours the setting.
- **Params edited while Progress is open** — live hook recomputes; `resetAll` toast Undo restores the previous `value`s (frontend keeps the snapshot).
- **Weights all zero** — score 0 → never NEEDS_WORK; allowed (bounds [0, 1]); the sheet shows weights 0 %.
- **Theme override** — `LIGHT`/`DARK` call `Appearance.setColorScheme('light' | 'dark')`; `SYSTEM` calls it with `'auto'`, which removes the override (S1; `'unspecified'` is not used); form sheets and headers read tokens from `useTheme`, so they follow; applied before the splash hides.
- **Kids scale with no entries** — Home rank card shows the empty state of that scale; adult entries stay stored.
- **Belt not in the scale** — `RANK_BELT_INVALID_FOR_SCALE` (exists) on update too.
- **Resource without URL** — allowed (book); the open-URL action is hidden; URL with a non-http scheme → `RESOURCE_URL_INVALID`.
- **Deleting a resource linked elsewhere** — soft-deletes the resource and all its links; undo restores all.
- **Backup exclusion** — after `resetDatabase` the files are new → re-run; a missing `-wal`/`-shm` (not yet created) is skipped, so the attribute is set on the next launch; `failed` is shown in About and logged, never blocking.
- **Soft-deleted technique endpoint** — edge hidden from lists, pickers and `getPosition.techniquesFrom/To`; `getTechnique` still opens from history with "(removed)" endpoints.
- **Time zones (CO-06)** — `today` from `useLocalDate` (device zone); Jest runs under `TZ=UTC` and the local zone; test vectors use fixed `today`.
- **One-handed entry** — Progress and Settings are read-mostly; edit sheets keep the primary action bottom-anchored (`BottomActionBar`).
- **Dark mode** — tokens only; the theme override makes both schemes testable on one simulator; heatmap levels are tokens with AA-checked contrast against the surface in both schemes (designer §9) and the count label is the non-colour channel.
- **Maestro reach** — new routes reachable from tabs; `progress-why`, `library-edit` (with its inline merge panel `libraryEdit.merge.panel`, P-17) and `resource-edit` are formSheets with `testID` roots; the reset subflow is unchanged.
- **Export/erase readiness** — merges, aliases, resources and `app_meta` rows are ordinary seam rows; nothing new outside the database.

## §13 Open questions — all ruled by the PO on 2026-11-01 (relayed by the coordinator; quotes verbatim; `docs/decisions.md` entries by the documenter)

1. **Q1 Progress secondary panels.** Readings: (a) rank history + heatmap + gap panel now; (b) rank history now, the rest in sprint 3; (c) none now. Planner's default was (b). **Ruled: "(a). Rank history, heatmap and gap panel all ship now."** → §6.6, §6.7, PS-21–PS-23, §10, §11; no carry-over row.
2. **Q2 Session-type / resource-type editing.** Readings: (a) in sprint 2; (b) sprint 3. **Ruled: "(b). Session-type and resource-type list editing moves to sprint 3. Until then the pickers read the seeded lists."** → §15 close-out line.
3. **Q3 Profile tab = Settings surface.** Readings: (a) yes, titled "Profile"; (b) a "Settings" tab. **Ruled: "(a). The Profile tab is the Settings screen: rank at the top, settings groups below, titled \"Profile\"."** → PS-10.
4. **Q4 Coral/red belts (CO-27).** Readings: (a) now, one migration; (b) later. **Ruled: "(b). Coral/red belts later. No migration this sprint."** → CO-27 stays open; PS-01.
5. **Q5 Theme override (the §16 conflict between R-44's "system theme only (21)" and PRODUCT §6 "read from sprint 2").** **Ruled: "Yes, theme override ships in sprint 2."** → PS-09; the sprint-1 system-only limit has expired.

No open question remains; the designer resolves only design-level choices (sheet vs in-screen why, heatmap sizing, icons) in `design.md`'s Decisions table.

**Review S3 (name uniqueness) is not raised as a PO question.** `docs/decisions.md` has no uniqueness bullet, but the rule follows from two binding facts: PRODUCT §8 defines a technique as a typed edge between positions (its identity is the endpoints and type, not its label), and the shipped seed the PO accepted (R-48, "the curated core … stands") carries 164 duplicate technique names and one duplicate position name. A rule that rejected those rows would contradict an accepted artefact; PS-24 is the only reading consistent with both. If the PO wants technique names unique per from-position, the 10 seed rows that break it need a curation pass first (CO-33) — flagged here, not assumed.

## §14 Recorded decisions carried forward (binding on the designer and coders)

- `docs/decisions.md`: R-08, R-17, R-22, R-49 (algorithm, states, versioning, defaults) · R-09, R-21 (suggestion switches, max 3) · R-10 (rank, kids scale) · R-14, R-23, R-34, R-50/A-9 (rename follows id, soft delete, merge, aliases, old name kept) · R-19 (detailed-rounds toggle) · R-26 (undo toast, no confirm dialogs, one-handed, empty states, light/dark) · R-28 (attribution in app) · R-29, R-33 (resources manual, no scraping) · R-39 (backup exclusion) · R-44 (DSR resolutions; theme override read from sprint 2 per PRODUCT §6) · R-45 (tab order) · R-47 (expo-symbols icons) · R-18 (hit targets).
- `docs/product-spec/plan.md` §4.2/§4.3 (keys, params, bounds), §6 (which edits set `user_edited_at`; merge folding; soft-delete reads; weights editing; kids scale switch), §8 (algorithm shape).
- `docs/foundation/plan.md` F-07 (module deliverable), F-18 (final tab order), F-23/F-24 (Library read-only until now; technique detail sprint 2), F-25 (dev reset route); `docs/foundation/design.md` §4.1 shell and §10.2 routes stay the base.
- `.claude/rules/data.md` (no hard delete; domain purity; weights as inputs; live queries in hooks), `frontend.md` (tokens, i18n keys, testIDs, verification incl. the dev-client smoke), `e2e.md` (ids, reset, idempotent flows), `privacy.md` (backup exclusion, no network).

## §15 Carry-over in/out and close-out rows

| row | this sprint | note |
|---|---|---|
| CO-06 | in (process) | coders run `TZ=UTC npx jest` and the local zone before CODING COMPLETE |
| CO-13 | closes | PS-20: already pruned; remaining packages are peers/config backers |
| CO-22 | out | no scraping; manual entry only (R-33) |
| CO-24 | out | export is sprint 3 |
| CO-26 | closes | PS-15: column stays `author`, label "Author / source" |
| CO-27 | out | ruled Q4 (b) 2026-11-01: "Coral/red belts later. No migration this sprint." — stays open |
| CO-28 | in | §9 |
| CO-35 | in | PS-19 |
| CO-40 | out | dev-only tidy, untouched |
| CO-42 | in | PS-18 |
| new (orchestrator at close) | — | **Q2 (b), 2026-11-01:** session-type and resource-type list editing (PRODUCT §6 Settings, R-03/R-29) → sprint 3; until then the pickers read the seeded lists (owner: planner, sprint 3). Also: `MERGE_NOT_LATEST` means an older merge is undoable only after undoing the newer — a merge-log screen is v1.x. No row for the Q1 panels: they ship now |

## §16 Binding-source conflicts found

- R-44 records DSR-21 as "system theme only (21)" for sprint 1 while `docs/PRODUCT.md §6` Settings says the override "is read from sprint 2" and the orchestrator's brief lists it — settled by the PO's ruling Q5 (2026-11-01): "Yes, theme override ships in sprint 2." The sprint-1 system-only limit has expired; PS-09 applies.
- `docs/foundation/plan.md` F-23 "no UI to flip `library.showExtended` until sprint 2" — flipped now (Profile › Library).
