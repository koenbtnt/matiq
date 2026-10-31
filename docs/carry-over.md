# Carry-over ledger

| id | from sprint | item | owner | status |
|---|---|---|---|---|
| CO-01 | setup | Maestro in CI: a macOS runner with a prebuilt simulator app, or Maestro Cloud. Until then Maestro runs locally only and every run is recorded in `verify.md`. | PO / tester | open |
| CO-02 | setup | Update `CLAUDE.md` "Next step" after the `product-spec` PR merges (agents may not stage `CLAUDE.md`). | PO | open |
| CO-03 | setup | Android: EAS preview build (`eas build --platform android --profile preview`) and, when wanted locally, the Android SDK + an emulator (Android Studio is installed, the SDK is not) → Android Maestro flows. | PO / tester | open |
| CO-04 | setup | Design-system intake: the user saves the Claude Artifact to `design-system/artifact/matiq-design.html`; designer derives `tokens.json` / `components.md` / `RULES.md`; frontend-coder regenerates `tokens.ts`; reviewer-design follow-up pass. Until then `tokens.json` is the starter and no screen spec may be written. | PO / designer | open |
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
