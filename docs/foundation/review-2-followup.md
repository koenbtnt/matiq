# foundation — review 2 follow-up (reviewer-code)

Themis · 2026-11-01 · HEAD 8b6f286 · scope: changes for R2-01, R2-03, R2-04, R2-06, R2-07 only. R2-02 and R2-05 go to carry-over at close-out (orchestrator).

| id | status | evidence |
|---|---|---|
| R2-01 | closed | d11ef27: `fonts.ts` imports the six faces from subpaths; each subpath ships `index.js` + ttf; `fontMap` keys unchanged. Only `fonts.ts` changed, so token/doctor rows at d11ef27 stay valid. |
| R2-03 | closed | dfa6122: `setEnv` restores in a returned function and deletes the key when it was unset; used in `localDate`, `settingsRank`, `readHooks` tests. |
| R2-06 | closed | dfa6122: `showExtended` is async and read inside the read; `useLiveRead` wraps the read in `Promise.resolve().then`, so a synchronous throw lands in `error`; `useHome` depends on `useLocalDate` (minute interval plus AppState `active`, cleaned up on unmount). No contract change (hook is internal; signatures unchanged). New tests cover each path (Jest 932 per data-coder at dfa6122). |
| R2-04 | closed | 8460954: waits for `dev.reset.status` visible, then not visible, then `home.screen`. Ruling on the extra wait: acceptable. The not-visible step is what proves completion (status unmounts on `router.replace('/')`). Residual risk, minor: if the reset finished inside one poll the visible wait would time out; a 38k-line reseed makes that unlikely. Not run (Maestro unavailable). |
| R2-07 | closed | d16db35: ADR 0019 `proposed`, README, arc42 §9 and docs-report aligned. |

Regressions: none found. `useLiveRead` now defers each read one microtask (no behavioural change; generation guard still applies). Loading flash at midnight on Home when `today` changes is expected. Verification accepted from verify.md (tsc 0, Jest 29 suites / 932 tests at dfa6122; adherence 0, expo-doctor 20/20 at d11ef27); not re-run.

REVIEW PASSED
All five findings closed, no new defects.
