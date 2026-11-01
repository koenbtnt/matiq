# progress-settings — test report

- **Sha tested:** 9ee80da (flows fixed in the working tree, committed with this report)
- **Environment:** iPhone 18 Pro (921BC6C6-73E5-4BB2-A88F-CA9D7BFABD51), iOS 27.2, dev-client build at 169fe7e, Metro on 8082, Maestro via `~/.maestro/bin`
- **Provenance:** tsc, Jest (1722, both zones), tokens, adherence, expo-doctor, run:ios, smoke, xattr accepted from `verify.md` (frontend-coder @ 169fe7e); not re-run.

## Commands

| Command | Result |
|---|---|
| `maestro test -e METRO_URL=http://localhost:8082 e2e/maestro` (run 1) | 5/13 passed |
| same (run 2, after flow fixes) | 10/13 passed |
| single-flow re-runs after fixes | settings-weights 1/1; progress-states 0/1; settings-rank-theme 0/1 |

## Final per-flow result

| Flow | Result |
|---|---|
| smoke/launch | 1/1 |
| features/browse-library | 1/1 |
| features/log-session | 1/1 |
| features/plan-then-log | 1/1 |
| features/technique-resources | 1/1 |
| features/library-edit | 1/1 |
| features/library-merge | 1/1 |
| features/progress-panels | 1/1 |
| features/settings-weights | 1/1 |
| features/settings-about | 1/1 |
| regression/back-label | 1/1 |
| features/progress-states | 0/1, app defect A-1 |
| features/settings-rank-theme | 0/1, app defect A-2 |

Total 11/13. Phase 3 whole-workspace run was done (run 2); the final per-flow state combines run 2 with the single-flow re-runs of the flows fixed afterwards (weights).

## Flow defects fixed (all mine)

- Preserved scroll position across screens: `scrollUntilVisible` direction UP (settings-weights, progress-panels); scroll to `profile.rankHistory`, `rank.stripes.more`.
- `checked:` is not exposed on iOS checkboxes (value reads "checkbox, checked"): technique-resources asserts `text: "checkbox, checked"`.
- Dev-client floating tools button swallows taps on top-right controls (Library plus): new subflow `subflows/hide-devtools-button.yaml` drags it away.
- Keyboard covers the save/merge buttons in the edit sheet: `pressKey: Enter` before tapping them.
- Delete button sits below the fold: scroll + swipe before tapping `libraryEdit.delete`; the undo of a delete has no toast by design, so the flow asserts the row returns.
- Position row matched by id + text because the row is one accessibility element (library-edit).
- back-label: search "mount" first, the row was out of the viewport.
- progress-states: the half-height why sheet needs a swipe inside the sheet, not `scrollUntilVisible` from the screen centre.
- seed-progress-states: rate SIDE before adding the second focus (the sheet scrolls the first card away).

## App defects (route to frontend-coder)

- **A-1** `mobile/src/components/SheetChrome` (used by `ProgressWhySheet`, `SetRankSheet`, library-edit): scrolled or initial sheet content draws over the header; "Close" / "Cancel" overlap content text and `why.close` tap does not dismiss the sheet. Expected: header opaque, above the content, tappable. Repro: Progress, tap a row, scroll the sheet, tap Close. Blocks `progress-states`.
- **A-2** `mobile/src/features/rank/SetRankSheet.tsx`: on the KIDS scale (13 belts) `rank.save` is not in the accessibility hierarchy; the screen shows "Awarded on" and no action bar. Expected: the Save bar pinned and tappable. Repro: Profile, Rank history, scale Kids, Add, pick Grey, scroll. Blocks `settings-rank-theme` (the Home kids-scale and dark-theme legs never ran).

Not reached (blocked by A-2): `profile.theme.DARK` `selected: true` assertion probably has the same iOS state-exposure issue as `checked:`; expect the value text "radio, selected".

## Contract coverage audit

Not performed this run (time spent on the flows). Open item for the next tester pass.
