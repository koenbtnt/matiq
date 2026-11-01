# foundation — test report (tester, authoring phase)

Sha at authoring: 2886ef9 · date 2026-11-01 · simulator: none (no run) · **No Maestro run was performed.** Maestro and CocoaPods are not installed (PO action: install Maestro per `docs/agent-tooling/plan.md`; `brew install cocoapods` for `npx expo run:ios`). Every flow is **INFRA UNAVAILABLE**; nothing below is a pass.

## Flows authored (`e2e/maestro/`)
Isolation: each flow runs `subflows/reset.yaml` (outside the `flows/**` glob): `launchApp clearState` → wait `home.screen` → `openLink matiq://dev/reset` (design §4.2.3, F-25) → wait `home.screen`. Seed ids (A-29) come from `mobile/src/db/seed/*.json` via `env:`.

| file | purpose | testIDs used | run status |
|---|---|---|---|
| flows/smoke/launch.yaml | launch, splash → Home, three tabs, Library reachable (replaces `app-launches.yaml`, removed: it used `home.title`/`db.ready`, not in design §7) | home.screen, tabs.home, tabs.log, tabs.library, home.quickLog, home.recent.empty, library.screen, bootstrap.error | INFRA UNAVAILABLE |
| flows/features/log-session.yaml | Path C (Home quick log → search "mount" → pick); disabled-save reason without actual focus; rate 4 + needs-work; save; Home reflects; Undo save, Undo delete (NF-05); session detail; Path B (3 taps: tabs.log → quick-add → save) | home.quickLog, log.sheet, log.save, log.save.reason, log.search.input, log.search.result.<id>, log.focus.<id>(.rating.4, .needsWork), log.quickAdd.<id>, toast.message, toast.undo, home.recent.*, home.recent.empty, session.screen, session.focus.<id>, tabs.log | INFRA UNAVAILABLE |
| flows/features/plan-then-log.yaml | plan 2 focuses from Home empty card → Home shows `home.next` → quick log targets the planned session (2-tap path A) → un-tick one focus ("Planned · not trained") → detail shows planned vs actual | home.planEmpty.action, home.next, home.quickLog, log.sheet, log.search.*, log.focus.<id>(.trained, .status), log.save, toast.message, home.recent.*, session.screen, session.focus.<id>(.status) | INFRA UNAVAILABLE |
| flows/features/browse-library.yaml | alias search ("knee mount" → Knee on belly), no-match empty state, clear, open position, technique listed, Techniques segment | tabs.library, library.screen, library.segment.positions/.techniques, library.search.input/.clear, library.position.<id>, library.empty, position.screen, position.technique.<id>, library.technique.<id> | INFRA UNAVAILABLE |

Not authored (design §7 lists them; outside this assignment): `session-delete-undo` (delete path; undo-of-save is covered in log-session), `set-rank`. Core-vs-extended toggle: no UI in sprint 1 (setting read-only, plan §10) — not testable.
Copy asserted (copy is the thing under test): "Planned · not trained" (en; design §7 notes). Dynamic ids use `id: "home.recent\\..*"` regex or seed-id `env`.

## testID gaps
- Every testID used by a flow exists in design §7 (checked by grep). None missing.
- Not yet verified against the implementation (frontend phase B in progress): `app/(tabs)/_layout.tsx` and `app/dev/reset.tsx` contain no `tabs.*` / `dev.reset.status` testID yet. Flows will fail on those until added.
- Design nit: `log.focus.<refId>.trained` un-tick in plan-then-log assumes the toggle is shown for planned focuses in log mode (design §4.3.3).

## Contract-coverage audit (`data-contracts.md` vs data-coder Jest at HEAD)
Covered (grep of function name in `mobile/src/**/__tests__`): sessions.create/log/softDelete/undoDelete/skip/undoSkip/getDetail/home/quickLogTarget (sessions.test.ts, domainPure.test.ts); sessionTypes, rank.add/current/history, settings.get/set/all, algorithmParams (settingsRank.test.ts); taxonomy.searchFocuses/listPositions/getPosition/listSubjects/listTechniques/importRelease (taxonomy.test.ts, seedShipped.test.ts, seed.test.ts); ensureSeeded (seed.test.ts, seam.test.ts); rounds.upsert/submissions.upsert/deriveAggregates (sessions.test.ts, domainPure.test.ts); resetDatabase + codes DB_KEY_MISSING_FOR_EXISTING_DB/DB_KEY_REJECTED/DB_KEY_UNAVAILABLE/DB_RESET_FAILED (seam.test.ts); new codes SESSION_START_INVALID, ROUND_NO_INVALID (validateLog.test.ts).

Gaps (name appears in no data-coder test):
| contract item | file (expected) | missing test |
|---|---|---|
| `bootstrapDatabase(overrides?)` returns `{ok:true,db}`/`{ok:false,code}` | src/db/__tests__/ | direct test of the function (only error codes exercised via seam.test.ts) |
| `useDatabaseBootstrap()` (loading → ready/error, `retry()`) | src/repositories/hooks/__tests__/ | none |
| `DB_NOT_OPEN` from `getDb()` before bootstrap | src/db/__tests__/ | none |
| Live hooks useHome, useSession, useSessionTypes, useFocusSearch, useLibraryPositions, usePosition, useSubjects, useTechniqueSearch, useSetting, useCurrentRank | src/repositories/hooks/__tests__/ | only generic `useLiveRead` is tested; the per-hook wrappers (read mapping, arguments) are not |
Defects against data-coder: the four rows above. (tsc/Jest status not re-run; accepted from verify.md @ 83e6f12.)

