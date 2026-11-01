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
| simulator smoke | `npx expo run:ios` (not run) | INFRA UNAVAILABLE (CocoaPods missing; PO: `brew install cocoapods`); phase A runs only checks 1–4 | 5af8e0f | 2026-11-01 |

### data-coder @ 83e6f12 — 2026-11-01
| check | command | result | commit | date |
|---|---|---|---|---|
| tsc | `npx tsc --noEmit (mobile/)` | exit 0: 0 errors | 83e6f12 | 2026-11-01 |
| converter tsc (R1-06) | `npx tsc -p ../scripts/taxonomy/tsconfig.json (mobile/)` | exit 0: 0 errors; typeRoots ../../mobile/node_modules/@types, types node+jest | 83e6f12 | 2026-11-01 |
| Jest (data suites) | `npx jest --watchAll=false src/db src/domain src/repositories ../scripts/taxonomy` | exit 0: 16 suites, 391 tests passed | 83e6f12 | 2026-11-01 |
| Jest (all) | `npx jest --watchAll=false (mobile/)` | exit 0: 25 suites, 861 tests passed | 83e6f12 | 2026-11-01 |
| migrations in sync | `npx drizzle-kit generate && git diff --exit-code -- mobile/drizzle/` | exit 0: No schema changes, clean diff | 83e6f12 | 2026-11-01 |
| converter + seed diff | `node scripts/taxonomy/convert.ts && git diff --exit-code -- mobile/src/db/seed/ data/taxonomy/` | exit 0: clean; join sha256 734c5af0…bfa74e; emitted 1249/1485 transitions (84.1 %, below the 95 % target — see stack-notes) | 83e6f12 | 2026-11-01 |
| prebuild android | `CI=1 npx expo prebuild --platform android --no-install (mobile/)` | exit 0: gradle.properties expo.sqlite.useSQLCipher=true; AndroidManifest android:allowBackup="false"; output untracked (gitignored), not committed | 83e6f12 | 2026-11-01 |
| prebuild ios | `CI=1 npx expo prebuild --platform ios --no-install (mobile/)` | exit 0: Podfile.properties.json expo.sqlite.useSQLCipher "true"; mobile/ios generated (gitignored), not committed | 83e6f12 | 2026-11-01 |
| dev-client build / SQLCipher on device | `npx expo run:ios` (not run) | INFRA UNAVAILABLE — CocoaPods missing (PO: brew install cocoapods); encryption not verified on device, never mocked green | 83e6f12 | 2026-11-01 |

### tester (authoring) @ 2886ef9 — 2026-11-01
| check | command | result | commit | date |
|---|---|---|---|---|
| Maestro YAML parse | `node -e js-yaml loadAll` over e2e/maestro/**/*.yaml (mobile/node_modules) | exit 0: config.yaml, subflows/reset.yaml, 4 flows parse (syntax only; Maestro command validity not checked) | 2886ef9 | 2026-11-01 |
| maestro test (smoke, log-session, plan-then-log, browse-library) | `maestro test e2e/maestro/flows` (not run) | INFRA UNAVAILABLE — Maestro not installed; CocoaPods missing (no dev-client build) | 2886ef9 | 2026-11-01 |
| contract coverage audit | grep of data-contracts.md items in mobile/src/**/__tests__ | 4 gap rows, see test-report.md | 2886ef9 | 2026-11-01 |

### frontend-coder @ d7a1134 — 2026-11-01 (phase B)
| Command | Exit | Notes |
|---|---|---|
| npx tsc --noEmit | 0 | 0 errors |
| npx jest --watchAll=false | 0 | Test Suites: 26 passed, 26 total; Tests: 910 passed, 0 failed |
| node scripts/sync-design-tokens.mjs --check | 0 |  |
| node scripts/check-token-adherence.mjs | 0 |  |
| npx expo-doctor | 0 | 20/20 |
| npx expo run:ios (smoke) | INFRA UNAVAILABLE | CocoaPods missing (PO: brew install cocoapods); no dev-client build, no simulator smoke; never mocked green |

### frontend-coder @ 17ffe6e — 2026-11-01 (DB_NOT_OPEN title)
| Command | Exit | Notes |
|---|---|---|
| npx tsc --noEmit | 0 | 0 errors |
| npx jest --watchAll=false | 0 | Test Suites: 26 passed; Tests: 912 passed, 0 failed |

### tester (run phase) @ cc48e42 - 2026-11-01
| check | command | result | commit | date |
|---|---|---|---|---|
| flow testIDs exist in implementation | grep of each referenced testID in mobile/app, mobile/src (non-test) | all present, 0 missing | cc48e42 | 2026-11-01 |
| deep link scheme | grep scheme mobile/app.json | matiq, matches matiq://dev/reset | cc48e42 | 2026-11-01 |
| maestro test e2e/maestro/flows | not run | INFRA UNAVAILABLE (Maestro, CocoaPods missing) | cc48e42 | 2026-11-01 |

### data-coder (defect round 1) @ 6093d47 — 2026-11-01
| check | command | result | commit | date |
|---|---|---|---|---|
| tsc | `npx tsc --noEmit (mobile/)` | exit 0: 0 errors | 6093d47 | 2026-11-01 |
| Jest (all) | `npx jest --watchAll=false (mobile/)` | exit 0: 29 suites, 928 tests passed; adds bootstrapDatabase, useDatabaseBootstrap, readHooks suites (defect round 1) | 6093d47 | 2026-11-01 |
| data model generated | `node scripts/docs/gen-data-model.mjs` | exit 0: 21 tables, 0 undescribed; output committed | a3b4ee2 (documenter, mirrored by orchestrator) | 2026-11-01 |
| changelog generated | `node scripts/docs/gen-changelog.mjs` | exit 0: 2 migrations; output committed | a3b4ee2 (documenter, mirrored by orchestrator) | 2026-11-01 |
| Mermaid fences | grep of fence counts in architecture, requirements, erd | all even | a3b4ee2 (documenter, mirrored by orchestrator) | 2026-11-01 |

### tester (R2-04) @ f7e77c0 - 2026-11-01
| check | command | result | commit | date |
|---|---|---|---|---|
| reset subflow YAML parse | js-yaml loadAll e2e/maestro/subflows/reset.yaml | exit 0 | f7e77c0 | 2026-11-01 |
| maestro test | not run | INFRA UNAVAILABLE | f7e77c0 | 2026-11-01 |
