# foundation — review 2 (reviewer-code)

Reviewer: Themis · 2026-11-01 · HEAD d7e2058 · diff: `git diff $(git merge-base origin/feature/product-spec HEAD)..HEAD` (8876818..HEAD, sprint 1 only).
Pending PO defaults A-15…A-96 were audited as the spec, not failed for being pending.

## Checklist results

| # | area | result |
|---|---|---|
| 1 | Requirements (plan §0 F-01…F-26, §10 edge cases, design §6/§7/§9) | Met. Edge cases found in code and tests: key/DB matrix (`bootstrap.ts`, `seam.test.ts`), partition by local date (`domain/session/home.ts`, `sessions.test.ts`), `TECHNIQUE_REQUIRES_ACTUAL`/`COUNTS_REQUIRE_ACTUAL` (`validateLog.ts`), stale planned skip/undo, unresolved endpoints dropped with node kept (`report.json`). |
| 2 | Data layer | Met. No hard-delete path in `repositories/` or `db/` (grep); every read filters `deleted_at`; migration chain test is snapshot-driven (21 tables, every CHECK has a violation case); `domain/` has no db/React/Expo import, no clock, no randomness (`purity.test.ts`); only bare `throw new Error` is the key-length guard in `key/generate.ts:11` (internal, not a business rule); every contract name exists; generators re-run: no diff. |
| 3 | Expo / RN | Met with R2-01 (font bundle size). Tokens/adherence green, 31 files with `onPress` carry `testID`, all `errors.<CODE>` have copy, FlatList for unbounded lists, no web API, reduce-motion honoured. |
| 4 | Privacy | Met. See ruling 3. |
| 5 | Tests | 29 suites / 928 tests; no `.skip/.only/.todo`; contract-coverage gaps from test-report closed by 6093d47. Maestro never ran (INFRA). |
| 6 | Runtime | Green rows accepted (below). Simulator smoke, SQLCipher on device and all 4 flows are INFRA UNAVAILABLE with a PO action, as the rule allows. |
| 7 | Documentation | `docs-report.md` present; generators reproduce committed output; ADRs 0018-0023 quote the dated ruling; arc42 §5/6/8/9/11 and `docs/requirements/foundation.md` present. |

## Verification provenance

| check | source | sha | note |
|---|---|---|---|
| tsc 0; Jest 29 suites / 928 tests | verify.md (data-coder defect round 1) | 6093d47 | accepted; only docs commits after |
| token `--check`, adherence, expo-doctor 20/20 | verify.md (frontend-coder phase B) | d7a1134 | accepted: `git diff d7a1134..HEAD -- mobile` = en.json (+1 key) and 4 test files, no `package.json`, `app.json`, tokens or UI source, so the three checks cannot change. Sound. |
| drizzle-kit no diff; converter + seed diff; converter tsc; prebuild ios/android | verify.md (data-coder) | 83e6f12 | accepted; `mobile/drizzle`, `scripts/taxonomy`, `data/taxonomy`, `app.json` unchanged since |
| gen-data-model, gen-changelog | verify.md (documenter) + re-run by me | a3b4ee2 / d7e2058 | re-run: `git status` clean for `docs/data-model` (cheap conflict check) |
| Maestro, dev-client, SQLCipher on device | test-report.md | cc48e42 | INFRA UNAVAILABLE; not re-run (nothing installed) |

## Findings