## Verification provenance
YAML parse: run by me. tsc, Jest, token checks, expo-doctor: accepted from verify.md (data-coder @ 83e6f12, frontend-coder A @ 5af8e0f), not re-run. Maestro: not run.

## Run phase (2026-11-01, HEAD cc48e42) - static check only, no Maestro run
Maestro and CocoaPods are not installed: every flow is **INFRA UNAVAILABLE**, none is recorded as passed.

| flow | status | defects |
|---|---|---|
| smoke/launch.yaml | INFRA UNAVAILABLE | none (static) |
| features/log-session.yaml | INFRA UNAVAILABLE | none (static) |
| features/plan-then-log.yaml | INFRA UNAVAILABLE | none (static) |
| features/browse-library.yaml | INFRA UNAVAILABLE | none (static) |

- Static testID check at HEAD (grep of `mobile/app`, `mobile/src`, excluding tests/mocks): every testID the four flows reference exists in the implementation, including the earlier-flagged `tabs.home`/`tabs.library` (src/components/MainTabBar.tsx), `tabs.log` (MainTabBar.tsx:40) and `dev.reset.status` (src/features/bootstrap/DevResetScreen.tsx:37). Dynamic ids confirmed: `home.recent.<id>`, `log.search.result.<refId>`, `log.quickAdd.<refId>`, `log.focus.<id>.{status,trained,needsWork,rating.n}`, `session.focus.<refId>(.status)`, `library.position.<id>`, `library.technique.<id>`, `position.technique.<id>`. **No missing testIDs.** This proves presence only, not that elements are reachable or behave as the flows assume.
- Deep link: `matiq://dev/reset` matches `"scheme": "matiq"` in `mobile/app.json`; route `dev/reset` registered in `mobile/app/_layout.tsx`.
- Contract-coverage audit: the four gaps (bootstrapDatabase, useDatabaseBootstrap, DB_NOT_OPEN, per-hook wrappers) are **in progress** (data-coder); not re-audited.

## R2-04 fix (f7e77c0)
`subflows/reset.yaml` no longer relies on `home.screen` after `openLink matiq://dev/reset` (it is already mounted under the reset route): it now waits for `dev.reset.status` visible, then not visible, then `home.screen`. YAML parse ok; Maestro run still INFRA UNAVAILABLE. Caveat: if the reset finishes before the first poll, the `dev.reset.status` visible wait can time out (flaky-fast, not a false pass).

## First device run (2026-11-01, main session) — 4/4 flows passed

Environment: iPhone 18 Pro simulator (iOS 27.2), dev-client build made by the PO with `npx expo run:ios` (CocoaPods 1.17.0, `expo.sqlite.useSQLCipher=true`), Metro on port 8082 (8081 was held by another project's Metro), Maestro 2.12.0. Command: `maestro test -e METRO_URL=http://localhost:8082 e2e/maestro` (the workspace directory holding `config.yaml`). Code at HEAD e9080c7 (app sources unchanged since dfa6122); the flow fixes below are committed together with this report.

| flow | result | duration |
|---|---|---|
| smoke/launch.yaml | PASSED | 33 s |
| features/browse-library.yaml | PASSED | 50 s |
| features/log-session.yaml | PASSED | 48 s |
| features/plan-then-log.yaml | PASSED | 46 s |

4/4 passed in 2 m 58 s (JUnit: tests=4, failures=0). Nine runs were needed to get there; every fix is in the flows, none in the app:

- `subflows/reset.yaml`: after `clearState` the dev client cold-starts in the Expo launcher, so the subflow opens `matiq://expo-development-client/?url=${METRO_URL}` (default `http://localhost:8081` inside the expression, because a flow-file `env:` block beats the CLI `-e`), answers iOS's "Open in matIQ?" prompt, first drains stale prompts left by earlier runs (each `simctl openurl` queues one; a stale one answered "Open" loaded another project's bundle), dismisses the developer-menu onboarding sheet ("Continue", then its `xmark`), and no longer waits for `dev.reset.status` to appear — the wipe + reseed finishes in under a second (database file mtimes), so it waits for the status to be gone and for Home.
- `subflows/back.yaml` (new): Maestro's `back` is Android-only; on iOS it taps the header `BackButton`. Used by browse-library and log-session, which had stayed on their detail screens.
- `features/browse-library.yaml`: the search query survives the segment switch (design §4.6.1) and "knee mount" is a position alias, so the techniques segment shows `library.empty`; the flow now asserts that, clears, and searches "armbar from knee".
- Run commands corrected everywhere (`CLAUDE.md`, root `e2e:ios`, `.claude/rules/e2e.md`, `tester.md`): `e2e/maestro`, not `e2e/maestro/flows`.

Observed app defect: the session detail header shows "(tabs)" as the iOS back label (carry-over CO-42). Facts measured on this run are in `docs/stack-notes.md` (2026-11-01 section).
