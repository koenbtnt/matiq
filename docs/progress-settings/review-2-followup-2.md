# progress-settings — review 2 follow-up 2 (6a94855..9cb3968)

Scope: only that diff; nothing re-run. Accepted: frontend-coder @ 7e59b4c (tsc 0, Jest 1740 both zones, adherence 0, simulator merge→undo with keyboard up 5/5); tester `library-merge` 3/3 unchanged flow then 2/2 after F-03; whole workspace @ 6c3fcb3 13/13 in one run (9cb3968). Only `Toast.tsx`, its test, the flow and docs changed; no schema, domain or privacy surface.

| id | ruling |
|---|---|
| F-01 | **Closed.** The 13/13 whole-suite pass at 6c3fcb3 meets the PO gate (CO-47). Provenance in `verify.md`/`test-report.md` is consistent, and the code after 6c3fcb3 is docs only. |
| F-02 | **Closed.** `useKeyboardHeight` (`Toast.tsx`) subscribes to will/did show/hide per platform and cleans up. The test drives show and hide and asserts `bottom >= 336` then restored. 5/5 on the simulator and the unchanged flow 3/3 corroborate it. Note: an explicit `bottomOffset` still overrides the keyboard; no caller passes one today (grep of `app/` and `src/`), so it is a latent trap only (N). |
| F-03 | **Closed.** `assertVisible toast.message` before the undo plus an explicit comment, with no `hideKeyboard`, keeps the flow able to catch an F-02 regression. Correct choice. |
| F-04 | **Still open.** `docs/carry-over.md` is not in this diff and CO-46 (line 50) is unchanged. Close-out edit needed (documenter/orchestrator). |

**Android offset (frontend-coder's flag): yes, it belongs in CO-46**, same class as the other open item (keyboard avoidance on Android is unverified for `SheetFrame` too). Record both: Android has no emulator check (CO-03), and with `adjustResize` the window shrinks, so `keyboardDidShow` height plus a shrunken window may double count the lift. Verify on an emulator or EAS build, then decide `adjustPan` vs ignoring the event on Android. Not a blocker for the iOS-first sprint; no release before CO-46 closes.

REVIEW PASSED
Subject to the F-04 carry-over edit (CO-46 widened to the Android toast and sheet keyboard offset) landing at close-out.
