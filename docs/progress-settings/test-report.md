# progress-settings — test report

- **Sha tested:** round 1 at 9ee80da; round 2 at e2ed248 (frontend fix 0e8d4db for A-1 and A-2 included, JS only, served by Metro on 8082)
- **Environment:** iPhone 18 Pro (921BC6C6-73E5-4BB2-A88F-CA9D7BFABD51), iOS 27.2, dev-client build at 169fe7e, Metro on 8082, Maestro via `~/.maestro/bin`
- **Provenance:** tsc, Jest, tokens, adherence, expo-doctor, run:ios, smoke, xattr accepted from `verify.md` (frontend-coder @ 169fe7e and @ 0e8d4db); not re-run.

## Commands

| Command | Result |
|---|---|
| `maestro test -e METRO_URL=http://localhost:8082 e2e/maestro` (round 1, run 1, unfixed flows) | 5/13 passed |
| same (round 1, run 2, after flow fixes; the phase 3 whole-workspace run) | 10/13 passed |
| single-flow `settings-weights` after seed-subflow reorder (round 1) | 1/1 |
| round 2 single-flow `progress-states` (after A-1 fix and seed scroll) | 1/1 |
| round 2 single-flow `settings-rank-theme` (after A-2 fix and a scroll to `profile.theme.DARK`) | 1/1 |
| round 2 single-flow `settings-weights` (re-check after the seed-subflow change) | 1/1 |

Note: `settings-weights` has not passed inside a whole-workspace run since its seed fix; it passed only in single-flow runs. `progress-states` and `settings-rank-theme` likewise passed only in single-flow runs. The whole suite was not re-run, by instruction.

## Final per-flow result: 13/13

| Flow | Result |
|---|---|
| smoke/launch | 1/1 (whole run) |
| features/browse-library | 1/1 (whole run) |
| features/log-session | 1/1 (whole run) |
| features/plan-then-log | 1/1 (whole run) |
| features/technique-resources | 1/1 (whole run) |
| features/library-edit | 1/1 (whole run) |
| features/library-merge | 1/1 (whole run) |
| features/progress-panels | 1/1 (whole run) |
| features/settings-about | 1/1 (whole run) |
| regression/back-label | 1/1 (whole run) |
| features/settings-weights | 1/1 (single-flow) |
| features/progress-states | 1/1 (single-flow, round 2) |
| features/settings-rank-theme | 1/1 (single-flow, round 2) |

## Flow defects fixed (all mine)

- Preserved scroll position across screens: `scrollUntilVisible` direction UP (settings-weights, progress-panels); scroll to `profile.rankHistory`, `rank.stripes.more`, `rank.save`, `profile.theme.DARK`.
- `checked:` is not exposed on iOS checkboxes (value reads "checkbox, checked"): technique-resources asserts `text: "checkbox, checked"`.
- The dev-client floating tools button swallows taps on top-right controls: new subflow `subflows/hide-devtools-button.yaml` drags it away.
- The keyboard covers the save and merge buttons in the edit sheet: `pressKey: Enter` before tapping them.
- The delete button sits below the fold: scroll and swipe first. A delete undo shows no toast by design, so library-edit asserts the row returns.
- library-edit matches the position row by id plus text (one accessibility element); back-label searches "mount" first.
- progress-states swipes inside the half-height sheet; seed-progress-states rates the first focus before adding the second and scrolls back to the search field.

## App defects found in round 1 (both fixed in 0e8d4db, verified by the round-2 passes)

- A-1 sheet header overlapped by content, `why.close` unreachable (progress-states).
- A-2 `rank.save` absent on the KIDS scale (settings-rank-theme).

## Contract coverage audit

Done during authoring: every block in `data-contracts.md` has a data-coder Jest test; no gaps (result copied from the authoring pass, not repeated this run).