| id | sev | file:line | finding | required change | owner |
|---|---|---|---|---|---|
| R2-01 | major | `mobile/src/hooks/fonts.ts:1-2` | Barrel imports from `@expo-google-fonts/inter` and `/archivo`. Each `index.js` `require`s every weight and italic (inter 7.9 MB, archivo 4.2 MB of ttf), and Metro bundles all of them although only six faces are used. | Import the six faces from their subpaths (`@expo-google-fonts/inter/400Regular`, ...); keep `fontMap` keys; Jest `transformIgnorePatterns` already covers the package. | frontend-coder |
| R2-02 | minor | `docs/carry-over.md` (no sprint-1 rows) | Deferred items are only in ADR/arc42 §11: iOS backup exclusion before a store release (A-16), 84.1 % endpoint resolution, dev-client/SQLCipher/Maestro unverified, plan §14 close-out items. CLAUDE.md says deferred items go in carry-over; the documenter has no scope for that file. | Add CO rows for each. | orchestrator |
| R2-03 | minor | `mobile/src/domain/__tests__/localDate.test.ts:17-24` | `process.env.TZ = before` stores the string `"undefined"` when TZ was unset, with no `finally`; the Jest worker keeps it for later suites. | Delete the key when `before` is undefined, restore in `finally`. | data-coder |
| R2-04 | minor | `e2e/maestro/subflows/reset.yaml:12-17` | After `openLink matiq://dev/reset` the flow waits for `home.screen`, which is already mounted under the reset route; the wait can pass before the reset starts, and the flow then races the wipe. | Wait for `dev.reset.status` visible, then `home.screen`. | tester |
| R2-05 | minor | `mobile/src/i18n/en.json:102`, `LibraryScreen.tsx:87` | CC BY 4.0 credit is shown without the licence link or a statement that names were changed (both exist in `seed/attribution.json` for the sprint-2 About screen). | Acceptable for sprint 1 (D-A15); make About render `attribution.json` fully before any release. | frontend-coder |
| R2-06 | minor | `mobile/src/repositories/hooks/index.ts:27,30` | `showExtended()` calls `getDb()` synchronously inside `read()`, so a dev reset (db closed, hooks re-run) throws in the effect instead of landing in `error`. `useHome` computes `today` at read time and refreshes only on a table change, so Home left open past midnight keeps yesterday's partition. | Make the read `async`; re-read on AppState `active` or at local midnight. | frontend-coder |
| R2-07 | minor | `docs/adr/0019-database-access-layer-and-bootstrap.md:3` | Status `accepted` with no PO sentence (the other five are `proposed`). | Set `proposed`, or cite the PO ruling that covers F-03/F-08/F-09. | documenter |

No blockers.

## Rulings on the six points

1. Path-guard workaround: `.claude/agents/data-coder.md` (since cc3480c, PO) allows `scripts/taxonomy/`, `data/taxonomy/`, `.github/workflows/` and `mobile/app.json`, so every path in 7555165, 85d2422 and the `app.json` edit (6498c04) is inside the data-coder's current scope. Content audited as normal code: no defect (ci.yml adds converter tsc, seed sync and iOS prebuild per F-26; `app.json` edit also re-flowed `platforms` into multi-line, cosmetic). The guard bypass is a process matter for the PO.
2. Endpoint resolution 84.1 % (1249/1485; 268/2970 endpoints, about 137 anonymous nodes): acceptable deviation. Plan §10 and F-12 define unresolved as edge dropped, node kept, counted; the plan's 95 % clause says tune epsilon and report, which the data-coder did (ADR 0021, arc42 §11). Add the carry-over row (R2-02).
3. Privacy: pass. Key regex-validated before interpolation (`open.ts`), never in errors, `app_meta` (only `db_key_created_at` date, asserted in `seam.test.ts`) or logs; only `console.warn` is a font error message. No `fetch`/URL in app code; new deps `expo-secure-store`, `expo-crypto`, `expo-haptics`, datetimepicker, `@expo-google-fonts/*` (local ttf) and `expo-file-system` (DB file check) carry no analytics or identifiers; `useSQLCipher` and `allowBackup: false` present; iOS backup exclusion deferred (A-16, ADR 0020), acceptable pre-release, a release gate. `/dev/reset` is `__DEV__`-gated in the route and in `_layout.tsx`. The test key is a fixed fake.
4. Licensing: pass. GrappleMap `SOURCE.md` (public domain, sha256, size, commit); grapple-flows `DATA-LICENSE` verbatim with `SOURCE.md` (commit, hashes, changes) and Library footer credit (R2-05 minor); converter is a reimplementation, the open PRs are cited for format only.
5. R-26 as built: matches A-7. With one planned session today, Quick log opens it with planned focuses ticked (`state.ts:197`), then Save: 2 taps. Otherwise Quick log, last-session chip, Save: 3 taps.
6. Removed assertions: moves, not weakening. `home.title`/`db.ready`/`app.migrationError` and `__tests__/app/index.test.tsx` are replaced by the bootstrap gate (`layout.test.tsx`, `bootstrap.title.*`, `home.test.tsx`); the `app_meta` migration assertions are generalised in `migrations.test.ts` (per-table columns, CHECK, unique, idempotence, `app_meta.key` unique at :322); the Maestro `assertVisible` pair is replaced by `smoke/launch.yaml`.

REVIEW PASSED
No blockers: R2-01 (major) should land before the next build; R2-02…R2-07 are minors.
