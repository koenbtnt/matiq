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
