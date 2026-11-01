# progress-settings — review 1 (Themis, 2026-11-01, plan + design @ 8c1d8ef)

## Checklist

- Plan: scope complete vs R-32 brief · §0 51 lines · §0.1 rulings quoted and dated · field-level data, API, edge cases, carry-forward: **pass**. Test vectors §6.5: **fail** (B2). Merge spec §7.3: **fail** (B1).
- Data rules: no new table/column (PS-01/PS-23 confirmed against `schema/*.ts`: `MERGE_TARGET_KINDS` incl. SUBJECT, `KIDS_BELTS`, stripes 0–6, `theme.override` in `settings/defaults.ts:18`) · codes named · `descriptions.json` planned · no migration to test: **pass**. Domain purity: **fail** (S2).
- Privacy: no network with user data, no SDK, export/erase unaffected, fictional fixtures: **pass**.
- Design: mode (`tokens.json` `_status` intake) · §0 33 lines · 390/430, light/dark, iOS/Android · states · copy table · testID table complete: **pass**. A11y: **fail** (S7, S8).
- Citations spot-checked (16): tk:198-203/:241-246, cm:98, :124, :127, :291, :310, :313, :337, `library/_layout.tsx:9-18`, `hooks/index.ts:47-49`, `autolinkingOptions.js:201`, expo-router `types.d.ts:426`, react-native-screens `types.d.ts:491`, contrast doc :40/:45/:64/:72/:73/:95/:96/:99 hold; `Appearance.d.ts:37` does not (S1); cm:310 deviates unrecorded (N1).
- Contrast: 7 new pairs recomputed by hand (L2 digit 6.91, L3 digit 5.01 / 12.38, L3 fill 5.43, L0/L1 1.03, L1/L2 2.51, L2/L3 dark 1.15); the kids band and bar pairs were not recomputed (script runs blocked by bash-guard rule 6). The values match §9.1 and `docs/design-system-contrast.md` :47-48, :101-116: **pass** (N2).
- Feasibility: backup module path in frontend scope (`frontend-coder.md:14`), not data-coder's; `nativeDeps` lazy-required (`bootstrap.ts:107`): **fail** (S6). R-26 criteria: **pass**. Deviations P-16/17/24/27/30 in §8: **pass**, plan §11.3 not aligned (S5).
- PO decisions needed: **none** — every finding is a planner or designer fix.

## Findings

