# foundation — verify

Rows are appended per agent, per run. Columns: check · command · result · commit · date.

### frontend-coder phase A @ 5af8e0f — 2026-11-01
| check | command | result | commit | date |
|---|---|---|---|---|
| tsc | `npx tsc --noEmit` (mobile/) | exit 2: 0 errors in frontend paths; 1 error in `src/db/nativeDeps.ts` (missing `../repositories/seed`, data-coder work in progress, outside this scope) | 5af8e0f | 2026-11-01 |
| Jest (UI) | `npx jest --watchAll=false` | frontend suites 10/10 pass, 492 tests; the 3 failures are `src/db/__tests__/migrations.test.ts` (data-coder, schema in flux), not UI | 5af8e0f | 2026-11-01 |
| token sync | `node scripts/sync-design-tokens.mjs --check` | exit 0 | 5af8e0f | 2026-11-01 |
| token adherence | `node scripts/check-token-adherence.mjs` | exit 0 | 5af8e0f | 2026-11-01 |
| expo-doctor | `npx expo-doctor` | exit 0, 20/20 | 5af8e0f | 2026-11-01 |
| simulator smoke | `npx expo run:ios` | INFRA UNAVAILABLE (CocoaPods missing; PO: `brew install cocoapods`); phase A runs only checks 1–4 | 5af8e0f | 2026-11-01 |
