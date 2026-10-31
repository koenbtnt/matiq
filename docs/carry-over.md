# Carry-over ledger

| id | from sprint | item | owner | status |
|---|---|---|---|---|
| CO-01 | setup | Maestro in CI: a macOS runner with a prebuilt simulator app, or Maestro Cloud. Until then Maestro runs locally only and every run is recorded in `verify.md`. | PO / tester | open |
| CO-02 | setup | Update `CLAUDE.md` "Next step" after the `product-spec` PR merges (agents may not stage `CLAUDE.md`). | PO | open |
| CO-03 | setup | Android: EAS preview build (`eas build --platform android --profile preview`) and, when wanted locally, the Android SDK + an emulator (Android Studio is installed, the SDK is not) → Android Maestro flows. | PO / tester | open |
| CO-04 | setup | Design-system intake: the user saves the Claude Artifact to `design-system/artifact/matiq-design.html`; designer derives `tokens.json` / `components.md` / `RULES.md`; frontend-coder regenerates `tokens.ts`; reviewer-design follow-up pass. Until then `tokens.json` is the starter and no screen spec may be written. | PO / designer | done — `design-intake` chore 2026-10-31 (tokens v1, canvas v13); re-export repeats steps 2–5 |
| CO-05 | setup | Harness evals runner (sugar `scripts/claude/evals/`, cadence CO-31): port when a `.claude/**` change needs more proof than `hooks.test.sh`. | PO | open |
| CO-06 | setup | Jest under a non-UTC `TZ` once a date renders (cadence CO-28). | frontend-coder | open |
| CO-07 | setup | Apple Developer / Google Play accounts and EAS credentials before TestFlight or Play internal testing. | PO | open |
| CO-08 | setup | Sync backend: an ADR when chosen; the seam (`.claude/rules/data.md`) is the only commitment now. | planner | open |
| CO-09 | setup | JSON export/import and erase-all (publishing readiness, `.claude/rules/privacy.md`) in a v1 sprint. | planner | open |
| CO-10 | setup | `drizzle-sqlite` community skill (`pproenca/dot-skills`, experimental): audit its rules against expo-sqlite; keep or remove from `data-coder` `skills:`. | data-coder / PO | open |
| CO-11 | setup | GitHub rulesets on `develop` and `main` (require PR, block force-push/deletion) and `ci-ok` as a required check after the first green run. | PO | done — ruleset `protect develop and main (ADR 0001)` (id 26286621) created 2026-10-31 via `gh api`: deletion, non_fast_forward, pull_request (merge only), required_status_checks `ci-ok` |
| CO-12 | setup | Agent-memory lines tagged "cadence, unverified here": confirm or delete after the first frontend sprint. | frontend-coder / tester | open |
| CO-13 | setup | Prune the SDK 58 template's unused dependencies in `mobile/package.json` (`@expo/ui`, `expo-image`, `expo-symbols`, `expo-glass-effect`, `expo-web-browser`, `expo-device`, …) once the foundation sprint knows what the screens use; `npx expo-doctor` must stay green. | frontend-coder (foundation) | open |
| CO-14 | setup | Install CocoaPods (`brew install cocoapods`) so `npx expo run:ios` dev-client builds work; Expo Go (`npx expo start --go --ios`) is enough until a native module is added. | PO | open |
| CO-15 | design-intake | Load the fonts `tokens.ts` names (`Inter_400Regular/500Medium/600SemiBold/700Bold`, `Archivo_700Bold/800ExtraBold`) with `@expo-google-fonts/inter`, `@expo-google-fonts/archivo` and `useFonts` before any screen uses `textStyle`; until then text falls back to the system font. | frontend-coder (foundation) | open |
| CO-16 | design-intake | Rule on the design-system requests DSR-1…DSR-29 (`design-system/components.md § Open requests`): contrast failures (DSR-1…4), undrawn states (6–9), off-scale values (11, 13, 14), hit targets 44 vs 48 (16, grilling Q18), matIQ domain gaps (17–22), parked gym/coach/video/reminders (26–29, grilling Q16/Q11). Rulings land in `docs/decisions.md`; the designer applies them at the next intake or sprint. | PO | open |
| CO-17 | design-intake | Five `components.md` lines (52, 109, 155, 271, 319) still say "≥ 44/48"; R-M1 overrides them — tidy at the next intake (recheck N5). | designer | open |
| CO-18 | product-spec | Taxonomy conversion pipeline (GrappleMap → nodes/edges: pose canonicalisation, name cleaning, edge-type derivation, curated-core selection) in `scripts/taxonomy/` — design in sprint 1 planning (plan D-31, ADR 0012). | planner | open |
| CO-19 | product-spec | Optional: contact the BJJGraph author about a commercial licence (R-28; BJJGraph is reference-only until then). | PO | open |
| CO-20 | product-spec | Amend `.claude/rules/frontend.md` (44 pt / 48 dp, dev-client only, Expo Go removed) and the `CLAUDE.md` commands when sprint 1 lands SQLCipher (PO-owned files; ADR 0005, 0006). | PO | open |
| CO-21 | product-spec | Revisit R-30 (positions as focus nodes, ADR 0014 proposed/provisional) after the first user tests. | PO | open |
| CO-22 | product-spec | Terms-of-service assessment before any instructional-content scraping for Resources (R-33). | PO / planner | open |
| CO-23 | product-spec | PO rules on assumptions A-1…A-14 (`docs/product-spec/assumptions.md`; taken at default under the offline-autonomy instruction relayed 2026-10-31) and records that instruction as a quoted, dated sentence; a ruling that differs → planner updates PRODUCT.md / decisions.md / the affected ADR. | PO | open |
| CO-24 | product-spec | Tombstone purge policy (export carries tombstones in full) — decide before any store release (plan §6, §12). | planner | open |
| CO-25 | product-spec | Confirm the `expo-secure-store` this-device-only keychain constant, iOS backup exclusion of the DB and Android `allowBackup=false` against SDK 58 docs (context7 was unavailable); append to `docs/stack-notes.md` (A-11, ADR 0006). | data-coder (sprint 1) | open |
| CO-26 | product-spec | `resources.author` vs `source` naming clash with the imported-row `source` column (plan §12). | designer / planner | open |
| CO-27 | product-spec | Coral/red belts (beyond black) in the rank model (`rank_entries`, R-10) (plan §12). | planner | open |