| id | sev | where | defect | owner | fixed looks like |
|---|---|---|---|---|---|
| B1 | B | plan.md:338 §7.3 | Folding a loser `session_focuses` row does not re-point `session_techniques.session_focus_id`; `repositories/sessions.ts:77-99` lists techniques by `focusId === f.id`, so techniques attached to a folded focus vanish from session detail after a POSITION/SUBJECT merge — history loss (R-14, data.md) | planner | §7.3 moves `session_techniques.session_focus_id` loser-row → survivor-row and folds on `session_techniques_focus_live_uq`; §7.4 payload records it; §11.1 round-trip test with an attached technique |
| B2 | B | plan.md:275 §6.5 T9 | 10-10 → 11-01 = 22 days > `staleDays` 21, so rule 1 fires (NOT_TRAINED, no score), not STEADY / NEEDS_WORK; row is written `a` but G6 (plan.md:327) needs it planned ∧ actual (planned 5, trained 1) | planner | T9 first row dated ≥ 10-11 and marked p/a; expected values and G6 restated |
| S1 | S | plan.md:33, :416; design.md:103 | `Appearance.setColorScheme(null)` for SYSTEM: RN 0.88.1 takes `ColorSchemeOverride` = `'light'\|'dark'\|'auto'\|'unspecified'`; the cited `Appearance.d.ts:37` says pass `'auto'` to reset | planner, designer | SYSTEM → `'auto'` in PS-09, §12, design §4.1.4 and the §11.2 assertion |
| S2 | S | plan.md:164 §5.2 | `computeProgression(histories, params, today)` has no `nowIso`, yet §6.3 `gap` needs it (plan.md:248); the clock must be an input | planner | signature takes `{ today, nowIso }`; same on `progression.overview` |
| S3 | S | plan.md:194 §5.5 vs :332 §7.1 | `TAXONOMY_NAME_DUPLICATE` applies to `createTechnique`/`updateTechnique` in §5.5, but §7.1 has no technique rule; the shipped seed has 160 duplicate technique names (e.g. "Arm drag", "Ankle pick") and one duplicate position name, so a literal §5.5 blocks valid edges and may reject unrelated edits of those rows | planner | technique uniqueness defined (none, or per from-position); the check runs only when the name changes; a test vector |
| S4 | S | plan.md:379 §11.3 settings-weights | B's score is 1.0 (only `needsWorkRate`, rescaled); `needsWorkThreshold` max is 1 and rule 2 is `≥`, so the threshold cannot flip B to Steady | planner | flip by `wNeedsWork` → 0, or use a focus with a fractional score |
| S5 | S | plan.md:378, :381, :384 §11.3 | Flows contradict the design deviations: "1 sessions on 1 days" (P-30), `merge` formSheet (P-17), `about.attribution.grapple-flows.link` (P-27: `bjj-data-by-grapple-flows`) | planner | §11.3 uses the design §7 ids and the §6 strings |
| S6 | S | plan.md:90, :92 §3 steps 4/6 | Data-coder's `nativeDeps.ts` imports `../../modules/matiq-backup` while that path belongs to the frontend-coder, who runs in parallel: data-coder tsc depends on another agent's commit order | planner | remove the compile-time edge (frontend injects the adapter through `bootstrapDatabase(overrides)` / reset, or an untyped lazy `require` falling back to `not_applicable`), or put the ordering in §3 as an orchestrator gate |
| S7 | S | design.md:201-203, :914 | The editable stepper value sits inside the shipped `accessible` `adjustable` wrapper (`Stepper.tsx:69-73`); iOS hides children of an accessible parent, so typed entry is unreachable with VoiceOver; §4.4.2 (input label/hint) and §9 ("steppers adjustable") contradict | designer | one model: ± and value as adjustable, plus a separately focusable TextInput with its own label, in the §9 focus order |
| S8 | S | design.md:139 §4.2.3 | R-A3: charts are `role="image"` with a text summary; the heatmap exposes 56–63 cells with no role, as separate VoiceOver stops, and has no §8 row | designer | §8 deviation row with reason (plan §6.6/§11.2 cell labels), and cells grouped per week row (8–9 stops) |
| N1 | N | design.md:124 | Streak in `statMeta` 12/600 with no glyph vs cm:310 13/600 + flame; not in §8 | designer | §8 row |
| N2 | N | design.md:952 | The legend swatch sits on `bgSurface` (1.16/1.11), not `bgBase`; the out-of-window hairline `borderDefault` on `bgSurface` (1.38/1.31, doc :67) is not listed | designer | rows corrected; say that the window caption and labels carry in/out-of-window |
| N3 | N | design.md:139 | `cell.notLogged` also fires for a session planned later today | designer | only when `startsAt < now` |
| N4 | N | design.md:184 | SwitchRow `role="switch"` plus the native Switch child gives Android a duplicate stop | designer | inner Switch hidden from accessibility |
| N5 | N | plan.md:378 | Plan mode defaults to the next full hour (`log-session/state.ts:170-176`); after 23:00 the session lands tomorrow and the gap row never appears | planner | flow sets the time, or a note |
| N6 | N | plan.md:259 | Leftover deliberation ("`scoreThreshold`? no: …") in the §6.4 output spec | planner | clean sentence |
| N7 | N | plan.md:287 | `diffDays` and `weekdayMonday0` do not exist (`localDate.ts` has `addDays`, `weekStartOf`) | planner | marked as new helpers with tests |
| N8 | N | plan.md:92, :352 | §3 step 6 lists no podspec; per-file exclusion is reapplied each launch because SQLite recreates `-wal`/`-shm` — excluding the directory is sturdier | planner | podspec in the file list; directory option weighed |
| N9 | N | design.md:996-998 | Additive requests (endpoint `removed` flags, `AliasRow[]`) are not yet in plan §5 | planner | folded into §5.1/§5.5 |

REVIEW FAILED

- B1 merge fold orphans `session_techniques` (plan §7.3) · B2 T9 contradicts rule 1 (plan §6.5).
- S1–S6 planner, S1/S7/S8 designer; the recheck covers only these rows and what they touch.
