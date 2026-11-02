# progress-settings — review 2 follow-up (8735431..48b3154)

Scope: only the diff above. No builds re-run; verify rows accepted (frontend-coder @ 5087903: tsc 0, Jest 1739 in both zones, adherence 0, simulator 10/10; tester @ 224804c: 12/13). The diff touches no schema, domain or privacy surface.

## Checked, no defect
- **SheetFrame** (`SheetChrome.tsx:60-72`): one `KeyboardAvoidingView` per sheet, `automaticallyAdjustKeyboardInsets` removed from `LibraryEditSheet`, `ResourceEditSheet` and `LogForm`. `ResourceEditSheet` and `LogForm` gain `SheetBody` clipping. Tokens only (`c.bgSurface`). The 10/10 simulator pass and a green 1739 Jest run support the fix. Android keeps `behavior` undefined; Android is not smoke-tested (note for CO-46).
- **sheet-layout.test.tsx**: structural and meaningful, covering three contracts (no native inset adjust, clipped body, KAV root). Not order dependent. Limit: Jest has no native layout, so it guards regression of the mechanism, not of the blank render itself; the simulator row carries that proof.
- **technique-resources.yaml**: `scrollUntilVisible centerElement` on `resourceEdit.delete` is a reasonable flow fix (the tester run passed it at 224804c).
- **Item 2, fixture change** (`progressFixtures.ts:108-111`): it hides no domain bug. The fixture now mirrors `domain/progression/panels/consistency.ts:50-53`, and plan H7 (`panels.test.ts:61-64`) already pins the rule: an empty current week starts the streak from the previous week. The domain is untouched in this diff, and the old fixture was the divergent test double (it broke on Monday 2026-11-02). Residual: the fixture is date-dependent by construction; N-level only.

## Item 1, library-merge failure: undetermined, and not excludable as an app defect
Evidence: `toast.undo` was found and tapped, yet "Merge undone" never appeared. The screenshot shows the Library search focused with the keyboard up. `ToastHost` positions the toast from the tab bar (`Toast.tsx:91`), so it is not keyboard aware. A tap on coordinates under an open keyboard lands on a key, not on the toast. This is the CO-46 class, and it is reachable for a real user (search for a duplicate, merge, the keyboard is still up). R-26 requires that destructive actions be undoable, so an unreachable undo is **B if reproduced**. Cheap discriminator for the tester: re-run `library-merge` alone with the keyboard dismissed (`hideKeyboard`) before `libraryEdit.merge.confirm`; if it then passes, the toast needs a keyboard-aware offset (frontend-coder).

## Findings
| id | sev | owner | file:line | defect |
|---|---|---|---|---|
| F-01 | B (gate) | tester then PO | `docs/progress-settings/test-report.md` (final run) | The PO gate for PR #7 (one green whole-suite pass, CO-47) is unmet: 12/13, and the one failure is undiagnosed. |
| F-02 | M, B if reproduced, **PO decision** | frontend-coder | `mobile/src/components/Toast.tsx:91` | The toast is not keyboard aware, so the merge undo may be hidden behind the search keyboard. Make `ToastHost` lift above the keyboard (or dismiss the keyboard on merge confirm). |
| F-03 | m | tester | `e2e/maestro/flows/features/library-merge.yaml:113-125` | The flow does not control keyboard state before `libraryEdit.merge.confirm`; add `hideKeyboard` once F-02 is settled, so the flow tests the app rather than the keyboard. |
| F-04 | m | documenter | `docs/carry-over.md` CO-46 | Extend the row to cover the toast layer (and Android keyboard behaviour of `SheetFrame`). |

REVIEW FAILED
Defect list: F-01 (gate unmet) and F-02 (undo possibly unreachable). The fix and the fixture change themselves are clean; one targeted flow run settles whether F-02 is real.
